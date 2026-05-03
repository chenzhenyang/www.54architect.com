---
title: 我是如何在 OpenClaw 之上构建多智能体系统的
tags:
- OpenClaw
- 多智能体
- AI Agent
- A2A 协议
categories:
- Technology
lastUpdated: 2026-04-17
origin_title: This is how I've learned to create multi-agent systems on top of OpenClaw
author: Reddit user
original_url: https://www.reddit.com/r/openclaw/comments/1r2euvp/this_is_how_ive_learned_to_create_multiagent/
---
OpenClaw 实际上内置了多智能体支持。根据你要做的事情，可以分为四个层级：

## 层级 1. 多个持久化智能体（内置）

你可以在配置中定义多个永久智能体，每个智能体都有自己的工作区、系统提示词、模型、工具，甚至沙箱环境。然后使用绑定（bindings）根据频道、账户或聊天 ID 将对话路由到正确的智能体：

```yaml
agents:
  list:
    - id: researcher
      default: true
      workspace: ~/.openclaw/workspace-research
    - id: coder
      workspace: ~/.openclaw/workspace-code
    - id: writer
      workspace: ~/.openclaw/workspace-writing

bindings:
  - agentId: researcher
    match: { channel: telegram, accountId: research-bot }
  - agentId: coder
    match: { channel: discord, guildId: "123456" }
```

每个智能体都是完全隔离的——独立的会话历史、模型配置、工具权限，甚至 Docker 沙箱。

## 层级 2. 智能体间通信（内置后台工作器）

在配置中启用 `tools.agentToAgent`，你的智能体就可以通过 `sessions_send` 相互通信。它们会进行乒乓球式的对话（默认最多 5 轮），并可以将结果公告回频道。这是最接近"协调器委派给专家"模式的 OpenClaw 原生方案：

```yaml
tools:
  agentToAgent:
    enabled: true
    allow: ["researcher", "coder", "writer"]
```

你的协调器智能体还可以通过 `sessions_spawn` 生成后台子智能体，这些子智能体独立运行任务并在完成后汇报结果。通过 `subagents.allowAgents`，你可以让一个智能体以其他智能体 ID 的名义生成任务。

## 层级 3：跨智能体委派（更深层嵌套的变通方案）

你可以通过让协调器主智能体使用 `sessions_send`（智能体间消息传递）委派给同级主智能体，来突破单级限制。每个同级智能体又可以生成自己的子智能体。这样就形成了一个 3 层架构：

```
Orchestrator（主智能体）
 ├─ sessions_send → Specialist A（同级主智能体）
 │   ├─ sessions_spawn → subagent A1
 │   └─ sessions_spawn → subagent A2
 └─ sessions_send → Specialist B（同级主智能体）
     ├─ sessions_spawn → subagent B1
     └─ sessions_spawn → subagent B2
```

对应的配置：

```yaml
agents:
  list:
    - id: orchestrator
      default: true
      subagents:
        allowAgents: ["researcher", "coder"]
    - id: researcher
      workspace: ~/.openclaw/workspace-research
    - id: coder
      workspace: ~/.openclaw/workspace-code

tools:
  agentToAgent:
    enabled: true
    allow: ["orchestrator", "researcher", "coder"]
```

其中 `subagents.allowAgents` 控制哪些智能体可以通过 `sessions_spawn` 被跨智能体生成，而 `tools.agentToAgent` 启用主智能体之间的 `sessions_send` 乒乓球式消息传递（默认最多 5 轮，可通过 `agentToAgent.maxPingPongTurns` 配置）。

所有这些都无需 Docker。它们全部运行在单个网关节点进程中。你只需在 `~/.openclaw/config.yaml` 中配置即可。通过 `openclaw agents add researcher` 命令添加智能体。

## 层级 4. 基于 [A2A 协议](https://a2a-protocol.org/) 的真正多智能体编排（独立方案）

如果你想超越内置功能，比如拥有一个外部协调器，能够智能地将任务路由到专业智能体、执行步骤后审查、重试失败任务并综合结果。为此，我构建了 [a2a-adapter](https://github.com/hybroai/a2a-adapter)。

它只需几行 Python 代码就能将任何 OpenClaw 智能体包装成标准的 A2A 协议服务器：

```python
from a2a_adapter import load_a2a_agent, serve_agent

adapter = await load_a2a_agent({
    "adapter": "openclaw",
    "agent_id": "researcher",
    "thinking": "low",
    "async_mode": True,
})
serve_agent(agent_card=agent_card, adapter=adapter, port=9001)
```

为每个智能体运行一个这样的服务（不同端口），现在每个智能体都使用标准的 HTTP 协议进行通信。然后你的协调器——可以是一个 LangGraph 工作流、另一个 A2A 智能体，或者带有 Supervisor 模式的多智能体后端——会将任务路由到正确的智能体，在每个步骤后审查结果，并将所有内容综合成一个连贯的响应。

[a2a-adapter](https://github.com/hybroai/a2a-adapter) 还支持 n8n、CrewAI、LangChain 和 LangGraph 智能体，使用相同的接口，因此你可以混合搭配各种框架。你的 OpenClaw 编码智能体可以与 CrewAI 研究团队和 n8n 工作流智能体协作，它们都使用相同的协议。所有这些都不需要 Docker Compose——内置的多智能体在单个网关节点进程中运行。A2A 方式可以是本地不同端口上运行的 Python 进程，也可以是完全独立运行在远程的智能体。

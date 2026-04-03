---
title: 教 AI Agent 互相交流——OpenClaw 中的跨 Agent 通信
description: 详解 OpenClaw 中多 Agent 通信机制，包括 MCP 协议、消息格式和实际应用场景
origin_title: Teaching AI Agents to Talk to Each Other — Inter-Agent Communication in OpenClaw
author: Chen Yang
tags:
  - AI
  - Agent
  - OpenClaw
  - MCP
categories:
  - Technology
lastUpdated: 2026-04-03
original_url: https://medium.com/@chen.yang_50796/teaching-ai-agents-to-talk-to-each-other-inter-agent-communication-in-openclaw-736e60310005
---

一个关于构建无需人工干预即可协调的 AI Agent 团队的实战故事。

## 挑战

一个 OpenClaw 实例。多个 AI Agent——产品负责人（Todd）、业务分析师（Riley）、后端开发工程师（Alex）等等。每个 Agent 都有自己的 Discord 机器人、自己的工作空间、自己的个性。

它们都能和我对话，但彼此之间却无法交流。

目标：让 Agent 们直接协调。Todd 给 Alex 分配任务，Riley 向团队发送设计规范。不需要人类在机器人之间充当传话筒。

## "agentId is not allowed"

第一次尝试很直接：使用 sessions_spawn 从我的会话向 Todd 发送任务。

```
sessions_spawn(agentId="todd", task="Say hello to Master on Discord")
```

返回结果："agentId is not allowed for sessions_spawn (allowed: none)"

OpenClaw 默认启用了 Agent 隔离。一个 Agent 不能随意进入另一个 Agent 的会话并让它们做事。这是一个特性，而不是缺陷——但这意味着我们需要显式配置 Agent 间通信。

## 深入文档

OpenClaw 文档揭示了两种 Agent 通信机制：

1. **sessions_spawn** —— 向其他 Agent 生成任务（它们在隔离的子代理会话中运行，完成后宣布结果）
2. **sessions_send** —— Agent 之间的直接消息传递（同步来回对话）

两者都需要配置，都不能开箱即用。

要让 sessions_spawn  targeting 另一个 Agent，需要：

```json
{
 "agents": {
 "list": [{
 "id": "main",
 "subagents": {
 "allowAgents": ["todd", "riley", "alex"]
 }
 }]
 }
}
```

要让 sessions_send 在 Agent 之间工作，需要：

```json
{
 "tools": {
 "agentToAgent": {
 "enabled": true,
 "allow": ["main", "todd", "riley", "alex"]
 }
 }
}
```

agentToAgent 设置是关键。它默认禁用——出于安全考虑需要显式启用。

## 首次接触

更新配置后，我们再次尝试：

```python
sessions_send(
 sessionKey="agent:todd:discord:channel:1471456455025623211",
 message="Hey Todd — Master wants you to say hello on Discord"
)
```

返回结果：

```json
{
 "status": "ok",
 "reply": "Done — waved at Master in #megan. 👋"
}
```

Todd 收到了消息，处理了它，并做出了回应——全程无需人工干预。Agent 们终于能够对话了。

## 构建团队网络

模式确立后，我们扩展了网络：

- 为所有团队成员启用 Agent 到 Agent 通信：

```json
{
 "tools": {
 "agentToAgent": {
 "enabled": true,
 "allow": ["main", "todd", "riley", "alex"]
 }
 }
}
```

- 为每个 Agent 的 Discord 账号设置共享频道访问权限：

```json
{
 "channels": {
 "discord": {
 "accounts": {
 "todd": {
 "guilds": {
 "GUILD_ID": {
 "channels": {
 "GENERAL_CHANNEL": { "allow": true },
 "TODDS_CHANNEL": { "allow": true }
 }
 }
 }
 }
 }
 }
 }
}
```

- 添加绑定（bindings）将消息路由到正确的 Agent：

```json
{
 "bindings": [
 { "agentId": "todd", "match": { "channel": "discord", "accountId": "todd" } },
 { "agentId": "riley", "match": { "channel": "discord", "accountId": "riley" } },
 { "agentId": "alex", "match": { "channel": "discord", "accountId": "alex" } }
 ]
}
```

现在任何 Agent 都可以通过简单的 sessions_send 调用联系任何其他 Agent。

## 协调测试

是时候测试真正的协调了。我在频道里问了一个问题：

"告诉大家私信我。"

我的 Agent（Megan）使用 sessions_send 同时联系 Todd、Riley 和 Alex：

```python
sessions_send(sessionKey="agent:todd:...", message="DM Master...")
sessions_send(sessionKey="agent:riley:...", message="DM Master...")
sessions_send(sessionKey="agent:alex:...", message="DM Master...")
```

Riley 和 Alex 没有 Master 的 Discord 用户 ID。但它们没有静默失败，而是询问：

"我需要 YC 的 Discord 用户 ID 才能发送私信…"

于是 Megan 跟进提供了 ID。Riley 将其保存到 USER.md 以供将来参考。Alex 立即发送了私信。

三个 Agent 通过中间人协调，解决了任何一个单独 Agent 都无法解决的问题。无需人类在窗口之间复制粘贴。

## 私信身份危机

出现了一个问题：所有私信都显示来自"Megan"——即使是 Todd 或 Alex 发送的。

问题在于：message 工具默认使用可用的任何账号，而所有 Agent 都可以访问"默认"账号（Megan 的账号）来发送私信。

解决方案分为两部分：

- 为每个 Agent 的账号启用私信功能：

```json
{
 "accounts": {
 "todd": {
 "dm": {
 "enabled": true,
 "policy": "open",
 "allowFrom": ["*"]
 }
 }
 }
}
```

- Agent 在发送时指定自己的 accountId：

```python
message(action="send", accountId="todd", target="user:123...", message="Hi!")
```

此后，来自 Todd 的私信出现在 Todd 机器人的独立线程中。Riley 的来自 Riley 的机器人。每个 Agent 都有自己的身份，即使在私信中也是如此。

## 乒乓协议（Ping-Pong Protocol）

一个有趣的发现：sessions_send 支持回复循环。在初始消息之后，OpenClaw 可以运行额外的回合，让 Agent 相互回应。

最大回合数由 session.agentToAgent.maxPingPongTurns 控制（0-5，默认 5）。要停止循环，Agent 回复精确的 REPLY_SKIP。

这使得 Agent 之间能够进行真正的对话——而不仅仅是发后即忘的消息。Todd 可以向 Riley 询问澄清，Riley 可以回应，交流自然完成。

## 最终配置

以下是一个工作的多 Agent 通信配置示例：

```json
{
 "agents": {
 "list": [
 { "id": "main" },
 {
 "id": "todd",
 "subagents": {
 "allowAgents": ["riley", "alex", "casey", "jordan", "quinn"]
 }
 },
 { "id": "riley" },
 { "id": "alex" }
 ]
 }, "tools": {
 "agentToAgent": {
 "enabled": true,
 "allow": ["main", "todd", "riley", "alex"]
 }
 },
 "bindings": [
 { "agentId": "todd", "match": { "channel": "discord", "accountId": "todd" } },
 { "agentId": "riley", "match": { "channel": "discord", "accountId": "riley" } },
 { "agentId": "alex", "match": { "channel": "discord", "accountId": "alex" } }
 ],
 "channels": {
 "discord": {
 "accounts": {
 "todd": {
 "token": "TODD_BOT_TOKEN",
 "dm": { "enabled": true, "policy": "open", "allowFrom": ["*"] },
 "guilds": {
 "GUILD_ID": {
 "channels": {
 "GENERAL": { "allow": true },
 "TODD_CHANNEL": { "allow": true }
 }
 }
 }
 }
 }
 }
 }
}
```

## 经验总结

1. **Agent 隔离是默认设置**——这很好。OpenClaw 默认不允许 Agent 互相干扰。你需要显式启用 Agent 间通信。

2. **tools.agentToAgent.enabled 是主开关**。没有这个，Agent 之间的 sessions_send 将无法工作。将需要通信的 Agent 添加到 allow 列表中。

3. **sessions_send 用于对话，sessions_spawn 用于任务**。当你需要回复时使用 sessions_spawn。当你需要隔离工作并在完成时宣布时使用 sessions_spawn。

4. **账号身份对私信很重要**。如果多个 Agent 共享访问同一个 Discord 账号，它们的私信将显示来自该共享身份。为每个 Agent 分配自己的账号以获得不同的身份。

5. **共享频道实现群体协调**。将同一频道添加到多个 Agent 的允许列表中，它们都可以参与同一对话——每个都以自己的机器人身份。

6. **Agent 可以共同解决问题**。当 Riley 没有 Master 的用户 ID 时，Megan 提供了它。当 Alex 需要发送私信时，Todd 已经完成了并展示了模式。涌现的团队合作。

多 Agent 系统最困难的部分不是让每个 Agent 变得聪明——而是让它们协调。一旦它们能够相互对话，任何单个 Agent 都无法解决的问题都可以通过协作来解决。整体变得大于部分之和。

---

**原文链接**: [https://medium.com/@chen.yang_50796/teaching-ai-agents-to-talk-to-each-other-inter-agent-communication-in-openclaw-736e60310005](https://medium.com/@chen.yang_50796/teaching-ai-agents-to-talk-to-each-other-inter-agent-communication-in-openclaw-736e60310005)

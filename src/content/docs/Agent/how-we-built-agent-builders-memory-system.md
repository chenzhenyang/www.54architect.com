---
title: 我们如何构建 Agent Builder 的记忆系统
description: LangChain 团队分享如何为 Agent Builder 设计和实现记忆系统，包括架构决策和技术细节
lastUpdated: 2026-04-03
author: LangChain Team
origin_title: "How we built Agent Builder's memory system"
original_url: "https://blog.langchain.com/how-we-built-agent-builders-memory-system/"
tags:
  - AI
  - Agent
  - Memory
  - LangChain
categories:
  - Technology
---

上个月我们推出了 [LangSmith Agent Builder](https://smith.langchain.com/agents?skipOnboarding=true&ref=blog.langchain.com)，这是一个无需代码即可构建 Agent（智能体）的工具。Agent Builder 的一个关键组成部分是它的记忆系统（memory system）。在本文中，我们将介绍优先开发记忆系统的理由、构建它的技术细节、从构建过程中获得的经验、记忆系统能够实现的功能，并讨论未来的工作方向。

## 什么是 LangSmith Agent Builder

[LangSmith Agent Builder](https://smith.langchain.com/agents?skipOnboarding=true&ref=blog.langchain.com) 是一个无需代码的 Agent 构建工具。它构建在 [Deep Agents harness](https://docs.langchain.com/oss/python/deepagents/overview?ref=blog.langchain.com) 之上。这是一个托管的 Web 解决方案，面向 [技术轻量级](https://x.com/ericzakariasson/status/1996347523880165857?s=20&ref=blog.langchain.com) 的公民开发者。在 LangSmith Agent Builder 中，构建者将创建一个 Agent 来自动化特定的工作流或日常任务的一部分。例如 [邮件助手](https://x.com/hwchase17/status/2011126016287113681?s=20&ref=blog.langchain.com)、[文档助手](https://x.com/docs_plz/status/2011536177556570203?s=20&ref=blog.langchain.com) 等。

![使用自然语言创建 Agent](/images/4462eda3.png)

早期我们有意识地选择将记忆（memory）作为平台的优先功能。这并不是一个显而易见的选择——大多数 AI 产品最初发布时都没有任何形式的记忆，甚至添加记忆功能 [尚未像一些人预期的那样改变产品](https://simonwillison.net/2025/May/21/chatgpt-new-memory/?ref=blog.langchain.com)。我们优先考虑它的原因是用户的使用模式。

与 ChatGPT、Claude 或 Cursor 不同，LangSmith Agent Builder 不是一个通用 Agent。相反，它专门设计用于让构建者为特定任务定制 Agent。在通用 Agent 中，你执行的任务种类繁多，可能完全不相关，因此与 Agent 一次会话中学到的内容可能与下一次会话无关。当 LangSmith Agent 执行任务时，它一遍又一遍地执行相同的任务。一次会话中的经验教训会以更高的转化率应用到下一次会话中。事实上，如果没有记忆功能，用户体验会很糟糕——这意味着你不得不在不同会话中一遍又一遍地向 Agent 重复自己。

在思考记忆对 LangSmith Agents 到底意味着什么时，我们参考了第三方的记忆定义。[COALA 论文](https://arxiv.org/abs/2309.02427?ref=blog.langchain.com) 将 Agent 的记忆分为三类：

  * **程序性记忆（Procedural）**：可应用于工作记忆以确定 Agent 行为的一组规则
  * **语义性记忆（Semantic）**：关于世界的事实
  * **情景性记忆（Episodic）**：Agent 过去行为的序列

![COALA 记忆图](/images/6e029143.png)

## 我们如何构建记忆系统

我们将 Agent Builder 中的记忆表示为一组文件。这是一个有意的选择，目的是利用模型 [擅长使用文件系统](https://www.blog.langchain.com/how-agents-can-use-filesystems-for-context-engineering/?ref=blog.langchain.com) 这一事实。通过这种方式，我们可以轻松地让 Agent 读取和修改其记忆，而无需提供专用工具——我们只需让它访问文件系统！

在可能的情况下，我们尽量使用行业标准。我们使用 [AGENTS.md](http://agents.md/?ref=blog.langchain.com) 来定义 Agent 的核心指令集。我们使用 [agent skills](https://agentskills.io/home?ref=blog.langchain.com) 为 Agent 提供针对特定任务的专门指令。虽然没有子代理（subagent）标准，但我们使用了 [与 Claude Code 类似的格式](https://code.claude.com/docs/en/sub-agents?ref=blog.langchain.com)。对于 [MCP](https://modelcontextprotocol.io/docs/getting-started/intro?ref=blog.langchain.com) 访问，我们使用自定义的 `tools.json` 文件。我们使用自定义 `tools.json` 文件而不是标准 `mcp.json` 的原因是，我们希望允许用户只给 Agent 提供 MCP 服务器中的一部分工具，以避免上下文溢出（context overflow）。

![记忆 = 文件系统](/images/2e201d2d.png)

我们实际上并不使用真实的文件系统来存储这些文件。相反，我们将它们存储在 Postgres 中，并以文件系统的形状向 Agent 暴露。我们这样做是因为 LLM 非常擅长处理文件系统，但从基础设施的角度来看，使用数据库更简单、更高效。这种"虚拟文件系统"由 [DeepAgents 原生支持](https://docs.langchain.com/oss/python/deepagents/backends?ref=blog.langchain.com)——并且完全可插拔，因此你可以使用任何存储层（S3、MySQL 等）。

我们还允许用户（以及 Agent 本身）将其他文件写入 Agent 的记忆文件夹。这些文件也可以包含任意知识，Agent 在运行时可以参考。Agent 会在工作时编辑这些文件，即 "[在热路径中](https://docs.langchain.com/oss/python/concepts/memory?ref=blog.langchain.com#in-the-hot-path)"。

之所以能够在没有任何代码或领域特定语言（DSL）的情况下构建复杂的 Agent，是因为我们在底层使用了像 Deep Agents 这样的通用 Agent harness。Deep Agents 抽象掉了许多复杂的上下文工程（如 [摘要](https://docs.langchain.com/oss/python/deepagents/harness?ref=blog.langchain.com#conversation-history-summarization)、[工具调用卸载](https://docs.langchain.com/oss/python/deepagents/harness?ref=blog.langchain.com#large-tool-result-eviction) 和 [规划](https://docs.langchain.com/oss/python/deepagents/harness?ref=blog.langchain.com#to-do-list-tracking)），并让你能够通过相对简单的配置来引导 Agent。

这些文件很好地映射到 COALA 论文中定义的记忆类型。程序性记忆——驱动核心 Agent 指令——是 [AGENTS.md](http://agents.md/?ref=blog.langchain.com) 和 `tools.json`。语义性记忆是 Agent skills 和其他知识文件。唯一缺失的记忆类型是情景性记忆，我们认为对于这类 Agent 来说，它不如其他两种类型重要。

### 文件系统中的 Agent 记忆是什么样的

我们可以看看我们内部一直在使用的一个真实 Agent——一个 LinkedIn 招聘人员——它是基于 LangSmith Agent Builder 构建的。

  * [AGENTS.md](http://agents.md/?ref=blog.langchain.com)：定义核心 Agent 指令
  * `subagents/`：只定义了一个子代理
    * `linkedin_search_worker`：在主 Agent 校准搜索后，它会启动这个 Agent 来寻找约 50 名候选人
  * `tools.json`：定义了一个 MCP 服务器，可以访问 LinkedIn 搜索工具
  * 记忆中目前还有 3 个其他文件，代表不同候选人的职位描述（JD）。随着我们与 Agent 一起处理这些搜索，它已经更新并维护了这些 JD。

![Agent Builder 记忆文件系统](/images/agent-builder-memory-filesystem.png)

### 记忆编辑如何工作：一个具体示例

为了更具体地说明记忆如何工作，我们可以 walkthrough 一个示例。

**开始：**

你从一个简单的 [AGENTS.md](http://agents.md/?ref=blog.langchain.com) 开始：

`总结会议记录。`

**第 1 周：**

Agent 生成段落式摘要。你纠正它："使用项目符号而不是段落。"Agent 将 [AGENTS.md](http://agents.md/?ref=blog.langchain.com) 编辑为：

`# 格式偏好  
用户更喜欢使用项目符号进行摘要，而不是段落。`

**第 2 周：**

你要求 Agent 总结另一个会议。它读取记忆并自动使用项目符号。无需提醒。在此会话期间，你要求它："在末尾单独提取行动项目。"记忆更新为：

`# 格式偏好  
用户更喜欢使用项目符号进行摘要，而不是段落。  
在末尾单独部分提取行动项目。`

**第 4 周：**

两种模式都自动应用。随着新边缘情况的出现，你继续添加改进。

**第 3 个月：**

Agent 的记忆包括：

  * 不同文档类型的格式偏好
  * 领域特定术语
  * "行动项目"、"决策"和"讨论要点"之间的区别
  * 频繁会议参与者的姓名和角色
  * 会议类型处理（工程 vs. 规划 vs. 客户）
  * 通过使用积累的边缘情况修正

记忆文件可能如下所示：

`# 会议摘要偏好  
  
## 格式  
- 使用项目符号，而不是段落  
- 在末尾单独部分提取行动项目  
- 对决策使用过去时  
- 在顶部包含时间戳  
  
## 会议类型  
- 工程会议：强调技术决策和理由  
- 规划会议：强调优先级和时间表  
- 客户会议：删除敏感信息  
- 短会议（<10 分钟）：只列出要点  
  
## 人员  
- Sarah Chen（工程负责人）- 关注技术细节  
- Mike Rodriguez（产品经理）- 关注业务影响  
...`

[AGENTS.md](http://agents.md/?ref=blog.langchain.com) 通过修正自行构建，而不是通过前期文档。我们迭代地得出了适当详细的 Agent 规范，用户无需手动更改 [AGENTS.md](http://agents.md/?ref=blog.langchain.com)。

## 构建这个记忆系统的经验

我们在此过程中学到了几个教训。

**最困难的部分是提示（prompting）**

构建能够记住事情的 Agent 最困难的部分是提示。在几乎所有 Agent 表现不佳的情况下，解决方案都是改进提示。通过这种方式解决的问题示例：

  * Agent 在应该记住的时候没有记住
  * Agent 在不应该记住的时候记住了
  * Agent 向 [AGENTS.md](http://agents.md/?ref=blog.langchain.com) 写入太多内容，而不是写入 skills
  * Agent 不知道 skills 文件的正确格式
  * …… 还有很多更多

我们有一个人全职从事记忆提示工作（这占了团队的很大比例）。

**验证文件类型**

几个文件需要遵循特定的模式（`tools.json` 需要有有效的 MCP 服务器，skills 需要有正确的 frontmatter 等）。我们发现 Agent Builder 有时会忘记这一点，因此生成了无效文件。我们添加了一个步骤来明确验证这些自定义形状，如果验证失败，则将任何错误返回给 LLM，而不是提交文件。

**Agent 擅长向文件添加内容，但不会压缩**

Agent 在工作时编辑它们的记忆。它们非常擅长向文件添加具体内容。然而，它们不擅长的一件事是意识到何时压缩学习内容。例如：我的邮件助手在某一刻开始列出它应该忽略的所有特定供应商的冷启动推广，而不是更新自己以忽略所有冷启动推广。

**作为最终用户，显式提示有时仍然有用**

即使 Agent 能够在工作时更新其记忆，仍有几种情况（作为最终用户）我们发现显式提示 Agent 管理其记忆很有用。一种情况是在工作结束时反思对话并更新其记忆，以获取它可能遗漏的任何内容。另一种情况是提示它压缩记忆，以解决它记住具体案例但不进行概括的情况。

**人在回路（Human-in-the-loop）**

我们使所有对记忆的编辑都采用人在回路模式——也就是说，在更新之前需要明确的人工批准。这主要是为了最大限度地减少提示注入（prompt injection）的潜在攻击载体。我们确实为用户提供了一种关闭此功能的方法（"yolo 模式"），适用于他们不太担心这种情况的情况。

## 这使得什么成为可能

除了更好的产品体验之外，以这种方式表示记忆还实现了许多功能。

**无需代码的体验**

无需代码构建器的问题之一是，它们要求你学习一个不熟悉的 DSL，而这个 DSL 无法很好地扩展复杂性。通过将 Agent 表示为 markdown 和 json 文件，Agent 现在采用了一种（a）对大多数技术轻量级人员来说熟悉的格式，（b）更具可扩展性。

**更好的 Agent 构建**

记忆实际上允许更好的 Agent 构建体验。Agent 构建是非常迭代的——在很大程度上是因为在你尝试之前你不知道 Agent 会做什么。记忆使迭代更容易，因为你不必每次手动更新 Agent 配置，只需以自然语言提供反馈，它就会自行更新。

**可移植的 Agent**

文件非常可移植！这使你可以轻松地将 Agent Builder 中构建的 Agent 移植到其他 harness（只要它们使用相同的文件约定）。出于这个原因，我们尽量使用尽可能多的标准约定。我们希望轻松地在 Deep Agents CLI 中使用 Agent Builder 中构建的 Agent。或者完全使用其他 Agent harness，如 Claude Code 或 OpenCode。

## 未来方向

有很多记忆改进我们想要实现，但在发布之前我们没有足够的时间或信心来实现。

**情景性记忆**

Agent Builder 缺少的一种 COALA 记忆类型是情景性记忆：Agent 过去行为的序列。我们计划通过将之前的对话作为文件暴露在文件系统中来实现这一点，Agent 可以与这些文件交互。

**后台记忆进程**

目前，所有记忆都在"热路径中"更新；也就是说，在 Agent 运行时。我们想要添加一个在后台运行的进程（可能是一些 cron 作业，每天运行一次左右）来反思所有对话并更新记忆。我们认为这将捕捉到 Agent 在当时未能识别的项目，并且对于概括特定学习内容特别有用。

![在热路径中](/images/f31eba08.png)

**`/remember`**

我们想要暴露一个显式的 `/remember` 命令，这样你就可以提示 Agent 反思对话并更新其记忆。我们发现自己偶尔这样做会带来很大的好处，因此想要使其更容易、更受鼓励。

**语义搜索**

虽然能够使用 `glob` 和 `grep` 搜索记忆是一个很好的起点，但在某些情况下，允许 Agent 对其记忆进行语义搜索会带来一些增益。

**不同级别的记忆**

目前，所有记忆都特定于该 Agent。我们没有用户级别或组织级别记忆的概念。我们计划通过向 Agent 暴露代表这些记忆类型的特定目录来实现这一点，并提示 Agent 相应地使用和更新这些记忆。

## 结论

如果构建具有记忆的 Agent 听起来很有趣，请试用 [LangSmith Agent Builder](https://smith.langchain.com/agents?skipOnboarding=true&ref=blog.langchain.com)。如果你想帮助我们构建这个记忆系统，[我们正在招聘](https://www.langchain.com/careers?ref=blog.langchain.com)。

`# 格式偏好  
用户更喜欢使用项目符号进行摘要，而不是段落。`

`# 格式偏好  
用户更喜欢使用项目符号进行摘要，而不是段落。  
在末尾单独部分提取行动项目。`

`# 会议摘要偏好  
  
## 格式  
- 使用项目符号，而不是段落  
- 在末尾单独部分提取行动项目  
- 对决策使用过去时  
- 在顶部包含时间戳  
  
## 会议类型  
- 工程会议：强调技术决策和理由  
- 规划会议：强调优先级和时间表  
- 客户会议：删除敏感信息  
- 短会议（<10 分钟）：只列出要点  
  
## 人员  
- Sarah Chen（工程负责人）- 关注技术细节  
- Mike Rodriguez（产品经理）- 关注业务影响  
...`

---

**原文链接**: [https://blog.langchain.com/how-we-built-agent-builders-memory-system/](https://blog.langchain.com/how-we-built-agent-builders-memory-system/)

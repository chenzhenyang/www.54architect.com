---
title: AI 的新技能不是提示工程，而是上下文工程
description: 讨论从 Prompt Engineering 到 Context Engineering 的转变，以及构建 AI Agent 时上下文质量的重要性
origin_title: The New Skill in AI is Not Prompting, It's Context Engineering
author: Philipp Schmid
tags:
  - AI
  - Context Engineering
  - Agent
categories:
  - Technology
lastUpdated: 2026-04-03
original_url: https://www.philschmid.de/context-engineering
---

Context Engineering（上下文工程）是 AI 领域正在获得关注的新术语。对话正在从"提示工程"（Prompt Engineering）转向一个更广泛、更强大的概念：Context Engineering（上下文工程）。[Tobi Lutke](https://x.com/tobi/status/1935533422589399127) 将其描述为"为任务提供所有上下文的艺术，使 LLM 能够合理地解决该任务。"他说得对。

随着 Agent（智能体）的兴起，我们加载到"有限工作内存"中的信息变得更加重要。我们发现，决定 Agent 成功或失败的主要因素是你提供给它的上下文质量。大多数 Agent 的失败不再是模型失败，而是上下文失败。

## 什么是上下文？

要理解上下文工程，我们首先必须扩展"上下文"的定义。它不仅仅是你发送给 LLM 的单个提示。把它想象成模型在生成响应之前看到的一切。

![Context](https://raw.githubusercontent.com/chenzhenyang/images/master/litercrawler/context-engineering/context.png)

- **Instructions / System Prompt（指令/系统提示）：** 一组初始指令，定义模型在对话期间的行为，可以/应该包括示例、规则等。

- **User Prompt（用户提示）：** 用户的即时任务或问题。

- **State / History（short-term Memory，状态/历史，短期记忆）：** 当前的对话，包括导致这一刻的用户和模型响应。

- **Long-Term Memory（长期记忆）：** 持久的知识库，从许多之前的对话中收集，包含学到的用户偏好、过去项目的摘要，或被告知要记住以供将来使用的事实。

- **Retrieved Information (RAG，检索信息)：** 外部的最新知识，来自文档、数据库或 API 的相关信息，用于回答具体问题。

- **Available Tools（可用工具）：** 它可以调用的所有函数或内置工具的定义（例如 check_inventory、send_email）。

- **Structured Output（结构化输出）：** 关于模型响应格式的定义，例如 JSON 对象。

## 为什么它很重要：从廉价的演示到神奇的产品

构建真正有效的 AI Agent 的秘诀与编写的代码复杂性关系不大，而与你提供的上下文质量息息相关。

构建 Agent 更少关乎你编写的代码或使用的框架。廉价的演示和"神奇的"Agent 之间的区别在于你提供的上下文质量。想象一下，有人要求 AI 助手根据一封简单的电子邮件来安排会议：

> Hey, just checking if you're around for a quick sync tomorrow.

"廉价的演示"Agent 的上下文很差。它只看到用户的请求，没有其他任何信息。它的代码可能完全正常——它调用 LLM 并获得响应——但输出没有帮助且机械：

> Thank you for your message. Tomorrow works for me. May I ask what time you had in mind?

"神奇的"Agent 由丰富的上下文驱动。代码的主要工作不是弄清楚如何响应，而是收集 LLM 完成其目标所需的信息。在调用 LLM 之前，你会扩展上下文以包括：

- 你的日历信息（显示你全天排满）。

- 你与此人的过往电子邮件（以确定适当的非正式语气）。

- 你的联系人列表（将其识别为关键合作伙伴）。

- 用于 send_invite 或 send_email 的工具。

然后你可以生成响应。

> Hey Jim! Tomorrow's packed on my end, back-to-back all day. Thursday AM free if that works for you? Sent an invite, lmk if it works.

魔法不在于更聪明的模型或更巧妙的算法。而在于为正确的任务提供正确的上下文。这就是为什么上下文工程很重要的原因。Agent 的失败不仅仅是模型失败；它们是上下文失败。

## 从提示工程到上下文工程

什么是上下文工程？虽然"提示工程"专注于在单个文本字符串中制定完美的指令集，但上下文工程要广泛得多。让我们简单地说：

**Context Engineering（上下文工程）是一门设计和构建动态系统的学科，该系统在正确的时间以正确的格式提供正确的信息和工具，为 LLM 提供完成任务所需的一切。**

上下文工程是：

- **一个系统，而不是一个字符串：** 上下文不仅仅是静态的提示模板。它是在主 LLM 调用之前运行的系统的输出。

- **动态的：** 即时创建，针对当前任务定制。对于一个请求，这可能是日历数据；对于另一个请求，可能是电子邮件或网络搜索。

- **关于在正确的时间提供正确的信息、工具：** 核心工作是确保模型不会缺少关键细节（"垃圾进，垃圾出"）。这意味着仅在需要且有帮助时提供知识（信息）和能力（工具）。

- **格式很重要的地方：** 你呈现信息的方式很重要。简洁的摘要比原始数据转储更好。清晰的工具模式比模糊的指令更好。

## 结论

构建强大且可靠的 AI Agent 正变得不再那么依赖于寻找神奇的提示或模型更新。而是关于上下文的工程，以及在正确的时间以正确的格式提供正确的信息和工具。这是一个跨领域的挑战，涉及理解你的业务用例、定义你的输出，并结构化所有必要的信息，以便 LLM 能够"完成任务"。

## 致谢

本概述是在深入和手动研究的帮助下创建的，从几个优秀的资源中汲取灵感和信息，包括：

- [Tobi Lutke tweet](https://x.com/tobi/status/1935533422589399127)

- [Karpathy tweet](https://x.com/karpathy/status/1937902205765607626)

- [The rise of "context engineering"](https://blog.langchain.com/the-rise-of-context-engineering/)

- [Own your context window](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-03-own-your-context-window.md)

- [Context Engineering by Simon Willison](https://simonwillison.net/2025/Jun/27/context-engineering/)

- [Context Engineering for Agents](https://rlancemartin.github.io/2025/06/23/context_engineering/)

感谢阅读！如果你有任何问题或反馈，请在 [Twitter](https://twitter.com/_philschmid) 或 [LinkedIn](https://www.linkedin.com/in/philipp-schmid-a6a2bb196/) 上告诉我。

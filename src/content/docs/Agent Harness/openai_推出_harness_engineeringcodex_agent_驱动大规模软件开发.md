---
title: "OpenAI 推出 Harness Engineering：Codex Agent 驱动大规模软件开发"
description: "OpenAI 详细阐述了 Harness engineering，一种利用 AI Agent 驱动软件开发生命周期的新方法。在五个月的实验中，工程师仅通过提示和反馈就构建了 100 万行代码的测试版产品。"
tags:
  - AI
  - Software Engineering
  - Codex
  - Agent
categories:
  - Technology
lastUpdated: 2026-03-28
origin_title: "OpenAI Introduces Harness Engineering: Codex Agents Power Large‑Scale Software Development"
author: "Leela Kumili"
original_url: "https://www.infoq.com/news/2026/02/openai-harness-engineering-codex/"
---

**作者**: Leela Kumili  
**日期**: 2026 年 2 月 21 日  
**阅读时间**: 2 分钟

---

OpenAI 详细阐述了一种新的[内部工程方法，称为 Harness engineering](https://openai.com/index/harness-engineering/)，利用 AI Agent 驱动软件开发生命周期的关键方面。该系统使用 Codex（一套 AI Agent 套件）来执行编写代码、生成测试和管理可观测性等任务，基于工程师定义的**声明式提示（declarative prompts）**。Harness 标准化了工作流程，减少了对手工脚本和定制工具的依赖。

OpenAI 技术工作人员 [Ryan Lopopolo](https://www.linkedin.com/in/ryanlopopolo/) 表示：

> 我们构建 Harness 是为了提供一种一致且可靠的方式来运行大规模 AI 工作负载，使团队能够专注于研究和产品开发，而不是基础设施编排。

在一项为期五个月的内部实验中，OpenAI 工程师构建并发布了一个包含约**100 万行代码**的测试版产品，没有任何手动编写的源代码。一个小型工程师团队通过拉取请求和持续集成工作流程引导 Agent。工作内容包括应用逻辑、文档、CI 配置、可观测性设置和工具。工程师提供提示和反馈，而 [Codex](https://openai.com/index/introducing-codex/) Agent 自主迭代任务，包括重现 bug、提出修复方案和验证结果。

![Codex Agent 驱动的应用测试和反馈](https://imgopt.infoq.com/fit-in/3000x4000/filters:quality(85)/filters:no_upscale()/news/2026/02/openai-harness-engineering-codex/en/resources/1codefeedback-1771570048741.jpeg)

*Codex Agent 驱动的应用测试和反馈（来源：[OpenAI 博客文章](https://openai.com/index/harness-engineering/)）*

Harness engineering 将人类工程师的焦点从**实现代码**转移到**设计环境**、**指定意图**和**提供结构化反馈**。Codex 直接与开发工具交互，打开拉取请求、评估更改并迭代直到满足任务标准。Agent 使用**遥测数据（telemetry）**，包括日志、指标和追踪（logs, metrics, and spans），来监控应用性能并在隔离的开发环境中重现 bug。

![Codex Agent 的可观测性和遥测工作流](https://imgopt.infoq.com/fit-in/3000x4000/filters:quality(85)/filters:no_upscale()/news/2026/02/openai-harness-engineering-codex/en/resources/1openaiobservability-1771570245491.jpeg)

*Codex Agent 的可观测性和遥测工作流（来源：[OpenAI 博客文章](https://openai.com/index/harness-engineering/)）*

内部文档组织在结构化的 `docs` 目录中，包含**地图（maps）**、**执行计划（execution plans）**和**设计规范（design specifications）**。这些文档作为 Agent 的**唯一事实来源（single source of truth）**。通过 linter 和 CI 验证**机械地强制实施**交叉链接的设计和架构文档，确保一致性并减少手动监督的需求。

OpenAI 通过机械规则和结构测试在域之间强制执行**架构边界（architectural boundaries）**和**依赖层（dependency layers）**。依赖关系按照以下受控序列流动：

```
Types → Config → Repo → Service → Runtime → UI
```

Agent 被限制在这些层内操作。结构测试验证合规性并防止违反模块化分层。

[Martin Fowler](https://www.linkedin.com/in/martin-fowler-com/)（作者兼 Thoughtworks 技术专家）在 [LinkedIn 帖子](https://www.linkedin.com/posts/martin-fowler-com_harness-engineering-activity-7429522347822546944-4gfm?utm_source=share&utm_medium=member_desktop&rcm=ACoAAArnikgBqzTxA9Y838-O55QUcB2McACIq94) 中提到：

> Harness Engineering 是 AI 赋能软件开发关键部分的有价值框架。Harness 包括上下文工程、架构约束和垃圾回收。

OpenAI 报告称，Harness 将**脚手架（scaffolding）**、**反馈循环（feedback loops）**、**文档**和**架构约束**编码为**机器可读的工件（machine-readable artifacts）**，Codex Agent 使用这些工件在执行开发工作流中的任务，包括代码生成、测试和可观测性。

---

## 关于作者

**Leela Kumili** - 首席工程师

Leela 是星巴克的首席软件工程师，在构建可扩展的云原生系统和分布式平台方面拥有深厚的专业知识。她推动 Rewards Platform 的架构、交付和卓越运营，领导现代化系统、提高可扩展性和增强可靠性的工作。

除了技术领导力外，Leela 还担任组织的**AI Champion**，识别利用基于 LLM 的工具提高开发者生产力和工作流的机会，并为 AI 采用建立最佳实践。她热衷于构建生产就绪系统、增强开发者体验，并指导工程师在技术和战略影响力方面成长。她的兴趣包括平台工程、分布式系统、开发者生产力，以及将技术解决方案与业务和产品目标桥接。

---

## 相关主题

- 开发（Development）
- 架构与设计（Architecture & Design）
- AI、ML 和数据工程（AI, ML & Data Engineering）
- 软件范式（SoftwareParadigm）
- AI 开发（AI Development）
- Agent
- 持续交付（Continuous Delivery）
- 持续改进（Continuous Improvement）
- 软件工程（Software Engineering）
- 产品开发（Product Development）
- 自动化（Automation）
- OpenAI
- 持续集成（Continuous Integration）
- 可观测性（Observability）

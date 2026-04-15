---
title: Claude 托管代理：以 10 倍速度投入生产
description: '---'
tags:
- AI
- Technology
categories:
- Technology
lastUpdated: 2026-04-15
origin_title: 'Claude Managed Agents: get to production 10x faster | Claude'
author: Claude
skill_id: 8d04d1b2
generated: 2026-04-15 09:19:06.872042
original_url: https://claude.com/blog/claude-managed-agents
---
今天，我们推出了 **Claude 托管代理**（Claude Managed Agents），这是一套可组合的 API，用于大规模构建和部署云托管代理。

在此之前，构建代理意味着要花费开发周期在安全基础设施、状态管理、权限控制上，并且每次模型升级都要重新设计代理循环。托管代理将针对性能优化的代理 Harness（代理框架）与生产级基础设施相结合，让您能够在几天而非几个月内从原型走向发布。

无论您是在构建单一任务执行器还是复杂的多代理流水线，都可以专注于用户体验，而非运营开销。

托管代理现已在 Claude 平台公开测试版中提供。

## **以 10 倍速度构建和部署代理**

发布生产级代理需要沙盒代码执行、检查点、凭证管理、范围化权限和端到端追踪。这意味着在发布任何用户可见的内容之前，需要数月的基础设施工作。

托管代理处理这些复杂性。您定义代理的任务、工具和防护栏，我们在我们的基础设施上运行它。内置的编排 Harness 决定何时调用工具、如何管理上下文以及如何从错误中恢复。

托管代理包括：

*   **生产级代理**，安全沙盒、身份验证和工具执行都为您处理。
*   **长运行会话**，可自主运行数小时，即使断开连接也能保持进度和输出持久化。
*   **多代理协调**，代理可以启动并指导其他代理来并行化复杂工作（_研究预览版_ 中提供，[在此申请访问](http://claude.com/form/claude-managed-agents)）。
*   **可信治理**，通过范围化权限、身份管理和执行追踪内置，让代理能够访问真实系统。

![](https://cdn.prod.website-files.com/68a44d4040f98a4adf2207b6/69d53a1b570fa207204f0111_Claude-Blog-Managed-Agents-Diagram-NoBorder.png)

Claude 托管代理架构

## **专为充分发挥 Claude 能力而设计**

Claude 模型专为代理工作而构建。托管代理专为 Claude 打造，让您能够以更少的努力获得更好的代理结果。

使用托管代理，您定义结果和成功标准，Claude 会自我评估并迭代直到达成目标（_研究预览版_ 中提供，[在此申请访问](http://claude.com/form/claude-managed-agents)）。当您想要更紧密的控制时，它也支持传统的提示 - 响应工作流。

在内部结构化文件生成测试中，托管代理在结果任务成功率上比标准提示循环提高了多达 10 个百分点，在最困难的问题上提升最大。

会话追踪、集成分析和故障排除指导直接内置于 Claude 控制台中，因此您可以检查每个工具调用、决策和失败模式。

## **团队正在构建什么**

团队已经在各种生产用例中以 10 倍速度使用托管代理进行发布。代码代理可以读取代码库、规划修复并打开 PR。生产力代理可以加入项目、接受任务并与团队其他成员一起交付工作。财务和法务代理可以处理文档并提取关键信息。在每种情况下，几天内发布意味着更快地为用户提供价值。

*   [**Notion**](https://claude.com/customers/notion-qa) 让团队可以直接在工作区内将工作委托给 Claude（在 Notion 自定义代理的私人测试版中提供）。工程师用它来发布代码，而知识工作者用它来制作网站和演示文稿。数十个任务可以并行运行，同时整个团队在输出上协作。
*   [**Rakuten**](https://claude.com/customers/rakuten-qa) 在产品、销售、营销和财务部门部署了企业代理，这些代理可插入 Slack 和 Teams，让员工分配任务并取回电子表格、幻灯片和应用程序等可交付成果。每个专业代理都在一周内部署完成。
*   [**Asana**](https://claude.com/customers/asana-qa) 构建了 AI 队友（AI Teammates），这是协作式 AI 代理，在 Asana 项目内与人类一起工作，承担任务并起草可交付成果。团队使用托管代理以比原本能够做到的速度快得多的速度添加高级功能。
*   [**Vibecode**](https://claude.com/customers/vibecode) 帮助客户使用托管代理作为默认集成，从提示到部署应用程序，为新一代 AI 原生应用程序提供动力。用户现在可以以比以前快至少 10 倍的速度启动相同的基础设施。
*   [**Sentry**](https://claude.com/customers/sentry) 将他们的调试代理 Seer 与一个由 Claude 驱动的代理配对，该代理编写补丁并打开 PR，因此开发人员可以从标记的错误到可审查的修复在一个流程中完成。使用托管代理，此集成在几周内发布，而不是几个月。

![](https://cdn.prod.website-files.com/68a44d4040f98a4adf2207b6/6903d227246bc2b5a3cc3626_9f6a378a1e3592cf8d27447457409ba12284faef-1000x1000.svg)![Logo](https://cdn.prod.website-files.com/68a44d4040f98a4adf2207b6/69813caf8d50645af3af864f_logo_vibecode-light-mode.svg)![Logo](https://cdn.prod.website-files.com/68a44d4040f98a4adf2207b6/69813cb3c3d5ccc7214e1b85_logo_vibecode-dark-mode.svg)![Logo](https://cdn.prod.website-files.com/68a44d4040f98a4adf2207b6/68bf57518a91cc645d08ae1a_sentry-light-mode.svg)![Logo](https://cdn.prod.website-files.com/68a44d4040f98a4adf2207b6/68bf57579ec56ad383059291_sentry-dark-mode.svg)![Logo](https://cdn.prod.website-files.com/68a44d4040f98a4adf2207b6/68b5a84a22074cc407a84848_Atlassian_light.svg)![Logo](https://cdn.prod.website-files.com/68a44d4040f98a4adf2207b6/69d54700357e01220a808b6e_general-legal-light-mode.svg)![Logo](https://cdn.prod.website-files.com/68a44d4040f98a4adf2207b6/69d54702528137b79ea59cbd_general-legal-dark-mode.svg)![Logo](https://cdn.prod.website-files.com/68a44d4040f98a4adf2207b6/69d546e8750a5d04702cf69a_blockit-light-mode.svg)![Logo](https://cdn.prod.website-files.com/68a44d4040f98a4adf2207b6/69d546ea465a73571724d917_blockit-dark-mode.svg)![Logo](https://cdn.prod.website-files.com/68a44d4040f98a4adf2207b6/68ba17a186e44af7d97dae57_Frame.svg)![Logo](https://cdn.prod.website-files.com/68a44d4040f98a4adf2207b6/68ba179c1c4432fa78b2f126_Frame-1.svg)![Logo](https://cdn.prod.website-files.com/68a44d4040f98a4adf2207b6/68d5faa6352b26bf7542cb9b_logo_rakuten-light.svg)![Logo](https://cdn.prod.website-files.com/68a44d4040f98a4adf2207b6/68d5fab610bf0d091b541153_logo_rakuten-dark.svg)![Logo](https://cdn.prod.website-files.com/68a44d4040f98a4adf2207b6/68b5a7ba07d03afe57aaaf02_asana_light.svg)![Logo](https://cdn.prod.website-files.com/68a44d4040f98a4adf2207b6/68b5a7be22750d186de0e365_asana_dark.svg)![](https://cdn.prod.website-files.com/6889473510b50328dbb70ae6/6889473610b50328dbb70b58_placeholder.svg)![](https://cdn.prod.website-files.com/68a44d4040f98a4adf2207b6/6903d22d0099a66d72e05699_33ddc751e21fb4b116b3f57dd553f0bc55ea09d1-1000x1000.svg)![](https://cdn.prod.website-files.com/68a44d4040f98a4adf2207b6/692f783c784823d48ad84175_Object-CodeChatText.svg)![](https://cdn.prod.website-files.com/68a44d4040f98a4adf2207b6/6903d22c7f111435762ad994_1b398dbdfa4995ce5ce943aa87d8b78b2c2ba065-1000x1000.svg)![](https://cdn.prod.website-files.com/68a44d4040f98a4adf2207b6/6903d229061abf091318fc81_6905c83d0735e1bc430025fdd1748d1406079036-1000x1000.svg)


---

**原文链接**: [https://claude.com/blog/claude-managed-agents](https://claude.com/blog/claude-managed-agents)

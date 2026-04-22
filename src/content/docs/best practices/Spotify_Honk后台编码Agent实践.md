---
title: "Spotify后台编码Agent实践：1500+ PR后的Honk项目经验"
description: "Spotify工程团队分享其后台编码Agent（内部代号Honk）的实践：将AI Agent集成到Fleet Management系统，用自然语言定义代码转换，已合并1500+ AI生成的PR，节省60-90%时间。"
tags:
  - AI Coding
  - Spotify
  - Agent
  - Fleet Management
categories:
  - Technology
lastUpdated: 2026-04-22
origin_title: "1,500+ PRs Later: Spotify's Journey with Our Background Coding Agent (Honk, Part 1)"
original_url: https://engineering.atspotify.com/2025/11/spotifys-background-coding-agent-part-1
---

> 这是Spotify关于后台编码Agent（内部代号："Honk"）和大规模软件维护未来系列文章的第一部分。另见[第二部分](https://engineering.atspotify.com/2025/11/context-engineering-background-coding-agents-part-2)和[第三部分](https://engineering.atspotify.com/2025/12/feedback-loops-background-coding-agents-part-3)。

多年来，开发者生产力通过更好的工具得到了提升。我们有了更智能的IDE、更快的构建、更好的测试和更可靠的部署。但即便如此，维护代码库、保持依赖更新并确保代码遵循最佳实践仍然需要大量的手工工作。在Spotify，我们的[Fleet Management系统](https://engineering.atspotify.com/2023/04/spotifys-shift-to-a-fleet-first-mindset-part-1)自动化了大部分这些苦活，但任何中等复杂的迁移仍然需要许多人手。

如果我们能弥合最后的差距呢？

本文探讨了我们如何使用后台编码Agent进化我们的Fleet Management平台，以及超过1,500个合并的AI生成的拉取请求教会了我们关于大规模软件维护未来的什么。

## 使用Fleet Management自动化苦活

Fleet Management是一个强大的框架，用于在Spotify的所有仓库中应用代码转换。这个想法很简单：我们编写小的代码片段，这些片段本身修改源代码，并将这些转换应用于数千个软件组件。这样我们就可以跨代码库处理维护任务。

从高层来看，Fleet Management取得了巨大的成功。它使我们自动化了无数小时的苦活，大大减少了推出全车队变更的时间。系统通过在容器化环境中将这些源到源的转换作为作业运行来工作，然后自动对目标仓库打开拉取请求。

这种方法在几个领域表现出色，包括：

- 在构建文件中提升依赖，如在Maven项目对象模型（POM）文件中
- 更新配置文件，如部署清单
- 执行简单的代码重构，如删除或替换已弃用的方法调用

影响是显著的，每天都有稳定的自动化拉取请求流被合并，保持我们的代码库一致、最新和安全。自2024年中期以来，Spotify大约一半的拉取请求都是由这个系统自动化的。

但我们从一开始就知道这种方法有它的限制。虽然它非常适合简单的、可重复的任务，但进行复杂的代码变更是一个我们从未完全解决的挑战。通过操作程序的抽象语法树（AST）或使用正则表达式以编程方式定义源代码转换，需要高度的专业专业知识。一个例子是我们的自动化Maven依赖更新器。虽然它的核心功能——识别pom.xml文件并更新Java依赖——是直接的，但处理所有边缘情况导致转换脚本增长到超过20,000行代码。由于这种复杂性，我们可以实现的大多数自动化变更都是简单的。只有少数团队具有在整个代码库上实现更复杂Fleetshift所需的专业知识和时间。

同时，AI工具在进行复杂代码变更方面变得更加强大。这呈现了一个清晰且有前途的机会：

> 我们可以应用AI来降低入门门槛，并为更复杂的变更释放Fleet Management的力量吗？

## 引入AI编码Agent

去年二月，我们开始调查在我们的Fleet Management系统中使用AI Agent。目标是允许工程师使用自然语言定义和运行全车队变更。

我们从最需要帮助的部分开始：代码转换本身的声明。我们用从提示词获取指令的Agent替换了确定性迁移脚本。所有周围的Fleet Management基础设施——目标仓库、打开拉取请求、获取审查和合并到生产——保持完全相同。

我们看到了对这种类型产品的即时内部需求。我们与将其应用于进行中迁移的早期采用者共同开发工具。迄今为止，我们的Agent已经生成了超过1,500个拉取请求，Spotify各团队已将这些请求合并到我们的生产代码库中。而且不是微不足道的变更——我们现在开始处理诸如：

- 语言现代化，如用[records](https://openjdk.org/jeps/395)替换Java值类型
- 具有破坏性变更的升级，如将数据管道迁移到最新版本的[Scio](https://github.com/spotify/scio)
- 在UI组件之间迁移，如迁移到Backstage的[新前端系统](https://backstage.io/docs/frontend-system/building-plugins/migrating/)
- 配置变更，如更新YAML或JSON文件中的参数并仍然遵守schema和格式

对于这些迁移，与用传统手工方式编写代码相比，我们看到了60-90%的总时间节省。自动化变更的ROI也随着我们随时间扩展到越来越多的代码库而继续增加。我们认为这是一个非常有希望的开始，我们强烈相信我们只是在触及利用AI在迁移空间可能性的表面。

## 超越仅仅是迁移

如果你也可以从你的IDE或聊天中触发同一个Agent，给它一个任务，然后去吃午饭呢？随着时间的推移，很明显不仅需要用于迁移的后台编码Agent，还需要用于临时任务。

通过MCP暴露我们的后台编码Agent，Spotifiers现在可以从Slack和GitHub Enterprise启动编码Agent任务。他们首先与一个交互式Agent交谈，帮助收集有关手头任务的信息。这种交互产生一个提示词，然后将其交给编码Agent，后者生成一个拉取请求。

我们很快就为这个功能找到了热情的用户，例如，作为工程师从Slack线程中捕获架构决策记录（ADR）的轻量级方式，或者产品经理现在可以在不在笔记本电脑上克隆和构建仓库的情况下提出简单的变更。

我们看到了迁移和后台Agent用例之间的良好共生关系。例如，对Agent配置和工具的改进现在适用于生成的任何PR，无论任务来源如何。我们还受益于标准化，如在提交标记、管理LLM配额或收集跟踪方面。

## 后台Agent的新挑战

将AI Agent引入我们的迁移和开发者工作流对我们来说是一个新的和令人兴奋的空间。我们看到我们第一轮工具的巨大影响和动量：数百名开发者现在与我们的Agent交互，我们已经合并了超过1500个拉取请求。

但编码Agent带来了一套有趣的权衡。性能是一个关键考虑因素，因为Agent可能需要很长时间来产生结果，而且它们的输出是不可预测的。这创造了对新验证和质量控制机制的需求。除了性能和可预测性之外，我们还必须考虑安全和成本。我们需要强大的护栏和沙盒来确保Agent按预期运行，同时管理在大规模运行LLM的显著计算费用。

我们还没有所有答案，但解决这些挑战是我们团队正在努力的方向。我们很兴奋在我们探索这个空间时分享更多我们正在学习的东西。请关注我们关于有效上下文工程和使用反馈循环实现更可预测结果的后续文章。

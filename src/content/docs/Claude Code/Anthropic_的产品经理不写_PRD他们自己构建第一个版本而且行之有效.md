---
title: Anthropic 的产品经理不写 PRD，他们自己构建第一个版本，而且行之有效
description: Anthropic 的产品经理使用 Claude Code 直接构建功能的第一个版本，消除了传统 PRD 流程中的交接漂移，将实验周期从数周压缩到数天，实现了 13 倍的实验速度优势。
origin_title: Anthropic PMs don't write PRDs. They build the first version themselves. It's working.
author: Aakash Gupta
tags:
  - AI
  - Product Management
  - Claude Code
categories:
  - Technology
lastUpdated: 2026-04-01
skill_id: 48acce24
generated: 2026-04-01T14:15:37
original_url: https://aakashgupta.medium.com/anthropic-pms-dont-write-prds-they-build-the-first-version-themselves-it-s-working-2dd749420870
---

**阅读时间 4 分钟 | 3 天前发布**

Anthropic 在 2025 年初的年度经常性收入（run-rate revenue）为 10 亿美元，到年底已超过 90 亿美元。仅 Claude Code 一项就产生了超过 5 亿美元的年度经常性收入，使用量在三个月内增长了 10 倍。公司签署了一份 3500 亿美元的条款书（term sheet），相比几个月前的 1830 亿美元几乎翻了一番。

这些数字并非来自更好的 PRD（产品需求文档，Product Requirements Document）流程。它们来自于几乎完全消除了 PRD 流程。

Anthropic 的产品经理（PM）使用 Claude Code 亲自构建功能的第一个版本。不是模型图，不是在独立环境中的原型，而是真正的第一个版本，在真正的代码库中。整个公司 dogfooding（内部试用）数周，然后他们发布一个实验。

没有规格说明，没有交接，没有漂移。

## 为什么交接漂移会扼杀实验速度

在传统组织中，产品经理写规格说明，设计师解读规格说明，工程师解读设计。每次交接都会引入漂移。最终发布的功能与产品经理最初设想的内容已经隔了三层解读。

每次交接还会增加时间。设计评审需要一周，工程师提问需要一周，冲刺周期需要一周，QA 需要一周。从 PRD 到设计到工单到冲刺到构建到 QA 的 2-4 周周期是大多数公司的标准，大多数公司将其视为构建软件的成本。

Anthropic 通过完全移除交接环节，将这个周期压缩到几天。当产品经理构建第一个版本时，不存在解读差距。他们构建的东西本身就是规格说明。公司测试它，对可工作的软件提供反馈，产品经理在代码库上进行迭代。反馈循环从数周缩短到数小时。

这个数学计算简单而具有颠覆性。如果你的实验周期是每轮测试 8 周，而竞争对手的周期是 3 天，那么他们每季度进行的实验数量是你的 13 倍。将这个数字复合到一年，学习差距将变得不可逾越。他们已经测试了 200 多个变体，而你只测试了 15 个。

## 是什么让这成为可能

如果你只是把终端交给产品经理然后说"去构建吧"，这种方法行不通。Anthropic 有意投资了一个先决条件。

代码库必须对 AI 友好。这意味着使用 Tailwind 而不是分散的 CSS 文件，这样 AI 可以在不搜索十几个样式表的情况下为组件设置样式。采用微服务架构，这样专注于某个功能的产品经理不会意外破坏其他不相关的功能。减少代码库规模，使 AI 的上下文窗口实际上能够容纳足够的代码以做出智能更改。

正是这种基础设施投资让产品经理能够直接针对生产组件进行 vibe coding（直觉式编程）。没有它，产品经理会花更多时间与代码库斗争而不是构建功能，整个方法就会崩溃。

这是工程领导层必须做出的决定。这不是免费的。迁移到 Tailwind 需要时间，重构为微服务需要时间。但回报是团队中的每个产品经理现在都可以以思维的速度而不是交接的速度进行原型设计。

在 Anthropic 负责 Claude Code 的 Boris Cherny 在 [Product Growth 播客](https://www.news.aakashg.com/p/carl-vellotti-podcast-2) 上描述了这一点。他的团队不会先写 [PRD](https://www.news.aakashg.com/p/product-requirements-documents-prds)。他们构建数百个可工作的原型，然后挑选值得发布的版本。他个人每天提交 20-30 个拉取请求（pull requests），同时运行 5 个并行的 Claude 实例。他们用了大约 10 天时间构建了 Cowork，一个面向非工程师的完整产品。

## 这种方法不适用的场景

我想直接说明局限性，因为"PRD 已死"的观点比在 LinkedIn 上听起来更加微妙。

拥有成熟产品的大型公司仍然需要文档。当你有 500 名工程师分布在 20 个团队，而一个功能涉及三个不同团队拥有的三个不同服务时，必须有人写下正在构建什么以及为什么。这种规模的协调成本需要规格说明。不是因为规格说明本身有多好，而是因为替代方案是 20 个团队构建口头协议的不同解读版本。

受监管的行业需要审计追踪。医疗、金融和政府产品需要文档证明你在发布之前已经考虑过影响。"我们构建并内部试用了"无法满足合规审查。

没有可见用户界面（UI）的复杂后端系统更难让产品经理直接进行原型设计。如果功能是新推荐算法或数据管道变更，产品经理原型设计方法的适用范围较小。

但这些例外情况比大多数人意识到的要小。大多数公司的大多数产品工作是 UI 功能、工作流改进和面向用户的变更，拥有 [Claude Code](https://www.news.aakashg.com/p/how-to-use-claude-code-like-a-pro) 和 AI 友好代码库的产品经理可以在几小时内完成原型设计，而不是花费数周编写规格说明。

## 这对你的工作方式意味着什么

你不必在 Anthropic 工作也可以采用这种方法的部分内容。核心原则可以向下扩展。

如果你可以在编写规格说明之前原型化功能，那就这样做。原型成为规格说明。利益相关者对可工作的软件提供反馈而不是对文档提供反馈。反馈更具体、更有用，而且到达得更快。

如果你的代码库还不是 AI 友好的，开始为能够实现这一点的基础设施变更提出理由。[AI 原型设计](https://www.news.aakashg.com/p/ai-prototyping-tutorial) 只有在代码库配合时才有效。

如果你的公司仍然需要 PRD，在原型之后而不是之前编写 [PRD](https://www.news.aakashg.com/p/ai-prd)。记录你构建的内容以及原因。使用可工作的原型作为方法有效的证据。PRD 成为原型后的产物，而不是构建前的关卡。

实验数学不会说谎。每季度 13 倍的实验数量复合成学习优势，任何更好的规格说明写作都无法克服。最先弄明白这一点的公司会获胜。那些没有弄明白的公司将在未来两年里疑惑为什么竞争对手不断更快地发布产品。

---

**原文链接**: [https://aakashgupta.medium.com/anthropic-pms-dont-write-prds-they-build-the-first-version-themselves-it-s-working-2dd749420870](https://aakashgupta.medium.com/anthropic-pms-dont-write-prds-they-build-the-first-version-themselves-it-s-working-2dd749420870)

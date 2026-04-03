---
title: 规范不是免费的：为什么 AI 不会取代编程（但会改变它）
description: 讨论 AI 编程时代的规范即代码趋势，强调编写好的规范需要工程判断力
lastUpdated: 2026-04-03
author: Hugo Nogueira
origin_title: "Specs Are Not Free: Why AI Won't Replace Programming (It Will Transform It)"
original_url: "https://www.hugo.im/posts/specs-are-not-free"
tags:
  - AI
  - Programming
  - Agent Harness
categories:
  - Technology
cover: /images/specs-are-not-free.jpg
---

![封面图](https://raw.githubusercontent.com/chenzhenyang/chenzhenyang.github.io/gh-pages/images/specs-are-not-free.jpg)

**URL:** https://www.hugo.im/posts/specs-are-not-free

---

Matthias Georgi 关于 ["2026 年我们将停止编写代码"](https://www.linkedin.com/feed/update/urn:li:activity:7417153311512100864/) 的帖子今天引起了我的注意。它具体化了我过去一年在构建自主 agent 和 agent 基础设施时亲眼所见的东西。

他的论点很明确：我们正在从"code as spec"（代码即规范）转向"spec as code"（规范即代码）。我们将编写 specification（规范）并让 AI 生成代码，而不是编写实现细节。specification 成为事实的来源（source of truth）。这是一个令人信服的愿景，我认为它的方向是正确的。

可能的误读是认为这种转变使编程变得更容易。认为 spec 在某种程度上是免费的。认为我们终于可以跳过困难的部分了。我们不能，这实际上是个好消息。

## 规范的错觉

我们编写 spec 而不是代码的未来是真实的，但一个好的 spec 是工程判断的升华。它编码了对边缘情况（edge cases）、性能特征、故障模式（failure modes）、安全边界和集成约束的理解。

换句话说，它需要知道如何编程——不仅仅是如何输入语法，而是如何像工程师一样思考。

考虑这个看似简单的 spec："构建一个用户认证系统（user authentication system）"。

一个初级工程师（junior）读到它会想象一个登录表单。一个高级工程师（senior）读到它会立即考虑哈希算法、会话令牌轮换、速率限制、账户恢复流程、OAuth 提供商、日志记录和告警，以及 GDPR 等合规要求。AI 不会让这两者之间的差距消失。它让这个差距变得更加重要。

spec 不是简单的部分。spec 是我们过去隐藏在实现细节中的部分。现在它变得可见，这对这个工艺来说是健康的。

## Vibe Coding 与工程

有一个术语在流传："vibe coding"。快速发布，让 AI 去弄清楚，迭代直到它工作。对于原型来说，这确实非常强大。我已经在几小时内完成了原本需要几天时间的事情。创造的速度是真实的。

但这是我在将 AI agent 投入生产时学到的东西：vibe coding 创建的系统能工作直到不能工作为止，而当它们失败时，它们会以几乎无法调试的方式失败，因为对系统没有共同的理解。AI 生成的代码通过了测试，但在辅助函数中隐藏了 O(n²) 行为、吞没了错误、在边缘情况下泄漏内存，或者引入了只在真实流量下才会出现的竞态条件（race conditions）。

Vibe coding 是原型设计。工程是当它需要在凌晨 3 点工作时你所做的事情——当你不在场的时候。

## 上下文是一个生态系统

Matthias 的帖子引发的第二个见解是，上下文（context）远比我们承认的要大。大多数讨论都集中在"上下文窗口"（context windows）：我们可以向 AI 提供多少文本。但真正的软件上下文并不存在于一个文件中。上下文是一个生态系统。

系统存在于 Git 历史中，存在于争论权衡的 Slack 线程中，存在于告诉你用户实际做了什么与你预期什么的监控仪表板中，存在于记录故障模式的事件报告（incident reports）中，存在于从未有人写下来的隐性知识（tribal knowledge）中。没有 spec 能涵盖所有这些。没有上下文窗口足够大。

在这个新环境中茁壮成长的工程师不是那些编写聪明提示（prompts）的人，而是那些理解什么上下文重要、如何构建它、以及如何将其输入系统的人。这就是为什么我喜欢"context engineering"（上下文工程）这个术语。它是可操作的文档、可读的架构、可计算的知识。

## 编程变成什么

如果 AI 处理实现，那么程序员还需要做什么？

我们成为系统设计师。我们定义边界、契约（contracts）和接口（interfaces）。我们决定存在哪些组件以及它们如何通信。

我们成为故障工程师。我们预测可能出错的地方——不是通过查看语法，而是通过想象对抗场景、恢复路径和约束。这需要判断力，而判断力不是来自训练数据。

我们成为上下文架构师。我们构建系统知识，使人类和 AI 都能导航它。我们构建使"spec as code"工作的脚手架。

我们成为 AI 操作员。我们评估结果、调整约束，并处理 AI 自信地生成错误内容的情况。这不是更少的编程。这是更高层次抽象的编程。

## 真正的转变

这就是 Matthias 完全正确的地方：事实的来源（source of truth）正在转变。我们过去编写代码并从中推导行为。现在我们编写 spec 并从中推导代码。但 spec 不是自然语言的愿望清单。一个好的 spec 是精确的、完整的、可测试的，并且基于工程基础。

我们没有停止编程。我们改变了编程的含义。

这种变化有利于那些理解数据结构、系统设计、性能特征、故障模式和安全性的工程师。那些当你还可以 Google 语法时曾经感觉学术的东西。

AI 知道语法。它读过每一个 Stack Overflow 答案。它不知道在你的特定系统中什么重要，以及"工作"在你的特定上下文中意味着什么。那仍然是你的工作，而且是一直以来都很困难的工作。

## 机会

我对这种转变并不悲观。我因此充满能量。多年来，软件创建一直受到实现的瓶颈。绝妙的想法因为输入代码花费太长时间而消亡。AI 压缩了这个差距，这使工程师能够将更多时间花在概念、设计和正确性上。

能够蓬勃发展的工程师是那些能够清晰思考系统、精确指定他们想要什么、批判性评估他们得到的东西、并快速迭代走向正确性的人。

这些始终是真正的工程技能。我们只是在输入分号时练习它们。

现在我们直接练习它们。

你在 AI 辅助开发方面的经验是什么？我很好奇你是否发现它需要更多还是更少的工程判断力。在 [X](https://x.com/hugomn) 或 [LinkedIn](https://linkedin.com/in/hugomn) 上找到我。

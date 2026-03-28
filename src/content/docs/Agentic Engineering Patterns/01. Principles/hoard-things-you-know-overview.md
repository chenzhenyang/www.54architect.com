---
title: 囤积你知道如何做的事情
tags:
  - AI
  - Agentic Engineering
  - Learning
  - Programming
categories:
  - Technology
abbrlink: 2377411021
date: 2026-03-08 00:50:00
updated: 2026-03-08 00:50:00
sidebar: 
  order: 003
---

我与编码 agent 高效合作生产的许多建议，都是我在没有它们的职业生涯中发现有用的建议的延伸。这是一个很好的例子：**囤积你知道如何做的事情**。

构建软件技能的一个重要部分是理解什么是可能的，什么是不可能的，并且至少粗略地了解如何实现这些事情。

这些问题可以是广泛的，也可以是非常冷门的。网页可以仅用 JavaScript 运行 OCR 操作吗？iPhone 应用程序可以在应用程序不运行时与蓝牙设备配对吗？我们可以在 Python 中处理 100GB 的 JSON 文件而不先将整个文件加载到内存中吗？

你掌握的这类问题的答案越多，你就越有可能发现部署技术解决问题的机会，而其他人可能还没有想到。

知道某件事在理论上是可能的，与亲眼看到它完成是不一样的。作为软件专业人士要培养的关键资产是深入收集这类问题的答案，最好有运行代码说明。

我以多种方式囤积这样的解决方案。我的 [博客](https://simonwillison.net) 和 [TIL 博客](https://til.simonwillison.net) 挤满了我弄明白如何做的事情的笔记。我有 [一千多个 GitHub 仓库](https://github.com/simonw) 收集我为不同项目编写的代码，其中许多是小的概念验证，展示关键想法。

最近，我使用 LLM 帮助扩展我的代码解决方案集合，以解决有趣的问题。

[tools.simonwillison.net](https://tools.simonwillison.net) 是我最大的 LLM 辅助工具和原型集合。我用它来收集我所谓的 [HTML 工具](https://simonwillison.net/2025/Dec/10/html-tools/) —— 单个 HTML 页面，嵌入 JavaScript 和 CSS，解决特定问题。

我的 [simonw/research](https://github.com/simonw/research) 仓库有更大、更复杂的示例，我在其中挑战编码 agent 研究问题并带回工作代码和详细说明其发现的书面报告。

## 重新组合你囤积的东西

为什么要收集所有这些东西？除了帮助你和扩展你自己的能力之外，你在此过程中生成的资产成为你的编码 agent 的极其强大的输入。

我最喜欢的提示模式之一是告诉 agent 通过组合两个或更多现有工作示例来构建新东西。

一个有助于具体化这种有效性的项目是我添加到我的工具集合中的第一个东西——一个基于浏览器的 [OCR 工具](https://tools.simonwillison.net/ocr)，在 [这里更详细描述](https://simonwillison.net/2024/Mar/30/ocr-pdfs-images/)。

我想要一个基于浏览器的简单工具，用于对 PDF 文件的页面进行 OCR——特别是完全由扫描图像组成且根本没有提供文本版本的 PDF。

我之前试验过在浏览器中运行 [Tesseract.js OCR 库](https://tesseract.projectnaptha.com/)，发现它非常能干。该库提供成熟 Tesseract OCR 引擎的 WebAssembly 构建，并允许你从 JavaScript 调用它从图像中提取文本。

不过我不想处理图像，我想处理 PDF。然后我想起我也使用过 Mozilla 的 [PDF.js](https://mozilla.github.io/pdf.js/) 库，除其他功能外，它可以将 PDF 的单个页面转换为渲染图像。

我的笔记中有这两个库的 JavaScript 片段。

这是我输入到模型（当时是 Claude 3 Opus）的完整提示，结合了我的两个示例并描述了我正在寻找的解决方案：

这完美无缺！模型踢出了一个概念验证页面，完全符合我的需要。

我最终 [与它迭代了几次](https://gist.github.com/simonw/6a9f077bf8db616e44893a24ae1d36eb) 以达到我的最终结果，但只花了几分钟就构建了一个真正有用的工具，我从中受益至今。

## 编码 agent 使这更强大

我在 2024 年 3 月构建了那个 OCR 示例，比 Claude Code 的第一个发布早了近一年。编码 agent 使囤积工作示例更有价值。

如果你的编码 agent 有互联网访问，你可以告诉它做这样的事情：

（我在那里指定了 `curl`，因为 Claude Code 默认使用 WebFetch 工具，它总结页面内容而不是返回原始 HTML。）

编码 agent 擅长搜索，这意味着你可以在自己的机器上运行它们，并告诉它们在哪里找到你想要它们做的事情的示例：

这通常就足够了——agent 会启动一个搜索子 agent 来调查并拉回它实现任务所需的细节。

由于我的研究代码大部分都是公开的，我经常告诉编码 agent 克隆我的仓库到 `/tmp` 并将它们用作输入：

这里的关键想法是，编码 agent 意味着我们只需要弄清楚一个有用的技巧 **一次**。如果这个技巧随后在某个地方有工作代码示例记录，我们的 agent 可以咨询那个示例，并在未来用它解决任何类似形状的项目。

---

**原文链接**: https://simonwillison.net/guides/agentic-engineering-patterns/hoard-things-you-know-how-to-do/

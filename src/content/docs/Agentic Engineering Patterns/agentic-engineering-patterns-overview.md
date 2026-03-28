---
title: Agentic Engineering Patterns 概述
tags:
  - AI
  - Agent
  - Engineering
  - Patterns
categories:
  - Technology
abbrlink: 2014430881
date: 2026-03-07 00:15:00
updated: 2026-03-07 00:15:00
sidebar: 
  order: 0
---

2026 年 2 月 23 日

我开始了一个新项目，收集并记录 **Agentic Engineering Patterns** —— 编码实践和模式，帮助在这个新的编码 agent 开发时代获得最佳结果。

我使用 **Agentic Engineering** 来指代使用编码 agent 构建软件——像 Claude Code 和 OpenAI Codex 这样的工具，它们的定义特征是既可以生成也可以 _执行_ 代码——允许它们测试代码并独立于人类主管的逐步指导进行迭代。

我认为 **vibe coding** 使用其 [原始定义](https://simonwillison.net/2025/Mar/19/vibe-coding/)，即完全不注意代码的编码，今天通常与非程序员使用 LLM 编写代码相关联。

Agentic Engineering 代表了另一个极端：专业软件工程师使用编码 agent 通过放大现有专业知识来改进和加速他们的工作。

关于这个新学科有太多需要学习和探索！我已经发布了很多 [在我的 ai-assisted-programming 标签下](https://simonwillison.net/tags/ai-assisted-programming/)（345 篇并持续增加），但这相对非结构化。我的新目标是制作一些能帮助回答"我如何从中获得好结果"这个问题的内容。

我将在这里的博客上开发和扩展这个项目，作为一系列章节形状的模式，松散地受到 [Design Patterns: Elements of Reusable Object-Oriented Software](https://en.wikipedia.org/wiki/Design_Patterns) 在 1994 年推广的格式启发。

我今天发布了前两个章节：

* **[Writing code is cheap now](https://simonwillison.net/guides/agentic-engineering-patterns/code-is-cheap/)** 讨论了 agentic engineering 的核心挑战：生成初始工作代码的成本已降至几乎为零，这如何影响我们对如何工作的现有直觉，无论是个人还是团队？
* **[Red/green TDD](https://simonwillison.net/guides/agentic-engineering-patterns/red-green-tdd/)** 描述了测试优先开发如何帮助 agent 用最少的额外提示编写更简洁可靠的代码。

我希望以每周 1-2 章的速度添加更多章节。我真的不知道何时停止，有很多要涵盖！

#### 由我撰写，不是由 LLM

我有一个强烈的个人政策，不在自己的名义下发布 AI 生成的写作。这个政策也适用于 Agentic Engineering Patterns。我将使用 LLM 进行校对和充实示例代码以及各种其他辅助任务，但你在这里读到的文字将是我自己的。

#### 章节和指南

Agentic Engineering Patterns 不完全是 _一本书_，但它有点书的形式。我将在我的网站上使用我称之为 _guide_ 的新内容形式发布它。guide 是章节的集合，其中每个章节实际上是一篇博客文章，日期不太突出，旨在随时间更新，而不是在首次发布时冻结。

Guides 和 chapters 是我对在博客上发布"evergreen"内容的挑战的回答。我一直试图找到一种方法来做这件事。这感觉像是一个可能坚持的格式。

如果你对实现感兴趣，可以在 [Guide](https://github.com/simonw/simonwillisonblog/blob/b9cd41a0ac4a232b2a6c90ca3fff9ae465263b02/blog/models.py#L262-L280)、[Chapter](https://github.com/simonw/simonwillisonblog/blob/b9cd41a0ac4a232b2a6c90ca3fff9ae465263b02/blog/models.py#L349-L405) 和 [ChapterChange](https://github.com/simonw/simonwillisonblog/blob/b9cd41a0ac4a232b2a6c90ca3fff9ae465263b02/blog/models.py#L408-L423) 模型以及 [相关 Django 视图](https://github.com/simonw/simonwillisonblog/blob/b9cd41a0ac4a232b2a6c90ca3fff9ae465263b02/blog/views.py#L775-L923) 中找到代码，几乎所有这些都是由 Claude Opus 4.6 在通过我的 iPhone 访问的 Claude Code for web 中编写的。

---

**原文链接**: https://simonwillison.net/2026/Feb/23/agentic-engineering-patterns/

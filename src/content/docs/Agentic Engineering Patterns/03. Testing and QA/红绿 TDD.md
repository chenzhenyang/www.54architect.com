---
title: 红/绿 TDD
tags:
  - AI
  - Agentic Engineering
  - TDD
  - Testing
categories:
  - Technology
abbrlink: 1706620865
date: 2026-03-08 01:15:00
updated: 2026-03-08 01:15:00
sidebar: 
  order: 301
---

"使用红/绿 TDD"是一种令人愉快的简洁方式，可以从编码 agent 获得更好的结果。

TDD 代表测试驱动开发。这是一种编程风格，你确保编写的每一段代码都附有自动化测试，证明代码有效。

TDD 最严格的形式是测试优先开发。你先编写自动化测试，确认它们失败，然后迭代实现直到测试通过。

事实证明，这**非常适合**编码 agent。编码 agent 的一个重大风险是，它们可能会编写不起作用的代码，或者构建不必要且永远不会使用的代码，或者两者兼而有之。

测试优先开发有助于防止这两种常见错误，并确保一个强大的自动化测试套件，防止未来的回归。随着项目的增长，新更改可能破坏现有功能的机会也随之增长。全面的测试套件是保持这些功能工作的最有效方法。

在实现代码使其通过之前，确认测试失败很重要。如果你跳过这一步，你有风险构建一个已经通过的测试，因此无法练习和确认你的新实现。

这就是"红/绿"的含义：红色阶段观察测试失败，然后绿色阶段确认它们现在通过。

每个好模型都理解"红/绿 TDD"是更长的"使用测试驱动开发，先编写测试，在实现使其通过的更改之前确认测试失败"的简写。

示例提示：

```
Build a Python function to extract headers from a markdown string. Use red/green TDD.
```

（构建一个 Python 函数来从 markdown 字符串中提取标题。使用红/绿 TDD。）

---

**原文链接**: https://simonwillison.net/guides/agentic-engineering-patterns/red-green-tdd/

---
title: Agent 手动测试
tags:
  - AI - Technology
categories:
  - Technology
abbrlink: 2462961482
date: 2026-03-10 09:00:45
updated: 2026-03-10 09:00:45
sidebar: 
  order: 303
---

coding agent 的决定性特征是它能够**执行**它所编写的代码。这正是 coding agent 比那些只生成代码却无法验证的 LLM 更有用的原因。

**永远不要假设 LLM 生成的代码能工作，直到代码被执行过。**

Coding agent 有能力确认它们生成的代码是否按预期工作，或者继续迭代直到代码能工作。

让 agent**编写单元测试**，特别是使用测试优先的 TDD，是确保它们测试了所编写代码的强大方法。

但这不是唯一有效的方法。

即使代码通过了测试，也不意味着它按预期工作。任何做过自动化测试的人都见过测试全部通过但代码本身在某些明显方面失败的情况——它可能在启动时崩溃服务器，无法显示关键的 UI 元素，或者遗漏了测试未覆盖的某些细节。

自动化测试不能替代**手动测试**。我喜欢在将功能发布到发布版本之前亲眼看到它工作。

我发现让 agent 手动测试代码也很有价值，经常能发现自动化测试未发现的问题。

## Agent 手动测试的机制

Agent 如何"手动"测试代码取决于代码是什么。

### Python 库

对于 Python 库，一个有用的模式是 `python -c "... code ..."`。你可以将 Python 代码字符串（或多行字符串）直接传递给 Python 解释器，包括导入其他模块的代码。

Coding agent 都熟悉这个技巧，有时会在没有提示的情况下使用它。但提醒它们使用 `python -c` 进行测试通常很有效：

```bash
python -c "from mylib import func; print(func())"
```

### 其他语言

其他语言可能有类似的机制，如果没有，agent 快速写出演示文件然后编译运行也很快。我有时会鼓励它使用 `/tmp` 来避免这些文件后来被意外提交到仓库。

### Web API

我的许多项目涉及构建带有 JSON API 的 Web 应用程序。对于这些，我告诉 agent 使用 `curl` 来测试它们：

```bash
curl -X POST http://localhost:8000/api/endpoint -d '{"key": "value"}'
```

告诉 agent"探索"通常会导致它尝试新 API 的不同方面，可以快速覆盖大量领域。

如果 agent 通过手动测试发现不工作的东西，我喜欢让它们用 red/green TDD 修复。这确保新情况最终被永久自动化测试覆盖。

## 使用浏览器自动化进行 Web UI 测试

如果项目涉及交互式 Web UI，拥有手动测试程序就变得更有价值。

历史上这些很难从代码中测试，但过去十年在自动化真实浏览器方面取得了显著改进。对应用程序运行真实的 Chrome、Firefox 或 Safari 浏览器可以在真实环境中发现各种有趣的问题。

**Coding agent 非常擅长使用这些工具。**

### Playwright

今天最强大的是 **Playwright**，这是微软开发的开源库。Playwright 提供功能齐全的 API，支持多种流行编程语言，可以自动化任何流行的浏览器引擎。

简单地告诉你的 agent"用 Playwright 测试"可能就足够了。然后 agent 可以选择最合适的语言绑定，或使用 Playwright 的 `playwright-cli` 工具。

### agent-browser

Coding agent 与专用的 CLI 配合得很好。Vercel 的 **agent-browser** 是围绕 Playwright 构建的综合 CLI 包装器，专门为 coding agent 设计使用。

### Rodney

我自己的项目 **Rodney** 也有类似目的，虽然它使用 Chrome DevTools Protocol 直接控制 Chrome 实例。

这是我用来用 Rodney 测试的示例提示：

```bash
uvx rodney --help
# 然后使用 rodney screenshot 等命令
```

这个提示中有三个技巧：

1. **使用 `uvx rodney --help`** - 让 agent 通过 `uvx` 包管理工具运行 `rodney --help`，这会在第一次调用时自动安装 Rodney。

2. **`rodney --help` 命令** - 专门为 agent 设计，让它们了解和使用该工具所需的一切。

3. **"查看截图"** - 提示 agent 使用 `rodney screenshot` 命令，并提醒它可以使用自己的视觉能力来评估页面的视觉外观。

这是一个简短提示中包含的大量手动测试！

### Rodney 的功能

Rodney 和类似工具提供广泛的功能：
- 在加载的网站上运行 JavaScript
- 滚动、点击、输入
- 甚至读取页面的辅助功能树

与其他形式的手动测试一样，通过浏览器自动化发现并修复的问题也可以添加到永久自动化测试中。

### 浏览器测试的稳定性问题

许多开发人员过去避免过多的自动化浏览器测试，因为它们以不稳定著称——对页面 HTML 的最小调整都可能导致令人沮丧的测试失败浪潮。

让 coding agent 随时间维护这些测试大大减少了在 Web 界面设计变化时保持它们最新的摩擦。

## 让 agent 用 Showboat 做笔记

让 agent 手动测试代码可以发现额外的问题，但也可以用于创建有助于记录代码和演示如何测试的工件。

我对让 agent**展示它们的工作**这个挑战很着迷。能够看到演示或记录的实验是确认 agent 全面解决了所给挑战的非常有用的方式。

我构建了 **Showboat** 来促进构建捕捉 agent 手动测试流程的文档。

这是我经常使用的提示：

```bash
showboat --help
```

与上面的 Rodney 一样，`showboat --help` 命令教会 agent 什么是 Showboat 以及如何使用它。

### Showboat 的三个关键命令

1. **`note`** - 将 Markdown 笔记附加到 Showboat 文档
2. **`exec`** - 记录命令，然后运行该命令并记录输出
4. **`image`** - 向文档添加图片 - 对使用 Rodney 拍摄的 Web 应用程序截图很有用

**`exec` 命令是最重要的**，因为它捕获命令以及结果输出。这向你展示了 agent 做了什么以及结果是什么，旨在阻止 agent 作弊并将其**希望**发生的事情写入文档。

我发现 Showboat 模式非常适合记录我的 agent 会话期间完成的工作。我希望看到类似的模式在更广泛的工具集中被采用。

---

**原文**: https://simonwillison.net/guides/agentic-engineering-patterns/agentic-manual-testing/

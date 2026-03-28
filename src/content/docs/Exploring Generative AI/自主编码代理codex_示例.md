---
title: 自主编码代理：Codex 示例
tags:
  - AI
  - Technology
categories:
  - Technology
origin_title: 'Autonomous coding agents: A Codex example'
author: Martin Fowler
skill_id: f822e3ac265d
original_url: >-
  https://martinfowler.com/articles/exploring-gen-ai/autonomous-agents-codex-example.html
abbrlink: 1018842827
date: 2026-03-11 20:59:10
updated: 2026-03-11 20:59:10
sidebar: 
  order: 101
---

# 自主编码代理：Codex 示例

Birgitta 是 Thoughtworks 的杰出工程师（Distinguished Engineer）和 AI 辅助交付专家。她拥有超过 20 年的软件开发、架构师和技术领导者经验。

本文属于"探索生成式 AI（Exploring Gen AI）"系列。该系列记录了 Thoughtworks 技术专家探索将生成式 AI（gen ai）技术用于软件开发的过程。

2025 年 6 月 4 日

在过去的几周里，多个"自主后台编码代理（autonomous background coding agents）"相继发布。

- 监督式编码代理（Supervised coding agents）：由开发者驱动和指导的交互式聊天代理。在本地 IDE 中创建代码。工具示例：GitHub Copilot、Windsurf、Cursor、Cline、Roo Code、Claude Code、Aider、Goose、…
- 自主后台编码代理（Autonomous background coding agents）：无头（headless）代理，你可以派遣它们自主完成整个任务。代码在为该代理专门启动的环境中创建，通常结果是生成一个拉取请求（pull request）。其中一些也可以在本地运行。工具示例：OpenAI Codex、Google Jules、Cursor 后台代理、Devin、…
我给 OpenAI Codex 和其他一些代理分配了一个任务，看看能学到什么。以下是对一次特定 Codex 运行的记录，帮助你了解幕后情况并得出自己的结论，随后是我自己的一些观察。

## 任务

我们有一个名为 Haiven 的内部应用程序，用作软件交付提示库（prompt library）的演示前端，并在软件团队上尝试不同的 AI 辅助体验。该应用程序的代码是公开的。

我给 Codex 的任务是关于以下 UI 问题：

实际情况：

我希望代理实现的效果：

提示（Prompt）：当我们在仪表板上创建过滤标签时，我们会根据已有的类别创建人类可读的标签。"client-research"被转换为"Client-Research"，"deliveryManagement"被转换为"DeliveryManagement"。请改进"类别转人类可读（category-to-human-readable）"逻辑的复杂度，使标签向用户显示为"Client Research"和"Delivery Management"

```
When we create the filter labels on the dashboard, we create human readable labels based on the categories we have. "client-research" is turned into "Client-Research", "deliveryManagement" into "DeliveryManagement". Improve the sophistication of the "category-to-human-readable" logic so that the labels are appearing to the user as "Client Research" and "Delivery Management"
```

这个任务是

- 相对较小
- 典型的" cosmetic（外观修饰）"任务，不太紧急，可能会一再被降低优先级
## 代理日志

我在这里分享详细的日志，以便你能了解幕后正在发生的事情。

以下是 Codex 中日志视图的样子：

首先收集信息

前 17 条日志条目都是关于读取 AGENTS.md 和 README.md 的：

- "我需要检查仓库根目录中的 AGENTS.md 以获取指令。"
- 查找 AGENTS.md，但我实际上将其命名为 AGENT.md，这导致了一些来回反复，直到它弄明白
- 读取 README.md
- 查看 .pre-commit，找到一个测试设置
以下表格逐字列出了其余的日志消息。在这些消息之后，代理执行了一个命令，其中一些我添加了实际命令以供参考。我确信这些日志消息只是幕后实际发生的 token 的摘要，因为这些消息太短了，无法代表模型必须进行的完整"思考"。

使用大量 grep 搜索相关代码

```
grep
```

```
grep -R "human readable" -n
```

```
grep -R "human-readable" -n ui/src \| head
```

```
grep -R "Human" -n \| head
```

```
grep -R "human" app -n \| head
```

```
grep -R "human" app \| wc -l
```

```
wc
```

```
head
```

终于，接近目标了！标签之前是通过 CSS 粗略地大写的，它找到了

```
<br>root@0c5de6379b32:/workspace/haiven# grep -R "capitalize" -n ui/src \| head<br>ui/src/pages/index.js:250:                                    className="capital<br>ize"<br>ui/src/styles/globals.css:1915:.capitalize {<br>ui/src/styles/globals.css:1916:  text-transform: capitalize;<br>ui/src/styles/globals.css:1931:  text-transform: capitalize;<br>
```

现在它开始在 app 文件夹中检查更多相关代码，那里是后端所在。它没有找到任何内容，这是正确的，那里没有相关的内容

```
app
```

```
grep -R "categories" -n app \| head
```

```
grep -R "client" -n app \| head
```

```
grep -R "categories:" -n app/tests \| head
```

```
grep -R "client-research" -n
```

```
sed -n '1,100p' ui/src/app/_navigation_items.js
```

现在它回到 ui 文件夹中搜索——它之前找到了 CSS，现在正在寻找可以重用来解决任务的现有代码。这很好，因为我们确实已经有一个类似的函数，它找到了：

```
grep -R "to.*Readable" -n ui/src \| head
```

它现在发现了现有函数实现中的一个缺口：

更新它想要更改的函数的测试：

```
git status --short
```

你可以在 Codex 中配置一些环境启动命令，我将其配置为 yarn install，这导致了以下情况：

```
yarn install
```

```
git log --oneline -n 1
```

```
grep yarn .gitignore
```

```
cat ui/.gitignore
```

实际代码更改：

```
sed -n '1,30p' ...
```

```
git diff
```

接下来运行我们的代码 linter，很好：

```
cd ui && npx prettier -w ...
```

```
prettier
```

尝试运行测试——未成功：

```
Error: Not implemented: window.getComputedStyle(elt, pseudoElt)
```

开始偏离主题去设置 venv，这完全没有必要，因为它只计划更改前端代码：

放弃了测试，现在完成更改：

```
nl -ba ui/src/pages/index.js \| sed -n '12,28p'
```

以下是 Codex 创建的完整拉取请求（pull request）。

## 观察

### 暴力文本搜索

我发现有趣的是，Codex 和我使用的大多数其他编码助手越来越倾向于使用简单的文本搜索来查找相关代码。在上面的日志中，你可以看到 Codex 如何通过 grep 使用一堆搜索词来查找相关代码片段（"human"、"human readable"、"humanReadable"、…）。我觉得有趣的原因是，已经有很多看似更复杂的代码搜索机制被实现，比如使用向量/嵌入（vectors / embeddings）对代码库索引进行语义搜索（Cursor、GH Copilot、Windsurf），或使用抽象语法树（abstract syntax tree）作为起点（Aider、Cline）。后者仍然相当简单，但使用 grep 进行文本搜索是最简单的。

```
grep
```

似乎工具创作者发现这种简单的搜索毕竟仍然是最有效的——？或者他们在这里做了某种权衡，在简单性和有效性之间？

### 远程开发环境是这些代理"后台"工作的关键

以下是 Codex 环境配置屏幕的截图（截至 2025 年 5 月底）。截至目前，你可以配置容器镜像、环境变量、密钥和启动脚本。他们指出，在执行该启动脚本后，环境将不再能够访问互联网，这将沙箱化（sandbox）环境并减轻一些安全风险。

对于这些"自主后台代理"，为代理设置的远程开发环境（remote dev environment）的成熟度至关重要，这是一个棘手的挑战。例如在这种情况下，Codex 未能运行测试。

事实证明，当创建拉取请求时，确实有两个测试因回归（regression）而失败，这很遗憾，因为如果它知道的话，本可以轻松地修复测试，这是一个微不足道的修复：

这个名为 Haiven 的特定项目实际上有一个脚本化的开发者安全网，形式是相当详细的 .pre-commit 配置。（）如果代理能在创建拉取请求之前执行完整的 pre-commit，那就理想了。然而，要运行所有步骤，它需要运行

- Node 和 yarn（运行 UI 测试和前端 linter）
- Python 和 poetry（运行后端测试）
- Semgrep（用于安全相关的静态代码分析）
- Ruff（Python linter）
- Gitleaks（密钥扫描器）
……当然，所有这些都必须是正确的版本。

如果你想真正将这些代理"后台"运行而不是在开发者机器上运行，那么找出一种流畅的体验来为代理启动恰好合适的环境是这些代理产品的关键。这不是一个新问题，在某种程度上已经是一个已解决的问题，毕竟我们一直在 CI 流水线中这样做。但这也不简单，目前我的印象是，环境成熟度在大多数这些产品中仍然是一个问题，而且配置和测试环境设置的用户体验与 CI 流水线一样令人沮丧，甚至更糟。

### 解决方案质量

我在 OpenAI Codex 中运行了相同的提示 3 次，在 Google 的 Jules 中运行了 1 次，在 Claude Code 中本地运行了 2 次（虽然它不是完全自主的，我需要手动对所有内容说"是"）。尽管这是一个相对简单的任务和解决方案，但结果之间存在质量差异。

首先是好消息，代理每次都提出了一个可行的解决方案（撇开破坏性回归测试不谈，老实说我并没有实际运行每一个解决方案来确认）。我认为这个任务是生成式 AI 代理已经能够很好地独立工作的任务类型和大小的一个很好的例子。但在解决方案质量方面有两个方面存在差异：

- 发现可重用的现有代码：在此日志中你会发现 Codex 发现了一个现有组件，即"动态数据渲染器（dynamic data renderer）"，它已经具有将技术键（technical keys）转换为人类可读版本的功能。在我进行的 6 次运行中，只有 2 次相应的代理发现了这段代码。在其他 4 次中，代理创建了一个带有新函数的新文件，这导致了代码重复。
- 发现应该使用此逻辑的额外位置：团队目前正在开发一个新功能，也在下拉菜单中向用户显示类别名称。在 6 次运行中的 1 次中，代理实际上发现了这一点，并建议也更改该位置以使用新功能。
我将这些结果放入一个表格中，以说明在分配给代理的每个任务中，我们有多个质量维度，即我们希望"正确"的事情。每次代理运行都可能在其中一个或多个维度上"出错"，维度越多，代理按照我们想要的方式完成所有事情的可能性就越低。

### 沉没成本谬误（Sunk cost fallacy）

我一直在想——假设一个团队将后台代理用于这类任务，即那些有点小、既不重要也不紧急的任务类型。Haiven 是一个面向内部的应用程序，目前只分配了两名开发者，所以这类外观修饰修复实际上被认为是低优先级的，因为它会占用开发者的精力去做更重要的事情。当代理只是部分成功而不是完全成功时——团队会在什么情况下丢弃拉取请求，在什么情况下会投入时间完成最后 20%，即使在这上面花费精力已经被降低优先级？这让我想知道我们最终可能会得到多少未优先处理的尾部工作。

最新文章（3 月 4 日）：

软件工程循环中的人类与代理（Humans and Agents in Software Engineering Loops）

上一篇文章：

使用 LLM 构建自定义工具（Building Custom Tooling with LLMs）

下一篇文章：

我仍然关心代码（I still care about the code）
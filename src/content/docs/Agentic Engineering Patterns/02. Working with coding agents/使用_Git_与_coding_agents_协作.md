---
title: 使用 Git 与 coding agents 协作
description: 详解如何在使用 coding agents 时有效使用 Git，包括分支策略、commit 管理和代码审查
origin_title: Using Git with coding agents - Agentic Engineering Patterns - Simon Willison's Weblog
author: Simon Willison
tags:
  - AI
  - Agent
  - Git
  - Programming
categories:
  - Technology
lastUpdated: 2026-04-01
skill_id: c3697bef
generated: 2026-04-01T15:15:00
original_url: https://simonwillison.net/guides/agentic-engineering-patterns/using-git-with-coding-agents/
---

Git 是与 coding agents（编码智能体）协作的关键工具。将代码保存在版本控制系统中，可以记录代码随时间的变化，并调查和撤销任何错误。所有的 coding agents 都能熟练使用 Git 的各种功能，包括基础功能和高级功能。

这种熟练度意味着我们可以在使用 Git 时更加雄心勃勃。我们不需要记住如何用 Git 做事情的*具体方法*，但了解什么是可能的，就能充分利用 Git 的全部能力。

## Git 基础 [#](/guides/agentic-engineering-patterns/using-git-with-coding-agents/#git-essentials)

每个 Git 项目都生活在一个**repository**（仓库）中——这是一个磁盘上的文件夹，可以跟踪其中文件的变化。这些变化被记录在**commits**（提交）中——这是带时间戳的文件变更包，包含一个或多个文件的修改，附有描述这些变化的**commit message**（提交信息）和记录创建者的**author**（作者）。

Git 支持**branches**（分支），允许你独立构建和尝试新的变更。分支在准备就绪后可以通过各种方法**merged**（合并）回主分支。

Git 仓库可以被**cloned**（克隆）到新机器上，克隆包含当前文件和完整的变更历史。这意味着开发者或 coding agents 可以浏览和探索历史记录，无需额外的网络流量，让历史探索几乎零成本。

Git 仓库可以只存在于你的机器上，但 Git 的设计目的是通过发布到**remote**（远程仓库）来支持协作和备份，远程仓库可以是公开的或私有的。GitHub 是最流行的远程仓库托管平台，但 Git 是开源软件，可以在任何支持 Git 协议的机器或服务上托管这些远程仓库。

## 核心概念和提示词 [#](/guides/agentic-engineering-patterns/using-git-with-coding-agents/#core-concepts-and-prompts)

Coding agents 都对 Git 术语有深入理解。以下提示词适用于任何 coding agent：

将 agent 工作的文件夹变成 Git 仓库——agent 可能会运行 `git init` 命令。如果你只说"repo"，agents 会默认你指的是 Git 仓库。

创建一个新的 Git commit 来记录 agent 所做的变更——通常使用 `git commit -m "commit message"` 命令。

这将为你的仓库配置 GitHub。你需要先使用 [github.com/new](https://github.com/new) 创建一个新仓库，并配置你的机器与 GitHub 通信。

或者"recent changes"（最近的变更）或"last three commits"（最近三次提交）。

这是开启全新 coding agents 会话的好方法。告诉 agent 查看最近的变更会让它运行 `git log`，可以立即用你最近工作的细节加载它的上下文——包括修改的代码和描述这些代码的提交信息。

以这种方式种子化会话意味着你可以开始讨论那段代码——建议额外的修复、询问它如何工作，或提出建立在前人工作基础上的下一个变更。

在主分支上运行这个命令从远程仓库获取其他贡献，或者在分支中运行以集成主分支的最新变更。

有多种合并变更的方法，包括 merge（合并）、rebase（变基）、squash（压缩）或 fast-forward（快进）。如果你记不住这些方法的细节也没关系：

Agents 很擅长解释不同合并策略的优缺点，而且 Git 中的一切都可以撤销，所以尝试新事物的风险很小。

我惊讶地发现我经常使用这个通用提示词！这是一个 [最近的例子](https://gisthost.github.io/?2aa2ee2fbd08d272528bbfc3b54a1a7d/page-001.html)，它帮我修复了一个因合并冲突而失败的 cherry-pick（拣选）。

有很多方法会让你在 Git 中陷入混乱，通常是因为 pull 或 rebase 命令导致合并冲突，或者只是把错误的东西添加到了 Git 的暂存区。

解决这些问题曾经是 Git 工作中最困难和最耗时的部分。但现在不一样了！Coding agents 可以驾驭最复杂的合并冲突，推理新代码的意图，找出保留什么以及如何组合冲突的变更。如果你的代码有自动化测试（而且 [应该有](https://simonwillison.net/guides/agentic-engineering-patterns/red-green-tdd/)），agent 可以在最终确定合并之前确保测试通过。

如果你丢失了之前已提交（或用 `git stash` 保存）的工作代码，你的 agent 可能会帮你找到它。

Git 有一个称为 `reflog` 的机制，通常可以捕获未提交到永久分支的代码细节。Agents 可以搜索它，也可以搜索其他分支。

只需告诉他们要找什么，然后看着他们深入挖掘。

Git bisect 是 Git 工具库中最强大的调试工具之一，但它有相对陡峭的学习曲线，常常让开发者望而却步。

当你运行 bisect 操作时，你向 Git 提供某种测试条件以及起始和结束 commit 范围。然后 Git 运行二分查找来识别测试条件失败的最早 commit。

这可以有效地回答"是什么首先导致了这个 bug"的问题。唯一的缺点是需要以 Git bisect 可以执行的格式表达 bug 的测试。

Coding agents 可以为你处理这个样板工作。这将 Git bisect 从偶尔使用的工具升级为你可以随时部署的工具，只要你对软件的历史行为感到好奇。

## 重写历史 [#](/guides/agentic-engineering-patterns/using-git-with-coding-agents/#rewriting-history)

让我们来聊聊有趣的高级内容。

Git 仓库的提交历史不是固定的。毕竟数据只是磁盘上的文件（藏在隐藏的 `.git/` 目录中），而 Git 本身提供了可以用来修改该历史的工具。

不要将 Git 历史视为实际发生事情的永久记录——而是将其视为一个精心创作的故事，描述软件项目的进展。

这个历史是辅助未来开发的工具。永久记录错误和取消的方向有时很有用，但仓库作者可以做出编辑决定，决定保留什么以及如何最好地捕捉这段历史。

Coding agents 非常擅长使用 Git 的高级历史重写功能。

### 撤销或重写提交 [#](/guides/agentic-engineering-patterns/using-git-with-coding-agents/#undo-or-rewrite-commits)

提交代码然后后悔是很常见的——例如意识到它包含了你不想包含的文件。这个情况的 Git 解决方案是 `git reset --soft HEAD~1`。我从来记不住这个，现在我不需要了！

你还可以对提交进行更精细的操作——例如重写它们以仅删除单个文件。

Agents 可以重写提交信息，也可以将多个提交合并为一个单元。

我发现前沿模型通常在提交信息方面有很好的品味。我曾经坚持自己写这些信息，但我已经接受它们产生的质量通常足够好，甚至经常比我自己写的更好。

### 从旧仓库的碎片构建新仓库 [#](/guides/agentic-engineering-patterns/using-git-with-coding-agents/#building-a-new-repository-from-scraps-of-an-older-one)

我发现自己经常使用的一个技巧是从较大的仓库中提取代码到新的仓库，同时保持该代码的关键历史。

一个常见的例子是库提取。我可能在一个项目中构建了一些类和函数，后来意识到它们作为独立的可重用代码库会更有意义。

这种操作过去涉及的内容足够多，以至于大多数开发者会创建一个与旧提交历史分离的全新副本。我们不再需要满足于那样了！

---

**原文链接**: [https://simonwillison.net/guides/agentic-engineering-patterns/using-git-with-coding-agents/](https://simonwillison.net/guides/agentic-engineering-patterns/using-git-with-coding-agents/)

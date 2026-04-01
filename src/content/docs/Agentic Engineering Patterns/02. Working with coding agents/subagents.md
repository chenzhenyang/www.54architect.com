---
title: 子智能体（Subagents）
description: 详解 subagent 模式，如何创建和管理子智能体来并行处理复杂任务
origin_title: Subagents - Agentic Engineering Patterns - Simon Willison's Weblog
author: Simon Willison
tags:
  - AI
  - Agent
  - Programming
categories:
  - Technology
lastUpdated: 2026-04-01
skill_id: cf8f5ac2
generated: 2026-04-01T15:25:00
original_url: https://simonwillison.net/guides/agentic-engineering-patterns/subagents/
---

LLM（大型语言模型）受到其**上下文限制**（context limit）的约束——即它们在工作记忆中任何时刻能容纳多少 token。尽管 LLM 自身的能力在过去两年中有了显著提升，但这些数值并没有大幅增加——它们通常上限在 1,000,000 token 左右，而且基准测试经常报告在 200,000 token 以下时结果质量更好。

仔细管理上下文使其适应这些限制，对于从模型获得出色结果至关重要。

**子智能体**（Subagents）提供了一种简单而有效的方法来处理更大的任务，而不会消耗编码智能体（coding agent）宝贵的顶级上下文。

当编码智能体使用子智能体时，它实际上是分派了一个自己的全新副本来实现指定目标，并拥有一个从全新提示词（prompt）开始的新上下文窗口。

## Claude Code 的 Explore 子智能体 [#](/guides/agentic-engineering-patterns/subagents/#claude-codes-explore-subagent)

Claude Code 在其标准工作流程中广泛使用子智能体。让我们以此为例进行说明。

每当你在现有代码仓库（repo）上启动新任务时，Claude Code 首先需要探索该仓库，以了解其整体结构并找到完成任务所需的相关信息。

它通过构建一个提示词并分派一个子智能体来执行该探索任务，然后返回其发现的描述。

我用来自[我指南中的一页](https://simonwillison.net/guides/agentic-engineering-patterns/linear-walkthroughs/changes/)的截图和以下提示词启动了一个 Claude Code 会话：

> Make the chapter diffs also show which characters have changed in this diff view with a darker color of red or green for the individually changed segments of text within the line

这是该会话的[记录](https://gisthost.github.io/?effbdc564939b88fe5c6299387e217da/index.html)。

Claude Code 首先运行了一个"Explore"子智能体，带有以下初始提示词：

> Find the code that implements the diff view for "chapters" in this Django blog. I need to find:
> 
>   1. Templates that render diffs (look for diff-related HTML/CSS with red/green backgrounds)
>   2. Python code that generates diffs (look for difflib usage or similar)
>   3. Any JavaScript related to diff rendering
>   4. CSS styles for the diff view (red/green line backgrounds)
> 

> 
> Search thoroughly - check templates/, static/, blog/ directories. Look for keywords like "diff", "chapter", "revision", "history", "compare".

子智能体的工作方式类似于任何其他工具调用：父智能体（parent agent）分派它们就像分派任何其他工具一样，然后等待响应。有趣的是观察模型如何以这种方式提示自己——它们通常在提示策略方面有良好的品味。

Explore 子智能体运行了几秒钟后返回了一个响应，开头如下：

> Perfect! Now let me create a comprehensive summary with all the findings:
> 
> ### Summary: Chapter Diff View Implementation [#](/guides/agentic-engineering-patterns/subagents/#summary-chapter-diff-view-implementation)
> 
> I found the complete implementation of the diff view for chapters in this Django blog. Here are the key components:
> 
> #### 1\. **Python Code - Diff Generation** (`/home/user/simonwillisonblog/guides/views.py`, lines 139-202) [#](/guides/agentic-engineering-patterns/subagents/#1-python-code-diff-generation-homeusersimonwillisonblogguidesviewspy-lines-139-202)
> 
> The `chapter_changes()` view function uses Python's built-in `difflib.unified_diff()` to generate diffs: […]

完整的子智能体响应包含了父智能体开始编辑代码以解决我原始请求所需的所有细节。

## 并行子智能体 [#](/guides/agentic-engineering-patterns/subagents/#parallel-subagents)

这个 Explore 子智能体是子智能体如何工作的最简单示例，父智能体在子智能体运行时暂停。这种子智能体的主要优势在于它可以使用全新的上下文，从而避免从父智能体的可用限制中消耗 token。

子智能体还可以通过让父智能体同时运行多个子智能体来提供显著的性能提升，还可能使用更快、更便宜的模型（如 Claude Haiku）来加速这些任务。

支持子智能体的编码智能体可以根据你的指令使用它们。尝试这样的提示词：

    Use subagents to find and update all of the templates that are affected by this change.

对于涉及编辑多个文件且这些文件彼此不依赖的任务，这可以提供显著的速度提升。

## 专业子智能体 [#](/guides/agentic-engineering-patterns/subagents/#specialist-subagents)

某些编码智能体允许子智能体运行进一步的自定义配置，通常采用自定义系统提示词（system prompt）或自定义工具，或两者兼有，这使得这些子智能体能够承担不同的角色。

这些角色可以涵盖各种有用的专业领域：

  * **代码审查员**（code reviewer）智能体可以审查代码并识别设计中的 bug、功能缺失或弱点。
  * **测试运行器**（test runner）智能体可以运行测试。如果你的测试套件庞大且详细，这尤其值得，因为子智能体可以向主编码智能体隐藏完整的测试输出，仅报告任何失败的详细信息。
  * **调试器**（debugger）智能体可以专注于调试问题，花费其 token 配额推理代码库并运行代码片段，以帮助隔离重现步骤并确定 bug 的根本原因。

虽然人们可能会过度热衷于将任务分解到数十个不同的专业子智能体中，但重要的是要记住，子智能体的主要价值在于保护宝贵的根上下文（root context）并管理 token 密集的操作。只要根编码智能体有足够的 token 配额，它完全能够调试或审查自己的输出。

## 官方文档 [#](/guides/agentic-engineering-patterns/subagents/#official-documentation)

几个流行的编码智能体都支持子智能体，每个都有自己的使用文档：


---

**原文链接**: [https://simonwillison.net/guides/agentic-engineering-patterns/subagents/](https://simonwillison.net/guides/agentic-engineering-patterns/subagents/)

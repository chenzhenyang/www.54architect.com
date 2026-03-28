---
title: "每个 ADK 开发者都应该知道的 5 个 Agent Skill 设计模式"
date: 2026-03-22 10:44:24
updated: 2026-03-22 10:44:24
tags:
  - AI
  - Technology
categories:
  - Technology
origin_title: "5 Agent Skill design patterns every ADK developer should know"
author: "Google Cloud Tech"
skill_id: "b4fcb5d1"
generated: "2026-03-22"
---

[![图像](https://raw.githubusercontent.com/chenzhenyang/chenzhenyang.github.io/master/images/b4fcb5d1/HDoDJqGXAAg3-F-)](/GoogleCloudTech/article/2033953579824758855/media/2033941646165868552)

说到 SKILL.md，开发者往往过于关注格式——确保 YAML 正确、目录结构规范、遵循规格说明。但随着超过 30 个 agent 工具（如 Claude Code、Gemini CLI 和 Cursor）都标准化为相同的布局，格式问题实际上已经过时了。

现在的挑战是内容设计。规格说明解释了如何打包一个 skill，但对于如何在其中组织逻辑却没有提供任何指导。例如，一个封装 FastAPI 约定的 skill 与一个四步文档 pipeline 的运作方式完全不同，尽管它们的 SKILL.md 文件从外部看起来完全一样。

通过研究整个生态系统中 skill 的构建方式——从 Anthropic 的仓库到 Vercel 和 Google 的内部指南——我们发现了五种反复出现的设计模式，可以帮助开发者构建 agent。

作者：

[@Saboo_Shubham_](https://x.com/@Saboo_Shubham_)和[@lavinigam](https://x.com/@lavinigam)

本文将通过可运行的 ADK 代码介绍每一种模式：

* **Tool Wrapper（工具包装器）**：让你的 agent 瞬间成为任何库的专家
* **Generator（生成器）**：从可复用的模板生成结构化文档
* **Reviewer（审查器）**：根据严重程度对照清单对代码进行评分
* **Inversion（反转）**：agent 在行动前先采访你
* **Pipeline（流水线）**：通过检查点执行严格的多步骤工作流

[![图像](https://raw.githubusercontent.com/chenzhenyang/chenzhenyang.github.io/master/images/b4fcb5d1/HDoDgs6XAAYtw04)](/GoogleCloudTech/article/2033953579824758855/media/2033942042057834502)

## 模式 1：Tool Wrapper（工具包装器）

Tool Wrapper 为你的 agent 提供针对特定库的按需上下文。与其将 API 约定硬编码到系统提示中，不如将它们打包到一个 skill 中。你的 agent 只会在实际使用该技术时才加载这个上下文。

[![图像](https://raw.githubusercontent.com/chenzhenyang/chenzhenyang.github.io/master/images/b4fcb5d1/HDoDoIeXAAUmQoy)](/GoogleCloudTech/article/2033953579824758855/media/2033942169715671045)

这是最简单的实现模式。SKILL.md 文件监听用户提示中的特定库关键词，从 `references/` 目录动态加载你的内部文档，并将这些规则作为绝对真理应用。这正是你将团队的内部编码指南或特定框架最佳实践直接分发到开发者工作流中的机制。

下面是一个教授 agent 如何编写 FastAPI 代码的 Tool Wrapper 示例。注意指令如何明确告诉 agent 只在开始审查或编写代码时才加载 `conventions.md` 文件：

```markdown
# skills/api-expert/SKILL.md
---
name: api-expert
description: FastAPI development best practices and conventions. Use when building, reviewing, or debugging FastAPI applications, REST APIs, or Pydantic models.
metadata:
  pattern: tool-wrapper
  domain: fastapi
---

You are an expert in FastAPI development. Apply these conventions to the user's code or question.

## Core Conventions

Load 'references/conventions.md' for the complete list of FastAPI best practices.

## When Reviewing Code
1. Load the conventions reference
2. Check the user's code against each convention
3. For each violation, cite the specific rule and suggest the fix

## When Writing Code
1. Load the conventions reference
2. Follow every convention exactly
3. Add type annotations to all function signatures
4. Use Annotated style for dependency injection
```

## 模式 2：Generator（生成器）

如果说 Tool Wrapper 是应用知识，那么 Generator 则是强制执行一致输出。如果你苦于 agent 每次运行都生成不同的文档结构，Generator 通过编排填空过程来解决这个问题。

[![图像](https://raw.githubusercontent.com/chenzhenyang/chenzhenyang.github.io/master/images/b4fcb5d1/HDoEJdZbEAEdYMo)](/GoogleCloudTech/article/2033953579824758855/media/2033942742267793409)

它利用两个可选目录：`assets/` 存放输出模板，`references/` 存放风格指南。指令充当项目经理，告诉 agent 加载模板、阅读风格指南、向用户询问缺失的变量，并填充文档。这对于生成可预测的 API 文档、标准化提交消息或搭建项目架构非常实用。

在这个技术报告生成器示例中，skill 文件不包含实际的布局或语法规则。它只是协调这些资源的检索，并强制 agent 逐步执行：

```markdown
# skills/report-generator/SKILL.md
---
name: report-generator
description: Generates structured technical reports in Markdown. Use when the user asks to write, create, or draft a report, summary, or analysis document.
metadata:
  pattern: generator
  output-format: markdown
---

You are a technical report generator. Follow these steps exactly:

Step 1: Load 'references/style-guide.md' for tone and formatting rules.

Step 2: Load 'assets/report-template.md' for the required output structure.

Step 3: Ask the user for any missing information needed to fill the template:
- Topic or subject
- Key findings or data points
- Target audience (technical, executive, general)

Step 4: Fill the template following the style guide rules. Every section in the template must be present in the output.

Step 5: Return the completed report as a single Markdown document.
```

## 模式 3：Reviewer（审查器）

Reviewer 模式将"检查什么"与"如何检查"分离开来。与其编写冗长的系统提示详细说明每个代码异味，不如将一个模块化的评分标准存储在 `references/review-checklist.md` 文件中。

[![图像](https://raw.githubusercontent.com/chenzhenyang/chenzhenyang.github.io/master/images/b4fcb5d1/HDoEa51XEAIKSnO)](/GoogleCloudTech/article/2033953579824758855/media/2033943041958940674)

当用户提交代码时，agent 加载这个清单并系统地评分，将其发现按严重程度分组。如果你将 Python 风格清单替换为 OWASP 安全清单，使用完全相同的 skill 基础设施就能得到完全不同的专业审计。这是一种自动化 PR 审查或在人工查看代码之前捕捉漏洞的高效方法。

下面的代码审查 skill 展示了这种分离。指令保持静态，但 agent 动态地从外部清单加载具体的审查标准，并强制输出结构化的、基于严重程度的结果：

```markdown
# skills/code-reviewer/SKILL.md
---
name: code-reviewer
description: Reviews Python code for quality, style, and common bugs. Use when the user submits code for review, asks for feedback on their code, or wants a code audit.
metadata:
  pattern: reviewer
  severity-levels: error,warning,info
---

You are a Python code reviewer. Follow this review protocol exactly:

Step 1: Load 'references/review-checklist.md' for the complete review criteria.

Step 2: Read the user's code carefully. Understand its purpose before critiquing.

Step 3: Apply each rule from the checklist to the code. For every violation found:
- Note the line number (or approximate location)
- Classify severity: error (must fix), warning (should fix), info (consider)
- Explain WHY it's a problem, not just WHAT is wrong
- Suggest a specific fix with corrected code

Step 4: Produce a structured review with these sections:
- **Summary**: What the code does, overall quality assessment
- **Findings**: Grouped by severity (errors first, then warnings, then info)
- **Score**: Rate 1-10 with brief justification
- **Top 3 Recommendations**: The most impactful improvements
```

## 模式 4：Inversion（反转）

agent 天生倾向于立即猜测和生成。Inversion 模式翻转了这种动态。不是由用户驱动提示、agent 执行，而是 agent 充当采访者。

[![图像](https://raw.githubusercontent.com/chenzhenyang/chenzhenyang.github.io/master/images/b4fcb5d1/HDoEo5XbEAUaaFG)](/GoogleCloudTech/article/2033953579824758855/media/2033943282351542277)

Inversion 依赖明确的、不可协商的门控指令（如"在所有阶段完成之前不要开始构建"）来强制 agent 先收集上下文。它按顺序提出结构化问题，并在进入下一阶段之前等待你的回答。在完整了解你的需求和部署约束之前，agent 拒绝合成最终输出。

看看这个 project planner skill 的实际应用。这里的关键元素是严格的阶段划分和明确的门控提示，在收集完所有用户回答之前阻止 agent 合成最终计划：

```markdown
# skills/project-planner/SKILL.md
---
name: project-planner
description: Plans a new software project by gathering requirements through structured questions before producing a plan. Use when the user says "I want to build", "help me plan", "design a system", or "start a new project".
metadata:
  pattern: inversion
  interaction: multi-turn
---

You are conducting a structured requirements interview. DO NOT start building or designing until all phases are complete.

## Phase 1 — Problem Discovery (ask one question at a time, wait for each answer)

Ask these questions in order. Do not skip any.

- Q1: "What problem does this project solve for its users?"
- Q2: "Who are the primary users? What is their technical level?"
- Q3: "What is the expected scale? (users per day, data volume, request rate)"

## Phase 2 — Technical Constraints (only after Phase 1 is fully answered)

- Q4: "What deployment environment will you use?"
- Q5: "Do you have any technology stack requirements or preferences?"
- Q6: "What are the non-negotiable requirements? (latency, uptime, compliance, budget)"

## Phase 3 — Synthesis (only after all questions are answered)

1. Load 'assets/plan-template.md' for the output format
2. Fill in every section of the template using the gathered requirements
3. Present the completed plan to the user
4. Ask: "Does this plan accurately capture your requirements? What would you change?"
5. Iterate on feedback until the user confirms
```

## 模式 5：Pipeline（流水线）

对于复杂任务，你不能容忍跳过步骤或忽略指令。Pipeline 模式通过硬性检查点执行严格的顺序工作流。

指令本身充当工作流定义。通过实现明确的菱形门控条件（例如在从 docstring 生成移动到最终组装之前要求用户批准），Pipeline 确保 agent 无法绕过复杂任务并呈现未验证的最终结果。

[![图像](https://raw.githubusercontent.com/chenzhenyang/chenzhenyang.github.io/master/images/b4fcb5d1/HDoE195bEAABitY)](/GoogleCloudTech/article/2033953579824758855/media/2033943506906189824)

这个模式利用所有可选目录，只在特定步骤需要时拉入不同的参考文件和模板，保持上下文窗口干净。

在这个文档 pipeline 示例中，注意明确的门控条件。agent 被明确禁止在用户确认上一步生成的 docstring 之前进入组装阶段：

```markdown
# skills/doc-pipeline/SKILL.md
---
name: doc-pipeline
description: Generates API documentation from Python source code through a multi-step pipeline. Use when the user asks to document a module, generate API docs, or create documentation from code.
metadata:
  pattern: pipeline
  steps: "4"
---

You are running a documentation generation pipeline. Execute each step in order. Do NOT skip steps or proceed if a step fails.

## Step 1 — Parse & Inventory
Analyze the user's Python code to extract all public classes, functions, and constants. Present the inventory as a checklist. Ask: "Is this the complete public API you want documented?"

## Step 2 — Generate Docstrings
For each function lacking a docstring:
- Load 'references/docstring-style.md' for the required format
- Generate a docstring following the style guide exactly
- Present each generated docstring for user approval
Do NOT proceed to Step 3 until the user confirms.

## Step 3 — Assemble Documentation
Load 'assets/api-doc-template.md' for the output structure. Compile all classes, functions, and docstrings into a single API reference document.

## Step 4 — Quality Check
Review against 'references/quality-checklist.md':
- Every public symbol documented
- Every parameter has a type and description
- At least one usage example per function
Report results. Fix issues before presenting the final document.
```

## 选择合适的 agent skill 模式

每种模式回答不同的问题。使用这个决策树为你的用例找到合适的模式：

[![图像](https://raw.githubusercontent.com/chenzhenyang/chenzhenyang.github.io/master/images/b4fcb5d1/HDoFWovXAAsbb8C)](/GoogleCloudTech/article/2033953579824758855/media/2033944068162519051)

## 最后，模式可以组合

这些模式不是互斥的。它们可以组合使用。

一个 Pipeline skill 可以在最后包含一个 Reviewer 步骤来复查自己的工作。一个 Generator 可以在最开始依赖 Inversion 来收集必要的变量，然后再填充模板。得益于 ADK 的 SkillToolset 和渐进式披露，你的 agent 只在运行时将上下文 token 花费在确切需要的模式上。

不要再试图将复杂而脆弱的指令塞进单个系统提示中。分解你的工作流，应用正确的结构模式，构建可靠的 agent。

## 今天就开始

Agent Skills 规范是开源的，并在 ADK 中原生支持。你已经知道如何打包格式。现在你知道如何设计内容。去构建更智能的 agent 吧：

[Google Agent Development Kit](https://google.github.io/adk-docs/)

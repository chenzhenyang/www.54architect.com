---
title: 'Claude Agent Skills: A First Principles Deep Dive'
description: '---'
tags:
- AI
- Technology
categories:
- Technology
lastUpdated: 2026-04-15
skill_id: 82b7d290
generated: 2026-04-15 13:36:27.580951
original_url: https://leehanchung.github.io/blogs/2025/10/26/claude-skills-deep-dive/
---
Claude 的 Agent `Skills`（技能）系统代表了一种复杂的基于提示词的元工具（meta-tool）架构，它通过专门的指令注入来扩展 LLM 的能力。与传统的函数调用或代码执行不同，`skills` 通过**提示词扩展**（prompt expansion）和**上下文修改**（context modification）来改变 Claude 处理后续请求的方式，而无需编写可执行代码。

本深度解析从第一性原理出发，解构了 Claude 的 Agent `Skills` 系统，记录了一种名为"`Skill`"的工具如何作为元工具将领域特定的提示词注入到对话上下文中。我们将以 `skill-creator` 和 `internal-comms` 技能为案例研究， walkthrough 完整的生命周期，从文件解析到 API 请求结构再到 Claude 的决策过程。

# Claude Agent Skills 概述

Claude 使用 `Skills` 来提升执行特定任务的能力。`Skills` 被定义为包含指令、脚本和资源的文件夹，Claude 可以在需要时加载它们。Claude 使用**声明式的、基于提示词的系统**进行技能发现和调用。AI 模型（Claude）根据系统提示词中呈现的文本描述来决定是否调用 `skills`。**在代码层面没有算法化的 skill 选择或 AI 驱动的意图检测**。决策完全发生在 Claude 的推理过程中，基于所提供的技能描述。

`Skills` 不是可执行代码。它们**不**运行 Python 或 JavaScript，背后也没有 HTTP 服务器或函数调用。它们也没有硬编码到 Claude 的系统提示词中。`Skills` 存在于 API 请求结构的独立部分。

那么它们是什么？`Skills` 是专门的提示词模板，将领域特定的指令注入到对话上下文中。当调用一个技能时，它会同时修改对话上下文（通过注入指令提示词）和执行上下文（通过更改工具权限和可能切换模型）。技能不是直接执行操作，而是扩展为详细的提示词，让 Claude 准备好解决特定类型的问题。每个技能在 Claude 看到的工具模式（tool schema）中显示为动态添加项。

当用户发送请求时，Claude 会收到三样东西：用户消息、可用工具（Read、Write、Bash 等）和 `Skill` 工具。`Skill` 工具的描述包含一个格式化列表，列出了每个可用技能的 `name`、`description` 和其他字段的组合。Claude 阅读这个列表，并使用其原生语言理解能力将你的意图与技能描述进行匹配。如果你说"帮我创建一个日志技能"，Claude 会看到 `internal-comms` 技能的描述（"当用户想要使用其公司喜欢的格式编写内部通讯时"），识别出匹配项，并使用 `command: "internal-comms"` 调用 `Skill` 工具。

> **术语说明**：
> 
>   * **`Skill` tool**（大写 S）= 管理所有技能的元工具。它与 Read、Write、Bash 等一起出现在 Claude 的 `tools` 数组中。
>   * **skills**（小写 s）= 单独的技能，如 `pdf`、`skill-creator`、`internal-comms`。这些是 `Skill` 工具加载的专门指令模板。

以下是 Claude 如何使用 `skills` 的更直观表示：

![Claude Skill Flowchart](/assets/img/2025-10-26/01-claude-skill-1.png)

技能选择机制在代码层面没有算法路由或意图分类。Claude Code 不使用嵌入、分类器或模式匹配来决定调用哪个技能。相反，系统将所有可用技能格式化为嵌入在 `Skill` 工具提示词中的文本描述，让 Claude 的语言模型做出决策。这是纯粹的 LLM 推理。没有正则表达式，没有关键词匹配，没有基于机器学习的意图检测。决策发生在 Claude 通过 transformer 的前向传播中，而不是在应用程序代码中。

当 Claude 调用一个技能时，系统遵循一个简单的工作流程：加载一个 markdown 文件（`SKILL.md`），将其扩展为详细的指令，将这些指令作为新的用户消息注入到对话上下文中，修改执行上下文（允许的工具、模型选择），然后在这个丰富的环境中继续对话。这与执行并返回结果的传统工具有根本不同。技能是_让 Claude 准备好_解决问题，而不是直接解决问题。

以下表格有助于更好地区分 Tools 和 Skills 及其能力：

| 方面                | 传统工具                      | 技能                                               |
|---------------------|-------------------------------|----------------------------------------------------|
| **执行模型**        | 同步、直接                    | 提示词扩展                                         |
| **目的**            | 执行特定操作                  | 指导复杂工作流程                                   |
| **返回值**          | 即时结果                      | 对话上下文 + 执行上下文变更                        |
| **示例**            | `Read`、`Write`、`Bash`       | `internal-comms`、`skill-creator`                  |
| **并发性**          | 通常安全                      | 非并发安全                                         |
| **类型**            | 各种                          | 始终为 `"prompt"`                                  |

# 构建 Agent Skills

现在让我们通过研究 Anthropic 技能仓库中的 [`skill-creator` Skill](https://github.com/anthropics/skills/tree/main/skill-creator) 作为案例，深入了解如何构建 Skills。提醒一下，agent `skills` 是有组织的指令、脚本和资源文件夹，agent 可以发现并动态加载它们以更好地执行特定任务。`Skills` 通过将你的专业知识打包成可组合的资源来扩展 Claude 的能力，将通用 agent 转变为适合你需求的专用 agent。

> **关键洞察**：Skill = 提示词模板 + 对话上下文注入 + 执行上下文修改 + 可选数据文件和 Python 脚本

每个 `Skill` 都定义在一个名为 `SKILL.md`（不区分大小写）的 markdown 文件中，并可选择捆绑存储在 `/scripts`、`/references` 和 `/assets` 下的文件。这些捆绑文件可以是 Python 脚本、shell 脚本、字体定义、模板等。以 `skill-creator` 为例，它包含 `SKILL.md`、`LICENSE.txt`（许可证），以及 `/scripts` 文件夹下的几个 Python 脚本。`skill-creator` 没有任何 `/references` 或 `/assets`。

![skill-creator package](/assets/img/2025-10-26/03-claude-skill-package.png)

技能从多个来源发现和加载。Claude Code 扫描用户设置（`~/.config/claude/skills/`）、项目设置（`.claude/skills/`）、插件提供的技能和内置技能，以构建可用技能列表。对于 Claude Desktop，我们可以按以下方式上传自定义技能。

![Claude Desktop Skill](/assets/img/2025-10-26/02-claude-desktop-skill.png)

> **注意**：构建 Skills 最重要的概念是**渐进式披露**（Progressive Disclosure）—— 显示足够的信息来帮助 agent 决定下一步做什么，然后在需要时揭示更多细节。对于 `agent skills` 来说：
> 
>   1. 披露 Frontmatter：最小化（name、description、license）
>   2. 如果选择了 `skill`，加载 SKILL.md：全面但专注
>   3. 然后在 `skill` 执行时加载辅助资源、references 和 scripts

## 编写 SKILL.md

`SKILL.md` 是技能提示词的核心。它是一个 markdown 文件，遵循两部分结构 —— frontmatter 和内容。frontmatter 配置技能如何运行（权限、模型、元数据），而 markdown 内容告诉 Claude 做什么。[Frontmatter](https://docs.github.com/en/contributing/writing-for-github-docs/using-yaml-frontmatter) 是用 YAML 编写的 markdown 文件的头部。

```
┌─────────────────────────────────────┐
│ 1. YAML Frontmatter (Metadata)      │ ← 配置
│    ---                              │
│    name: skill-name                 │
│    description: Brief overview      │
│    allowed-tools: "Bash, Read"      │
│    version: 1.0.0                   │
│    ---                              │
├─────────────────────────────────────┤
│ 2. Markdown Content (Instructions)  │ ← Claude 的提示词
│                                     │
│    Purpose explanation              │
│    Detailed instructions            │
│    Examples and guidelines          │
│    Step-by-step procedures          │
└─────────────────────────────────────┘
```

### Frontmatter

frontmatter 包含控制 Claude 如何发现和使用技能的元数据。例如，以下是 `skill-creator` 的 frontmatter：

```yaml
---
name: skill-creator
description: Guide for creating effective skills. This skill should be used when users want to create a new skill (or update an existing skill) that extends Claude's capabilities with specialized knowledge, workflows, or tool integrations.
license: Complete terms in LICENSE.txt
---
```

让我们逐一了解 frontmatter 的字段。

![Claude Skills Frontmatter](/assets/img/2025-10-26/04-claude-skill-frontmatter.png)

#### `name`（必填）

不言自明。`skill` 的名称。`skill` 的 `name` 在 `Skill Tool` 中用作 `command`。

> `skill` 的 `name` 在 `Skill Tool` 中用作 `command`。

#### `description`（必填）

`description` 字段提供技能功能的简要摘要。这是 Claude 用来确定何时调用技能的主要信号。在上面的示例中，描述明确说明"This skill should be used when users want to create a new skill"——这种清晰的、面向行动的语言帮助 Claude 将用户意图与技能能力相匹配。

系统会自动在描述后附加来源信息（例如 `"(plugin:skills)"`），这有助于在加载多个技能时区分来自不同来源的技能。

#### `when_to_use`（未记录文档——可能已弃用或未来功能）

> **⚠️ 重要说明**：`when_to_use` 字段在代码库中广泛出现，但**未在任何官方 Anthropic 文档中记录**。此字段可能是：
> 
>   * 正在逐步淘汰的已弃用功能
>   * 尚未正式支持的内部/实验性功能
>   * 尚未发布的计划功能
> 
> **建议**：依赖详细的 `description` 字段。在 `when_to_use` 出现在官方文档之前，避免在生产技能中使用它。

尽管没有记录文档，以下是 `when_to_use` 目前在代码库中的工作方式：

```javascript
function formatSkill(skill) {
  let description = skill.whenToUse
    ? `${skill.description} - ${skill.whenToUse}`
    : skill.description;

  return `"${skill.name}": ${description}`;
}
```

当存在时，`when_to_use` 会用连字符分隔符附加到描述中。例如：

```
"skill-creator": Create well-structured, reusable skills... - When user wants to build a custom skill package with scripts, references, or assets
```

这个组合字符串是 Claude 在 Skill 工具提示词中看到的。但是，由于此行为未记录文档，它可能会在未来的版本中更改或删除。更安全的方法是将使用指导直接包含在 `description` 字段中，如上面的 `skill-creator` 示例所示。

#### `license`（可选）

不言自明。

`allowed-tools` 字段定义技能可以在没有用户批准的情况下使用哪些工具，类似于 Claude 的 allowed-tools。

这是一个逗号分隔的字符串，被解析为允许的工具名称数组。你可以使用通配符来限定权限范围，例如 `Bash(git:*)` 只允许 git 子命令，而 `Bash(npm:*)` 允许所有 npm 操作。skill-creator 技能使用 `"Read,Write,Bash,Glob,Grep,Edit"` 来获得广泛的文件和搜索能力。一个常见的错误是列出每个可用工具，这会创建安全风险并破坏安全模型。

> 只包含你的技能实际需要的工具——如果你只是读写文件，`"Read,Write"` 就足够了。

```yaml
# ✅ skill-creator 允许多个工具
allowed-tools: "Read,Write,Bash,Glob,Grep,Edit"

# ✅ 仅限特定 git 命令
allowed-tools: "Bash(git status:*),Bash(git diff:*),Bash(git log:*),Read,Grep"

# ✅ 仅限文件操作
allowed-tools: "Read,Write,Edit,Glob,Grep"

# ❌ 不必要的攻击面
allowed-tools: "Bash,Read,Write,Edit,Glob,Grep,WebSearch,Task,Agent"

# ❌ 包含所有 npm 命令的不必要的攻击面
allowed-tools: "Bash(npm:*),Read,Write"
```

#### `model`（可选）

`model` 字段定义技能可以使用哪个模型。它默认继承用户会话中的当前模型。对于代码审查等复杂任务，技能可以请求更强大的模型，如 Claude Opus 或其他 OSS 中文模型。IYKYK。

```yaml
model: "claude-opus-4-20250514"  # 使用特定模型
model: "inherit"                 # 使用会话的当前模型（默认）
```

#### `version`、`disable-model-invocation` 和 `mode`（可选）

技能支持三个可选的 frontmatter 字段用于版本控制和调用控制。`version` 字段（例如 version: "1.0.0"）是一个元数据字段，用于跟踪技能版本，从 frontmatter 解析，但主要用于文档和技能管理目的。

`disable-model-invocation` 字段（布尔值）防止 Claude 通过 `Skill` 工具自动调用技能。当设置为 true 时，该技能将从显示给 Claude 的列表中排除，只能由用户通过 `/skill-name` 手动调用，使其适用于需要明确用户控制的危险操作、配置命令或交互式工作流程。

`mode` 字段（布尔值）将技能分类为修改 Claude 行为或上下文的"模式命令"。当设置为 true 时，该技能出现在技能列表顶部的特殊"Mode Commands"部分（与常规实用技能分开），使其对于建立特定操作上下文或工作流程的技能（如 debug-mode、expert-mode 或 review-mode）更加突出。

### SKILL.md 提示词内容

在 frontmatter 之后是 markdown 内容 —— 当调用 `skill` 时 Claude 收到的实际提示词。这是你定义 `skill` 的行为、指令和工作流程的地方。编写有效技能提示词的关键是保持它们专注并使用渐进式披露：在 SKILL.md 中提供核心指令，并引用外部文件获取详细内容。

以下是推荐的内容结构：

```markdown
---
# Frontmatter here
---

# [简短目的陈述 - 1-2 句话]

## Overview
[此技能的功能、何时使用、提供什么]

## Prerequisites
[所需工具、文件或上下文]

## Instructions

### Step 1: [第一个操作]
[指令性指令]
[示例（如需要）]

### Step 2: [下一个操作]
[指令性指令]

### Step 3: [最终操作]
[指令性指令]

## Output Format
[如何构建结果]

## Error Handling
[出现问题时该怎么办]

## Examples
[具体使用示例]

## Resources
[引用 scripts/、references/、assets/（如果捆绑）]
```

例如，`skill-creator` 技能包含以下指令，指定创建技能所需的工作流程的每个步骤。

```markdown
## Skill Creation Process

### Step 1: Understanding the Skill with Concrete Examples
### Step 2: Planning the Reusable Skill Contents
### Step 3: Initializing the Skill
### Step 4: Edit the Skill
### Step 5: Packaging a Skill
```

当 Claude 调用此技能时，它会收到整个提示词作为新指令，并 prepended 基础目录路径。`{baseDir}` 变量解析为技能的安装目录，允许 Claude 使用 Read 工具加载引用文件：`Read({baseDir}/scripts/init_skill.py)`。这种模式保持主提示词简洁，同时使详细文档可按需获取。

**提示词内容的最佳实践：**

* 保持在 5,000 字以下（约 800 行），以避免上下文过载
* 使用指令性语言（"Analyze code for…"）而非第二人称（"You should analyze…"）
* 引用外部文件获取详细内容，而不是嵌入所有内容
* 对路径使用 `{baseDir}`，不要硬编码绝对路径，如 `/home/user/project/`

```
❌ Read /home/user/project/config.json
✅ Read {baseDir}/config.json
```

当调用技能时，Claude 只能访问 `allowed-tools` 中指定的工具，如果在 frontmatter 中指定，模型可能会被覆盖。技能的基础目录路径会自动提供，使捆绑资源可访问。

### 捆绑资源与你的技能

当你捆绑支持资源与 SKILL.md 一起时，`Skills` 变得强大。标准结构使用三个目录，每个目录都有特定目的：

```
my-skill/
├── SKILL.md              # 核心提示词和指令
├── scripts/              # 可执行的 Python/Bash 脚本
├── references/           # 加载到上下文中的文档
└── assets/               # 模板和二进制文件
```

**为什么要捆绑资源？** 保持 SKILL.md 简洁（5,000 字以下）可以防止 Claude 的上下文窗口过载。捆绑资源让你可以提供详细文档、自动化脚本和模板，而不会使主提示词膨胀。Claude 只在需要时使用渐进式披露加载它们。

#### `scripts/` 目录

`scripts/` 目录包含 Claude 通过 Bash 工具运行的可执行代码——自动化脚本、数据处理器、验证器或执行确定性操作的代码生成器。

例如，`skill-creator` 的 SKILL.md 引用脚本如下：

```markdown
When creating a new skill from scratch, always run the `init_skill.py` script. The script conveniently generates a new template skill directory that automatically includes everything a skill requires, making the skill creation process much more efficient and reliable.

Usage:

```scripts/init_skill.py <skill-name> --path <output-directory>```

The script:
  - Creates the skill directory at the specified path
  - Generates a SKILL.md template with proper frontmatter and TODO placeholders
  - Creates example resource directories: scripts/, references/, and assets/
  - Adds example files in each directory that can be customized or deleted
```

当 Claude 看到此指令时，它会执行 `python {baseDir}/scripts/init_skill.py`。`{baseDir}` 变量自动解析为技能的安装路径，使技能在不同环境中可移植。

**使用 scripts/ 进行：** 复杂的多步骤操作、数据转换、API 交互或任何需要比自然语言更精确逻辑表达的任务。

#### `references/` 目录

`references/` 目录存储 Claude 在引用时读取到其上下文中的文档。这是文本内容——markdown 文件、JSON 模式、配置模板或 Claude 完成任务所需的任何文档。

例如，`mcp-creator` 的 SKILL.md 引用引用如下：

```markdown
#### 1.4 Study Framework Documentation

**Load and read the following reference files:**

- **MCP Best Practices**: [📋 View Best Practices](./reference/mcp_best_practices.md) - Core guidelines for all MCP servers

**For Python implementations, also load:**
- **Python SDK Documentation**: Use WebFetch to load `https://raw.githubusercontent.com/modelcontextprotocol/python-sdk/main/README.md`
- [🐍 Python Implementation Guide](./reference/python_mcp_server.md) - Python-specific best practices and examples

**For Node/TypeScript implementations, also load:**
- **TypeScript SDK Documentation**: Use WebFetch to load `https://raw.githubusercontent.com/modelcontextprotocol/typescript-sdk/main/README.md`
- [⚡ TypeScript Implementation Guide](./reference/node_mcp_server.md) - Node/TypeScript-specific best practices and examples
```

当 Claude 遇到这些指令时，它会使用 Read 工具：`Read({baseDir}/references/mcp_best_practices.md)`。内容被加载到 Claude 的上下文中，提供详细信息而不会使 SKILL.md 混乱。

**使用 references/ 进行：** 详细文档、大型模式库、检查清单、API 模式或任何对 SKILL.md 来说过于冗长但对任务必要的文本内容。

#### `assets/` 目录

`assets/` 目录包含 Claude 按路径引用但不加载到上下文中的模板和二进制文件。将此视为技能的静态资源——HTML 模板、CSS 文件、图像、配置样板或字体。

在 SKILL.md 中：

```markdown
Use the template at {baseDir}/assets/report-template.html as the report structure.
Reference the architecture diagram at {baseDir}/assets/diagram.png.
```

Claude 看到文件路径但不读取内容。相反，它可能会将模板复制到新位置，填写占位符，或在生成的输出中引用路径。

**使用 assets/ 进行：** HTML/CSS 模板、图像、二进制文件、配置模板或任何 Claude 按路径操作而不是读取到上下文中的文件。

`references/` 和 `assets/` 之间的关键区别在于：

* **references/**：通过 Read 工具加载到 Claude 上下文中的文本内容
* **assets/**：仅按路径引用的文件，不加载到上下文中

这种区别对上下文管理很重要。`references/` 中的 10KB markdown 文件在加载时会消耗上下文令牌。`assets/` 中的 10KB HTML 模板不会。Claude 只知道路径存在。

> **最佳实践：** 始终对路径使用 `{baseDir}`，不要硬编码绝对路径。这使技能在用户环境、项目目录和不同安装之间可移植。

### 常见技能模式

与所有工程一样，理解常见模式有助于设计有效的技能。以下是工具集成和工作流程设计最有用的模式。

#### 模式 1：脚本自动化

**用例：** 需要多个命令或确定性逻辑的复杂操作。

此模式将计算任务卸载到 `scripts/` 目录中的 Python 或 Bash 脚本。技能提示词告诉 Claude 执行脚本并处理其输出。

![Claude Skill Script Automation](/assets/img/2025-10-26/09-script-automation.png)

**SKILL.md 示例：**

```markdown
Run scripts/analyzer.py on the target directory:

`python {baseDir}/scripts/analyzer.py --path "$USER_PATH" --output report.json`

Parse the generated `report.json` and present findings.
```

**所需工具：**

```yaml
allowed-tools: "Bash(python {baseDir}/scripts/*:*), Read, Write"
```

**用例：** 文件转换和数据处理。

最简单的模式——读取输入，按照指令转换它，写入输出。适用于格式转换、数据清理或报告生成。

![Claude Skill Read Process Write](/assets/img/2025-10-26/10-read-process-write.png)

**SKILL.md 示例：**

```markdown
## Processing Workflow
1. Read input file using Read tool
2. Parse content according to format
3. Transform data following specifications
4. Write output using Write tool
5. Report completion with summary
```

**所需工具：**

```yaml
allowed-tools: "Read, Write"
```

#### 模式 3：搜索 - 分析 - 报告

**用例：** 代码库分析和模式检测。

使用 Grep 搜索代码库中的模式，读取匹配文件获取上下文，分析发现，并生成结构化报告。或者，搜索企业数据存储库获取数据，分析检索的数据获取信息，并生成结构化报告。

![Claude Skill Search Analyze Report](/assets/img/2025-10-26/06-search-analyze-report.png)

**SKILL.md 示例：**

```markdown
## Analysis Process
1. Use Grep to find relevant code patterns
2. Read each matched file
3. Analyze for vulnerabilities
4. Generate structured report
```

**所需工具：**

```yaml
allowed-tools: "Grep, Read"
```

#### 模式 4：命令链执行

**用例：** 具有依赖关系的多步骤操作。

执行一系列命令，其中每个步骤都依赖于前一个步骤的成功。常见于 CI/CD 类似的工作流程。

![Claude Skill Command Chain Execution](/assets/img/2025-10-26/05-command-chain-execution.png)

**SKILL.md 示例：**

```markdown
Execute analysis pipeline:
npm install && npm run lint && npm test

Report results from each stage.
```

**所需工具：**

```yaml
allowed-tools: "Bash(npm install:*), Bash(npm run:*), Read"
```

#### 向导式多步骤工作流程

**用例：** 需要在每个步骤进行用户输入的复杂流程。

将复杂任务分解为离散的步骤，每个阶段之间进行明确的用户确认。适用于设置向导、配置工具或引导流程。

**SKILL.md 示例：**

```markdown
## Workflow

### Step 1: Initial Setup
1. Ask user for project type
2. Validate prerequisites exist
3. Create base configuration
Wait for user confirmation before proceeding.

### Step 2: Configuration
1. Present configuration options
2. Ask user to choose settings
3. Generate config file
Wait for user confirmation before proceeding.

### Step 3: Initialization
1. Run initialization scripts
2. Verify setup successful
3. Report results
```

#### 基于模板的生成

**用例：** 从存储在 `assets/` 中的模板创建结构化输出。

加载模板，用用户提供或生成的数据填充占位符，然后写入结果。常见于报告生成、样板代码创建或文档。

**SKILL.md 示例：**

```markdown
## Generation Process
1. Read template from {baseDir}/assets/template.html
2. Parse user requirements
3. Fill template placeholders:
   - {{NAME}} → user-provided name
   - {{SUMMARY}} → generated summary
   - {{DATE}} → current date
4. Write filled template to output file
5. Report completion
```

#### 迭代优化

**用例：** 需要多次传递且深度递增的流程。

首先执行广泛的分析，然后对识别的问题进行 progressively 更深入的挖掘。适用于代码审查、安全审计或质量分析。

**SKILL.md 示例：**

```markdown
## Iterative Analysis

### Pass 1: Broad Scan
1. Search entire codebase for patterns
2. Identify high-level issues
3. Categorize findings

### Pass 2: Deep Analysis
For each high-level issue:
1. Read full file context
2. Analyze root cause
3. Determine severity

### Pass 3: Recommendation
For each finding:
1. Research best practices
2. Generate specific fix
3. Estimate effort

Present final report with all findings and recommendations.
```

#### 上下文聚合

**用例：** 结合来自多个来源的信息以建立全面理解。

从不同文件和工具收集数据，综合成连贯的图景。适用于项目摘要、依赖分析或影响评估。

**SKILL.md 示例：**

```markdown
## Context Gathering
1. Read project README.md for overview
2. Analyze package.json for dependencies
3. Grep codebase for specific patterns
4. Check git history for recent changes
5. Synthesize findings into coherent summary
```

# Agent Skills 内部架构

在介绍了概述和构建过程之后，我们现在可以检查技能在底层是如何工作的。技能系统通过元工具架构运行，其中名为 `Skill` 的工具充当所有单独技能的容器和调度器。这种设计在实现和目的上将技能与传统工具根本区分开来。

> `Skill` 工具是一个管理所有技能的元工具

## Skills 对象设计

像 `Read`、`Bash` 或 `Write` 这样的传统工具执行离散的操作并返回即时结果。技能的操作方式不同。技能不是直接执行操作，而是将专门的指令注入到对话历史中，并动态修改 Claude 的执行环境。这是通过两个用户消息完成的——一个包含对用户可见的元数据，另一个包含对 UI 隐藏但发送给 Claude 的完整技能提示词——并通过改变 agent 的上下文来更改权限、切换模型和调整思考令牌参数，以便在技能使用期间。

![Claude Skill Execution Flow](/assets/img/2025-10-26/08-claude-skill-execution-flow.png)

| 特性                              | 普通工具                   | 技能工具                                          |
|-----------------------------------|----------------------------|---------------------------------------------------|
| **本质**                          | 直接操作执行器             | 提示词注入 + 上下文修改器                         |
| **消息角色**                      | assistant → tool_use       | assistant → tool_use Skill                        |
|                                   | user → tool_result         | user → tool_result                                |
|                                   |                            | user → skill prompt ← 注入！                      |
| **复杂度**                        | 简单（3-4 条消息）          | 复杂（5-10+ 条消息）                              |
| **上下文**                        | 静态                       | 动态（每轮修改）                                  |
| **持久性**                        | 仅工具交互                 | 工具交互 + 技能提示词                             |
| **令牌开销**                      | 最小（约 100 令牌）         | 显著（每轮约 1,500+ 令牌）                        |
| **用例**                          | 简单、直接任务             | 复杂、引导式工作流程                              |

复杂度是巨大的。普通工具生成简单的消息交换——一个 assistant 工具调用后跟一个 user 结果。技能注入多条消息，在动态修改的上下文中操作，并携带显著的令牌开销以提供指导 Claude 行为的专门指令。

理解 `Skill` 元工具的工作原理揭示了该系统的机制。让我们检查其结构：

```javascript
Pd = {
  name: "Skill",  // 工具名称常量：$N = "Skill"

  inputSchema: {
    command: string  // 例如："pdf", "skill-creator"
  },

  outputSchema: {
    success: boolean,
    commandName: string
  },

  // 🔑 关键字段：这生成技能列表
  prompt: async () => fN2(),

  // 验证和执行
  validateInput: async (input, context) => { /* 5 个错误代码 */ },
  checkPermissions: async (input, context) => { /* allow/deny/ask */ },
  call: async *(input, context) => { /* 生成消息 + 上下文修改器 */ }
}
```

`prompt` 字段将 Skill 工具与 `Read` 或 `Bash` 等其他工具区分开来，后者具有静态描述。Skill 工具不使用固定字符串，而是使用动态提示词生成器，在运行时通过聚合所有可用技能的名称和描述来构建其描述。这实现了**渐进式披露**——系统仅将最小元数据（技能名称和来自 frontmatter 的描述）加载到 Claude 的初始上下文中，提供足够的信息让模型决定哪个技能匹配用户的意图。完整的技能提示词仅在 Claude 做出选择后加载，防止上下文膨胀同时保持可发现性。

```javascript
async function fN2() {
  let A = await atA(),
    {
      modeCommands: B,
      limitedRegularCommands: Q
    } = vN2(A),
    G = [...B, ...Q].map((W) => W.userFacingName()).join(", ");
  l(`Skills and commands included in Skill tool: ${G}`);
  let Z = A.length - B.length,
    Y = nS6(B),
    J = aS6(Q, Z);
  return `Execute a skill within the main conversation

<skills_instructions>
When users ask you to perform tasks, check if any of the available skills below can help complete the task more effectively. Skills provide specialized capabilities and domain knowledge.

How to use skills:
- Invoke skills using this tool with the skill name only (no arguments)
- When you invoke a skill, you will see <command-message>The "{name}" skill is loading</command-message>
- The skill's prompt will expand and provide detailed instructions on how to complete the task
- Examples:
  - \`command: "pdf"\` - invoke the pdf skill
  - \`command: "xlsx"\` - invoke the xlsx skill
  - \`command: "ms-office-suite:pdf"\` - invoke using fully qualified name

Important:
- Only use skills listed in <available_skills> below
- Do not invoke a skill that is already running
- Do not use this tool for built-in CLI commands (like /help, /clear, etc.)
</skills_instructions>

<available_skills>
${Y}${J}
</available_skills>
`;
}
```

与某些助手（如 ChatGPT）的系统提示词中生活的一些工具不同，Claude **agent skills 不存在于系统提示词中**。它们作为 `Skill` 工具描述的一部分存在于 `tools` 数组中。各个技能的名称表示为 `Skill` 元工具输入模式的 `command` 字段的一部分。为了更好地可视化它的样子，这是实际的 API 请求结构：

```json
{
  "model": "claude-sonnet-4-5-20250929",
  "system": "You are Claude Code, Anthropic's official CLI...",  // ← 系统提示词
  "messages": [
    {"role": "user", "content": "Help me create a new skill"},
    // ... 对话历史
  ],
  "tools": [  // ← 发送给 Claude 的工具数组
    {
      "name": "Skill",  // ← 元工具
      "description": "Execute a skill...\n\n<skills_instructions>...\n\n<available_skills>\n...",
      "input_schema": {
        "type": "object",
        "properties": {
          "command": {
            "type": "string",
            "description": "The skill name (no arguments)"  // ← 单独技能的名称
          }
        }
      }
    },
    {
      "name": "Bash",
      "description": "Execute bash commands...",
      // ...
    },
    {
      "name": "Read",
      // ...
    }
    // ... 其他工具
  ]
}
```

`<available_skills>` 部分存在于 Skill 工具的描述中，并为每个 API 请求重新生成。系统通过聚合来自用户和项目配置的当前加载技能、插件提供的技能和任何内置技能来动态构建此列表，默认令牌预算限制为 15,000 个字符。此预算约束迫使技能作者编写简洁的描述，并确保工具描述不会压倒模型的上下文窗口。

## 技能对话和执行上下文注入设计

大多数 LLM API 支持 `role: "system"` 消息，理论上可以携带系统提示词。事实上，OpenAI 的 ChatGPT 在其系统提示词中携带其默认工具，包括用于记忆的 `bio`、用于任务调度的 `automations`、用于控制 canvas 的 `canmore`、用于图像生成的 `img_gen`、`file_search`、`python` 和用于互联网搜索的 `web`。最后，工具提示词占其系统提示词中令牌计数的约 90%。如果我们有很多工具和/或技能要加载到上下文中，这可能是有用的，但很难高效。

但是，系统消息具有不同的语义，使它们不适合技能。系统消息设置贯穿整个对话持久存在的全局上下文，以比用户指令更高的权限影响所有后续轮次。

技能需要临时的、范围化的行为。`skill-creator` 技能应该只影响技能创建相关任务，而不是将 Claude 转变为会话其余部分的永久 PDF 专家。使用 `role: "user"` 与 `isMeta: true` 使技能提示词对 Claude 显示为用户输入，使其对当前交互临时和本地化。技能完成后，对话返回正常对话上下文和执行上下文，没有残留的行为修改。

像 `Read`、`Write` 或 `Bash` 这样的普通工具有简单的通信模式。当 Claude 调用 `Read` 时，它发送一个文件路径，接收文件内容，然后继续工作。用户在他们的转录中看到"Claude 使用了 Read 工具"，这就足够了。工具做了一件事，返回了一个结果，这就是交互的结束。技能的操作方式根本不同。技能不是执行离散操作并返回结果，而是注入全面的指令集，修改 Claude 如何推理和处理任务。这创建了一个普通工具从未面临的设计挑战：用户需要透明地了解哪些技能正在运行以及它们在做什么，而 Claude 需要详细的、可能冗长的指令来执行技能。如果用户在他们的聊天转录中看到完整的技能提示词，UI 会变得混乱，充满数千字的内部 AI 指令。如果技能激活完全隐藏，用户会失去对系统代表他们做什么的可见性。解决方案需要将这些两个通信通道分离成具有不同可见性规则的不同消息。

技能系统使用消息上的 `isMeta` 标志来控制它是否出现在用户界面中。当 `isMeta: false`（或当标志省略并默认为 false 时），消息呈现在用户看到的对话转录中。当 `isMeta: true` 时，消息作为 Claude 对话上下文的一部分发送给 Anthropic API，但从不出现在 UI 中。这个简单的布尔标志实现了复杂的双通道通信：一个流给人类用户，另一个给 AI 模型。元工具的元提示词！

当技能执行时，系统将两个独立的用户消息注入到对话历史中。第一个携带技能元数据与 `isMeta: false`，使其对用户可见作为状态指示器。第二个携带完整的技能提示词与 `isMeta: true`，将其从 UI 隐藏同时使其对 Claude 可用。这种分割通过向用户显示正在发生的事情而不使他们不知所措地实现细节来解决透明度与清晰度的权衡。

元数据消息使用简洁的 XML 结构，前端可以解析并适当显示：

```javascript
let metadata = [
  `<command-message>${statusMessage}</command-message>`,
  `<command-name>${skillName}</command-name>`,
  args ? `<command-args>${args}</command-args>` : null
].filter(Boolean).join('\n');

// 消息 1：无 isMeta 标志 → 默认为 false → 可见
messages.push({
  content: metadata,
  autocheckpoint: checkpointFlag
});
```

例如，当 PDF 技能激活时，用户在其转录中看到一个干净的加载指示器：

```xml
<command-message>The "pdf" skill is loading</command-message>
<command-name>pdf</command-name>
<command-args>report.pdf</command-args>
```

此消息故意保持最小——通常 50 到 200 个字符。XML 标签使前端能够使用特殊格式呈现它，验证是否存在适当的 `<command-message>` 标签，并维护会话期间执行了哪些技能的审计跟踪。因为当省略时 `isMeta` 标志默认为 false，所以此元数据自动出现在 UI 中。

技能提示词消息采用相反的方法。它从 `SKILL.md` 加载完整内容，可能用额外的上下文增强它，并显式设置 `isMeta: true` 以从用户隐藏：

```javascript
let skillPrompt = await skill.getPromptForCommand(args, context);

// 根据需要与 prepend/append 内容增强
let fullPrompt = prependContent.length > 0 || appendContent.length > 0
  ? [...prependContent, ...appendContent, ...skillPrompt]
  : skillPrompt;

// 消息 2：显式 isMeta: true → 隐藏
messages.push({
  content: fullPrompt,
  isMeta: true  // 从 UI 隐藏，发送给 API
});
```

典型的技能提示词运行 500 到 5,000 字，并提供全面的指导来转换 Claude 的行为。PDF 技能提示词可能包含：

```markdown
You are a PDF processing specialist.

Your task is to extract text from PDF documents using the pdftotext tool.

## Process

1. Validate the PDF file exists
2. Run pdftotext command to extract text
3. Read the output file
4. Present the extracted text to the user

## Tools Available

You have access to:
- Bash(pdftotext:*) - For running pdftotext command
- Read - For reading extracted text
- Write - For saving results if needed

## Output Format

Present the extracted text clearly formatted.

Base directory: /path/to/skill
User arguments: report.pdf
```

此提示词建立任务上下文、概述工作流程、指定可用工具、定义输出格式并提供特定于环境的路径。带有标题、列表和代码块的 markdown 结构帮助 Claude 解析并遵循指令。使用 `isMeta: true`，整个提示词被发送给 API，但从不使混乱用户的转录。

除了核心元数据和技能提示词外，技能还可以注入额外的条件消息用于附件和权限：

```javascript
let allMessages = [
  createMessage({ content: metadata, autocheckpoint: flag }),  // 1. 元数据
  createMessage({ content: skillPrompt, isMeta: true }),       // 2. 技能提示词
  ...attachmentMessages,                                       // 3. 附件（条件）
  ...(allowedTools.length || skill.model ? [
    createPermissionsMessage({                                 // 4. 权限（条件）
      type: "command_permissions",
      allowedTools: allowedTools,
      model: skill.useSmallFastModel ? getFastModel() : skill.model
    })
  ] : [])
];
```

附件消息可以携带诊断信息、文件引用或补充技能提示词的额外上下文。权限消息仅在技能在其 frontmatter 中指定 `allowed-tools` 或请求模型覆盖时出现，提供修改运行时执行环境的元数据。这种模块化组合允许每条消息都有特定目的，并根据技能的配置包含或排除，扩展基本的两条消息模式以处理更复杂的场景，同时通过 `isMeta` 标志保持相同的可见性控制。

单消息设计将迫使不可能的选择。设置 `isMeta: false` 将使整个消息可见，将数千字的 AI 指令转储到用户的聊天转录中。用户会看到类似：

```
┌─────────────────────────────────────────────┐
│ The "pdf" skill is loading                  │
│                                             │
│ You are a PDF processing specialist.        │
│                                             │
│ Your task is to extract text from PDF       │
│ documents using the pdftotext tool.         │
│                                             │
│ ## Process                                  │
│                                             │
│ 1. Validate the PDF file exists             │
│ 2. Run pdftotext command to extract text    │
│ 3. Read the output file                     │
│ ... [500 多行] ...                          │
└─────────────────────────────────────────────┘
```

UI 变得无法使用，充满了面向 Claude 而不是人类的内部实现细节。或者，设置 `isMeta: true` 将隐藏所有内容，不提供关于哪个技能激活或它接收了什么参数的透明度。用户将无法了解系统代表他们做什么。

两条消息的分割通过给每条消息不同的 `isMeta` 值来解决这个问题。消息 1 与 `isMeta: false` 提供面向用户的透明度。消息 2 与 `isMeta: true` 为 Claude 提供详细的指令。这种粒度控制实现了透明度而没有信息过载。

消息还服务于根本不同的受众和目的：

| 方面           | 元数据消息             | 技能提示词消息                  |
|----------------|------------------------|---------------------------------|
| **受众**       | 人类用户               | Claude (AI)                     |
| **目的**       | 状态/透明度            | 指令/指导                       |
| **长度**       | ~50-200 字符           | ~500-5,000 字                   |
| **格式**       | 结构化 XML             | 自然语言 markdown               |
| **可见性**     | 应该可见               | 应该隐藏                        |
| **内容**       | "正在发生什么？"       | "如何做？"                      |

代码库甚至通过不同的路径处理这些消息。元数据消息被解析 `<command-message>` 标签、验证并为 UI 显示格式化。技能提示词消息直接发送给 API，无需解析或验证——它是仅面向 Claude 推理过程的原始指令内容。将它们组合将违反单一责任原则，迫使一条消息通过两个不同的处理管道服务于两个不同的受众。

## 案例研究：执行生命周期

现在介绍了 Agent Skills 内部架构，让我们通过检查使用假设的 `pdf` 技能作为案例的完整执行流程，walkthrough 当用户说"从 report.pdf 提取文本"时会发生什么。

![Claude Skill Execution Flow](/assets/img/2025-10-26/07-claude-skill-sequence-diagram.png)

当 Claude Code 启动时，它扫描技能：

```javascript
async function getAllCommands() {
  // 并行加载所有来源
  let [userCommands, skillsAndPlugins, pluginCommands, builtins] =
    await Promise.all([
      loadUserCommands(),      // ~/.claude/commands/
      loadSkills(),            // .claude/skills/ + plugins
      loadPluginCommands(),    // Plugin-defined commands
      getBuiltinCommands()     // Hardcoded commands
    ]);

  return [...userCommands, ...skillsAndPlugins, ...pluginCommands, ...builtins]
    .filter(cmd => cmd.isEnabled());
}

// 特定技能加载
async function loadPluginSkills(plugin) {
  // 检查插件是否有技能
  if (!plugin.skillsPath) return [];

  // 支持两种模式：
  // 1. skillsPath 中的根 SKILL.md
  // 2. 带有 SKILL.md 的子目录

  const skillFiles = findSkillMdFiles(plugin.skillsPath);
  const skills = [];

  for (const file of skillFiles) {
    const content = readFile(file);
    const { frontmatter, markdown } = parseFrontmatter(content);

    skills.push({
      type: "prompt",
      name: `${plugin.name}:${getSkillName(file)}`,
      description: `${frontmatter.description} (plugin:${plugin.name})`,
      whenToUse: frontmatter.when_to_use,  // ← 注意：下划线！
      allowedTools: parseTools(frontmatter['allowed-tools']),
      model: frontmatter.model === "inherit" ? undefined : frontmatter.model,
      isSkill: true,
      promptContent: markdown,
      // ... 其他字段
    });
  }

  return skills;
}
```

对于 pdf 技能，这产生：

```json
{
  type: "prompt",
  name: "pdf",
  description: "Extract text from PDF documents (plugin:document-tools)",
  whenToUse: "When user wants to extract or process text from PDF files",
  allowedTools: ["Bash(pdftotext:*)", "Read", "Write"],
  model: undefined,  // 使用会话模型
  isSkill: true,
  disableModelInvocation: false,
  promptContent: "You are a PDF processing specialist...",
  // ... 其他字段
}
```

### 阶段 2：第 1 轮 - 用户请求和技能选择

用户发送请求："从 report.pdf 提取文本"。Claude 收到此消息以及其工具数组中的 `Skill` 工具。在 Claude 可以决定调用 pdf 技能之前，系统必须在 Skill 工具的描述中呈现可用技能。

#### 技能过滤和呈现

不是所有加载的技能都出现在 Skill 工具中。技能必须在 frontmatter 中具有 `description` 或 `when_to_use`，否则会被过滤掉。过滤标准：

```javascript
async function getSkillsForSkillTool() {
  const allCommands = await getAllCommands();

  return allCommands.filter(cmd =>
    cmd.type === "prompt" &&
    cmd.isSkill === true &&
    !cmd.disableModelInvocation &&
    (cmd.source !== "builtin" || cmd.isModeCommand === true) &&
    (cmd.hasUserSpecifiedDescription || cmd.whenToUse)  // ← 必须有一个！
  );
}
```

#### 技能格式化

每个技能都为 `<available_skills>` 部分格式化。例如，我们假设的 `pdf` 技能可以格式化为：
`"pdf": Extract text from PDF documents - When user wants to extract or process text from PDF files`

```javascript
function formatSkill(skill) {
  let name = skill.name;

  let description = skill.whenToUse
    ? `${skill.description} - ${skill.whenToUse}`
    : skill.description;

  return `"${name}": ${description}`;
}
```

#### Claude 的决策过程

现在，当用户提示："从 report.pdf 提取文本"。Claude 收到带有 `Skill` 工具的 API 请求，读取 `<available_skills>`，并推理（假设地，因为我们看不到推理痕迹）：

```
内部推理：
- 用户想要"从 report.pdf 提取文本"
- 这是一个 PDF 处理任务
- 查看可用技能...
- "pdf": Extract text from PDF documents - When user wants to extract or process text from PDF files
- 这匹配！用户想要从 PDF 提取文本
- 决策：使用 command="pdf" 调用 Skill 工具
```

注意这里没有算法匹配。没有词汇匹配。没有语义匹配。没有搜索。这是基于技能描述的纯 LLM 推理决策。完成后，Claude 返回工具使用：

```json
{
  "type": "tool_use",
  "id": "toolu_123abc",
  "name": "Skill",
  "input": {
    "command": "pdf"
  }
}
```

Skill 工具现在执行。这对应于序列图中的黄色"SKILL TOOL EXECUTION"框，它执行验证、权限检查、文件加载和上下文修改，然后生成结果。

#### 步骤 1：验证

```javascript
async validateInput({ command }, context) {
  let skillName = command.trim().replace(/^\//, "");

  // 错误 1：空
  if (!skillName) return { result: false, errorCode: 1 };

  // 错误 2：未知技能
  const allSkills = await getAllCommands();
  if (!skillExists(skillName, allSkills)) {
    return { result: false, errorCode: 2 };
  }

  // 错误 3：无法加载
  const skill = getSkill(skillName, allSkills);
  if (!skill) return { result: false, errorCode: 3 };

  // 错误 4：模型调用禁用
  if (skill.disableModelInvocation) {
    return { result: false, errorCode: 4 };
  }

  // 错误 5：非基于提示词
  if (skill.type !== "prompt") {
    return { result: false, errorCode: 5 };
  }

  return { result: true };
}
```

pdf 技能通过所有验证检查 ✓

#### 步骤 2：权限检查

```javascript
async checkPermissions({ command }, context) {
  const skillName = command.trim().replace(/^\//, "");
  const permContext = (await context.getAppState()).toolPermissionContext;

  // 检查拒绝规则
  for (const [pattern, rule] of getDenyRules(permContext)) {
    if (matches(skillName, pattern)) {
      return { behavior: "deny", message: "Blocked by permission rules" };
    }
  }

  // 检查允许规则
  for (const [pattern, rule] of getAllowRules(permContext)) {
    if (matches(skillName, pattern)) {
      return { behavior: "allow" };
    }
  }

  // 默认：询问用户
  return { behavior: "ask", message: `Execute skill: ${skillName}` };
}
```

假设没有规则，用户被提示："执行技能：pdf？"
用户批准 ✓

获得验证和权限批准后，Skill 工具加载技能文件并准备执行上下文修改：

```javascript
async *call({ command }, context) {
  const skillName = command.trim().replace(/^\//, "");
  const allSkills = await getAllCommands();
  const skill = getSkill(skillName, allSkills);

  // 加载技能提示词
  const promptContent = await skill.getPromptForCommand("", context);

  // 生成元数据标签
  const metadata = [
    `<command-message>The "${skill.userFacingName()}" skill is loading</command-message>`,
    `<command-name>${skill.userFacingName()}</command-name>`
  ].join('\n');

  // 创建消息
  const messages = [
    { type: "user", content: metadata },  // 对用户可见
    { type: "user", content: promptContent, isMeta: true },  // 对用户隐藏，对 Claude 可见
    // ... 附件、权限
  ];

  // 提取配置
  const allowedTools = skill.allowedTools || [];
  const modelOverride = skill.model;

  // 生成带有执行上下文修改器的结果
  yield {
    type: "result",
    data: { success: true, commandName: skillName },
    newMessages: messages,

    // 🔑 执行上下文修改函数
    contextModifier(context) {
      let modified = context;

      // 注入允许的工具
      if (allowedTools.length > 0) {
        modified = {
          ...modified,
          async getAppState() {
            const state = await context.getAppState();
            return {
              ...state,
              toolPermissionContext: {
                ...state.toolPermissionContext,
                alwaysAllowRules: {
                  ...state.toolPermissionContext.alwaysAllowRules,
                  command: [
                    ...state.toolPermissionContext.alwaysAllowRules.command || [],
                    ...allowedTools  // ← 预先批准这些工具
                  ]
                }
              }
            };
          }
        };
      }

      // 覆盖模型
      if (modelOverride) {
        modified = {
          ...modified,
          options: {
            ...modified.options,
            mainLoopModel: modelOverride
          }
        };
      }

      return modified;
    }
  };
}
```

Skill 工具生成其结果，包含 `newMessages`（元数据 + 技能提示词 + 用于对话上下文注入的权限）和 `contextModifier`（用于执行上下文修改的工具权限 + 模型覆盖）。这完成了序列图中的黄色"SKILL TOOL EXECUTION"框。

### 阶段 4：发送给 API（第 1 轮完成）

系统构建完整的消息数组发送给 Anthropic API。这包括对话中的所有消息以及新注入的技能消息：

```json
// 发送给 API 的第 1 轮完整消息数组
{
  model: "claude-sonnet-4-5-20250929",
  messages: [
    {
      role: "user",
      content: "Extract text from report.pdf"
    },
    {
      role: "assistant",
      content: [
        {
          type: "tool_use",
          id: "toolu_123abc",
          name: "Skill",
          input: { command: "pdf" }
        }
      ]
    },
    {
      role: "user",
      content: "<command-message>The \"pdf\" skill is loading</command-message>\n<command-name>pdf</command-name>"
      // isMeta: false (默认) - 在 UI 中对用户可见
    },
    {
      role: "user",
      content: "You are a PDF processing specialist...\n\n## Process\n1. Validate PDF exists\n2. Run pdftotext...",
      isMeta: true  // 从 UI 隐藏，发送给 API
    },
    {
      role: "user",
      content: {
        type: "command_permissions",
        allowedTools: ["Bash(pdftotext:*)", "Read", "Write"],
        model: undefined
      }
    }
  ]
}
```

![Turn 1 Completion](/assets/img/2025-10-26/11-turn-1-completion.png)

上图显示了我们到目前为止所做的事情。执行上下文修改器被应用，预先批准 `Bash(pdftotext:*)`、`Read` 和 `Write` 用于后续工具调用。请求被发送给 Anthropic API。这结束了技能执行。如果这是一个普通工具，我们就完成了。但是，技能不同。Agent 技能只注入了对话上下文和执行上下文。这意味着我们仍然需要使用所有这些注入的上下文调用 Claude agent 来完成用户的请求！

Claude 收到带有注入对话上下文的 API 响应。技能提示词转换了 Claude 的行为，为其提供：

* 专门的 PDF 处理指令（对话上下文）
* 预先批准访问 `Bash(pdftotext:*)`、`Read` 和 `Write` 工具（执行上下文）
* 要遵循的清晰工作流程（对话上下文）

Claude 处理上下文并遵循 pdf 技能的工作流程：

```
我将从 report.pdf 提取文本。让我处理文件。

[遵循 pdf 技能的指令]
1. 验证 report.pdf 是否存在
2. 运行 pdftotext 命令提取文本
3. 读取输出文件
4. 向你呈现提取的文本
```

Claude 使用 Bash 工具（预先批准，不需要用户提示）：

```json
{
  "type": "tool_use",
  "id": "toolu_456def",
  "name": "Bash",
  "input": {
    "command": "pdftotext report.pdf output.txt",
    "description": "Extract text from PDF using pdftotext"
  }
}
```

Bash 工具成功执行，返回结果。然后 Claude 使用 Read 工具读取输出文件，并向用户呈现提取的文本。技能通过将对
## 技能对话和执行上下文注入设计（续）

不像某些工具存在于某些助手（如 ChatGPT）的系统提示词中，Claude **agent skills 不存在于系统提示词中**。它们作为 `Skill` 工具描述的一部分存在于 `tools` 数组中。各个技能的名称表示为 `Skill` 元工具输入模式的 `command` 字段的一部分。为了更好地可视化它的样子，这是实际的 API 请求结构：

```json
{
  "model": "claude-sonnet-4-5-20250929",
  "system": "You are Claude Code, Anthropic's official CLI...",  // ← 系统提示词
  "messages": [
    {"role": "user", "content": "Help me create a new skill"},
    // ... 对话历史
  ],
  "tools": [  // ← 发送给 Claude 的工具数组
    {
      "name": "Skill",  // ← 元工具
      "description": "Execute a skill...\n\n<skills_instructions>...\n\n<available_skills>\n...",
      "input_schema": {
        "type": "object",
        "properties": {
          "command": {
            "type": "string",
            "description": "The skill name (no arguments)"  // ← 单独技能的名称
          }
        }
      }
    },
    {
      "name": "Bash",
      "description": "Execute bash commands...",
      // ...
    },
    {
      "name": "Read",
      // ...
    }
    // ... 其他工具
  ]
}
```

`<available_skills>` 部分存在于 Skill 工具的描述中，并为每个 API 请求重新生成。系统通过聚合来自用户和项目配置的当前加载技能、插件提供的技能和任何内置技能来动态构建此列表，默认令牌预算限制为 15,000 个字符。此预算约束迫使技能作者编写简洁的描述，并确保工具描述不会压倒模型的上下文窗口。

## 技能对话和执行上下文注入设计

大多数 LLM API 支持 `role: "system"` 消息，理论上可以携带系统提示词。事实上，OpenAI 的 ChatGPT 在其系统提示词中携带其默认工具，包括用于记忆的 `bio`、用于任务调度的 `automations`、用于控制 canvas 的 `canmore`、用于图像生成的 `img_gen`、`file_search`、`python` 和用于互联网搜索的 `web`。最后，工具提示词占其系统提示词中令牌计数的约 90%。如果我们有很多工具和/或技能要加载到上下文中，这可能是有用的，但很难高效。

但是，系统消息具有不同的语义，使它们不适合技能。系统消息设置贯穿整个对话持久存在的全局上下文，以比用户指令更高的权限影响所有后续轮次。

技能需要临时的、范围化的行为。`skill-creator` 技能应该只影响技能创建相关任务，而不是将 Claude 转变为会话其余部分的永久 PDF 专家。使用 `role: "user"` 与 `isMeta: true` 使技能提示词对 Claude 显示为用户输入，使其对当前交互临时和本地化。技能完成后，对话返回正常对话上下文和执行上下文，没有残留的行为修改。

像 `Read`、`Write` 或 `Bash` 这样的普通工具有简单的通信模式。当 Claude 调用 `Read` 时，它发送一个文件路径，接收文件内容，然后继续工作。用户在他们的转录中看到"Claude 使用了 Read 工具"，这就足够了。工具做了一件事，返回了一个结果，这就是交互的结束。技能的操作方式根本不同。技能不是执行离散操作并返回结果，而是注入全面的指令集，修改 Claude 如何推理和处理任务。这创建了一个普通工具从未面临的设计挑战：用户需要透明地了解哪些技能正在运行以及它们在做什么，而 Claude 需要详细的、可能冗长的指令来执行技能。如果用户在他们的聊天转录中看到完整的技能提示词，UI 会变得混乱，充满数千字的内部 AI 指令。如果技能激活完全隐藏，用户会失去对系统代表他们做什么的可见性。解决方案需要将这些两个通信通道分离成具有不同可见性规则的不同消息。

技能系统使用消息上的 `isMeta` 标志来控制它是否出现在用户界面中。当 `isMeta: false`（或当标志省略并默认为 false 时），消息呈现在用户看到的对话转录中。当 `isMeta: true` 时，消息作为 Claude 对话上下文的一部分发送给 Anthropic API，但从不出现在 UI 中。这个简单的布尔标志实现了复杂的双通道通信：一个流给人类用户，另一个给 AI 模型。元工具的元提示词！

当技能执行时，系统将两个独立的用户消息注入到对话历史中。第一个携带技能元数据与 `isMeta: false`，使其对用户可见作为状态指示器。第二个携带完整的技能提示词与 `isMeta: true`，将其从 UI 隐藏同时使其对 Claude 可用。这种分割通过向用户显示正在发生的事情而不使他们不知所措地实现细节来解决透明度与清晰度的权衡。

元数据消息使用简洁的 XML 结构，前端可以解析并适当显示：

```javascript
let metadata = [
  `<command-message>${statusMessage}</command-message>`,
  `<command-name>${skillName}</command-name>`,
  args ? `<command-args>${args}</command-args>` : null
].filter(Boolean).join('\n');

// 消息 1：无 isMeta 标志 → 默认为 false → 可见
messages.push({
  content: metadata,
  autocheckpoint: checkpointFlag
});
```

例如，当 PDF 技能激活时，用户在其转录中看到一个干净的加载指示器：

```xml
<command-message>The "pdf" skill is loading</command-message>
<command-name>pdf</command-name>
<command-args>report.pdf</command-args>
```

此消息故意保持最小——通常 50 到 200 个字符。XML 标签使前端能够使用特殊格式呈现它，验证是否存在适当的 `<command-message>` 标签，并维护会话期间执行了哪些技能的审计跟踪。因为当省略时 `isMeta` 标志默认为 false，所以此元数据自动出现在 UI 中。

技能提示词消息采用相反的方法。它从 `SKILL.md` 加载完整内容，可能用额外的上下文增强它，并显式设置 `isMeta: true` 以从用户隐藏：

```javascript
let skillPrompt = await skill.getPromptForCommand(args, context);

// 根据需要与 prepend/append 内容增强
let fullPrompt = prependContent.length > 0 || appendContent.length > 0
  ? [...prependContent, ...appendContent, ...skillPrompt]
  : skillPrompt;

// 消息 2：显式 isMeta: true → 隐藏
messages.push({
  content: fullPrompt,
  isMeta: true  // 从 UI 隐藏，发送给 API
});
```

典型的技能提示词运行 500 到 5,000 字，并提供全面的指导来转换 Claude 的行为。PDF 技能提示词可能包含：

```markdown
You are a PDF processing specialist.

Your task is to extract text from PDF documents using the pdftotext tool.

## Process

1. Validate the PDF file exists
2. Run pdftotext command to extract text
3. Read the output file
4. Present the extracted text to the user

## Tools Available

You have access to:
- Bash(pdftotext:*) - For running pdftotext command
- Read - For reading extracted text
- Write - For saving results if needed

## Output Format

Present the extracted text clearly formatted.

Base directory: /path/to/skill
User arguments: report.pdf
```

此提示词建立任务上下文、概述工作流程、指定可用工具、定义输出格式并提供特定于环境的路径。带有标题、列表和代码块的 markdown 结构帮助 Claude 解析并遵循指令。使用 `isMeta: true`，整个提示词被发送给 API，但从不使混乱用户的转录。

除了核心元数据和技能提示词外，技能还可以注入额外的条件消息用于附件和权限：

```javascript
let allMessages = [
  createMessage({ content: metadata, autocheckpoint: flag }),  // 1. 元数据
  createMessage({ content: skillPrompt, isMeta: true }),       // 2. 技能提示词
  ...attachmentMessages,                                       // 3. 附件（条件）
  ...(allowedTools.length || skill.model ? [
    createPermissionsMessage({                                 // 4. 权限（条件）
      type: "command_permissions",
      allowedTools: allowedTools,
      model: skill.useSmallFastModel ? getFastModel() : skill.model
    })
  ] : [])
];
```

附件消息可以携带诊断信息、文件引用或补充技能提示词的额外上下文。权限消息仅在技能在其 frontmatter 中指定 `allowed-tools` 或请求模型覆盖时出现，提供修改运行时执行环境的元数据。这种模块化组合允许每条消息都有特定目的，并根据技能的配置包含或排除，扩展基本的两条消息模式以处理更复杂的场景，同时通过 `isMeta` 标志保持相同的可见性控制。

单消息设计将迫使不可能的选择。设置 `isMeta: false` 将使整个消息可见，将数千字的 AI 指令转储到用户的聊天转录中。用户会看到类似：

```
┌─────────────────────────────────────────────┐
│ The "pdf" skill is loading                  │
│                                             │
│ You are a PDF processing specialist.        │
│                                             │
│ Your task is to extract text from PDF       │
│ documents using the pdftotext tool.         │
│                                             │
│ ## Process                                  │
│                                             │
│ 1. Validate the PDF file exists             │
│ 2. Run pdftotext command to extract text    │
│ 3. Read the output file                     │
│ ... [500 多行] ...                          │
└─────────────────────────────────────────────┘
```

UI 变得无法使用，充满了面向 Claude 而不是人类的内部实现细节。或者，设置 `isMeta: true` 将隐藏所有内容，不提供关于哪个技能激活或它接收了什么参数的透明度。用户将无法了解系统代表他们做什么。

两条消息的分割通过给每条消息不同的 `isMeta` 值来解决这个问题。消息 1 与 `isMeta: false` 提供面向用户的透明度。消息 2 与 `isMeta: true` 为 Claude 提供详细的指令。这种粒度控制实现了透明度而没有信息过载。

消息还服务于根本不同的受众和目的：

| 方面           | 元数据消息             | 技能提示词消息                  |
|----------------|------------------------|---------------------------------|
| **受众**       | 人类用户               | Claude (AI)                     |
| **目的**       | 状态/透明度            | 指令/指导                       |
| **长度**       | ~50-200 字符           | ~500-5,000 字                   |
| **格式**       | 结构化 XML             | 自然语言 markdown               |
| **可见性**     | 应该可见               | 应该隐藏                        |
| **内容**       | "正在发生什么？"       | "如何做？"                      |

代码库甚至通过不同的路径处理这些消息。元数据消息被解析 `<command-message>` 标签、验证并为 UI 显示格式化。技能提示词消息直接发送给 API，无需解析或验证——它是仅面向 Claude 推理过程的原始指令内容。将它们组合将违反单一责任原则，迫使一条消息通过两个不同的处理管道服务于两个不同的受众。

## 案例研究：执行生命周期

现在介绍了 Agent Skills 内部架构，让我们通过检查使用假设的 `pdf` 技能作为案例的完整执行流程，walkthrough 当用户说"从 report.pdf 提取文本"时会发生什么。

![Claude Skill Execution Flow](/assets/img/2025-10-26/07-claude-skill-sequence-diagram.png)

当 Claude Code 启动时，它扫描技能：

```javascript
async function getAllCommands() {
  // 并行加载所有来源
  let [userCommands, skillsAndPlugins, pluginCommands, builtins] =
    await Promise.all([
      loadUserCommands(),      // ~/.claude/commands/
      loadSkills(),            // .claude/skills/ + plugins
      loadPluginCommands(),    // Plugin-defined commands
      getBuiltinCommands()     // Hardcoded commands
    ]);

  return [...userCommands, ...skillsAndPlugins, ...pluginCommands, ...builtins]
    .filter(cmd => cmd.isEnabled());
}

// 特定技能加载
async function loadPluginSkills(plugin) {
  // 检查插件是否有技能
  if (!plugin.skillsPath) return [];

  // 支持两种模式：
  // 1. skillsPath 中的根 SKILL.md
  // 2. 带有 SKILL.md 的子目录

  const skillFiles = findSkillMdFiles(plugin.skillsPath);
  const skills = [];

  for (const file of skillFiles) {
    const content = readFile(file);
    const { frontmatter, markdown } = parseFrontmatter(content);

    skills.push({
      type: "prompt",
      name: `${plugin.name}:${getSkillName(file)}`,
      description: `${frontmatter.description} (plugin:${plugin.name})`,
      whenToUse: frontmatter.when_to_use,  // ← 注意：下划线！
      allowedTools: parseTools(frontmatter['allowed-tools']),
      model: frontmatter.model === "inherit" ? undefined : frontmatter.model,
      isSkill: true,
      promptContent: markdown,
      // ... 其他字段
    });
  }

  return skills;
}
```

对于 pdf 技能，这产生：

```json
{
  type: "prompt",
  name: "pdf",
  description: "Extract text from PDF documents (plugin:document-tools)",
  whenToUse: "When user wants to extract or process text from PDF files",
  allowedTools: ["Bash(pdftotext:*)", "Read", "Write"],
  model: undefined,  // 使用会话模型
  isSkill: true,
  disableModelInvocation: false,
  promptContent: "You are a PDF processing specialist...",
  // ... 其他字段
}
```

### 阶段 2：第 1 轮 - 用户请求和技能选择

用户发送请求："从 report.pdf 提取文本"。Claude 收到此消息以及其工具数组中的 `Skill` 工具。在 Claude 可以决定调用 pdf 技能之前，系统必须在 Skill 工具的描述中呈现可用技能。

#### 技能过滤和呈现

不是所有加载的技能都出现在 Skill 工具中。技能必须在 frontmatter 中具有 `description` 或 `when_to_use`，否则会被过滤掉。过滤标准：

```javascript
async function getSkillsForSkillTool() {
  const allCommands = await getAllCommands();

  return allCommands.filter(cmd =>
    cmd.type === "prompt" &&
    cmd.isSkill === true &&
    !cmd.disableModelInvocation &&
    (cmd.source !== "builtin" || cmd.isModeCommand === true) &&
    (cmd.hasUserSpecifiedDescription || cmd.whenToUse)  // ← 必须有一个！
  );
}
```

#### 技能格式化

每个技能都为 `<available_skills>` 部分格式化。例如，我们假设的 `pdf` 技能可以格式化为：
`"pdf": Extract text from PDF documents - When user wants to extract or process text from PDF files`

```javascript
function formatSkill(skill) {
  let name = skill.name;
  let description = skill.whenToUse
    ? `${skill.description} - ${skill.whenToUse}`
    : skill.description;

  return `"${name}": ${description}`;
}
```

#### Claude 的决策过程

现在，当用户提示："从 report.pdf 提取文本"。Claude 收到带有 `Skill` 工具的 API 请求，读取 `<available_skills>`，并推理（假设地，因为我们看不到推理痕迹）：

```
内部推理：
- 用户想要"从 report.pdf 提取文本"
- 这是一个 PDF 处理任务
- 查看可用技能...
- "pdf": Extract text from PDF documents - When user wants to extract or process text from PDF files
- 这匹配！用户想要从 PDF 提取文本
- 决策：使用 command="pdf" 调用 Skill 工具
```

注意这里没有算法匹配。没有词汇匹配。没有语义匹配。没有搜索。这是基于技能描述的纯 LLM 推理决策。完成后，Claude 返回工具使用：

```json
{
  "type": "tool_use",
  "id": "toolu_123abc",
  "name": "Skill",
  "input": {
    "command": "pdf"
  }
}
```

Skill 工具现在执行。这对应于序列图中的黄色"SKILL TOOL EXECUTION"框，它执行验证、权限检查、文件加载和上下文修改，然后生成结果。

#### 步骤 1：验证

```javascript
async validateInput({ command }, context) {
  let skillName = command.trim().replace(/^\//, "");

  // 错误 1：空
  if (!skillName) return { result: false, errorCode: 1 };

  // 错误 2：未知技能
  const allSkills = await getAllCommands();
  if (!skillExists(skillName, allSkills)) {
    return { result: false, errorCode: 2 };
  }

  // 错误 3：无法加载
  const skill = getSkill(skillName, allSkills);
  if (!skill) return { result: false, errorCode: 3 };

  // 错误 4：模型调用禁用
  if (skill.disableModelInvocation) {
    return { result: false, errorCode: 4 };
  }

  // 错误 5：非基于提示词
  if (skill.type !== "prompt") {
    return { result: false, errorCode: 5 };
  }

  return { result: true };
}
```

pdf 技能通过所有验证检查 ✓

#### 步骤 2：权限检查

```javascript
async checkPermissions({ command }, context) {
  const skillName = command.trim().replace(/^\//, "");
  const permContext = (await context.getAppState()).toolPermissionContext;

  // 检查拒绝规则
  for (const [pattern, rule] of getDenyRules(permContext)) {
    if (matches(skillName, pattern)) {
      return { behavior: "deny", message: "Blocked by permission rules" };
    }
  }

  // 检查允许规则
  for (const [pattern, rule] of getAllowRules(permContext)) {
    if (matches(skillName, pattern)) {
      return { behavior: "allow" };
    }
  }

  // 默认：询问用户
  return { behavior: "ask", message: `Execute skill: ${skillName}` };
}
```

假设没有规则，用户被提示："执行技能：pdf？"
用户批准 ✓

获得验证和权限批准后，Skill 工具加载技能文件并准备执行上下文修改：

```javascript
async *call({ command }, context) {
  const skillName = command.trim().replace(/^\//, "");
  const allSkills = await getAllCommands();
  const skill = getSkill(skillName, allSkills);

  // 加载技能提示词
  const promptContent = await skill.getPromptForCommand("", context);

  // 生成元数据标签
  const metadata = [
    `<command-message>The "${skill.userFacingName()}" skill is loading</command-message>`,
    `<command-name>${skill.userFacingName()}</command-name>`
  ].join('\n');

  // 创建消息
  const messages = [
    { type: "user", content: metadata },  // 对用户可见
    { type: "user", content: promptContent, isMeta: true },  // 对用户隐藏，对 Claude 可见
    // ... 附件、权限
  ];

  // 提取配置
  const allowedTools = skill.allowedTools || [];
  const modelOverride = skill.model;

  // 生成带有执行上下文修改器的结果
  yield {
    type: "result",
    data: { success: true, commandName: skillName },
    newMessages: messages,

    // 🔑 执行上下文修改函数
    contextModifier(context) {
      let modified = context;

      // 注入允许的工具
      if (allowedTools.length > 0) {
        modified = {
          ...modified,
          async getAppState() {
            const state = await context.getAppState();
            return {
              ...state,
              toolPermissionContext: {
                ...state.toolPermissionContext,
                alwaysAllowRules: {
                  ...state.toolPermissionContext.alwaysAllowRules,
                  command: [
                    ...state.toolPermissionContext.alwaysAllowRules.command || [],
                    ...allowedTools  // ← 预先批准这些工具
                  ]
                }
              }
            };
          }
        };
      }

      // 覆盖模型
      if (modelOverride) {
        modified = {
          ...modified,
          options: {
            ...modified.options,
            mainLoopModel: modelOverride
          }
        };
      }

      return modified;
    }
  };
}
```

Skill 工具生成其结果，包含 `newMessages`（元数据 + 技能提示词 + 用于对话上下文注入的权限）和 `contextModifier`（用于执行上下文修改的工具权限 + 模型覆盖）。这完成了序列图中的黄色"SKILL TOOL EXECUTION"框。

### 阶段 4：发送给 API（第 1 轮完成）

系统构建完整的消息数组发送给 Anthropic API。这包括对话中的所有消息以及新注入的技能消息：

```json
// 发送给 API 的第 1 轮完整消息数组
{
  model: "claude-sonnet-4-5-20250929",
  messages: [
    {
      role: "user",
      content: "Extract text from report.pdf"
    },
    {
      role: "assistant",
      content: [
        {
          type: "tool_use",
          id: "toolu_123abc",
          name: "Skill",
          input: { command: "pdf" }
        }
      ]
    },
    {
      role: "user",
      content: "<command-message>The \"pdf\" skill is loading</command-message>\n<command-name>pdf</command-name>"
      // isMeta: false (默认) - 在 UI 中对用户可见
    },
    {
      role: "user",
      content: "You are a PDF processing specialist...\n\n## Process\n1. Validate PDF exists\n2. Run pdftotext...",
      isMeta: true  // 从 UI 隐藏，发送给 API
    },
    {
      role: "user",
      content: {
        type: "command_permissions",
        allowedTools: ["Bash(pdftotext:*)", "Read", "Write"],
        model: undefined
      }
    }
  ]
}
```

![Turn 1 Completion](/assets/img/2025-10-26/11-turn-1-completion.png)

上图显示了我们到目前为止所做的事情。执行上下文修改器被应用，预先批准 `Bash(pdftotext:*)`、`Read` 和 `Write` 用于后续工具调用。请求被发送给 Anthropic API。这结束了技能执行。如果这是一个普通工具，我们就完成了。但是，技能不同。Agent 技能只注入了对话上下文和执行上下文。这意味着我们仍然需要使用所有这些注入的上下文调用 Claude agent 来完成用户的请求！

Claude 收到带有注入对话上下文的 API 响应。技能提示词转换了 Claude 的行为，为其提供：

* 专门的 PDF 处理指令（对话上下文）
* 预先批准访问 `Bash(pdftotext:*)`、`Read` 和 `Write` 工具（执行上下文）
* 要遵循的清晰工作流程（对话上下文）

Claude 处理上下文并遵循 pdf 技能的工作流程：

```
我将从 report.pdf 提取文本。让我处理文件。

[遵循 pdf 技能的指令]
1. 验证 report.pdf 是否存在
2. 运行 pdftotext 命令提取文本
3. 读取输出文件
4. 向你呈现提取的文本
```

Claude 使用 Bash 工具（预先批准，不需要用户提示）：

```json
{
  "type": "tool_use",
  "id": "toolu_456def",
  "name": "Bash",
  "input": {
    "command": "pdftotext report.pdf output.txt",
    "description": "Extract text from PDF using pdftotext"
  }
}
```

Bash 工具成功执行，返回结果。然后 Claude 使用 Read 工具读取输出文件，并向用户呈现提取的文本。技能通过将对
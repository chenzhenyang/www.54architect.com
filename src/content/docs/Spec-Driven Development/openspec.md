---
title: OpenSpec README
skill_id: 803d09b6
original_url: >-
  https://raw.githubusercontent.com/Fission-AI/OpenSpec/refs/heads/main/README.md
origin_title: OpenSpec README
author: Fission-AI
tags:
  - OpenSpec
  - 规范框架
  - AI 编程
  - 工作流
abbrlink: 658987613
date: 2026-03-12 22:32:11
generated: 2026-03-12 22:28:55
---

<summary><strong>最受喜爱的规范 (spec) 框架。</strong></summary>

[![https://img.shields.io/github/stars/Fission-AI/OpenSpec?style=flat-square&label=Stars](/images/Stars)](https://github.com/Fission-AI/OpenSpec/stargazers)
[![https://img.shields.io/npm/dm/@fission-ai/openspec?style=flat-square&label=Downloads/mo](/images/Downloads)](https://www.npmjs.com/package/@fission-ai/openspec)
[![https://img.shields.io/github/contributors/Fission-AI/OpenSpec?style=flat-square&label=Contributors](/images/Contributors)](https://github.com/Fission-AI/OpenSpec/graphs/contributors)

我们的理念：

```text
→ 灵活而非僵化
→ 迭代而非瀑布
→ 简单而非复杂
→ 为现有项目 (brownfield) 而建，不仅限于新项目 (greenfield)
→ 可从个人项目扩展至企业级
```

> [!TIP]
> **全新工作流 (workflow) 现已可用！**我们已用全新的 artifact 引导工作流重构了 OpenSpec。
>
> 运行 `/opsx:propose "你的想法"` 开始使用。→ [了解更多](docs/opsx.md)

### 团队

在团队中使用 OpenSpec？[发送邮件至这里](mailto:teams@openspec.dev) 以访问我们的 Slack 频道。

<!-- TODO: Add GIF demo of /opsx:propose → /opsx:archive workflow -->

## 实战演示

```text
你：/opsx:propose add-dark-mode
AI:  创建了 openspec/changes/add-dark-mode/
     ✓ proposal.md — 为什么要做这个，哪些会改变
     ✓ specs/       — 需求和场景
     ✓ design.md    — 技术方案
     ✓ tasks.md     — 实现清单
     已准备好实现！

你：/opsx:apply
AI:  正在实现任务...
     ✓ 1.1 添加主题上下文提供者
     ✓ 1.2 创建切换组件
     ✓ 2.1 添加 CSS 变量
     ✓ 2.2 连接 localStorage
     所有任务完成！

你：/opsx:archive
AI:  已归档至 openspec/changes/archive/2025-01-23-add-dark-mode/
     规范已更新。准备好下一个功能。
```
<summary><strong>OpenSpec Dashboard</strong></summary>

## 快速开始

**需要 Node.js 20.19.0 或更高版本。**

全局安装 OpenSpec：

```bash
npm install -g @fission-ai/openspec@latest
```

然后导航到你的项目目录并初始化：

```bash
cd your-project
openspec init
```

现在告诉你的 AI：`/opsx:propose <你想要构建的东西>`

如果你想要扩展工作流 (`/opsx:new`、`/opsx:continue`、`/opsx:ff`、`/opsx:verify`、`/opsx:sync`、`/opsx:bulk-archive`、`/opsx:onboard`)，使用 `openspec config profile` 选择并用 `openspec update` 应用。

> [!NOTE]
> 不确定你的工具是否受支持？[查看完整列表](docs/supported-tools.md) – 我们支持 20+ 工具并持续增长。
>
> 也适用于 pnpm、yarn、bun 和 nix。[查看安装选项](docs/installation.md)。

## 文档

→ **[入门指南](docs/getting-started.md)**：第一步<br>
→ **[工作流](docs/workflows.md)**：组合和模式<br>
→ **[命令](docs/commands.md)**：斜杠命令和技能<br>
→ **[CLI](docs/cli.md)**：终端参考<br>
→ **[支持的工具](docs/supported-tools.md)**：工具集成和安装路径<br>
→ **[概念](docs/concepts.md)**：整体架构<br>
→ **[多语言](docs/multi-language.md)**：多语言支持<br>
→ **[自定义](docs/customization.md)**：打造属于你的 OpenSpec


## 为什么选择 OpenSpec？

AI 编程助手功能强大，但当需求仅存在于聊天记录中时往往不可预测。OpenSpec 添加了轻量级的规范层，让你在编写任何代码之前就构建内容达成一致。

- **先达成一致再构建** — 人类和 AI 在编写代码前就规范达成一致
- **保持有序** — 每个变更都有自己的文件夹，包含提案、规范、设计和任务
- **灵活工作** — 随时更新任何 artifact，没有僵化的阶段限制
- **使用你的工具** — 通过斜杠命令与 20+ AI 助手协作

### 我们与其他方案的对比

**对比 [Spec Kit](https://github.com/github/spec-kit)** (GitHub) — 详尽但笨重。僵化的阶段限制、大量 Markdown、Python 设置。OpenSpec 更轻量且允许自由迭代。

**对比 [Kiro](https://kiro.dev)** (AWS) — 功能强大但你被锁定在他们的 IDE 中且仅限于 Claude 模型。OpenSpec 与你已经使用的工具协作。

**对比无规范** — 没有规范的 AI 编程意味着模糊的提示和不可预测的结果。OpenSpec 带来可预测性而无需繁文缛节。

## 更新 OpenSpec

**升级包**

```bash
npm install -g @fission-ai/openspec@latest
```

**刷新 Agent 指令**

在每个项目内运行此命令以重新生成 AI 指导并确保最新的斜杠命令处于活动状态：

```bash
openspec update
```

## 使用说明

**模型选择**：OpenSpec 最适合高推理能力的模型。我们推荐 Opus 4.5 和 GPT 5.2 用于规划和实现。

**上下文卫生**：OpenSpec 受益于干净的上下文窗口。在开始实现前清理你的上下文，并在整个会话中保持良好的上下文卫生。

## 贡献

**小修复** — Bug 修复、拼写错误纠正和小型改进可以直接作为 PR 提交。

**大型变更** — 对于新功能、重大重构或架构变更，请先提交 OpenSpec 变更提案，这样我们可以在实现开始前就意图和目标达成一致。

编写提案时，请牢记 OpenSpec 理念：我们服务于广泛的用户群体，涵盖不同的编程 Agent、模型和使用场景。变更应该对所有人都有用。

**欢迎 AI 生成的代码** — 只要经过测试和验证。包含 AI 生成代码的 PR 应提及所使用的编程 Agent 和模型（例如："使用 claude-opus-4-5-20251101 通过 Claude Code 生成"）。

### 开发

- 安装依赖：`pnpm install`
- 构建：`pnpm run build`
- 测试：`pnpm test`
- 本地开发 CLI：`pnpm run dev` 或 `pnpm run dev:cli`
- 约定式提交 (单行)：`type(scope): subject`

## 其他

<summary><strong>遥测</strong></summary>

OpenSpec 收集匿名使用统计。

我们仅收集命令名称和版本以了解使用模式。不收集参数、路径、内容或个人身份信息 (PII)。在 CI 中自动禁用。

**退出：** `export OPENSPEC_TELEMETRY=0` 或 `export DO_NOT_TRACK=1`

<summary><strong>维护者与顾问</strong></summary>
查看 [MAINTAINERS.md](MAINTAINERS.md) 了解核心维护者和顾问名单，他们帮助指导项目发展。

## 许可证

MIT
<summary><strong>最受喜爱的规范 (spec) 框架。</strong></summary>

[![https://img.shields.io/github/stars/Fission-AI/OpenSpec?style=flat-square&label=Stars](/images/Stars)](https://github.com/Fission-AI/OpenSpec/stargazers)
[![https://img.shields.io/npm/dm/@fission-ai/openspec?style=flat-square&label=Downloads/mo](/images/Downloads)](https://www.npmjs.com/package/@fission-ai/openspec)
[![https://img.shields.io/github/contributors/Fission-AI/OpenSpec?style=flat-square&label=Contributors](/images/Contributors)](https://github.com/Fission-AI/OpenSpec/graphs/contributors)

我们的理念：

```text
→ 灵活而非僵化
→ 迭代而非瀑布
→ 简单而非复杂
→ 为现有项目 (brownfield) 而建，不仅限于新项目 (greenfield)
→ 可从个人项目扩展至企业级
```

> [!TIP]
> **全新工作流 (workflow) 现已可用！**我们已用全新的 artifact 引导工作流重构了 OpenSpec。
>
> 运行 `/opsx:propose "你的想法"` 开始使用。→ [了解更多](docs/opsx.md)

<p align="center">
  关注 <a href="https://x.com/0xTab">@0xTab on X</a> 获取更新 · 加入 <a href="https://discord.gg/YctCnvvshC">OpenSpec Discord</a> 获取帮助和提问。
</p>

### 团队

在团队中使用 OpenSpec？[发送邮件至这里](mailto:teams@openspec.dev) 以访问我们的 Slack 频道。

<!-- TODO: Add GIF demo of /opsx:propose → /opsx:archive workflow -->

## 实战演示

```text
你：/opsx:propose add-dark-mode
AI:  创建了 openspec/changes/add-dark-mode/
     ✓ proposal.md — 为什么要做这个，哪些会改变
     ✓ specs/       — 需求和场景
     ✓ design.md    — 技术方案
     ✓ tasks.md     — 实现清单
     已准备好实现！

你：/opsx:apply
AI:  正在实现任务...
     ✓ 1.1 添加主题上下文提供者
     ✓ 1.2 创建切换组件
     ✓ 2.1 添加 CSS 变量
     ✓ 2.2 连接 localStorage
     所有任务完成！

你：/opsx:archive
AI:  已归档至 openspec/changes/archive/2025-01-23-add-dark-mode/
     规范已更新。准备好下一个功能。
```

<details>
<summary><strong>OpenSpec Dashboard</strong></summary>
</details>

## 快速开始

**需要 Node.js 20.19.0 或更高版本。**

全局安装 OpenSpec：

```bash
npm install -g @fission-ai/openspec@latest
```

然后导航到你的项目目录并初始化：

```bash
cd your-project
openspec init
```

现在告诉你的 AI：`/opsx:propose <你想要构建的东西>`

如果你想要扩展工作流 (`/opsx:new`、`/opsx:continue`、`/opsx:ff`、`/opsx:verify`、`/opsx:sync`、`/opsx:bulk-archive`、`/opsx:onboard`)，使用 `openspec config profile` 选择并用 `openspec update` 应用。

> [!NOTE]
> 不确定你的工具是否受支持？[查看完整列表](docs/supported-tools.md) – 我们支持 20+ 工具并持续增长。
>
> 也适用于 pnpm、yarn、bun 和 nix。[查看安装选项](docs/installation.md)。

## 文档

→ **[入门指南](docs/getting-started.md)**：第一步<br>
→ **[工作流](docs/workflows.md)**：组合和模式<br>
→ **[命令](docs/commands.md)**：斜杠命令和技能<br>
→ **[CLI](docs/cli.md)**：终端参考<br>
→ **[支持的工具](docs/supported-tools.md)**：工具集成和安装路径<br>
→ **[概念](docs/concepts.md)**：整体架构<br>
→ **[多语言](docs/multi-language.md)**：多语言支持<br>
→ **[自定义](docs/customization.md)**：打造属于你的 OpenSpec


## 为什么选择 OpenSpec？

AI 编程助手功能强大，但当需求仅存在于聊天记录中时往往不可预测。OpenSpec 添加了轻量级的规范层，让你在编写任何代码之前就构建内容达成一致。

- **先达成一致再构建** — 人类和 AI 在编写代码前就规范达成一致
- **保持有序** — 每个变更都有自己的文件夹，包含提案、规范、设计和任务
- **灵活工作** — 随时更新任何 artifact，没有僵化的阶段限制
- **使用你的工具** — 通过斜杠命令与 20+ AI 助手协作

### 我们与其他方案的对比

**对比 [Spec Kit](https://github.com/github/spec-kit)** (GitHub) — 详尽但笨重。僵化的阶段限制、大量 Markdown、Python 设置。OpenSpec 更轻量且允许自由迭代。

**对比 [Kiro](https://kiro.dev)** (AWS) — 功能强大但你被锁定在他们的 IDE 中且仅限于 Claude 模型。OpenSpec 与你已经使用的工具协作。

**对比无规范** — 没有规范的 AI 编程意味着模糊的提示和不可预测的结果。OpenSpec 带来可预测性而无需繁文缛节。

## 更新 OpenSpec

**升级包**

```bash
npm install -g @fission-ai/openspec@latest
```

**刷新 Agent 指令**

在每个项目内运行此命令以重新生成 AI 指导并确保最新的斜杠命令处于活动状态：

```bash
openspec update
```

## 使用说明

**模型选择**：OpenSpec 最适合高推理能力的模型。我们推荐 Opus 4.5 和 GPT 5.2 用于规划和实现。

**上下文卫生**：OpenSpec 受益于干净的上下文窗口。在开始实现前清理你的上下文，并在整个会话中保持良好的上下文卫生。

## 贡献

**小修复** — Bug 修复、拼写错误纠正和小型改进可以直接作为 PR 提交。

**大型变更** — 对于新功能、重大重构或架构变更，请先提交 OpenSpec 变更提案，这样我们可以在实现开始前就意图和目标达成一致。

编写提案时，请牢记 OpenSpec 理念：我们服务于广泛的用户群体，涵盖不同的编程 Agent、模型和使用场景。变更应该对所有人都有用。

**欢迎 AI 生成的代码** — 只要经过测试和验证。包含 AI 生成代码的 PR 应提及所使用的编程 Agent 和模型（例如："使用 claude-opus-4-5-20251101 通过 Claude Code 生成"）。

### 开发

- 安装依赖：`pnpm install`
- 构建：`pnpm run build`
- 测试：`pnpm test`
- 本地开发 CLI：`pnpm run dev` 或 `pnpm run dev:cli`
- 约定式提交 (单行)：`type(scope): subject`

## 其他

<summary><strong>遥测</strong></summary>

OpenSpec 收集匿名使用统计。

我们仅收集命令名称和版本以了解使用模式。不收集参数、路径、内容或个人身份信息 (PII)。在 CI 中自动禁用。

**退出：** `export OPENSPEC_TELEMETRY=0` 或 `export DO_NOT_TRACK=1`

<summary><strong>维护者与顾问</strong></summary>

查看 [MAINTAINERS.md](MAINTAINERS.md) 了解核心维护者和顾问名单，他们帮助指导项目发展。

## 许可证

MIT

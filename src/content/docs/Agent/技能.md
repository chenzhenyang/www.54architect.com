---
title: Skill
tags:
  - AI - Technology
categories:
  - Technology
abbrlink: 2440005541
date: 2026-03-10 11:28:48
updated: 2026-03-10 11:28:48
---

Claude 最新发布的 Skills 功能文章，最权威、最全面的一篇来自 Anthropic 官方博客，发布日期为 2025 年 10 月 16 日，标题为：

[Claude Skills: Customize AI for your workflows](https://claude.com/blog/skills)

这篇文章首次系统介绍了 Skills 的定义、使用方式、技术实现和典型场景，是目前最权威的一手资料。文中指出：
Skills 是包含指令、脚本和资源的文件夹，Claude 会在相关任务中按需加载它们，从而提升对专业任务的执行能力。Skills 具备可组合性（composable）和可移植性（portable），可在网页端、Claude Code 和 API 中复用。

此外，Anthropic 还在 GitHub 上同步开源了示例 Skills 仓库，地址为： HTTPS://GitHub.com\/anthropics\/skills

---

Claude Skills 是由 Anthropic 于 2025 年 10 月 16 日正式发布的‌。

该功能首次在 Claude 网页端、API 和 Claude Code 等产品中推出，允许用户将专业知识、脚本和资源打包成模块化的“技能文件夹”，使 AI 在特定任务中表现得更专业、更高效。

随后，Anthropic 在 ‌2025 年 12 月 18 日‌ 将 Agent Skills 规范开放为跨平台标准，推动其成为通用、可移植的 AI 能力扩展机制 ‌

Skill 是一种模块化、可复用的能力包，用于将特定任务的专业知识、工作流程和可执行逻辑进行结构化封装，使 AI 在执行该类任务时具备稳定、一致且可持续演进的行为能力。

---

Skills解决了什么问题？

在开发AI Agent的过程中，有一个核心矛盾：**Context Window的有限性 vs 能力需求的无限性**。

```text
System Prompt = 基础指令 + 所有工具描述 + 所有专业知识
            = 50K+ tokens
            = 高延迟 + 高成本 + 低效率
```

更糟的是，大多数时候用户只需要其中一小部分能力。当用户问"帮我处理这个PDF"时，系统却加载了处理Excel、数据库、代码等所有能力的上下文。

Skills的核心理念
Claude Code的Skills设计灵感来自一个简单的类比：

人类专家不是把所有知识都装在脑子里，而是在需要时查阅手册、调用专业知识。

Skills系统让AI Agent也具备这种能力：

```text
用户请求 → Agent识别需要PDF技能 → 动态加载PDF处理指令
                                 → 执行专业任务
                                 → 返回结果
```

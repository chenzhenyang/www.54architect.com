---
title: Auto mode for Claude Code | Claude
description: '今天，我们推出 auto mode（自动模式），这是 Claude Code 中的一种新权限模式，由 Claude 代表你做出权限决策，同时在操作运行前有安全保护措施进行监控'
tags:
- AI
- Technology
categories:
- Technology
lastUpdated: '2026-03-28'
origin_title: Auto mode for Claude Code | Claude
author: Claude
skill_id: 3cddf4dd
generated: 2026-03-28 15:31:59.279393
original_url: https://claude.com/blog/auto-mode
---
今天，我们推出 auto mode（自动模式），这是 Claude Code 中的一种新权限模式，由 Claude 代表你做出权限决策，同时在操作运行前有安全保护措施进行监控。该功能现已作为研究预览（research preview）向 Team 计划用户开放，并将在未来几天内向 Enterprise 计划用户和 API 用户推出。

## 工作原理（How it works）

Claude Code 的默认权限设置特意保守：每个文件写入和 bash 命令都需要请求批准。这是一个安全的默认设置，但意味着你无法启动一个大型任务后就离开，因为 Claude 会在过程中频繁请求人工批准。虽然一些开发者选择使用 `--dangerously-skip-permissions` 绕过权限检查，但跳过权限可能导致危险和破坏性的后果，不应在隔离环境之外使用。

Auto mode 是一条中间路径，让你能够运行更长时间的任务而减少中断，同时比完全跳过所有权限引入更少的风险。在每次工具调用运行之前，分类器（classifier）会审查它，以 [检查潜在的破坏性操作](https://code.claude.com/docs/en/permission-modes#what-the-classifier-blocks-by-default)，例如批量删除文件、敏感数据外泄或恶意代码执行。

分类器认为安全的操作会自动执行，而有风险的操作会被阻止，引导 Claude 采取不同的方法。如果 Claude 坚持要执行的操作持续被阻止，最终会触发权限提示给用户。

## 预期效果（What to expect）

与 `--dangerously-skip-permissions` 相比，Auto mode 降低了风险，但并未完全消除风险，我们仍建议在隔离环境中使用。分类器可能仍会允许一些有风险的操作：例如，如果用户意图不明确，或者 Claude 没有足够的环境上下文来判断某个操作可能会产生额外风险。它也可能偶尔阻止无害的操作。我们将继续改进这一体验。

Auto mode 可能对工具调用的 token 消耗、成本和延迟产生轻微影响。

## 开始使用（Getting started）

Auto mode 现已在 Claude Code 中作为研究预览向 Claude Team 用户开放，并将在未来几天内向 Enterprise 和 API 用户推广。它适用于 Claude Sonnet 4.6 和 Opus 4.6。

  * **面向管理员（For admins）**：Auto mode 很快将向 Enterprise、Team 和 Claude API 计划的所有 Claude Code 用户开放。要在 CLI 和 VS Code 扩展中禁用它，请在托管设置中设置 `"disableAutoMode": "disable"`。Auto mode 在 Claude 桌面应用中默认禁用，可以通过 Organization Settings -> Claude Code 切换开启。
  * **面向开发者（For developers）**：运行 `claude --enable-auto-mode` 启用 auto mode，然后使用 Shift+Tab 循环切换到该模式。在桌面应用和 VS Code 扩展中，首先在 Settings -> Claude Code 中切换开启 auto mode，然后在会话的权限模式下拉菜单中选择它。

[查看文档](https://code.claude.com/docs/en/permission-modes#eliminate-prompts-with-auto-mode) 获取更多信息。

`

--dangerously-skip-permissions

`

---

**原文链接**: [https://claude.com/blog/auto-mode](https://claude.com/blog/auto-mode)

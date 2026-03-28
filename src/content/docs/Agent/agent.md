---
title: 时间线整理
tags:
  - AI - Technology
categories:
  - Technology
abbrlink: 2440005541
date: 2026-03-10 11:28:48
updated: 2026-03-10 11:28:48
---

Agent 的出现，是因为“单次推理”无法解决“持续执行任务”；
Agent + 第三方大模型，本质是在构建一个“以 LLM 为大脑的操作系统”。

```text
Agent = Runtime {
  LLM (reasoning)
  Memory (state)
  Tools (action)
  Planner (decomposition)
  Orchestrator (control flow)
  Protocols (integration)
}
```

![ChatGPT_Image_2026年3月27日_09_33_10](https://raw.githubusercontent.com/chenzhenyang/images/master/highgo/ChatGPT_Image_2026年3月27日_09_33_10.png)

tools

Model Context Protocol

Skill 是对“能力”的工程化封装，它解决的是 Agent 从“能调用工具”到“能稳定复用复杂能力”的问题。

hook

Plugin

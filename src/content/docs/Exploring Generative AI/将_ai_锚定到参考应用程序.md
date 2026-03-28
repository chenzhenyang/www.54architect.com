---
title: "将 AI 锚定到参考应用程序"
date: 2026-03-11 21:01:30
updated: 2026-03-11 21:01:30
tags:
  - AI
  - Technology
categories:
  - Technology
origin_title: "Anchoring AI to a reference application"
author: "Martin Fowler"

skill_id: "c07064ec8603"
original_url: "https://martinfowler.com/articles/exploring-gen-ai/anchoring-to-reference.html"
sidebar: 
  order: 104
---

Birgitta 是 Thoughtworks 的杰出工程师（Distinguished Engineer）和 AI 辅助交付专家。她拥有超过 20 年的软件开发、架构师和技术领导者经验。

本文是"探索 Gen AI（生成式人工智能）"系列的一部分。该系列记录了 Thoughtworks 技术专家探索将 Gen AI 技术用于软件开发的历程。

2025 年 9 月 25 日

服务模板（service templates）是组织为其工程团队构建"黄金路径（golden paths）"时的典型构建模块，旨在让正确的事情变得容易完成。这些模板应该成为组织中所有服务的典范，始终代表最新的编码模式和标准。

然而，服务模板面临的挑战之一是：一旦团队使用模板实例化了一个服务，将模板更新反馈到这些服务中就会变得非常繁琐。GenAI 能在这方面提供帮助吗？

## 参考应用程序作为示例提供者

作为我最近在此处撰写的一项更大规模实验的一部分，我创建了一个 MCP 服务器，让编码助手能够访问典型模式的编码示例。在我的案例中，这是针对 Spring Boot Web 应用程序，模式包括 repository（仓储层）、service（服务层）和 controller（控制器）类。到目前为止，提供一个经过充分验证的提示（prompting）实践是：向 LLMs（大型语言模型）提供我们期望的输出示例会带来更好的结果。用更花哨的术语来说"提供示例"：这也称为"少样本提示（few-shot prompting）"或"上下文学习（in-context learning）"。

当我开始在提示中使用代码示例时，我很快意识到这是多么繁琐，因为我在自然语言 Markdown 文件中工作。这感觉有点像在大学里用铅笔写第一次 Java 考试：你根本不知道自己写的代码是否真的能编译。更重要的是，如果你为多个编码模式创建提示，你希望它们彼此保持一致。在可编译和运行的参考应用程序项目（类似于服务模板）中维护代码示例，可以更容易地为 AI 提供可编译的、一致的示例。

## 检测与参考应用程序的偏离

现在回到我在开头提到的问题陈述：一旦代码生成（无论是用 AI 还是用服务模板），然后进一步扩展和维护，代码库往往会偏离参考应用程序的典范。

因此在第二步中，我想知道如何利用这种方法在代码库和参考应用程序之间进行"代码模式偏离检测（code pattern drift detection）"。我用一个相对简单的例子进行了测试，我在参考应用程序的 controller 类中添加了一个 logger（日志记录器）和 log.debug 语句：

然后我扩展了 MCP 服务器，提供对参考应用程序中 git commits（Git 提交）的访问。让 agent（智能体）首先查找参考应用程序中的实际更改，这使我对偏离检测的范围有了一些控制权，我可以使用 commits 向 AI 准确传达我感兴趣的是哪种类型的偏离。在我引入这个方法之前，当我只是让 AI 比较参考 controller 和现有 controller 时，它有点过度执行，进行了大量无关的比较，而我发现这种 commit 范围限定方法有良好的效果。

在第一步中，我只是让 AI 为我生成一份识别所有偏离的报告，这样我就可以审查和编辑该报告，例如删除不相关的发现。在第二步中，我让 AI 根据报告编写代码来弥补已识别的差距。

### AI 何时带来新的价值？

像添加 logger 或更改日志框架这样简单的事情，也可以通过 OpenRewrite 等 codemod 工具（代码修改工具）确定性地在完成。所以在选择 AI 之前请记住这一点。

AI 能够大放异彩的场景是：当我们需要处理比基于正则表达式的 codemod 方案更动态的编码偏离时。在日志示例的高级形式中，这可能是将非标准化的、丰富的日志语句转换为结构化格式，而 LLM 可能更擅长将各种现有的日志消息转换为相应的结构。

示例 MCP 服务器包含在伴随原始文章的仓库中。

最新文章（3 月 04 日）：

Humans and Agents in Software Engineering Loops（软件工程循环中的人类与智能体）

上一篇文章：

To vibe or not to vibe（共鸣与否）

下一篇文章：

Understanding Spec-Driven-Development: Kiro, spec-kit, and Tessl（理解规格驱动开发：Kiro、spec-kit 和 Tessl）
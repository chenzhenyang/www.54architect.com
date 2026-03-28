---
title: 反模式：需要避免的事情
tags:
  - AI
  - Agentic Engineering
  - Anti-Patterns
  - Programming
categories:
  - Technology
abbrlink: 2896843582
date: 2026-03-08 00:45:00
updated: 2026-03-08 00:45:00
sidebar: 
  order: 005
---

在我们奇怪的 agentic engineering 新世界中，有一些行为是反模式。

## 将未审查的代码强加给协作者

这个反模式很常见且非常令人沮丧。

**不要提交你自己没有审查过的代码的 pull requests**。

如果你打开一个 PR，里面有 agent 为你生成的数百（或数千）行代码，而你自己没有做工作来确保代码是功能性的，你就是将实际工作委托给其他人。

他们可以自己提示 agent。你甚至提供了什么价值？

如果你将代码提交审查，你需要确信它已经准备好让其他人花时间在上面。初始审查是你的责任，不应该是你外包给别人的东西。

一个好的 agentic engineering pull request 具有以下特征：

* 代码有效，你有信心它有效。[你的工作是交付有效的代码](https://simonwillison.net/2025/Dec/18/code-proven-to-work/)。
* 更改足够小，可以有效审查，而不会给审查者施加太多额外的认知负荷。几个小 PR 胜过一个大的，使用编码 agent 为你做 Git 操作，将代码分成单独的提交很容易。
* PR 包括额外的上下文来帮助解释更改。更改服务的更高级目标是什么？链接到相关的问题或规范在这里很有用。
* Agent 编写令人信服的 pull request 描述。你也需要审查这些！期望别人阅读你自己没有阅读和验证的文本是不礼貌的。

鉴于将未审查的代码倾倒给其他人是多么容易，我建议包括某种形式的证据，表明你自己投入了额外的工作。关于你如何手动测试它的笔记，对特定实现选择的评论，甚至是功能工作的截图和视频，对于证明审查者的时间不会浪费在挖掘细节上很有帮助。

---

**原文链接**: https://simonwillison.net/guides/agentic-engineering-patterns/anti-patterns/

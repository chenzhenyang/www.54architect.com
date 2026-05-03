---
title: Equipping agents for the real world with Agent Skills  Anthropic | Claude
tags:
- AI
- Technology
categories:
- Technology
lastUpdated: 2026-04-15
skill_id: db993134
generated: 2026-04-15 13:33:55.743315
original_url: https://claude.com/blog/equipping-agents-for-the-real-world-with-agent-skills
---
_更新：我们已将 [Agent Skills](https://agentskills.io/) 发布为跨平台可移植性的开放标准。（2025 年 12 月 18 日）_

随着模型能力的提升，我们现在可以构建与完整计算环境交互的通用 agent。例如，[Claude Code](https://claude.com/product/claude-code) 可以使用本地代码执行和文件系统跨领域完成复杂任务。但是随着这些 agent 变得更强大，我们需要更多可组合、可扩展和可移植的方式为它们装备领域特定的专业知识。

这促使我们创建了 [**Agent Skills**](https://www.anthropic.com/news/skills)：有组织的指令、脚本和资源文件夹，agent 可以发现并动态加载它们以更好地执行特定任务。Skills 通过将你的专业知识打包成可组合的资源来扩展 Claude 的能力，将通用 agent 转变为适合你需求的专用 agent。

为 agent 构建技能就像为新员工编写入职指南。与其为每个用例构建碎片化的定制 agent，任何人现在都可以通过捕获和分享他们的程序性知识，用可组合的能力专门化他们的 agent。在本文中，我们解释什么是 Skills，展示它们如何工作，并分享构建你自己的技能的最佳实践。

![要激活技能，你只需要编写一个带有自定义指导的 SKILL.md 文件给你的 agent。](https://cdn.prod.website-files.com/68a44d4040f98a4adf2207b6/697a4bc12d27779c3e377962_image.webp)

技能是一个包含 SKILL.md 文件的目录，其中包含有组织的指令、脚本和资源文件夹，为 agent 提供额外的能力。

## 技能的结构

要查看 Skills 的实际效果，让我们通过一个真实示例：为 [Claude 最近推出的文档编辑能力](https://www.anthropic.com/news/create-files)提供动力的技能之一。Claude 已经对理解 PDF 了解很多，但直接操作它们的能力有限（例如填写表单）。这个 [PDF skill](https://github.com/anthropics/skills/tree/main/document-skills/pdf) 让我们可以给 Claude 这些新能力。

最简单的情况下，技能是一个包含 `SKILL.md 文件` 的目录。此文件必须以 YAML frontmatter 开头，其中包含一些必需的元数据：`name` 和 `description`。在启动时，agent 将每个已安装技能的 `name` 和 `description` 预加载到其系统提示词中。

此元数据是 _渐进式披露_ 的**第一级**：它提供足够的信息让 Claude 知道何时应该使用每个技能，而无需将所有内容加载到上下文中。此文件的实际主体是**第二级**细节。如果 Claude 认为技能与当前任务相关，它将通过读取完整的 `SKILL.md` 到上下文来加载技能。

![SKILL.md 文件的解剖结构，包括相关元数据：名称、描述和与技能应采取的具体操作相关的上下文。](https://cdn.prod.website-files.com/68a44d4040f98a4adf2207b6/697a4bc12d27779c3e37795c_image.webp)

SKILL.md 文件必须以 YAML Frontmatter 开头，其中包含文件名和描述，在启动时加载到系统提示词中。

随着技能复杂性的增长，它们可能包含太多上下文而无法适应单个 `SKILL.md`，或者仅在特定场景中相关的上下文。在这些情况下，技能可以在技能目录中捆绑额外的文件，并从 `SKILL.md` 按名称引用它们。这些额外的链接文件是**第三级**（及更远）的细节，Claude 可以选择仅在需要时导航和发现它们。

在下面显示的 PDF 技能中，`SKILL.md` 引用了两个额外的文件（`reference.md` 和 `forms.md`），技能作者选择将它们与核心 `SKILL.md` 捆绑在一起。通过将填写表单的指令移动到单独的文件（`forms.md`），技能作者能够保持技能核心简洁，相信 Claude 只在填写表单时读取 `forms.md`。

![如何将额外内容捆绑到 SKILL.md 文件中。](https://cdn.prod.website-files.com/68a44d4040f98a4adf2207b6/697a4bc12d27779c3e377966_image.webp)

你可以将更多上下文（通过额外文件）纳入你的技能中，然后由 Claude 根据系统提示词触发。

渐进式披露是使 Agent Skills 灵活和可扩展的核心设计原则。就像一本组织良好的手册，从目录开始，然后是特定章节，最后是详细的附录，skills 让 Claude 仅在需要时加载信息：

![此图描述了 Skills 中上下文的渐进式披露。](https://cdn.prod.website-files.com/68a44d4040f98a4adf2207b6/697a4bc12d27779c3e37795f_image.webp)

具有文件系统 and 代码执行工具的 agent 在处理特定任务时不需要将整个技能读取到它们的上下文窗口中。这意味着可以捆绑到技能中的上下文量实际上是无限的。

### Skills 和上下文窗口

下图显示了当技能被用户消息触发时上下文窗口如何变化。

![此图描述了技能如何在你的上下文窗口中触发。](https://cdn.prod.website-files.com/68a44d4040f98a4adf2207b6/697a4bc12d27779c3e377956_image.webp)

技能通过系统提示词在上下文窗口中触发。

显示的操作序列：

1. 开始时，上下文窗口具有核心系统提示词和每个已安装技能的元数据，以及用户的初始消息；
2. Claude 通过调用 Bash 工具读取 `pdf/SKILL.md` 的内容来触发 PDF 技能；
3. Claude 选择读取与技能捆绑的 `forms.md` 文件；
4. 最后，Claude 在从 PDF 技能加载相关指令后继续执行用户的任务。

### Skills 和代码执行

Skills 还可以包括代码供 Claude 自行决定作为工具执行。

大型语言模型在许多任务上表现出色，但某些操作更适合传统代码执行。例如，通过令牌生成排序列表比简单地运行排序算法昂贵得多。除了效率问题外，许多应用程序需要只有代码才能提供的确定性可靠性。

在我们的示例中，PDF 技能包括一个预先编写的 Python 脚本，读取 PDF 并提取所有表单字段。Claude 可以运行此脚本，而无需将脚本或 PDF 加载到上下文中。因为代码是确定性的，所以此工作流程是一致和可重复的。

![此图描述了代码如何通过 Skills 执行。](https://cdn.prod.website-files.com/68a44d4040f98a4adf2207b6/697a4bc12d27779c3e377959_image.webp)

Skills 还可以包括代码供 Claude 根据任务性质自行决定作为工具执行。

## 开发和评估技能

以下是一些开始创作和测试技能的有用指南：

* **从评估开始：** 通过在代表性任务上运行 agent 并观察它们在哪里挣扎或需要额外上下文来识别 agent 能力中的特定差距。然后逐步构建技能来解决这些缺点。
* **为规模构建结构：** 当 `SKILL.md` 文件变得笨重时，将其内容拆分为单独的文件并引用它们。如果某些上下文互斥或很少一起使用，保持路径分开将减少令牌使用。最后，代码可以作为可执行工具和文档。应该清楚 Claude 是直接运行脚本还是将它们作为参考读取到上下文中。
* **从 Claude 的角度思考：** 监控 Claude 在真实场景中如何使用你的技能，并根据观察进行迭代：注意意外的轨迹或过度依赖某些上下文。特别注意你的技能的 `name` 和 `description`。Claude 将在决定是否响应当前任务触发技能时使用这些。
* **与 Claude 迭代：** 当你与 Claude 一起处理任务时，要求 Claude 将其成功方法和常见错误捕获到技能中的可重用上下文和代码中。如果它在使用技能完成任务时偏离轨道，要求它自我反思出了什么问题。此过程将帮助你发现 Claude 实际需要什么上下文，而不是试图提前预测它。

### 使用 Skills 时的安全考虑

Skills 通过指令和代码为 Claude 提供新功能。虽然这使它们强大，但也意味着恶意技能可能在使用它们的环境中引入漏洞，或指示 Claude 泄露数据并采取意外操作。

我们建议仅从受信任的来源安装技能。从不太受信任的来源安装技能时，在使用前彻底审计它。首先阅读技能中捆绑文件的内容以了解它的功能，特别注意代码依赖项和捆绑资源（如图像或脚本）。同样，注意技能中指示 Claude 连接到可能不受信任的外部网络源的指令或代码。

## Skills 的未来

Agent Skills [今天支持](https://www.anthropic.com/news/skills) 跨 [Claude.ai](http://claude.ai/redirect/website.v1.bdb29daa-1a07-41ec-87f6-579dc33634bd)、Claude Code、Claude Agent SDK 和 Claude Developer Platform。

在接下来的几周，我们将继续添加支持创建、编辑、发现、分享和使用 Skills 完整生命周期的功能。我们特别兴奋 Skills 帮助组织和个体与 Claude 分享他们的上下文和工作流程的机会。我们还将探索 Skills 如何通过教授 agent 涉及外部工具和软件的更复杂工作流程来补充 [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) 服务器。

展望未来，我们希望能够让 agent 自行创建、编辑和评估 Skills，让它们将自己的行为模式编纂成可重用的能力。

Skills 是一个简单的概念，具有相应简单的格式。这种简单性使组织、开发人员和最终用户更容易构建定制化 agent 并赋予它们新功能。

我们很高兴看到人们用 Skills 构建什么。立即开始，查看我们的 Skills [文档](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview) 和 [cookbook](https://github.com/anthropics/claude-cookbooks/tree/main/skills)。

## 致谢

由 Barry Zhang、Keith Lazuka 和 Mahesh Murag 撰写，他们都非常喜欢文件夹。特别感谢 Anthropic 中许多倡导、支持和构建 Skills 的其他人。

![](https://cdn.prod.website-files.com/68a44d4040f98a4adf2207b6/690937bee860a953417a8eee_Object-CodeBrowserGlobe.svg)![](https://cdn.prod.website-files.com/6889473510b50328dbb70ae6/6889473610b50328dbb70b58_placeholder.svg)![](https://cdn.prod.website-files.com/68a44d4040f98a4adf2207b6/6903d22562f020146c9ec973_f8f4644253bde2f901550431b871b6dcf91e5d9d-1000x1000.svg)![](https://cdn.prod.website-files.com/68a44d4040f98a4adf2207b6/6903d22d0099a66d72e05699_33ddc751e21fb4b116b3f57dd553f0bc55ea09d1-1000x1000.svg)![](https://cdn.prod.website-files.com/68a44d404040f98a4adf2207b6/6903d2308749b4e883cc44b7_e029027e0b3beeb5b629bd4a26143597e7775b38-1000x1000.svg)![](https://cdn.prod.website-files.com/68a44d4040f98a4adf2207b6/6903d22e13864f88ea55c2d8_b5c98d26c46edc43193e7f7e28a00633a538bb9c-1000x1000.svg)

---

**原文链接**: [https://claude.com/blog/equipping-agents-for-the-real-world-with-agent-skills](https://claude.com/blog/equipping-agents-for-the-real-world-with-agent-skills)

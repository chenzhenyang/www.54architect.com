---
title: Humans and Agents in Software Engineering Loops
skill_id: 3747f2de
original_url: 'https://martinfowler.com/articles/exploring-gen-ai/humans-and-agents.html'
tags:
  - AI
  - Technology
categories:
  - Technology
abbrlink: 1409738761
generated: 2026-03-11 14:03:42
date: 2026-03-11 14:06:43
updated: 2026-03-11 14:06:43
sidebar: 
  order: 109
---

人类应该远离软件开发过程让 AI 自由发挥（vibe code），还是需要开发者在循环中检查每一行代码？我相信答案应该聚焦于将想法转化为成果这一目标。我们人类的正确位置是构建和管理这个工作循环，而不是要么完全交给 Agent，要么微观管理它们的产出。让我们称这种方式为"在循环之上"（on the loop）。

作为软件创造者，我们通过将想法转化为可运行的软件并在学习和演进想法的过程中不断迭代来构建成果。这是"为什么循环"（why loop）。在 AI 崛起之前，人类将运行这个循环，因为我们才是想要其产出的人。

构建软件的过程是"如何循环"（how loop）。如何循环涉及创建、选择和使用中间产物，如代码、测试、工具和基础设施。它还可能涉及技术设计和架构决策记录（ADR）等文档。我们习惯于将这些视为交付物，但中间产物实际上只是达到目的的手段。

![The software delivery feedback loops: An upper "why" loop connected to a lower "how" loop. The why loop iterates over an idea and working software. The how loop iterates over interim artefacts like specs, code, and tests.](https://raw.githubusercontent.com/chenzhenyang/chenzhenyang.github.io/master/images/humans-agents-image1.png)

_图 1：为什么循环在想法和软件之间迭代，如何循环在构建软件的过程中迭代_

实际上，如何循环包含多个循环。最外层的如何循环为为什么循环指定并交付可运行的软件。最内层的循环生成并测试代码。中间的循环将更高层次的工作分解为更小的任务供下层循环实现，然后验证结果。

![Multiple levels of "how" loops supporting the "why" loop. An outer loop iterates on a feature. A middle loop iterates on stories. An inner loop iterates on code.](https://raw.githubusercontent.com/chenzhenyang/chenzhenyang.github.io/master/images/humans-agents-image2.png)

_图 2：如何循环有多个层次的内层循环，它们工作在完整实现的更小增量上_

这些循环可能遵循设计评审和测试阶段等实践。它们可能通过应用微服务或 CUPID 等架构方法和设计模式来构建系统。就像从这些实践和模式中产生的中间产物一样，它们都是实现我们真正关心的成果的手段。

但也许我们并不关心用于实现目标的手段？也许我们可以让大语言模型（LLM）随意运行如何循环？

## 人类在循环之外

许多人已经发现了让人类只专注于为什么循环而将如何循环交给 Agent 处理的乐趣。这是"氛围编程"（vibe coding）的常见定义。规范驱动开发（Spec Driven Development, SDD）的一些解释也大致相同，人类投入精力编写我们想要的成果，但不规定 LLM 应该如何实现它。

![Humans Outside the loop: An upper "why" loop with a human on top. The loop iterates over an idea and working software. This is connected to a lower "how" loop by a robot, which iterates over interim artefacts like code.](https://raw.githubusercontent.com/chenzhenyang/chenzhenyang.github.io/master/images/humans-agents-image3.png)

_图 3：人类运行为什么循环，Agent 运行如何循环_

人类远离如何循环的吸引力在于，为什么循环才是我们真正关心的。软件开发是一个混乱的领域，不可避免地会陷入过度工程化的过程和应对技术债务的泥潭。而且迄今为止，每个新的 LLM 模型都更擅长接受用户提示并输出可运行的软件。如果你对其输出不满意，告诉 LLM，它会给你另一个迭代版本。

如果 LLM 可以在没有我们的情况下编写和修改代码，我们还在乎代码是否"干净"吗？只要 LLM 能理解，变量名是否清晰表达其目的并不重要。也许我们甚至不需要关心软件是用什么语言编写的？

我们关心的是外部质量，而不是为了内部质量本身。外部质量是我们作为软件用户或其他利益相关者所体验到的。功能质量是必须的，系统需要正确工作。对于生产软件，我们还关心非功能性的运营质量。我们的系统不应该崩溃，应该快速运行，我们也不希望它将机密数据发布到社交媒体网站。我们不想产生巨额的云托管费用，而且在许多领域我们需要通过合规性审计。

当内部质量影响外部成果时，我们才关心它。当人类编码者在代码库中爬取、添加功能和修复 bug 时，他们可以在干净的代码库中更快、更可靠地完成工作。但 LLM 并不关心开发者体验，不是吗？

理论上，我们的 LLM Agent 可以生成一个极其复杂的意大利面条式代码库，通过运行临时 shell 命令来测试和修复它，最终产生一个正确、合规、高性能的系统。我们只需让我们的 swarm（集群）像 Ralph Wiggum 一样在它上面工作，运行在从它们漂浮的沸腾海洋中获取能源的数据中心里，最终我们会达到目标。

实际上，设计良好、结构清晰的代码库相比混乱的代码库具有对外部重要的优势。当 LLM 能更快地理解和修改它们工作的代码时，它们会工作得更快，更少陷入螺旋。我们确实在乎构建我们所需系统的时间和成本。

## 人类在循环之中

一些开发者认为，保持内部质量的唯一方法是紧密参与如何循环的最低层次。通常，当 Agent 在某些破损的代码上陷入螺旋时，人类开发者可以在几秒钟内理解并修复它。在许多情况下，人类的经验和判断力仍然超过 LLM。

![Humans in the loop: A single "why+how" loop with a human at the top and a robot at the bottom. The loop iterates over idea, interim artefacts like code and tests, and the working software.](https://raw.githubusercontent.com/chenzhenyang/chenzhenyang.github.io/master/images/humans-agents-image4.png)

_图 4：人类运行为什么循环和如何循环_

当人们谈论"人类在循环中"时，他们通常指的是人类作为最内层循环（代码生成发生的地方）的守门人，例如手动检查 LLM 创建的每一行代码。

当我们坚持过于紧密地参与过程时，挑战在于我们会成为瓶颈。Agent 生成代码的速度比人类手动检查的速度快。关于使用 AI 的开发者生产力的报告显示出混合的结果，这可能至少部分是因为人类花费更多时间指定和审查代码，而不是通过使用 LLM 生成代码所节省的时间。

我们需要采用经典的"左移"（shift left）思维。曾经，我们编写所有代码，传递给 QA 团队测试，然后尝试修复足够的 bug 以发布版本。然后我们发现，当开发者在工作的同时编写和运行测试时，我们可以立即发现和修复问题，这使得整个过程更快、更可靠。

对人类有效的方法对 Agent 也有效。当 Agent 能够自己评估所生成代码的质量，而不是依赖我们为其检查时，它们会产生更好的代码。我们需要指导它们我们在寻找什么，并为它们提供实现这一目标的最佳方法的指导。

## 人类在循环之上

我们可以让 Agent 更擅长生成产出，而不是亲自检查它们的产出。控制如何循环内不同层次循环的规范、质量检查和工作流指导的集合是 Agent 的 harness（操控框架）。构建和维护这些 harness 的新兴实践，[Harness Engineering（操控框架工程）](https://martinfowler.com/articles/exploring-gen-ai/harness-engineering.html)，就是人类在循环之上工作的方式。

![Humans on the loop: An upper "why" loop connected to a lower "how" loop by a human. The why loop iterates over an idea and working software.A robot sits at the bottom of the lower "how" loop, which iterates over interim artefacts like specs and code.](https://raw.githubusercontent.com/chenzhenyang/chenzhenyang.github.io/master/images/humans-agents-image5.png)

_图 5：人类定义如何循环，Agent 运行它_

类似于在循环之上的概念也被描述为"中间循环"，包括 [软件开发未来研讨会](https://martinfowler.com/bliki/FutureOfSoftwareDevelopment.html) 的参与者。中间循环指的是将人类的注意力转移到比编码循环更高层次的循环上。

在循环之中和在循环之上的区别最明显地体现在当我们对 Agent 的产出（包括中间产物）不满意时所做的事情。"在循环之中"的方式是修复产物，无论是直接编辑它，还是告诉 Agent 进行我们想要的修正。"在循环之上"的方式是改变产生该产物的 harness，以便它产生我们想要的结果。

我们通过持续改进 harness 来持续改进我们获得的成果质量。然后我们可以将其提升到另一个层次。

## Agent 飞轮

下一个层次是人类指导 Agent 来管理和改进 harness，而不是手动完成。

![Flywheel: An upper "why" loop connected to a lower "how" loop by a human and a robot. The why loop iterates over an idea and working software. The how loop iterates over interim artefacts like specs.](https://raw.githubusercontent.com/chenzhenyang/chenzhenyang.github.io/master/images/humans-agents-image6.png)

_图 6：人类指导 Agent 构建和改进如何循环_

我们通过为 Agent 提供评估循环性能所需的信息来构建飞轮。一个好的起点是 harness 中已经包含的测试和评估。随着我们为其提供更丰富的信号，飞轮变得更强大。添加测量性能和验证失败场景的流水线阶段。引入来自生产环境的运营数据、用户旅程日志和商业结果，以扩大 Agent 可以分析的范围和深度。

对于工作流的每个步骤，我们让 Agent 审查结果并推荐对 harness 的改进。范围包括可能改进这些结果的工作流任何上游部分的改进。我们现在拥有的是一个能够生成自我改进建议的 Agent harness。

我们首先以交互方式考虑这些建议，提示 Agent 实施具体的更改。我们也可以让 Agent 将它们的建议添加到产品待办事项列表（backlog）中，这样我们就可以确定优先级并安排它们，让 Agent 在自动化流程中接收、应用和测试这些建议。

随着我们获得信心，Agent 可以为它们的建议打分，包括风险、成本和收益。然后我们可能会决定具有某些分数的建议应该自动批准和应用。

在某个时刻，这看起来可能很像人类远离循环的老派氛围编程。我怀疑对于经常完成的标准类型工作，当改进循环达到收益递减时，情况将是这样。但通过工程化 harness，我们不仅会获得一次性的"足够好"的解决方案，还会获得稳健的、甚至可能是反脆弱的系统，它们能够持续自我改进。

* * *


---

**原文链接**: [https://martinfowler.com/articles/exploring-gen-ai/humans-and-agents.html](https://martinfowler.com/articles/exploring-gen-ai/humans-and-agents.html)

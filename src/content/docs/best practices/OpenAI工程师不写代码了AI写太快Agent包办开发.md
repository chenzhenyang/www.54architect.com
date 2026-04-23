---
title: "OpenAI 工程师分享 AI 编程实践"
description: 'OpenAI 工程师分享 AI 编程实践：Agent 编码速度已超过人类审查能力，AI 直接包办开发全流程，探讨 Harness Engineering 新模式。'
lastUpdated: 2026-03-09
tags:
  - AI
  - Agent
  - 工程实践
categories:
  - AI 编程
author: "木子"
original_url: https://www.infoq.cn/article/XiMNJ9e87lH8Xu9CpUHG
---
[![logo](https://static001.geekbang.org/static/web/nuxt/www.infoq.cn/logo.BJF4WFeC.png)](/)

[首页 ](https://www.infoq.cn/)

[AI会议 hot](https://www.infoq.cn/archives)

[AI课程 hot](https://time.geekbang.org/resource?pt=1)

[AI应用 hot](https://agicamp.com/?utm_source=infoqbar)

[报告 ](https://www.infoq.cn/minibook)

[HarmonyOS ](https://www.infoq.cn/zones/harmonyos/)

[Snowflake new](https://www.infoq.cn/space/snowflake)

更多 __



 __ 写点什么 

#### __ 创作场景

 __

  * 记录自己日常工作的实践、心得
  * 从 0 到 1 详细介绍你掌握的一门语言、一个技术，或者一个兴趣、爱好 
  * 或者，就直接把你的个人博客、公众号直接搬到这里

登录/注册

  * AI&大模型
  * 芯片&算力
  * 管理/文化
  * 

 __

 __

 __

 __

# OpenAI 工程师不写代码了：AI 写得太快，人类检查跟不上，Agent 直接包办开发

北京



00:00

[1.0x __](javascript:;)

大小：1.90M时长：00:00

![](https://static001.infoq.cn/resource/image/1e/8b/1eayyb09fba7b7d4f15989d56b92f18b.png?x-oss-process=image/resize,w_726)

OpenAI 最近在一篇 Blog 中说了件挺炸裂的事：**他们自己的工程师，已经不怎么写代码了** 。

  

在一个内部项目里，短短五个月，就产出了 100 万行代码，而且没一行手写，全都是 **Codex** 写的。

  

这些代码并不是什么零散脚本，而是从零开始搭出来的一整套软件产品内部 Beta 版：从应用逻辑、基础设施，到工具、文档和内部开发者工具，几乎一应俱全。

  

![](https://static001.geekbang.org/infoq/47/472497725414c36b6810986bee792705.png)

  

这种变化，或许能从 OpenAI 内部一直以来的**工程师文化** 中找到一些线索。

  

一位曾参与 Codex 项目的 OpenAI 工程师 Calvin French-Owen，在离职后写过一篇博客，虽然他在其中吐槽说，过去一年里 OpenAI 员工规模迅速扩张，带来了不少混乱。

  

不过他同时也提到，公司内部依然保留着很强的创业公司氛围：团队小、决策快，工程师拥有很高的自主权。

  

另外，很多科技巨头是高层定路线、然后团队执行，但在 OpenAI，通常没有明确的长期 roadmap，研究员往往自己发现问题、提出想法，小团队围绕好点子自然形成并推进项目。

  

他表示，真正推动进展的好想法可能随时从任何地方随时，而不是来自某个宏大计划。

  

> “OpenAI 非常注重**自下而上** 的方式，尤其是在研究方面。”

  

![](https://static001.geekbang.org/infoq/96/96a2969ab4d073b11221f90eee6675fc.png)

  

比如 Codex，最初其实诞生在 OpenAI 的一个只有十几人的小团队里。这个团队在 7 周内几乎不眠不休，把 Codex 从想法一路推到了上线。

  

而现在这个“OpenAI 工程师不写代码”一事，其实也要从公司一个团队，在开发流程中发现的新瓶颈说起。

  

现在 AI Coding 这件事已经屡见不鲜。但当 Codex 开始大规模生成代码后，OpenAI 的这研发团队很快发现一个**新问题：**

  

代码生成已经不慢了，慢的是让人类来检查这些代码。

  

人的时间和注意力是有限的。在整个开发流程里，最容易卡住的环节反而变成了 QA（质量测试）。

  

为了解决这个问题，OpenAI 的工程师换了个思路：**干脆让 Codex 模仿工程师，自己去“看”和“用”应用** 。

  

那 OpenAI 的工程师现在不写代码了，他们到底在做什么？

  

——**设计环境、搭反馈循环、定义架构约束** ，然后让 agent 写。

  

文章中强调一句话：**“人类掌舵，智能体执行”** 。

  

他们管这叫 **Harness Engineering** ，直译过来的话就是“AI 驾驭工程”。

  

## ##工程师变成“能力架构师”

  

这个项目始于 2025 年 8 月下旬，从向一个完全空白的代码仓库提交第一行内容开始。

  

初始架构，包括代码仓库结构、CI 配置、格式化规则、包管理器设置和应用框架——都不是工程师手写的，而是在一小套模板的指导下，由 **Codex CLI 调用 GPT-5 自动生成** 。

  

甚至连那份告诉 agent“该如何在这个仓库里工作”的 **AGENTS.md** ，也是 Codex 自己写出来的。

  

换句话说，这个系统从诞生那刻起，就几乎没有人工代码。整个代码仓库，都是被 agent 一步一步搭起来的。

  

不过，一开始事情并没有想象中那么顺利：起初项目推进速度缓慢，但问题并不在 Codex 的能力，而在环境——规则不清晰、工具不完整、系统约束还没建立起来。

  

有网友“一针见血”道：

  

> “最扎心的一句：agent 反复犯错，不是能力问题，是你脑子里的判断力没写下来。你不写，它第一百次还犯同样的蠢。”

  

![](https://static001.geekbang.org/infoq/ca/cab316d5bf3242d37372776d678c74a1.png)

  

于是再遇到开发卡住时，团队不再想着“再改一段代码试试”，而是先问一个问题：**agent 到底缺什么能力？**

  

再把这种能力变成它能读懂、能执行、还能被强制遵守的规则。

  

也就是说，面对当下 agent 自己就能测试、改 bug 的情形，工程师的工作重点从“写代码” 变成了另一件事：**让 Codex 更容易把事情做对，给 agent“补能力”。**

  

从这个角度看，工程师的工作其实转向了更高一层：用一句话来说，就是**拆解任务、设计能力、搭建系统，让 agent 可以稳定地产生正确的代码。**

  

具体来说，大致有这几件事情：

  

**第一件事** ，就是**让应用对 AI “可读”** 。

  

正如上文提到的，需要人为把 agent 接入 Chrome DevTools 协议，让它能“触控”UI。

  

**工程师要做的第二件事情，就是把“隐性知识”全部写进代码仓库， 变成机器可读的知识。**

  

对 agent 而言，无法在运行时访问的内容就等于不存在。比如存储在 Google Docs、聊天记录或人们头脑中的知识吗，这些都无法被系统访问。

  

不过，不可以把所有规则和说明一次性塞给 Codex，而是要先给它一个导航，再让它自己去查细节。

  

研究研究团队曾尝试过直接给 agent 一个巨大的 **AGENTS.md** 文件，结果很快发现行不通。

  

主要原因是，上下文是稀缺资源，说明书越厚，真正重要的信息反而越容易被淹没；而且这种大文档很快就会过时，也很难验证和维护。

  

他们把这段经验总结成了一句：

  

> “要给 Codex 的是一张地图，而不是一本 1000 页的说明书。”

  

![](https://static001.geekbang.org/infoq/75/75916646e94d1686d1488a51c28eea82.png)

该示意图由 AI 生成

  

工程师要做的**第三件事，是设计“AI 友好”的架构。**

  

AI 在结构清晰、边界明确的系统里效率最高。对人来说，这些规则可能显得死板，但对 agent 来说，这是效率倍增器。

  

所以 OpenAI 的这个团队设计了一套严格架构,每个业务域必须按固定层级：Types→ Config→ Repo→ Service→ Runtime→ UI。

  

依赖方向是强制的。任何违反都会被自动阻止。

  

**第四件事，是把“品味”变成规则。**

  

“在 AI 时代，人类最重要的能力是 Taste。”随着大模型越来越强，这样的声音不绝于耳。

  

这篇 Blog 中，有一个很有意思的概念：**taste invariants（品味不变量）。**

  

意思是，工程师的审美，比如：文件大小限制、命名规则、日志结构、API 规范等，都被写成 **lint 规则** 。

  

这样 AI 每次写代码都会自动遵守：“人类的品味一旦被捕捉，就可以应用到每一行代码。”

  

在实际开发中，人类主要通过提示与系统交互：描述任务、启动 agent，然后让 Codex 自动生成 Pull Request。

  

接下来的一整套流程，包括代码自检、agent 评审、根据反馈修改、再次提交，基本都由 agent 自己完成，并不断循环，直到所有评审通过。

  

**第五件事，就是清理 AI 产生的“垃圾”。**

  

文章指出，完全自主的智能体也引入了新的问题。

  

当代码几乎全部由 Codex 生成后，一个新问题也出现了：AI 会不断复制代码库里已有的模式，包括那些不太好的写法，时间一长代码风格就会慢慢“漂移”。

  

一开始，团队计划每周抽一天时间手动清理这些“AI 残渣”，但很快发现这种方式根本不具备可扩展性。

  

后来他们把工程师的经验和偏好写成一套“黄金原则”，比如优先使用共享工具库、严格校验数据结构而不是“猜着写”。

  

然后将这套原则直接编码进代码仓库，让 Codex 自动扫描问题并发起重构 PR。

  

这样就像给代码库加了一套“垃圾回收机制”：小问题可以随时清理，技术债不会越滚越大。

  

这篇 Blog 在技术圈引起了的广泛关注和讨论，有人认为，这个 Harness Engineering 本质上是一种现代版的控制论：工程师不再直接写代码，而是设计系统、规则和反馈回路，让 agent 自动完成工作。

  

他表示，这种模式，其实在历史上已经出现过三次了。

  

从瓦特蒸汽机的调速器，到 Kubernetes 的控制器，再到今天的 AI agent；真正的变化不是“机器替代人”，而是**人的角色，从执行者变成系统的设计者和校准者** ：

  

> “你不再亲自去拧阀门，而是开始掌舵。
> 
>   
> 
> 
> 每当这种模式出现，背后通常都是因为有人构建出了足够强大的传感器和执行器，能够在那个层级上把反馈回路真正闭合起来。”

  

![](https://static001.geekbang.org/infoq/11/115718334d9af3cd66a0b03174e9adf1.png)

  

## ##Agent 都开始包办开发流程了

  

为什么 OpenAI 的工程师可以不再写代码了？不妨来看看他们的 **agent 现在已经能干到什么程度。**

  

前文提到，OpenAI 的工程师换了个思路：**干脆让 Codex 模仿工程师，自己去“看”和“用”应用** 。

  

**第一，是让 agent 能“看见”应用界面（UI）。**

  

他们把 Chrome DevTools 协议接入到 agent 的运行环境里。这样一来，Codex 就可以像开发者在浏览器里调试一样操作页面、读取日志、抓取 DOM、截屏观察界面......

  

这一步其实非常关键，因为 **LLM 本身是看不见 UI 的** 。

  

接入 DevTools 之后，Codex 就相当于有了“眼睛”和“手”：

  

可以通过截图和 DOM 观察页面，通过 console 和 network 监听运行状态，还能自己点击、输入、导航。

  

![](https://static001.geekbang.org/infoq/97/97746ec3a310d162c2bc81e8f4db4118.png)

该示意图由 AI 生成

  

有了这些能力，agent 就可以自己复现 bug、自动跑 UI 测试、验证修复是否生效。

这样一来，Codex 就不只是写代码，还开始像一个自动化 QA 工程师一样工作：自己测试自己写的代码，并反复修复，直到系统通过测试。

  

换句话说，原本需要人工完成的大量测试和调试工作，被自动化了。

  

![](https://static001.geekbang.org/infoq/87/87010c1930f9eb41ddb6cfbe1453acdc.png)

  

就像下面这张图里展示的那样：最核心的一步是 “Loop Until Clean”——不断测试、修复、再测试，直到系统没有错误。

  

**第二点，只能操作 UI 还不够，还得让 agent 看见系统内部发生了什么。**

  

为此，OpenAI 给 Codex 接入了一整套**可观测系统（Observability）** 。

  

应用在运行时会产生三类关键数据，也是工程师排查问题时最常用的信号：

  

  * **Logs（日志）**

  * **Metrics（性能指标）**

  * **Traces（调用链）**

  

这些数据会先被一个叫 **Vector** 的组件统一收集，再送到本地的可观测系统里。

  

![](https://static001.geekbang.org/infoq/a5/a57702c1b53ad3f6215a9b267d7cbc86.png)

  

这样一来，Codex 就能像工程师一样查系统状态：哪个服务报错了？哪个接口变慢了？请求卡在哪一层？

  

当发现问题后，Codex 会自己修改代码、提交 Pull Request、重启应用、重新运行任务，再观察系统指标有没有改善。

  

整个过程会形成一个**自动反馈循环** ：发现问题 → 修改代码 → 再运行 → 再观察。

  

一直重复，直到问题消失。

  

换句话说，Codex 不只是看代码，还能像运维一样查日志、看性能数据，判断系统哪里出了问题，再修改代码验证修复效果。

  

这篇博文中提到，给定一个提示，Codex 驱动的 agent 就可以：

  

![](https://static001.geekbang.org/infoq/b5/b53ab402189116ff34501283a29791a6.png)

  

agent 不再只是一个写代码的工具，而是开始承担完整的软件开发流程。

  

整个开发流程大致为：**Codex 写代码 → 启动应用 → 像用户一样操作页面 → 检查结果 → 如果不对就改代码再跑。**

  

不过需要说明的是，这套流程之所以能跑通，很大程度上依赖他们为这个代码仓库专门设计的结构和工具链。

  

如果没有类似的工程投入，这种“全自动开发流程”目前还很难直接照搬。

  

目前来看，这套“agent 写代码、人类设计系统”的模式，在 OpenAI 内部运行得还不错；但很多问题仍在探索阶段：比如 AI 生成的代码库长期会不会失控，人类判断力该如何嵌入系统。

  

不过可以预见的是，**软件工程的重点可能会逐渐从“写代码”，转向设计环境、规则和反馈机制；** 让像 Codex 这样的 agent，可以更稳定地参与构建和维护复杂的软件系统。

  

参考链接：

<https://openai.com/zh-Hans-CN/index/harness-engineering/>  

<https://x.com/odysseus0z/status/2030416758138634583>  

<https://calv.info/openai-reflections>  

 __ 划线

 __ 评论

 __ 复制

2026-03-09 19:027523

![用户头像](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHoAAAB6CAYAAABwWUfkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyhpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMDY3IDc5LjE1Nzc0NywgMjAxNS8wMy8zMC0yMzo0MDo0MiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6RDI1RjA3RkVCQ0ExMTFFODkyQTY4NDdDNjQ4Q0I3Q0QiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6RDI1RjA3RkRCQ0ExMTFFODkyQTY4NDdDNjQ4Q0I3Q0QiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTcgKE1hY2ludG9zaCkiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDozNDQ5RjBBQUI4QzIxMUU4OEM2QkI5MDlENENEOUU3NiIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDozNDQ5RjBBQkI4QzIxMUU4OEM2QkI5MDlENENEOUU3NiIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PjC0dCMAAAp5SURBVHja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)

木子

发布了 67 篇内容， 共 53 次阅读， 收获喜欢 43 次。 

__ 关注

## 评论 

发布

暂无评论

延伸阅读——来自 InfoQ 精选

  * [不用则废：开发者直面 AI 编码工具的隐性代价](https://www.infoq.cn/article/bLageDSMAujcPRLriJi5?utm_source=1&utm_medium=article)

AI 编程工具正在重塑软件开发流程，重新点燃了资深程序员的热情，同时也引发了人们对代码质量的普遍担忧。 

作者： David Cassel

2026-04-13 

![不用则废：开发者直面 AI 编码工具的隐性代价](https://static001.infoq.cn/resource/image/d2/aa/d210a5b0cd01d168c02b43bda9625eaa.png)

  * [让每个员工都有一个 Coding Agent：蚂蚁 Vibe Coding 平台落地半年后的实践经验｜QCon北京](https://www.infoq.cn/article/zwsaRqiZ99H7l3y8G9Lc?utm_source=1&utm_medium=article)

让每个员工都有一个 Coding Agent

作者： QCon全球软件开发大会

2026-04-11 

![让每个员工都有一个 Coding Agent：蚂蚁 Vibe Coding 平台落地半年后的实践经验｜QCon北京](https://static001.infoq.cn/resource/image/5f/2d/5f26439c7c5f7d271202f8fc0087ce2d.jpg)

  * [记忆驱动的 DevOps Agent：从经验沉淀到自动化技能进化的工程实践｜QCon北京](https://www.infoq.cn/article/sxxIEeo332F2st6I1RwC?utm_source=1&utm_medium=article)

易点天下在 CI/CD 平台落地 AI Agent 处理构建分析与 K8s 运维，经历了两次架构重构。

作者： QCon全球软件开发大会

2026-03-30 

![记忆驱动的 DevOps Agent：从经验沉淀到自动化技能进化的工程实践｜QCon北京](https://static001.infoq.cn/resource/image/5e/fa/5e2ae870ecc6fa851ddd203f0c571afa.jpg)

  * [智能体 AI 模式强化软件工程规范性](https://www.infoq.cn/article/UdLhY0p8iDDIbtLtfV35?utm_source=1&utm_medium=article)

Paul Duvall 介绍了其面向 AI 辅助开发的工程模式库与高质量交付实践；Paul Stack 和 Gergely Orosz 则指出，行业正转向重构整合与规范驱动开发。

作者： Rafiq Gemmail

2026-04-04 

![智能体 AI 模式强化软件工程规范性](https://static001.infoq.cn/resource/image/db/85/db97f91e86c4a759853759467684be85.jpg)

  * [从拒绝 AI 到一切先问 Agent，DHH：这是我最爽的编程时刻之一，但程序员黄金时代到头了](https://www.infoq.cn/article/dOey7eV1T9p3dtPWTPCV?utm_source=1&utm_medium=article)

行业最资深的软件构建者之一如何看待 AI 工具的现实价值

作者： 蔡芳芳

2026-04-13 

![从拒绝 AI 到一切先问 Agent，DHH：这是我最爽的编程时刻之一，但程序员黄金时代到头了](https://static001.infoq.cn/resource/image/82/a0/82d9e44900133a3a7e65e0b2840214a0.png)

__ 换一换 查看更多 

![用户头像](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHoAAAB6CAYAAABwWUfkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyhpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMDY3IDc5LjE1Nzc0NywgMjAxNS8wMy8zMC0yMzo0MDo0MiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6RDI1RjA3RkVCQ0ExMTFFODkyQTY4NDdDNjQ4Q0I3Q0QiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6RDI1RjA3RkRCQ0ExMTFFODkyQTY4NDdDNjQ4Q0I3Q0QiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTcgKE1hY2ludG9zaCkiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDozNDQ5RjBBQUI4QzIxMUU4OEM2QkI5MDlENENEOUU3NiIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDozNDQ5RjBBQkI4QzIxMUU4OEM2QkI5MDlENENEOUU3NiIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PjC0dCMAAAp5SURBVHja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)

木子

 __ 关注

暂无签名

最新发布

[2050大会看这篇就够了｜报名、交通食宿指引大全](https://www.infoq.cn/article/ZFewc2btPEr4qiQfO2We)

2026-04-22

[模力工场 037 周 AI 应用周榜：生态意识增强，多模态已成AI应用标配](https://www.infoq.cn/article/fKc0YsLc9aDjzk1V81oW)

2026-04-21

[新生论坛@2050@2026：500+脑暴席卷云栖，年青就要最大声分享！](https://www.infoq.cn/article/ypRgJsViltYUI2SHyy0U)

2026-04-20

### 电子书

![腾讯云云原生提质增效实践精选集2024](https://static001.geekbang.org/resource/image/b2/3a/b2d38d808688b286ac30e7618db46b3a.png?x-oss-process=image/resize,w_310,h_422)

###### [腾讯云云原生提质增效实践精选集2024](https://www.infoq.cn/minibook/2LtMUXpempCBMD0fQd6k)

《2024腾讯云云原生提质增效实践精选集》出炉，5大热门技术领域，13个行业精选标杆案例，痛点到解决方案全揭

立即下载

### 大厂实战PPT下载

换一换 __

![企业级Agent：构建教育服务的自主进化网络](https://static001.geekbang.org/con/162/pdf/2954982127/image/page-001.jpg?x-oss-process=image/resize,w_532,h_300)

企业级Agent：构建教育服务的自主进化网络

阎鹏 | 豆神教育集团 副总裁、CTO

立即下载

长文本大模型推理实践——以 KVCache 为中心的分离式推理架构

唐飞虎 | 月之暗面 高级研发工程师 开发者关系负责人

立即下载

Mooncake 分离式推理架构创新与实践

何蔚然 | 月之暗面 推理系统负责人

立即下载

![ad](https://static001.infoq.cn/resource/image/3e/df/3e94d1a92db2e4097c8e0947f1bbc9df.png)

  * ![logo](https://static001.geekbang.org/static/web/nuxt/www.infoq.cn/logo.BJF4WFeC.png)

促进软件开发及相关领域知识与创新的传播

  *     [关于我们](https://www.infoq.cn/about)
    [我要投稿](https://www.infoq.cn/contribute)
    [合作伙伴](https://www.geekbang.org/partner)
    [加入我们](https://www.infoq.cn/link?target=https%3A%2F%2Fwww.lagou.com%2Fgongsi%2Fj43775.html)
    [关注我们](https://infoq.cn/official/account)
    [内容投稿：editors@geekbang.com](mailto:editors@geekbang.com)
    [业务合作：hezuo@geekbang.com](mailto:hezuo@geekbang.com)
    [反馈投诉：feedback@geekbang.com](mailto:feedback@geekbang.com)
    [加入我们：zhaopin@geekbang.com](mailto:zhaopin@geekbang.com)
    联系电话：010-64738142
    地址：北京市朝阳区望京北路9号2幢7层A701
  * InfoQ 近期会议
    [北京 · QCon 全球软件开发大会 2026.4.16-18](https://qcon.infoq.cn/2026/beijing?utm_source=infoq&utm_medium=footer)
    [上海 · AICon 全球人工智能开发与应用大会 2026.6.26-27](https://aicon.infoq.cn/2026/shanghai?utm_source=infoq&utm_medium=footer)
  * 全球 InfoQ
    ![会议图片](https://static001.infoq.cn/resource/image/55/38/55cd81623e36f5ab7a7db74d60b74838.png)[InfoQ En](https://www.infoq.com/)
    ![会议图片](https://static001.infoq.cn/resource/image/95/13/95fe851c02c86120e9037eada6a36d13.png)[InfoQ Jp](https://www.infoq.com/jp/)
    ![会议图片](https://static001.infoq.cn/resource/image/2a/3e/2aa440b6d94e94f64c508f16da38933e.png)[InfoQ Fr](http://www.infoq.com/fr/)
    ![会议图片](https://static001.infoq.cn/resource/image/4e/1e/4e737ce82bc7c8a1c2f2307bcea9a11e.png)[InfoQ Br](http://www.infoq.com/br/)

Copyright © 2026, Geekbang Technology Ltd. All rights reserved. 极客邦控股（北京）有限公司 | [京 ICP 备 16027448 号 - 5](https://www.infoq.cn/link?target=https%3A%2F%2Fbeian.miit.gov.cn%2F)[![京公网安备](data:image/png;base64,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)京公网安备 11010502039052号](https://www.infoq.cn/link?target=http%3A%2F%2Fwww.beian.gov.cn%2Fportal%2FregisterSystemInfo%3Frecordcode%3D11010502039052)[ | 产品资质](https://time.geekbang.org/hybrid/certificates)

---

**原文链接**: [https://www.infoq.cn/article/XiMNJ9e87lH8Xu9CpUHG](https://www.infoq.cn/article/XiMNJ9e87lH8Xu9CpUHG)
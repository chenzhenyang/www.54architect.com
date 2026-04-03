---
title: 长期运行应用开发的框架设计
description: Anthropic 工程师分享如何通过多智能体架构（规划器、生成器、评估器）提升 AI 编程质量，解决上下文焦虑和自我评估问题
tags:
- AI
- Agent
- Programming
- LLM
- Engineering
categories:
- Technology
lastUpdated: 2026-03-28
origin_title: Harness design for long-running application development
author: Anthropic
---
URL: https://www.anthropic.com/engineering/harness-design-long-running-apps

抓取时间：2026-03-28 15:39:35

---

作者：Prithvi Rajasekaran，Labsteam 团队成员

在过去的几个月里，我一直在研究两个相互关联的问题：让 Claude 生成高质量的前端设计，以及让它能够在无需人工干预的情况下构建完整的应用程序。这项工作源于我们早期的前端设计技能（frontend design skill）和长期运行编码智能体框架（long-running coding agent harness）的努力，我和我的同事通过提示工程（prompt engineering）和框架设计将 Claude 的性能提升到远高于基线水平——但两者最终都遇到了瓶颈。

为了突破这些限制，我探索了新颖的 AI 工程方法，这些方法在两个截然不同的领域都行之有效：一个由主观品味定义，另一个由可验证的正确性和可用性定义。受生成对抗网络（Generative Adversarial Networks，GANs）的启发，我设计了一个包含生成器（generator）和评估器（evaluator）智能体的多智能体结构。构建一个能够可靠且有品味地评估输出的评估器，意味着首先要开发一套标准，将"这个设计好吗？"这样的主观判断转化为具体的、可评分的条款。

然后我将这些技术应用于长期自主编码，从我们早期的框架工作中继承了两个经验：将构建分解为可处理的部分，以及使用结构化artifact（工件）在会话之间传递上下文。最终结果是一个三智能体架构——规划器（planner）、生成器和评估器——能够在数小时的自主编码会话中生成丰富的全栈应用程序。

我们之前已经证明，框架设计对长期智能体编码的有效性有重大影响。在早期实验中，我们使用初始化智能体将产品规格分解为任务列表，编码智能体一次实现一个功能，然后在会话之间传递artifact以携带上下文。更广泛的开发者社区已经汇聚到类似的见解，诸如"Ralph Wiggum"方法使用 hooks 或脚本让智能体保持持续迭代循环。

但一些问题仍然存在。对于更复杂的任务，智能体随着时间推移仍然容易偏离轨道。在分解这个问题时，我们观察到执行此类任务的智能体有两种常见的失败模式。

首先是模型在长任务上倾向于失去连贯性，因为上下文窗口被填满（参见我们关于上下文工程（context engineering）的文章）。一些模型还表现出"上下文焦虑"（context anxiety），即当它们接近自认为的上下文限制时，会过早地结束工作。上下文重置（context resets）——完全清除上下文窗口并启动新的智能体，结合携带前一智能体状态和下一步的结构化交接——可以解决这两个问题。

这与压缩（compaction）不同，压缩是将对话的早期部分就地总结，以便同一智能体可以在缩短的历史记录上继续。虽然压缩保持了连续性，但它没有给智能体一个干净的起点，这意味着上下文焦虑仍然可能存在。重置提供了干净的起点，代价是交接artifact必须有足够的状态让下一个智能体干净地接手工作。在我们早期的测试中，我们发现 Claude Sonnet 4.5 表现出强烈的上下文焦虑，仅靠压缩不足以实现强大的长任务性能，因此上下文重置成为框架设计的关键。这解决了核心问题，但也为每次框架运行增加了编排复杂性、token 开销和延迟。

第二个问题是我们之前没有解决过的：自我评估。当被要求评估他们产生的工作时，智能体往往会自信地赞扬工作——即使对人类观察者来说，质量显然很平庸。这个问题在主观任务（如设计）中尤为明显，因为没有相当于可验证软件测试的二元检查。布局感觉是精致还是通用是一个判断问题，智能体在给自己工作时可靠地偏向正面。

然而，即使在有可验证结果的任务上，智能体有时仍会表现出阻碍任务完成的糟糕判断。将执行工作的智能体与评判工作的智能体分开被证明是解决这个问题的强大杠杆。这种分离本身并不能立即消除这种宽容；评估器仍然是一个倾向于对 LLM 生成输出慷慨的 LLM。但调整独立评估器持怀疑态度比让生成器对自己的工作持批评态度要容易得多，一旦存在这种外部反馈，生成器就有了具体的迭代目标。

我首先在前端设计上做实验，这里自我评估问题最为明显。没有任何干预的情况下，Claude 通常倾向于安全、可预测的布局，技术上功能正常但视觉上不起眼。

两个见解塑造了我为前端设计构建的框架。首先，虽然美学不能完全简化为分数——个人品味总会有所不同——但可以通过编码设计原则和偏好的评分标准来改进。"这个设计美吗？"很难一致地回答，但"这符合我们的良好设计原则吗？"给了 Claude 具体的评分依据。其次，通过将前端生成与前端评分分离，我们可以创建一个反馈循环，推动生成器产生更强的输出。

基于此，我编写了四个评分标准，在提示中提供给生成器和评估器智能体：

我强调设计质量和原创性胜过工艺和功能。Claude 默认在工艺和功能上已经得分很好，因为所需的技术能力对模型来说往往很自然。但在设计和原创性方面，Claude 产生的输出充其量是平淡的。标准明确惩罚高度通用的"AI 垃圾"（AI slop）模式，通过更重视设计和原创性，推动模型进行更多美学冒险。

我使用带有详细评分分解的少样本示例（few-shot examples）校准评估器。这确保评估器的判断与我的偏好一致，并减少迭代间的分数漂移。

我在 Claude Agent SDK 上构建了这个循环，保持了编排的简单性。生成器智能体首先根据用户提示创建 HTML/CSS/JS 前端。我给评估器 Playwright MCP（Model Context Protocol），让它能够直接与实时页面交互，然后对每个标准进行评分并撰写详细评论。实际上，评估器会自己导航页面，截图并仔细研究实现，然后进行评估。该反馈流回生成器作为下一次迭代的输入。我每次运行为 5 到 15 次迭代，每次迭代通常推动生成器朝着更独特的方向发展，因为它回应评估器的批评。由于评估器是主动导航页面而不是对静态截图评分，每个周期都花费了真实的挂钟时间（wall-clock time）。完整运行长达四小时。我还指示生成器在每次评估后做出战略决策：如果分数趋势良好则完善当前方向，如果方法不起作用则完全转向不同的美学。

在多次运行中，评估器的评估在迭代中改进然后趋于平稳，仍有提升空间。一些代际逐步完善。其他则在迭代之间采取急剧的美学转变。

标准的措辞以我没有完全预料到的方式引导生成器。包括"最好的设计是博物馆质量"这样的短语将设计推向特定的视觉融合，表明与标准相关的提示直接塑造了输出的特征。

虽然分数通常在迭代中有所改善，但模式并不总是干净的线性。后来的实现整体上往往更好，但我经常看到我更喜欢中间迭代而不是最后一次的情况。实现复杂性也倾向于在轮次中增加，生成器响应评估器的反馈寻求更雄心勃勃的解决方案。即使在第一次迭代，输出也明显优于完全没有提示的基线，表明标准和相关语言本身在评估器反馈导致进一步完善之前就将模型从通用默认值引导开。

在一个显著的例子中，我提示模型为荷兰艺术博物馆创建一个网站。到第九次迭代时，它为一个虚构博物馆生成了一个干净的深色主题登录页面。页面视觉上很精致，但大体上符合我的预期。然后，在第十个周期，它完全废除了这种方法，将网站重新想象为空间体验：一个 3D 房间，带有 CSS 透视渲染的方格地板，艺术品以自由形式挂在墙上，基于门口的画廊房间之间的导航，而不是滚动或点击。这是我在单次传递生成中从未见过的创造性飞跃。

有了这些发现，我将这种 GAN 启发的模式应用于全栈开发。生成器 - 评估器循环自然地映射到软件开发生命周期，代码审查和 QA（质量保证）与设计评估器发挥相同的结构作用。

在我们早期的长期运行框架中，我们通过初始化智能体、一次一个功能工作的编码智能体和会话之间的上下文重置解决了连贯的多会话编码。上下文重置是关键解锁：框架使用 Sonnet 4.5，它表现出前面提到的"上下文焦虑"倾向。创建一个能在上下文重置中良好工作的框架是让模型保持任务的关键。Opus 4.5 很大程度上自行消除了这种行为，所以我能够完全从这个框架中删除上下文重置。智能体在整个构建过程中作为一个连续会话运行，Claude Agent SDK 的自动压缩处理上下文增长。

对于这项工作，我在原始框架的基础上构建了一个三智能体系统，每个智能体解决我在先前运行中观察到的特定差距。系统包含以下智能体角色：

**规划器（Planner）**：我们之前的长期运行框架要求用户 upfront 提供详细规格。我想自动化这一步骤，所以我创建了一个规划器智能体，接受简单的 1-4 句提示并将其扩展为完整的产品规格。我提示它对范围保持雄心勃勃，并专注于产品上下文和高级技术设计，而不是详细的技术实现。这种强调是因为担心如果规划器试图 upfront 指定细粒度技术细节并出错，规格中的错误会级联到下游实现。限制智能体要产生的交付物并让它们在工作中找出路径似乎更明智。我还要求规划器寻找机会将 AI 功能编织到产品规格中。（参见底部附录中的示例。）

**生成器（Generator）**：早期框架中一次一个功能的方法对范围管理很有效。我在这里应用了类似的模型，指示生成器以冲刺（sprint）方式工作，一次从规格中选择一个功能。每个冲刺使用 React、Vite、FastAPI 和 SQLite（后来是 PostgreSQL）栈实现应用程序，生成器被指示在每个冲刺结束时自我评估工作，然后交给 QA。它还有 git 进行版本控制。

**评估器（Evaluator）**：早期框架的应用程序通常看起来令人印象深刻，但当你实际尝试使用时仍有真正的 bug。为了捕捉这些，评估器使用 Playwright MCP 像用户一样点击运行中的应用程序，测试 UI 功能、API 端点和数据库状态。然后它根据发现的 bug 和一套标准对每个冲刺进行评分，这些标准基于前端实验，在此调整为涵盖产品深度、功能、视觉设计和代码质量。每个标准都有一个硬阈值，如果任何一个低于它，冲刺失败，生成器获得关于出了什么问题的详细反馈。在每个冲刺之前，生成器和评估器协商冲刺合同：在编写任何代码之前就同意这块工作"完成"是什么样子。这存在是因为产品规格故意是高级的，我想要一个步骤来弥合用户故事和可测试实现之间的差距。生成器提议它将构建什么以及如何验证成功，评估器审查该提议以确保生成器构建正确的东西。两者迭代直到达成一致。

通信通过文件处理：一个智能体写入文件，另一个智能体读取它并在该文件中响应或用一个新文件响应，前一个智能体依次读取。然后生成器根据同意的合同构建，然后将工作交给 QA。这使工作忠于规格，而不会过早过度指定实现。

对于这个框架的第一个版本，我使用 Claude Opus 4.5，对用户提示运行完整框架和单智能体系统进行比较。我使用 Opus 4.5 因为这是我开始这些实验时我们最好的编码模型。

我写了以下提示来生成复古视频游戏制作器：

下表显示了框架类型、运行时长和总成本。

框架贵了 20 多倍，但输出质量的差异立竿见影。

我期望一个界面，我可以在其中构建关卡及其组成部分（精灵、实体、瓷砖布局），然后点击播放实际玩关卡。我首先打开单独运行的输出，初始应用程序似乎符合这些期望。

然而，随着我点击，问题开始出现。布局浪费空间，固定高度的面板使大部分视口为空。工作流很僵化。尝试填充关卡提示我先创建精灵和实体，但 UI 中没有指导我朝这个顺序。更重要的是，实际游戏坏了。我的实体出现在屏幕上，但没有东西响应输入。深入研究代码显示实体定义和游戏运行时之间的连接坏了，表面没有指示在哪里。

评估单独运行后，我将注意力转向框架运行。这次运行从相同的一句话提示开始，但规划器步骤将该提示扩展为分布在十个冲刺中的 16 功能规格。它远远超出了单独运行的尝试。除了核心编辑器和播放模式外，规格还要求精灵动画系统、行为模板、音效和音乐、AI 辅助精灵生成器和关卡设计器，以及带有可分享链接的游戏导出。我给规划器访问我们的前端设计技能，它阅读并用于为应用程序创建视觉设计语言作为规格的一部分。对于每个冲刺，生成器和评估器协商合同，定义冲刺的具体实现细节，以及将测试以验证完成的可测试行为。

应用程序立即显示出比单独运行更多的抛光和流畅性。画布使用完整视口，面板大小合理，界面有一致的视觉标识，跟踪规格中的设计方向。我在单独运行中看到的一些笨拙仍然存在——工作流仍然没有明确说明你应该在尝试填充关卡之前构建精灵和实体，我不得不通过摸索来弄清楚。这读作基础模型产品直觉的差距，而不是框架设计要解决的问题，尽管它确实表明了框架内针对性迭代可以帮助进一步提高输出质量的地方。

通过编辑器工作，新运行相对于单独运行的优势变得更加明显。精灵编辑器更丰富、功能更全面，工具调色板更干净，颜色选择器更好，缩放控制更可用。

因为我要求规划器将 AI 功能编织到其规格中，应用程序还带有内置的 Claude 集成，让我可以通过提示生成游戏的不同部分。这显著加快了工作流程。

最大的区别在播放模式。我实际上能够移动我的实体并玩游戏。物理有一些粗糙的边缘——我的角色跳到一个平台上但最终与它重叠，这在直觉上感觉不对——但核心东西有效，这是单独运行未能做到的。在移动一会儿后，我确实遇到了 AI 游戏关卡构建的一些限制。有一堵大墙我无法跳过，所以我卡住了。这表明框架可以处理一些常识性改进和边缘情况，以进一步完善应用程序。

阅读日志，很明显评估器使实现与规格保持一致。每个冲刺，它遍历冲刺合同的测试标准，通过 Playwright 练习运行中的应用程序，对任何偏离预期行为的内容提交 bug。合同是细粒度的——仅冲刺 3 就有 27 个涵盖关卡编辑器的标准——评估器的发现足够具体，无需额外调查即可采取行动。下表显示了我们评估器识别的几个问题示例：

让评估器达到这个水平需要工作。开箱即用，Claude 是一个糟糕的 QA 智能体。在早期运行中，我看着它识别合法问题，然后说服自己决定它们没什么大不了的，无论如何都批准工作。它还倾向于表面测试，而不是探测边缘情况，所以更微妙的 bug 经常溜走。调整循环是阅读评估器的日志，找到其判断与我的判断不同的示例，并更新 QA 的提示以解决这些问题。这个开发循环需要几轮，评估器才以我发现合理的方式评分。即使这样，框架输出显示了模型 QA 能力的限制：小布局问题、某些地方感觉不直观的交互，以及评估器没有彻底练习的更深层嵌套功能中未发现的 bug。显然还有更多验证空间可以通过进一步调整来捕捉。但与中央功能根本不起作用的单独运行相比，提升是显而易见的。

第一组框架结果令人鼓舞，但它也笨重、缓慢且昂贵。逻辑下一步是找到简化框架而不降低其性能的方法。这部分是常识，部分是一个更一般原则的函数：框架中的每个组件都编码了关于模型不能独自做什么的假设，这些假设值得压力测试，因为它们可能不正确，而且因为随着模型改进它们可能很快过时。我们的博客文章《构建有效智能体》（Building Effective Agents）将基本思想框架为"找到尽可能简单的解决方案，只在需要时增加复杂性"，这是一个对任何维护智能体框架的人一致出现的模式。

在我第一次简化的尝试中，我彻底削减了框架并尝试了一些创造性的新想法，但我无法复制原始性能。也很难说出框架设计的哪些部分实际上是承重的，以及以什么方式。基于该经验，我转向更系统的方法，一次删除一个组件并审查它对最终结果的影响。

在我经历这些迭代周期时，我们还发布了 Opus 4.6，这为进一步减少框架复杂性提供了进一步动力。有充分理由期望 4.6 比 4.5 需要更少的脚手架。从我们的发布博客："[Opus 4.6] 更仔细地计划，更长时间维持智能体任务，可以在更大的代码库中更可靠地操作，并有更好的代码审查和调试技能来捕捉自己的错误。"它在长上下文检索方面也有实质性改进。这些都是框架已建立补充的所有能力。

我首先完全删除了冲刺结构。冲刺结构帮助将工作分解为块，让模型连贯地工作。鉴于 Opus 4.6 的改进，有充分理由相信模型可以原生处理工作而无需这种分解。

我保留了规划器和评估器，因为每个都继续增加明显价值。没有规划器，生成器范围不足：给定原始提示，它会开始构建而不先指定其工作，最终创建比规划器做的功能不那么丰富的应用程序。

删除冲刺结构后，我将评估器移动到运行结束时的单次传递，而不是每个冲刺评分。由于模型能力更强，它改变了评估器对某些运行的承重程度，其有用性取决于任务相对于模型可以独自可靠地做什么的位置。在 4.5 上，这个边界很近：我们的构建处于生成器可以独自做好的边缘，评估器在整个构建中捕捉有意义的问题。在 4.6 上，模型的原始能力增加，所以边界向外移动。过去需要评估器检查才能连贯实现的任务现在通常在生成器独自处理好的范围内，对于该边界内的任务，评估器成为不必要的开销。但对于仍处于生成器能力边缘的构建部分，评估器继续提供真正的提升。

实际含义是评估器不是固定的是或否决定。当任务超出当前模型可以可靠地独自完成时，它值得成本。

 alongside 结构简化，我还添加了提示来改进框架如何将 AI 功能构建到每个应用程序中，特别是让生成器构建一个适当的智能体，可以通过工具驱动应用程序自身的功能。这需要真正的迭代，因为相关知识足够新，Claude 的训练数据覆盖它很薄。但通过足够的调整，生成器正确地构建智能体。

为了测试更新的框架，我使用以下提示生成数字音频工作站（Digital Audio Workstation，DAW），一个用于作曲、录制和混音歌曲的音乐制作程序：

运行仍然漫长且昂贵，大约 4 小时，124 美元 token 成本。

大部分时间花在构建器上，它连贯地运行了两个多小时，无需 Opus 4.5 需要的冲刺分解。

与之前的框架一样，规划器将单行提示扩展为完整规格。从日志中，我可以看到生成器模型在规划应用程序和智能体设计、连接智能体以及在交给 QA 之前测试它方面做得很好。

也就是说，QA 智能体仍然捕捉到真正的差距。在第一轮反馈中，它指出：

在第二轮反馈中，它再次捕捉到几个功能差距：

生成器在独自留下时仍然容易错过细节或存根功能，QA 在捕捉这些最后一英里问题让生成器修复方面仍然增加价值。

基于提示，我期望一个程序，我可以在其中创建旋律、和声和鼓模式，将它们排列成歌曲，并在此过程中获得集成智能体的帮助。下面的视频显示了结果。

该应用程序远非专业的音乐制作程序，智能体的歌曲创作技能显然需要大量工作。此外，Claude 实际上听不到，这使得 QA 反馈循环在音乐品味方面效果较差。

但最终应用程序拥有功能音乐制作程序的所有核心部分：在浏览器中运行的工作安排视图、混音器和传输。除此之外，我能够完全通过提示拼凑出一个简短的歌曲片段：智能体设置速度和调性，铺设旋律，建立鼓轨道，调整混音器电平，并添加混响。歌曲创作的核心原语存在，智能体可以自主驱动它们，使用工具从头到尾创建简单的制作。你可能会说它还没有达到音高完美——但它正在接近。

随着模型继续改进，我们大致可以期望它们能够工作更长时间，处理更复杂的任务。在某些情况下，这意味着围绕模型的脚手架随时间推移变得不那么重要，开发者可以等待下一个模型，看到某些问题自行解决。另一方面，模型变得越好，就有更多空间开发可以实现超出模型基线能力的复杂任务的框架。

鉴于此，这项工作有一些值得继承的教训。对你正在构建的模型进行实验，在现实问题上阅读其痕迹，并调整其性能以实现期望的结果，这总是一个好的做法。当处理更复杂的任务时，有时可以通过分解任务并将专用智能体应用于问题的每个方面来获得提升空间。当新模型发布时，重新检查框架通常是一个好的做法，剥离不再对性能承重的部分，并添加新部分以实现以前可能不可能实现的更大能力。

从这项工作中，我的信念是，随着模型改进，有趣框架组合的空间不会缩小。相反，它在移动，AI 工程师的有趣工作是不断寻找下一个新颖组合。

特别感谢 Mike Krieger、Michael Agaby、Justin Young、Jeremy Hadfield、David Hershey、Julius Tarng、Xiaoyi Zhang、Barry Zhang、Orowa Sidker、Michael Tingley、Ibrahim Madha、Martina Long 和 Canyon Robbins 对这项工作的贡献。

还要感谢 Jake Eaton、Alyssa Leonard 和 Stef Sequeira 在塑造文章方面的帮助。

## 附录

规划器智能体生成的示例计划。

```
fillRectangle
```

```
LevelEditor.tsx:892
```

```
selection
```

```
selectedEntityId 
```

```
selectedEntityId
```

```
selection || (selectedEntityId && activeLayer === 'entity')
```

```
PUT /frames/reorder
```

```
/{frame_id}
```

```
eorder
```

```
RetroForge - 2D Retro Game Maker

Overview
RetroForge is a web-based creative studio for designing and building 2D retro-style video games. It combines the nostalgic charm of classic 8-bit and 16-bit game aesthetics with modern, intuitive editing tools—enabling anyone from hobbyist creators to indie developers to bring their game ideas to life without writing traditional code.

The platform provides four integrated creative modules: a tile-based Level Editor for designing game worlds, a pixel-art Sprite Editor for crafting visual assets, a visual Entity Behavior system for defining game logic, and an instant Playable Test Mode for real-time gameplay testing. By weaving AI assistance throughout (powered by Claude), RetroForge accelerates the creative process—helping users generate sprites, design levels, and configure behaviors through natural language interaction.

RetroForge targets creators who love retro gaming aesthetics but want modern conveniences. Whether recreating the platformers, RPGs, or action games of their childhood, or inventing entirely new experiences within retro constraints, users can prototype rapidly, iterate visually, and share their creations with others.

Features
1. Project Dashboard & Management
The Project Dashboard is the home base for all creative work in RetroForge. Users need a clear, organized way to manage their game projects—creating new ones, returning to works-in-progress, and understanding what each project contains at a glance.

User Stories: As a user, I want to:

- Create a new game project with a name and description, so that I can begin designing my game
- See all my existing projects displayed as visual cards showing the project name, last modified date, and a thumbnail preview, so that I can quickly find and continue my work
- Open any project to enter the full game editor workspace, so that I can work on my game
- Delete projects I no longer need, with a confirmation dialog to prevent accidents, so that I can keep my workspace organized
- Duplicate an existing project as a starting point for a new game, so that I can reuse my previous work

Project Data Model: Each project contains:

Project metadata (name, description, created/modified timestamps)
Canvas settings (resolution: e.g., 256x224, 320x240, or 160x144)
Tile size configuration (8x8, 16x8, or 32x32 pixels)
Color palette selection 
All associated sprites, tilesets, levels, and entity definitions

...

```

```
RetroForge - 2D Retro Game Maker

Overview
RetroForge is a web-based creative studio for designing and building 2D retro-style video games. It combines the nostalgic charm of classic 8-bit and 16-bit game aesthetics with modern, intuitive editing tools—enabling anyone from hobbyist creators to indie developers to bring their game ideas to life without writing traditional code.

The platform provides four integrated creative modules: a tile-based Level Editor for designing game worlds, a pixel-art Sprite Editor for crafting visual assets, a visual Entity Behavior system for defining game logic, and an instant Playable Test Mode for real-time gameplay testing. By weaving AI assistance throughout (powered by Claude), RetroForge accelerates the creative process—helping users generate sprites, design levels, and configure behaviors through natural language interaction.

RetroForge targets creators who love retro gaming aesthetics but want modern conveniences. Whether recreating the platformers, RPGs, or action games of their childhood, or inventing entirely new experiences within retro constraints, users can prototype rapidly, iterate visually, and share their creations with others.

Features
1. Project Dashboard & Management
The Project Dashboard is the home base for all creative work in RetroForge. Users need a clear, organized way to manage their game projects—creating new ones, returning to works-in-progress, and understanding what each project contains at a glance.

User Stories: As a user, I want to:

- Create a new game project with a name and description, so that I can begin designing my game
- See all my existing projects displayed as visual cards showing the project name, last modified date, and a thumbnail preview, so that I can quickly find and continue my work
- Open any project to enter the full game editor workspace, so that I can work on my game
- Delete projects I no longer need, with a confirmation dialog to prevent accidents, so that I can keep my workspace organized
- Duplicate an existing project as a starting point for a new game, so that I can reuse my previous work

Project Data Model: Each project contains:

Project metadata (name, description, created/modified timestamps)
Canvas settings (resolution: e.g., 256x224, 320x240, or 160x144)
Tile size configuration (8x8, 16x16, or 32x32 pixels)
Color palette selection 
All associated sprites, tilesets, levels, and entity definitions

...

```

- **设计质量（Design quality）**：设计感觉像一个连贯的整体而不是部分的集合？这里的强作品意味着颜色、排版、布局、图像和其他细节结合创造独特的氛围和身份。

- **原创性（Originality）**：有定制决策的证据，还是模板布局、库默认值和 AI 生成模式？人类设计师应该认识到故意的创造性选择。未修改的库存组件——或 AI 生成的明显迹象如白色卡片上的紫色渐变——在这里失败。

- **工艺（Craft）**：技术执行：排版层次结构、间距一致性、颜色和谐、对比度比率。这是能力检查而不是创造力检查。大多数合理的实现默认在这里做得很好；失败意味着基本要素坏了。

- **功能（Functionality）**：独立于美学的可用性。用户能理解界面做什么，找到主要动作，并在不猜测的情况下完成任务吗？

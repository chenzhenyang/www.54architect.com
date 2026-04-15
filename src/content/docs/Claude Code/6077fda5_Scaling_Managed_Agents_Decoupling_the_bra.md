---
title: 规模化托管代理：将大脑与双手解耦 \ Anthropic
origin_title: "Scaling Managed Agents: Decoupling the brain from the hands \ Anthropic"
author: Lance Martin, Gabe Cemaj, and Michael Cohen
lastUpdated: 2026-04-15
---
_通过跟随我们的 [文档](https://platform.claude.com/docs/en/managed-agents/overview) 开始使用 Claude 托管代理。_

工程博客上的一个持续话题是如何 [构建有效的代理](https://www.anthropic.com/engineering/building-effective-agents) 以及为 [长周期工作](https://www.anthropic.com/engineering/harness-design-long-running-apps) [设计 harness](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)。这项工作的一个共同线索是，harness 编码了关于 Claude 无法独自完成什么的假设。然而，这些假设需要经常被质疑，因为随着模型的改进，它们可能会 [过时](http://www.incompleteideas.net/IncIdeas/BitterLesson.html)。

举一个例子，在先前的工作中 [我们发现](https://www.anthropic.com/engineering/harness-design-long-running-apps)，Claude Sonnet 4.5 会在感觉到上下文限制接近时过早地结束任务——这种行为有时被称为“上下文焦虑”。我们通过在 harness 中添加上下文重置来解决这个问题。但当我们在 Claude Opus 4.5 上使用相同的 harness 时，我们发现这种行为消失了。重置变成了累赘。

我们预期 harness 会继续演进。因此，我们构建了托管代理（Managed Agents）：这是 Claude 平台中的一项托管服务，通过一组旨在比任何特定实现（包括我们今天运行的实现）更持久的小型接口，代表您运行长周期代理。

构建托管代理意味着解决计算领域的一个老问题：如何为"[尚未构想出的程序](http://www.catb.org/esr/writings/taoup/html/ch03s01.html)"设计系统。几十年前，操作系统通过将硬件虚拟化为抽象——_进程、文件_——解决了这个问题，这些抽象足够通用，适用于尚不存在的程序。抽象比硬件更持久。`read()` 命令并不关心它是访问 1970 年代的磁盘组还是现代 SSD。上层的抽象保持稳定，而下层的实现可以自由更改。

托管代理遵循相同的模式。我们虚拟化了代理的组件：会话（session，发生的一切的仅追加日志）、harness（调用 Claude 并将 Claude 的工具调用路由到相关基础设施的循环）和沙箱（sandbox，Claude 可以运行代码和编辑文件的执行环境）。这允许交换每个组件的实现而不干扰其他组件。我们对这些接口的形状有预设规范，但对背后运行的内容没有预设。

![](/_next/image?url=https%3A%2F%2Fwww-cdn.anthropic.com%2Fimages%2F4zrzovbb%2Fwebsite%2F903b624ada206b10753a24c6a1367e74a869165d-1080x1080.png&w=3840&q=75)

我们开始时将所有代理组件放入单个容器中，这意味着会话、代理 harness 和沙箱都共享一个环境。这种方法有一些好处，包括文件编辑是直接的系統调用，并且没有服务边界需要设计。

但将所有内容耦合到一个容器中，我们遇到了一个旧的基础设施问题：我们采用了一只 [_宠物_](https://cloudscaling.com/blog/cloud-computing/the-history-of-pets-vs-cattle/)。在宠物与牲畜的类比中，宠物是一个有名字的、手工照料的个体，你不能失去它，而牲畜是可以互换的。在我们的案例中，服务器变成了那只宠物；如果容器失败，会话就会丢失。如果容器无响应，我们不得不护理它恢复健康。

护理容器意味着调试无响应的僵死会话。我们唯一的窗口是 WebSocket 事件流，但这无法告诉我们故障发生在_哪里_，这意味着 harness 中的错误、事件流中的数据包丢失或容器离线都表现得一样。为了找出问题所在，工程师必须在容器内打开一个 shell，但因为该容器通常也持有用户数据，这种方法本质上意味着我们缺乏调试能力。

第二个问题是，harness 假设 Claude 处理的任何内容都与其生活在同一个容器中。当客户要求我们将 Claude 连接到他们的虚拟私有云时，他们要么必须将他们的网络与我们的对等连接，要么在他们自己的环境中运行我们的 harness。当我们要将其连接到不同的基础设施时，harness 中固有的假设就变成了问题。

## 将大脑与双手解耦

我们得出的解决方案是将我们视为“大脑”（Claude 及其 harness）的部分与“双手”（执行操作的沙箱和工具）以及“会话”（会话事件日志）解耦。每个都成为一个接口，对其他部分几乎没有假设，并且每个都可以独立失败或被替换。

**harness 离开容器。** 将大脑与双手解耦意味着 harness 不再生活在容器内部。它调用容器就像调用任何其他工具一样：`execute(name, input) → string`。容器变成了牲畜。如果容器死亡，harness 会将失败作为工具调用错误捕获并传回给 Claude。如果 Claude 决定重试，可以使用标准配方重新初始化新容器：`provision({resources})`。我们不再需要将失败的容器护理恢复健康。

**从 harness 故障中恢复。** harness 也变成了牲畜。因为会话日志位于 harness 之外，harness 中的任何内容都不需要在崩溃后幸存。当一个失败时，一个新的可以使用 `wake(sessionId)` 重启，使用 `getSession(id)` 取回事件日志，并从最后一个事件恢复。在代理循环期间，harness 使用 `emitEvent(id, event)` 写入会话，以保持事件的可持久记录。

![](/_next/image?url=https%3A%2F%2Fwww-cdn.anthropic.com%2Fimages%2F4zrzovbb%2Fwebsite%2F73e900af5b9d6ed8c64db0a8e74d4465963556b7-1640x1596.png&w=3840&q=75)

**安全边界。** 在耦合设计中，任何 Claude 生成的不受信任的代码都与凭证运行在同一个容器中——所以提示词注入只需要说服 Claude 读取其自己的环境。一旦攻击者拥有这些 token，他们就可以生成新鲜的、不受限制的会话并将工作委托给它们。窄范围作用域是一个明显的缓解措施，但这编码了关于 Claude 无法使用有限 token 做什么的假设——而 Claude 正变得越来越聪明。结构性的修复是确保 token 永远无法从运行 Claude 生成代码的沙箱中访问。

我们使用两种模式来确保这一点。认证可以捆绑在资源上或保存在沙箱外的保管库中。对于 Git，我们使用每个仓库的访问 token 在沙箱初始化期间克隆仓库并将其连接到本地 git remote。Git `push` 和 `pull` 可以在沙箱内工作，而代理本身从不处理 token。对于自定义工具，我们支持 MCP 并将 OAuth token 存储在安全保管库中。Claude 通过专用代理调用 MCP 工具；该代理接收与会话关联的 token。然后代理可以从保管库获取相应的凭证并向外部服务发出调用。harness 从不知道任何凭证。

## 会话不是 Claude 的上下文窗口

长周期任务通常超过 Claude 上下文窗口的长度，解决此问题的标准方法都涉及关于保留什么的不可逆决定。我们在关于上下文工程的 [先前工作](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) 中探讨了这些技术。例如，压缩允许 Claude 保存其上下文窗口的摘要，记忆工具允许 Claude 将上下文写入文件，从而实现跨会话学习。这可以与上下文修剪配对，后者选择性地移除 token，例如旧的工具结果或思考块。

但选择性地保留或丢弃上下文的不可逆决定可能导致失败。很难知道未来的回合需要哪些 token。如果消息被压缩步骤转换，harness 会从 Claude 的上下文窗口中移除压缩的消息，并且只有存储了它们才能恢复。先前的工作 [已探讨](https://arxiv.org/pdf/2512.24601) 了通过将上下文存储为生活在上下文窗口_外部_ 的对象来解决此问题的方法。例如，上下文可以是 REPL 中的对象，LLM 通过编写代码来过滤或切片它以编程方式访问。

![](/_next/image?url=https%3A%2F%2Fwww-cdn.anthropic.com%2Fimages%2F4zrzovbb%2Fwebsite%2Fcf0719d7832b1f577b7393c84a7c53eecc725ca4-760x200.png&w=1920&q=75)

在托管代理中，会话提供了相同的好处，作为生活在 Claude 上下文窗口之外的上下文对象。但上下文不是存储在沙箱或 REPL 中，而是持久存储在会话日志中。接口 `getEvents()` 允许大脑通过选择事件流的位置切片来询问上下文。该接口可以灵活使用，允许大脑从上次停止读取的地方继续，回退特定时刻之前的几个事件以查看前导，或在特定操作之前重新读取上下文。

任何获取的事件也可以在传递给 Claude 的上下文窗口之前在 harness 中转换。这些转换可以是 harness 编码的任何内容，包括上下文组织以实现高提示词缓存命中率和上下文工程。我们将会话中可恢复的上下文存储与 harness 中任意上下文管理的关注点分开，因为我们无法预测未来模型需要什么样的具体上下文工程。接口将上下文管理推入 harness，并仅保证会话是持久的且可供询问。

##   
多个大脑，多双手

**多个大脑。** 将大脑与双手解耦解决了我们最早的客户投诉之一。当团队希望 Claude 针对他们自己 VPC 中的资源工作时，唯一的路径是将他们的网络与我们的对等连接，因为持有 harness 的容器假设每个资源都坐在它旁边。一旦 harness 不在容器中，该假设就消失了。同样的改变带来了性能回报。当我们最初将大脑放入容器时，这意味着许多大脑需要同样多的容器。对于每个大脑，在该容器配置之前无法发生推理；每个会话都预先支付了完整的容器设置成本。每个会话，即使是那些永远不会接触沙箱的会话，都必须克隆仓库、启动进程、从我们的服务器获取待处理事件。

那段空闲时间体现为首令牌时间 (TTFT)，它衡量会话在接受工作和产生其第一个响应 token 之间等待了多长时间。TTFT 是用户最敏锐_感觉_到的延迟。

将大脑与双手解耦意味着容器仅由大脑通过工具调用 `(execute(name, input) → string)` 按需配置。所以不需要容器的会话不会等待容器。一旦编排层从会话日志中提取待处理事件，推理就可以开始。使用这种架构，我们的 p50 TTFT 下降了大约 60%，p95 下降了超过 90%。扩展到许多大脑仅仅意味着启动许多无状态 harness，并仅在需要时将它们连接到双手。

**多双手。** 我们还希望能够将每个大脑连接到多双手。实际上，这意味着 Claude 必须推理许多执行环境并决定将工作发送到哪里——这是一项比在单个 shell 中操作更难的认知任务。我们从单个容器中的大脑开始，因为早期模型无法做到这一点。随着智能的扩展，单个容器变成了限制：当该容器失败时，我们失去了大脑伸入的每双手的状态。

将大脑与双手解耦使每双手成为一个工具，`execute(name, input) → string`：名称和输入进入，返回字符串。该接口支持任何自定义工具、任何 MCP 服务器和我们的自有工具。harness 不知道沙箱是容器、手机还是宝可梦模拟器。并且因为没有手与任何大脑耦合，大脑可以将手传递给彼此。

![](/_next/image?url=https%3A%2F%2Fwww-cdn.anthropic.com%2Fimages%2F4zrzovbb%2Fwebsite%2F4f67b1c10566552aec514a716ea43544ab330e0b-668x243.png&w=1920&q=75)

## 结论

我们面临的挑战是一个古老的挑战：如何为“尚未构想出的程序”设计系统。操作系统通过将硬件虚拟化为足够通用的抽象以适用于尚不存在的程序，已经持续了几十年。使用托管代理，我们的目标是设计一个系统，以适应围绕 Claude 的未来 harness、沙箱或其他组件。

托管代理是一个具有相同精神的元 harness，对 Claude 未来需要的_特定_ harness 没有预设规范。相反，它是一个具有通用接口的系统，允许许多不同的 harness。例如，Claude Code 是一个优秀的 harness，我们在各种任务中广泛使用。我们也展示了特定任务的代理 harness 在狭窄领域中表现出色。托管代理可以适应任何这些，随着时间的推移匹配 Claude 的智能。

元 harness 设计意味着对围绕 Claude 的接口有预设规范：我们预期 Claude 将需要操纵状态（会话）和执行计算（沙箱）的能力。我们也预期 Claude 将需要扩展到多个大脑和多双手的能力。我们设计接口以便这些可以在长时间内可靠且安全地运行。但我们不对 Claude 需要的大脑或双手的数量或位置做任何假设。

## 致谢

作者：Lance Martin, Gabe Cemaj, 和 Michael Cohen。感谢 Nodir Turakulov 和 Jeremy Fox 就这些主题进行的有益对话。特别感谢 Agents API 团队和 Jake Eaton 的贡献。

![](https://www-cdn.anthropic.com/images/4zrzovbb/website/282c56ae3ec0a72a15c5f4186744ce0ac940a2dd-2554x2554.svg)

---

**原文链接**: [https://www.anthropic.com/engineering/managed-agents](https://www.anthropic.com/engineering/managed-agents)
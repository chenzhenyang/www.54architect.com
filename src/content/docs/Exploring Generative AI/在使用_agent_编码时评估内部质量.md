---
title: "在使用 Agent 编码时评估内部质量"
date: 2026-03-11 21:03:44
updated: 2026-03-11 21:03:44
tags:
  - AI
  - Technology
categories:
  - Technology
origin_title: "Assessing internal quality while coding with an agent"
author: "Martin Fowler"

skill_id: "d2217bb6c191"
original_url: "https://martinfowler.com/articles/exploring-gen-ai/ccmenu-quality.html"
sidebar: 
  order: 106
---

Erik 是一位经验丰富的技术专家和软件工程师。他总是对新兴技术和软件卓越性感兴趣。

本文是"探索生成式 AI（Exploring Gen AI）"系列的一部分。该系列记录了 Thoughtworks 技术专家探索将生成式 AI（gen ai）技术用于软件开发的过程。

2026 年 1 月 27 日

关于 AI 编码助手、Agent 和 Agent 集群如何在短时间内编写大量代码的报告层出不穷，据报道这些代码实现了所需的功能。在这种语境下，人们很少谈论性能或安全性等非功能性需求（non-functional requirements），可能是因为作者在许多用例中并不关心这些。而人们评估 Agent 生成代码质量的情况则更为罕见。然而，我认为内部质量对于开发工作能够以可持续的节奏持续数年至关重要，否则项目会在自身重压下崩溃。

因此，让我们仔细看看 AI 工具在内部代码质量方面的表现。我们将在 Agent 的帮助下为现有应用程序添加一个功能，并观察整个过程。当然，这"仅仅"是一个轶事。这份备忘录绝非一项研究。同时，我们将看到的许多内容都呈现出模式化特征，至少根据我的经验，可以 extrapolated（推断）。

## 我们要实现的功能

我们将使用 CCMenu 的代码库，这是一款 Mac 应用程序，在 Mac 菜单栏中显示 CI/CD 构建的状态。这为任务增加了一定的难度，因为 Mac 应用程序是用 Swift 编写的，这是一种常见的语言，但不如 JavaScript 或 Python 那样普遍。这也是一种现代编程语言，具有复杂的语法和类型系统，比 JavaScript 或 Python 需要更高的精确度。

CCMenu 定期通过调用构建服务器的 API 来获取状态。它目前支持使用 Jenkins 等实现的遗留协议（legacy protocol）的服务器，并支持 GitHub Actions 工作流。目前不支持的请求最多的服务器是 GitLab。因此，这就是我们的功能：我们将在 CCMenu 中实现对 GitLab 的支持。

## API 包装器

GitHub 提供了 GitHub Actions API，该 API 稳定且文档完善。GitLab 拥有 GitLab API，同样文档完善。鉴于问题空间的性质，它们在语义上非常相似。不过它们并不相同，我们稍后会看到这对任务的影响。

在内部，CCMenu 有三个 GitHub 特定的文件用于从 API 获取构建状态：一个 feed reader（馈送阅读器）、一个 response parser（响应解析器），以及一个包含包装 GitHub API 的 Swift 函数的文件，包括如下函数：

```
func requestForAllPublicRepositories(user: String, token: String?) -> URLRequest
  func requestForAllPrivateRepositories(token: String) -> URLRequest
  func requestForWorkflows(owner: String, repository: String, token: String?) -> URLRequest
```

这些函数返回 URLRequest 对象，这是 Swift SDK 的一部分，用于发出实际的网络请求。由于这些函数在结构上非常相似，它们将 URLRequest 对象的构造委托给一个共享的内部函数：

```
URLRequest
```

```
func makeRequest(method: String = "GET", baseUrl: URL, path: String,
        params: Dictionary<String, String> = [:], token: String? = nil) -> URLRequest
```

如果你不熟悉 Swift 也没关系，只要你能识别参数及其类型就可以了。

## 可选 Token

接下来，我们应该更详细地查看 token 参数。对 API 的请求可以进行认证。它们不一定需要认证，但可以进行认证。这使得像 CCMenu 这样的应用程序能够访问仅限于某些用户的信息。对于大多数 API（包括 GitHub 和 GitLab），token 只是一个需要在 HTTP 头中传递的长字符串。

```
token
```

在其实现中，CCMenu 使用可选字符串（optional string）作为 token，在 Swift 中用类型后的问号表示，本例中为 String？。这是惯用法（idiomatic use），Swift 强制此类可选值的接收者以安全的方式处理可选性，避免了经典的空指针问题。还有一些特殊的语言功能使这更容易。

```
String?
```

有些函数在未认证的语境下是无意义的，比如 requestForAllPrivateRepositories。这些函数将 token 声明为非可选（non-optional），向调用者表明必须提供 token。

```
requestForAllPrivateRepositories
```

## 开始吧

我已经尝试过几次这个实验，夏天时使用 Windsurf 和 Sonnet 3.5，最近则使用 Claude Code 和 Sonnet 4.5。方法保持相似：将任务分解为更小的块。对于每个块，我先让 Windsurf 制定计划，然后再要求实现。使用 Claude Code 时，我直接要求实现，依赖其内部规划；当某些事情走向错误方向时，则依赖 Git。

作为第一步，我几乎原封不动地问 Agent："基于 GitHub 的 API、feed reader 和 response parser 文件，为 GitLab 实现相同的功能。只编写这三个文件的等效版本。不要对 UI 进行更改。"

这听起来是一个合理的要求，大体上也是如此。即使是 Windsurf（使用能力较弱的模型）也注意到了关键差异并处理了它们，例如它认识到 GitHub 称为 repository（仓库）的内容在 GitLab 中是 project（项目）；它看到了 JSON 响应的差异，GitLab 在顶层返回 runs（运行）数组，而 GitHub 将此数组作为顶层对象中的一个属性。

在这个阶段我自己还没有查看 GitLab API 文档，仅从生成代码的粗略扫描来看，一切看起来都相当不错，代码可以编译，甚至复杂的函数类型也生成正确，或者真的是这样吗？

## 第一个意外

在下一步中，我要求 Agent 实现用于添加新 pipelines/workflows 的 UI。我特意要求它暂时不要担心认证，只实现公开访问信息的流程。关于这一步的讨论可能适合另一份备忘录，但新代码需要以某种方式承认 token 将来可能存在

```
var apiToken: String? = nil
```

然后它可以在调用包装函数时使用这个变量

```
let req = GitLabAPI.requestForGroupProjects(group: name, token: apiToken)
  var projects = await fetchProjects(request: req)
```

apiToken 变量被正确声明为可选 String，目前初始化为 nil。稍后，某些代码可以根据用户是否决定登录从其他地方检索 token。这段代码导致了第一个编译器错误：

```
apiToken
```

```
nil
```

这是怎么回事？事实证明，第一步中 API 包装器的代码有一个微妙的问题：它在所有包装函数中都将 token 声明为非可选，例如

```
func requestForGroupProjects(group: String, token: String) -> URLRequest
```

底层的 makeRequest 函数不知何故被正确创建了，token 被声明为可选。

```
makeRequest
```

代码可以编译是因为函数的编写方式，包装函数肯定有一个字符串，这当然可以传递给接受可选字符串的函数（参数可以是字符串或 nothing（nil））。但现在，在上面的代码中，我们有一个可选字符串，这不能传递给需要（确定）字符串的函数。

```
nil
```

## 感觉修复

由于懒惰，我直接将错误消息复制粘贴回 Windsurf。（在任何非 Xcode 的环境中构建 Swift 应用完全是另一回事，我记得一次与 Cline 的实验，它在添加和移除显式导入之间交替，每次迭代约 20 美分。）AI 为此问题提出的修复方案有效：它更改了调用点，并插入空字符串作为没有 token 时的默认值，使用 Swift 的 ?? 运算符。

```
??
```

```
let req = GitLabAPI.requestForGroupProjects(group: name, token: apiToken ?? "")
  var projects = await fetchProjects(request: req)
```

这可以编译，而且有点用：如果没有 token，则替换为空字符串，这意味着传递给函数的参数要么是 token，要么是空字符串，它始终是字符串，永远不会是 nil。

```
nil
```

那么，问题出在哪里？将 token 声明为可选的整个目的是表明 token 是可选的。AI 忽略了这一点并引入了新的语义：空字符串现在表示没有可用的 token。这是

- 不惯用的（not idiomatic），
- 不自文档化的（not self-documenting），
- 不被 Swift 类型系统支持的。

它还需要在调用此函数的每个地方进行更改。

## 真正的修复

当然，Agent 应该做的只是更改包装函数的函数声明，使 token 变为可选。有了这个更改，一切都能按预期工作，语义保持完整，而且更改仅限于在函数参数的类型中添加一个 ?，而不是在整个代码中喷洒 ?? ""。

```
?
```

```
?? ""
```

## 这真的重要吗？

你可能会问我是否在这里吹毛求疵。我不这么认为。我认为这是一个清晰的例子，表明如果让 AI Agent 自行其是，它会把代码库变得更糟，而需要一位有经验的开发者来注意到问题并指导 Agent 进行正确的实现。

此外，这只是我遇到的众多例子之一。在某个时候，Agent 想要引入一个完全不必要的缓存，当然，它也无法解释为什么要建议这个缓存。

它还未能意识到 GitHub 中的 user/org 重叠在 GitLab 中并不存在，并去实现一些复杂的逻辑来处理一个不存在的问题。这需要不止一次地引导 Agent 查看文档中的正确位置，才能说服它放弃坚持认为该逻辑是必要的。

它还"忘记"使用现有函数来构造 URL，在多个地方复制此类逻辑，通常没有实现所有功能，例如使用 macOS 上的 defaults 系统覆盖 base URL 以进行测试的选项。

因此，在这些情况下（还有更多），生成的代码可以工作。它实现了所需的功能。但新代码也会添加完全不必要的复杂性，并且错过了不明显的功能，降低了代码库的质量并引入了微妙的问题。

如果在大型软件系统上工作教会了我一件事，那就是投资于软件的内部质量、代码库的质量是一项值得的投资。不要被技术债务（technical debt）压垮。人类和 Agent 发现使用复杂的代码库更加困难。然而，如果没有仔细的监督，AI Agent 似乎有强烈的倾向引入技术债务，使未来的开发对人类和 Agent 都变得更加困难。

## 还有一件事

如果可能，CCMenu 会显示触发构建的人员/actor 的头像。在 GitHub 中，头像 URL 是构建状态 API 调用响应的一部分。GitLab 拥有更"干净"、更符合 RESTful 的设计，将额外的用户信息排除在构建响应之外。头像 URL 必须通过对 /user 端点的单独 API 调用来检索。

```
/user
```

Windsurf 和 Claude Code 都在这方面严重受阻。我记得一次漫长的对话，Claude Code 试图说服我 URL 在响应中。（它可能混淆了，因为多个端点描述在文档的同一页上。）最后，我发现在没有 Agent 支持的情况下实现该功能更容易。

## 我的结论

在夏天的实验期间，我持观望态度。Windsurf / Sonnet 3.5 组合确实加快了代码编写速度，但需要仔细的提示规划，而且我必须在 Windsurf 和 Xcode 之间来回切换（用于构建、运行测试和调试），这总是让人感到有些迷失方向，很快就会感到疲惫。生成代码的质量存在重大问题，而且 Agent 有陷入尝试解决问题的倾向。所以总体而言，我觉得使用 Agent 并没有给我带来太多收获。我用我喜欢做的事情（编写代码）换取了监督一个有编写草率代码倾向的 AI。

使用 Claude Code 和 Sonnet 4.5 的情况则有所不同。它需要更少的提示，代码质量也更好。这绝不是高质量的代码，但更好，需要更少的返工和更少的提示来提高质量。此外，在终端窗口中与 Xcode 并排运行与 Claude Code 的对话比在两个 IDE 之间切换感觉更自然。对我来说，这已经足够倾斜天平，让我定期使用 Claude Code。

最新文章（3 月 4 日）：

软件工程循环中的人类与 Agent（Humans and Agents in Software Engineering Loops）

上一篇文章：

理解规格驱动开发：Kiro、spec-kit 和 Tessl（Understanding Spec-Driven-Development: Kiro, spec-kit, and Tessl）

下一篇文章：

编码 Agent 的上下文工程（Context Engineering for Coding Agents）
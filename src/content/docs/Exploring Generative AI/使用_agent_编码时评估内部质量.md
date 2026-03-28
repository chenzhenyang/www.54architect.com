---
title: 使用 Agent 编码时评估内部质量
tags:
  - AI
  - Technology
categories:
  - Technology
origin_title: Assessing internal quality while coding with an agent
author: Martin Fowler
abbrlink: 3160165449
date: 2026-03-11 20:51:24
updated: 2026-03-11 20:51:24
---

Erik 是一位经验丰富的技术专家和软件工程师。他总是对新兴技术和软件卓越感兴趣。

本文是"探索生成式 AI（Exploring Gen AI）"系列的一部分。该系列记录了 Thoughtworks 技术专家探索将生成式 AI（gen ai）技术用于软件开发的过程。

2026 年 1 月 27 日

不乏有关 AI 编码助手、Agent 和 Agent 集群如何在短时间内编写大量代码的报告，据说这些代码实现了所需的功能。在这种情况下，人们很少谈论非功能性需求（non-functional requirements），如性能或安全性，也许因为这在作者拥有的许多用例中不是问题。而人们评估 Agent 生成代码质量的情况更为罕见。然而，我认为内部质量对于开发以可持续的速度持续多年至关重要，而不是在其自身重量下崩溃。

所以，让我们仔细看看 AI 工具在**内部代码质量**方面的表现如何。我们将在 Agent 的帮助下向现有应用程序添加一个功能，并观察过程中发生了什么。当然，这"仅仅"是一个轶事。这份备忘录绝非一项研究。同时，我们将看到的大部分内容都属于模式，至少根据我的经验可以推断。

## 我们正在实现的功能

我们将使用**CCMenu**的代码库，这是一个 Mac 应用程序，在 Mac 菜单栏中显示 CI/CD 构建的状态。这给任务增加了一定的难度，因为 Mac 应用程序是用 Swift 编写的，这是一种常见的语言，但不如 JavaScript 或 Python 那么常见。这也是一种现代编程语言，具有复杂的语法和类型系统，比 JavaScript 或 Python 需要更高的精度。

CCMenu 定期通过调用构建服务器的 API 来获取状态。它目前支持使用 Jenkins 等实现的遗留协议的服务器，并支持 GitHub Actions 工作流。目前不支持的请求最多的服务器是 GitLab。所以，这就是我们的功能：我们将在 CCMenu 中实现对 GitLab 的支持。

## API 包装器

GitHub 提供**GitHub Actions API**，稳定且文档齐全。GitLab 有**GitLab API**，文档也很齐全。鉴于问题空间的性质，它们在语义上非常相似。但它们并不相同，我们将稍后看到这对任务的影响。

在内部，CCMenu 有三个 GitHub 特定的文件来从 API 获取构建状态：一个 feed 阅读器、一个响应解析器，以及一个包含包装 GitHub API 的 Swift 函数的文件，包括如下函数：

```
func requestForAllPublicRepositories(user: String, token: String?) -> URLRequest
  func requestForAllPrivateRepositories(token: String) -> URLRequest
  func requestForWorkflows(owner: String, repository: String, token: String?) -> URLRequest
```

这些函数返回 `URLRequest` 对象，这是 Swift SDK 的一部分，用于进行实际的网络请求。因为这些函数在结构上非常相似，它们将 `URLRequest` 对象的构建委托给一个共享的内部函数：

```
URLRequest
```

```
func makeRequest(method: String = "GET", baseUrl: URL, path: String,
        params: Dictionary<String, String> = [:], token: String? = nil) -> URLRequest
```

如果你不熟悉 Swift 也没关系，只要你能识别参数及其类型就可以了。

## 可选 Token

接下来，我们应该更详细地看看 `token` 参数。对 API 的请求可以进行身份验证。它们不必进行身份验证，但可以进行身份验证。这允许像 CCMenu 这样的应用程序访问仅限于某些用户的信息。对于大多数 API（包括 GitHub 和 GitLab），token 只是一个需要在 HTTP 头中传递的长字符串。

```
token
```

在其实现中，CCMenu 对 token 使用可选字符串，在 Swift 中用类型后面的问号表示，这里是 `String?`。这是惯用用法，Swift 强制此类可选值的接收者以安全的方式处理可选性，避免经典的空指针问题。还有一些特殊的语言功能使这更容易。

```
String?
```

有些函数在未身份验证的上下文中是无意义的，比如 `requestForAllPrivateRepositories`。这些将 token 声明为非可选的，向调用者发出必须提供 token 的信号。

```
requestForAllPrivateRepositories
```

## 开始吧

我在夏天用 Windsurf 和 Sonnet 3.5，最近又用 Claude Code 和 Sonnet 4.5 尝试过这个实验几次。方法保持相似：将任务分解为更小的块。对于每个块，我先让 Windsurf 制定计划，然后再要求实现。使用 Claude Code 时，我直接进行实现，依靠其内部规划；当某些事情走向错误方向时，则依靠 Git。

作为第一步，我或多或少原封不动地问 Agent："基于 GitHub 的 API、feed 阅读器和响应解析器文件，为 GitLab 实现相同的功能。只编写这三个文件的等效版本。不要对 UI 进行更改。"

这听起来是一个合理的要求，大体上也是如此。即使是能力较弱的模型 Windsurf 也注意到了关键差异并处理了它们，例如它认识到 GitHub 称为 repository 的东西在 GitLab 中是 project；它看到了 JSON 响应的差异，GitLab 在顶层返回运行数组，而 GitHub 将此数组作为顶层对象中的属性。

在这个阶段我自己还没有查看 GitLab API 文档，只是粗略扫描生成的代码，一切看起来都相当不错，代码可以编译，甚至复杂的函数类型也生成正确，或者真的是这样吗？

## 第一个意外

在下一步中，我让 Agent 实现 UI 以添加新的 pipelines/workflows。我故意告诉它暂时不要担心身份验证，只为公开访问的信息实现流程。关于这一步的讨论也许适合另一份备忘录，但新代码需要以某种方式承认 token 可能在未来存在：

```
var apiToken: String? = nil
```

然后它可以在调用包装函数时使用这个变量：

```
let req = GitLabAPI.requestForGroupProjects(group: name, token: apiToken)
  var projects = await fetchProjects(request: req)
```

`apiToken` 变量被正确声明为可选 String，目前初始化为 `nil`。稍后，根据用户是否决定登录，一些代码可以从其他地方检索 token。这段代码导致了第一个编译器错误：

```
apiToken
```

```
nil
```

这是怎么回事？事实证明，第一步中的 API 包装器代码有一个微妙的问题：它在**所有**包装函数中将 token 声明为非可选的，例如：

```
func requestForGroupProjects(group: String, token: String) -> URLRequest
```

底层的 `makeRequest` 函数，出于某种原因，被正确创建了，token 被声明为可选的。

```
makeRequest
```

代码可以编译，因为函数的编写方式，包装函数肯定有一个字符串，这当然可以传递给接受可选字符串的函数，即参数可能是字符串或空（nil）。但是现在，在上面的代码中，我们有一个可选字符串，这不能传递给需要（确定的）字符串的函数。

```
nil
```

## 氛围修复（vibe fix）

出于懒惰，我只是将错误消息复制粘贴回 Windsurf。（在任何非 Xcode 的环境中构建 Swift 应用完全是另一回事，我记得有一次用 Cline 的实验，它在添加和移除显式导入之间交替，每次迭代大约 20 美分。）AI 为此问题提出的修复有效：它更改了调用点，使用 Swift 的 `??` 运算符插入了一个空字符串作为没有 token 时的默认值。

```
??
```

```
let req = GitLabAPI.requestForGroupProjects(group: name, token: apiToken ?? "")
  var projects = await fetchProjects(request: req)
```

这可以编译，而且有点用：如果没有 token，则替换为空字符串，这意味着传递给函数的参数要么是 token，要么是空字符串，它始终是一个字符串，从不是 `nil`。

```
nil
```

那么，有什么问题？将 token 声明为可选的整个目的是表明 token 是可选的。AI 忽略了这一点并引入了新的语义：空字符串现在表示没有可用的 token。这是：

- 不惯用的
- 不自文档化的
- 不被 Swift 的类型系统支持

这还需要在调用此函数的每个地方进行更改。

## 真正的修复

当然，Agent 应该做的是简单地更改包装函数的函数声明，使 token 变为可选。有了这个更改，一切都能按预期工作，语义保持完整，更改仅限于在函数参数的类型中添加一个 `?`，而不是在代码中到处喷洒 `?? ""`。

```
?
```

```
?? ""
```

## 这真的重要吗？

你可能会问我是否在这里吹毛求疵。我不这么认为。我认为这是一个清晰的例子，如果让 AI Agent 自行其是，它会将代码库变得更糟，需要一个有经验的开发者来注意到问题并指导 Agent 进行正确的实现。

此外，这只是我遇到的众多例子之一。在某个时候，Agent 想引入一个完全不必要的缓存，当然，它无法解释为什么甚至建议这个缓存。

它也没有意识到 GitHub 中的 user/org 重叠在 GitLab 中不存在，并去实现一些复杂的逻辑来处理一个不存在的问题。这需要不止一次地引导 Agent 查看文档中的正确位置，才能说服它放弃坚持需要这个逻辑。

它还"忘记"使用现有函数来构建 URL，在多个地方复制此类逻辑，通常没有实现所有功能，例如使用 macOS 上的默认系统覆盖基础 URL 以进行测试的选项。

所以，在这些情况下，生成的代码是有效的。它实现了所需的功能。但新代码也会添加完全不必要的复杂性，并且错过了不明显的功能，降低了代码库的质量并引入了微妙的问题。

如果在大型软件系统上工作教会了我一件事，那就是投资软件的内部质量、代码库的质量是一项值得的投资。不要被技术债务压垮。人类和 Agent 发现与复杂的代码库合作更加困难。然而，如果没有仔细的监督，AI Agent 似乎有强烈的倾向引入技术债务，使未来的开发对人类和 Agent 都更加困难。

## 还有一件事

如果可能，CCMenu 会显示触发构建的人员/actor 的头像。在 GitHub 中，头像 URL 是构建状态 API 调用响应的一部分。GitLab 有更"干净"、更 RESTful 的设计，在构建响应中不包含额外的用户信息。头像 URL 必须通过对 `/user` 端点的单独 API 调用来检索。

```
/user
```

Windsurf 和 Claude Code 都在这方面严重绊倒了。我记得一次漫长的对话，Claude Code 想说服我 URL 在响应中。（它可能搞混了，因为多个端点在同一页文档上描述。）最后，我发现没有 Agent 支持更容易实现该功能。

## 我的结论

在夏天的实验期间，我持观望态度。Windsurf / Sonnet 3.5 组合确实加快了编写代码的速度，但需要仔细规划提示，我不得不在 Windsurf 和 Xcode 之间来回切换（用于构建、运行测试和调试），这总是让人感到有些迷失方向，很快就会疲劳。生成代码的质量存在重大问题，Agent 有陷入尝试修复问题的倾向。所以，总的来说，我觉得使用 Agent 并没有给我带来太多收获。我用我喜欢做的事情（编写代码）换取了监督一个有编写草率代码倾向的 AI。

使用 Claude Code 和 Sonnet 4.5 的情况有所不同。它需要更少的提示，代码质量更好。这绝不是高质量的代码，但更好，需要更少的返工和更少的提示来提高质量。此外，在终端窗口中与 Xcode 一起运行与 Claude Code 的对话感觉比在两个 IDE 之间切换更自然。对我来说，这已经足够倾斜天平，让我定期使用 Claude Code。

---

**最新文章（3 月 4 日）：**
Humans and Agents in Software Engineering Loops

**上一篇文章：**
理解规格驱动开发：Kiro、spec-kit 和 Tessl

**下一篇文章：**
Context Engineering for Coding Agents
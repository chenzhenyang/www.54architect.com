---
title: "构建能够通过 MCP 触及生产系统的智能体"
skill_id: 1d31b89a
generated: 2026-04-24T10:23:46.178815
original_url: https://claude.com/blog/building-agents-that-reach-production-systems-with-mcp
description: "本文探讨了连接 AI 智能体与外部系统的三种方式——直接 API 调用、CLI 和 MCP，分析了为什么生产级智能体倾向于使用 MCP，并分享了构建高效 MCP 服务器、优化上下文效率以及将技能与 MCP 结合使用的最佳实践。"
lastUpdated: 2026-04-24
tags: [MCP, AI, Agent, 智能体]
origin_title: "Building agents that reach production systems with MCP | Claude"
author: Anthropic
---

智能体的价值取决于它能够触及的系统。团队在连接智能体与外部系统时，往往会汇聚到三种方案——直接 API 调用、命令行接口（CLI）和模型上下文协议（MCP，Model Context Protocol）。本文阐述了每种方案的适用场景、为什么生产级智能体倾向于选择 MCP，以及构建高效集成的模式。

## 将智能体连接到外部系统

我们通常观察到三种连接智能体与外部系统的路径：直接 API 调用、CLI 和 MCP。具体选择取决于你正在构建什么。关键区别在于智能体与服务之间是否存在一个通用层，以及这个通用层能覆盖多广。

### 直接 API 调用

智能体直接调用你的 API——要么通过在代码执行沙箱中编写发出 HTTP 请求的代码，要么通过通用的函数调用工具。大多数团队都是从这里开始的，对于一个智能体与一个服务通信的场景，或者不需要跨多个智能体平台复用的小型集成，这种方案完全够用。

但随着规模扩大，挑战就开始出现了。由于智能体与服务之间没有通用层，每个智能体-服务对都会变成一个定制化的集成，各自处理认证、工具描述和边界情况——这就是 M×N 集成问题。

### 命令行接口（CLI）

智能体在 shell 中运行你的命令行工具。这种方式快速、轻量，并且可以依赖已有的工具链。它非常适合本地环境和沙箱化的容器——任何有文件系统和 shell 的地方。这提供了一个通用层，但这个层比较薄。

CLI 在触达移动设备、Web 或未暴露容器的云托管平台时会遇到硬性限制，而且认证通常由 CLI 自身的机制处理——一般是磁盘上的凭证文件。这种方式最适合本地环境中快速、宽松的集成。

### 模型上下文协议（MCP）

MCP 以协议的形式提供了通用层。智能体连接到一个暴露你系统能力的服务器，认证、发现和丰富的语义都已标准化。一个远程服务器可以触达任何兼容的客户端（Claude、ChatGPT、Cursor、VS Code 等），适用于任何部署环境。

它需要多一点前期投入。回报是集成具有可移植性，并且提供了构建功能丰富的智能体集成所需的语义。

## 生产级智能体运行在云端

生产级智能体越来越多地运行在云端，以便能够扩展并持续运行。它们需要触及的系统也是云托管的：你的数据存储在哪里、工作在哪里被追踪、你的基础设施在哪里运行。这些系统通常是远程的且需要认证，而 MCP 正是提供了这个通用层。

采用情况已经印证了这一趋势。[MCP SDK](https://modelcontextprotocol.io/docs/sdk) 的月下载量最近突破了 3 亿次，从年初的 1 亿次大幅增长，企业级和主流智能体平台的采用势头强劲。每天有数百万人通过 Claude 使用 MCP，该协议支撑了我们最近发布的许多产品，包括 [Claude Cowork](https://claude.com/product/cowork)、[Claude Managed Agents](https://claude.com/blog/claude-managed-agents) 以及 [Claude Code 中的频道（Channels）](https://code.claude.com/docs/en/channels)。

随着 MCP 持续支持生产级智能体系统，我们在此分享构建这些集成的最佳实践：从构建高级服务器到上下文高效的客户端，以及技能（Skills）如何与协议互补。

## 构建高效的 MCP 服务器

我们的[目录](https://claude.ai/directory/connectors)中已有超过 200 个 MCP 服务器，每天被数百万人使用。通过与在协议之上构建的企业和开发者的紧密合作，我们发现了一些决定智能体能否可靠使用服务器的设计模式。

### 构建远程服务器以实现最大覆盖

远程服务器是实现分发的关键——它是唯一能在 Web、移动端和云托管智能体上运行的配置，也是所有主流客户端优化消费的目标。构建远程服务器，让智能体无论在哪里运行都能使用你的系统。

### 围绕意图分组工具，而非围绕端点

数量更少、描述更精准的工具，表现始终优于穷举式的 API 镜像。不要将你的 API 一对一地包装成一个 MCP 服务器——围绕意图来分组工具，让智能体能够通过几次调用完成一个任务，而不是将多个原始操作拼接起来。一个 `create_issue_from_thread` 工具胜过 `get_thread` + `parse_messages` + `create_issue` + `link_attachment` 的组合。参见[为智能体编写高效的工具](https://www.anthropic.com/engineering/writing-tools-for-agents)了解完整模式。

### 当操作面很大时，为代码编排设计

如果你的服务需要数百种不同的操作，比如 Cloudflare、AWS 或 Kubernetes，基于意图分组的工具集可能无法覆盖所有场景。相反，应该暴露一个接受代码的薄工具层：智能体编写一段简短的脚本，你的服务器在沙箱中针对你的 API 执行该脚本，只返回结果。[Cloudflare 的 MCP 服务器](https://github.com/cloudflare/mcp)是一个参考示例——仅两个工具（搜索和执行）就覆盖了约 2,500 个端点，且仅消耗约 1K token。

### 在有帮助的地方提供丰富的语义

[MCP Apps](https://modelcontextprotocol.io/extensions/apps/overview) 是第一个正式的协议扩展，它允许工具返回一个交互式界面，例如图表、表单或仪表板，所有这些都可以内联渲染在聊天界面中。部署了 MCP 应用的服务器通常比仅返回文本的服务器获得显著更高的采用率和留存率。用它在你产品界面对智能体或终端用户最重要的时刻呈现出来——该扩展已在 Claude.ai、Claude Cowork 和许多其他主流 AI 工具中得到支持。

[引导式交互（Elicitation）](https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation) 允许你的服务器在工具调用中途暂停，向用户请求输入。[表单模式（Form mode）](https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation#form-mode-elicitation-requests) 发送一个简单的模式（schema），客户端渲染一个原生表单——用于请求缺失的参数、确认破坏性操作或消除选项歧义。[URL 模式](https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation#url-mode-elicitation-requests) 将用户引导至浏览器——用于完成下游 OAuth 认证、完成支付或收集任何不应经过 MCP 客户端传输的凭证。这两种模式都让用户保持在当前流程中，而不是将他们发送到设置页面。表单模式已广泛支持；URL 模式已在 Claude Code 中支持，更多客户端正在开发中。

### 依赖标准化的认证

标准化认证让 MCP 对云托管智能体而言切实可用。如果你的服务器需要 OAuth，最新的 [MCP 规范](https://modelcontextprotocol.io/specification/2025-11-25) 支持 [CIMD](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization#client-id-metadata-documents)（客户端 ID 元数据文档，Client ID Metadata Documents）用于客户端注册——它为用户提供快速的首次认证流程，并大幅减少意外的重新认证提示。这是我们推荐的认证方案，该能力已在 MCP SDK、Claude.ai 和 Claude Code 中得到支持，并正在整个行业广泛采用。

用户授权之后，接下来的问题是云托管的智能体如何在运行时持有并复用这些令牌。[Claude Managed Agents](https://platform.claude.com/docs/en/managed-agents/overview) 中的 [Vaults](https://platform.claude.com/docs/en/managed-agents/vaults#mcp-oauth-credential) 解决了这个问题：注册用户的 OAuth 令牌一次，在创建会话时通过 ID 引 Vault，平台就会将正确的凭据注入到每个 MCP 连接中并自动刷新——无需构建密钥存储，也无需在每次调用时传递令牌。

## 让 MCP 客户端更加上下文高效

MCP 标准化了 AI 智能体（[_客户端_](https://modelcontextprotocol.io/docs/develop/build-client#python)）如何连接和使用它们所需的工具与数据源（[_服务器_](https://modelcontextprotocol.io/docs/develop/build-server)）。服务器安全地暴露一系列能力，而客户端负责编排和管理上下文。如果你在构建 MCP 客户端，请使用渐进式披露（progressive disclosure）模式使其上下文高效。

### 使用工具搜索按需加载工具定义

[工具搜索（Tool search）](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool) 延迟了将所有工具加载到上下文的时机，而不是在启动时就全部加载。这让智能体能够在运行时搜索工具目录，仅在需要时拉入相关工具。在我们的[测试](https://www.anthropic.com/engineering/advanced-tool-use)中，工具搜索通常能将工具定义相关的 token 消耗减少 85% 以上，同时保持很高的选择准确性。

![](https://raw.githubusercontent.com/chenzhenyang/images/master/images/mcp_article_img_0.webp)

使用工具搜索减少上下文消耗。来源：[高级工具使用](https://www.anthropic.com/engineering/advanced-tool-use)

### 在代码中处理工具结果，使用编程式工具调用

[编程式工具调用（Programmatic tool calling）](https://www.anthropic.com/engineering/code-execution-with-mcp) 在代码执行沙箱中处理工具结果，而不是将原始结果直接返回给模型。这让智能体能够在代码中进行循环、过滤和跨调用聚合，只有最终输出才会进入上下文。在我们的测试中，这能在复杂的多步骤工作流中将 token 使用量减少约 [37%](https://platform.claude.com/docs/en/agents-and-tools/tool-use/programmatic-tool-calling)。

这些模式在多个服务器之间自然地组合：更精简的上下文、更少的往返调用、更快的响应。完整分析参见[_高级工具使用_](https://www.anthropic.com/engineering/advanced-tool-use)。

## 将 MCP 服务器与技能搭配使用

[技能与 MCP 是互补的](https://claude.com/blog/skills-explained)。MCP 让智能体能够从外部系统获取工具和数据，而技能则教会智能体使用这些工具完成实际工作的流程知识。最强大的智能体同时使用两者，并且技能让 MCP 服务器能够扩展到少数几个连接之外。有两种通用的组合模式：

### 将技能和 MCP 服务器打包为插件

Claude 的[插件（Plugins）](https://code.claude.com/docs/en/plugins-reference#plugin-components-reference)是一种有用的抽象，允许开发者将技能、MCP 服务器、钩子（hooks）、LSP 服务器和专门的子智能体打包成一种易于消费的分发方式。使用这种方法是以最小摩擦统一多个上下文提供商的最佳途径。

将 MCP 服务器与技能结合，让 Claude 更像一个领域专家。通过 MCP 获取工具，并赋予 Claude 端到端编排工作流的技能。以我们用于 Cowork 的[数据插件](https://claude.ai/directory/plugins/data%40knowledge-work-plugins)为例，它包含 10 个技能和 8 个 MCP 服务器，覆盖 Snowflake、Databricks、BigQuery、Hex 等应用。

![](https://raw.githubusercontent.com/chenzhenyang/images/master/images/mcp_article_img_1.png)

技能与 MCP 的结合。来源：[通过技能和 MCP 服务器扩展 Claude 的能力](https://claude.com/blog/extending-claude-capabilities-with-skills-mcp-servers)

### 从 MCP 服务器分发技能

提供商在发布 MCP 服务器的同时发布技能，这正变得越来越普遍——这样智能体既能获得原始能力，又能获得如何使用它们的高见指导。[Canva](https://claude.com/connectors/atlassian)、[Notion](https://claude.com/connectors/notion)、[Sentry](https://claude.com/connectors/sentry) 等目前都在 Claude 中采用了这种方式，在[我们的 Web 目录](https://claude.com/connectors)中将技能列在连接器旁边。

为了让这种配对在所有客户端之间可移植，MCP 社区正在积极开发一个直接从服务器分发技能的[扩展](https://github.com/modelcontextprotocol/experimental-ext-skills)。这样客户端会自动继承相关的专业知识，并且与其所依赖的 API 一起版本化。我们预期这一模式在扩展稳定后将获得广泛采用。

## 不断复利的层级

文章开头我们介绍了连接智能体与外部系统的三种路径。在实践中，成熟的集成会同时提供这三种：API 作为基础、CLI 面向本地优先的环境、MCP 面向云端智能体。

随着生产级智能体向云端迁移，MCP 成为关键层级，而且它是最能产生复利效应的。如今，一个远程服务器可以触达任何部署环境中所有兼容的客户端，认证、交互性和丰富语义都由协议处理。随着更多客户端采纳规范、更多扩展融入规范，同一个服务器会变得越来越强大，而你无需额外发布任何东西。

在构建集成时，如果你的目标是让云端的生产级智能体触及你的系统，请构建一个 MCP 服务器，并运用上述模式让它变得出色。每一个基于 MCP 构建的集成都在增强整个生态系统：需要独自解决的边界情况越来越少，需要维护的定制化集成越来越少。

### 致谢

感谢 Den Delimarsky、David Soria Parra、Henry Shi、Felix Rieseberg、Conor Kelly、Molly Vorwerck、Andy Schumeister、Kevin Garcia、Amie Rotherham、Matt Samuels、Angela Jiang、Katelyn Lesse、AJ Rebeiro 和 Jess Yan 对本文的贡献。

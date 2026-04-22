---
title: Cloudflare内部AI工程栈：在我们自己的平台上构建
description: 'Cloudflare在其自身产品上构建内部AI工程栈：2000万请求通过AI Gateway，2410亿token处理，3683名内部用户使用，93%的R&D组织使用AI编码工具。'
tags:
- AI Coding
- Cloudflare
- AI Gateway
- MCP
- 企业实践
categories:
- Technology
lastUpdated: 2026-04-22
origin_title: "The AI engineering stack we built internally — on the platform we ship"
original_url: https://blog.cloudflare.com/internal-ai-engineering-stack/
---

在过去30天里，Cloudflare 93%的研发组织使用了由我们在自己平台上构建的基础设施驱动的AI编码工具。

11个月前，我们进行了一项重大项目：真正将AI集成到我们的工程栈中。我们需要构建内部MCP服务器、访问层和AI工具，使Agent在Cloudflare内部有用。我们从全公司抽调工程师组成了一个名为iMARS（内部MCP Agent/服务器推广小队）的虎队。持续的工作最终落到了Dev Productivity团队，他们也拥有我们大部分内部工具，包括CI/CD、构建系统和自动化。

以下是一些数字，展示我们在过去30天的Agentic AI使用情况：

- **3,683名内部用户**活跃使用AI编码工具（全公司60%，R&D 93%），总员工约6,100人
- **4795万**AI请求
- **295个团队**正在使用Agentic AI工具和编码助手
- **2018万**AI Gateway每月请求
- **2413.7亿**token通过AI Gateway路由
- **518.3亿**token在Workers AI上处理

内部开发者速度的影响是清晰的：我们从未见过如此大幅度的季度合并请求增长。

随着AI工具采用的增长，4周滚动平均值已从约5,600/周上升到超过8,700。3月23日那一周达到10,952，几乎是Q4基准的两倍。

MCP服务器是起点，但团队很快意识到我们需要更进一步：重新思考标准如何被编码、代码如何被审查、工程师如何入职，以及变更如何在数千个仓库中传播。

## 架构概览

工程师-facing工具层（OpenCode、Windsurf和其他MCP兼容客户端）包括开源和第三方编码助手工具。

每一层都映射到我们使用的Cloudflare产品或工具：

| 我们构建的 | 使用 |
| --- | --- |
| Zero Trust认证 | **Cloudflare Access** |
| 集中化LLM路由、成本跟踪、BYOK和零数据保留控制 | **AI Gateway** |
| 平台内推理与开放权重模型 | **Workers AI** |
| 带单一OAuth的MCP服务器门户 | **Workers** + **Access** |
| AI代码审查CI集成 | **Workers** + **AI Gateway** |
| Agent生成代码的沙盒执行（Code Mode） | **Dynamic Workers** |
| 有状态的长期Agent会话 | **Agents SDK**（McpAgent, Durable Objects） |
| 用于克隆、构建和测试的隔离环境 | **Sandbox SDK** |
| 持久的多步骤工作流 | **Workflows** |
| 16K+实体知识图谱 | **Backstage**（OSS） |

除了Backstage之外，以上列出的所有内容都是正在出货的产品，其中许多在Agents Week期间获得了重大更新。

我们将分三幕来介绍：

1. **平台层**——认证、路由和推理如何工作（AI Gateway、Workers AI、MCP门户、Code Mode）
2. **知识层**——Agent如何理解我们的系统（Backstage、AGENTS.md）
3. **执行层**——我们如何在大规模保持高质量（AI代码审查、Engineering Codex）

## 第一幕：平台层

### AI Gateway如何帮助我们保持安全并改善开发者体验

当你有超过3,600名内部用户每天使用AI编码工具时，你需要解决跨多个客户端、用例和角色的访问和可见性问题。

一切都从**Cloudflare Access**开始，它处理所有认证和zero-trust策略执行。认证后，每个LLM请求都通过**AI Gateway**路由。这给了我们一个单一的地方来管理提供商密钥、成本跟踪和数据保留策略。

AI Gateway分析显示了月度使用如何在模型提供商之间分布。上个月，内部请求量分布如下：

| 提供商 | 每月请求 | 占比 |
| --- | --- | --- |
| Frontier Labs（OpenAI, Anthropic, Google） | 1338万 | 91.16% |
| Workers AI | 130万 | 8.84% |

前沿模型目前处理大部分复杂的agentic编码工作，但Workers AI已经是混合中的重要部分，并处理越来越多我们的agentic工程工作负载。

#### 我们如何越来越多地利用Workers AI

**Workers AI**是Cloudflare的无服务器AI推理平台，在我们全球网络的GPU上运行开源模型。除了与前沿模型相比的巨大成本改进之外，一个关键优势是推理停留在与你的Workers、Durable Objects和存储相同的网络上。没有跨云跳转，这会导致更多延迟、网络不稳定和需要管理的额外网络配置。

2026年3月在Workers AI上推出的**Kimi K2.5**是一个前沿规模的开源模型，具有256k上下文窗口、工具调用和结构化输出。正如我们在Kimi K2.5发布帖子中描述的，我们有一个安全Agent每天在Kimi上处理超过70亿token。在中等专有模型上这将花费估计每年240万美元。但在Workers AI上，它便宜77%。

除了安全，我们还在CI管道中使用Workers AI进行文档审查，用于在数千个仓库中生成AGENTS.md上下文文件，以及用于同网络延迟比峰值模型能力更重要的轻量级推理任务。

#### 工作原理：一个URL配置一切

整个设置从一个命令开始：

```
opencode auth login https://opencode.internal.domain
```

该命令触发一个链，配置提供商、模型、MCP服务器、Agent和权限，用户无需触碰配置文件。

**步骤1：发现认证要求。** OpenCode从类似`https://opencode.internal.domain/.well-known/opencode`的URL获取配置。

这个发现端点由Worker提供服务，响应有一个`auth`块告诉OpenCode如何认证，以及一个`config`块包含提供商、MCP服务器、Agent、命令和默认权限。

**步骤2：通过Cloudflare Access认证。** OpenCode运行认证命令，用户通过与其他所有Cloudflare内部相同的SSO进行认证。`cloudflared`返回一个签名的JWT。OpenCode在本地存储它并自动附加到每个后续提供商请求。

**步骤3：配置合并到OpenCode。** 提供的配置是整个组织的共享默认值，但本地配置始终优先。用户可以覆盖默认模型、添加自己的Agent或调整项目和用户范围的权限，而不影响其他人。

**代理Worker内部。** Worker是一个简单的Hono应用，做三件事：

- **提供共享配置。** 配置在部署时从结构化源文件编译，包含占位符值如`{baseURL}`用于Worker的origin。在请求时，Worker替换这些，所以所有提供商请求都通过Worker路由而非直接到模型提供商。
- **代理请求到AI Gateway。** 当OpenCode发送类似`POST /anthropic/v1/messages`的请求时，Worker验证Cloudflare Access JWT，然后在转发之前重写头部。请求转到AI Gateway，它路由到相应的提供商。响应直接通过，零缓冲。
- **保持模型目录新鲜。** 每小时cron触发从`models.dev`获取当前OpenAI模型列表，将其缓存在Workers KV中，并为每个模型注入`store: false`以实现零数据保留。新模型自动获得ZDR，无需配置重新部署。

## 第二幕：知识层

### AGENTS.md 作为编码标准

Cloudflare采用了一个名为`AGENTS.md`的文件来定义每个仓库的编码标准。这个文件告诉AI Agent关于代码库、约定和工具链的一切。

```markdown
# AGENTS.md
- 使用TypeScript，严格模式
- 测试用vitest编写
- 提交前运行`pnpm lint`
```

这个简单但强大的模式让每个仓库定义自己的编码约定，AI Agent在开始工作之前读取这些约定。这减少了"上下文注入"的手动工作，并确保AI生成的代码遵循团队的标准。

### Backstage知识图谱

Cloudflare使用Spotify的Backstage项目作为其内部开发者门户。这创建了一个包含16,000多个实体的知识图谱——仓库、服务、团队和文档——Agent可以使用它来理解系统如何连接。

当Agent需要理解服务如何与另一个服务交互时，它可以查询Backstage知识图谱来获取关系、所有权和文档。这比依赖模型的训练数据准确得多，因为它基于实时、内部数据。

## 第三幕：执行层

### AI代码审查

Cloudflare构建了一个AI代码审查系统，作为CI管道的一部分集成。当拉取请求被打开时，AI代码审查Worker被触发，分析更改并提供关于代码质量、安全性和最佳实践的反馈。

系统在AI Gateway上运行，使用前沿模型进行复杂推理。审查结果作为评论发布到拉取请求，为工程师提供关于潜在问题的即时反馈。

这减少了人工审查者花在基本代码审查上的时间，让他们专注于架构决策和复杂逻辑。

### Engineering Codex

Cloudflare的Engineering Codex是一套工程原则和实践，指导团队如何构建和维护高质量软件。它涵盖了从代码组织到测试策略到部署实践的一切。

AI工具被用来执行Codex中的规则。例如，如果工程师尝试提交违反安全协议的代码，AI代码审查系统会标记它并提供关于如何修复它的指导。

这确保了即使在快速移动的AI辅助开发环境中，质量标准也得到维护。

## 成果与展望

Cloudflare的方法展示了一个关键洞察：**最佳内部AI工程栈是你已经构建和出货的产品的延伸。**

通过将AI工具构建在他们自己的产品之上——AI Gateway用于路由和成本跟踪、Workers AI用于推理、Workers用于MCP服务器、Access用于认证——Cloudflare实现了一个安全、可扩展且经济高效的内部AI平台。

关键数字回顾：
- 93%的R&D使用AI编码工具
- 每月2000万+ AI Gateway请求
- 2410亿+ token处理
- 季度合并请求的创纪录增长

随着开源模型继续改进和平台继续发展，Cloudflare预计Workers AI将处理越来越多内部工作负载，而前沿模型将继续处理最复杂的agentic任务。

这种混合方法——在正确的工作使用正确的工具——是构建可持续AI工程栈的关键。

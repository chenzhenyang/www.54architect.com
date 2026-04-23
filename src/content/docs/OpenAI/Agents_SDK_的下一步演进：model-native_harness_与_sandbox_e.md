---
title: Agents SDK 的下一步演进：model-native harness 与 sandbox execution
description: OpenAI 为 Agents SDK 引入新能力：model-native harness 让 agent 跨文件和工具工作，原生 sandbox
  execution 确保安全运行，支持 MCP、AGENTS.md 等标准集成。
tags:
- OpenAI
- Agents SDK
- AI 工程
- sandbox
- MCP
categories:
- OpenAI
lastUpdated: 2026-04-23
origin_title: The next evolution of the Agents SDK
author: OpenAI
original_url: https://openai.com/index/the-next-evolution-of-the-agents-sdk/
---
**来源**: [OpenAI](https://openai.com/zh-Hant-HK/index/the-next-evolution-of-the-agents-sdk/)

---

我们正在为 [Agents SDK](https://developers.openai.com/api/docs/guides/agents) 引入新的能力，为开发者提供易于上手且为 OpenAI 模型正确构建的标准化基础设施：一个 model-native harness，让 agent 能够跨计算机上的文件和工具工作，以及原生 sandbox execution，确保安全地运行这些工作。

![Agent SDK 连接用户输入、模型和工具的示意图](https://raw.githubusercontent.com/chenzhenyang/images/master/openai-agents-sdk/AgentSDK_BuildingAgentsWithModels.svg)

例如，开发者可以为 agent 提供受控的工作空间、明确的指令以及检查证据所需的工具：

```python
# pip install "openai-agents>=0.14.0"

import asyncio
import tempfile
from pathlib import Path

from agents import Runner
from agents.run import RunConfig
from agents.sandbox import Manifest, SandboxAgent, SandboxRunConfig
from agents.sandbox.entries import LocalDir
from agents.sandbox.sandboxes import UnixLocalSandboxClient


async def main() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        dataroom = Path(tmp) / "dataroom"
        dataroom.mkdir()
        (dataroom / "metrics.md").write_text(
            """# Annual metrics

| Year | Revenue | Operating income | Operating cash flow |
| --- | ---: | ---: | ---: |
| FY2025 | $124.3M | $18.6M | $24.1M |
| FY2024 | $98.7M | $12.4M | $17.9M |
""",
            encoding="utf-8",
        )

        agent = SandboxAgent(
            name="Dataroom Analyst",
            model="gpt-5.4",
            instructions="Answer using only files in data/. Cite source filenames.",
            default_manifest=Manifest(entries={"data": LocalDir(src=dataroom)}),
        )

        result = await Runner.run(
            agent,
            "Compare FY2025 revenue, operating income, and operating cash flow with FY2024.",
            run_config=RunConfig(
                sandbox=SandboxRunConfig(client=UnixLocalSandboxClient()),
            ),
        )
        print(result.final_output)


if __name__ == "__main__":
    asyncio.run(main())
```

> 开发者需要的不仅仅是最好的模型来构建有用的 agent——他们还需要支持 agent 如何检查文件、运行命令、编写代码以及在多个步骤中持续工作的系统。

当团队从原型走向生产时，现有的系统各有取舍。模型无关的框架虽然灵活，但无法充分利用前沿模型的能力；模型提供商的 SDK 可能更接近模型，但往往缺乏对 harness 的足够可见性；托管 agent API 可以简化部署，但限制了 agent 的运行位置以及访问敏感数据的方式。

![使用 Agent SDK 构建 AI 智能体的示意图](https://raw.githubusercontent.com/chenzhenyang/images/master/openai-agents-sdk/AgentSDK_BuildingWithAgentsSDK.svg)

以下是与我们一起测试新 SDK 的一些客户的反馈：

> 「GPT-5.4 为文件密集型法律工作设立了新标准。在我们的 BigLaw Bench 评估中，GPT-5.4 的得分为 91%。与其他模型相比，GPT-5.4 目前更擅长整理复杂的交易分析结构、在冗长合约中维持准确性，并交付法律从业人员所需的精准细节。」— Harvey 应用研究主管 Niko Grupen

随着今天的发布，Agents SDK harness 在处理文档、文件和系统的 agent 方面变得更加强大。它现在拥有可配置的 memory、sandbox-aware orchestration、类似 Codex 的文件系统工具，以及与前沿 agent 系统中日益通用的 primitives 的标准化集成。

这些 primitives 包括：通过 [MCP](https://modelcontextprotocol.io) 的工具使用、通过 [skills](https://agentskills.io) 的渐进式披露、通过 [AGENTS.md](https://agents.md) 的自定义指令、使用 [shell](https://developers.openai.com/api/docs/guides/tools-shell) 工具的代码执行、使用 [apply patch](https://developers.openai.com/api/docs/guides/tools-apply-patch) 工具的文件编辑，以及更多。harness 将继续融入新的 agentic patterns 和 primitives，让开发者能够减少核心基础设施更新的时间，将更多精力投入到使其 agent 真正有用的领域特定逻辑上。

harness 还通过将执行与前沿模型的最佳表现方式对齐，帮助开发者释放更多模型能力。这使得 agent 更接近模型的自然运行模式，在复杂任务上提高了可靠性和性能——尤其是当工作需要长时间运行或跨多种工具和系统协调时。

![Agent SDK harness 利用额外计算资源的流程图](https://raw.githubusercontent.com/chenzhenyang/images/master/openai-agents-sdk/AgentSDK_HarnessWithCompute.svg)

此外，我们意识到每个产品都是独特的，很少能整齐地套入某种模式。我们设计 Agents SDK 就是为了支持这种多样性。开发者获得的是一个既开箱即用又灵活的 harness——可以轻松适配自己的技术栈——包括工具使用、memory 和 sandbox 环境。

## Sandbox Execution

更新后的 Agents SDK 原生支持 sandbox execution，因此 agent 可以在受控的计算机环境中运行，拥有任务所需的文件、工具和依赖。

许多有用的 agent 需要一个工作空间，可以在其中安全地读写文件、安装依赖、运行代码和使用工具。原生 sandbox 支持让开发者开箱即获得该执行层，而无需自己拼凑搭建。

开发者可以自带 sandbox，或使用对 Blaxel、Cloudflare、Daytona、E2B、Modal、Runloop 和 Vercel 的内置支持。

![支持的沙箱提供商徽标](https://raw.githubusercontent.com/chenzhenyang/images/master/openai-agents-sdk/sandbox-providers-logos.png)

为了让这些环境能够跨提供商移植，SDK 还引入了 Manifest 抽象来描述 agent 的工作空间。开发者可以挂载本地文件、定义输出目录，并从存储提供商引入数据，包括 AWS S3、Google Cloud Storage、Azure Blob Storage 和 Cloudflare R2。

这为开发者提供了一种一致的方式来塑造 agent 的环境，从本地原型到生产部署。它还为模型提供了一个可预测的工作空间：在哪里找到输入、在哪里写入输出，以及在长时间运行的任务中如何保持工作有序。

## 安全与可扩展性

Agent 系统的设计应该假设存在 prompt-injection 和数据 exfiltration 的尝试。将 harness 和 compute 分离，有助于将凭据排除在模型生成代码执行的环境之外。

![Agent SDK 编排不同计算系统的示意图](https://raw.githubusercontent.com/chenzhenyang/images/master/openai-agents-sdk/AgentSDK_HarnessSeparate.svg)

它还支持 durable execution。当 agent 的状态被外部化时，失去一个 sandbox 容器并不意味着丢失整个运行。通过内置的 snapshotting 和 rehydration，Agents SDK 可以在新容器中恢复 agent 的状态，并从最后一个 checkpoint 继续，如果原始环境发生故障或过期。

最后，它使 agent 更具可扩展性。Agent 运行可以使用一个或多个 sandbox，仅在需要时调用 sandbox，将 subagent 路由到隔离的环境，并跨容器并行工作以实现更快的执行。

## 可用性

这些新的 Agents SDK 能力通过 API 向所有客户开放，使用标准的 API 定价，基于 token 和工具使用量计费。

随着我们继续开发 Agents SDK，我们将不断扩展开发者能够用它构建的内容，让开发者能够以更少的自定义基础设施将更强大的 agent 投入生产，同时保留将 agent 融入自己环境所需的灵活性和控制权。

新的 harness 和 sandbox 能力将首先在 Python 中推出，TypeScript 支持计划在后续版本中推出。我们也在努力将更多 agent 能力（包括 code mode 和 subagents）带到 Python 和 TypeScript 两端。

此外，我们希望帮助将更广泛的 agent 生态系统整合在一起，未来将支持更多 sandbox 提供商、更多集成，以及更多方式让开发者将 SDK 接入他们已经使用的工具和系统。

---
title: Coding Agent 如何工作
description: 详解 coding agent 的工作原理，包括工具调用、上下文管理和迭代执行
origin_title: How coding agents work - Agentic Engineering Patterns - Simon Willison's Weblog
author: Simon Willison
tags:
  - AI
  - Agent
  - Programming
categories:
  - Technology
lastUpdated: 2026-04-01
skill_id: 0e2082b3
generated: 2026-04-01T15:05:00
original_url: https://simonwillison.net/guides/agentic-engineering-patterns/how-coding-agents-work/
---

与任何工具一样，了解 [coding agents（编码智能体）](https://simonwillison.net/guides/agentic-engineering-patterns/what-is-agentic-engineering/) 的底层工作原理可以帮助你更好地决定如何应用它们。

coding agent（编码智能体）是一种作为 LLM（大型语言模型）**harness（框架/载体）** 的软件，通过额外的能力扩展 LLM，这些能力由不可见的 prompts（提示）驱动，并实现为可调用的 tools（工具）。

## Large Language Models（大型语言模型） [#](/guides/agentic-engineering-patterns/how-coding-agents-work/#large-language-models)

任何 coding agent（编码智能体）的核心都是 Large Language Model（大型语言模型），简称 LLM。这些模型有诸如 GPT-5.4、Claude Opus 4.6、Gemini 3.1 Pro 或 Qwen3.5-35B-A3B 等名称。

LLM 是一种可以完成句子文本的机器学习模型。给模型短语 "the cat sat on the "，它（几乎肯定）会建议 "mat" 作为句子中的下一个单词。

随着这些模型变得更大并训练越来越多的数据，它们可以完成更复杂的句子——比如 "a python function to download a file from a URL is def download_file(url): "。

LLM 实际上不直接使用单词工作——它们使用 tokens（词元）。文本序列被转换为整数 token 序列，因此 "the cat sat on the " 变成 `[3086, 9059, 10139, 402, 290, 220]`。这值得理解，因为 LLM 提供商根据处理的 token 数量收费，并且受限于一次可以考虑多少 token。

你可以在 [platform.openai.com/tokenizer](https://platform.openai.com/tokenizer) 实验 OpenAI tokenizer 来了解这是如何工作的。

LLM 的输入称为 **prompt（提示）**。LLM 返回的文本称为 **completion（补全）**，有时也称为 **response（响应）**。

当今许多模型是 **multimodal（多模态）** 的，这意味着它们可以接受除文本之外的更多输入。**Vision LLMs（视觉 LLM）**（vLLMs）可以接受图像作为输入的一部分，这意味着你可以向它们提供草图、照片或截图。一个常见的误解是这些通过单独的 OCR 或图像分析过程运行，但这些输入实际上被转换为更多的 token 整数，以与文本相同的方式处理。

## Chat templated prompts（聊天模板提示） [#](/guides/agentic-engineering-patterns/how-coding-agents-work/#chat-templated-prompts)

第一批 LLM 作为 completion engines（补全引擎）工作——用户需要提供 prompt，然后由模型完成，如上面显示的两个示例。

这不是特别用户友好，所以模型主要切换到使用 **chat templated prompts（聊天模板提示）**，这将与模型的通信表示为模拟对话。

这实际上只是 completion prompt（补全提示）的一种特殊格式，看起来像这样：

    user: write a python function to download a file from a URL
    assistant:

这个 prompt 的自然 completion（补全）是 assistant（助手，由 LLM 表示）用一些 Python 代码回答用户的问题。

LLM 是 stateless（无状态）的：每次执行 prompt 时，它们都从相同的空白状态开始。

为了维持对话的模拟，与模型对话的软件需要维护自己的状态，并在用户每次输入新的 chat prompt 时重放整个现有对话：

    user: write a python function to download a file from a URL
    assistant: def download_url(url):
        return urllib.request.urlopen(url).read()
    user: use the requests library instead
    assistant:

由于提供商对输入和输出 token 都收费，这意味着随着对话变长，每个 prompt 变得更加昂贵，因为输入 token 的数量每次都在增长。

## Token caching（Token 缓存） [#](/guides/agentic-engineering-patterns/how-coding-agents-work/#token-caching)

大多数模型提供商通过更便宜的 **cached input tokens（缓存输入 token）** 费率来部分抵消这一点——在短时间内处理过的常见 token 前缀可以以较低的费率收费，因为底层基础设施可以缓存并重用许多用于处理该输入的昂贵计算。

coding agents（编码智能体）的设计考虑了这种优化——它们避免修改早期对话内容，以确保缓存尽可能高效地使用。

LLM **agent（智能体）** 的决定性特征是 agent 可以调用 **tools（工具）**。但什么是 tool（工具）？

tool（工具）是 agent harness（智能体框架）向 LLM 提供的函数。

在 prompt 本身的层面，这看起来像这样：

    system: If you need to access the weather, end your turn with <tool>get_weather(city_name)</tool>
    user: what's the weather in San Francisco?
    assistant:

这里 assistant 可能会用以下文本回答：

    <tool>get_weather("San Francisco")</tool>

model harness software（模型框架软件）然后从响应中提取该 function call request（函数调用请求）——可能使用 regular expression（正则表达式）——并执行 tool（工具）。

然后它将结果返回给模型，使用构造的 prompt，看起来像这样：

    system: If you need to access the weather, end your turn with <tool>get_weather(city_name)</tool>
    user: what's the weather in San Francisco?
    assistant: <tool>get_weather("San Francisco")</tool>
    user: <tool-result>61°, Partly cloudy</tool-result>
    assistant:

LLM 现在可以使用该 tool result（工具结果）来帮助生成对用户问题的答案。

大多数 coding agents（编码智能体）为 agent 定义十几个或更多 tools（工具）。其中最强大的允许 code execution（代码执行）——例如用于执行 terminal commands（终端命令）的 `Bash()` tool，或用于运行 Python 代码的 `Python()` tool。

## The system prompt（系统提示） [#](/guides/agentic-engineering-patterns/how-coding-agents-work/#the-system-prompt)

在前面的示例中，我包含了一个标记为 "system" 的初始消息，它通知 LLM 可用的 tool 以及如何调用它。

coding agents（编码智能体）通常以这样的 system prompt（系统提示）开始每次对话，这不显示给用户，但提供指令告诉模型它应该如何行为。

这些 system prompts（系统提示）可能有数百行长。这是截至 2026 年 3 月 [OpenAI Codex 的 system prompt](https://github.com/openai/codex/blob/rust-v0.114.0/codex-rs/core/templates/model_instructions/gpt-5.2-codex_instructions_template.md)，这是使这些 coding agents（编码智能体）工作的那种指令的有用清晰示例。

## Reasoning（推理） [#](/guides/agentic-engineering-patterns/how-coding-agents-work/#reasoning)

2025 年的重大新进展之一是将 **reasoning（推理）** 引入 frontier model families（前沿模型家族）。

Reasoning（推理），有时在 UI 中表示为 **thinking（思考）**，是模型花费额外时间生成文本，在呈现给用户回复之前讨论问题及其潜在解决方案。

这看起来类似于一个人大声思考，并具有类似的效果。关键是它允许模型花费更多时间（和更多 token）解决问题，以便 hopefully 获得更好的结果。

Reasoning（推理）对于调试代码中的问题特别有用，因为它为模型提供了机会来导航更复杂的代码路径，混合 tool calls（工具调用）并使用 reasoning phase（推理阶段）跟踪函数调用回到问题的潜在来源。

许多 coding agents（编码智能体）包括用于调高或调低 reasoning effort level（推理努力级别）的选项，鼓励模型花费更多时间咀嚼更难的问题。

## LLM + system prompt + tools in a loop（LLM + 系统提示 + 工具循环） [#](/guides/agentic-engineering-patterns/how-coding-agents-work/#llm-system-prompt-tools-in-a-loop)

信不信由你，这就是构建 coding agent（编码智能体）所需的大部分内容！

如果你想对这些东西的工作原理有更深入的了解，一个有用的练习是尝试从头构建自己的 agent（智能体）。一个简单的 tool loop（工具循环）可以在现有 LLM API 之上用几十行代码实现。

一个 _好的_ tool loop（工具循环）比这要多得多，但基本机制出奇地简单。

---

**原文链接**: [https://simonwillison.net/guides/agentic-engineering-patterns/how-coding-agents-work/](https://simonwillison.net/guides/agentic-engineering-patterns/how-coding-agents-work/)

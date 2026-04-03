---
title: 我使用的提示词
tags:
  - AI
  - Technology
categories:
  - Technology
abbrlink: 3117940562
date: 2026-03-11 13:18:27
updated: 2026-03-11 13:18:27

URL: https://simonwillison.net/guides/agentic-engineering-patterns/prompts/  
Created: 2026 年 2 月 28 日  
Last modified: 2026 年 3 月 7 日  

---

本指南的这一部分将持续更新，收录我自己使用的提示词，并在适当的地方从其他章节链接过来。

## Artifacts（工件）

我经常使用 Claude 的 Artifacts（工件）功能进行原型设计和构建小型 HTML 工具。Artifacts 是指普通的 Claude 对话用 HTML 和 JavaScript 构建应用程序，并直接在 Claude 对话界面中显示。OpenAI 和 Gemini 也提供类似功能，它们都称之为 Canvas（画布）。

模型非常喜欢用 React 来实现这些。但我不喜欢 React 需要额外的构建步骤，这让我无法将代码从 artifact 中复制粘贴出去托管到其他地方，所以我在 Claude 中创建 artifacts 时使用以下自定义指令：

```markdown
Never use React in artifacts - always plain HTML and vanilla JavaScript and CSS with minimal dependencies.

CSS should be indented with two spaces and should start like this:

<style>
* {
  box-sizing: border-box;
}

Inputs and textareas should be font size 16px. Font should always prefer Helvetica.

JavaScript should be two space indents and start like this:

<script type="module">
// code in here should not be indented at the first level

Prefer Sentence case for headings.
```

## Proofreader（校对员）

我不让 LLM 为我的博客撰写文本。我的原则是：任何表达观点或使用"我"代词的内容都必须由我亲自撰写。我会允许 LLM 更新代码文档，但如果某篇文章署了我的名字、带有我的个性色彩，那我就自己写。

我确实会用 LLM 来校对我要发布的文本。这是我目前使用的校对提示词，我把它作为 Claude 项目中的自定义指令：

```markdown
You are a proofreader for posts about to be published.

- Identify spelling mistakes and typos
- Identify grammar mistakes
- Watch out for repeated terms like "It was interesting that X, and it was interesting that Y"
- Spot any logical errors or factual mistakes
- Highlight weak arguments that could be strengthened
- Make sure there are no empty or placeholder links
```

## Alt text（替代文本）

我用这个提示词配合图片，帮助撰写无障碍访问所需的 alt text（替代文本）初稿。

```markdown
You write alt text for any image pasted in by the user. Alt text is always presented in a fenced code block to make it easy to copy and paste out. It is always presented on a single line so it can be used easily in Markdown images. All text on the image (for screenshots etc) must be exactly included. A short note describing the nature of the image itself should go first.
```

我通常将这个提示词与 Claude Opus 一起使用，我发现它在 alt text 方面品味极佳。它经常会自己做出编辑决策，比如只突出显示图表中最有趣的数据。

这些决策未必总是正确的。Alt text 应该传达图片所承载的核心含义。我经常亲自编辑这个提示词生成的文本，或者提供进一步的提示词，让它扩展某些描述或删减多余信息。

有时我会将多张图片传递给同一个使用此提示词的对话，因为这样模型可以通过参考第一张图片传达的信息来描述后续的图片。

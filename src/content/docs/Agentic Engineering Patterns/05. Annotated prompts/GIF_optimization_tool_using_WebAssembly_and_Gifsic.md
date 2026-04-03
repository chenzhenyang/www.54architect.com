---
title: GIF optimization tool using WebAssembly and Gifsicle
origin_title: GIF optimization
author: Simon Willison
skill_id: bcc4c571
original_url: >-
  https://simonwillison.net/guides/agentic-engineering-patterns/gif-optimization/
tags:
  - GIF
  - WebAssembly
  - 优化工具
  - Agentic Engineering
categories:
  - Technology
abbrlink: 2682272491
generated: 2026-03-11 12:07:54
date: 2026-03-11 12:12:04
updated: 2026-03-11 12:12:04
---

我喜欢在我的在线写作中包含动画 GIF 演示，通常使用 [LICEcap](https://www.cockos.com/licecap/) 录制。在 [交互式解释](https://simonwillison.net/guides/agentic-engineering-patterns/interactive-explanations/) 章节中就有一个例子。

这些 GIF 文件可能相当大。我尝试过几种优化工具来减小 GIF 文件大小，我最喜欢的是 Eddie Kohler 开发的 [Gifsicle](https://github.com/kohler/gifsicle)。它通过识别帧中未变化的区域并仅存储差异来压缩 GIF，还可以选择减少 GIF 颜色调色板或应用可见的有损压缩以获得更大的尺寸缩减。

Gifsicle 是用 C 编写的，默认界面是命令行工具。我想要一个 Web 界面，这样我就可以在浏览器中访问它，并直观地预览和比较不同的设置。

我用以下提示词对我的 [simonw/tools](https://github.com/simonw/tools) 仓库使用了 Claude Code for web（通过 Claude iPhone 应用从 iPhone 操作）：

以下是 [它构建的成果](https://tools.simonwillison.net/gif-optimizer)，以及我用该工具优化的动画 GIF 演示：

![动画演示。我拖放一个 GIF 文件，工具更新页面显示一系列不同设置下的优化版本。我最终选择其中一个的"Tweak settings"，滚动到底部，调整一些滑块并下载结果。](https://static.simonwillison.net/static/2026/demo2-32-colors-lossy.gif)

让我们逐步分析这个提示词。

> `gif-optimizer.html`

第一行只是告诉它我想要创建的文件名。这里只需要文件名就够了——我知道当 Claude 在仓库中运行"ls"时，它会理解每个文件都是一个不同的工具。

我的 [simonw/tools](https://github.com/simonw/tools) 仓库目前缺少 `CLAUDE.md` 或 `AGENTS.md` 文件。我发现代理只需扫描现有的文件树并查看现有文件中的相关代码，就能掌握仓库的大致情况。

> `Compile gifsicle to WASM, then build a web page that lets you open or drag-drop an animated GIF onto it and it then shows you that GIF compressed using gifsicle with a number of different settings, each preview with the size and a download button`

我在这里对 Claude 的现有知识做了一些假设，这些都得到了回报。

Gifsicle 现在已经快 30 年了，是一款广泛使用的软件——我有信心只要提到它的名字，Claude 就能找到代码。

"`Compile gifsicle to WASM`" 这句话在这里做了**很多**工作。

WASM 是 [WebAssembly](https://webassembly.org/) 的缩写，这项技术让浏览器能够在沙盒中安全地运行编译后的代码。

像 Gifsicle 这样的项目编译到 WASM 并不是一项简单的操作，涉及复杂的工具链，通常需要使用 [Emscripten](https://emscripten.org/) 项目。这通常需要大量的试错才能让一切正常工作。

编码代理非常擅长试错！它们通常能够强行找到解决方案，而我可能在第五次遇到难以理解的编译器错误后就放弃了。

我之前见过 Claude Code 多次解决 WASM 构建问题，所以我很有信心这会成功。

"`then build a web page that lets you open or drag-drop an animated GIF onto it`" 描述了我在我许多其他工具中使用过的模式。

HTML 文件上传对于选择文件来说没问题，但更好的 UI（尤其是在桌面上）是允许用户将文件拖放到页面上一个显眼的拖放区域。

设置这个需要一些 JavaScript 来处理事件，还需要一些 CSS 来设置拖放区域。这并不复杂，但工作量足以让我平时可能不会自己添加它。有了提示词，这几乎是免费的。

以下是最终的 UI——这是受到 Claude 查看我现有的 [image-resize-quality](https://tools.simonwillison.net/image-resize-quality) 工具的影响：

![Web 应用程序截图，标题为"GIF Optimizer"，副标题为"Powered by gifsicle compiled to WebAssembly — all processing happens in your browser"。一个大的虚线边框拖放区域显示"Drop an animated GIF here or click to select"。下面是一个文本输入框，占位符为"Or paste a GIF URL..."，以及一个蓝色的"Load URL"按钮。页脚文字显示"Built with gifsicle by Eddie Kohler, compiled to WebAssembly. gifsicle is released under the GNU General Public License, version 2."](https://static.simonwillison.net/static/2026/gif-optimizer.jpg)

我没有要求 GIF URL 输入功能，我不太喜欢它，因为它只适用于提供开放 CORS 头的 GIF URL。我可能会在未来的更新中移除它。

"`then shows you that GIF compressed using gifsicle with a number of different settings, each preview with the size and a download button`" 描述了应用程序的关键功能。

我没有费心定义我想要的设置集合——根据我的经验，Claude 有足够的品味为我选择这些，如果它的第一次猜测不奏效，我们总是可以更改。

显示大小很重要，因为这一切都是为了优化大小。

根据过去的经验，我知道要求一个"download button"会得到一个带有正确 HTML 和 JavaScript 机制的按钮，点击它会提供文件保存对话框，这比需要右键点击另存为要方便得多。

> `Also include controls for the gifsicle options for manual use - each preview has a "tweak these settings" link which sets those manual settings to the ones used for that preview so the user can customize them further`

这个提示词相当笨拙——毕竟我是在手机上输入的——但它充分表达了我的意图，让 Claude 构建了我想要的东西。

以下是最终工具中的样子，这张截图显示的是移动版本。每个图片都有一个"Tweak these settings"按钮，点击后会更新这组手动设置和滑块：

![GIF Optimizer 结果和设置面板截图。顶部结果显示"110.4 KB (original: 274.0 KB) — 59.7% smaller"，绿色显示，带有蓝色"Download"按钮和"Tweak these settings"按钮。下面是"Manual Settings"卡片，包含："Optimization level"下拉菜单设置为"-O3 (aggressive)"，"Lossy (0 = off, higher = more loss)"滑块设置为 0，"Colors (0 = unchanged)"滑块设置为 0，"Color reduction method"下拉菜单设置为"Default"，"Scale (%)"滑块设置为 100%，"Dither"下拉菜单设置为"Default"，以及一个蓝色的"Optimize with these settings"按钮。](https://static.simonwillison.net/static/2026/gif-optimizer-tweak.jpg)

> `Run "uvx rodney --help" and use that tool to tray your work - use this GIF for testing https://static.simonwillison.net/static/2026/animated-word-cloud-demo.gif`

如果你确保编码代理在工作时能够测试它们的代码，它们的工作效果会**好得多**。

测试 Web 界面有很多不同的方法——[Playwright](https://playwright.dev/)、[Selenium](https://www.selenium.dev/) 和 [agent-browser](https://agent-browser.dev/) 是三个不错的选择。

[Rodney](https://github.com/simonw/rodney) 是我自己构建的浏览器自动化工具，安装快速，其 `--help` 输出旨在教会代理使用该工具所需的一切知识。

这效果很好——在 [会话记录](https://claude.ai/code/session_01C8JpE3yQpwHfBCFni4ZUc4) 中你可以看到 Claude 使用 Rodney 并修复了它发现的一些小错误，例如：

> CSS `display: none` 优先于内联样式重置。我需要显式设置 `display: 'block'`。

## 后续提示词 [#](/guides/agentic-engineering-patterns/gif-optimization/#the-follow-up-prompts)

当我使用 Claude Code 时，我通常会关注它在做什么，这样我就可以在它仍在运行时重新定向它。我也经常在它工作时产生新的想法，然后将这些想法注入队列。

> `Include the build script and diff against original gifsicle code in the commit in an appropriate subdirectory`
> 
> `The build script should clone the gifsicle repo to /tmp and switch to a known commit before applying the diff - so no copy of gifsicle in the commit but all the scripts needed to build the wqsm`

当我注意到它在花费**大量**精力研究如何让 Gifsicle 与 WebAssembly 一起工作时，我添加了这个，包括修补原始源代码。这是它添加到仓库的 [补丁](https://github.com/simonw/tools/blob/main/lib/gifsicle/gifsicle-wasm.patch) 和 [构建脚本](https://github.com/simonw/tools/blob/main/lib/gifsicle/build.sh)。

我知道那个仓库中已经有一个支持文件存放位置的模式，但我记不起那个模式是什么了。说"in an appropriate subdirectory"足以让 Claude 找出放在哪里——它找到并使用了现有的 [lib/ 目录](https://github.com/simonw/tools/tree/main/lib)。

> `You should include the wasm bundle`

这可能不是必需的，但我想确保编译后的 WASM 文件（结果是 [233KB](https://github.com/simonw/tools/blob/main/lib/gifsicle/gifsicle.wasm)）被提交到仓库。我通过 GitHub Pages 在 [tools.simonwillison.net](https://tools.simonwillison.net/) 提供 `simonw/tools` 服务，我希望它无需本地构建就能工作。

> `Make sure the HTML page credits gifsicle and links to the repo`

这只是礼貌而已！我经常围绕其他人的开源项目构建 WebAssembly 包装器，我喜欢确保他们在最终页面中得到感谢。

Claude 在工具的页脚添加了：

> Built with [gifsicle](https://github.com/kohler/gifsicle) by Eddie Kohler, compiled to WebAssembly. gifsicle is released under the GNU General Public License, version 2.

---

**原文链接**: [https://simonwillison.net/guides/agentic-engineering-patterns/gif-optimization/](https://simonwillison.net/guides/agentic-engineering-patterns/gif-optimization/)
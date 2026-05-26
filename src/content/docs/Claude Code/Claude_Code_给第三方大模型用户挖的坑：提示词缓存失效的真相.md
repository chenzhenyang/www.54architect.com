---
title: Claude Code 给第三方大模型用户挖的坑：提示词缓存失效的真相
description: 深入分析 Claude Code 使用第三方 API 时提示词缓存疯狂失效的根本原因——Anthropic 在每个请求中偷偷注入的 X-Anthropic-Billing-Header，以及如何一键修复。
tags:
  - Claude Code
  - 提示词缓存
  - 第三方 API
  - Anthropic
  - 性能优化
categories:
  - Claude Code
  - AI
origin_title: 如何修复Claude Code给第三方大模型用户挖的坑
author: "张司机在路上"
lastUpdated: 2026-05-26
---



---

## 问题背景

如果你用 Claude Code 配置的是第三方 API（比如通过中转服务调用 Anthropic 的接口），然后在使用过程中发现：

- **推理速度明显变慢**
- **Token 消耗量暴涨**

那么很可能不是大模型 API 本身的问题，而是 **Claude Code 在你的每个请求里偷偷塞了 5 个随机字符**，导致提示词缓存（Prompt Cache）疯狂失效。

如果你用的第三方 API 没有特殊处理这些字符，缓存命中率就会降到零，每次请求都变成全量计算，Token 消耗和响应时间自然水涨船高。

---

## 抓包证据：看看到底塞了什么

用 `clawtab` 抓包对比连续请求，就能发现端倪。

对比第 1 个和第 2 个请求，可以看到系统提示词的第一个 block 不一样。仔细看，`cc-version` 和 `cc-entrypoint` 是没变的，但 `cch` 后面跟着的 5 位 16 进制字符每次都变了：

- 第 1 轮：`97bd6`
- 第 2 轮：`24c2d`
- 第 3 轮：`ead88`

这一行就叫 **X-Anthropic-Billing-Header**（简称 cch）。

**关键细节**：它不是 HTTP Header，而是作为上下文的一部分，被当作系统提示词最开头的部分发过去的。

---

## 为什么 cch 会导致缓存全部失效

### 提示词缓存的工作原理

Prompt Cache 是前缀缓存。服务端按照 `tools` → `system` → `messages` 的顺序拼接前缀，具体写几个缓存 Key，取决于请求里的 `cache_control` 字段。你在哪个 Block 上打这个标记，服务端就把从开头一直到这个 Block 结尾算一个 Breakpoint，并写入一个缓存，Key 为开头到这个 Breakpoint 的所有上下文的哈希值。

所以每次请求，实际上是打了 **3 个 Breakpoint**：
1. 第一个在 System 的第 2 个 Block 末尾
2. 第二个在 System 的第 3 个 Block 末尾
3. 第三个挂在 User Message 上

但 **cch 带在 System 的第 1 个 Block，排在所有 Breakpoint 的前面**。

所以它一变，三个 Breakpoint 算出来的哈希就全部跟着变了。这里一个字符不一样，后面三个全部 miss。

抓取在 session 里面：
- 第 1 个请求，刚把前缀缓存写入服务端
- 第 2 个、第 3 个请求的 cch 一换，整个前缀哈希就对不上了

### 为什么 Anthropic 自己的服务不受影响

个人猜测：Anthropic 的服务端会识别这段请求是自己塞进去的，所以算缓存 Key 的时候会跳过这一段。

但是第三方大模型转发服务不知道这个细节，看到了还以为就是普通的系统提示词，所以每次都拿整个 Session 的 Prompt 算哈希，结果就导致缓存全部 miss。

这个问题从今年 2 月份开始就有大量 Claude Code 用户在报，GitHub 上能找到不少 issue 都在报告 cch 导致的 Cache Miss 问题。

---

## 源码分析：cch 到底是怎么生成的

直接看 Claude Code 的源码。搜索 `src/constants/system.ts` 文件，打开后搜索 `get-attribution-headers` 这个函数。

仔细的朋友一下子看到了，这一行就是构造这个 billing headers 的地方。主要逻辑：

**第一步**：检查 `is-no-attribution-headers-enabled` 函数，如果返回 `false` 就直接返回空。

**第二步**：继续往下看 cch 的逻辑，一行代码检查一个 Feature 开关，返回 `true` 那么 cch 就等于 5 个 0。

这里比较奇怪的地方是：没有 cch 这个值是怎么计算的？每次只是一个静态的字符串 `00000`。

**真正的计算逻辑在上面**——注释大方地承认了真相：真正的 cch 是 **Native HTTP 栈**计算的。

在请求发出的最后一刻，会覆盖这个 cch 等于 `00000` 为真正的 cch 值。

### 为什么用 Native 层

这个 HTTP Native 栈不是 Node.js 自带的，Anthropic 用的是 **Bun**——Node 的替代品，底层用 Zig 系统语言编写，比 Node 快很多。

整个项目编译成一个不依赖 Node 的单体可执行程序，Claude Code 就是这么打包出来的：你下载一个二进制文件直接跑，根本不需要装 Node.js。

Anthropic 不止用 Bun，而且 fork 了一份自己的版本叫做 `bun-anthropic`，然后在它的 Native HTTP 代码里加了一个文件，叫 `attestation.zig`。它专门就干一件事：在请求发出之前，把 JS 生成的 cch = `00000` 替换成真正的 cch 值。

用 Zig 写是因为这个 Content-Length 是不用变的，所以 Buffer 也不用重新分配。Zig 层在 JS 引擎的内存空间之外跑，JS 层拦截 fetch 或者 Monkey Patch HTTP 都摸不到。所以外面看 cch 就像凭空出现一样，每次都不一样。

### Anthropic 为什么要搞这么复杂

一句话就是：**防盗刷**。

Claude Code 登录走的是 OAuth，拿到的是 Token，绑定你的 Pro 或者 Max 订阅，走的是订阅价，比直接 API 按 Token 计费要便宜得多。

所以有人就会想把这个 Token 从二进制里抠出来，自己写代码调用 API，等于拿订阅价跑任意请求。

所以服务端得能识别这个请求到底是不是真的 Claude Code 发的。不是的话，哪怕 Token 是对的，也直接拒绝。

这里服务器靠的就是 cch——它是由 Zig 的 Native HTTP 层计算的，所以 JS 层只有 cch = `00000` 占位。服务冒充的程序根本拿不到真正的值，一发请求就露馅了。

不过这套防御机制也不是铁板一块。GitHub 已经有开源项目（比如 `sup-claude-api`），把整套 cch 算法已经全部复刻了一遍。也就是说 Anthropic 藏在 Zig 层的这个逻辑，在开源社区早就已经透明了。

---

## 解决方案：一键关闭 cch

回到代码里 `is-no-attribution-headers-enabled` 函数，跟进去看到第一句就是检查 `CLAUDE_CODE_ATTRIBUTION_HEADER` 的环境变量，如果是 `0` 就直接返回空串。

**解决方案就一句话：**

在 `claude_settings.json` 文件的 `env` 里面，把 `CLAUDE_CODE_ATTRIBUTION_HEADER` 环境变量设成 `0`。

```json
{
  "env": {
    "CLAUDE_CODE_ATTRIBUTION_HEADER": "0"
  }
}
```

加完之后重启 Claude Code，再抓一次包验证：

- Cache Breakpoint 从之前的三个变成了两个
- 之前的 billing header 这一行字符串完全消失了
- 第一行就是 Claude Code 的身份提示开始了，没有额外的 cch 前缀

---

## 总结

如果你用 Claude Code 配置的是第三方 API，然后发现：
- 推理变慢
- Token 暴涨

可以尝试以下步骤：

1. **用 clawtab 抓一次包**，看看是不是有 cch 的请求头
2. **如果有**，那么它就可能是你缓存失效的原因
3. **设置 `CLAUDE_CODE_ATTRIBUTION_HEADER=0`** 来解决这个问题

这个环境变量关闭后，billing header 就不再注入，第三方 API 的缓存就能正常工作了。

---

## 补充说明

- **适用场景**：仅适用于使用第三方 API 中转服务的 Claude Code 用户
- **不影响官方 API**：如果你直接调用 Anthropic 官方 API，cch 不影响缓存，无需设置此环境变量
- **开源项目参考**：`sup-claude-api`（GitHub）

*如果你也遇到了类似问题，欢迎在评论区交流讨论。*

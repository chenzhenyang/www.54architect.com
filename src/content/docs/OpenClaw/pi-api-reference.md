---
title: "@mariozechner Pi 系列库 API 参考"
description: "介绍 @mariozechner 三个核心库（pi-ai、pi-agent-core、pi-coding-agent）的依赖关系和典型 API 使用方法。"
tags:
  - OpenClaw
  - API
  - SDK
  - pi-ai
  - pi-coding-agent
  - pi-agent-core
categories:
  - OpenClaw
lastUpdated: 2026-04-19
---

# @mariozechner Pi 系列库 API 参考

本文档介绍 `@mariozechner` 三个核心库的依赖关系和典型 API 使用方法，从底层到高层排列。

---

## 依赖关系图

```
┌─────────────────────────────────────────────────────────┐
│  pi-coding-agent (高层)                                  │
│  • createAgentSession() - 创建完整会话                   │
│  • SessionManager - 会话文件管理                         │
│  • 内置工具、扩展、技能                                 │
└─────────────────────────────────────────────────────────┘
                          ↓ 依赖
┌─────────────────────────────────────────────────────────┐
│  pi-agent-core (中层)                                    │
│  • AgentMessage, AgentTool - 类型定义                   │
│  • StreamFn - 流式函数类型                              │
└─────────────────────────────────────────────────────────┘
                          ↓ 依赖
┌─────────────────────────────────────────────────────────┐
│  pi-ai (底层)                                            │
│  • completeSimple() - 简单完成 API                       │
│  • streamSimple() - 流式 API                            │
│  • Model, AssistantMessage - 基础类型                   │
└─────────────────────────────────────────────────────────┘
```

### 详细依赖关系

| 包 | 位置 | 内部依赖 |
|----|------|----------|
| `@mariozechner/pi-ai` | `packages/ai` | 无 |
| `@mariozechner/pi-agent-core` | `packages/agent` | `pi-ai` |
| `@mariozechner/pi-coding-agent` | `packages/coding-agent` | `pi-ai`, `pi-agent-core`, `pi-tui` |

**上游仓库**: https://github.com/badlogic/pi-mono

---

## 1. `@mariozechner/pi-ai` (底层 - LLM 通信)

### 核心功能

- 提供与各大 LLM 提供商的直接通信
- 定义消息类型和模型抽象
- 流式和非流式 API

### 典型 API

#### 1.1 `completeSimple()` - 简单完成 API

```typescript
import { completeSimple, type Model } from "@mariozechner/pi-ai";

// 1. 定义模型配置
const model: Model = {
  id: "claude-sonnet-4-20250514",
  provider: "anthropic",
  api: "anthropic",
  maxTokens: 8192,
};

// 2. 调用完成 API
const result = await completeSimple(
  model,
  {
    messages: [
      {
        role: "user",
        content: "Hello, how are you?",
        timestamp: Date.now(),
      },
    ],
  },
  {
    apiKey: "sk-...",
    maxTokens: 1000,
    temperature: 0.7,
  }
);

// 3. 处理结果
console.log(result.content); 
// [{ type: "text", text: "I'm doing well..." }]
console.log(result.usage); 
// { input: 10, output: 20, ... }
```

#### 1.2 `streamSimple()` - 流式 API

```typescript
import { streamSimple, type Model } from "@mariozechner/pi-ai";

const model: Model = {
  id: "gpt-4o",
  provider: "openai",
  api: "openai",
};

const stream = streamSimple(
  model,
  {
    messages: [
      { role: "user", content: "Count from 1 to 5", timestamp: Date.now() },
    ],
  },
  {
    apiKey: "sk-...",
    onPayload: (payload) => {
      // 处理流式 payload
      console.log("Received payload:", payload);
    },
  }
);

// 消费流
for await (const chunk of stream) {
  console.log("Chunk:", chunk);
}
```

#### 1.3 `getModel()` - 获取模型实例

```typescript
import { getModel } from "@mariozechner/pi-ai";

const model = getModel("anthropic", "claude-sonnet-4-20250514");
```

#### 1.4 类型定义

```typescript
import type {
  AssistantMessage,
  UserMessage,
  ToolResultMessage,
  ImageContent,
  TextContent,
  Usage,
  Api,
  Model,
} from "@mariozechner/pi-ai";

// 用户消息
const userMsg: UserMessage = {
  role: "user",
  content: "Hello",
  timestamp: Date.now(),
};

// 助手消息
const assistantMsg: AssistantMessage = {
  role: "assistant",
  content: [{ type: "text", text: "Hi!" }],
  timestamp: Date.now(),
};

// 图像内容
const imageContent: ImageContent = {
  type: "image",
  url: "https://example.com/image.jpg",
};

// 使用量
const usage: Usage = {
  input: 100,
  output: 200,
  cacheRead: 50,
  cacheWrite: 25,
};
```

#### 1.5 OAuth 认证类型

```typescript
import type { OAuthCredentials, OAuthProvider } from "@mariozechner/pi-ai";

const credentials: OAuthCredentials = {
  accessToken: "...",
  refreshToken: "...",
  expiresAt: Date.now() + 3600000,
};
```

---

## 2. `@mariozechner/pi-agent-core` (中层 - Agent 核心)

### 核心功能

- Agent 循环和工具执行
- 定义 Agent 消息和工具类型
- 流式函数类型

### 典型 API

#### 2.1 类型定义

```typescript
import type {
  AgentMessage,
  AgentTool,
  AgentToolResult,
  StreamFn,
} from "@mariozechner/pi-agent-core";

// Agent 消息 (统一类型)
const msg: AgentMessage = {
  role: "user",
  content: "Hello",
  timestamp: Date.now(),
};

// 工具定义
const tool: AgentTool = {
  name: "read_file",
  description: "Read a file",
  inputSchema: {
    type: "object",
    properties: {
      path: { type: "string" },
    },
    required: ["path"],
  },
};

// 工具结果
const result: AgentToolResult = {
  toolName: "read_file",
  toolCallId: "call_123",
  content: [{ type: "text", text: "File content..." }],
};

// 流式函数类型
const streamFn: StreamFn = (model, context, options) => {
  // 返回异步可迭代对象
  return streamSimple(model, context, options);
};
```

#### 2.2 自定义 streamFn

```typescript
import type { StreamFn, AgentMessage } from "@mariozechner/pi-agent-core";
import { streamSimple } from "@mariozechner/pi-ai";

// 包装 streamFn 添加日志
const wrappedStreamFn: StreamFn = (model, context, options) => {
  console.log("Calling model:", model.id);
  
  const messages = (context as { messages?: AgentMessage[] }).messages ?? [];
  console.log("Message count:", messages.length);
  
  return streamSimple(model, context, {
    ...options,
    onPayload: (payload) => {
      console.log("Payload:", payload);
      options?.onPayload?.(payload);
    },
  });
};
```

---

## 3. `@mariozechner/pi-coding-agent` (高层 - 完整 SDK)

### 核心功能

- 完整的 Agent 会话管理
- 会话持久化和分支
- 内置工具集
- 扩展系统
- 技能管理

### 典型 API

#### 3.1 `createAgentSession()` - 创建 Agent 会话

```typescript
import {
  createAgentSession,
  SessionManager,
  AuthStorage,
  ModelRegistry,
  SettingsManager,
  DefaultResourceLoader,
} from "@mariozechner/pi-coding-agent";

// 1. 准备依赖
const authStorage: AuthStorage = {
  getApiKey: async (provider) => "sk-...",
  setApiKey: async (provider, key) => {},
};

const modelRegistry = new ModelRegistry({
  models: [
    { id: "claude-sonnet-4-20250514", provider: "anthropic" },
  ],
});

const sessionManager = SessionManager.create("/path/to/sessions");
const settingsManager = new SettingsManager();
const resourceLoader = new DefaultResourceLoader();

// 2. 创建会话
const { session } = await createAgentSession({
  cwd: "/workspace",
  agentDir: "/agent",
  authStorage,
  modelRegistry,
  model: {
    id: "claude-sonnet-4-20250514",
    provider: "anthropic",
    api: "anthropic",
    maxTokens: 8192,
  },
  thinkingLevel: "high",
  tools: ["read", "write", "edit", "bash"],
  customTools: [
    {
      name: "custom_tool",
      description: "My custom tool",
      inputSchema: { type: "object", properties: {} },
    },
  ],
  sessionManager,
  settingsManager,
  resourceLoader,
});

// 3. 使用会话
console.log("Session ID:", session.sessionId);
console.log("Session File:", session.sessionFile);
console.log("Messages:", session.messages);
```

#### 3.2 `session.prompt()` - 发送提示

```typescript
// 简单提示
await session.prompt("What is the capital of France?");

// 带图像的提示
await session.prompt("What's in this image?", {
  images: [
    { url: "https://example.com/image.jpg" },
  ],
});
```

#### 3.3 `session.agent` - 访问底层 Agent

```typescript
// 设置自定义 streamFn
session.agent.streamFn = customStreamFn;

// 替换消息
session.agent.replaceMessages(newMessages);

// 设置系统提示
session.agent.setSystemPrompt("You are a helpful assistant.");
```

#### 3.4 `SessionManager` - 会话管理

```typescript
import { SessionManager } from "@mariozechner/pi-coding-agent";

// 创建新会话管理器
const manager = SessionManager.create("/path/to/sessions");

// 打开现有会话
const manager = SessionManager.open("/path/to/session.jsonl");

// 获取会话信息
const sessionId = manager.getSessionId();
const sessionFile = manager.getSessionFile();
const sessionDir = manager.getSessionDir();

// 获取叶子节点
const leafEntry = manager.getLeafEntry();
const leafId = manager.getLeafId();

// 创建分支会话
const branchedFile = manager.createBranchedSession(leafId);

// 构建会话上下文
const context = manager.buildSessionContext();
// { messages: [...], system: "..." }

// 重置叶子节点
manager.resetLeaf();

// 分支到父节点
manager.branch(parentEntryId);
```

#### 3.5 内置工具

```typescript
import { codingTools, createReadTool, createWriteTool, createEditTool } from "@mariozechner/pi-coding-agent";

// 使用内置工具集
const tools = codingTools;

// 或单独创建
const readTool = createReadTool({ /* options */ });
const writeTool = createWriteTool({ /* options */ });
const editTool = createEditTool({ /* options */ });
```

#### 3.6 扩展系统

```typescript
import type {
  ExtensionAPI,
  ExtensionContext,
  ExtensionFactory,
  ContextEvent,
} from "@mariozechner/pi-coding-agent";

// 创建扩展
const myExtension: ExtensionFactory = (api) => {
  return {
    name: "my-extension",
    onContextEvent: (event: ContextEvent, context: ExtensionContext) => {
      if (event.type === "before_prompt") {
        // 在提示前修改上下文
        context.messages.push({
          role: "system",
          content: "Custom system message",
        });
      }
    },
  };
};

// 在 createAgentSession 中使用
const { session } = await createAgentSession({
  // ...
  extensions: [myExtension],
});
```

#### 3.7 令牌估算和摘要

```typescript
import { estimateTokens, generateSummary } from "@mariozechner/pi-coding-agent";

// 估算令牌数
const count = estimateTokens("Hello, world!");
console.log("Token count:", count);

// 生成摘要
const summary = await generateSummary(longText, {
  maxLength: 500,
  model: modelConfig,
});
```

#### 3.8 技能管理

```typescript
import type { Skill } from "@mariozechner/pi-coding-agent";
import { loadSkillsFromDir } from "@mariozechner/pi-coding-agent";

// 从目录加载技能
const skills = await loadSkillsFromDir("/path/to/skills");

// 技能类型
const skill: Skill = {
  name: "my-skill",
  description: "My custom skill",
  tools: [...],
  prompts: [...],
};
```

#### 3.9 认证存储

```typescript
import type { AuthStorage } from "@mariozechner/pi-coding-agent";

const authStorage: AuthStorage = {
  getApiKey: async (provider) => {
    // 从安全存储获取 API 密钥
    return await secureStorage.get(`api_key_${provider}`);
  },
  setApiKey: async (provider, key) => {
    await secureStorage.set(`api_key_${provider}`, key);
  },
  getOAuthCredentials: async (provider) => {
    // 获取 OAuth 凭证
    return await secureStorage.get(`oauth_${provider}`);
  },
  setOAuthCredentials: async (provider, creds) => {
    await secureStorage.set(`oauth_${provider}`, creds);
  },
};
```

---

## 完整使用示例

```typescript
import { completeSimple } from "@mariozechner/pi-ai";
import type { AgentMessage } from "@mariozechner/pi-agent-core";
import {
  createAgentSession,
  SessionManager,
  ModelRegistry,
} from "@mariozechner/pi-coding-agent";

async function main() {
  // 1. 使用 pi-ai 直接调用模型
  const directResult = await completeSimple(
    { id: "gpt-4o", provider: "openai", api: "openai" },
    { messages: [{ role: "user", content: "Hello!", timestamp: Date.now() }] },
    { apiKey: "sk-...", maxTokens: 100 }
  );
  console.log("Direct:", directResult.content);

  // 2. 使用 pi-coding-agent 创建完整会话
  const modelRegistry = new ModelRegistry({
    models: [{ id: "claude-sonnet-4-20250514", provider: "anthropic" }],
  });
  
  const sessionManager = SessionManager.create("./sessions");
  
  const { session } = await createAgentSession({
    cwd: process.cwd(),
    agentDir: "./agent",
    authStorage: {
      getApiKey: async () => "sk-...",
      setApiKey: async () => {},
    },
    modelRegistry,
    model: { id: "claude-sonnet-4-20250514", provider: "anthropic", api: "anthropic" },
    thinkingLevel: "medium",
    tools: ["read", "write", "bash"],
    sessionManager,
  });

  // 3. 发送提示
  await session.prompt("List files in current directory");

  // 4. 查看会话历史
  console.log("Messages:", session.messages.length);
  console.log("Session ID:", session.sessionId);
}

main();
```

---

## 版本信息

| 包 | OpenClaw 使用版本 | npm 最新版本 |
|----|------------------|--------------|
| `@mariozechner/pi-ai` | 0.55.3 | ^0.57.1 |
| `@mariozechner/pi-agent-core` | 0.55.3 | ^0.57.1 |
| `@mariozechner/pi-coding-agent` | 0.55.3 | ^0.57.1 |
| `@mariozechner/pi-tui` | 0.55.3 | ^0.57.1 |

所有包版本号同步，来自同一 monorepo 统一发布。

---

## 相关资源

- **GitHub**: https://github.com/badlogic/pi-mono
- **npm**: https://www.npmjs.com/org/mariozechner
- **OpenClaw 文档**: `docs/pi.md`

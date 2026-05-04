---
title: 'OMC'
lastUpdated: 2026-05-04
tags:
  - OMC
  - 模型配置
categories:
  - o
  - m
  - c
---

# OMC 模型配置完整指南

> oh-my-claudecode 模型路由与配置权威文档

**版本**: v4.9.3  
**更新时间**: 2025-03-30

---

## 目录

1. [概述](#一概述)
2. [模型配置优先级](#二模型配置优先级)
3. [Agent 定义与 markdown 文件](#三 agent 定义与 markdown 文件)
4. [配置方式详解](#四配置方式详解)
5. [routing.agentOverrides 配置](#五 routingagentoverrides 配置)
6. [运行时配置](#六运行时配置)
7. [环境变量配置](#七环境变量配置)
8. [配置验证](#八配置验证)
9. [常见问题](#九常见问题)

---

## 一、概述

### 1.1 模型配置的核心问题

在 OMC 中，每个 Agent（如 architect、executor、explore 等）都需要配置使用的 Claude 模型。配置来源有多个，优先级各不相同。

### 1.2 核心结论

> **模型配置优先级（从高到低）**:
> 
> 1. `getAgentDefinitions({ overrides })` - 运行时动态覆盖
> 2. `agents.<name>.model` - config.jsonc 静态配置
> 3. `routing.agentOverrides` - 动态路由配置
> 4. Agent 源码默认值 - TypeScript 源码定义

### 1.3 配置来源对比

| 优先级 | 配置来源 | 配置位置 | 设置内容 | 生效时机 |
|--------|---------|---------|---------|---------|
| **1 (最高)** | `options.overrides` | 代码运行时参数 | `model` | 单次调用 |
| **2** | `agents.<name>.model` | `config.jsonc` | `model` | 全局持久 |
| **3** | `routing.agentOverrides` | `config.jsonc` | `tier` | 动态路由时 |
| **4 (最低)** | Agent 源码 | `src/agents/*.ts` | `model` | 默认值 |

---

## 二、模型配置优先级

### 2.1 完整优先级链

```
┌─────────────────────────────────────────────────────────────┐
│ 优先级 1 (最高): getAgentDefinitions({ overrides })          │
│ └─→ 直接设置 agent.model，绕过路由逻辑                       │
│ └─→ 示例：overrides: { architect: { model: 'claude-opus-4-6' } } │
├─────────────────────────────────────────────────────────────┤
│ 优先级 2: agents.<name>.model (config.jsonc)                │
│ └─→ 静态配置，直接设置 model                                 │
│ └─→ 示例：agents: { architect: { model: 'claude-opus-4-6' } }   │
├─────────────────────────────────────────────────────────────┤
│ 优先级 3: routing.agentOverrides (config.jsonc)             │
│ └─→ 动态路由时设置 tier，由 tierModels 映射到 model           │
│ └─→ 示例：routing: { agentOverrides: { architect: { tier: 'HIGH' } } } │
├─────────────────────────────────────────────────────────────┤
│ 优先级 4 (最低): Agent 默认 defaultModel                     │
│ └─→ 源码内置默认值                                           │
│ └─→ 示例：src/agents/architect.ts: model: 'opus'            │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 配置冲突示例

```jsonc
// ~/.config/claude-omc/config.jsonc
{
  "agents": {
    "architect": { 
      "model": "claude-opus-4-6"  // ← 优先级 2，这个生效
    }
  },
  "routing": {
    "enabled": true,
    "agentOverrides": {
      "architect": { 
        "tier": "LOW"  // ← 优先级 3，被忽略
      }
    }
  }
}
```

**结果**: `architect` 使用 `claude-opus-4-6`（优先级 2 生效）

### 2.3 源码中的优先级实现

**文件**: `src/agents/definitions.ts`

```typescript
export function getAgentDefinitions(options?: {
  overrides?: Partial<Record<string, Partial<AgentConfig>>>;
  config?: PluginConfig;
}): Record<string, {...}> {
  const agents: Record<string, AgentConfig> = {
    explore: exploreAgent,
    architect: architectAgent,
    executor: executorAgent,
    // ...
  };

  const resolvedConfig = options?.config ?? loadConfig();
  const result = {};

  for (const [name, agentConfig] of Object.entries(agents)) {
    const override = options?.overrides?.[name];
    
    // ⭐ 关键：从 config 中获取配置的 model
    const configuredModel = getConfiguredAgentModel(name, resolvedConfig);
    
    // ⭐ 优先级逻辑：overrides > config.agents.model > agentConfig.model
    const resolvedModel = override?.model ?? configuredModel ?? agentConfig.model;
    
    result[name] = {
      description: override?.description ?? agentConfig.description,
      prompt: override?.prompt ?? agentConfig.prompt,
      model: resolvedModel,      // ← 最终使用的 model
      defaultModel: agentConfig.defaultModel,
    };
  }

  return result;
}
```

---

## 三、Agent 定义与 markdown 文件

### 3.1 Agent 文件结构

```
src/agents/
├── architect.ts          # TypeScript 定义
├── executor.ts           # TypeScript 定义
├── explore.ts            # TypeScript 定义
└── ...

agents/
├── architect.md          # Prompt 内容
├── executor.md           # Prompt 内容
├── explore.md            # Prompt 内容
└── ...
```

### 3.2 markdown 文件格式

**文件**: `agents/architect.md`

```markdown
---
name: architect
description: Strategic Architecture & Debugging Advisor (Opus, READ-ONLY)
model: claude-opus-4-6    # ← frontmatter 中的 model（通常不使用）
level: 3
disallowedTools: Write, Edit
---

<Agent_Prompt>
  <Role>
    You are Architect. Your mission is to analyze code...
  </Role>
  
  <Constraints>
    You are READ-ONLY. Write and Edit tools are blocked...
  </Constraints>
  
  <!-- 更多 prompt 内容 -->
</Agent_Prompt>
```

### 3.3 TypeScript Agent 定义

**文件**: `src/agents/architect.ts`

```typescript
import { loadAgentPrompt } from './utils.js';

export const architectAgent: AgentConfig = {
  name: 'architect',
  description: 'Read-only consultation agent. High-IQ reasoning specialist...',
  prompt: loadAgentPrompt('architect'),  // ← 从 agents/architect.md 加载
  model: 'opus',                         // ← 源码中定义的默认 model
  defaultModel: 'opus',
  metadata: ARCHITECT_PROMPT_METADATA
};
```

### 3.4 prompt 加载流程

**文件**: `src/agents/utils.ts`

```typescript
export function loadAgentPrompt(agentName: string): string {
  // 1. 优先使用构建时嵌入的 prompts (CJS bundles)
  try {
    if (typeof __AGENT_PROMPTS__ !== 'undefined') {
      const prompt = __AGENT_PROMPTS__[agentName];
      if (prompt) return prompt;
    }
  } catch {
    // __AGENT_PROMPTS__ not defined — fall through
  }

  // 2. 运行时从文件系统读取 (dev/test 环境)
  const agentsDir = join(getPackageDir(), 'agents');
  const agentPath = join(agentsDir, `${agentName}.md`);
  const content = readFileSync(agentPath, 'utf-8');
  
  // 3. 移除 YAML frontmatter，返回 prompt 内容
  return stripFrontmatter(content);
}
```

### 3.5 关键要点

| 内容来源 | 文件位置 | 用途 |
|---------|---------|------|
| **Prompt 内容** | `agents/{name}.md` | Agent 的系统提示词 |
| **默认 model** | `src/agents/{name}.ts` | 源码中定义的 `model: 'opus'` 等 |
| **frontmatter model** | `agents/{name}.md` | 通常不使用，仅供参考 |

---

## 四、配置方式详解

### 4.1 config.jsonc 静态配置

**文件**: `~/.config/claude-omc/config.jsonc`

```jsonc
{
  "agents": {
    // 核心 Agent
    "architect": { "model": "claude-opus-4-6" },
    "planner": { "model": "claude-opus-4-6" },
    "critic": { "model": "claude-opus-4-6" },
    "analyst": { "model": "claude-opus-4-6" },
    
    // 执行 Agent
    "executor": { "model": "claude-sonnet-4-6" },
    "debugger": { "model": "claude-sonnet-4-6" },
    "verifier": { "model": "claude-sonnet-4-6" },
    
    // 轻量 Agent
    "explore": { "model": "claude-haiku-4-5" },
    "writer": { "model": "claude-haiku-4-5" }
  },
  "routing": {
    "enabled": false  // 禁用动态路由
  }
}
```

**特点**:
- ✅ 全局生效，持久化配置
- ✅ 优先级 2，高于 routing
- ✅ 配置简单直接
- ❌ 需要修改文件

### 4.2 项目级配置

**文件**: `.claude/omc.jsonc` (项目根目录)

```jsonc
{
  "agents": {
    // 项目特定的 Agent 配置
    "architect": { 
      "model": "claude-opus-4-6",
      "description": "项目特定架构师配置"
    }
  }
}
```

**优先级**: 项目配置 > 用户配置

---

## 五、routing.agentOverrides 配置

### 5.1 配置示例

```jsonc
// ~/.config/claude-omc/config.jsonc
{
  "routing": {
    "enabled": true,
    "defaultTier": "MEDIUM",
    "agentOverrides": {
      // 高复杂度 Agent
      "architect": {
        "tier": "HIGH",
        "reason": "架构决策需要深度推理"
      },
      "planner": {
        "tier": "HIGH",
        "reason": "战略规划需要深度推理"
      },
      "critic": {
        "tier": "HIGH",
        "reason": "批判性审查需要深度推理"
      },
      "analyst": {
        "tier": "HIGH",
        "reason": "需求分析需要深度推理"
      },
      
      // 标准复杂度 Agent
      "executor": {
        "tier": "MEDIUM",
        "reason": "标准实现任务"
      },
      "debugger": {
        "tier": "MEDIUM",
        "reason": "调试分析"
      },
      
      // 低复杂度 Agent
      "explore": {
        "tier": "LOW",
        "reason": "探索任务通常简单"
      },
      "writer": {
        "tier": "LOW",
        "reason": "文档生成任务简单"
      }
    },
    "tierModels": {
      "LOW": "claude-haiku-4-5",
      "MEDIUM": "claude-sonnet-4-6",
      "HIGH": "claude-opus-4-6"
    },
    "escalationKeywords": [
      "critical", "security", "production", 
      "urgent", "breaking", "architecture"
    ]
  }
}
```

### 5.2 工作原理

**文件**: `src/features/model-routing/router.ts`

```typescript
export function routeTask(
  context: RoutingContext,
  config: Partial<RoutingConfig> = {}
): RoutingDecision {
  const mergedConfig = { ...DEFAULT_ROUTING_CONFIG, ...config };

  // 1. forceInherit 检查
  if (mergedConfig.forceInherit) {
    return { model: 'inherit', ... };
  }

  // 2. routing enabled 检查
  if (!mergedConfig.enabled) {
    return createDecision(mergedConfig.defaultTier, ...);
  }

  // 3. explicit model 检查
  if (context.explicitModel) {
    return createDecision(...);
  }

  // 4. ⭐ agentOverrides 检查
  if (context.agentType && mergedConfig.agentOverrides?.[context.agentType]) {
    const override = mergedConfig.agentOverrides[context.agentType];
    return createDecision(
      override.tier,           // 使用配置的 tier
      mergedConfig.tierModels, 
      [override.reason], 
      false, 
      override.tier
    );
  }

  // 5. 正常路由逻辑（关键词、复杂度评分）
  // ...
}
```

### 5.3 特点

| 特点 | 说明 |
|------|------|
| **设置内容** | `tier` (LOW/MEDIUM/HIGH)，不是具体 model |
| **生效时机** | 仅在动态路由时（`routing.enabled: true`） |
| **实际 model** | 由 `tierModels` 映射决定 |
| **优先级** | 3（低于 `agents.<name>.model`） |

---

## 六、运行时配置

### 6.1 通过 createOmcSession 配置

```typescript
import { createOmcSession } from 'oh-my-claudecode';

// 方式 1: 通过 config 参数
const session = createOmcSession({
  config: {
    agents: {
      architect: { model: 'claude-opus-4-6' },
      executor: { model: 'claude-sonnet-4-6' }
    }
  }
});

// 方式 2: 通过 routing 配置
const session = createOmcSession({
  config: {
    routing: {
      enabled: true,
      agentOverrides: {
        architect: { tier: 'HIGH', reason: '临时需要高质量' },
        executor: { tier: 'MEDIUM', reason: '标准任务' }
      }
    }
  }
});
```

### 6.2 直接使用 getAgentDefinitions

```typescript
import { getAgentDefinitions, loadConfig } from 'oh-my-claudecode';

// 运行时动态覆盖（优先级最高）
const agents = getAgentDefinitions({
  config: loadConfig(),
  overrides: {
    architect: { 
      model: 'claude-opus-4-6',
      prompt_append: '特别关注安全性。'
    },
    executor: { 
      model: 'claude-sonnet-4-6'
    }
  }
});
```

### 6.3 可覆盖的字段

```typescript
interface AgentOverrideConfig {
  /** 覆盖模型 */
  model?: string;
  /** 启用/禁用 Agent */
  enabled?: boolean;
  /** 追加到 prompt 末尾 */
  prompt_append?: string;
  /** 覆盖温度设置 */
  temperature?: number;
}
```

---

## 七、环境变量配置

### 7.1 模型层级环境变量

```bash
# 设置各 tier 的默认模型
export OMC_MODEL_LOW=claude-haiku-4-5
export OMC_MODEL_MEDIUM=claude-sonnet-4-6
export OMC_MODEL_HIGH=claude-opus-4-6

# Bedrock 特定模型
export CLAUDE_CODE_BEDROCK_HAIKU_MODEL=us.anthropic.claude-haiku-4-5-v1:0
export CLAUDE_CODE_BEDROCK_SONNET_MODEL=us.anthropic.claude-sonnet-4-6-v1:0
export CLAUDE_CODE_BEDROCK_OPUS_MODEL=us.anthropic.claude-opus-4-6-v1:0

# Anthropic 默认模型
export ANTHROPIC_DEFAULT_HAIKU_MODEL=claude-haiku-4-5
export ANTHROPIC_DEFAULT_SONNET_MODEL=claude-sonnet-4-6
export ANTHROPIC_DEFAULT_OPUS_MODEL=claude-opus-4-6
```

### 7.2 路由配置环境变量

```bash
# 启用/禁用路由
export OMC_ROUTING_ENABLED=true

# 强制继承父模型（绕过路由）
export OMC_ROUTING_FORCE_INHERIT=true

# 默认 tier
export OMC_ROUTING_DEFAULT_TIER=MEDIUM

# 模型别名
export OMC_MODEL_ALIAS_HAIKU=inherit
export OMC_MODEL_ALIAS_SONNET=sonnet
export OMC_MODEL_ALIAS_OPUS=opus
```

### 7.3 特殊环境检测

```bash
# AWS Bedrock
export CLAUDE_CODE_USE_BEDROCK=1

# Google Vertex AI
export CLAUDE_CODE_USE_VERTEX=1

# 自定义 API 端点
export ANTHROPIC_BASE_URL=https://your-proxy.com
```

---

## 八、配置验证

### 8.1 验证配置是否生效

```typescript
import { getAgentDefinitions, loadConfig } from 'oh-my-claudecode';

const config = loadConfig();
const agents = getAgentDefinitions({ config });

// 检查各 Agent 的 model
console.log('architect.model:', agents.architect.model);
console.log('executor.model:', agents.executor.model);
console.log('explore.model:', agents.explore.model);
```

### 8.2 检查 routing 配置

```typescript
import { loadConfig } from 'oh-my-claudecode';

const config = loadConfig();

console.log('routing.enabled:', config.routing?.enabled);
console.log('routing.agentOverrides:', config.routing?.agentOverrides);
console.log('routing.tierModels:', config.routing?.tierModels);
console.log('agents.architect.model:', config.agents?.architect?.model);
```

### 8.3 默认 Agent 模型列表

| Agent | 默认 tier | 默认模型 |
|-------|----------|---------|
| `explore` | LOW | haiku |
| `analyst` | HIGH | opus |
| `planner` | HIGH | opus |
| `architect` | HIGH | opus |
| `debugger` | MEDIUM | sonnet |
| `executor` | MEDIUM | sonnet |
| `verifier` | MEDIUM | sonnet |
| `security-reviewer` | MEDIUM | sonnet |
| `code-reviewer` | HIGH | opus |
| `test-engineer` | MEDIUM | sonnet |
| `designer` | MEDIUM | sonnet |
| `writer` | LOW | haiku |
| `qa-tester` | MEDIUM | sonnet |
| `scientist` | MEDIUM | sonnet |
| `tracer` | MEDIUM | sonnet |
| `git-master` | MEDIUM | sonnet |
| `code-simplifier` | HIGH | opus |
| `critic` | HIGH | opus |
| `document-specialist` | MEDIUM | sonnet |

---

## 九、常见问题

### Q1: `routing.agentOverrides` 和 `agents.<name>.model` 哪个优先级高？

**A**: `agents.<name>.model` 优先级更高。

- `agents.<name>.model`: 直接设置 model，绕过路由逻辑
- `routing.agentOverrides`: 仅在动态路由时设置 tier

### Q2: 为什么我的 `routing.agentOverrides` 不生效？

**A**: 可能原因：
1. `routing.enabled` 未设置为 `true`
2. 同时在 `agents` 中配置了 model（优先级更高）
3. Agent 名称拼写错误
4. `tierModels` 映射配置不正确

### Q3: 如何临时切换某个 Agent 的模型？

**A**: 使用 `getAgentDefinitions({ overrides })`:

```typescript
const agents = getAgentDefinitions({
  overrides: {
    architect: { model: 'claude-opus-4-6' }
  }
});
```

### Q4: `tier` 和 `model` 有什么区别？

**A**:
- `tier`: 层级（LOW/MEDIUM/HIGH），由 `tierModels` 映射到具体 model
- `model`: 具体模型 ID（如 `claude-opus-4-6`）

### Q5: markdown 文件中的 `model` 字段生效吗？

**A**: 通常不生效。markdown frontmatter 中的 `model` 字段仅供参考，实际使用的 model 来自：
1. `options.overrides.model`（优先级 1）
2. `config.agents.<name>.model`（优先级 2）
3. `src/agents/<name>.ts` 中的 `model` 定义（优先级 4）

### Q6: 如何验证当前配置？

**A**: 
```typescript
import { getAgentDefinitions, loadConfig } from 'oh-my-claudecode';

const config = loadConfig();
const agents = getAgentDefinitions({ config });

// 输出所有 Agent 的 model
for (const [name, agent] of Object.entries(agents)) {
  console.log(`${name}: ${agent.model}`);
}
```

### Q7: 项目配置和用户配置冲突怎么办？

**A**: 项目配置（`.claude/omc.jsonc`）优先级高于用户配置（`~/.config/claude-omc/config.jsonc`）。

### Q8: 如何禁用动态路由？

**A**: 
```jsonc
{
  "routing": {
    "enabled": false
  }
}
```

---

## 十、推荐配置模式

### 模式 1: 固定 Agent 模型（推荐大多数用户）

```jsonc
// ~/.config/claude-omc/config.jsonc
{
  "agents": {
    "architect": { "model": "claude-opus-4-6" },
    "planner": { "model": "claude-opus-4-6" },
    "critic": { "model": "claude-opus-4-6" },
    "executor": { "model": "claude-sonnet-4-6" },
    "debugger": { "model": "claude-sonnet-4-6" },
    "explore": { "model": "claude-haiku-4-5" },
    "writer": { "model": "claude-haiku-4-5" }
  },
  "routing": {
    "enabled": false
  }
}
```

### 模式 2: 动态路由（高级用户）

```jsonc
{
  "agents": {
    // 不设置 model，使用默认
  },
  "routing": {
    "enabled": true,
    "defaultTier": "MEDIUM",
    "agentOverrides": {
      "architect": { "tier": "HIGH", "reason": "架构决策" },
      "planner": { "tier": "HIGH", "reason": "战略规划" },
      "critic": { "tier": "HIGH", "reason": "批判性审查" },
      "executor": { "tier": "MEDIUM", "reason": "标准实现" },
      "explore": { "tier": "LOW", "reason": "简单探索" },
      "writer": { "tier": "LOW", "reason": "文档生成" }
    },
    "tierModels": {
      "LOW": "claude-haiku-4-5",
      "MEDIUM": "claude-sonnet-4-6",
      "HIGH": "claude-opus-4-6"
    },
    "escalationKeywords": ["critical", "security", "production"]
  }
}
```

### 模式 3: 混合模式（最灵活）

```jsonc
{
  "agents": {
    // 关键 Agent 固定 model
    "architect": { "model": "claude-opus-4-6" },
    "critic": { "model": "claude-opus-4-6" }
  },
  "routing": {
    "enabled": true,
    "agentOverrides": {
      "executor": { "tier": "MEDIUM" },
      "explore": { "tier": "LOW" }
    }
  }
}
```

---

## 十一、总结

### 优先级总结

```
┌─────────────────────────────────────────────────────────────┐
│  优先级 1 (最高): options.overrides                          │
│  └─→ getAgentDefinitions({ overrides }) 运行时动态覆盖       │
├─────────────────────────────────────────────────────────────┤
│  优先级 2: agents.<name>.model                               │
│  └─→ config.jsonc 静态配置，直接设置 model，绕过路由         │
├─────────────────────────────────────────────────────────────┤
│  优先级 3: routing.agentOverrides.<name>.tier               │
│  └─→ config.jsonc 动态路由配置，设置 tier 而非 model          │
├─────────────────────────────────────────────────────────────┤
│  优先级 4 (最低): Agent 默认 defaultModel                    │
│  └─→ 源码中定义的默认值                                      │
└─────────────────────────────────────────────────────────────┘
```

### 关键要点

1. **markdown 文件提供 prompt 内容**，不是 model 配置的主要来源
2. **`agents.<name>.model` 优先级高于 `routing.agentOverrides`**
3. **`routing.agentOverrides` 设置的是 tier，不是具体 model**
4. **运行时 `overrides` 参数优先级最高**
5. **项目配置优先级高于用户配置**

### 配置建议

| 需求 | 推荐配置 |
|------|---------|
| 固定 Agent 模型 | `agents.<name>.model` |
| 动态路由 | `routing.agentOverrides` |
| 最简单配置 | `agents` 配置 + `routing.enabled: false` |
| 最灵活配置 | 混合模式（关键 Agent 固定 + 其他动态） |
| 临时覆盖 | `getAgentDefinitions({ overrides })` |

---

*文档生成时间：2025-03-30*  
*基于 oh-my-claudecode v4.9.3*

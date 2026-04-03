---
title: oh-my-claudecode Agent 模型配置指南
tags:
  - AI
  - Agentic Engineering
  - Anti-Patterns
  - Programming
categories:
  - Technology
abbrlink: 2896843582
date: 2026-03-08 00:45:00
updated: 2026-03-08 00:45:00
sidebar: 
  order: 000
---
如何为不同的 agent 设置不同的 Claude 模型。

---

## 概述

oh-my-claudecode 支持为 19 个不同的 agent 单独配置模型，实现成本与性能的最佳平衡：

| 模型层级 | 代表模型 | 适用场景 | 成本 |
|----------|----------|----------|------|
| **HIGH** | claude-opus-4-6 | 架构设计、代码审查、战略规划 | 高 |
| **MEDIUM** | claude-sonnet-4-6 | 标准开发、调试、测试 | 中 |
| **LOW** | claude-haiku-4-5 | 简单查询、代码搜索、文档 | 低 |

---

## 配置方式

### 方式一：用户级配置文件（推荐）

**位置**: `~/.config/claude-omc/config.jsonc`

**Windows 路径**: `%APPDATA%\..\Local\claude-omc\config.jsonc`

```jsonc
{
  "agents": {
    "executor": { "model": "claude-sonnet-4-6" },
    "architect": { "model": "claude-opus-4-6" },
    "explore": { "model": "claude-haiku-4-5" }
  }
}
```

### 方式二：项目级配置文件

**位置**: `<项目根目录>/.claude/omc.jsonc`

项目配置会**覆盖**用户级配置，适合为特定项目定制不同的模型策略。

### 方式三：智能路由配置

通过任务类型自动选择模型层级：

```jsonc
{
  "routing": {
    "enabled": true,
    "defaultTier": "MEDIUM",
    "tierModels": {
      "HIGH": "claude-opus-4-6",
      "MEDIUM": "claude-sonnet-4-6",
      "LOW": "claude-haiku-4-5"
    },
    "agentOverrides": {
      "architect": { "tier": "HIGH", "reason": "架构设计需要深度推理" },
      "explore": { "tier": "LOW", "reason": "探索任务主要是搜索" },
      "writer": { "tier": "LOW", "reason": "文档编写相对直接" }
    },
    "escalationKeywords": ["critical", "production", "security", "architecture"],
    "simplificationKeywords": ["find", "list", "show", "search", "grep"]
  }
}
```

---

## 默认模型路由

oh-my-claudecode 内置的默认模型分配：

| Agent | 默认层级 | 默认模型 | 用途 |
|-------|---------|---------|------|
| `omc` | HIGH | claude-opus-4-6 | 主协调器 |
| `architect` | HIGH | claude-opus-4-6 | 架构与调试专家 |
| `analyst` | HIGH | claude-opus-4-6 | 需求分析 |
| `planner` | HIGH | claude-opus-4-6 | 战略规划 |
| `critic` | HIGH | claude-opus-4-6 | 计划审查 |
| `codeReviewer` | HIGH | claude-opus-4-6 | 代码审查 |
| `codeSimplifier` | HIGH | claude-opus-4-6 | 代码简化 |
| `executor` | MEDIUM | claude-sonnet-4-6 | 代码实现 |
| `debugger` | MEDIUM | claude-sonnet-4-6 | 调试错误 |
| `verifier` | MEDIUM | claude-sonnet-4-6 | 结果验证 |
| `securityReviewer` | MEDIUM | claude-sonnet-4-6 | 安全审查 |
| `testEngineer` | MEDIUM | claude-sonnet-4-6 | 测试工程 |
| `designer` | MEDIUM | claude-sonnet-4-6 | UI/UX 设计 |
| `qaTester` | MEDIUM | claude-sonnet-4-6 | QA 测试 |
| `scientist` | MEDIUM | claude-sonnet-4-6 | 数据分析 |
| `tracer` | MEDIUM | claude-sonnet-4-6 | 因果追踪 |
| `gitMaster` | MEDIUM | claude-sonnet-4-6 | Git 专家 |
| `documentSpecialist` | MEDIUM | claude-sonnet-4-6 | 文档查询 |
| `explore` | LOW | claude-haiku-4-5 | 代码探索 |
| `writer` | LOW | claude-haiku-4-5 | 文档编写 |

---

## 配置模板

### 最小可用配置示例

```jsonc
{
  "agents": {
    "executor": { "model": "claude-sonnet-4-6" },
    "architect": { "model": "claude-opus-4-6" },
    "explore": { "model": "claude-haiku-4-5" }
  }
}
```

### 完整配置模板

```jsonc
/**
 * oh-my-claudecode 配置模板
 *
 * 使用方式：
 * 1. 复制此文件到以下位置之一：
 *    - 用户级：~/.config/claude-omc/config.jsonc
 *    - 项目级：.claude/omc.jsonc（覆盖用户级）
 *
 * 2. 根据需要修改配置项
 * 3. 重启 Claude Code 使配置生效
 */

{
  /**
   * ===========================================
   * Agent 模型配置
   * ===========================================
   * 为每个 agent 单独指定模型
   * 可用模型：claude-haiku-4-5, claude-sonnet-4-6, claude-opus-4-6
   * 或使用层级：haiku, sonnet, opus（自动映射到默认模型）
   */
  "agents": {
    // 主协调器 - 负责任务分发
    "omc": { "model": "claude-opus-4-6" },

    // 探索类 agent - 快速搜索代码库
    "explore": { "model": "claude-haiku-4-5" },

    // 分析类 agent - 需求分析、预规划
    "analyst": { "model": "claude-opus-4-6" },

    // 规划类 agent - 战略规划
    "planner": { "model": "claude-opus-4-6" },

    // 架构类 agent - 调试与架构建议
    "architect": { "model": "claude-opus-4-6" },

    // 调试类 agent - 构建错误、调试
    "debugger": { "model": "claude-sonnet-4-6" },

    // 执行类 agent - 代码实现
    "executor": { "model": "claude-sonnet-4-6" },

    // 验证类 agent - 验证结果
    "verifier": { "model": "claude-sonnet-4-6" },

    // 安全审查 agent
    "securityReviewer": { "model": "claude-sonnet-4-6" },

    // 代码审查 agent
    "codeReviewer": { "model": "claude-opus-4-6" },

    // 测试工程师
    "testEngineer": { "model": "claude-sonnet-4-6" },

    // UI/UX 设计师
    "designer": { "model": "claude-sonnet-4-6" },

    // 文档编写
    "writer": { "model": "claude-haiku-4-5" },

    // QA 测试
    "qaTester": { "model": "claude-sonnet-4-6" },

    // 数据分析
    "scientist": { "model": "claude-sonnet-4-6" },

    // 因果追踪
    "tracer": { "model": "claude-sonnet-4-6" },

    // Git 专家
    "gitMaster": { "model": "claude-sonnet-4-6" },

    // 代码简化
    "codeSimplifier": { "model": "claude-opus-4-6" },

    // 批评者 - 计划审查
    "critic": { "model": "claude-opus-4-6" },

    // 文档专家 - 外部文档查询
    "documentSpecialist": { "model": "claude-sonnet-4-6" }
  },

  /**
   * ===========================================
   * 功能开关
   * ===========================================
   */
  "features": {
    "parallelExecution": true,      // 并行执行多个任务
    "lspTools": true,               // 启用 LSP（语言服务器协议）工具
    "astTools": true,               // 启用 AST（抽象语法树）工具
    "continuationEnforcement": true, // 强制 continuation 策略
    "autoContextInjection": true    // 自动注入上下文
  },

  /**
   * ===========================================
   * MCP 服务器配置
   * ===========================================
   */
  "mcpServers": {
    "exa": {
      "enabled": true,
      "apiKey": ""  // 可选：填入 Exa API key
    },
    "context7": {
      "enabled": true
    }
  },

  /**
   * ===========================================
   * 权限设置
   * ===========================================
   */
  "permissions": {
    "allowBash": true,              // 允许执行 shell 命令
    "allowEdit": true,              // 允许编辑文件
    "allowWrite": true,             // 允许写入文件
    "maxBackgroundTasks": 5         // 最大后台任务数 (1-50)
  },

  /**
   * ===========================================
   * 智能路由配置
   * ===========================================
   * 根据任务类型自动选择合适的模型层级
   */
  "routing": {
    "enabled": true,                          // 启用智能路由
    "defaultTier": "MEDIUM",                  // 默认层级：LOW/MEDIUM/HIGH
    "forceInherit": false,                    // 强制所有 agent 继承父模型
    "escalationEnabled": true,                // 启用升级机制
    "maxEscalations": 2,                      // 最大升级次数

    // 各层级对应的具体模型
    "tierModels": {
      "HIGH": "claude-opus-4-6",              // 高优先级：架构、审查、规划
      "MEDIUM": "claude-sonnet-4-6",          // 中优先级：标准开发任务
      "LOW": "claude-haiku-4-5"               // 低优先级：简单查询、搜索
    },

    // Agent 层级覆盖（针对特定 agent 的精细控制）
    "agentOverrides": {
      "architect": {
        "tier": "HIGH",
        "reason": "架构建议需要深度推理"
      },
      "planner": {
        "tier": "HIGH",
        "reason": "战略规划需要深度推理"
      },
      "critic": {
        "tier": "HIGH",
        "reason": "关键审查需要深度推理"
      },
      "analyst": {
        "tier": "HIGH",
        "reason": "预规划分析需要深度推理"
      },
      "explore": {
        "tier": "LOW",
        "reason": "探索任务主要是搜索"
      },
      "writer": {
        "tier": "LOW",
        "reason": "文档编写相对直接"
      }
    },

    // 升级关键词（任务包含这些词时自动升级到 HIGH 层级）
    "escalationKeywords": [
      "critical",
      "production",
      "urgent",
      "security",
      "breaking",
      "architecture",
      "refactor",
      "redesign",
      "root cause"
    ],

    // 简化关键词（任务包含这些词时自动降级到 LOW 层级）
    "simplificationKeywords": [
      "find",
      "list",
      "show",
      "where",
      "search",
      "locate",
      "grep"
    ]
  },

  /**
   * ===========================================
   * 外部模型配置（Codex、Gemini）
   * ===========================================
   */
  "externalModels": {
    "defaults": {
      "codexModel": "gpt-5.3-codex",          // 默认 Codex 模型
      "geminiModel": "gemini-3.1-pro-preview" // 默认 Gemini 模型
    },
    "fallbackPolicy": {
      "onModelFailure": "provider_chain",     // 失败时的降级策略
      "allowCrossProvider": false,            // 是否允许跨提供商降级
      "crossProviderOrder": ["codex", "gemini"] // 降级顺序
    }
  },

  /**
   * ===========================================
   * 委托路由配置（可选：将任务路由到外部提供商）
   * ===========================================
   */
  "delegationRouting": {
    "enabled": false,                         // 是否启用委托路由
    "defaultProvider": "claude",              // 默认提供商
    "roles": {
      // 示例：将代码审查路由到 Codex
      // "codeReviewer": {
      //   "provider": "codex",
      //   "model": "gpt-5.3-codex"
      // }
    }
  },

  /**
   * ===========================================
   * 魔法关键词（触发特殊工作流）
   * ===========================================
   */
  "magicKeywords": {
    "ultrawork": ["ultrawork", "ulw", "uw"],
    "search": ["search", "find", "locate"],
    "analyze": ["analyze", "investigate", "examine"],
    "ultrathink": ["ultrathink", "think", "ponder", "reason"]
  },

  /**
   * ===========================================
   * 计划输出配置
   * ===========================================
   */
  "planOutput": {
    "directory": ".omc/plans",                // 计划文件输出目录
    "filenameTemplate": "{{name}}.md"         // 文件名模板
  },

  /**
   * ===========================================
   * 启动时代码库映射
   * ===========================================
   */
  "startupCodebaseMap": {
    "enabled": true,                          // 是否启用
    "maxFiles": 200,                          // 最大文件数
    "maxDepth": 4                             // 最大目录深度
  },

  /**
   * ===========================================
   * 任务规模检测
   * ===========================================
   */
  "taskSizeDetection": {
    "enabled": true,                          // 是否启用任务规模检测
    "smallWordLimit": 50,                     // 小型任务字数上限
    "largeWordLimit": 200,                    // 大型任务字数上限
    "suppressHeavyModesForSmallTasks": true   // 小型任务不启用重量级模式
  }
}
```

```jsonc
{
  "agents": {
    "omc": { "model": "claude-opus-4-6" },
    "explore": { "model": "claude-haiku-4-5" },
    "analyst": { "model": "claude-opus-4-6" },
    "planner": { "model": "claude-opus-4-6" },
    "architect": { "model": "claude-opus-4-6" },
    "debugger": { "model": "claude-sonnet-4-6" },
    "executor": { "model": "claude-sonnet-4-6" },
    "verifier": { "model": "claude-sonnet-4-6" },
    "securityReviewer": { "model": "claude-sonnet-4-6" },
    "codeReviewer": { "model": "claude-opus-4-6" },
    "testEngineer": { "model": "claude-sonnet-4-6" },
    "designer": { "model": "claude-sonnet-4-6" },
    "writer": { "model": "claude-haiku-4-5" },
    "qaTester": { "model": "claude-sonnet-4-6" },
    "scientist": { "model": "claude-sonnet-4-6" },
    "tracer": { "model": "claude-sonnet-4-6" },
    "gitMaster": { "model": "claude-sonnet-4-6" },
    "codeSimplifier": { "model": "claude-opus-4-6" },
    "critic": { "model": "claude-opus-4-6" },
    "documentSpecialist": { "model": "claude-sonnet-4-6" }
  },
  "features": {
    "parallelExecution": true,
    "lspTools": true,
    "astTools": true,
    "continuationEnforcement": true,
    "autoContextInjection": true
  },
  "mcpServers": {
    "exa": { "enabled": true, "apiKey": "" },
    "context7": { "enabled": true }
  },
  "permissions": {
    "allowBash": true,
    "allowEdit": true,
    "allowWrite": true,
    "maxBackgroundTasks": 5
  },
  "routing": {
    "enabled": true,
    "defaultTier": "MEDIUM",
    "forceInherit": false,
    "escalationEnabled": true,
    "maxEscalations": 2,
    "tierModels": {
      "HIGH": "claude-opus-4-6",
      "MEDIUM": "claude-sonnet-4-6",
      "LOW": "claude-haiku-4-5"
    },
    "agentOverrides": {
      "architect": { "tier": "HIGH", "reason": "架构建议需要深度推理" },
      "planner": { "tier": "HIGH", "reason": "战略规划需要深度推理" },
      "critic": { "tier": "HIGH", "reason": "关键审查需要深度推理" },
      "analyst": { "tier": "HIGH", "reason": "预规划分析需要深度推理" },
      "explore": { "tier": "LOW", "reason": "探索任务主要是搜索" },
      "writer": { "tier": "LOW", "reason": "文档编写相对直接" }
    },
    "escalationKeywords": ["critical", "production", "urgent", "security", "breaking", "architecture", "refactor", "redesign", "root cause"],
    "simplificationKeywords": ["find", "list", "show", "where", "search", "locate", "grep"]
  },
  "externalModels": {
    "defaults": {
      "codexModel": "gpt-5.3-codex",
      "geminiModel": "gemini-3.1-pro-preview"
    },
    "fallbackPolicy": {
      "onModelFailure": "provider_chain",
      "allowCrossProvider": false,
      "crossProviderOrder": ["codex", "gemini"]
    }
  },
  "delegationRouting": {
    "enabled": false,
    "defaultProvider": "claude",
    "roles": {}
  },
  "magicKeywords": {
    "ultrawork": ["ultrawork", "ulw", "uw"],
    "search": ["search", "find", "locate"],
    "analyze": ["analyze", "investigate", "examine"],
    "ultrathink": ["ultrathink", "think", "ponder", "reason"]
  },
  "planOutput": {
    "directory": ".omc/plans",
    "filenameTemplate": "{{name}}.md"
  },
  "startupCodebaseMap": {
    "enabled": true,
    "maxFiles": 200,
    "maxDepth": 4
  },
  "taskSizeDetection": {
    "enabled": true,
    "smallWordLimit": 50,
    "largeWordLimit": 200,
    "suppressHeavyModesForSmallTasks": true
  }
}
```

---

## 环境变量

### 基础配置

```bash
# 按层级设置模型
export OMC_MODEL_HIGH="claude-opus-4-6"
export OMC_MODEL_MEDIUM="claude-sonnet-4-6"
export OMC_MODEL_LOW="claude-haiku-4-5"

# 设置模型别名
export OMC_MODEL_ALIAS_HAIKU="claude-haiku-4-5"
export OMC_MODEL_ALIAS_SONNET="claude-sonnet-4-6"
export OMC_MODEL_ALIAS_OPUS="claude-opus-4-6"

# 路由配置
export OMC_ROUTING_ENABLED="true"
export OMC_ROUTING_DEFAULT_TIER="MEDIUM"
export OMC_ROUTING_FORCE_INHERIT="false"
export OMC_ESCALATION_ENABLED="true"

# 外部模型配置
export OMC_EXTERNAL_MODELS_DEFAULT_CODEX_MODEL="gpt-5.3-codex"
export OMC_EXTERNAL_MODELS_DEFAULT_GEMINI_MODEL="gemini-3.1-pro-preview"
```

### AWS Bedrock

```bash
export CLAUDE_CODE_USE_BEDROCK=1
export CLAUDE_CODE_BEDROCK_OPUS_MODEL="us.anthropic.claude-opus-4-6-v1:0"
export CLAUDE_CODE_BEDROCK_SONNET_MODEL="us.anthropic.claude-sonnet-4-6-v1:0"
export CLAUDE_CODE_BEDROCK_HAIKU_MODEL="us.anthropic.claude-haiku-4-5-v1:0"
```

### Google Vertex AI

```bash
export CLAUDE_CODE_USE_VERTEX=1
```

> **注意**: 当检测到 Bedrock 或 Vertex AI 时，`forceInherit` 会自动启用，确保传递完整的提供商特定模型 ID。

---

## 优先级顺序

配置来源的优先级从高到低：

1. **项目配置文件** (`.claude/omc.jsonc`)
2. **用户配置文件** (`~/.config/claude-omc/config.jsonc`)
3. **环境变量** (`OMC_*`)
4. **内置默认值**

---

## 常见问题

### Q: 如何验证配置是否生效？

**A**: 观察 agent 执行时的模型选择，或查看日志输出中的模型配置信息。

### Q: 配置修改后需要重启吗？

**A**: 是的，需要重启 Claude Code 会话使新配置生效。

### Q: 可以只配置部分 agent 吗？

**A**: 可以，未配置的 agent 会使用内置默认值。

### Q: `forceInherit: true` 是什么作用？

**A**: 强制所有 agent 继承用户当前选择的模型，绕过 OMC 的路由逻辑。适用于：
- 使用非 Anthropic 官方 API（如 LiteLLM、OneAPI）
- AWS Bedrock / Google Vertex AI
- 希望所有 agent 使用同一模型

### Q: 如何为特定项目使用不同的模型配置？

**A**: 在项目根目录创建 `.claude/omc.jsonc`，项目配置会覆盖用户级配置。

### Q: 支持哪些 Claude 模型？

**A**: 所有 Anthropic 官方模型：
- `claude-haiku-4-5` / `claude-haiku-4-5-high`
- `claude-sonnet-4-6` / `claude-sonnet-4-6-high`
- `claude-opus-4-6` / `claude-opus-4-6-high`

也可以使用简短别名：`haiku`、`sonnet`、`opus`。

---

## 相关源代码

### 配置加载器核心逻辑 (`src/config/loader.ts` 节选)

```typescript
/**
 * 默认配置 - 从环境变量解析模型
 */
export function buildDefaultConfig(): PluginConfig {
  const defaultTierModels = getDefaultTierModels();

  return {
    agents: {
      omc: { model: defaultTierModels.HIGH },
      explore: { model: defaultTierModels.LOW },
      analyst: { model: defaultTierModels.HIGH },
      planner: { model: defaultTierModels.HIGH },
      architect: { model: defaultTierModels.HIGH },
      debugger: { model: defaultTierModels.MEDIUM },
      executor: { model: defaultTierModels.MEDIUM },
      // ... 更多 agent
    },
    routing: {
      enabled: true,
      defaultTier: "MEDIUM",
      tierModels: { ...defaultTierModels },
      agentOverrides: {
        architect: { tier: "HIGH", reason: "Advisory agent requires deep reasoning" },
        planner: { tier: "HIGH", reason: "Strategic planning requires deep reasoning" },
        explore: { tier: "LOW", reason: "Exploration is search-focused" },
        writer: { tier: "LOW", reason: "Documentation is straightforward" }
      }
    }
  };
}
```

### 模型层级解析逻辑 (`src/config/models.ts` 节选)

```typescript
// 环境变量优先级配置
const TIER_ENV_KEYS: Record<ModelTier, readonly string[]> = {
  LOW: [
    'OMC_MODEL_LOW',
    'CLAUDE_CODE_BEDROCK_HAIKU_MODEL',
    'ANTHROPIC_DEFAULT_HAIKU_MODEL',
  ],
  MEDIUM: [
    'OMC_MODEL_MEDIUM',
    'CLAUDE_CODE_BEDROCK_SONNET_MODEL',
    'ANTHROPIC_DEFAULT_SONNET_MODEL',
  ],
  HIGH: [
    'OMC_MODEL_HIGH',
    'CLAUDE_CODE_BEDROCK_OPUS_MODEL',
    'ANTHROPIC_DEFAULT_OPUS_MODEL',
  ],
};

// 默认模型家族
export const CLAUDE_FAMILY_DEFAULTS: Record<ClaudeModelFamily, string> = {
  HAIKU: 'claude-haiku-4-5',
  SONNET: 'claude-sonnet-4-6',
  OPUS: 'claude-opus-4-6',
};

// 解析层级模型的函数
function resolveTierModelFromEnv(tier: ModelTier): string | undefined {
  for (const key of TIER_ENV_KEYS[tier]) {
    const value = process.env[key]?.trim();
    if (value) {
      return value;
    }
  }
  return undefined;
}
```

---

**最后更新**: 2026-03-25

# OMC 启动子 Agent 方式指南

## 概述

OMC (oh-my-claudecode) 提供多种方式启动子 agent，每种方式适用于不同的场景。本文档详细说明各种启动方式的使用方法和适用场景。

---

## 方式 1：直接使用 `Agent` tool

### 使用方法
```python
Agent(
    subagent_type="oh-my-claudecode:security-reviewer",
    model="opus",  # 可选，指定模型 tier
    name="worker-1",  # 可选，给 agent 命名
    prompt="执行安全审查..."
)
```

### 特点
| 特性 | 说明 |
|------|------|
| 复杂度 | 低 |
| 团队协作 | 否 |
| 任务管理 | 否 |
| 通信机制 | 直接返回结果 |

### 适用场景
- 单次独立任务
- 不需要多 agent 协作
- 快速委托专项工作

### 模型配置
- 显式指定 `model` 参数 → 通过 `modelAliases` 映射
- 不指定 `model` → 使用 `agents.<agentType>.model` 配置
- 受 `forceInherit` 配置影响

---

## 方式 2：`TeamCreate` + `Task` 工具（团队模式）

### 使用方法
```python
# 步骤 1：创建团队
TeamCreate(team_name="flask-review")

# 步骤 2：创建任务
TaskCreate(subject="安全审查", description="对 Flask 应用进行安全审查")

# 步骤 3：启动团队成员
Task(
    subagent_type="oh-my-claudecode:security-reviewer",
    team_name="flask-review",
    name="worker-1",
    prompt="执行安全审查..."
)
```

### 特点
| 特性 | 说明 |
|------|------|
| 复杂度 | 中 |
| 团队协作 | 是 |
| 任务管理 | 是（TaskList/TaskUpdate） |
| 通信机制 | SendMessage 双向通信 |

### 适用场景
- 多个 agent 协作完成复杂任务
- 需要任务依赖管理
- 需要进度跟踪和通信

### 模型配置
- 团队成员模型独立配置
- 启动时指定 `model` 参数可覆盖默认值
- 受 `forceInherit` 配置影响

---

## 方式 3：OMC Skills

### 3.1 `/oh-my-claudecode:team` - 原生团队技能

```bash
/team 2:executor "对 Flask 应用进行安全审查和代码审查"
```

**自动执行：**
1. 分析任务并分解为子任务
2. 创建团队和任务
3. 启动多个 agent
4. 监控进度并协调

**适用场景：** 多 agent 协作的标准工作流

---

### 3.2 `/oh-my-claudecode:autopilot` - 自动驾驶模式

```bash
/oh-my-claudecode:autopilot "实现用户认证模块"
```

**自动执行：**
1. 需求分析
2. 任务规划
3. 代码实现
4. 测试验证

**适用场景：** 从想法到代码的全自动完成

---

### 3.3 `/oh-my-claudecode:ralph` - 持久化执行模式

```bash
/oh-my-claudecode:ralph "修复所有 TypeScript 错误"
```

**特点：**
- 失败自动重试
- 架构师验证后才完成
- 迭代追踪

**适用场景：** 需要持续执行直到成功的任务

---

### 3.4 `/oh-my-claudecode:ultrawork` - 并行执行引擎

```bash
/oh-my-claudecode:ultrawork "批量处理这些任务"
```

**特点：**
- 高吞吐量并行执行
- 任务自动分配
- 进度集中追踪

**适用场景：** 大量独立任务的批量处理

---

### 3.5 `/oh-my-claudecode:omc-teams` - CLI 团队技能

```bash
/oh-my-claudecode:omc-teams 2:claude "对代码进行安全审查"
/oh-my-claudecode:omc-teams 2:codex "审查架构"
/oh-my-claudecode:omc-teams 2:gemini "重新设计 UI"
```

**特点：**
- 启动外部 CLI 进程
- tmux 隔离执行
- 不占用当前会话

**适用场景：** 需要独立进程执行，与当前会话隔离

---

## 方式 4：`omc team` CLI 命令

### 使用方法
```bash
# 启动 claude CLI workers
omc team 2:claude "对代码进行安全审查"

# 启动 codex CLI workers（需要安装：npm install -g @openai/codex）
omc team 2:codex "审查架构"

# 启动 gemini CLI workers（需要安装：npm install -g @google/gemini-cli）
omc team 2:gemini "重新设计 UI"
```

### 特点
| 特性 | 说明 |
|------|------|
| 复杂度 | 低 |
| 团队协作 | 否（独立进程） |
| 任务管理 | CLI 内部管理 |
| 通信机制 | 文件/输出捕获 |

### 适用场景
- 需要外部 CLI 进程独立执行
- 不占用当前 Claude 会话
- 多模型并行执行（claude + codex + gemini）

### 模型配置
**重要：** CLI workers **不读取** OMC `config.jsonc` 配置
- 使用 CLI 自身的模型配置
- 通过 `--model` 参数指定
- 不受 `forceInherit` 或 `modelAliases` 影响

---

## 方式 5：`Task` tool 直接委托

### 使用方法
```python
Task(
    subagent_type="oh-my-claudecode:architect",
    prompt="分析代码架构"
)
```

### 特点
| 特性 | 说明 |
|------|------|
| 复杂度 | 最低 |
| 团队协作 | 否 |
| 任务管理 | 自动创建内部任务 |
| 通信机制 | 直接返回结果 |

### 适用场景
- 简单的一次性委托
- 不需要命名或团队管理
- 快速获取专业 agent 的输出

---

## 各方式对比总表

| 方式 | 模型配置生效 | 团队协作 | 任务管理 | 通信 | 适用场景 |
|------|-------------|---------|---------|------|---------|
| `Agent` tool | ✅ 读取 config.jsonc | ❌ | ❌ | 直接返回 | 单次专项任务 |
| `TeamCreate` + `Task` | ✅ 读取 config.jsonc | ✅ | ✅ | SendMessage | 多 agent 协作 |
| `/team` skill | ✅ 读取 config.jsonc | ✅ | ✅ | 自动协调 | 标准团队工作流 |
| `/autopilot` skill | ✅ 读取 config.jsonc | ✅ | ✅ | 自动协调 | 全自动实现 |
| `/ralph` skill | ✅ 读取 config.jsonc | ✅ | ✅ | 自动协调 | 持久化执行 |
| `/ultrawork` skill | ✅ 读取 config.jsonc | ✅ | ✅ | 自动协调 | 高吞吐并行 |
| `/omc-teams` skill | ❌ CLI 自带模型 | ⚠️ tmux 隔离 | ⚠️ CLI 管理 | 文件输出 | 外部 CLI 执行 |
| `omc team` CLI | ❌ CLI 自带模型 | ⚠️ tmux 隔离 | ⚠️ CLI 管理 | 文件输出 | 外部 CLI 执行 |
| `Task` tool | ✅ 读取 config.jsonc | ❌ | ⚠️ 内部任务 | 直接返回 | 简单委托 |

---

## 模型配置详解

### 配置文件位置
```
~/.config/claude-omc/config.jsonc
```

### 核心配置项
```jsonc
{
  "routing": {
    "enabled": true,
    "forceInherit": false,  // 关键！设为 false 才能使用配置
    "modelAliases": {
      "opus": "qwen3-coder-plus",
      "sonnet": "qwen3-max-2026-01-23",
      "haiku": "qwen3-coder-next"
    }
  },
  "agents": {
    "securityReviewer": {
      "model": "opus"
    },
    "codeReviewer": {
      "model": "opus"
    }
  }
}
```

### 模型解析流程

```
当启动子 agent 时：

1. 检查 forceInherit 是否为 true？
   ├── 是 → 直接继承父代理模型（忽略所有配置）
   └── 否 → 继续步骤 2

2. 检查是否显式指定 model 参数？
   ├── 是 → 使用指定值（通过 modelAliases 映射）
   └── 否 → 继续步骤 3

3. 检查 agents.<agentType>.model 配置？
   ├── 存在 → 使用配置值（通过 modelAliases 映射）
   └── 不存在 → 使用 agent 定义中的 defaultModel
```

### 配置生效条件

| 配置项 | 必须条件 | 影响范围 |
|--------|---------|---------|
| `forceInherit=false` | 必须 | 所有子 agent |
| `modelAliases` | 推荐 | 模型映射 |
| `agents.*.model` | 可选 | 特定 agent 类型 |

---

## 验证方法

### 检查团队配置
```bash
cat ~/.claude/teams/<team-name>/config.json | grep -A2 '"model"'
```

### 检查 OMC 配置
```bash
cat ~/.config/claude-omc/config.jsonc
```

### 检查环境变量
```bash
echo "OMC_MODEL_HIGH=$OMC_MODEL_HIGH"
echo "OMC_MODEL_MEDIUM=$OMC_MODEL_MEDIUM"
echo "OMC_MODEL_LOW=$OMC_MODEL_LOW"
```

---

## 推荐实践

### 需要模型配置生效时
1. 优先使用 `Agent` tool 或 `TeamCreate` + `Task`
2. 确保 `~/.config/claude-omc/config.jsonc` 中 `forceInherit=false`
3. 配置 `modelAliases` 和 `agents.*.model`

### 快速标准任务
- 使用 OMC Skills（如 `/team`、`/autopilot`）更便捷

### 需要隔离执行
- 使用 `/omc-teams` 或 `omc team` CLI
- 注意：CLI workers 不使用 OMC 模型配置

---

## 常见问题

### Q: 为什么子 agent 不使用我配置的模型？
**A:** 检查 `forceInherit` 是否设为 `false`。如果为 `true`，子 agent 会继承父代理模型而不是使用配置。

### Q: CLI workers 能使用 OMC 模型配置吗？
**A:** 不能。CLI workers 是独立进程，使用 CLI 自身的模型配置，不读取 OMC `config.jsonc`。

### Q: 如何为特定 agent 类型配置不同模型？
**A:** 在 `agents` 部分添加配置：
```jsonc
"agents": {
  "securityReviewer": {
    "model": "opus"
  }
}
```

### Q: 配置修改后需要重启吗？
**A:** 是的，配置在启动时加载。修改配置后需要重新启动会话或团队。

---

## 配置创建日期
2026-03-30


**/oh-my-claudecode:team 对当前应用进程安全审查和代码审查**
这种方式模型输入正确，是给每个agent指定的模型。
![20260330230700](https://raw.githubusercontent.com/chenzhenyang/images/master/highgo/20260330230700.png)
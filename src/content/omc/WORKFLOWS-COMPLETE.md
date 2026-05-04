---
title: 'OMC 四大工作流完整文档'
lastUpdated: 2026-05-04
tags:
  - OMC
  - 工作流
categories:
  - o
  - m
  - c
---

# OMC 四大工作流完整文档

> oh-my-claudecode 核心执行模式权威指南：Autopilot、Ralph、Ultrawork、UltraQA

**版本**: v4.9.3  
**更新时间**: 2025-03-30

---

## 目录

1. [概述](#一概述)
2. [核心关系图](#二核心关系图)
3. [各工作流详解](#三各工作流详解)
4. [功能对比](#四功能对比)
5. [互斥关系](#五互斥关系)
6. [状态管理](#六状态管理)
7. [使用场景](#七使用场景)
8. [配置参数](#八配置参数)
9. [源码架构](#九源码架构)
10. [模式选择决策树](#十模式选择决策树)
11. [常见问题](#十一常见问题)

---

## 一、概述

oh-my-claudecode (OMC) 提供四个核心工作流模式，每个模式针对不同的使用场景：

| 工作流 | 定位 | 复杂度 | 持久化 | 基于 Ultrawork |
|--------|------|--------|--------|---------------|
| **Ultrawork** | 并行执行引擎 | ⭐ | ❌ | - |
| **UltraQA** | QA 循环专家 | ⭐⭐ | ⚠️ 临时 | ❌ **否** |
| **Ralph** | 持久化工作循环 | ⭐⭐⭐ | ✅ | ✅ 是 |
| **Autopilot** | 完整项目管道 | ⭐⭐⭐⭐ | ✅ | ✅ 间接 |

### 设计哲学

```
Ultrawork → 并行执行层（基础组件）
    ↑
Ralph → Ultrawork + 持久化 + 验证（保证完成）
    ↑
Autopilot → Ralph + UltraQA + 需求分析 + 规划（完整管道）

UltraQA → 独立 QA 循环模块（顺序执行，非并行）
```

### 关键澄清

> **UltraQA 不是基于 Ultrawork 的！**
>
> - **Ultrawork**: 并行执行多个独立任务
> - **UltraQA**: 顺序执行测试→诊断→修复循环
> - 两者名称相似但功能独立

---

## 二、核心关系图

### 2.1 层级依赖关系

```
┌─────────────────────────────────────────────────────────────────┐
│                        AUTOPILOT                                │
│  完整的自主执行管道：从想法到工作代码                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Phase 0: Expansion (需求分析 + 技术规格)                    │  │
│  │ Phase 1: Planning (实现计划)                               │  │
│  │ Phase 2: Execution (执行) ← 使用 Ralph                     │  │
│  │         ↓                                                  │  │
│  │ Phase 3: QA (质量保证) ← 使用 UltraQA（独立模块）           │  │
│  │         ↓                                                  │  │
│  │ Phase 4: Validation (多视角验证)                           │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
         │
         │ 包含（Phase 2 使用）
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                          RALPH                                  │
│  持久化工作循环 + 强制验证                                       │
│  - PRD 驱动的任务跟踪                                           │
│  - 跨迭代持久化 (progress.txt)                                  │
│  - 架构师/审查员验证                                            │
│  - 自动重试直到完成                                             │
│  - 包含 Ultrawork 进行并行执行                                   │
│  - 与 UltraQA 互斥                                              │
└─────────────────────────────────────────────────────────────────┘
         │
         │ 包含
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                        ULTRAWORK                                │
│  并行执行引擎                                                   │
│  - 多 Agent 同时执行独立任务                                     │
│  - 智能模型路由 (Haiku/Sonnet/Opus)                             │
│  - 后台任务管理                                                 │
│  - 无持久化、无验证循环                                         │
└─────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                         UltraQA                                 │
│  QA 循环工作流（独立模块，不依赖 Ultrawork）                       │
│  - 测试 → 诊断 → 修复 → 重复（顺序执行）                          │
│  - 最多 5 个循环                                                  │
│  - 相同失败 3 次自动退出                                          │
│  - 与 Ralph 互斥                                                │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 执行方式对比

```
Ultrawork（并行）:
┌─────────┐ ┌─────────┐ ┌─────────┐
│ Task A  │ │ Task B  │ │ Task C  │  ← 同时触发
└─────────┘ └─────────┘ └─────────┘

UltraQA（顺序循环）:
Cycle 1:
  测试 → 诊断 → 修复
            ↓
Cycle 2:
  测试 → 诊断 → 修复
            ↓
        ...重复
```

---

## 三、各工作流详解

### 3.1 Ultrawork

**定位**: 并行执行引擎（基础组件）

#### 核心特性

- ✅ 多 Agent 同时执行独立任务
- ✅ 智能模型路由（Haiku/Sonnet/Opus）
- ✅ 后台任务管理（`run_in_background: true`）
- ❌ 无持久化状态
- ❌ 无验证循环

#### 执行流程

```
1. 读取 Agent 参考 (docs/shared/agent-tiers.md)
2. 分类任务独立性
3. 路由到正确层级:
   - 简单查找/定义 → LOW (Haiku)
   - 标准实现 → MEDIUM (Sonnet)
   - 复杂分析/重构 → HIGH (Opus)
4. 同时触发独立任务
5. 顺序执行依赖任务
6. 后台运行长操作（构建、安装、测试）
7. 轻量验证（构建通过、测试通过）
```

#### 使用示例

```bash
# 基础用法
/oh-my-claudecode:ultrawork 修复所有 TypeScript 错误

# 并行任务示例
Task(subagent_type="oh-my-claudecode:executor", model="haiku", prompt="添加类型导出")
Task(subagent_type="oh-my-claudecode:executor", model="sonnet", prompt="实现 API 端点")
Task(subagent_type="oh-my-claudecode:executor", model="sonnet", prompt="添加集成测试")
```

#### 源码文件

| 文件 | 路径 |
|------|------|
| Skill 定义 | `skills/ultrawork/SKILL.md` |
| Hook 处理 | `src/hooks/ultrawork/index.ts` |

---

### 3.2 Ralph

**定位**: 持久化工作循环 + 强制验证

#### 核心特性

- ✅ PRD 驱动的任务跟踪
- ✅ 跨迭代持久化（progress.txt）
- ✅ 架构师/审查员验证
- ✅ 自动重试直到完成
- ✅ 包含 Ultrawork 进行并行执行
- ❌ 与 UltraQA 互斥

#### 执行流程

```
┌─────────────────────────────────────────────────────────────┐
│ Phase 0: 初始化                                              │
│ - 创建 Ralph 状态 (.omc/state/ralph-state.json)              │
│ - 自动激活 Ultrawork (并行执行)                              │
│ - 检测/创建 PRD (.omc/prd.json)                              │
│ - 初始化进度日志 (.omc/progress.txt)                         │
│ - 检测 --no-prd, --critic=<mode> 标志                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 1: 主循环 (每次 Stop 事件触发)                          │
│ 1. 检查取消信号                                              │
│ 2. 检查 Team 状态                                            │
│ 3. 检查验证状态                                              │
│ 4. 检查 PRD 完成                                             │
│ 5. 检查最大迭代次数                                          │
│ 6. 检查工具错误                                              │
│ 7. 注入继续提示                                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 2: 验证阶段 (所有 PRD 故事完成后)                        │
│ - 根据 --critic 选择审查员                                   │
│ - 验证 acceptance criteria                                   │
│ - 批准 → 清理状态退出                                        │
│ - 拒绝 → 返回 Phase 1 修复                                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 3: 清理                                                │
│ - 删除 ralph-state.json                                     │
│ - 删除 ultrawork-state.json                                 │
│ - 删除 verification-state.json                              │
└─────────────────────────────────────────────────────────────┘
```

#### PRD 示例

```json
{
  "project": "Task Management API",
  "branchName": "feature/auth",
  "description": "Add authentication to task management API",
  "userStories": [
    {
      "id": "US-001",
      "title": "Add JWT token generation",
      "description": "As a user, I want to authenticate and receive a JWT token",
      "acceptanceCriteria": [
        "POST /auth/login accepts email and password",
        "Returns 200 with JWT token on success",
        "Returns 401 on invalid credentials",
        "Token expires after 24 hours"
      ],
      "priority": 1,
      "passes": false
    }
  ]
}
```

#### 使用示例

```bash
# 基础用法
/oh-my-claudecode:ralph 实现用户认证系统

# 指定审查员
/oh-my-claudecode:ralph --critic=codex 构建 API

# 跳过 PRD 模式
/oh-my-claudecode:ralph --no-prd 修复登录 bug
```

#### 源码文件

| 文件 | 路径 |
|------|------|
| Skill 定义 | `skills/ralph/SKILL.md` |
| 循环核心 | `src/hooks/ralph/loop.ts` |
| PRD 操作 | `src/hooks/ralph/prd.ts` |
| 进度日志 | `src/hooks/ralph/progress.ts` |
| 验证流程 | `src/hooks/ralph/verifier.ts` |

---

### 3.3 UltraQA

**定位**: QA 循环专家（**独立模块，不依赖 Ultrawork**）

#### 核心特性

- ✅ 自动化 QA 循环（顺序执行）
- ✅ 最多 5 个循环
- ✅ 相同失败 3 次自动退出
- ✅ Architect 诊断 + Executor 修复
- ⚠️ 临时状态（完成后清理）
- ❌ 与 Ralph 互斥
- ❌ **不使用 Ultrawork 并行机制**

#### 执行流程

```
Cycle N (Max 5)
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. RUN QA: 根据目标类型执行验证                               │
│    - --tests: 运行测试套件                                   │
│    - --build: 运行构建命令                                   │
│    - --lint: 运行 lint 检查                                   │
│    - --typecheck: 运行类型检查                               │
│    - --custom: 自定义成功模式                                │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. CHECK RESULT: 目标是否达成？                               │
│    - YES → 退出（成功）                                      │
│    - NO → 继续步骤 3                                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. ARCHITECT DIAGNOSIS: 分析失败根因（顺序等待）               │
│    Task(subagent_type="architect", model="opus",             │
│         prompt="DIAGNOSE FAILURE: ...")                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. FIX ISSUES: 应用修复建议（顺序等待）                        │
│    Task(subagent_type="executor", model="sonnet",            │
│         prompt="FIX: ...")                                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
                  重复步骤 1
```

#### 退出条件

| 条件 | 动作 |
|------|------|
| **目标达成** | 退出并显示成功："ULTRAQA COMPLETE: Goal met after N cycles" |
| **达到 5 次循环** | 退出并诊断："ULTRAQA STOPPED: Max cycles. Diagnosis: ..." |
| **相同失败 3 次** | 提前退出："ULTRAQA STOPPED: Same failure 3 times. Root cause: ..." |
| **环境错误** | 退出："ULTRAQA ERROR: [tmux/port/dependency issue]" |

#### 使用示例

```bash
# 测试循环
/oh-my-claudecode:ultraqa --tests 修复所有失败的测试

# 构建循环
/oh-my-claudecode:ultraqa --build 修复构建错误

# 自定义模式
/oh-my-claudecode:ultraqa --custom "所有测试通过" 验证功能
```

#### 源码文件

| 文件 | 路径 |
|------|------|
| Skill 定义 | `skills/ultraqa/SKILL.md` |
| Hook 处理 | `src/hooks/ultraqa/index.ts` |

---

### 3.4 Autopilot

**定位**: 完整项目管道（想法 → 成品）

#### 核心特性

- ✅ 完整生命周期管道
- ✅ 需求分析 + 技术规格
- ✅ 实现计划 + 执行
- ✅ QA 循环（使用 UltraQA）
- ✅ 多视角验证
- ✅ 持久化状态

#### 执行流程

```
┌─────────────────────────────────────────────────────────────┐
│ Phase 0: Expansion (需求分析)                                │
│ - Analyst (Opus): 提取需求                                   │
│ - Architect (Opus): 创建技术规格                             │
│ - 输出：.omc/autopilot/spec.md                               │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 1: Planning (规划)                                     │
│ - Architect (Opus): 创建实现计划                             │
│ - Critic (Opus): 验证计划                                    │
│ - 输出：.omc/plans/autopilot-impl.md                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 2: Execution (执行)                                    │
│ - 使用 Ralph + Ultrawork                                     │
│ - PRD 驱动任务跟踪                                           │
│ - 并行执行独立任务                                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 3: QA (质量保证)                                       │
│ - 使用 UltraQA（独立模块）                                    │
│ - 测试 → 诊断 → 修复 → 重复 (最多 5 次)                        │
│ - 输出：通过的测试                                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 4: Validation (验证)                                   │
│ - Architect: 功能完整性                                     │
│ - Security-reviewer: 安全检查                               │
│ - Code-reviewer: 质量审查                                   │
│ - 全部批准 → 完成                                            │
└─────────────────────────────────────────────────────────────┘
```

#### Pipeline 配置

```typescript
// 默认 Pipeline 配置
const DEFAULT_PIPELINE_CONFIG = {
  planning: 'ralplan',      // 共识规划
  execution: 'solo',        // 单会话执行
  verification: {
    engine: 'ralph',        // 使用 Ralph 验证
    maxIterations: 100
  },
  qa: true,                 // 启用 QA 阶段
};

// 阶段顺序
const STAGE_ORDER = ['ralplan', 'execution', 'ralph', 'qa'];
```

#### 使用示例

```bash
# 完整项目
/oh-my-claudecode:autopilot 做一个任务管理 API

# 指定配置
/oh-my-claudecode:autopilot --skip-qa 构建 CLI 工具
```

#### 源码文件

| 文件 | 路径 |
|------|------|
| Skill 定义 | `skills/autopilot/SKILL.md` |
| 状态管理 | `src/hooks/autopilot/state.ts` |
| 提示生成 | `src/hooks/autopilot/prompts.ts` |
| Pipeline | `src/hooks/autopilot/pipeline.ts` |
| 验证协调 | `src/hooks/autopilot/validation.ts` |

---

## 四、功能对比

### 4.1 核心功能矩阵

| 功能 | Ultrawork | Ralph | UltraQA | Autopilot |
|------|-----------|-------|---------|-----------|
| **并行执行** | ✅ 核心 | ✅ 继承 | ❌ 顺序 | ✅ 继承 |
| **持久化状态** | ❌ | ✅ | ⚠️ 临时 | ✅ |
| **PRD 驱动** | ❌ | ✅ | ❌ | ✅ |
| **进度日志** | ❌ | ✅ | ⚠️ 仅 cycles | ✅ |
| **强制验证** | ❌ 轻量 | ✅ 架构师 | ✅ 自动 QA | ✅ 多视角 |
| **自动重试** | ❌ | ✅ | ✅ (5 次) | ✅ |
| **需求分析** | ❌ | ❌ | ❌ | ✅ |
| **规划阶段** | ❌ | ❌ | ❌ | ✅ |
| **QA 循环** | ❌ | ❌ | ✅ 核心 | ✅ (使用 UltraQA) |
| **最大循环** | 无 | 10+ | 5 | 10+ |
| **基于 Ultrawork** | - | ✅ | ❌ | ✅ (间接) |

### 4.2 执行方式对比

| 模式 | 执行方式 | Agent 调用 |
|------|---------|-----------|
| **Ultrawork** | 并行 | 同时触发多个 Task() |
| **Ralph** | 并行 + 循环 | 使用 Ultrawork 并行 |
| **UltraQA** | 顺序循环 | 顺序 Task() → 等待 → Task() |
| **Autopilot** | 管道 + 并行 | Phase 2 用 Ralph，Phase 3 用 UltraQA |

### 4.3 复杂度对比

| 维度 | Ultrawork | Ralph | UltraQA | Autopilot |
|------|-----------|-------|---------|-----------|
| **学习曲线** | 低 | 中 | 中 | 高 |
| **配置复杂度** | 简单 | 中等 | 简单 | 复杂 |
| **适用场景** | 简单并行 | 保证完成 | QA 循环 | 完整项目 |
| **运行时长** | 短 | 长 | 中 | 很长 |
| **资源消耗** | 低 | 高 | 中 | 很高 |

### 4.4 验证强度对比

| 模式 | 验证类型 | 验证者 | 验证内容 |
|------|---------|--------|---------|
| **Ultrawork** | 轻量 | 自动 | 构建通过、测试通过 |
| **Ralph** | 强制 | 架构师/审查员 | PRD acceptance criteria |
| **UltraQA** | 自动 | Architect 诊断 | 测试/构建/lint 通过 |
| **Autopilot** | 多视角 | Architect + Security + Code-reviewer | 功能 + 安全 + 质量 |

---

## 五、互斥关系

### 5.1 互斥矩阵

| | Autopilot | Ralph | Ultrawork | UltraQA |
|---|-----------|-------|-----------|---------|
| **Autopilot** | - | ❌ | ✅ (自动) | ✅ (自动) |
| **Ralph** | ❌ | - | ✅ (自动) | ❌ |
| **Ultrawork** | ✅ (自动) | ✅ (自动) | - | ✅ |
| **UltraQA** | ✅ (自动) | ❌ | ✅ | - |

**说明**:
- ❌ = 互斥，不能同时运行
- ✅ = 可以共存
- (自动) = 自动激活/deactivate，用户无感知

### 5.2 互斥检查源码

#### Ralph 检查 UltraQA (ralph/loop.ts)

```typescript
// Mutual exclusion check: cannot start Ralph Loop if UltraQA is active
if (isUltraQAActive(directory, sessionId)) {
  console.error(
    "Cannot start Ralph Loop while UltraQA is active. " +
    "Cancel UltraQA first with /oh-my-claudecode:cancel."
  );
  return false;
}
```

#### UltraQA 检查 Ralph (ultraqa/index.ts)

```typescript
// Mutual exclusion check: cannot start UltraQA if Ralph Loop is active
if (isRalphLoopActive(directory, sessionId)) {
  return {
    success: false,
    error: 'Cannot start UltraQA while Ralph Loop is active.'
  };
}
```

#### Autopilot 中 Ralph → UltraQA 转换 (autopilot/state.ts)

```typescript
// Step 2: Deactivate Ralph so UltraQA's mutual exclusion check passes
if (ralphState) {
  writeRalphState(directory, { ...ralphState, active: false }, sessionId);
}

// Step 4: Start UltraQA (Ralph is deactivated, mutual exclusion passes)
startUltraQA(directory, "tests", sessionId, { maxCycles: 5 });
```

### 5.3 为什么 Ralph 和 UltraQA 互斥？

**原因**:
1. 两者都是持久化循环模式
2. 同时运行会导致状态冲突（都在监听 Stop 事件）
3. 验证逻辑混乱（谁负责完成判断）
4. 资源竞争（都在 spawn agent）

### 5.4 为什么 Autopilot 可以包含两者？

**原因**:
1. Autopilot 是管道编排器，不是直接的模式
2. 在不同 phase 使用不同模式（Phase 2 用 Ralph，Phase 3 用 UltraQA）
3. 转换时会停用前一个模式

---

## 六、状态管理

### 6.1 状态文件结构

```
.omc/state/
├── autopilot-state.json         # Autopilot 状态
│   └── 包含 phase: 'expansion'|'planning'|'execution'|'qa'|'validation'
├── ralph-state.json             # Ralph 状态
│   └── iteration, prd_mode, current_story_id
├── ultrawork-state.json         # Ultrawork 状态
│   └── linked_to_ralph: true|false
└── ultraqa-state.json           # UltraQA 状态
    └── cycle, goal_type, failures[]

sessions/
└── {sessionId}/
    ├── autopilot-state.json
    ├── ralph-state.json
    ├── ultrawork-state.json
    └── ultraqa-state.json
```

### 6.2 状态数据结构

#### RalphLoopState

```typescript
interface RalphLoopState {
  active: boolean;
  iteration: number;
  max_iterations: number;
  started_at: string;
  prompt: string;
  session_id?: string;
  project_path?: string;
  prd_mode?: boolean;
  current_story_id?: string;
  linked_ultrawork?: boolean;
  critic_mode?: RalphCriticMode;  // 'architect' | 'critic' | 'codex'
}
```

#### UltraQAState

```typescript
interface UltraQAState {
  active: boolean;
  goal_type: UltraQAGoalType;  // 'tests' | 'build' | 'lint' | 'typecheck' | 'custom'
  goal_pattern: string | null;
  cycle: number;
  max_cycles: number;
  failures: string[];
  started_at: string;
  session_id?: string;
  project_path?: string;
}
```

#### AutopilotState

```typescript
interface AutopilotState {
  active: boolean;
  phase: AutopilotPhase;  // 'expansion' | 'planning' | 'execution' | 'qa' | 'validation'
  iteration: number;
  max_iterations: number;
  originalIdea: string;
  expansion: AutopilotExpansion;
  planning: AutopilotPlanning;
  execution: AutopilotExecution;
  qa: AutopilotQA;
  validation: AutopilotValidation;
  started_at: string;
  completed_at: string | null;
}
```

### 6.3 状态清理规则

| 模式 | 完成时 | 取消时 | 失败时 |
|------|--------|--------|--------|
| **Ultrawork** | 不清理（无状态） | 不清理 | 不清理 |
| **Ralph** | `/cancel` 清理 | `/cancel` 清理 | 保留（可恢复） |
| **UltraQA** | 自动删除 | `/cancel` 清理 | 保留诊断 |
| **Autopilot** | 自动删除 | `/cancel` 清理 | 保留（可恢复） |

---

## 七、使用场景

### 7.1 Ultrawork 适用场景

**适合**:
- ✅ 多个独立任务可并行执行
- ✅ 需要快速完成批量修改
- ✅ 任务复杂度不高
- ✅ 用户自己管理完成状态

**不适合**:
- ❌ 需要保证完成的任务
- ❌ 需要持久化进度的任务
- ❌ 需要强制验证的任务

**示例**:
```bash
# 修复所有 TypeScript 错误
/oh-my-claudecode:ultrawork 修复所有 TypeScript 错误

# 批量添加类型注解
/oh-my-claudecode:ultrawork 为所有函数添加类型注解
```

### 7.2 Ralph 适用场景

**适合**:
- ✅ 需要保证完成的任务
- ✅ 复杂功能实现
- ✅ 需要结构化跟踪的任务
- ✅ 需要架构师验证的任务

**不适合**:
- ❌ 快速简单修复
- ❌ 探索性/实验性工作
- ❌ 需要 QA 循环的任务（用 UltraQA）

**示例**:
```bash
# 实现用户认证系统
/oh-my-claudecode:ralph 实现用户认证系统

# 重构认证模块
/oh-my-claudecode:ralph --critic=codex 重构 auth 模块
```

### 7.3 UltraQA 适用场景

**适合**:
- ✅ 修复失败的测试
- ✅ 修复构建错误
- ✅ 修复 lint 问题
- ✅ 需要多次迭代修复的问题

**不适合**:
- ❌ 新功能开发
- ❌ 需要 PRD 跟踪的任务
- ❌ 与 Ralph 同时使用

**示例**:
```bash
# 修复测试
/oh-my-claudecode:ultraqa --tests 修复所有失败的测试

# 修复构建
/oh-my-claudecode:ultraqa --build 修复构建错误
```

### 7.4 Autopilot 适用场景

**适合**:
- ✅ 从想法到成品的完整项目
- ✅ 需要需求分析的任务
- ✅ 需要多阶段协作的任务
- ✅ 用户希望全自动执行

**不适合**:
- ❌ 简单修复
- ❌ 探索性工作
- ❌ 用户希望手动控制

**示例**:
```bash
# 完整项目
/oh-my-claudecode:autopilot 做一个任务管理 API

# CLI 工具
/oh-my-claudecode:autopilot 构建一个 CLI 待办事项工具
```

---

## 八、配置参数

### 8.1 Ultrawork 配置

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| 无特定配置 | - | - | 通过 agent 选择隐式配置 |

### 8.2 Ralph 配置

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `maxIterations` | number | 10 | 最大迭代次数（超限自动 +10） |
| `criticMode` | string | `'architect'` | 审查员模式 |
| `disableUltrawork` | boolean | `false` | 禁用 Ultrawork |

**命令行标志**:
| 标志 | 说明 |
|------|------|
| `--no-prd` | 跳过 PRD 生成 |
| `--critic=architect` | 使用 Architect 审查（默认） |
| `--critic=critic` | 使用 Critic 审查 |
| `--critic=codex` | 使用 Codex CLI 审查 |
| `--no-deslop` | 跳过 AI-slop 清理 |

### 8.3 UltraQA 配置

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `maxCycles` | number | 5 | 最大 QA 循环次数 |
| `customPattern` | string | null | 自定义成功模式 |

**命令行标志**:
| 标志 | 说明 |
|------|------|
| `--tests` | 测试套件通过 |
| `--build` | 构建成功 |
| `--lint` | lint 检查通过 |
| `--typecheck` | 类型检查通过 |
| `--custom "pattern"` | 自定义成功模式 |

### 8.4 Autopilot 配置

```json
{
  "omc": {
    "autopilot": {
      "maxIterations": 10,
      "maxQaCycles": 5,
      "maxValidationRounds": 3,
      "pauseAfterExpansion": false,
      "pauseAfterPlanning": false,
      "skipQa": false,
      "skipValidation": false
    }
  }
}
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `maxIterations` | number | 10 | 最大迭代次数 |
| `maxQaCycles` | number | 5 | 最大 QA 循环次数 |
| `maxValidationRounds` | number | 3 | 最大验证轮数 |
| `pauseAfterExpansion` | boolean | false | Expansion 后暂停 |
| `pauseAfterPlanning` | boolean | false | Planning 后暂停 |
| `skipQa` | boolean | false | 跳过 QA 阶段 |
| `skipValidation` | boolean | false | 跳过验证阶段 |

---

## 九、源码架构

### 9.1 目录结构

```
src/hooks/
├── ralph/
│   ├── index.ts           # 统一导出
│   ├── loop.ts            # 循环核心（645 行）
│   ├── prd.ts             # PRD 操作（280 行）
│   ├── progress.ts        # 进度日志（450 行）
│   └── verifier.ts        # 验证流程（250 行）
│
├── ultrawork/
│   └── index.ts           # Ultrawork 状态管理
│
├── ultraqa/
│   └── index.ts           # UltraQA 循环（260 行，独立模块）
│
├── autopilot/
│   ├── index.ts           # 统一导出
│   ├── state.ts           # 状态管理（645 行）
│   ├── prompts.ts         # 提示生成（432 行）
│   ├── pipeline.ts        # Pipeline 编排（556 行）
│   ├── pipeline-types.ts  # Pipeline 类型
│   ├── validation.ts      # 验证协调
│   └── adapters/          # Stage 适配器
│       ├── ralplan-adapter.ts
│       ├── execution-adapter.ts
│       ├── ralph-adapter.ts
│       └── qa-adapter.ts
│
├── persistent-mode/
│   └── index.ts           # 持久化模式主循环（1256 行）
│
└── mode-registry/
│   └── index.ts           # 模式注册表（697 行）
```

### 9.2 Hook 触发点

| Hook 事件 | 处理函数 | 说明 |
|----------|---------|------|
| `UserPromptSubmit` | keyword-detector | 检测关键词 |
| `PostToolUse` (Skill) | processPostToolUse | Skill 工具调用 |
| `Stop` | processPersistentMode | 检查循环继续条件 |

### 9.3 关键词检测

```typescript
// 关键词优先级（从高到低）
const KEYWORD_PRIORITY = [
  'cancel',
  'ralph',
  'autopilot',
  'team',
  'ultrawork',
  'ultraqa'
];

// 检测逻辑
function getPrimaryKeyword(prompt: string): string | null {
  // 返回优先级最高的关键词
  // ralph > ultrawork（ralph 包含 ultrawork）
}
```

---

## 十、模式选择决策树

### 10.1 决策树

```
用户输入
   │
   ├─ "从想法到完整代码，全自动"
   │  └─→ Autopilot
   │       ├─ Phase 0-1: 需求分析 + 规划
   │       ├─ Phase 2: Ralph 执行（使用 Ultrawork 并行）
   │       ├─ Phase 3: UltraQA 测试（独立模块，顺序循环）
   │       └─ Phase 4: 多视角验证
   │
   ├─ "必须完成，需要验证"
   │  └─→ Ralph
   │       ├─ PRD 驱动
   │       ├─ 持久化进度
   │       ├─ 架构师验证
   │       └─ 包含 Ultrawork 并行
   │
   ├─ "修复测试/构建问题"
   │  └─→ UltraQA
   │       ├─ 测试 → 诊断 → 修复（顺序循环）
   │       ├─ 最多 5 次循环
   │       └─ 相同失败 3 次退出
   │
   └─ "并行执行多个独立任务"
      └─→ Ultrawork
            ├─ 多 Agent 同时执行
            ├─ 智能模型路由
            └─ 轻量验证
```

### 10.2 快速选择表

| 用户需求 | 推荐模式 | 理由 |
|---------|---------|------|
| 完整项目，全自动 | Autopilot | 包含所有阶段 |
| 复杂功能，保证完成 | Ralph | PRD 驱动 + 验证 |
| 修复测试 | UltraQA | 专业 QA 循环 |
| 修复构建 | UltraQA | 自动诊断修复 |
| 批量修改 | Ultrawork | 并行执行 |
| 简单修复 | 直接委托 | 无需模式开销 |
| 探索性工作 | Plan | 灵活无约束 |

### 10.3 模式能力总结

| 模式 | 一句话定位 | 核心优势 | 主要限制 |
|------|-----------|---------|---------|
| **Ultrawork** | 并行执行引擎 | 快速并行 | 无持久化 |
| **Ralph** | 持久化循环 | 保证完成 | 与 UltraQA 互斥 |
| **UltraQA** | QA 循环专家（独立） | 自动修复 | 仅 QA 场景 |
| **Autopilot** | 完整项目管道 | 全自动 | 复杂度高 |

---

## 十一、常见问题

### Q: UltraQA 是基于 Ultrawork 的吗？

**A: 不是！** UltraQA 是独立模块，不依赖 Ultrawork：
- **Ultrawork**: 并行执行多个独立任务
- **UltraQA**: 顺序执行测试→诊断→修复循环
- 两者名称相似但功能完全独立

### Q: 可以同时运行 Ralph 和 UltraQA 吗？

**A: 不可以**，两者互斥：
- Ralph 用于功能实现的持久化循环
- UltraQA 用于 QA 循环
- Autopilot 在不同阶段分别使用两者

### Q: Ultrawork 和 Ralph 有什么区别？

**A**: 
- **Ultrawork**: 只提供并行执行能力，无持久化和验证
- **Ralph**: 在 Ultrawork 基础上增加了 PRD 驱动、进度持久化和强制验证

### Q: Autopilot 的 QA 阶段和 UltraQA 一样吗？

**A: 是的**，Autopilot 的 Phase 3 直接使用 UltraQA，功能和流程完全相同。

### Q: 如何查看当前运行状态？

**A**: 查看 `.omc/state/` 目录下的状态文件：
- `ralph-state.json` - Ralph 状态
- `ultraqa-state.json` - UltraQA 状态
- `autopilot-state.json` - Autopilot 状态

### Q: 如何取消运行中的模式？

**A**: 使用 `/oh-my-claudecode:cancel` 命令。对于 Ralph，可能需要 `--force` 标志。

### Q: UltraQA 为什么和 Ralph 互斥？

**A**: 两者都是持久化循环模式：
- 同时运行会导致状态冲突（都在监听 Stop 事件）
- 验证逻辑混乱（谁负责完成判断）
- 资源竞争（都在 spawn agent）

### Q: 为什么 Ultrawork 可以和 Ralph 共存？

**A**: Ultrawork 是组件不是完整模式：
- Ultrawork 只提供并行执行能力
- Ralph 使用 Ultrawork 进行并行任务执行
- `linked_ultrawork: true` 标记为附属关系

---

## 附录

### A. 相关文件索引

#### Skill 定义
- `skills/autopilot/SKILL.md`
- `skills/ralph/SKILL.md`
- `skills/ultrawork/SKILL.md`
- `skills/ultraqa/SKILL.md`

#### 核心源码
- `src/hooks/ralph/` - Ralph 完整实现
- `src/hooks/ultrawork/` - Ultrawork 状态管理
- `src/hooks/ultraqa/` - UltraQA 循环（独立模块）
- `src/hooks/autopilot/` - Autopilot 管道
- `src/hooks/persistent-mode/` - 持久化模式主循环
- `src/hooks/mode-registry/` - 模式注册表

#### 文档
- `docs/ARCHITECTURE.md` - 整体架构
- `docs/AGENT-TIERS.md` - Agent 层级说明
- `docs/RALPH-ANALYSIS.md` - Ralph 深度分析
- `docs/WORKFLOWS-ANALYSIS.md` - 四工作流分析

### B. 执行方式对比图

```
Ultrawork（并行）:
┌─────────┐ ┌─────────┐ ┌─────────┐
│ Task A  │ │ Task B  │ │ Task C  │  ← 同时触发
└─────────┘ └─────────┘ └─────────┘
       ↓         ↓         ↓
    完成      完成      完成

UltraQA（顺序循环）:
Cycle 1:
  测试 ──→ 诊断 ──→ 修复
                      ↓
Cycle 2:
  测试 ──→ 诊断 ──→ 修复
                      ↓
                  ...重复
```

### C. 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| v4.9.3 | 2025-03-30 | 初始文档，澄清 UltraQA 独立于 Ultrawork |

---

*文档生成时间：2025-03-30*  
*基于 oh-my-claudecode v4.9.3*

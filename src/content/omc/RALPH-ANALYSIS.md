---
title: 'Ralph 完整分析文档'
lastUpdated: 2026-05-04
tags:
  - OMC
  - Ralph
  - Agent
categories:
  - o
  - m
  - c
---

# Ralph 完整分析文档

> oh-my-claudecode 持久化工作循环系统深度解析

---

## 一、概述

**Ralph** 是一个持久化工作循环（persistent work loop），会持续工作直到任务完成或通过 `/oh-my-claudecode:cancel` 显式取消。它的核心特点是：

- **PRD 驱动**: 使用 `prd.json` 结构化跟踪用户故事
- **持久化**: 跨迭代保存进度和记忆
- **强制验证**: 完成后需要架构师/审查员验证
- **自动重试**: 失败时自动继续，不轻易放弃
- **Team 协调**: 与 Team pipeline 状态联动

---

## 二、核心组件

```
src/hooks/ralph/
├── index.ts       # 统一导出模块
├── loop.ts        # 循环状态管理、PRD 集成、Team 协调
├── prd.ts         # PRD 文件操作、状态跟踪
├── progress.ts    # 进度日志 (progress.txt)
└── verifier.ts    # 架构师验证流程
```

### 文件概览

| 文件 | 行数 | 主要职责 |
|------|------|---------|
| `index.ts` | ~130 | 统一导出，重新导出所有子模块功能 |
| `loop.ts` | ~645 | Ralph 循环核心逻辑、状态管理、PRD 集成、Team 协调 |
| `prd.ts` | ~280 | PRD 文件操作、用户故事跟踪、状态格式化 |
| `progress.ts` | ~450 | progress.txt 进度日志、代码模式记忆 |
| `verifier.ts` | ~250 | 架构师验证流程、批准/拒绝检测 |

---

## 三、执行流程

```
┌─────────────────────────────────────────────────────────────┐
│                    Ralph 启动 (Skill/Keyword)                │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
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
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 1. 检查取消信号 → 如是则清理状态退出                       │ │
│ │ 2. 检查 Team 状态 → 如 Team 完成则 Ralph 完成              │ │
│ │ 3. 检查验证状态 → 如有验证在进行中                        │ │
│ │    - 检测架构师批准 → 清理状态，退出                       │ │
│ │    - 检测架构师拒绝 → 继续修复                            │ │
│ │    - 验证进行中 → 注入验证提示                            │ │
│ │ 4. 检查 PRD 完成 → 所有故事 passes:true                   │ │
│ │    - 启动验证流程 (startVerification)                     │ │
│ │ 5. 检查最大迭代次数 → 超限则扩展限制                       │ │
│ │ 6. 检查工具错误 → 注入错误修复指导                         │ │
│ │ 7. 注入继续提示 → 包含 PRD 上下文/进度记忆                  │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 2: 验证阶段 (所有 PRD 故事完成后)                        │
│ - 根据 --critic 选择审查员：                                │
│   - architect (默认): Task(subagent_type="architect")       │
│   - critic: Task(subagent_type="critic")                    │
│   - codex: omc ask codex --agent-prompt critic              │
│ - 验证 acceptance criteria                                   │
│ - 批准 → 清理状态退出                                        │
│ - 拒绝 → 返回 Phase 1 修复                                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 3: 清理                                                │
│ - 删除 ralph-state.json                                     │
│ - 删除 ultrawork-state.json (如 linked)                      │
│ - 删除 verification-state.json                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 四、状态文件

| 文件 | 用途 | 路径 |
|------|------|------|
| `ralph-state.json` | Ralph 循环状态 | `.omc/state/[sessions/{sessionId}/]ralph-state.json` |
| `prd.json` | 产品需求文档 | 项目根目录或 `.omc/prd.json` |
| `progress.txt` | 进度日志 | 项目根目录或 `.omc/progress.txt` |
| `ralph-verification.json` | 验证状态 | `.omc/state/[sessions/{sessionId}/]ralph-verification.json` |

---

## 五、核心 API

### 5.1 启动 Ralph (bridge.ts)

```typescript
// 通过 Skill 工具调用
const hook = createRalphLoopHook(directory);
hook.startLoop(sessionId, prompt, {
  criticMode: 'architect'  // 或 'critic', 'codex'
});
```

### 5.2 检查 Ralph 循环 (persistent-mode/index.ts)

```typescript
async function checkRalphLoop(
  sessionId?: string,
  directory?: string,
  cancelInProgress?: boolean
): Promise<PersistentModeResult | null>
```

**检查顺序**:
1. 取消信号检查
2. Team 状态协调
3. 验证状态检查
4. PRD 完成检查
5. 最大迭代检查
6. 工具错误检查
7. 注入继续提示

### 5.3 PRD 操作 (prd.ts)

```typescript
readPrd(directory)           // 读取 PRD
writePrd(directory, prd)     // 写入 PRD
getPrdStatus(prd)            // 获取完成状态
markStoryComplete(directory, storyId)  // 标记故事完成
getNextStory(directory)      // 获取下一个待处理故事
```

### 5.4 验证流程 (verifier.ts)

```typescript
startVerification(directory, claim, task, criticMode)
recordArchitectFeedback(directory, approved, feedback)
getArchitectVerificationPrompt(state, currentStory)
detectArchitectApproval(text)  // 检测 transcript 中的批准标记
```

---

## 六、配置参数

### Ralph 配置参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `maxIterations` | number | 10 | 最大迭代次数 (超限自动 +10) |
| `criticMode` | string | `'architect'` | 审查员模式：`architect` / `critic` / `codex` |
| `disableUltrawork` | boolean | `false` | 禁用 Ultrawork 并行执行 |
| `prdMode` | boolean | 自动检测 | 是否启用 PRD 模式 (检测到 prd.json 自动启用) |

### 命令行标志

| 标志 | 说明 |
|------|------|
| `--no-prd` | 跳过 PRD 生成，使用传统模式 |
| `--critic=architect` | 使用 Architect 审查 (默认) |
| `--critic=critic` | 使用 Critic 审查 |
| `--critic=codex` | 使用 Codex CLI 审查 |
| `--no-deslop` | 跳过强制的 AI-slop 清理步骤 |

---

## 七、数据结构

### 7.1 RalphLoopState (loop.ts)

```typescript
interface RalphLoopState {
  /** Whether the loop is currently active */
  active: boolean;
  /** Current iteration number */
  iteration: number;
  /** Maximum iterations before stopping */
  max_iterations: number;
  /** When the loop started */
  started_at: string;
  /** The original prompt/task */
  prompt: string;
  /** Session ID the loop is bound to */
  session_id?: string;
  /** Project path for isolation */
  project_path?: string;
  /** Whether PRD mode is active */
  prd_mode?: boolean;
  /** Current story being worked on */
  current_story_id?: string;
  /** Whether ultrawork is linked/auto-activated with ralph */
  linked_ultrawork?: boolean;
  /** Reviewer mode for Ralph completion verification */
  critic_mode?: RalphCriticMode;  // 'architect' | 'critic' | 'codex'
}
```

### 7.2 PRD / UserStory (prd.ts)

```typescript
interface UserStory {
  /** Unique identifier (e.g., "US-001") */
  id: string;
  /** Short title for the story */
  title: string;
  /** Full user story description */
  description: string;
  /** List of acceptance criteria that must be met */
  acceptanceCriteria: string[];
  /** Execution priority (1 = highest) */
  priority: number;
  /** Whether this story passes (complete and verified) */
  passes: boolean;
  /** Optional notes from implementation */
  notes?: string;
}

interface PRD {
  /** Project name */
  project: string;
  /** Git branch name for this work */
  branchName: string;
  /** Overall description of the feature/task */
  description: string;
  /** List of user stories */
  userStories: UserStory[];
}

interface PRDStatus {
  /** Total number of stories */
  total: number;
  /** Number of completed (passes: true) stories */
  completed: number;
  /** Number of pending (passes: false) stories */
  pending: number;
  /** Whether all stories are complete */
  allComplete: boolean;
  /** The highest priority incomplete story, if any */
  nextStory: UserStory | null;
  /** List of incomplete story IDs */
  incompleteIds: string[];
}
```

### 7.3 VerificationState (verifier.ts)

```typescript
interface VerificationState {
  /** Whether verification is pending */
  pending: boolean;
  /** The completion claim that triggered verification */
  completion_claim: string;
  /** Number of verification attempts */
  verification_attempts: number;
  /** Max verification attempts before force-accepting */
  max_verification_attempts: number;  // 默认 3
  /** Architect feedback from last verification */
  architect_feedback?: string;
  /** Whether architect approved */
  architect_approved?: boolean;
  /** Timestamp of verification request */
  requested_at: string;
  /** Original ralph task */
  original_task: string;
  /** Reviewer mode to use for verification */
  critic_mode?: RalphCriticMode;
}
```

### 7.4 ProgressEntry (progress.ts)

```typescript
interface ProgressEntry {
  /** ISO timestamp */
  timestamp: string;
  /** Story ID (e.g., "US-001") */
  storyId: string;
  /** What was implemented */
  implementation: string[];
  /** Files changed */
  filesChanged: string[];
  /** Learnings for future iterations */
  learnings: string[];
}

interface ProgressLog {
  /** Consolidated codebase patterns at top */
  patterns: CodebasePattern[];
  /** Progress entries (append-only) */
  entries: ProgressEntry[];
  /** When the log was started */
  startedAt: string;
}
```

---

## 八、与其他模式的协调

### 8.1 与 Ultrawork 联动

- Ralph 启动时自动激活 Ultrawork (`linked_ultrawork: true`)
- Ultrawork 负责并行任务执行
- Ralph 负责整体循环和验证
- **Self-heal 机制**: 如 Ultrawork 状态丢失会自动重建

```typescript
// loop.ts - Self-heal linked ultrawork
if (state.linked_ultrawork) {
  const ultraworkState = readUltraworkState(workingDir, sessionId);
  if (!ultraworkState?.active) {
    // Recreate ultrawork state
    writeUltraworkState(restoredState, workingDir, sessionId);
  }
}
```

### 8.2 与 Team Pipeline 协调

```typescript
// loop.ts - Team state influences Ralph
const teamState = readTeamPipelineState(workingDir, sessionId);
if (teamState && teamState.active !== undefined) {
  const teamPhase: TeamPipelinePhase = teamState.phase;

  // If team pipeline reached a terminal state, ralph should also complete
  if (teamPhase === 'complete') {
    clearRalphState(workingDir, sessionId);
    clearVerificationState(workingDir, sessionId);
    deactivateUltrawork(workingDir, sessionId);
    return { /* complete */ };
  }
  if (teamPhase === 'failed') {
    // Handle failure
  }
  if (teamPhase === 'cancelled') {
    // Handle cancellation
  }
}
```

### 8.3 与 Autopilot 互斥

- Autopilot 激活时不能启动 Ralph
- Autopilot 有自己的状态管理系统

```typescript
// Mutual exclusion check
if (isAutopilotActive(directory, sessionId)) {
  console.error("Cannot start Ralph Loop while Autopilot is active.");
  return false;
}
```

---

## 九、Hook 触发点

| Hook 事件 | 处理函数 | 说明 |
|----------|---------|------|
| `UserPromptSubmit` | keyword-detector | 检测 "ralph" 关键词 |
| `PostToolUse` (Skill) | processPostToolUse | Skill("oh-my-claudecode:ralph") 启动 |
| `Stop` | processPersistentMode | 检查循环继续条件 |

---

## 十、验证流程详解

```
PRD 所有故事完成
       │
       ▼
┌──────────────────────────────┐
│ startVerification()          │
│ - 创建 verification-state    │
│ - 设置 pending: true         │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ 注入验证提示                  │
│ - 包含 acceptance criteria   │
│ - 指定审查员类型              │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ 检测 transcript 中的响应       │
│ - detectArchitectApproval()  │
│ - detectArchitectRejection() │
└──────────────┬───────────────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
   批准             拒绝
       │                │
       ▼                ▼
  清理状态         recordArchitectFeedback()
  退出 Ralph          │
                      │
                      ▼
                 继续修复
                      │
                      └──────→ 返回验证步骤
```

### 验证提示示例 (verifier.ts)

```typescript
function getArchitectVerificationPrompt(state, currentStory) {
  return `<ralph-verification>

[ARCHITECT VERIFICATION REQUIRED - Attempt ${state.verification_attempts + 1}/${state.max_verification_attempts}]

**Original Task:**
${state.original_task}

**Completion Claim:**
${state.completion_claim}

## MANDATORY VERIFICATION STEPS

1. **Spawn Architect Agent** for verification:
   \`\`\`
   Task(subagent_type="architect", prompt="Verify this task completion claim...")
   \`\`\`

2. **Architect must check:**
   - Verify EACH acceptance criterion is met with fresh evidence
   - Run the relevant tests/builds to confirm criteria pass
   - Are ALL requirements from the original task met?
   - Is the implementation complete, not partial?

3. **Based on Architect's response:**
   - If APPROVED: Output <ralph-approved>VERIFIED_COMPLETE</ralph-approved>
   - If REJECTED: Continue working on the identified issues

</ralph-verification>`;
}
```

---

## 十一、关键设计决策

### 1. 取消优先
检测到 `/cancel` 命令时立即停止，不强制继续。使用 cancel signal TTL (30 秒) 防止竞态条件。

### 2. 迭代扩展
达到最大迭代次数时自动 +10，而不是强制停止：
```typescript
if (state.iteration >= state.max_iterations) {
  state.max_iterations += 10;
  writeRalphState(workingDir, state, sessionId);
}
```

### 3. 验证强制
PRD 完成后必须经过审查员验证才能退出，防止过早声明完成。

### 4. Session 隔离
每个 sessionId 有独立的状态文件，防止多会话冲突：
```typescript
// Strict session isolation
if (state.session_id !== sessionId) {
  return null;
}
```

### 5. Self-heal
检测到 linked Ultrawork 状态丢失时自动重建，防止 stop reinforcement 消失。

### 6. 工具错误追踪
记录最近工具错误 (60 秒 TTL) 并注入修复指导：
```typescript
const toolError = readLastToolError(workingDir);
const errorGuidance = getToolErrorRetryGuidance(toolError);
```

### 7. 多审查员支持
支持三种审查员模式，通过 `--critic=<mode>` 标志选择：
- `architect` (默认): 使用 Claude Architect agent
- `critic`: 使用 Claude Critic agent
- `codex`: 使用外部 Codex CLI

---

## 十二、PRD 模式详解

### PRD 示例文件

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
    },
    {
      "id": "US-002",
      "title": "Add auth middleware",
      "description": "Protect API routes with JWT verification",
      "acceptanceCriteria": [
        "Middleware verifies JWT token signature",
        "Protected routes return 401 without valid token",
        "User ID extracted from token and added to request"
      ],
      "priority": 2,
      "passes": false
    }
  ]
}
```

### PRD 状态格式化

```typescript
function formatPrdStatus(status: PRDStatus): string {
  return `[PRD Status: ${status.completed}/${status.total} stories complete]

${status.allComplete 
  ? 'All stories are COMPLETE!' 
  : `Remaining: ${status.incompleteIds.join(', ')}
Next story: ${status.nextStory?.id} - ${status.nextStory?.title}`}`;
}
```

---

## 十三、进度日志格式

### progress.txt 示例

```
# Ralph Progress Log
Started: 2025-03-30T10:00:00.000Z

## Codebase Patterns
- API routes are defined in src/routes/*.ts
- Tests use vitest and are co-located with source files
- Database migrations are in db/migrations/

---

## [2025-03-30 10:15] - US-001

**What was implemented:**
- Added JWT token generation in src/auth/jwt.ts
- Created login endpoint POST /auth/login
- Added password hashing with bcrypt

**Files changed:**
- src/auth/jwt.ts (new)
- src/routes/auth.ts
- package.json

**Learnings for future iterations:**
- Use process.env.JWT_SECRET for token signing
- Password salt rounds: 10

---
```

---

## 十四、相关文件索引

### 核心源码
- `src/hooks/ralph/index.ts` - 统一导出
- `src/hooks/ralph/loop.ts` - 循环核心
- `src/hooks/ralph/prd.ts` - PRD 操作
- `src/hooks/ralph/progress.ts` - 进度日志
- `src/hooks/ralph/verifier.ts` - 验证流程

### 集成点
- `src/hooks/bridge.ts` - Hook 桥接
- `src/hooks/persistent-mode/index.ts` - 持久化模式主循环
- `src/hooks/ultrawork/index.ts` - Ultrawork 联动
- `src/hooks/team-pipeline/state.ts` - Team 状态协调

### Skill 定义
- `skills/ralph/SKILL.md` - Ralph 技能文档

### 状态管理
- `src/lib/mode-state-io.ts` - 模式状态读写
- `src/lib/worktree-paths.ts` - 工作目录路径解析

---

## 十五、常见问题

### Q: Ralph 和 Ultrawork 有什么区别？

**A:** 
- **Ultrawork**: 简单的并行执行 + 自我强化循环
- **Ralph**: PRD 驱动 + 结构化跟踪 + 强制验证 + Ultrawork 联动

### Q: 如何跳过 PRD 模式？

**A:** 使用 `--no-prd` 标志：
```
/oh-my-claudecode:ralph --no-prd fix the login bug
```

### Q: 如何更换审查员？

**A:** 使用 `--critic=<mode>` 标志：
```
/oh-my-claudecode:ralph --critic=codex build the API
```

### Q: Ralph 什么时候会停止？

**A:** 仅在以下情况停止：
1. 用户执行 `/oh-my-claudecode:cancel`
2. 审查员验证通过
3. Team pipeline 完成/失败/取消
4. 达到最大迭代次数 (会自动扩展)

### Q: 如何查看当前进度？

**A:** 查看以下文件：
- `.omc/state/ralph-state.json` - 当前迭代次数
- `.omc/prd.json` - PRD 故事状态
- `.omc/progress.txt` - 详细进度日志

---

## 十六、总结

Ralph 是 oh-my-claudecode 中最强大的持久化执行模式，通过以下机制确保任务完成：

1. **PRD 驱动**: 结构化需求跟踪
2. **强制验证**: 完成后必须经过审查
3. **持久化**: 跨迭代保存进度和记忆
4. **Self-heal**: 自动修复丢失的状态
5. **Team 协调**: 与 Team pipeline 联动
6. **多审查员**: 支持 architect/critic/codex

适用于需要** guaranteed completion**的复杂任务场景。

---

*文档生成时间：2025-03-30*
*基于 oh-my-claudecode v4.9.3*

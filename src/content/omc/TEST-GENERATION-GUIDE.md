---
title: '使用 Ralph/Autopilot 生成测试用例完整指南'
lastUpdated: 2026-05-04
tags:
  - OMC
  - Ralph
  - 测试
categories:
  - o
  - m
  - c
---

# 使用 Ralph/Autopilot 生成测试用例完整指南

> OMC 测试用例生成权威教程

**版本**: v4.9.3  
**更新时间**: 2025-03-30

---

## 一、概述

### 1.1 两种模式对比

| 特性 | Ralph | Autopilot |
|------|-------|-----------|
| **定位** | PRD 驱动的持久化循环 | 完整自主执行管道 |
| **适用场景** | 保证完成的测试任务 | 从想法到测试的全流程 |
| **执行阶段** | 单阶段（PRD 驱动） | 5 阶段（Expansion→Planning→Execution→QA→Validation） |
| **测试验证** | 架构师验证 | UltraQA + 多视角验证 |
| **复杂度** | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **运行时长** | 中长 | 长 |

### 1.2 选择建议

| 需求 | 推荐模式 |
|------|---------|
| 为现有代码添加测试覆盖 | **Ralph** |
| 新功能 + 测试完整流程 | **Autopilot** |
| 修复失败测试 | UltraQA |
| 快速编写单个测试 | test-engineer Agent |

---

## 二、Ralph 模式生成测试用例

### 2.1 基础用法

```bash
# 基础命令
/oh-my-claudecode:ralph 为 src/auth 模块编写完整的测试覆盖

# 指定审查员
/oh-my-claudecode:ralph --critic=architect 为 src/utils 编写单元测试

# 跳过 PRD 模式（简单任务）
/oh-my-claudecode:ralph --no-prd 修复 login.test.ts 中的失败测试

# 跳过 AI-slop 清理
/oh-my-claudecode:ralph --no-deslop 为 API 端点添加集成测试
```

### 2.2 完整工作流程

```
┌─────────────────────────────────────────────────────────────┐
│ Phase 0: PRD 设置                                            │
│ 1. 检查 prd.json 是否存在                                    │
│ 2. 自动生成脚手架或读取现有 PRD                               │
│ 3. ⭐ 关键：细化验收标准（从通用→具体）                       │
│ 4. 初始化 progress.txt                                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 1: 选择下一个用户故事                                   │
│ - 读取 prd.json                                              │
│ - 选择优先级最高且 passes: false 的故事                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 2: 实现当前故事                                         │
│ - 委托给 test-engineer 编写测试                               │
│ - 并行执行独立测试任务                                        │
│ - 后台运行测试套件（run_in_background: true）                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 3: 验证验收标准                                         │
│ - 运行测试验证每个验收标准                                    │
│ - 读取测试输出确认通过                                        │
│ - 未通过 → 继续修复                                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 4: 标记故事完成                                         │
│ - 设置 passes: true                                          │
│ - 记录 progress.txt                                          │
│ - 检查是否所有故事完成                                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 5: 审查员验证                                          │
│ - Architect/Critic/Codex 验证                                │
│ - 针对 PRD 中的具体验收标准                                   │
│ - 批准 → 完成 / 拒绝 → 修复                                   │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 PRD 示例（测试用例生成）

**文件**: `.omc/prd.json`

```json
{
  "project": "Auth Module Test Coverage",
  "branchName": "test/auth-coverage",
  "description": "为认证模块添加完整的测试覆盖",
  "userStories": [
    {
      "id": "US-001",
      "title": "登录功能单元测试",
      "description": "为 login.ts 编写完整的单元测试",
      "acceptanceCriteria": [
        "测试文件位于 __tests__/auth/login.test.ts",
        "覆盖成功登录场景（有效凭据返回 token）",
        "覆盖失败登录场景（无效凭据抛出错误）",
        "覆盖边界条件（空密码、超长用户名）",
        "所有测试通过（npm test -- auth）",
        "测试覆盖率 > 80%"
      ],
      "priority": 1,
      "passes": false
    },
    {
      "id": "US-002",
      "title": "JWT token 验证测试",
      "description": "为 token 验证逻辑编写测试",
      "acceptanceCriteria": [
        "测试有效 token 返回解码后的 payload",
        "测试过期 token 抛出 TokenExpiredError",
        "测试无效签名抛出 JsonWebTokenError",
        "测试缺失 token 返回 null",
        "所有测试通过"
      ],
      "priority": 2,
      "passes": false
    },
    {
      "id": "US-003",
      "title": "集成测试",
      "description": "编写端到端集成测试",
      "acceptanceCriteria": [
        "测试完整的登录→访问→登出流程",
        "模拟数据库连接失败场景",
        "测试并发登录请求处理",
        "集成测试通过"
      ],
      "priority": 3,
      "passes": false
    }
  ]
}
```

### 2.4 progress.txt 示例

```
# Ralph Progress Log
Started: 2025-03-30T10:00:00.000Z

## Codebase Patterns
- 项目使用 Jest 测试框架
- 测试文件位于 __tests__/ 目录
- 使用 describe/it 结构组织测试
- Mock 数据位于 __mocks__/ 目录

---

## [2025-03-30 10:30] - US-001

**What was implemented:**
- 创建 __tests__/auth/login.test.ts
- 编写 15 个测试用例覆盖登录逻辑
- 添加 mock 用户数据

**Files changed:**
- __tests__/auth/login.test.ts (new)
- __mocks__/users.ts (modified)

**Learnings for future iterations:**
- 使用 beforeEach 清理共享状态
- Mock 数据库调用避免真实连接
- 测试名称描述预期行为

---

## [2025-03-30 11:00] - US-002

**What was implemented:**
- 创建 __tests__/auth/token.test.ts
- 覆盖 token 验证的所有边界情况

**Files changed:**
- __tests__/auth/token.test.ts (new)

**Learnings for future iterations:**
- 使用 jest.useFakeTimers() 测试过期逻辑
- Token 测试需要 mock 系统时间

---
```

### 2.5 实际使用示例

```bash
# 示例 1: 为现有模块添加测试
/oh-my-claudecode:ralph 为 src/services/payment 模块编写完整的测试覆盖，
目标覆盖率 80%，包括单元测试和集成测试

# 示例 2: 修复失败测试
/oh-my-claudecode:ralph --no-prd 修复 auth.test.ts 中失败的 3 个测试，
运行 npm test -- auth 验证

# 示例 3: 编写特定功能测试
/oh-my-claudecode:ralph 为用户注册功能编写 TDD 测试，
覆盖：邮箱验证、密码强度、重复注册检测

# 示例 4: 使用 Codex 审查
/oh-my-claudecode:ralph --critic=codex 为 API 端点编写集成测试，
使用 Codex 进行最终验证
```

---

## 三、Autopilot 模式生成测试用例

### 3.1 基础用法

```bash
# 完整测试流程
/oh-my-claudecode:autopilot 为项目添加完整的测试覆盖，
包括单元测试、集成测试和 e2e 测试

# 指定测试框架
/oh-my-claudecode:autopilot 使用 Jest 为 TypeScript 项目编写测试，
目标覆盖率 90%

# 跳过 QA 阶段（不推荐）
/oh-my-claudecode:autopilot --skip-qa 为工具函数添加测试

# 配置参数
编辑 .claude/settings.json:
{
  "omc": {
    "autopilot": {
      "maxQaCycles": 5,
      "maxValidationRounds": 3,
      "skipQa": false,
      "skipValidation": false
    }
  }
}
```

### 3.2 完整工作流程

```
┌─────────────────────────────────────────────────────────────┐
│ Phase 0: Expansion (需求分析)                                │
│ - Analyst: 分析现有代码和测试模式                             │
│ - Architect: 创建测试技术规格                                 │
│ - 输出：.omc/autopilot/spec.md                               │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 1: Planning (规划)                                     │
│ - Architect: 创建测试实现计划                                 │
│ - Critic: 验证测试计划                                        │
│ - 输出：.omc/plans/autopilot-impl.md                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 2: Execution (执行)                                    │
│ - 使用 Ralph + Ultrawork                                     │
│ - test-engineer 编写测试                                     │
│ - 并行执行独立测试任务                                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 3: QA (质量保证) ← UltraQA                             │
│ - 运行测试套件                                               │
│ - 失败 → Architect 诊断 → 修复                                │
│ - 重复最多 5 次循环                                            │
│ - 相同失败 3 次 → 退出并报告根因                               │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 4: Validation (验证)                                   │
│ - Architect: 功能完整性（测试覆盖所有功能）                   │
│ - Security-reviewer: 安全测试（边界条件、注入）               │
│ - Code-reviewer: 测试质量（命名、结构、独立性）               │
│ - 全部批准 → 完成                                            │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 spec.md 示例

**文件**: `.omc/autopilot/spec.md`

```markdown
# 测试覆盖规格

## 项目分析

**当前状态**:
- 测试覆盖率：35%
- 测试框架：Jest + Testing Library
- 测试位置：__tests__/
- 主要问题：核心业务逻辑缺少测试

## 测试目标

**覆盖率目标**:
- 单元测试：70%
- 集成测试：50%
- e2e 测试：关键路径 100%

**优先级模块**:
1. src/auth/ - 认证逻辑（最高优先级）
2. src/payment/ - 支付处理（高优先级）
3. src/utils/ - 工具函数（中优先级）

## 技术规格

**测试框架**:
- 单元测试：Jest
- 集成测试：Jest + Supertest
- e2e 测试：Playwright

**Mock 策略**:
- 数据库：jest.mock('prisma')
- API 调用：msw
- 文件系统：memfs

**覆盖率工具**:
- istanbul/nyc
- 报告格式：lcov + html
```

### 3.4 实际使用示例

```bash
# 示例 1: 完整测试项目
/oh-my-claudecode:autopilot 为电商平台项目添加完整的测试覆盖，
包括：
- 用户认证（登录、注册、权限）
- 商品管理（CRUD、搜索、过滤）
- 订单处理（创建、支付、发货）
- 支付集成（Stripe mock）
目标覆盖率 80%，使用 Jest 和 Playwright

# 示例 2: API 测试
/oh-my-claudecode:autopilot 为 REST API 编写完整的测试套件，
包括单元测试、集成测试和端到端测试，
使用 Supertest 和 Jest

# 示例 3: React 组件测试
/oh-my-claudecode:autopilot 为 React 组件库编写测试，
使用 React Testing Library 和 Jest，
覆盖所有组件的渲染、交互和边界情况

# 示例 4: 数据库测试
/oh-my-claudecode:autopilot 为 Prisma 数据库操作编写测试，
包括单元测试和集成测试，
使用测试数据库和事务回滚
```

---

## 四、配置选项

### 4.1 Ralph 配置

```jsonc
// .claude/settings.json
{
  "omc": {
    "ralph": {
      "maxIterations": 10,        // 最大迭代次数
      "criticMode": "architect",  // 审查员模式：architect/critic/codex
      "disableUltrawork": false   // 禁用 Ultrawork 并行
    }
  }
}
```

### 4.2 Autopilot 配置

```jsonc
// .claude/settings.json
{
  "omc": {
    "autopilot": {
      "maxIterations": 10,
      "maxQaCycles": 5,
      "maxValidationRounds": 3,
      "pauseAfterExpansion": false,  // Expansion 后暂停
      "pauseAfterPlanning": false,   // Planning 后暂停
      "skipQa": false,               // 跳过 QA
      "skipValidation": false        // 跳过验证
    }
  }
}
```

### 4.3 命令行标志

| 标志 | 模式 | 说明 |
|------|------|------|
| `--no-prd` | Ralph | 跳过 PRD 生成 |
| `--critic=<mode>` | Ralph | 指定审查员：architect/critic/codex |
| `--no-deslop` | Ralph | 跳过 AI-slop 清理 |
| `--skip-qa` | Autopilot | 跳过 QA 阶段 |
| `--skip-validation` | Autopilot | 跳过验证阶段 |

---

## 五、最佳实践

### 5.1 PRD 编写技巧

**差的验收标准**（通用、不可验证）:
```json
{
  "acceptanceCriteria": [
    "测试完成",
    "代码能运行",
    "没有错误"
  ]
}
```

**好的验收标准**（具体、可验证）:
```json
{
  "acceptanceCriteria": [
    "测试文件位于 __tests__/auth/login.test.ts",
    "覆盖 5 个成功登录场景",
    "覆盖 3 个失败登录场景",
    "npm test -- auth 全部通过",
    "覆盖率报告 > 80%"
  ]
}
```

### 5.2 测试命名规范

```typescript
// ❌ 差的命名
it('should work', () => {});
it('test login', () => {});

// ✅ 好的命名（描述预期行为）
it('returns JWT token when credentials are valid', () => {});
it('throws AuthenticationError when password is incorrect', () => {});
it('returns empty array when no users match filter', () => {});
```

### 5.3 测试金字塔

```
        /\
       /  \      e2e (10%)
      /----\     关键用户路径
     /      \
    /--------\   集成 (20%)
   /          \  API + 数据库
  /------------\
 /              \  单元 (70%)
/----------------\ 函数/类级别
```

### 5.4 TDD 循环

```
1. RED: 编写失败的测试
   ↓
2. GREEN: 编写刚好通过的代码
   ↓
3. REFACTOR: 重构优化
   ↓
4. 重复下一个测试
```

---

## 六、常见问题

### Q1: Ralph 和 Autopilot 哪个更适合生成测试？

**A**: 
- **Ralph**: 适合为现有代码添加测试覆盖，PRD 驱动保证完成
- **Autopilot**: 适合新项目或完整测试流程，包含 QA 循环

### Q2: 如何指定测试框架？

**A**: 在 prompt 中明确指定：
```bash
/oh-my-claudecode:ralph 使用 Jest 为项目编写测试
/oh-my-claudecode:autopilot 使用 pytest 为 Python 项目编写测试
```

### Q3: 如何设置覆盖率目标？

**A**: 在 PRD 的验收标准中指定：
```json
{
  "acceptanceCriteria": [
    "单元测试覆盖率 > 80%",
    "关键模块覆盖率 > 90%"
  ]
}
```

### Q4: 测试失败怎么办？

**A**: 
- **Ralph**: 自动继续修复，直到测试通过
- **Autopilot**: UltraQA 循环自动修复（最多 5 次）

### Q5: 如何查看进度？

**A**: 
- 查看 `.omc/prd.json` - PRD 故事状态
- 查看 `.omc/progress.txt` - 详细进度日志
- 查看 `.omc/state/ralph-state.json` - 当前迭代

### Q6: 如何取消？

**A**: 
```bash
/oh-my-claudecode:cancel
```

### Q7: 可以中途暂停吗？

**A**: 
- **Ralph**: 可以，进度保存在 prd.json 和 progress.txt
- **Autopilot**: 可以，使用 `pauseAfterExpansion` 或 `pauseAfterPlanning`

---

## 七、完整示例

### 7.1 使用 Ralph 为 Auth 模块添加测试

```bash
# 启动 Ralph
/oh-my-claudecode:ralph 为 src/auth 模块编写完整的测试覆盖

# 系统自动生成 PRD 脚手架
# 用户细化验收标准...

# Ralph 开始执行:
# Iteration 1: US-001 登录测试
# - test-engineer 编写 login.test.ts
# - 运行测试验证
# - 标记 passes: true

# Iteration 2: US-002 Token 测试
# ...

# Iteration 3: US-003 集成测试
# ...

# 所有故事完成 → Architect 验证
# 验证通过 → /cancel 清理状态
```

### 7.2 使用 Autopilot 完整测试项目

```bash
# 启动 Autopilot
/oh-my-claudecode:autopilot 为电商平台项目添加完整的测试覆盖

# Phase 0: Expansion
# - Analyst 分析现有代码
# - Architect 创建测试规格

# Phase 1: Planning
# - Architect 创建测试计划
# - Critic 验证计划

# Phase 2: Execution (Ralph)
# - 编写单元测试
# - 编写集成测试
# - 编写 e2e 测试

# Phase 3: QA (UltraQA)
# - 运行测试套件
# - 失败 → 诊断 → 修复（最多 5 次）

# Phase 4: Validation
# - Architect: 功能完整性
# - Security-reviewer: 安全测试
# - Code-reviewer: 测试质量

# 完成 → 清理状态
```

---

## 八、总结

### 模式选择决策树

```
需要生成测试用例？
    │
    ├─ 为现有代码添加测试覆盖
    │  └─→ Ralph
    │
    ├─ 新项目完整测试流程
    │  └─→ Autopilot
    │
    ├─ 修复失败测试
    │  └─→ UltraQA
    │
    └─ 快速编写单个测试
       └─→ test-engineer Agent
```

### 核心优势

| 模式 | 核心优势 |
|------|---------|
| **Ralph** | PRD 驱动、保证完成、审查员验证 |
| **Autopilot** | 完整流程、QA 循环、多视角验证 |

### 关键要点

1. **PRD 是关键**: 具体的验收标准决定测试质量
2. **验证不可少**: Ralph 的审查员、Autopilot 的多视角验证
3. **QA 循环**: Autopilot 的 UltraQA 自动修复失败测试
4. **进度持久**: 取消后可恢复，进度不丢失

---

*文档生成时间：2025-03-30*  
*基于 oh-my-claudecode v4.9.3*

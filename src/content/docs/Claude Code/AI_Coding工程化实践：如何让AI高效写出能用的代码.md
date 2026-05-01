---
title: AI Coding工程化实践：如何让AI高效写出能用的代码
skill_id: 18800155
generated: 2026-05-02T00:17:48.694728
original_url: https://mp.weixin.qq.com/s/yuLPF78t2iXXvDxm1IaUvQ
---
本文基于 COLA 5.0 + Spring Boot 3.x 项目的落地经验，总结 AI 协同编码的上下文工程方法论。

![Image](https://raw.githubusercontent.com/chenzhenyang/images/master/litercrawler/ai_coding_0.png)

## 写在前面

团队从 25 年初开始把 AI 引入日常开发。一开始百花齐放——有人用 Copilot，有人用 Cursor，有人用通义灵码，还有人直接对着 ChatGPT 贴代码。各写各的，确实快了不少。

问题出在合代码的时候。同一个项目里，A 同学的 AI 生成了 `@Autowired` 字段注入，B 同学的 AI 用了构造器注入；一个用了 Hutool 的 `BeanUtil`，另一个用了 Spring 的 `BeanUtils`；DTO 后缀有人写 `Dto`，有人写 `DTO`。每个人的代码单独看都没问题，合在一起就是一锅粥。Review 的时候要挨个纠正风格，测试的时候又因为各种工具类版本不一致出 Bug。

**用了 AI 好像提效了，带来的额外 Review 和测试成本又好像没提效。**

后来我们逐步收拢到 Claude 体系（Cursor + Claude CLI），工具统一了，但问题本质没变——AI 依然不知道我们项目的规矩。每次对话都像跟一个新来的实习生合作：能力不差，但不了解工程的架构约束、命名惯例和代码风格，每次都得手把手纠正。

这篇文章就是讲我们怎么系统性地解决这个问题的。核心思路一句话：**别指望 AI 猜对你的项目规范，直接把规范喂给它。**

##  一、根因：上下文缺失

先看一个典型场景。让 AI 写一个 Service 类，生成的代码：

  1. 用了 `@Autowired` 字段注入 —— 项目统一用构造器注入

  2. DTO 后缀写成了 `Dto` —— 项目规范是全大写 `DTO`

  3. Convertor 用了 Spring Bean 注入 —— 项目用 MapStruct `INSTANCE` 单例

  4. 直接注入了 Mapper —— 违反了 COLA 分层，必须走 Gateway




每一处都不是大问题，但加起来，AI 的效率优势被修正成本吃掉了大半。

根因不是 AI 不够聪明，而是 **AI 缺少你项目的上下文** 。这个问题在多人协同时被成倍放大——每个人跟 AI 的对话都是独立的，AI 每次都从零推断，生成的代码风格自然不一致。

**上下文工程（Context Engineering）** 就是解决这个问题的系统方法：让 AI 在生成代码前，自动获得足够且精准的项目知识。

## 二、三层上下文模型
    
    
      
    
    
    
    L0 项目级─ 全局认知（自动加载） 载体：CLAUDE.md  
    L1 文件级─按需注入（匹配触发）载体：Cursor Rules / 子目录 CLAUDE.md/MEMORY.md  
    L2  任务级─ 手动提供（单次对话）载体：对话中 @ 引用
    
    
      
    

| 层级  | 解决什么问题            | 触发方式     | 维护频率     |
|-----|-------------------|----------|----------|
| L0  | AI 不知道项目全貌        | 每次对话自动加载 | 随项目演进更新  |
| L1  | AI 不知道当前文件该遵循什么规范 | 文件匹配自动注入 | 规范稳定后很少改 |
| L2  | AI 不知道本次任务的具体需求   | 开发者手动提供  | 每次对话     |



L0 提供全局认知，L1 过滤噪音聚焦当前分层，L2 指定具体目标。逐层收窄，精度递增。

## 三、L0：项目级上下文 —— AI 的"新人入职文档"

##   


### 1\. 定位

L0 就是 AI 的"新人入职文档"。载体是项目根目录的 `CLAUDE.md`，Cursor 和 Claude CLI 都会自动读取。

设计标准：**一个新同事读完能独立开始开发。**

###  2\. 推荐结构
    
    
      
    

CODEBLOCK-PLACEHOLDER-0

两个关键点：

  * **"已实现模块清单"必须保鲜。** 这是 AI 的项目地图。AI 知道"税率查询已经实现了"，开发新模块时就会去参考已有实现，而不是从零推导。



  * **编码规范只放索引，不放全文。** 细节由 L1 按需注入，全堆在 L0 只会稀释注意力。

  





### 3\. 瘦身：从 858 行到 422 行

初期我们把所有东西都堆在 CLAUDE.md 里——项目知识、全部编码规范、代码模板，858 行。能用，但信噪比很差：编辑 Mapper 时 MQ 消费者模板也在上下文里，编辑 Controller 时 MapStruct 规范也在上下文里。

引入 L1 后做了一次系统瘦身：

| 内容类型                                 | 处理方式                            |
|--------------------------------------|---------------------------------|
| 跨层通用规范（架构约束、响应格式、编码风格）               | 迁到 L1 的 alwaysApply 规则，L0 留一行摘要 |
| 分层专属规范（Controller 模板、GatewayImpl 模板） | 迁到 L1 对应 glob 规则，L0 删除          |
| 重复内容                                 | 合并去重                            |
| 已实现模块清单                              | 保留，这是 AI 的项目地图                  |



结果：858 行 → 422 行。**L0 从"百科全书"变成了"概览索引"。**

##  四、L1：文件级上下文 —— 精准注入，消除噪音

##   


### 1\. 为什么需要 L1

L0 让 AI 知道了项目全貌，但编辑一个 GatewayImpl 时，Controller 规范、MQ 规范、DTO 命名规范全在上下文里，注意力被稀释。

L1 的价值就是 **按需注入** ——编辑什么类型的文件，就只加载对应规范。

Cursor 和 Claude CLI 的实现机制不同，在这里分开说。

### 2\. Cursor 环境：glob 规则

###   


Cursor 通过 `.cursor/rules/*.mdc` 实现 L1，规则分两类。

alwaysApply 规则（始终注入，替代 L0 中的全量编码规范）：

CODEBLOCK-PLACEHOLDER-1

**glob 规则** （按文件路径匹配注入）：

CODEBLOCK-PLACEHOLDER-2

3 个 alwaysApply + 7 个 glob = **10 个规则文件**。

实际效果：编辑 `TaxRateGatewayImpl.java` 时，注入 3 个 alwaysApply + `infrastructure-impl.mdc`，约 180 行精准上下文，而不是 858 行全量 CLAUDE.md。

### 3\. Claude CLI 环境：子目录 CLAUDE.md + MEMORY.md

Claude CLI 没有 glob 机制，靠两个能力实现 L1。

**子目录 CLAUDE.md 自动拾取：** Claude CLI 会自动加载从项目根到当前文件路径上所有层级的 CLAUDE.md。

CODEBLOCK-PLACEHOLDER-3

编辑 `infrastructure/` 下的文件时，自动加载根 `CLAUDE.md` \+ `infrastructure/CLAUDE.md`。粒度比 Cursor 的 glob 粗一些，但跟 COLA 目录结构天然契合。

**MEMORY.md：** 子目录 CLAUDE.md 覆盖了分层专属规范，但跨层通用规范（架构约束、响应格式、编码风格）没地方放——Cursor 靠 `alwaysApply: true` 解决，Claude CLI 没这个机制。

解决方案：在项目根放 `MEMORY.md`，把 10 个规则文件按逻辑分组整合为 9 章（adapter-web + adapter-mq 合并为一节）：

CODEBLOCK-PLACEHOLDER-4

**CLAUDE.md 回答"项目是什么"，MEMORY.md 回答"代码怎么写"。** Claude CLI 使用时 `@MEMORY.md` 手动加载，或合并到 CLAUDE.md 自动加载。

### 4\. 规则编写三原则

###   


  1. **基于现有代码，不是基于理想规范。** 项目用 `INSTANCE` 单例就写单例，别因为"Spring 注入更主流"就改。一个项目两种风格，比统一用"不完美"的风格更害人。

  2. **给模板，不给原则。** "应该用构造器注入"不如直接给一个完整的 GatewayImpl 模板。AI 擅长模仿，不擅长从抽象原则推导。

  3. **每个规则 30-80 行。** 太短没有价值，太长又回到了 L0 的噪音问题。一个规则文件就解决一个分层/一个组件类型的规范。




* * *

## 五、L2：任务级上下文—— 开发者在每次对话中手动提供的任务相关信息。

L0 和 L1 是 AI 自动获取的"被动上下文"，L2 是开发者每次对话手动提供的"主动上下文"。

### 5\. 标准提问结构

CODEBLOCK-PLACEHOLDER-5

三个关键要素：

  * **场景类型** —— CLAUDE.md 中定义了 A/B/C 三种开发场景，每种有标准步骤序列。告诉 AI 是哪种，它就知道要创建哪些文件、按什么顺序。

  * **参考实现** —— 投入产出比最高的动作。AI 看着范本模仿的错误率，比从文字规范推导低一个数量级。

  * **需求文档** —— 接口的输入输出、字段定义、业务规则。

  





### 6\. 金牌参考实现

在项目中选 1-2 个实现最完整的模块当 AI 的模仿范本：

| 金牌模块                 | 覆盖场景           | 价值                  |
|----------------------|----------------|---------------------|
| 税率模块（TaxRate）        | 纯查询 + 远程调用+持久化 | 完整链路，3 个 Convertor  |
| 开票申请模块（InvoiceApply） | MQ 消费 + 持久化    | Consumer 模板、主子表批量插入 |



这里的核心思路是 **把"自由发挥"变成"按步骤执行"** 。AI 不需要每次从零规划路径，按场景模板走就行。团队里每个人用同样的场景定义和参考实现跟 AI 对话，生成的代码风格自然就一致了。

* * *

## 六、Cursor 与 Claude CLI 配置对照

### 1\. 层级映射

| 层级                 | Cursor                  | Claude CLI              |
|--------------------|-------------------------|-------------------------|
| **L0**             |  根 `CLAUDE.md`（~422 行）  | 根 `CLAUDE.md`（同一文件）     |
| **L1-alwaysApply** | `.mdc` alwaysApply（3 个） | `MEMORY.md` 对应章节        |
| **L1-分层**          | `.mdc` glob 匹配（7 个）     | 子目录 `CLAUDE.md`（4 个）    |
| **L1-整合**          |  自动注入，无需操作              | `MEMORY.md`（9 章整合，手动加载） |
| **L2**             | ` @` 引用                 | `@` 引用 / `/add`         |
| **个人偏好**           |  User Rules             | `~/.claude/CLAUDE.md`   |
| **持久记忆**           |  —                      | `/memory`               |
| **命令白名单**          |  —                      | `.claude/settings.json` |



Cursor 的 glob 更精准（能区分 `**/convertor/**` 和 `**/gateway/**`），alwaysApply 自动生效。Claude CLI 粒度稍粗，跨层规范需要通过 MEMORY.md 手动加载。实际差距不大，COLA 分层本身就是按目录组织的。

### 2\. 并行维护

两端内容一致，载体不同。规范变更时同步更新：

| Cursor                                | Claude CLI                                   | 说明        |
|---------------------------------------|----------------------------------------------|-----------|
| `cola-architecture.mdc`               | `MEMORY.md` §2                               | 架构约束      |
| `api-response.mdc`                    | `MEMORY.md` §3                               | 响应格式      |
| `java-coding-style.mdc`               | `MEMORY.md` §4                               | 编码风格      |
| `adapter-web.mdc` \+ `adapter-mq.mdc` | `adapter/CLAUDE.md` \+ `MEMORY.md` §5        | 适配层       |
| `application-service.mdc`             | `application/CLAUDE.md` \+ `MEMORY.md` §6    | 应用层       |
| `domain-layer.mdc`                    | `domain/CLAUDE.md` \+ `MEMORY.md` §7         | 领域层       |
| `infrastructure-impl.mdc`             | `infrastructure/CLAUDE.md` \+ `MEMORY.md` §8 | 基础设施层     |
| `mapstruct-convertor.mdc`             | `MEMORY.md` §9                               | MapStruct |
| `unit-test.mdc`                       | `MEMORY.md` §10                              | 单元测试      |



全部纳入 Git 管理。10 个 Cursor 规则 + 4 个子目录 CLAUDE.md + 1 个 MEMORY.md，维护成本可控。

## 七、实际效果

##   


### 代码一致性

###   


| 维度        | 之前                                               | 之后                                                      |
|-----------|--------------------------------------------------|---------------------------------------------------------|
| 依赖注入      | `@Autowired` 和构造器注入混用                            | 一致用 `@RequiredArgsConstructor`                          |
| Convertor | Spring Bean / new / INSTANCE 三种                  | 一致用 `INSTANCE` 单例                                       |
| 分层        | 偶尔跨层直接注入 Mapper                                  | 一致走 Gateway                                             |
| DTO 命名    | `Dto` 和 `DTO` 混用                                 | 一致全大写 `DTO`                                             |
| 工具类       | Hutool `BeanUtil` 和 Spring `BeanUtils` 混用        | 统一用项目指定工具类                                              |
| 响应包装      | 有时裸返回，有时手动包 Map                                  | 一致用 `SingleResponse` / `MultiResponse` / `PageResponse` |
| 异常处理      | 自定义异常 / RuntimeException / 直接 throw 混用           | 统一走项目自定义异常 + 错误码体系                                      |
| 线程池       | AI 随手 `new ThreadPoolExecutor` 或用 `Executors` 工厂 | 统一使用项目定义的线程池 Bean，禁止自行创建                                |



### 开发流程
    
    
    1. 判断场景类型 → 2. @ 引用金牌参考实现 → 3. 按步骤生成 → 4. Review 微调

从"AI 自由发挥 → 人工大改"变成了"AI 按模板生成 → 人工微调"。多人协同时，大家用同一套上下文，生成的代码天然一致，合并冲突和风格纠正基本消失了。

## 八、Token 消耗分析

##   


### 1\. L0 瘦身的直接收益

###   


| 方案                                     | 每轮加载量            | 估算 Token |
|----------------------------------------|------------------|----------|
| 瘦身前：全量 CLAUDE.md                       | 858 行            | ~12,000  |
| 瘦身后：CLAUDE.md + alwaysApply + 1 个 glob | 422 + 130 + 50 行 | ~8,500   |
| **每轮节省**                               |                  |
|                                        | **~3,500**       |



10 轮对话省 35,000 tokens。但这不是大头。

### 2\. 真正的大头：修正轮次减少

瘦身前，模型在 858 行里找跟当前任务相关的约 50 行，800+ 行噪音稀释注意力，规范遵循率下降。每次人工修正产生 2-3 轮追加对话，每轮 10K-20K tokens。

L1 精准注入后，规范直接出现在上下文里，修正轮次大幅下降。**少修正一次 ≈ 省 20K-50K tokens 。**

### 3\. 综合数据

###   


| 指标         | 无上下文体系     | 三层上下文       |
|------------|------------|-------------|
| 首次生成合格率    | ~40-60%    | ~80-90%     |
| 平均修正轮次     | 3-5 轮      | 0-1 轮       |
| 单功能总 Token | ~150K-250K | ~60K-100K   |
| **综合节省**   |  基线        | **~50-60%** |



结论：收益不在"注入更少"，在"注入更准 → 生成更对 → 修正更少"。 项目越大、规范越多、团队越多人，收益越明显。对于个人小项目，一个精简的 CLAUDE.md 就够了。对于 500+ 文件的项目，L1 层的精准注入是必须的。

## 九、常见问题

**Q：CLAUDE.md 怎么从 858 行瘦到 422 行的？** 把分层编码规范迁到 L1 的 glob 规则，跨层通用规范迁到 alwaysApply 规则，L0 只留项目知识和规范索引。目标 ~400 行，超了就说明 L0 承载了太多 L1 的活儿。

**Q：规则基于现有代码还是最佳实践？** 基于现有代码。项目里两种风格并存，比统一用"不完美"的风格更糟。要改进就在规则里写清楚："新代码用 X，旧的不动。"

**Q：多人团队怎么维护？** 跟代码一起进 Git，Code Review 时同步审规则变更。它们就是"给 AI 看的编码规范"。

**Q：Cursor 和 Claude CLI 都要配吗？** 用哪个配哪个。两个都用就按 §六 的对照表同步，核心规范只有一份真相源。

## 十、总结

AI Coding 工程化的核心不是 Prompt Engineering，而是 **Context Engineering** 。

  * **L0** ：让 AI 知道"项目是什么" —— 概览索引，~400 行

  * **L1** ：让 AI 知道"这类文件怎么写" —— 精准注入，消除噪音

  * **L2** ：让 AI 知道"这次做什么，照谁写" —— 场景分类 + 金牌参考




对于团队协同场景，这套体系解决的不只是"AI 生成质量"问题，更是"多人用 AI 生成的代码能不能合到一起"的问题。大家共享同一套上下文规则，AI 输出就天然一致。

把这三层搭好，AI 从"需要反复纠正的实习生"变成"了解项目规矩的熟练工"。这才是 AI Coding 真正能落地的方式。

  



---

**原文链接**: [https://mp.weixin.qq.com/s/yuLPF78t2iXXvDxm1IaUvQ](https://mp.weixin.qq.com/s/yuLPF78t2iXXvDxm1IaUvQ)

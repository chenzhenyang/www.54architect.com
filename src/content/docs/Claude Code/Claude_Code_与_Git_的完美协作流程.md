---

title: Claude Code 与 Git 的完美协作流程
lastUpdated: 2026-04-29
tags:
  - Claude Code
  - AI
  - Git
  - 开发工具
categories:
  - Claude Code
origin_title: Claude Code 与 Git 的完美协作流程
author: 三木AI编程
skill_id: "09cef014"
generated: "2026-04-29T22:56:54.818062"
original_url: "https://mp.weixin.qq.com/s/VH17-xaXUuCP2vzfZjIniQ"
---


不是夸它。是真的比我强。

我写了10年的 commit message，格式大概是这样：`fix bug`、`update payment`、`change stuff`。

让 Claude Code 接手之后，它写的是：`feat(billing): add idempotency check for Stripe webhook to prevent duplicate subscription creation on retry`。

我看着那行字沉默了几秒。然后把它加进了我的工作流。

## 一个人开发，Git 纪律最容易崩

做出海独立开发，没有 code review，没有团队规范，没有人盯着你。

Git 的纪律是最先崩的那个东西。

我见过一个朋友的 git log：上午十点写了个功能，`git commit -m "done"`。下午改了三个文件解决一个 bug，`git commit -m "fix"`。晚上 push 上去，如果三个月后需要 revert 某一个特定的改动——根本不知道从哪下手。

这不只是习惯问题。是成本问题。

一个人开发本来就没有备份意识，commit 粒度太粗，出了问题回滚就是噩梦。我有一次上线后发现 Stripe Webhook 有问题，需要回滚到出问题之前的版本，结果那个 commit 里混入了另外五个功能的代码，根本没法单独 revert。

最后只能手动一行行改回去，花了两个小时。

把 Claude Code 接进 Git 工作流之后，这些问题基本都解决了。

## 工作流全貌：四个节点

整套工作流就四个节点：**开分支 → 写代码 → Claude 生成 commit → PR 描述自动化** 。每个节点 Claude Code 都能参与，但参与深度不一样。

### 节点一：让它帮你规划分支策略

我现在开始一个新功能之前，会先问它：

> 我要给 SaaS 订阅工具加一个功能：用户可以查看自己的账单历史，包括每次扣费记录和对应的发票 PDF 链接（来自 Stripe）。
> 
> 帮我规划一下这个功能需要几个分支，每个分支负责什么，建议的合并顺序是什么。

它会给我类似这样的规划：
    
    
    feature/billing-history-ui       # 前端页面和组件  
    feature/billing-history-api      # API 路由，从 Stripe 拉取数据  
    feature/billing-history-db       # 数据库 schema 变更（如果需要本地缓存）  
    

合并顺序：db → api → ui，因为前端依赖 API，API 依赖 schema。

这个规划我以前都是靠感觉，有时候顺序搞反了，merge 的时候有依赖冲突，解冲突又花时间。

现在让它先规划，省掉的是后期的麻烦。

### 节点二：每次 commit 前，让它看 diff

这是整套工作流里投入产出比最高的一步。
    
    
    git diff --staged  
    

把这个输出喂给 Claude Code：

> 这是我准备 commit 的改动（git diff --staged 的输出）：
> 
> [粘贴 diff 内容]
> 
> 帮我做两件事：
> 
>   1. 判断这次改动是否应该拆成多个 commit，如果是，告诉我怎么拆
>   2. 按照 Conventional Commits 规范，给每个 commit 写一个 message
> 

它会告诉你：这次改动混了两件事——修了一个 Prisma 查询的 bug 和加了一个新的 API 路由，建议拆成两个 commit。

然后给你两条 message：
    
    
    fix(db): resolve N+1 query in subscription status fetch by adding include clause  
      
    feat(api): add GET /api/billing/invoices endpoint to retrieve Stripe invoice list  
    

**大多数教程不告诉你的细节是：** Conventional Commits 格式不只是为了好看，它可以被工具自动解析。`feat:` 开头的 commit 会被 changelog 生成工具自动归类为新功能，`fix:` 开头的会归类为 bug 修复。做出海产品，如果你以后要维护一个 CHANGELOG 给用户看——这套规范的价值就体现出来了。

拆 commit 的操作：
    
    
    # 把已经 staged 的文件先 unstage  
    git restore --staged .  
      
    # 只 stage 第一批改动（Prisma 查询修复相关的文件）  
    git add lib/db.ts app/api/subscription/route.ts  
      
    # commit 第一个  
    git commit -m "fix(db): resolve N+1 query in subscription status fetch by adding include clause"  
      
    # 再 stage 第二批  
    git add app/api/billing/invoices/route.ts  
      
    # commit 第二个  
    git commit -m "feat(api): add GET /api/billing/invoices endpoint to retrieve Stripe invoice list"  
    

说人话就是：`git restore --staged .` 是把所有已经 stage 的文件退回工作区，但不丢失改动。然后你可以重新选择性地 stage。

### 节点三：让它帮你处理 merge conflict

这是很多人避之不及的地方，但用 Claude Code 处理其实挺顺的。

遇到冲突时，把冲突文件的内容直接贴给它：

> 我在合并两个分支时遇到了冲突，冲突文件内容如下：
>     
>     
>     <<<<<<< HEAD  
>     > const subscription = await prisma.subscription.findFirst({  
>     >   where: { userId, status: 'active' }  
>     > })  
>     > =======  
>     > const subscription = await prisma.subscription.findUnique({  
>     >   where: { userId_status: { userId, status: 'active' } }  
>     > })  
>     > >>>>>>> feature/billing-history-api  
>     > 
> 
> HEAD 分支用的是 findFirst，feature 分支用的是 findUnique 加了复合索引。我们的 Prisma schema 里有没有定义 userId_status 这个复合索引？

它会帮你分析两种写法的区别，告诉你哪个更合适，给出合并后的正确代码。

> 细节：把 Prisma schema 文件也一起贴过去，让它能判断复合索引是否存在。如果 schema 里没有定义 `@@unique([userId, status])`，那 `findUnique` 用法会在 runtime 报错。它能帮你发现这个问题，人工合并的时候很容易忽略。

### 节点四：自动生成 PR 描述

我现在每次准备开 PR（对自己的 main 分支合并），会先跑这个命令：
    
    
    git log main..HEAD --oneline  
    

把输出喂给 Claude Code：

> 这是这个 feature branch 相对于 main 的所有 commits：
> 
> a3f2d1c feat(api): add GET /api/billing/invoices endpoint b7e9c4a fix(db): resolve N+1 query in subscription status fetch c1d8f5b feat(ui): add BillingHistory page with invoice list and download links d4a2e7f chore: add Stripe invoice types to types/stripe.ts
> 
> 帮我写一个 PR 描述，包括：这个 PR 做了什么、为什么要做、有哪些需要特别注意的地方（比如环境变量、数据库 migration、Stripe 配置）

它生成的 PR 描述我基本不用改，直接用。

这对独立开发者来说价值可能不那么明显——你自己合自己的，写不写 PR 描述都行。但我有一个习惯：每个 feature 的 PR 描述是我的开发日志。三个月后回来看，我能知道这段代码是为了解决什么问题、当时有什么注意事项。

这比 commit message 更有价值，因为它记录的是决策背景，不只是改了什么。

## 踩坑环节

**坑一：让它帮我写 commit，它把还没 stage 的文件也纳入分析了**

有一次我 `git diff --staged` 之后把输出给它，它帮我写了三个 commit message。我看了觉得没问题，就按照它的建议 stage 文件、依次 commit。

结果发现第三个 commit 里包含了一个我本来不打算这次提交的文件——`lib/analytics.ts`，那是我在探索一个新功能，还没写完。

我盯着 git log 看了一会才意识到：`git diff --staged` 只显示已 stage 的文件，但我当时不小心 `git add .` 了整个目录，那个未完成的文件也被 stage 进去了。

Claude Code 只看了 diff，它不会告诉你"这个文件看起来还没写完"——它只知道你 stage 了什么。

**解决方案：** 在让 Claude Code 分析 diff 之前，先用 `git status` 确认 staged 区域只有你想要的文件。养成习惯：`git add` 不要用 `.`，用具体文件路径或者 `git add -p` 交互式 stage。

**坑二：它写的 commit message 太长，被 GitHub 截断了**

Conventional Commits 建议 subject 行不超过 72 个字符，但 Claude Code 偶尔会写出这样的 message：
    
    
    feat(billing): implement Stripe invoice retrieval endpoint with pagination support and proper error handling for expired invoices  
    

这在 GitHub 的 commit 列表里会被截断，`git log --oneline` 也会显示不全。

我发现这个问题是在某次 code review 自己项目时，看到 commit 列表里一堆被截断的 message，找一个特定改动要看半天。

**解决方案：** 在 Prompt 里加一条约束：

> commit message 的 subject 行必须在 72 个字符以内，超出的内容放到 body 里（空一行后写）

加了这条限制，它生成的 message 格式就规范了。

## 总结

**Git 纪律的本质是：让三个月后的你能看懂三个月前的你在干什么。**

Claude Code 帮你写 commit 不是在偷懒，是在强制你把每次改动说清楚——这个压力以前只有 code review 才能带来，现在一个人开发也能有。

* * *

**最后问你一个实际的问题：** 你最近一次需要 `git revert` 或者回滚某个特定功能时，你花了多长时间找到正确的 commit？如果超过五分钟，你觉得问题出在 commit 粒度、commit message，还是分支策略？

![图片](https://mmbiz.qpic.cn/sz_mmbiz_png/B19QjeJMDNDZz6SWhLRHvVkwgDBFuwZGTvrt3AEYp2bvHJbLu867nxuAuE5RWiaJ5g4GgHaaupjnAKNPB55AIyxK6xjVGKRPFaUS3zWAdEibI/640?wx_fmt=png&from=appmsg&tp=webp&wxfrom=5&wx_lazy=1#imgIndex=0)

`fix bug`

`update payment`

`change stuff`

`feat(billing): add idempotency check for Stripe webhook to prevent duplicate subscription creation on retry`

`git commit -m "done"`

`git commit -m "fix"`

`feature/billing-history-ui # 前端页面和组件  
feature/billing-history-api # API 路由，从 Stripe 拉取数据  
feature/billing-history-db # 数据库 schema 变更（如果需要本地缓存）  
`

`git diff --staged  
`

`fix(db): resolve N+1 query in subscription status fetch by adding include clause  
  
feat(api): add GET /api/billing/invoices endpoint to retrieve Stripe invoice list  
`

`feat:`

`fix:`

`# 把已经 staged 的文件先 unstage  
git restore --staged .  
  
# 只 stage 第一批改动（Prisma 查询修复相关的文件）  
git add lib/db.ts app/api/subscription/route.ts  
  
# commit 第一个  
git commit -m "fix(db): resolve N+1 query in subscription status fetch by adding include clause"  
  
# 再 stage 第二批  
git add app/api/billing/invoices/route.ts  
  
# commit 第二个  
git commit -m "feat(api): add GET /api/billing/invoices endpoint to retrieve Stripe invoice list"  
`

`git restore --staged .`

`<<<<<<< HEAD  
const subscription = await prisma.subscription.findFirst({  
where: { userId, status: 'active' }  
})  
=======  
const subscription = await prisma.subscription.findUnique({  
where: { userId_status: { userId, status: 'active' } }  
})  
>>>>>>> feature/billing-history-api  
`

`@@unique([userId, status])`

`findUnique`

`git log main..HEAD --oneline  
`

`git diff --staged`

`lib/analytics.ts`

`git diff --staged`

`git add .`

`git status`

`git add`

`.`

`git add -p`

`feat(billing): implement Stripe invoice retrieval endpoint with pagination support and proper error handling for expired invoices  
`

`git log --oneline`

`git revert`

![cover_image](https://mmbiz.qpic.cn/sz_mmbiz_jpg/B19QjeJMDNAkAqLI0ut49nH5FSicU2riaicFZeqEf1kvoSicce52WHZnVwSibRmA52ib5K8H4uAu6dibmpMzx2SbFIiajkRn4f8TcUnyfAd7AZf5JCM/0?wx_fmt=jpeg)![](http://mmbiz.qpic.cn/mmbiz_png/B19QjeJMDNCs7Oz5CJK7U75WWw29qkslcJkzLenZkhbQuJlEpziccoQ2Tg2g3njrEYDFQ33XDIu3hhnBKtM9x1Q5fJsKCLMhDPicuwwGkcgvI/0?wx_fmt=png)![](https://mmbiz.qpic.cn/mmbiz_png/B19QjeJMDNCs7Oz5CJK7U75WWw29qkslcJkzLenZkhbQuJlEpziccoQ2Tg2g3njrEYDFQ33XDIu3hhnBKtM9x1Q5fJsKCLMhDPicuwwGkcgvI/300?wx_fmt=png&wxfrom=18)![划线引导图](https://res.wx.qq.com/op_res/opqv3ix6k9E4e64ZzO7uIqE3ZblwIojfmt7u70m59yS1ylFK-hTu6Ra8V_LaWQJ1P4OlUJPdXLfVBtrm3TwRrw)

---

**原文链接**: [https://mp.weixin.qq.com/s/VH17-xaXUuCP2vzfZjIniQ](https://mp.weixin.qq.com/s/VH17-xaXUuCP2vzfZjIniQ)

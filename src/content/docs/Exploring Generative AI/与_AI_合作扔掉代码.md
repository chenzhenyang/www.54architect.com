---
title: "与 AI 合作，扔掉代码"
date: 2026-03-11 21:00:53
updated: 2026-03-11 21:00:53
tags:
  - AI
  - Technology
categories:
  - Technology
origin_title: "Partner with the AI, throw away the code"
author: "Martin Fowler"

original_url: "https://martinfowler.com/articles/exploring-gen-ai/partner-with-ai-and-throw-away-the-code.html"
sidebar: 
  order: 103
---

Matteo 是一名开发者和 Technical Principal（技术负责人）。
    他喜欢看到极限编程（Extreme Programming）帮助团队和企业取得成功。

本文是"探索生成式 AI（Exploring Gen AI）"系列的一部分。该系列记录了 Thoughtworks 技术专家探索将生成式 AI（gen ai）技术用于软件开发的过程。

2025 年 7 月 31 日

摘要：一次关于 AI 如何帮助完成非平凡编程任务的个人经历。

## 一项困难的任务

这个月我花了整整一周时间解决一个非常困难的算法问题，而复杂的业务规则让问题变得更加棘手，我无法说服客户同意简化这些规则。

问题在于一个 API 端点响应太慢，原因是一些复杂的 SQL 查询在某些数据集上可能需要几分钟才能完成。这个函数非常复杂，我甚至没有尝试去理解细节；我的赌注是可以通过从 Transaction Script（事务脚本）迁移到 Domain Model（领域模型）来修复它（我发现 PoEAA 书中的模式对于描述我们在企业应用中看到的内容非常有用）。

技术栈是 Go 和 Mysql；我从客户那里获得了 Cursor 许可证，并搭配使用 Claude Sonnet 4。

## 逆向工程

事务脚本的常见问题在于它们是查询和粘合代码（glue code）的组合，业务规则分散在查询和粘合代码之间，并没有明确表述。

通过与客户的交谈，我对需求有一个模糊的了解。我也可以查看大量的测试用例，但它们并不容易理解。

我的第一个问题是理解端点实现的确切业务规则，但我不相信自己有能力理解复杂的代码。好吧，这只是故事的一部分：老实说，我很懒，我做的第一件事是向 AI 寻求帮助。

```
Read <function name> in file @<file> and write good documentation about what it does.
You may use `mysql -u... -p... -h127.0.0.1 ...` to inspect the DB schema.
You may refer to @doc.go  for information about the tables involved
```

让 AI 访问 mysql 使其能够探索模式并尝试查询。结果是理解业务规则的初步尝试。并不完美！文档不够精确，无法为重写生成验收标准。

反思之后，我本可以让它生成验收标准，甚至测试用例；也许它会成功。

**要点：让 AI 解释代码。**

## 基准测试

我的下一个任务是确保我有一种方法来衡量性能改进。我让 Cursor 使用 Go 原生基准测试工具生成一个基准测试。Go 的一个好处是大多数测试都以表格形式编写，所以我有一个基准测试，可以打印不同输入下被测操作的耗时。Go 基准测试输出难以阅读，因为它以纳秒为单位报告时间。但是，如果你忽略最右边的九位数字，你可以看到简单情况分别耗时 21 秒和 11 秒，而极端情况耗时超过七分钟。所以我有了一个可靠的改进基线。

```
> go test -bench=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx ./xxx -run=^$ -cpu 1
goos: darwin
goarch: arm64
pkg: gitlab.com/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
cpu: Apple M1 Pro
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/simple1        1   21047066667 ns/op   7180080 B/op   172723 allocs/op
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/simple2        1   11310282792 ns/op   3178208 B/op    86252 allocs/op
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/pathologic     1  472596979959 ns/op  74413528 B/op  2224386 allocs/op
PASS
```

默认情况下，当你让 Cursor 生成 Go 基准测试时，它会使用 2025 年 2 月发布的 Go 1.24 之前的旧样式。新样式（new style）除了其他改进外更易读，所以我不得不让 Cursor 将基准测试迁移到新样式。

**要点：使用 AI 生成我不熟悉的工具。**

## 测试覆盖

然后我为问题函数的重写创建了一个存根（stub），并复制了所有现有测试，以便最终确保新版本仍然与旧版本一样正常工作。当然，此时所有测试都失败了，因为函数只是一个存根。在此过程中，我发现遗留测试插入的测试数据难以阅读。你看，领域模型涉及一个组织架构分支树，用于模拟企业的结构方式。测试通过多次插入在数据库中创建测试树，这不可读。困难在于树形层次结构不容易看清，这使得测试更难理解。

```
orgChartTreeInsert := "insert into ..."
  testdb.MustExec(t, conn, orgChartTreeInsert, 1, "path", 200, 300)
  testdb.MustExec(t, conn, orgChartTreeInsert, 2, "path", 201, 301)
  testdb.MustExec(t, conn, orgChartTreeInsert, 3, "path", 202, 302)
  testdb.MustExec(t, conn, orgChartTreeInsert, 4, "path", 203, 303)
  testdb.MustExec(t, conn, orgChartTreeInsert, 5, "path", 204, 304)
  testdb.MustExec(t, conn, orgChartTreeInsert, 6, "path", 205, 305)

groupInsertQuery := "insert into ..."
  testdb.MustExec(t, conn, groupInsertQuery, 200)
  testdb.MustExec(t, conn, groupInsertQuery, 300)
  testdb.MustExec(t, conn, groupInsertQuery, 201)
  testdb.MustExec(t, conn, groupInsertQuery, 301)
  testdb.MustExec(t, conn, groupInsertQuery, 202)
  testdb.MustExec(t, conn, groupInsertQuery, 302)
  testdb.MustExec(t, conn, groupInsertQuery, 303)
  testdb.MustExec(t, conn, groupInsertQuery, 304)
  testdb.MustExec(t, conn, groupInsertQuery, 305)
```

```
orgChartTreeInsert := "insert into ..."
  testdb.MustExec(t, conn, orgChartTreeInsert, 1, "path", 200, 300)
  testdb.MustExec(t, conn, orgChartTreeInsert, 2, "path", 201, 301)
  testdb.MustExec(t, conn, orgChartTreeInsert, 3, "path", 202, 302)
  testdb.MustExec(t, conn, orgChartTreeInsert, 4, "path", 203, 303)
  testdb.MustExec(t, conn, orgChartTreeInsert, 5, "path", 204, 304)
  testdb.MustExec(t, conn, orgChartTreeInsert, 6, "path", 205, 305)

groupInsertQuery := "insert into ..."
  testdb.MustExec(t, conn, groupInsertQuery, 200)
  testdb.MustExec(t, conn, groupInsertQuery, 300)
  testdb.MustExec(t, conn, groupInsertQuery, 201)
  testdb.MustExec(t, conn, groupInsertQuery, 301)
  testdb.MustExec(t, conn, groupInsertQuery, 202)
  testdb.MustExec(t, conn, groupInsertQuery, 302)
  testdb.MustExec(t, conn, groupInsertQuery, 303)
  testdb.MustExec(t, conn, groupInsertQuery, 304)
  testdb.MustExec(t, conn, groupInsertQuery, 305)
```

我让 AI 使用 TDD（测试驱动开发）创建一个树构建器，经过几次调整后，它能够将上述 SQL 语句列表转换为更紧凑、更易读的格式：

```
// Create the org tree
  //
  // Node 1 [ROOT]
  // âââ Node 2
  // âââ Node 3
  // âââ Node 4
  // âââ Node 5
  //     âââ Node 6
  orgtree.NewBuilder(1, 200, 300).
    AddBranch(2, 1, 201, 301).
    AddBranch(3, 1, 202, 302).
    AddBranch(4, 1, 203, 303).
    AddBranch(5, 1, 204, 304).
    AddBranch(6, 5, 205, 305).
    Save(t, conn)
```

树构建器最终会执行与上面相同的所有插入语句，但表达方式要紧凑得多。在我有了树构建器之后，我让 Cursor 升级所有测试以使用它。它搞得有点乱，所以在几次不成功的尝试后，我不得不要求一次只转换一个。有时候 agent 模式太过火了！我只是将插入行复制到聊天中，然后让它将它们转换为树构建器格式。很好的一点是，一旦它看到一个示例，它总会同时在注释中给我漂亮的树形图，如上所示。

**要点：使用 AI 帮助让测试数据更易读。**

## 一次失败的重写尝试

随着关于 AI 的炒作愈演愈烈，人们希望 AI 能够在很少指导的情况下神奇地修复问题；遗憾的是，到目前为止这还不起作用。可行的是为 AI 提供一个想法：我最初加速操作的想法是使用批量插入和批量删除，而原始代码使用的是单独的插入、更新和删除。对话是这样的：

我：性能问题在于虽然我们可以做批量插入，但不能做批量更新

Claude：你说得完全正确！这是一个很好的观察。虽然我们可以高效地进行批量插入，但 MySQL 不支持像 INSERT 那样的真正批量 UPDATE 语句。

我：那么我的想法是我们做批量删除，然后做批量插入。这样我们就不需要做更新了！这可行吗？

Claude：这是一个绝妙的优化策略！你说得完全正确——这比尝试处理单个更新要高效得多。让我实现这个方法

（有趣的是模型对我的想法表达了热情😄；但有点问题的是它似乎对我说的任何话都说"你说得完全正确"……）

于是它重写了算法，结果还不错，我们确实看到了速度提升：简单情况的速度提升了约 30%，但极端情况只提升了 18%。而且一个根本问题仍然存在，代码并没有变得更简单，我仍然无法理解它。

**要点：通过向 AI 提供改进想法来重构函数。**

```
> go test -bench=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx ./xxx -run=^$ -cpu 1
goos: darwin
goarch: arm64
pkg: gitlab.com/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
cpu: Apple M1 Pro
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/simple1        1   15159058250 ns/op   4762120 B/op    73807 allocs/op
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/simple2        1    7577652750 ns/op   2290832 B/op    40858 allocs/op
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/pathologic     1  386697664541 ns/op  50189048 B/op   891939 allocs/op
PASS
```

## 另外两次重写

核心想法是使用 Repository（仓储）和 Domain Model（领域模型）的组合来替换现有函数，后者是一个 Transaction Script（事务脚本）。我从这个领域以往的经验中有充分证据表明，这些模式的表现可能会比原始代码好得多，所以这并不是完全的盲目尝试。我也已经有一些领域模型代码可用（例如，上面提到的组织架构树模型）。

在这种风格中，操作分三个阶段进行：

- 使用 Repository 实例化模型
- 在模型中/与模型一起执行业务逻辑
- 使用 Repository 保存更改

你也可以称之为 Functional Core, Imperative Shell（函数式核心，命令式外壳）。一个优势是我们使用的数据库查询要简单得多，因为它们不实现业务规则：业务规则实现在领域模型中，或者在使用领域模型的纯函数中。

因此，我为尚未被任何内容调用的纯函数创建了一个空存根。我现在对验收标准有了更好的理解，所以我开始为它编写测试，一次一个，然后让 Cursor 改进实现以通过测试。一开始进展顺利；随着我提供更多业务案例，它能够逐步构建一个更干净的函数版本。

我：我添加了另一个测试——你能让它通过吗？

Claude：我很乐意帮助你让新测试通过！让我先运行测试套件看看什么失败了。go test ./...[...]我看到有一个新的失败测试叫"xxxxxxx"。问题似乎是函数返回了重复的分支。让我检查新测试以了解它在测试什么：（阅读 xxxxxxx.go。思考了 17 秒）完美！我看到了问题。新测试用例"xxxxxxx"正在测试一个场景：[...] 问题是我的实现没有处理去重。让我修复这个：[...] 完美！现在函数看起来正确了。我可以看到去重逻辑已正确实现。让我运行测试以确认这修复了失败的测试：go test ./xxx -v -run xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

```
go test ./...
```

```
go test ./xxx -v -run xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

太好了！现在所有测试都通过了。让我运行完整的测试套件以确保我没有破坏其他任何东西：[...]

最终我觉得准备好针对新实现运行所有旧测试了。它们大部分都通过了……遗憾的是，一些测试用例没有通过，而 Cursor 不知道如何让它们通过。另一个问题是我仍然没有真正理解新实现。我可能没有理解它，因为它不正确；用真正的 LLM 风格来说，它看起来合理，大部分是偶然工作的，但并没有真正捕捉到正确的算法。

在这一点上，我足够深入地理解了问题。我用自己的双手从头重写了核心算法，专注于清晰度和简洁性，哇！它通过了所有测试。

**要点：逐步建立理解，使用 AI 驱动实验和原型。**

**要点：当有疑问时，从头开始！**

## 尾声

新实现通过了基准测试，数字令人印象深刻：我们现在以毫秒为单位执行；极端情况从超过 7 分钟降到了大约半秒。内存分配也下降了，对于极端情况，从 74MB 降到了 19MB。

```
> go test -bench=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx ./xxx -run=^$ -cpu 1
goos: darwin
goarch: arm64
pkg: gitlab.com/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
cpu: Apple M1 Pro
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/simple1       13    87119045 ns/op   7122516 B/op   469857 allocs/op
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/simple2       16    66008547 ns/op   7259216 B/op   464830 allocs/op
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/pathologic     2   569865208 ns/op  18900320 B/op   653970 allocs/op
PASS
```

它被部署到了测试环境，一位熟练的 QA 工程师发现了两个小问题，很容易修复。新实现现在正在生产环境中愉快地运行🚀。团队现在正忙着将类似的改进应用到其他缓慢的端点上。

最新文章（3 月 4 日）：

Humans and Agents in Software Engineering Loops（软件工程循环中的人类与 Agent）

上一篇文章：

I still care about the code（我仍然关心代码）

下一篇文章：

To vibe or not to vibe（跟随感觉还是不跟随感觉）
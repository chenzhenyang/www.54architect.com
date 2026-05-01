---
title: DeepInnovator：让LLM自己想出科研新点子
skill_id: bd7a7e06
generated: 2026-05-02T01:11:38.405994
original_url: https://mp.weixin.qq.com/s/4v2WNdg3p8sX69czFMpmEA
---

![Image](https://raw.githubusercontent.com/chenzhenyang/images/master/litercrawler/2bd2f135/4Zfl6dmm5Yc89XSxGKKZJGjGhCv9ib16YEWWvMFu7BDciaGa4bDz5wKV7gAyBUd6LRIFa92mv80sYWdT7hVAWdhcVhBQsokT6UZS)

> “
> 
> 论文链接：https://arxiv.org/pdf/2602.18920

> “
> 
> 代码链接：https://github.com/HKUDS/DeepInnovator

## 研究背景

科学研究的本质是"站在巨人的肩膀上"——每一个新想法都不是凭空产生的，而是在梳理前人工作、发现矛盾与空白之后，才能孕育出真正有价值的创新方向。与此同时，一个粗糙的初始想法还需要经历反复的"猜想与反驳"才能逐渐成熟。

现在的大语言模型在科研辅助上已经做了很多事情：检索文献、写综述、生成代码……但有一件事还没人真正搞定——**让模型自己"想出"一个新的、有价值的研究想法** 。现有的方法基本上都依赖复杂的Prompt工程，缺乏系统性的训练范式，模型更多是在"复述"已有知识，而不是真正在"创新"。

这篇论文提出了 **DeepInnovator** ，一个专门用来激发LLM创新能力的训练框架。核心任务非常清晰：给模型一批参考文献，让它预测"下一个研究想法"应该是什么，并通过不断迭代打磨让这个想法越来越好。最终训练出来的 DeepInnovator-14B，在多个评测维度上以80%以上的胜率超越未经训练的基线模型，并在部分指标上与GPT-4o等顶尖大模型不相上下。

## 相关工作

**研究Agent方面** ，目前的工作可以分成两类：一类是"知识压缩器"，比如各种DeepResearch系统，本质上是把已有文献整理归纳，帮你省力气，但没有真正产出新东西；另一类是端到端的科研Agent，比如AI Scientist、AI-Researcher，能从想法生成一路跑到论文写作，但它们更注重工程执行，往往依赖代码验证，本质上还是在"实现一个已有的想法"，而非产生想法本身。

**强化学习（RL）在开放域的应用** 方面，RL在数学、代码等有明确答案的任务上已经取得了很好的成果。但科研创新没有"标准答案"，只能用LLM-as-a-Judge来打分，而这类方法极易出现"奖励作弊"问题——模型学会了迎合评判者的偏好，而不是真正提升想法质量。DeepInnovator专门针对这一问题设计了解耦机制，后文会详细介绍。

## 核心方法

DeepInnovator的训练框架分为两大模块，合起来正好对应了科研创新的两个核心过程。

![Image](https://raw.githubusercontent.com/chenzhenyang/images/master/litercrawler/2bd2f135/4Zfl6dmm5YcGPuFsb5qzfdp5k49RicGzwtFibev4Qe0n85MmdP7g2rn2WNpqCl2K2gS4Gytaib0uOyKuYmyiaV2TU3MpXrfuMqof)

**第一步：自动化数据提取与合成（"站在巨人的肩膀上"）**

直接拿原始论文文本来训练有两个大问题：文章太长容易超出上下文窗口，而且大量重复细节会干扰模型抓住关键关系。为此，论文设计了一套层次化的抽象流程：

首先对每篇参考文献提取**核心研究想法** ，然后对这些想法做语义聚类，识别两类关键关系——同一簇内的"内部关系"（某个方法的演化、变体路径）和跨簇之间的"外部关系"（不同方向的融合或冲突）。在此基础上，进一步提炼出三类高阶研究信号：**Insight** （从多篇文献中归纳出的非显然规律，比如"现有方法忽略了跨模态对齐中的时序一致性"）、**Research Trending** （通过想法之间的演进关系识别出正在兴起或衰退的方向）、**Serendipity** （看似无关领域之间的潜在联系，比如"把强化学习的探索机制迁移到神经架构搜索"）。这三类信号分别对应人类科学思维中的归纳推理、前瞻判断和跨域联想。

**第二步：Next Idea Prediction训练范式（"猜想与反驳"）**

有了结构化的研究上下文  之后，训练任务被定义为：模型先生成一个初始想法 ，然后在评论模型的反馈下不断迭代，产出 ，目标是让最终的  尽可能接近真实论文中的那个研究想法。

奖励的设计上采用了**过程导向的Delta奖励** ，不只看最终结果好不好，而是量化每一步迭代的提升幅度：

训练用的是GRPO算法，损失函数为：

**最关键的创新点在于奖励与评论的解耦** 。论文引入了一个独立的评论模型（Comment）专门告诉模型"哪里不好、应该怎么改"，而奖励模型（Reward）完全独立地判断"有没有真正改好"。这两者的隔离让模型无法通过堆砌高分词汇、迎合评判者偏好来"作弊"，只能老老实实提升想法本身的质量。

* * *

## 实验效果

![Image](https://raw.githubusercontent.com/chenzhenyang/images/master/litercrawler/2bd2f135/4Zfl6dmm5YdRwfEibw1dtz9RTVY3HHkBEIhI4HibroDfBFIcldCKqX7IO1qDr6J5ucro5K0pDcuOqMicmcniama18xOnHnCRIm8n)

**Rubrics评估（6项基础指标）** 显示，DeepInnovator在所有维度上均超过未训练的Qwen-14B-Instruct基线，提升幅度在1%到8%之间。尤其在"论证有力程度"这一项上，DeepInnovator（82.3%）直接超过了GPT-4o（77.9%），这说明训练框架确实让模型学会了更扎实的推理和论证。

**Winrate评估（4个维度对比）** 方面，结果更为亮眼：

对Qwen-14B的全面碾压说明训练框架确实有效。对GPT-4o而言，DeepInnovator在有效性上保持了相当优势（76%），但在可行性上差距较大（11.5%），说明小参数模型在"想法落地"的世界知识储备上仍有先天不足。

![Image](https://raw.githubusercontent.com/chenzhenyang/images/master/litercrawler/2bd2f135/4Zfl6dmm5YewTlq7oILsDic9DC7SmxWxLYtv901zYZ3wLLibXurnLyIFfn4cuG1p5ej4tbpFtd8SXAWSiafGNwFF6viabjeYFdYI)

**迭代精炼过程的分析** 表明，随着迭代步骤推进（Step 2→3），各维度的胜率持续提升，到Step 4-5之后趋于稳定，说明"Next Idea Prediction"的训练范式确实让模型学会了有效的自我迭代。![Image](https://raw.githubusercontent.com/chenzhenyang/images/master/litercrawler/2bd2f135/4Zfl6dmm5YcriaAicicZ1tciaC00GslnPfWsjzxwDlSibIzwacxYnkJiaDotHP83Ix3SOMEEukt3wW0XickrVFpoS6jDxYdTZgKd)

**专家评估（法律、教育、生物技术三个训练集外领域）** 揭示了很有意思的规律：新颖性是DeepInnovator跨域泛化最稳定的优势，在所有领域对比GPT-4o都能保持50%以上的胜率。但在教育领域，面对GPT-4o时可行性和有效性胜率直接跌到0%，说明人文社科类场景对广博的世界知识要求更高，STEM导向的训练数据支撑有限。![Image](https://raw.githubusercontent.com/chenzhenyang/images/master/litercrawler/2bd2f135/4Zfl6dmm5YdZhicj6AzhicazIqsbVevt2bmiaX1FTDcEv6dkrh5IAlcDJpLjshLgw9N7C1Au6tbSaib3CWICbyPo4pMfv8e9A350)

## 论文总结

DeepInnovator的核心可以用一句话概括：**科研创新能力不是靠更大的模型"自然涌现"的，而是可以通过精心设计的训练任务"主动激发"的** ——只要把"预测下一个研究想法"这件事做成一个有过程奖励的强化学习任务，一个14B的小模型就能在新颖性上和GPT-4o掰手腕。

![图片](https://raw.githubusercontent.com/chenzhenyang/images/master/litercrawler/2bd2f135/1FD1x61uYVfVicUEiagTZov6FPIwI4NSkNB9iaGicBF0vBupsxYoibuuAPclbuYDSUzc5kFPkpqibiasb6vwrZklLRjKA.jpg)添加微信，备注”**LLM** “进入大模型技术交流群![图片](https://raw.githubusercontent.com/chenzhenyang/images/master/litercrawler/2bd2f135/1FD1x61uYVfVicUEiagTZov6FPIwI4NSkNB9iaGicBF0vBupsxYoibuuAPclbuYDSUzc5kFPkpqibiasb6vwrZklLRjKA.jpg)![Image](https://raw.githubusercontent.com/chenzhenyang/images/master/litercrawler/2bd2f135/1FD1x61uYVepTwoCjo8gJnn0oD5ePen5LMlW9RIq8IcCfuxBibyZsfZ2sWO0966JjUlbp1lvN3XDSMn4pZiboqTQ.jpg)

> 如果你觉得这篇文章对你有帮助，别忘了点个赞、送个喜欢

>/ 作者：ChallengeHub小编

>/ 作者：欢迎转载，标注来源即可


---

**原文链接**: [https://mp.weixin.qq.com/s/4v2WNdg3p8sX69czFMpmEA](https://mp.weixin.qq.com/s/4v2WNdg3p8sX69czFMpmEA)

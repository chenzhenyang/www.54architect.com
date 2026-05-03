---

title: 让 Claude Code 成本爆降 89%，这个开源工具有点猛
lastUpdated: 2026-05-01
tags:
  - Claude Code
  - RTK
  - CLI Agent
  - Token 优化
  - 开发工具
categories:
  - Claude Code
skill_id: d6b6558b
generated: 2026-05-01T23:30:14.496111
original_url: https://mp.weixin.qq.com/s/CHkoP5Y90yZNy_uVtMGqAw
---

![Image](https://raw.githubusercontent.com/chenzhenyang/images/master/litercrawler/21bbf882/ULE52ybiacStfuG63kBJOk6Nhof1NiaVLSSRNicRX9K8yIUickqlAPMwnic7DLibG3hGeq2ibq4tT5Ma3WZOjV7JgaJZWSETBbia)

> 使用过Claude Code的小伙伴应该有所了解，Claude Code有个200k的LLM上下文。如果我们在命令达到LLM上下文之前，不做过滤和压缩的话，上下文很快就会占用过高了，不仅会导致AI推理能力变差，而且会消耗大量的token。今天给大家分享一款高性能CLI代理RTK，能大大降低token的消耗！

## RTK简介

RTK是一款高性能的CLI代理，它能在命令输出到达LLM上下文之前进行过滤和压缩，能将token消耗降低60-90%，目前在Github上已有`25k star`！

以`git status`命令为例，RTK的工作原理如下：
    
    
    没有 rtk：                                      使用 rtk：  
      
    Claude  --git status-->  shell  -->  git         Claude  --git status-->  RTK  -->  git  
      ^                                   |            ^                      |          |  
      |        ~2,000 tokens（原始）       |            |   ~200 tokens        | 过滤     |  
      +-----------------------------------+            +------- （已过滤）-----+----------+  
    

下面是某开发者使用RTK几周后的真实反馈，节约了接近89%的token。

![Image](https://raw.githubusercontent.com/chenzhenyang/images/master/litercrawler/21bbf882/ULE52ybiacSuicGqM8ADyMO9sWGHTDXGrkyA4pbWFwIYhQroZiavEeAqAY2NYIuMMPPJB7sz7ibx2Bjh464efZV6NlMjW0NeibIy)

## 安装

> 下面介绍下RTK的安装，以Windows环境为例。

  * 首先我们需要在RTK的release页面下载安装包，下载地址：https://github.com/rtk-ai/rtk/releases

![Image](https://raw.githubusercontent.com/chenzhenyang/images/master/litercrawler/21bbf882/ULE52ybiacSv9VYHdIicxETb5S7wu5vria3haBOcib7hLfVOo4AbwY1tvSG0b5aSJLkpNTR37XA4Gj4ltgSODkLtvLzQwf80KV5m)

  * 下载成功后解压会得到一个`rtk.exe`可执行程序，我们需要把这个路径添加到`环境变量->系统变量->Path`中去；

    
    
    Path = D:\developer\tools\rtk  
    

  * 然后在命令行中使用`rtk --version`命令，如果输出了版本号，就代表RTK已经安装成功了！

![Image](https://raw.githubusercontent.com/chenzhenyang/images/master/litercrawler/21bbf882/ULE52ybiacStJaV2D10vCubNbND4j9p7Vu1icBAHNcaGCERaIEfE3niap8mJgJDd1Dclvgn1NqkicdzJBqm4k8V5xq2sd8nV2GbZ)

## 使用

> 接下来我们就以Claude Code为例，来讲解下RTK的使用。

  * 我们可以使用`rtk init -g`命令来全局初始化RTK；

![Image](https://raw.githubusercontent.com/chenzhenyang/images/master/litercrawler/21bbf882/ULE52ybiacSuz1E0Z2jLgCgjl2HzY8t1KjCCBicXgjqAHot6t2s67XN7LoUCf6eNTQXwun2c3PWeU2zpvlAqBDMJMdGibP5RYW6A)

  * 此时我们打开Claude Code的`CLAUDE.md`配置文件可以发现，里面添加了RTK的使用说明，Claude Code会在记忆中添加RTK的使用说明；

![Image](https://raw.githubusercontent.com/chenzhenyang/images/master/litercrawler/21bbf882/ULE52ybiacSuUx0wsoN6QYiaAG53ibvTfxyB1qnsB7O4D8micoBQAlqib9k3nP6vzd1icuRcMsiaTkFmspbrM0yVLrf8Yvyz0b7j)

  * 此时我们打开Claude Code的CLI通过`git status`命令测试下，该命令会自动转换为`rtk`开头的命令；

![Image](https://raw.githubusercontent.com/chenzhenyang/images/master/litercrawler/21bbf882/ULE52ybiacStl06Ipz3Gsq1iaFYa3iaFbNd4l40Nxparr4WiavRvBkjGEMJLWe5nl73sbhicXDVynN8GabQGF8wkgOCJBeF8jTtj)

  * 这个转换后的命令能大大降低命令传入LLM上下文的token大小，具体参考下图；

![Image](https://raw.githubusercontent.com/chenzhenyang/images/master/litercrawler/21bbf882/ULE52ybiacSvYrCdTNBDdzSDWPNTd7Qb9QBScrrcf2yL8ZhmQ1eoia4qaYqQWIVhVI1G5SZSGibVSgicJTHV7EyTX7sRGw1yaveK)

  * RTK支持转换的命令有30多个，其中一些核心命令的token节约量可以参考下图；

![Image](https://raw.githubusercontent.com/chenzhenyang/images/master/litercrawler/21bbf882/ULE52ybiacSuBEVyucb7okNKJDLYkdMg7M8mon7IHBWDW2qNY2G5xUniaK5vTA7nWPlm6gO70viaLmnYMAUNHYfL6kIKGJT44X0M)

  * 你使用一段时间后，如果想查询token的节约情况的话，可以使用`rtk gain`命令。

![Image](https://raw.githubusercontent.com/chenzhenyang/images/master/litercrawler/21bbf882/ULE52ybiacStuEKRXIzicrNRFJXu7do4UYqvG93mQVMVqf37VXAmrMhmJTOiczGjK8IibpWwZw7J85kzYGvDpIBD8Qsys4I6ib77)

## 总结

今天给大家分享了下RTK的基本使用，总的来说RTK能让我们在使用Claude Code时获得更好的推理、更长的会话、更低的成本，感兴趣的小伙伴可以尝试下它。

## 项目地址

https://github.com/rtk-ai/rtk

![Image](https://raw.githubusercontent.com/chenzhenyang/images/master/litercrawler/21bbf882/CKvMdchsUwlkU1ysoMgG69dVYbCQcI6Byneb8ibzZWPfUCr3T8CuBicCSGyFE6SpAtxpxtDCp6VlZ4F1hEL1BNyg.jpg)

---

**原文链接**: [https://mp.weixin.qq.com/s/CHkoP5Y90yZNy_uVtMGqAw](https://mp.weixin.qq.com/s/CHkoP5Y90yZNy_uVtMGqAw)

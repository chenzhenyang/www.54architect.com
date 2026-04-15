---
title: wsl2 清除 Windows 环境变量污染
description: '---'
tags:
- AI
- Technology
categories:
- Technology
lastUpdated: 2026-04-14
origin_title: wsl2 清除 Windows 环境变量污染
author: weixin_51229066
url: https://blog.csdn.net/weixin_51229066/article/details/155494742
---
最新推荐文章于 2026-04-14 19:05:13 发布

**原创** | 306 阅读 | 1 点赞 | 0 收藏

**版权声明**：本文为博主原创文章，遵循 [CC 4.0 BY-SA](http://creativecommons.org/licenses/by-sa/4.0/) 版权协议，转载请附上原文出处链接和本声明。

---

在创建 vue 项目时，创建失败，提示使用了 win 上的 node 路径。

下面是清除方法。

```bash
vim /etc/wsl.conf
```

添加如下语句：

```ini
[interop]
enabled=false
appendWindowsPath=false
```

然后在 Windows PowerShell（管理员）中运行重启命令：

```powershell
wsl --shutdown
```

再次运行 `echo $PATH` 就没有 win 的环境变量了。

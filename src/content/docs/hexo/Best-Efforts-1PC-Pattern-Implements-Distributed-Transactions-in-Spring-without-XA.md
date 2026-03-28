---
title: >-
  Best Efforts 1PC Pattern Implements Distributed Transactions in Spring,
  without XA
tags:
- Spring
- Transaction
- Distributed Transaction
categories:
- Spring
- Spring Transaction
abbrlink: 2540280255
date: 2019-03-20 15:06:24
---
# 简述
Distributed transactions in Spring, with and without XA一文中描述了在Spring中实现分布式事务的7种处理模式；3种基于XA协议，4种特定场景的非XA协议的模式；
# 最大努力一阶段提交模式
4种非XA协议模式的第一种是共享事务资源模式（Shared Transaction Resource pattern），其提供了特定场景的多资源事务同步模式；
第二种便是本文要说的最大努力一阶段提交提交模式，在共享事务资源模式中，将两个系统的事务使用同一个事务资源的一个事务来管理，从而达到一起成功一起失败的目的；
<!-- more -->
而在最大努力一阶段提交模式中，不特意控制两个资源在同一个事务中，而是寄希望于其中一个资源的事务管理相当简单，简单到唯一肯能发生错误的就是基础组建发生错误，而非业务处理错误。
比如说关系型数据库就不是一个这样的资源，他除了基础组建会发生错误以外，业务上还会发生各种各样的错误情况，比如说主键重复，查不到数据时抛出业务异常等等；
从消息系统里接收消息，就是一个符合这种情况的资源，从其接收到消息之后，业务处理成功之后，提交消息事务，在这里，接收消息和提交消息事务这两个操作没有业务逻辑，只有像消息服务器，网络这种基础组件出问题时，才有可能出问题。

# 举个例子
在这种情况下，如果我们就直接不管消息系统的提交结果，会怎么样？还是消息驱动的单个数据库更新场景，如果不控制消息系统接收消息的事务，只控制复杂的数据库事务，那么处理过程如下：

```
开启消息事务
接受消息
开启数据库事务
更新数据库
提交数据库事务
提交消息事务
```

如果是开启消息事务或者接收消息，这两个步骤出问题，只可能是基础组件的问题，基础组件恢复之后，重新获取即可，对整个系统没有任何影响
如果开启数据库事务、更新数据库或者提交数据库事务出问题，事务回滚，没有提交消息事务，超时之后，消息会被重新接收
如果是提交消息事务出问题，这时数据库事务已经提交，但是消息事务提交失败，事务超时时候，消息服务器会将消息重新发送过来；这时，唯一的一个问题来了，同一个消息会被重新处理一遍。解决这个问题的杀手锏就是保证业务服务的幂等，这个做起来非常容易。

# 跟Kafka有什么关系
在Kafka Consumer中，接收消息的语义有三种模式，最多一次，最少一次，正好一次，没错，这就是最少一次的情况。
# 参考
[Distributed transactions in Spring, with and without XA](https://www.javaworld.com/article/2077963/distributed-transactions-in-spring--with-and-without-xa.html)
[如何实现XA式、非XA式Spring分布式事务](http://www.importnew.com/15812.html)


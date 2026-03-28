---
title: >-
  Shared Transaction Resource Pattern Implements Distributed Transactions in
  Spring without XA
tags:
- Spring
- Transaction
- Distributed Transaction
categories:
- Spring
- Spring Transaction
abbrlink: 3984494298
date: 2019-03-20 15:11:23
---
# 概述
[Distributed transactions in Spring, with and without XA](https://www.javaworld.com/article/2077963/distributed-transactions-in-spring--with-and-without-xa.html)一文中描述了在Spring中实现分布式事务的7种处理模式；3种基于XA协议，4种特定场景的非XA协议的模式；

共享事务资源模式（Shared Transaction Resource pattern）是四种非XA协议的第一种，其提供了特定场景的多资源事务同步模式；

熟悉Spring 事务框架的看到Transaction Resource应该立马就明白了，Transaction Resource就是JDBC里的Connection对象，Hibernete里的Session对象，以此类比；
<!-- more -->
像JDBC的Connection，Hibernete的Session等如果要共享，也就意味着两个事务使用的是同一个连接，也就意味着不再有分布式事务一说，两个系统的操作真的是在同一个事务之中。

# ORM框架和Spring JDBC
先描述一下文中的两个例子：
第一个是ORM框架和JDBC，这是一个好像不是分布式事务的例子，在这里我们描述的更具体一些，将JDBC换乘Spring JDBC，让他看上去更像分布式事务一些，理解这个例子是基础，一定要仔细看看：
在基于Spring架构的应用中，如果同时使用了ORM框架Hibernete和Spring JDBC一起操作数据库，那么如何将Spring JDBC的事务和Hibernete的事务进行同步呢？

答案就是共用一个JDBC Connection对象，Spring JDBC封装了Java JDBC，Hibernete也是基于JDBC构建的，也就是说如果在Spring  JDBC 和 Hibernete中使用同一个Java JDBC Connection对象，就可以实现事务的同步，其实根本就是在一个JDBC 事务中。

# 消息驱动的单个数据库更新
文中提到共享事务资源模式的典型应用场景是**消息驱动的单个数据库更新**。这是一个看上去就需要分布式事务同步场景。

## 基于ActiveMQ实现消息驱动的单个数据库更新场景
文中同时举了一个ActiveMQ + JDBC的例子，ActiveMQ是JMS协议的实现，同时ActiveMQ支持可配置的消息存储的，其中就可以将ActiveMQ的队列中的消息存储到关系型数据库中。

当把ActiveMQ把消息存储到关系型数据库中之后，如果我们后续的消息的业务处理之后的结果，也写到同一个数据库中，那ActiveMQ中消息的更新和业务系统中消息的处理结果持久化就可以共用一个数据库连接了。

可以共用一个数据库连接，也就意味着不再牵扯到分布式事务；

## 基于Kafka实现消息驱动的单个数据库更新场景
这里在送大家一个特定的例子，基于Kafka实现消息驱动的单个数据库更新的场景。上边的例子有着很大的性能问题，而基于Kafka实现消息驱动的单个数据库更新的场景就像是天造地设一般。

Kafka消息队列里的读取进度是存储在Consumer端的，在Kafka中，叫做Offset。也就是说，如果我们在拉取消息之后，将最新的offset和消息的处理结果，共用同一个事务资源，写到一个地方，要么一起成功，要么一起失败；如果发生Partition的重新分配，只需要从存储中读取最近一次成功处理的那批消息的最大的offfset，然后让Consumer，seek此offset即可。实际上Kafka Connect的很多实现，比如Kafka Connect HDFS就是这么搞的。

这里描述一个具体的例子，Kafka + 关系型数据库：

# 参考
[Distributed transactions in Spring, with and without XA](https://www.javaworld.com/article/2077963/distributed-transactions-in-spring--with-and-without-xa.html)
[如何实现XA式、非XA式Spring分布式事务](http://www.importnew.com/15812.html)














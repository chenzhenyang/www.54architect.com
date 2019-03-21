---
title: Spring Retry Framework Stateful Retry
abbrlink: 10764762
date: 2019-03-20 15:00:26
tags:
- Spring
- Spring Retry Framework
categories:
- Spring
- Spring Retry Framework
---
Spring Retry中的重试，分为无状态的重试和有状态的重试；

# 简述
有状态重试通常是用在message-driven 的应用中，从消息中间件比如RabbitMQ等接收到的消息，如果应用处理失败，那么消息中间件服务器会再次投递，再次投递时，对于集成了Spring Retry的应用来说，再次处理之前处理失败的消息，就是一次重试；也就是说，Spring Retry能够识别出，当前正在处理的消息是否是之前处理失败过的消息；
<!-- more -->
如果是之前处理过的消息，Spring Retry就可以使用 back off policies 阻塞当前线程；Spring Retry同时追踪重试的次数，支持处理彻底失败后的recover，这也是使用有状态重试的理由；

有状态重试的另一个典型应用场景是跟Spring Transaction框架集成。在集成了Spring Transaction框架的MVC应用中，通过TransactionInterceptor，开启对Service层的事务管理；在这种情况下，Spring Retry会提供让每一次重试和重试次数耗尽之后的recover都在一个新的事务中执行。

# 举个栗子
[spring-retry-samples](https://github.com/58greenwhale/spring-retry-samples.git)

# 参考
[Spring @Retryable with stateful Hibernate Object](https://stackoverflow.com/questions/54559143/spring-retryable-with-stateful-hibernate-object)
[Springboot @retryable not retrying](https://stackoverflow.com/questions/38212471/springboot-retryable-not-retrying)

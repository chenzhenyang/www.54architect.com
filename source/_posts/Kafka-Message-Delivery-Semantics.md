---
title: Kafka Message Delivery Semantics
date: 2019-03-17 20:19:21
tags:
---
@[toc]
# Kafka 消息交付（Delivery）语义
Kafka的消息交付语义有三种，At most once、At least once和Exactly once，它们的官方解释如下：
 - At most once—Messages may be lost but are never redelivered.
 - At least once—Messages are never lost but may be redelivered.
 - Exactly once—this is what people actually want, each message is delivered once and only once.

## Once的意义
上面提到的Kafka的三种消息交付语义的知识点已经烂大街了，但是这里的once指的意义，需要进一步明确一下；
这里的Once的指的不是消息接收到的次数，而是指的在没有抛出阻碍给Kafka Server反馈Offset的异常的情况下，成功处理一条消息的次数。

这里需要说明两个情况，第一个是消息处理逻辑幂等，第二个是消息处理逻辑抛出没有阻碍给Kafka Server反馈Offset的异常。

## 消息处理逻辑幂等
微服务火起来之后，幂等这个词也跟着火起来了，微服务的环境中，大多数的服务都需要考虑幂等设计。那这里需要明确的是，同一条消息，被一个幂等设计的处理逻辑接收到多次，那么这条消息是相当于被处理了一次还是多次呢？
没错，是被处理了多次，而且是相当于被成功处理了多次。
对于Kafka来说，不管你的处理逻辑是否幂等，那消息处理的模式都是接收消息->处理消息->提交Offset，这三个步骤，消息走完一遍即是被成功处理了一次，不管处理消息这一步是否是幂等的。

## 消息处理逻辑抛出没有阻碍给Kafka Server反馈Offset的异常
消息处理失败并不是简单的指的程序抛出异常，而是这个异常一定要阻碍了后续给Kafa Server 反馈Offset才算处理失败。比如说，接收到消息之后，业务处理逻辑在处理的过程中，抛出一个InvalidUserNameException，很明显，这是一个业务级别的异常。这个异常虽然在此处被抛出去，但是整个应用中，一定有一个地方会处理这个异常，比如说简单的记录日志，或者将此消息发送到一个特定的kafka topic，由另外的逻辑来处理。
这里需要注意的是，从上面的处理过程来看，我们完美的处理了这个消息，这个消息虽然不合法，但是我们也处理了不合法的情况，所以这条消息，对于Kafka Server来说，我们是成功处理了，没有必要再让Kafka Server重新发送一次此消息了。所以在处理完InvalidUserNameException异常之后，我们应该提交Offset给Kafka Server，告诉Kafka Sever，我们成功消费了这条消息。

在使用Spring Kafka时，其提供了一个类似的特性，消息在处理失败达到指定的最大次数的时候，会将其发送到一个dead-letter topic，然后commit offset，即是这样的情况。这是Spring Kafka框架替我们做的recover机制，对于Kafka Server来说，这条消息被成功处理了，并且收到了KafkaConsumer Commit的Offset。

在Spring Kafka 中存在一个ErrorHandler组件，可以配置到@KafkaListener注解上。配置当Listener出错时，可以使用指定的ErrorHandler来处理失败，在ErrorHandler中，我们可以拿到抛出的异常对象，当前正在处理的消息对象和Consumer对象，我们可以根据异常的类型和消息对象提供的信息，来灵活的判断是否需要使用Consumer提交offset。

其反面的就是像数据库连接失败，数据库死锁等的异常，如果消息处理过程中，出现了此类异常，只能重传了。

## 消息交付语义是指的Producer发送消息还是指的Consumer接收消息？
KafkaProducer在发送消息时，可能会重复发送，Consumer接收处理消息时，如果过早的提交offset，可能会导致消息处理失败，无法提交offset，而再次接收到同一条消息。

那么，消息交付语义是指的Producer发送消息还是指的Consumer接收消息呢？显然都不是，而是指的在Producer和Consumer的配合下，实现消息被成功处理的次数的可能的情况。

比如At most once，就是指的在Producer和Consumer的配合下，消息最多会被成功处理一次。看上面可以理解成功处理的意义。举个例子,BS=Business Service：

Kafka Topic1->BS1-Kafka Topic2->BS2-Kafka Topic3->BS3->Kafka Topic4->DB

上面的例子，在3个BS处，都是Receive-Process-Produce模式，如果我们在3个BS处的KafkaConsumer都可能会重复收到消息，KafkaProducer对象都可能会重复发送消息，那么在DB处就可能会出现重复的结果。另外两个Kafka交付语义类似。

# Kafka 消息交付（Delivery）语义配置
KafkaProducer相关配置参数：acks、retries、enable.idempotence、max.in.flight.requests.per.connection
KafkaConsumer相关配置参数：enable.auto.commit、auto.commit.interval.ms、isolation.level
# Kafka Client API

    KafkaProducer
    initTransactions
    beginTransaction
    sendOffsetsToTransaction
    commitTransaction
    abortTransaction

KafkaProducer事务API用来保证在Receive-Process-Produce模式中，Produce数据到Kafka Topic时的EOS语义的；
at most once 和 at least once的实现不用KafkaProducer事务API；只需要配置上述相关参数，处理好消息的业务处理和offset保存的先后顺序即可。

    KafkaConsumer
    commitSync
    commitAsync

如果设置了consumer自动提交之后，也就是enable.auto.commit和auto.commit.interval.ms，则consumer每隔auto.commit.interval.ms自动commit；

# Kafka 消息交付（Delivery）语义实现
## At most once 实现
通过禁用 producer 的重传功能和让 consumer 在处理一批消息之前提交 offset，实现 at-most-once 的消息交付
KafkaProducer：禁用幂等，关闭重传；acks=0或1，ack0失败的概率最高， ack1也有可能失败；acks=0时retries配置实效；enable.idempotence=false，默认fase；
KafkaConsumer：consumer 在处理一批消息之前提交 offset；可以enable.auto.commit=true+auto.commit.interval.ms较小值，或者手动KafkaConsuer#commitSync()
## At least once 实现
Kafka 默认保证 at-least-once 的消息交付。
KafkaProducer：禁用幂等，开启重传；acks=all；acks配置较大数值；enable.idempotence=false，默认fase；
KafkaConsumer：consumer 在处理一批消息之后提交 offset；关闭自动提交，处理完消息之后手动commit；

## Exactly once 实现
KafkaProducer：开启幂等；启动幂等之后，kafka client自动将retries设置大于0，all=all；启用幂等，即可保证正好一次；如果是发送给多个topics，配置transactional.id，使用Producer事务API开启事务，即可保证同一个事务中的消息只发送成功一次；启动幂等之后，max.in.flight.requests.per.connection需要设置小于等于5；
KafkaConsumer：正好被成功处理一次的思路是，保存offset的操作和业务逻辑放到一个事务中；

正好一次的典型应用场景是Receive-Process-Produce，将这三个操作，放到一个事务中，要么一起成功，要么一起失败；

这里列举两个具体场景：
在Receive-Process-Produce，如果最后的Produce是生产数据到外部系统，则将offset保存这个外部系统中，使用外部系统的事务，将Produce的数据和Offset放到一个外部系统的事务中，一起提交。比如使用关系型数据库，则可以使用JDBC事务实现；Kafka Connect就是使用这种方法，保证数据只被导出一次的。Kafka Streams中，典型的应用场景是最终将数据导出到非Kafka系统，此时使用的就是Kafka Connect。

在Receive-Process-Produce，如果是发送到另一个Kafka Topic，则使用KafkaProducer的事务API 将Offset的保存（offset被保存在kafka的内置的_consumer_offset中）和Producer发送放到一个事务中；Kafka Streams里所有中间Processor节点的输入输出都是Kafka Topic，其就是使用这个机制保证的Kafka Stream所有中间Processor处的消息的EOS；使用事务性KafkaProducer提供 整个Stream上exactly-once 的消息交付能力。

> 由于Zookeeper并不适合大批量的频繁写入操作，新版Kafka已推荐将consumer的位移信息保存在Kafka内部的topic中，即__consumer_offsets topic，并且默认提供了kafka_consumer_groups.sh脚本供用户查看consumer信息。

在Receive-Process-Produce模式中，其实消息Process之后，Produce到Kafka Topic还是发送到其他拥有事务管理能力的外部系统，是一个处理思路，都是用将offset的保存和外部系统的事务放在一起。


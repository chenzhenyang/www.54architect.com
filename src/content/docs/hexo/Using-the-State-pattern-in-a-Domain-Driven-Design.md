---
title: Using the State pattern in a Domain Driven Design
tags:
  - DDD
categories:
  - DDD
abbrlink: 3262808649
date: 2019-03-20 13:22:21
---
领域驱动设计是软件开发的一种方式，问题复杂的地方通过将具体实现和一个不断改进的核心业务概念的模型连接解决。这个概念是Eric Evans提出的，[domaindrivendesign](http://www.domaindrivendesign.org/)这个网站来促进领域驱动设计的使用。关于领域驱动设计的定义，[dddcommunity](http://dddcommunity.org/resources/ddd_terms/)，这个网站有很多的描述，DDD是一种软件开发的方式：
<!-- more -->
1. 对于大多数的软件项目，主要的精力应该在领域和领域的逻辑。
2. 复杂的领域设计应该基于一个模型。

DDD促进了技术和领域专家之前的创造性的合作，迭代地接近问题的概念核心。注意，在没有领域专家的帮助时，一个技术专家可能不会完全理解领域的错综复杂，当然，没有技术专家的帮助，一个领域专家实际上也不能应用它的知识到项目中。

大多数情况下，一个领域模型对象封装一个内部的状态，本质上是一个系统中某个元素的历史，也就是，对象的操作是有状态的。在那种情况下，对象保持它的私有状态，这个状态最终将影响他的行为。状态设计模式可以干净地代表一个对象的状态，处理它的状态转换。简而言之，状态模式是针对依赖于状态做出行为的问题的解决方案。

很明显,DDD和状态设计模式息息相关。我对DDD是个新手，所以我将让我们最出色的JCG伙伴Tomasz Nurkiewicz，用一个例子来介绍使用状态设计模式的DDD。

注意：为了提高可读性，原始邮件被稍微重新编辑了下。

一些企业应用中的领域对象包含状态的概念。状态有两个主要的特性：

1. 领域对象的表现（如何响应业务方法）依赖于它的状态。
2. 业务方法可能改变对象的状态，在一个特定的调用之后，对象可能表现出不同的行为。

如果你不能想象任何领域对象的例子，想象在租赁公司的一个Car实体。这个Car，尽管是同一个对象，但是它有一个附加的状态标识，这对公司来说至关重要。这个状态标识可能有三个值：

1. AVAILABLE
2. RENTED
3. MISSING

很明显，当一个Car处于RENTED或者MISSING的时候，是不能被租出去的，rent()方法应该失效。但是当Car被还回来的时候，它的状态时AVALIABLE，对这个Car实体调用rent()方法应该与之前租借这个Car的用户无关，将车的状态改为RENTED。状态标识（可能是一个字符或者是数据库中的int类型）是对象状态的一个例子，因为它影响着业务方法，反之亦然，业务方法也可以改变状态。

现在，思考一个问题，你将怎么实现这个场景，我相信，这个场景你在工作中遇到过很多次了。你有很多依赖于当前的状态的业务方法和很多种的状态。如果你喜欢面向对象编程，你可能立即想到继承然后创建一个继承自Car的AvailableCar，RentedCar和MissingCar。这看上去很好，但是不切实际地，特别是当Car是一个持久化对象的时候。实际上，这种继承的方式不是一种好的设计：我们想要的不是改变整个对象，仅仅是对象的一条内部状态，也就是说，我们不会替换一个对象，仅仅是改变它。也许你想在每一个依赖于状态执行不同的任务的方法中用if-else-if-else这种层叠的方式。。。不要这么做，相信我，那是代码维护的地狱。

相反，我们将不使用继承和多态，但这是一个更聪明的方式：使用状态模式。举个例子，我选择了一个叫做Reservation的实体，这个实体有下面这些状态。

这个生命周期是非常简单的“当Reservation被创建，它是NEW状态。然后一些被授权的人可以接受这个Reservation，导致像座位被短暂地保留的事件发生，然后给人发送一个e-mail，让其为Reservation付费。再然后，用户执行转账，钱到账，打印票据，然后发送第二封邮件给客户。

你肯定已经意识到一些动作依据Reservation 当前的状态有不同的效果。例如，你可以在任意时间取消reservation，但是依赖于Reservation当前的状态，取消动作可能导致退款然后取消reservation，或者仅仅是发送给用户一个e-mail。一些动作不依赖于特定的状态（如果用户为一个已经取消的reservation付账会怎么样）或者应该被忽略。如果你在每个状态和每个业务方法中用了if-else结构，现在想象一下依据上边的状态机写出业务方法将有多难。

为了解决这个问题，我将不解释原始的GoF状态设计模式。而是介绍一些在使用了java ENUM的功能之后，我对这个设计模式的一些改变的地方。代替为状态抽象创建一个抽象的类或接口，然后为每一个状态写实现这种方式，我简单的创建一个包含了所有可用的状态的enum。

``` java ReservationStatus
public enum ReservationStatus {
 NEW,
 ACCEPTED,
 PAID,
 CANCELLED;
}
```

然后我为所有依赖于状态的业务方法创建了一个接口。把这个接口当做所有状态的抽象基类，但是我们将以稍微不同的方式使用它。

``` java ReservationStatusOperations
public interface ReservationStatusOperations {
 ReservationStatus accept(Reservationreservation);
 ReservationStatus charge(Reservationreservation);
 ReservationStatus cancel(Reservationreservation);
}
```

最后，Reservation领域对象，恰巧同时也是一个JPA实体（省略getters/setters）。

``` java Reservation
public class Reservation {
 private intid;
 privateString name;
 privateCalendar date;
 privateBigDecimal price;
 privateReservationStatus status = ReservationStatus.NEW;
 
 //getters/setters
 
}
```

如果Reservation是一个持久的领域对象，他的状态（ReservationStatus）很明显也应该被持久化。这个观察结果将使我们第一次体会到使用enum代替抽象类的巨大好处：JPA/Hibernate可以很容易地使用enum的名字或者顺序的值（默认）序列化和持久化java enum到数据库中。在原始的GoF模式中，我们将直接把ReservationStatusOperations 对象放到领域对象中，然后状态改变时切换不同的实现。我建议使用enum然后仅改变enum的值。使用enum的另一个优势（不是以框架为中心的但是更重要的）是所有可能的状态在一个地方列出。你不必在你的源码中爬行来寻找所有的状态基类的实现。所有的东西都能在一个地方被看到，一个逗号分隔的列表。

OK，深呼吸。现在我解释一下所有的部分如何在一起工作，ReservationStatusOperations 中的业务操作为什么返回ReservationStatus。首先，你必须回忆一下， enum究竟是什么。他们不仅仅是像C/C++那样的多个常量在一个命名空间下的集合。在JAVA中，enum是多个类的闭集，继承自一个公共的基类（例如ReservationStatus），最后继承自enum类。所以当使用enum的时候，我们可能就使用了多态和继承。

``` java ReservationStatus
public enum ReservationStatus implements ReservationStatusOperations {

  NEW {
   publicReservationStatus accept(Reservation reservation) {
     //..
   }
   publicReservationStatus charge(Reservation reservation) {
     //..
   }
   publicReservationStatus cancel(Reservation reservation) {
     //..
   }
  },

  ACCEPTED {
   publicReservationStatus accept(Reservation reservation) {
    //..
   }
   publicReservationStatus charge(Reservation reservation) {
    //..
   }
   publicReservationStatus cancel(Reservation reservation) {
    //..
   }
  },

  PAID {/*...*/},

  CANCELLED {/*...*/};
}
```

虽然以上边的方式写一个ReservationStatusOperations 类很容易，但是从长远来看，这是一个坏主意。不仅enum源代码会极其的长（所有要实现的方法的数量等于状态的数量乘以业务方法的数量），而且是一个坏的设计（所有状态的业务逻辑在一个类中）。一个enum也可以实现一个接口，这个奇特的语法可能与没有参加过SCJP exam 考试的人的直觉相反。我们将提供一个简单的中间层，因为计算机科学中的任何问题都可以被另一个中间层解决。

``` java ReservationStatus
public enum ReservationStatus implementsReservationStatusOperations {
 
  NEW(newNewRso()),
  ACCEPTED(newAcceptedRso()),
  PAID(newPaidRso()),
  CANCELLED(new CancelledRso());
 
  privatefinal ReservationStatusOperations operations;
 
  ReservationStatus(ReservationStatusOperationsoperations) {
    this.operations = operations;
  }
 
  @Override
  publicReservationStatus accept(Reservation reservation) {
    returnoperations.accept(reservation);
  }
 
  @Override
  publicReservationStatus charge(Reservation reservation) {
    returnoperations.charge(reservation);
  }
 
  @Override
  publicReservationStatus cancel(Reservation reservation) {
    returnoperations.cancel(reservation);
  }
 
}
```

这是我们的ReservationStatus enum的最终的源代码（实现ReservationStatusOperations 不是必须的）。把事情变简单：每一个enum值都自己特定的ReservationStatusOperations 实现（简写为Rso）。ReservationStatusOperations 的实现作为构造函数的参数，然后赋给一个命名为operations的final类型的域。现在，不管enum中的业务方法什么时候被调用，调用将被委托给特定的ReservationStatusOperations 实现。

``` java
ReservationStatus.NEW.accept(reservation);       // will call NewRso.accept()
ReservationStatus.ACCEPTED.accept(reservation);  // will call AcceptedRso.accept()
```

最后一个要实现的部分是包含业务方法Reservation领域对象。

``` java
public void accept() {
  setStatus(status.accept(this));
}
 
public void charge() {
  setStatus(status.charge(this));
}
 
public void cancel() {
  setStatus(status.cancel(this));
}
 
public void setStatus(ReservationStatus status) {
  if (status!= null && status != this.status) {
    log.debug("Reservation#" + id + ": changing status from" + this.status+ " to " + status);
    this.status = status;
  }
}
```

这里发生了什么？当你在一个Reservation领域对象实例上调用任何业务方法，ReservationStatus  enum的某个值的相应的方法就会被调用。依据当前的状态，一个不同的方法（不同ReservationStatusOperations 实现的）将会被调用。但是没有switch-case 和if-else结构，仅仅使用了多态。例如，如果当status域指向ReservationStatus.ACCEPTED，你调用了charge()方法，AcceptedRso.charge() 将会被调用，消费者将会被要求付款，付款之后，Reservation状态改变成PAID。

但是如果我们在同一个实例再次调用charge()会发生什么？status域现在指向ReservationStatus.PAID，所以PaidRso.charge() 将会被执行，这将会抛出一个业务错误（为一个已付款的Reservation付款是无效的）。没有条件判断的代码，我们实现了一个业务方法状态敏感的领域对象。

我还没有提到的一件事是如何从一个业务方法改变Reservation的状态。这是与原始的GoF模式第二个不同的地方。我从业务方法简单的返回一个新的状态，而不是传递一个StateContext 实例给每一个状态敏感的操作（像accept()或者charge()方法），这种方式经常被用来改变状态。如果给定的状态不是null而且与先前的状态不同（setStatus方法中实现），Reservation对象将转变为给定的状态。让我们看一下在AcceptedRso 对象中是如何工作的（Reservation对象在ReservationStatus.ACCEPTED 状态，它的方法将要被执行）。

``` java implementsReservationStatusOperations
public class AcceptedRso implementsReservationStatusOperations {
 
  @Override
  publicReservationStatus accept(Reservation reservation) {
   throw newUnsupportedStatusTransitionException("accept",ReservationStatus.ACCEPTED);
  }
 
  @Override
  publicReservationStatus charge(Reservation reservation) {
    //chargeclient's credit card
    //sende-mail
    //printticket
    returnReservationStatus.PAID;
  }
 
  @Override
   publicReservationStatus cancel(Reservation reservation) {
     //sendcancellation e-mail
     returnReservationStatus.CANCELLED;
   }
 
}
```

在ACCEPTED 状态的Reservation 可以通过上边的类源码很容易地理解：当一个Reservation已经被accept时，试图accept第二次将会跑出一个错误，收费将使用客户的信用卡，打印给他一个票据然后发送一个email等等。同时，付费操作将返回一个PAID状态，这将使Reservation转换成这个状态。这意味着第二次调用charge将被不同的ReservationStatusOperations 实现处理（PaidRso），没有条件判断。

上边是关于状态模式的全部。如果你不相信这种设计模式，比较一下使用条件判断的代码这种传统的方式的工作量和容易出错的代码。

我没有展示所有的ReservationStatusOperations 的实现，但是如果你将在基于JavaEE的String或者EJB中引入这种方式，你可能已经看到一个弥天大谎。我描述了每一个业务方法应该发生的事情，但是没有提供具体的实现。我没有的原因是因为我遇到了一个大问题：一个Reservation实例通过手工（用new）或者持久化框架像hibernate创建。 It uses statically created enum which creates manuallyReservationStatusOperations implementations.没有办法去注入依赖，DAOs和service.对于这个类来说，它的整个生命周期都在spring或者ejb的容器管辖之外。实际上，有一个简单有效的解决方案，使用Spring和AspectJ。但是耐心点，我将在下一封邮件中详细的解释，如何给应用增加一点领域驱动的味道。

就这样。一个非常有趣的邮件，解释了如何在DDD方式中使用状态模式，作者是我们的JCG伙伴，Tomasz Nurkiewicz.。我非常期待这个教程的下一个部分。下一个部分是：Domain Driven Design with Spring and AspectJ.

**Related Articles:**
[Domain Driven Design with Spring and AspectJ](https://www.javacodegeeks.com/2011/02/domain-driven-design-spring-aspectj.html)
[Spring configuration with zero XML](https://www.javacodegeeks.com/2011/01/spring-configuration-zero-xml.html)
[10 Tips for Proper Application Logging](https://www.javacodegeeks.com/2011/01/10-tips-proper-application-logging.html)
[Things Every Programmer Should Know](https://www.javacodegeeks.com/2010/12/things-every-programmer-should-know.html)
[Dependency Injection – The manual way](https://www.javacodegeeks.com/2010/12/dependency-injection-manual-way.html)

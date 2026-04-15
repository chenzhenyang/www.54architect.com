---
title: The Perfect Singleton
tags:
  - Design Pattern
categories:
  - Design Pattern
abbrlink: 3384101157
date: 2019-03-20 12:47:08
---
我不时遇到那些事实上不确定他们应该如何合适地实现单例模式的Java程序员。
我不考虑在线程的环境中合适的实现。但是使用你能在网络上找到的大多数常见的实现方式，你可以轻松地创建你想要的多种单例实现。
<!-- more -->
假设你有下面这种常见的单例的实现：
``` java NonSafeSingletonimplements
public final class NonSafeSingletonimplements Serializable {
 
   private static final NonSafeSingleton INSTANCE = new NonSafeSingleton();
 
   private NonSafeSingleton() {}
 
   public static NonSafeSingleton getInstance() {
       return INSTANCE;
    }
}
```

现在，注意到Serializable 这个单词。思考一会…..你是对的。如果通过RMI发送上边的代码，你将会得到第二个实例。它应该足够可以做一些内存中的序列化和反序列化操作。你刚刚违反了单例的规则。那不是很好。但是如何修复它？通常我会用两种方式：

# 困难的方式（如果你用Java1.4或者更老的版本）

你需要在你的单例类中实现一个readResolve方法。这通常用来重写序列化机制已经创建的内容。在这个方法里返回的是用来代替来自序列化的数据。这里仅需要返回你的实例：

``` java
protected Object readResolve() throws ObjectStreamException {
  return INSTANCE;
}
```
# 简单的方式（如果你用Java1.5或更新的版本）

将你的单例类改成枚举类型，然后移除私有构造方法和getInstance方法。下面，真的很简单。然后你将免费得到下面这个：

``` java
public enum SafeSingleton implements Serializable {
    INSTANCE;
}
```



当你再实现单例模式时，记住这些。如果你大量的使用RMI,它可以使你的生活更加简单。


**Reference**: [The Perfect Singleton](https://jdevel.wordpress.com/2010/10/02/the-perfect-singleton/) fromour [JCG partner](https://www.javacodegeeks.com/join-us/jcg) MarekPiechut at the [Development worldstories](https://jdevel.wordpress.com/).

# Related Articles

[The dreaded double checked locking idiom in Java](https://www.javacodegeeks.com/2011/03/dreaded-double-checked-locking-idiom-in.html)
[Java Secret: Using an enum to build a State machine](https://www.javacodegeeks.com/2011/07/java-secret-using-enum-to-build-state.html)
[Dependency Injection – The manual way](https://www.javacodegeeks.com/2010/12/dependency-injection-manual-way.html)
[Java Generics Quick Tutorial](https://www.javacodegeeks.com/2011/04/java-generics-quick-tutorial.html)
[How does JVM handle locks](https://www.javacodegeeks.com/2011/05/how-jvm-handle-locks.html)

# 译者注

这篇文章在并发编程网发出来的时候，下面有几个比较重要的评论在这粘贴一下，也给大家一点启发：

## 评论1
如果考虑线程的情况下，这种单例是我见过最好的了 initialization-on-demand holder idiom
``` java
public class SingletonInitiOnDemand {

  private SingletonInitiOnDemand() {
  };

  private static class SingletonHolder {
    private static final SingletonInitiOnDemand INSTANCE = new SingletonInitiOnDemand();
  }

  public static SingletonInitiOnDemand getInstance() {
    return SingletonHolder.INSTANCE;
  }
}
```

回答：
厉害，查了一下，这种方式巧妙地利用内部类的机制实现了延时加载和线程安全。

## 评论2
``` java
public enum SafeSingleton implements Serializable {
  INSTANCE;
}
```

您能把这段代码的实现原理机制说一下吗？
代码里不需要new 一个INSTANCE 实例吗？比如：

``` java
private static final NonSafeSingleton INSTANCE = new NonSafeSingleton;
```

回答：
这段代码的原理机制，就是enmu的原理机制。enmu对象是不需要new的。我下面写一个例子你就明白了。

``` java
enum SafeSingleton implements Serializable {

  INSTANCE;

  public void println() {
    System.out.println(“t”);
  }

}

public class Testt {

  public static void main(String[] args) {
    SafeSingleton singleton = SafeSingleton.INSTANCE;
    singleton.println();
  }

}
```
大家也可以在并发编程网查看更多的评论 http://ifeve.com/perfect-singleton/



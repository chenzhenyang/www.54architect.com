---
title: 'Java Secret: Using an enum to build a State machine'
abbrlink: 1404542518
date: 2019-03-20 12:21:54
tags:
- Java ABC
- Java enum
categories:
- Java
---
原文链接：[http://www.javacodegeeks.com/2011/07/java-secret-using-enum-to-build-state.html](http://www.javacodegeeks.com/2011/07/java-secret-using-enum-to-build-state.html)
作者：Peter Lawrey    译者：陈振阳

最近在读Hadoop#Yarn部分的源码，读到状态机那一部分的时候，感到enmu的用法实在是太灵活了，在给并发编程网翻译一篇文章的时候，正好碰到一篇这样的文章，就赶紧翻译下来，涨涨姿势。

# 综述
Java中的enum比其他的语言中的都强大，这产生了很多令人惊讶的用法。
本文中，我将列出Java中的enum的一些特性，然后将这些特性应用到一起构成一个状态机。
<!-- more -->
# Enum的单例和工具类用法
你可以非常简单地用一个enmu构建一个单例或者工具类。


``` java
enum Singleton {
    INSTANCE;
}

enum Utility {
    ; // no instances
}
```


# 用enum实现一个接口
你也可以在一个enum中实现一个接口。


``` java
interface Named {
    public String name();
    public int order();
}

enum Planets implements Named {
    Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune;
    // name() is implemented automagically.
    public int order() { return ordinal()+1; }
}
```

# 每一个enum实例，一个不同的子类
你可以重载一个enum实例的方法。这将高效的给以个enum的实例一个自己的实现。


``` java
// from http://download.oracle.com/javase/1,5.0/docs/guide/language/enums.html
public enum Operation {
  PLUS   { double eval(double x, double y) { return x + y; } },
  MINUS  { double eval(double x, double y) { return x - y; } },
  TIMES  { double eval(double x, double y) { return x * y; } },
  DIVIDE { double eval(double x, double y) { return x / y; } };

  // Do arithmetic op represented by this constant
  abstract double eval(double x, double y);
}
```

# 使用一个enum实现一个状态机
用上边的技术你可以做的是创建一个基于状态的enum。

在这个小例子中，一个解析器的状态机处理一个来自一个ByteBuffer的原始的XML。每一个状态都有自己的处理方法，如果没有足够的可用的数据，状态机可以返回来再次获取更多的数据。状态之间的每一次变换都被定义，所有状态的代码在一个enum中。


``` java
interface Context {
    ByteBuffer buffer();
    State state();
    void state(State state);
}

interface State {
    /**
       * @return true to keep processing, false to read more data.
     */
    boolean process(Context context);
}

enum States implements State {
    XML {
        public boolean process(Context context) {
            if (context.buffer().remaining() < 16) return false;
            // read header
            if(headerComplete)
                context.state(States.ROOT);
            return true;
        }
    }, ROOT {
        public boolean process(Context context) {
            if (context.buffer().remaining() < 8) return false;
            // read root tag
            if(rootComplete)
                context.state(States.IN_ROOT);
            return true;
        }
    }
}

public void process(Context context) {
    socket.read(context.buffer());
    while(context.state().process(context));
}
```

使用这种方式，可以创建一个XML解析器，解析器可以处理10微秒内的数据包。大多数情况下，它跟你需要的一样高效。

**Reference**: [Java Secret: Using an enum to build a State machine](http://vanillajava.blogspot.com/2011/06/java-secret-using-enum-as-state-machine.html) from our [JCG partner](https://www.javacodegeeks.com/join-us/jcg) [Peter Lawrey](http://www.blogger.com/profile/17982030676088168612) at the [Vanilla Java](http://vanillajava.blogspot.com/).

# Related Articles
[Low GC in Java: Use primitives instead of wrappers](http://www.javacodegeeks.com/2011/07/low-gc-in-java-use-primitives-instead.html)
[Java Lambda Syntax Alternatives](https://www.javacodegeeks.com/2011/06/java-lambda-syntax-alternatives.html)
[How does JVM handle locks](https://www.javacodegeeks.com/2011/05/how-jvm-handle-locks.html)
[Erlang vs Java memory architecture](https://www.javacodegeeks.com/2011/04/erlang-vs-java-memory-architecture.html)
[Java Fork/Join for Parallel Programming](https://www.javacodegeeks.com/2011/02/java-forkjoin-parallel-programming.html)




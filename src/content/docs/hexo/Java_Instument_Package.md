---
title: Java Instument Package
abbrlink: 1167341847
date: 2019-03-20 13:43:46
tags:
- Java ABC
- Instument
categories:
- Java
---
# java.lang.instrument简介
Java5之后，增加了一个包java.lang.instrument，这个包的东西很少，两个接口，ClassFileTransformer和Instrumentation，一个类ClassDefinition，还有两个Exception：IllegalClassFormatException和UnmodifiableClassException；
先剧透一下整个包最重要的接口Instrumentation提供的两个功能，总体的功能就是Instrument了，具体来讲两个，从字节码级别为类增加Instrument所需的代码，第二个是获取对象的大小。
先看一下这个包的描述吧，下面是JavaDoc的翻译：
<!-- more -->

## package java.lang.instrument
这个包提供允许一个Java程序语言的代理测量运行在JVM中的程序的多个指标的服务。

## Package Java.lang.instrumentDescription
这个包提供允许一个Java程序语言的代理测量运行在JVM中的程序的多个指标的服务。监测的机制是修改类的方法的字节码。

## Package Specification
一个代理就是部署一个Jar文件。Jar文件的manifest文件（每个jar包根目录下有个META-INF文件夹，此文件夹下的MANIFEST.MF文件就是这里的manifest文件）需要指定这个代理的类，指定之后，这个类将被加载以启动代理。因为支持命令行接口，所以一个代理可以通过在命令行中指定一个选项来移动。具体的实现也可能支持在虚拟机启动之后的某个时间开启代理。例如，一个具体的实现可能提供一个机制，使一个工具附加到一个运行的应用中，然后，初始化这个工具的代理，加载到正在运行的应用中。关于类的加载如何被初始化的细节，依赖于具体的实现。

## Command-Line Interface
在用命令行接口的实现中，一个代理可以通过增加下面的Option到命令行中启动：

``` java
-javaagent:jarpath[=options]
```

Jarpath是代理jar文件的路径。Option是代理的选项。上边的命令可以在同一个命令行中使用多次，因此，可以创建多个代理。多个代理可以使用同一jarpath。一个代理Jar文件必须符合Jar文件规范。

一个代理jar文件的manifest必须包含Premain-Class属性。这个属性的值是代理类的名字。代理类必须实现一个public static的premain 方法，与应用程序中的main方法作为程序入口的原理类似。JVM初始化之后，每一个premain方法将被以代理被指定时的顺序调用，然后应用程序真正的main方法将被调用。每一个premain方法必须以启动的顺序返回结果。（premain=pre-main）

Premain方法有两个重载的方法。JVM首先尝试调用代理类中下面的方法：


``` java
public static voidpremain(String agentArgs, Instrumentation inst);
```

如果代理类没有实现这个方法，jvm将尝试调用

``` java
public static voidpremain(String agentArgs);
```

代理类可能还有一个agentmain方法，当代理类在JVM启动之后被启动时使用。当代理类使用命令行选项被启动时，agentmain方法不被调用。

Agent类通过系统的类加载器加载（ClassLoader.getSystemClassLoader）。这个类加载器通常跟用来加载包含应用程序的main方法的类加载器是一个。Premain方法将运行在跟应用程序main方法同样的安全机制和类加载下。代理的premain方法做什么是没有限制的。任何应用程序main方法可以做的，包括创建线程，在premain中都是合法的。

每一个代理经由agentArgs参数传给它的代理选项。代理选项以一个字符串被被传递，任何附加的解析操作应该是代理自己执行。

如果代理不能被解析（例如，因为代理类不能加载，或者因为代理类没有一个合适的premain方法），JVM将会abort。如果一个premain方法跑出一个未捕获的错误，JVM将会abort。

## Starting Agents After VM Startup
一个代理具体的实现可能提供一个在JVM启动之后启动的机制。关于代理被初始化的细节是具体实现特定的，但是通常应用程序已经启动，应用程序的main方法已经被调用。在代理的实现支持在JVM启动之后启动的情况下，需要遵循下面的规则：

1. 代理的Jar文件中的manifest文件必须包含Agent-Class属性。这个属性的值是代理类的名字。
2. 代理类必须实现一个public static agentmain方法
3. 系统类加载器（ ClassLoader.getSystemClassLoader）必须支持增加一个代理Jar文件到系统类路径。

代理的Jar文件被追加到系统类路径中。这个类加载器是通常用来加载包含应用程序main方法的类的类加载器。代理类被加载之后，JVM尝试调用agentmain方法。JVM首先尝试调用代理类中的下面这个方法：

``` java
public static void agentmain(String agentArgs, Instrumentation inst);
```

如果代理类中没有实现这个方法，然后JVM尝试调用：

``` java
public static voidagentmain(String agentArgs);
```

这个代理类可能也有一个premain方法，当代理在命令行选项中启动时使用；当这个代理类在JVM启动之后启动时，premain方法不会被调用。

代理通过agentArgs参数传给代理选项。代理选项以字符串的形式传给代理内部的方法，任何附加的解析操作应该代理自己操作。

Agentmain方法应该做一些启动代理之前必要的初始化操作。当启动完成时，这个方法应该返回。如果代理不能被启动（例如，因为代理类不能被加载，或者因为代理类不包含一致的agentmain方法），JVM将不会被abort。如果agentmain方法抛出一个未捕获的错误，这个错误将被忽略。

注：著名的Java运行时分析工具Profiler有在监测Java程序时有两种模式，一种是用Profiler启动应用，一种是应用启动，然后附加到Profiler中，就是分别用的上边的两种方式。

## Manifest Attributes
下面的manifest属性在一个代理的jar文件中被定义：

Premain-Class

当一个代理在JVM启动时被指定时，这个属性指定代理使用的类。也就是，这个类包含premain方法。当一个代理在JVM启动时被指定时，这个属性是必须的。如果没有配置这个属性，JVM将会abort。注意：这是一个雷的名字，不是一个文件名活路径。

**Agent-Class**
如果一个代理的实现支持在JVM启动之后的某个时间启动，这个属性指定一个代理类。也就是说，这个类要包含agentmain方法。这个属性是必须的，如果不配置的话，代理将不会被启动。注意：这是一个类的名字，不是一个文件名字，也不是文件路径。

**Boot-Class-Path**
这个代理的实现中用到的第三方jar包都放到这里边。

**Can-Redefine-Classes**
Boolean（true或false）。Agent是否可以重定义类。可选的，默认是false。

**Can-Retransform-Classes**
Boolean（true或false）。Agent是否可以将类变回原形。可选的，默认是false。

**Can-Set-Native-Method-Prefix**
Boolean（true或false）。Agent是否可以设置本地方法的前缀。可选的，默认是false。

一个代理Jar文件中的manifest文件可能同时包含Premain-Class和Agent-Class属性。当代理在命令行中用-javaagent选项被启动，使用Premain-Class属性指定的代理类的名字，然后Agent-Class属性的配置被忽略。相似地，如果代理在JVM启动之后的某个时间启动，使用Agent-Class属性指定的类的名字，Premain-Class属性被忽略。

# Instrumentation
下面再看一下Instrumentation这个最主要的接口的一些介绍。

这是一个接口，提供了监测java程序语言代码的服务。Instrumentation将附加的功能的字节码添加到被监控的方法中，来收集应用的运行的一些数据。因为这个改变只有增加东西，监测工具可以不用修改应用的状态和表现。这样的工具包括监控代理，分析工具，代码覆盖分析器和事件日志器等。

有两种方式获得一个Instrumentation接口的实例：

1. 当JVM启动时，指定一个代理类。在这种情况下，一个Instrumentation实例传到代理类的premain方法中。
2. JVM提供可以让代理类在JVM启动后启动的机制。在这种情况下，一个Instrumentation实例传给代理的agentmain方法。

这两种机制在上边的package specification中有详尽的描述。

一旦一个代理获取到一个Instrumentation实例，代理可以再之后的任何时刻调用实例的方法。

## Method Summary
主要的方法就是下面几个：

addTransformer：指定一个ClassFileTransformer对象。可以先看下下面ClassFileTransformer接口的介绍。
getAllLoadedClasses：返回当前JVM中加载的所有的类的数组（牛逼）
getInitiatedClasses：返回指定的类加载器中的所有的类的数据（牛逼，too）
getObjectSize：返回一个对象近似的大小
redefineClasses：用给定的类的字节码数组替换指定的类的字节码文件，也就是重新定义指定的类
retransformClasses：指定一系列的Class对象，被指定的类都会重新变回去（去掉附加的字节码）
剩下的几个都是对上边manifest文件中配置的属性的一下操作和运行时接口。


到这，看下Instrumentation接口的主要功能，从Instrumentation接口提供的这几个方法，可以看出Instrumentation的主要功能，就是修改类的字节码文件，更确切的说是修改类的字节码文件，增加自定义的功能的字节码，生成一个新的字节码文件。这是这个接口存在的最主要的意义。

# ClassFileTransformer
先看下Doc上的简介，一个代理提供一个为了改变类文件而存在的接口的实现。这个改变发生在这个类被JVM定义之前。

这个接口只有一个方法transform，将类的字节码传给这个方法，然后返回一个增加了自定义的功能的字节码的字节数组。

这个接口存在的意义，主要是解耦Instrumentation类和改变类文件的操作。

# ClassDefinition
这个类只在Instrumentation#redefineClasses方法中被调用，这个类有两个域，

Class mClass；

Byte[] mClassFile；

mClass是要重新定义的类的Class对象

mClassFile是新的类的字节码数组

# example1
下面举一个简单的例子，来感受一下，来自网络，功能是打印每一个方法的执行时间。

## Agent类

``` java PerfMonAgent
packagecom.highgo.test.instrumentation;
 
importjava.lang.instrument.ClassFileTransformer;
importjava.lang.instrument.Instrumentation;
 
public class PerfMonAgent {
 
         private static Instrumentation inst = null;
 
         public static void premain(String agentArgs, Instrumentation_inst) {
                   System.out.println("PerfMonAgent.premain()was called. I am premain!");
                   // Initialize the static variables we use to trackinformation.
                   inst = _inst;
                   // Set up the class-file transformer.
                   ClassFileTransformer trans = new PerfMonXformer();
                   System.out.println("Adding a PerfMonXformerinstance to the JVM.");
                   inst.addTransformer(trans);
         }
 
         public static void agentmain(String agentArgs,Instrumentation _inst) {
                   System.out.println("PerfMonAgent.premain()was called. I am agentmain!");
                   // Initialize the static variables we use to trackinformation.
                   inst = _inst;
                   // Set up the class-file transformer.
                   ClassFileTransformer trans = new PerfMonXformer();
                   System.out.println("Adding a PerfMonXformerinstance to the JVM.");
                   inst.addTransformer(trans);
         }
}
```

## ClassFileTransformer类

``` java
packagecom.highgo.test.instrumentation;
 
importjava.lang.instrument.ClassFileTransformer;
importjava.lang.instrument.IllegalClassFormatException;
importjava.security.ProtectionDomain;
 
importjavassist.CannotCompileException;
import javassist.ClassPool;
import javassist.CtBehavior;
import javassist.CtClass;
importjavassist.NotFoundException;
importjavassist.expr.ExprEditor;
importjavassist.expr.MethodCall;
 
public class PerfMonXformerimplements ClassFileTransformer {
         public byte[] transform(ClassLoader loader, StringclassName, Class<?> classBeingRedefined,
                            ProtectionDomain protectionDomain, byte[]classfileBuffer) throws IllegalClassFormatException {
                   byte[] transformed = null;
                   System.out.println("Transforming " +className);
                   ClassPool pool = ClassPool.getDefault();
                   CtClass cl = null;
                   try {
                            cl = pool.makeClass(newjava.io.ByteArrayInputStream(classfileBuffer));
                            if (cl.isInterface() == false) {
                                     CtBehavior[] methods =cl.getDeclaredBehaviors();
                                     for(int i = 0; i < methods.length; i++) {
                                               if(methods[i].isEmpty() == false) {
                                                        doMethod(methods[i]);
                                               }
                                     }
                                     transformed = cl.toBytecode();
                            }
                   } catch (Exception e) {
                            System.err.println("Could notinstrument  " + className + ",  exception : " + e.getMessage());
                   } finally {
                            if (cl != null) {
                                     cl.detach();
                            }
                   }
                   return transformed;
         }
 
         private void doMethod(CtBehavior method) throwsNotFoundException, CannotCompileException {
                   // method.insertBefore("long stime =System.nanoTime();");
                   //method.insertAfter("System.out.println(\"leave"+method.getName()+" andtime:\"+(System.nanoTime()-stime));");
                   method.instrument(new ExprEditor() {
                            public void edit(MethodCall m) throwsCannotCompileException {
                                     m.replace("{ long stime =System.nanoTime(); $_ = $proceed($$); System.out.println(\""
                                                        +m.getClassName() + "." + m.getMethodName() +":\"+(System.nanoTime()-stime));}");
                            }
                   });
         }
}
```

## MANIFEST.MF文件

``` java
Manifest-Version: 1.0
Premain-Class:com.highgo.test.instrumentation.PerfMonAgent
Boot-Class-Path: javassist.jar
```

Boot-Class-Path这样写要将javassist.jar文件放到jar包的根目录

## 打jar包

``` java
jar cvfm inst.jar MANIFEST.MFjavassist.jar com
```

使用自己写的MANIFEST.MF文件，
将javassist.jar和com文件夹下的类打成jar包
这样这个jar包就作为一个提供打印方法时间的服务而存在了

## 使用inst.jar
随便编写一个类

``` java
public class App {
   public static void main(String[] args) {
      new App().test();
   }
 
   public void test() {
      System.out.println("HelloWorld!!");
   }
}
```

运行此类

``` java
java -javaagent:../inst.jarclasspath .;../inst.jar App
```

可以看到，将运行这个类的过程中用到的所有的类的方法的方法名+时间都打印出来了。

# example12
这里使用第二种方式，也就是先启动JVM，再启动agent类的方式，做一个例子。

在使用JProfiler的quick attch时，我们的使用方法是这样的：运行我们的应用程序，切换到这个界面，我们的应用就会出现在下面这个地方，ID是OS分配给这个进程的进程ID，后边是进程的名字，其实attch用到的只是进程ID号；选中这个进程，就到了分析界面了。


我们下面的例子也是按照这个顺序：

1. 编写Agent，打包成服务
2. 编写一个应用程序，运行
3. 编写一个工具，将Agent的jar包attach到Agent所在的JVM（具体实现是将应用程序的ID传递给工具）

## 编写Agent

``` java classPerfMonAgent
packagecom.highgo.test.instrumentation;
 
importjava.lang.instrument.ClassFileTransformer;
importjava.lang.instrument.Instrumentation;
 
public classPerfMonAgent {
 
   private static Instrumentation inst = null;
 
   public static void premain(String agentArgs,Instrumentation _inst) {
      System.out.println("PerfMonAgent.premain()was called. I am premain!");
      // Initialize the static variables we useto track information.
      inst = _inst;
      // Set up the class-file transformer.
      ClassFileTransformer trans = newPerfMonXformer();
      System.out.println("Adding aPerfMonXformer instance to the JVM.");
      inst.addTransformer(trans);
   }
 
   public static void agentmain(StringagentArgs, Instrumentation _inst) {
      System.out.println("PerfMonAgent.premain()was called. I am agentmain!");
      inst = _inst;
      Class<?>[] classes =inst.getAllLoadedClasses();
      for (Class<?> cls : classes) {
         System.out.println(cls.getName());
      }
      System.out.println("classeslength:"+classes.length);
      System.out.println("PerfMonAgent.premain()end!");
   }
}
```

这里把第二种方式用到的agentmain方法直接加到第一种方式使用的类中了。

## 编写MANIFEST文件

``` java MANIFEST
Manifest-Version: 1.0
Premain-Class:com.highgo.test.instrumentation.PerfMonAgent
Agent-Class:com.highgo.test.instrumentation.PerfMonAgent
Boot-Class-Path: javassist.jar
```

只是增加了Agent-Class的配置。

## 将此Agent打成Jar包

``` java
jar cvfm inst.jar MANIFEST.MFjavassist.jar com
```

还是上边用到的命令

## 编写应用程序

``` java
public class TargetVM {
   public static void main(String[] args) throws InterruptedException {
      while (true) {
         Thread.sleep(1000);
      }
   }
}
```

就一个线程，一直运行着。

## 查看上边进程的ID
用jps命令可以方便的查看进程的ID，名字是应用程序main方法所在的类的名字。可以很容易的分辨出来。

## 运行Attach工具类

``` java AttachUtil
public class AttachUtil {
   public static void main(String[] args) throws AttachNotSupportedException, IOException, AgentLoadException,AgentInitializationException {
      String id = "520384";
      VirtualMachine vm = VirtualMachine.attach(id);
        vm.loadAgent("inst.jar");
   }
}
```

这里用到了JDK的tools.jar工具包，不了解这个Jar包的朋友可以再本博客搜一下关于这个jar包的详细介绍。Eclipse默认加的jar包没有这个，可以从jdk的安装目录里找到，加到项目的sspath里就行了；如果是用javac去编译的话，只要将这个类加入到系统的classpath里就可以了，这个工具类就也可以编译，也可以运行了。

将ID修改成jps查看到的那个ID号，这个工具类就可以创建一个ID号所在的进程的VirtualMachine对象，这个对象就代表那个JVM。VirtualMachine#loadAgent方法可以加载一个Agent。

当AttachUtil方法运行到vm.loadAgent("inst.jar");这行代码的时候，就可以看到Eclipse的控制台会打印出PerfMonAgent# agentmain方法执行的打印内容,应用程序所在的JVM中加载的所有的类的名字。

# Instrumentation#getObjectSize
从上边Instrumentation的method summary可以看出，Instrumentation接口的另一个功能就是获取一个对象的大小。

这里我们直接分析一下classmexer的源码

## MANIFEST文件
Classmexer的Agent使用的是第一种方式，所以看他的MANIFEST.MF文件如下：

``` java MANIFEST
Manifest-Version: 1.0
Created-By: 1.6.0 (SunMicrosystems Inc.)
Premain-Class:com.javamex.classmexer.Agent
```

这个项目只有两个类，Agent和MemoryUtil

## Agent类
Agent的主要目的是获取一个Instrumentation的实例。内容如下：

``` java 
packagecom.javamex.classmexer;
 
import java.lang.instrument.Instrumentation;
 
public class Agent
{
  private static volatile Instrumentationinstrumentation;
 
  public static void premain(String args,Instrumentation instr)
  {
    instrumentation = instr;
  }
 
  protected static Instrumentation getInstrumentation()
  {
    Instrumentation instr = instrumentation;
    if (instr == null) {
      throw newIllegalStateException("Agent not initted");
    }
    return instr;
  }
}
```

## MemoryUtil类：

``` java MemoryUtil
packagecom.javamex.classmexer;
 
importjava.lang.instrument.Instrumentation;
importjava.lang.reflect.Field;
import java.util.Collection;
import java.util.HashSet;
import java.util.Set;
import java.util.Stack;
 
public class MemoryUtil
{
  public static enum VisibilityFilter
  {
    ALL, PRIVATE_ONLY,  NON_PUBLIC,  NONE;
  }
 
  public static long memoryUsageOf(Object obj)
  {
    returnAgent.getInstrumentation().getObjectSize(obj);
  }
 
  public static long deepMemoryUsageOf(Objectobj)
  {
    return deepMemoryUsageOf(obj,VisibilityFilter.NON_PUBLIC);
  }
 
  public static long deepMemoryUsageOf(Objectobj, VisibilityFilter referenceFilter)
  {
    returndeepMemoryUsageOf0(Agent.getInstrumentation(), new HashSet(), obj,referenceFilter);
  }
 
  public static longdeepMemoryUsageOfAll(Collection<? extends Object> objs)
  {
    return deepMemoryUsageOfAll(objs,VisibilityFilter.NON_PUBLIC);
  }
 
  public static longdeepMemoryUsageOfAll(Collection<? extends Object> objs, VisibilityFilterreferenceFilter)
  {
    Instrumentation instr =Agent.getInstrumentation();
    long total = 0L;
   
    Set<Integer> counted = newHashSet(objs.size() * 4);
    for (Object o : objs) {
      total += deepMemoryUsageOf0(instr,counted, o, referenceFilter);
    }
    return total;
  }
 
  private static longdeepMemoryUsageOf0(Instrumentation instrumentation, Set<Integer> counted,Object obj, VisibilityFilter filter)
    throws SecurityException
  {
    Stack<Object> st = new Stack();
    st.push(obj);
    long total = 0L;
    while (!st.isEmpty())
    {
      Object o = st.pop();
      if (counted.add(Integer.valueOf(System.identityHashCode(o))))
      {
        long sz =instrumentation.getObjectSize(o);
        total += sz;
       
        Class clz = o.getClass();
       
 
        Class compType =clz.getComponentType();
        Object localObject1;
        Object localObject2;
        Object el;
        if ((compType != null) &&
          (!compType.isPrimitive()))
        {
          Object[] arr = (Object[])o;
          Object[] arrayOfObject1 =arr;localObject1 = 0;
         for (localObject2 = arrayOfObject1.length; localObject1 <localObject2; localObject1++)
          {
            el = arrayOfObject1[localObject1];
            if (el != null) {
              st.push(el);
            }
          }
        }
        while (clz != null)
        {
          for (Field fld :clz.getDeclaredFields())
          {
            int mod = fld.getModifiers();
            if (((mod & 0x8) == 0)&& (isOf(filter, mod)))
            {
              Class fieldClass = fld.getType();
              if (!fieldClass.isPrimitive())
              {
                if (!fld.isAccessible()) {
                  fld.setAccessible(true);
                }
                try
                {
                  Object subObj = fld.get(o);
                  if (subObj != null) {
                    st.push(subObj);
                  }
                }
                catch (IllegalAccessExceptionillAcc)
                {
                  throw new InternalError("Couldn'tread " + fld);
                }
              }
            }
          }
          clz = clz.getSuperclass();
        }
      }
    }
    return total;
  }
 
  private static boolean isOf(VisibilityFilterf, int mod)
  {
    switch (f)
    {
    case ALL:
      return true;
    case PRIVATE_ONLY:
      return false;
    case NONE:
      return (mod & 0x2) != 0;
    case NON_PUBLIC:
      return (mod & 0x1) == 0;
    }
    throw newIllegalArgumentException("Illegal filter " + mod);
  }
}
```

可以看出，最主要的方法是deepMemoryUsageOf0(Instrumentation instrumentation,Set<Integer> counted, Object obj, VisibilityFilter filter)
这个方法的主要的工作是对一个对象的域进行深度遍历，获取最底层的每个对象的大小，然后加起来。
到这里，Instrumentation的所有的功能就完事了，其实就是两个，一个获取对象的大小，一个是作为一个服务，在JVM中的类被定义之前修改类的字节码，跟Spring的AOP不仅形似而且神似。
上边的两个Example的代码分别来自于：
http://blog.csdn.net/ykdsg/article/details/12080071
http://blog.csdn.net/pwlazy/article/details/5109742

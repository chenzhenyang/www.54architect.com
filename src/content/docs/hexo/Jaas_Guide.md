---
title: Jaas Guide
abbrlink: 706353777
date: 2019-03-20 13:57:26
tags:
- Java ABC
- JAAS
categories:
- Java
---
本指南扩展了在JAAS Authentication文档中的程序和policy文件，展示了JAAS Authorization组件，这个组件确保被认证的调用者对后续的安全敏感的操作有访问控制的权利（权限）。因为授权组件首先需要用户认证操作完成，请先阅读JAAS Authentication的doc。
<!-- more -->
本教程剩下的部分包含目录列出的内容：

如果你想先看下教程代码的运行，你可以直接跳到运行代码的部分，然后再回来看其他的部分了解更多。

# 什么是JAAS Authorization？
JAAS授权扩展了已经存在的JAVA安全机构，已存在的安全架构用一个策略文件来指定执行的代码被授予什么访问权限。在Java 2平台中介绍的这个架构是以代码为中心的。也就是说，权限基于代码的特性被授予：代码从哪里来，是否有数字签名，如果有，是谁签的。我们在JAAS Authentication教程的jassacn.policy文件中看到的例子。这个文件包含下面的内容：

``` java
grant codebase"file:./JaasAcn.jar" {
  permission javax.security.auth.AuthPermission
                   "createLoginContext.JaasSample";
};
```

授权JaasAcn.jar中的代码指定的权限（没有指定签名者，所有代码签不签名不重要）。

JAAS授权增加新的用户中心的访问权限到已存在的代码中心的访问权限。权限的授予标准不仅基于什么代码在运行而且考虑到谁在运行它。

当一个应用用JAAS认证来认证一个用户（或者其他的实体，比如一个服务），一个Subject被创建作为结果。Subject的作用是代替被认证的用户。一个Subject由很多Principal组成，每一个Principal代表那个用户的一个身份。例如。一个Subject可以有一个名字身份（“Susan Smith“）和一个社会安全号码（”987-65-4321“），因此，可以区分于其他的Subject。

权限可以被策略文件来授予给特定的Principal。在用户被认证后，应用可以将一个Subject和当前的访问控制环境联系。对于后续的安全检查操作，（例如，一个本地的文件访问），java运行时环境将自动判定策略是否授权给一个特定的Principal需要的权限，如果授权了，操作将被允许，只有在与Subject连接的访问控制上下文中包含指定的Principal。

# JAAS授权如何工作？
一个授权操作，需要下面的步骤：

1. 用户必须被认证，就像在JAAS Authentication tutorial里描述的
2. 安全策略必须配置基于Principal的条目
3. 认证的结果，Subject必须与当前的访问控制环境连接。

# 基于Principal的策略文件怎么写？
策略文件的grant语句可以选择性的包含一个或者多个Principal字段。Principal字段声明用户或者被特定Principal代表的其他实体，执行特定的代码，有指定的权限。

因此，grant语句基本的格式是：

``` java
grant <signer(s) field>, <codeBase URL> <Principal field(s)> { 
  permission perm_class_name "target_name", "action"; 
  .... 
  permission perm_class_name "target_name", "action"; 
};
```

每一个签名。CodeBase和Principal字段所在的位置是可选的，字段间的顺序也不重要：
一个Principal字段可以像下面这样：
也就是说，单词Principal（位置不重要），紧跟着一个Principal类和一个Principal的名字。
一个Principal类是一个实现了java.security.Principal接口的类。所有的Principal对象有一个相关联的名字，这个名字可以调用它的getName方法得到。名字所用的格式依赖于每一个Principal的实现。

本教程中使用的Kerberos的认证机制创建的Subject中的Principal的类型是javax.security.auth.kerberos.KerberosPrincipal，也就是应该被用作grant语句的Principal_class的部分。KerberosPrincipals 的用户名是” name@realm “格式。所以，如果用户名是mjones，Realm是KRBNT-OPS.ABC.COM，那么grant语句中使用的principal_name就是mjones@KRBNT-OPS.ABC.COM。

在一个grant语句中可能包含多个Principal字段。如果多个Principal字段被指定，grant语句中的权限仅在Subject包含所有这些Principal时被授予。
为了给不同的Principal授予同样的权限，创建多个只包含一个Principal字段的grant语句。

本教程的策略文件包含一个只有一个Principal字段的grant语句：

``` java
grant codebase "file:./SampleAction.jar",
    Principal javax.security.auth.kerberos.KerberosPrincipal 
        "your_user_name@your_realm"  {
 
   permission java.util.PropertyPermission "java.home", "read";
   permission java.util.PropertyPermission "user.home", "read";
   permission java.io.FilePermission "foo.txt", "read";
};
```

将Kerberos的用户名和Realm替换成你自己的。
上边的配置指出，显式授予指定的Principal执行SampleAction.jar中的代码的权限。

# 如何将一个Subject和访问控制上下文关联?
为了创建和用访问控制上下文关联一个Subject，你需要下面的过程：

1. 用户必须先被认证，就是JAAS Authentication joc中描述的。
2. Subject类的静态的doAs方法必须被调用，传给其一个认证了的Subject和一个java.security.PrivilegedAction或者java.security.PrivilegedExceptionAction。（(See API for PrivilegedBlocks fora comparison of PrivilegedAction and PrivilegedExceptionAction.)）。doAs方法用当前的访问控制上下文关联给定的Subject，然后调用Action的run方法。Run方法的实现包含作为指定的Subject，所有被执行的代码。这样Action以特定的Subject执行。

Subject类的静态的doAsPrivileged 方法可以代替doAs方法被调用。除了传给doAs方法的参数外，doAsPrivileged 需要第三个参数：一个AccessControlContext对象。不想doAs方法，用当前的访问控制上下文联系Subject，方法doAsPrivileged 用给定的访问控制上下文联系Subject。See doAs vs. doAsPrivileged in theJAAS Reference Guide for a comparison of those methods。

# 授权教程代码
本教程的代码包含两个文件：

1. JaasAzn.java除了Subject.doAsPrivileged调用中额外的代码，与JAASAuthentication教程中的JaasAcn.java文件一样。
2. SampleAction.java包含SampleAction类。这个类实现了PrivilegedAction，有一个run方法，这个方法包含了所有我们想基于Principal认证检查执行的代码。

## JaasAzn.java
JaasAzn.java与之前的教程中用的到JaasAcn.java完全一样，除了在mian方法的在认证完成后语句之后增加了3条语句。这些语句使一个带表一个通过认证的用户的Subject与当前访问控制上下文关联，然后执行SampleAction的run方法中的一些代码。用访问控制表关联Subject使SampleAction的run方法中安全敏感的操作（任何run方法中直接或间接调用的代码）在代表一个认证的用户的Principal被在当前的策略中被授予必要的权限时被执行。

跟JaasAcn.java一样，JaasAzn.java初始化一个LoginContext lc和调用它的login方法来执行认证。如果成功，被认证的Subject（包含一个代表这个用户的Principal）通过LoginContext的getSubject方法获得。

``` java
Subject mySubject = lc.getSubject();
```

然后，Main方法调用Subject.doAsPrivileged，将通过认证的Subjectmysubject传给它，一个PrivilegedAction(SampleAction)和一个null AccessControlContext，就像下边的描述：
SampleAction 通过下面的方式被初始化：

``` java
PrivilegedAction action = new SampleAction();
```

Subject.doAsPrivileged 通过下面的方式被执行：

``` java
Subject.doAsPrivileged(mySubject, action, null);
```

doAsPrivileged 方法调用PrivilegedAction action (SampleAction)  的run方法开始执行剩下的代码，这些代码被认为是代表mySubject执行。

传给doAsPrivileged 方法一个null作为第三个参数AccessControlContext 表明mySubject应用与一个新的空的AccessControlContext关联。这个结果是以mySubject运行时，发生在SampleAction执行期间的安全检查将只需要SampleAction自己的代码（或者其他它调用的代码）权限。注意，doAsPrivileged 的调用者在执行期间不需要任何的权限。

## SampleAction.java
SampleAction.java包含SampleAction类。这个类实现了java.security.PrivilegedAction，有一个包含所有mySubject想执行的所有代码。对于本教程，我们将做3个步骤，每一个步骤都只有在代码被授予必要的权限的情况下才能做。我们将：

1. 读和打印java.home系统属性值
2. 读和打印user.name的系统属性值
3. 判断foo.txt文件在当前目录是否存在

这是代码：

``` java SampleAction
import java.io.File;
import java.security.PrivilegedAction;
 
public class SampleAction implements PrivilegedAction {
 
  public Object run() {
 
    System.out.println("\nYour java.home property value is: "
                + System.getProperty("java.home"));
 
    System.out.println("\nYour user.home property value is: "
                + System.getProperty("user.home"));
 
    File f = new File("foo.txt");
    System.out.print("\nfoo.txt does ");
    if (!f.exists())
        System.out.print("not ");
    System.out.println("exist in the current working directory.");
    return null;
  }
}
```

# 登录配置文件
本教程使用的登录配置文件与在JAAS Authentication教程中使用的完全一样。因此，我们可以用jaas.conf文件，文件仅包含一个条目：

``` java
JaasSample {
  com.sun.security.auth.module.Krb5LoginModule required;
};
```

这个条目被命名为“JaasSample”，也就是我们的教程的应用程序JaasAcn和JaasAzn应用的名字。这个条目指定了用来做认证的LoginModule 是com.sun.security.auth.module包中的Krb5LoginModule ，为了使认证被认为是成功的，Krb5LoginModule需 要“succeed”。 Krb5LoginModule只有在用户提供的用户名和密码成功的登录到Kerberos KDC时才成功。

# 策略文件
授权教程保罗两个类，JaasAzn和SampleAction。每个类中的代码包含一些安全敏感的操作，因此，相关的权限需要在一个策略文件中被执行，以使操作被允许执行。

JaasAzn需要的权限
JaasAzn类的main方法做了两个操作需要权限的操作：

1. 创建了一个LoginContext
2. 调用Subject类的doAsPrivileged 静态方法

LoginContext的创建与认证教程中的方式一样，因此，它需要与createLoginContext.JaasSample相同的权限javax.security.auth.AuthPermission。

为了调用Subject类的doAsPrivileged 方法，你需要对doAsPrivileged有一个javax.security.auth.AuthPermission对象。

假设JaasAzn类被放到jaasAzn.jar文件中，这些权限需要通过策略文件中配置grant语句来授权：

``` java
grant codebase "file:./JaasAzn.jar" {
   permission javax.security.auth.AuthPermission 
                    "createLoginContext.JaasSample";
   permission javax.security.auth.AuthPermission "doAsPrivileged";
};
```

SampleAction需要的权限
SampleAction代码做了3个需要权限的操作：

1. 读取java.home系统属性
2. 读取user.home系统属性
3. 检查当前文件中是否有foo.txt的文件

这些操作需要的权限如下：

``` java
permission java.util.PropertyPermission "java.home", "read";
permission java.util.PropertyPermission "user.home", "read";
permission java.io.FilePermission "foo.txt", "read";
```

我们需要给中的SampleAction.class代码授予权限，我们将吧SampleAction.class放到SampleAction.jar文件中。然而，对于这个特定的grant语句，我们希望不仅授权给代码，而且授权给执行代码的特定的用户，来指定如何限制一个特定用户的访问权限。

因此，就像在中 How Do You Make Principal-BasedPolicy File Statements?,描述的，我们的grant语句看起来像下面这样：

``` java
grant codebase "file:./SampleAction.jar",
    Principal javax.security.auth.kerberos.KerberosPrincipal 
        "your_user_name@your_realm"  {
 
   permission java.util.PropertyPermission "java.home", "read";
   permission java.util.PropertyPermission "user.home", "read";
   permission java.io.FilePermission "foo.txt", "read";
};
```

用你的Kerberos用户名和Realm代替。例如，如果你的用户名是“mjones”，Realm是“KRBNT-OPERATIONS.ABC.COM”。你将用mjones@KRBNT-OPERATIONS.ABC.COM。

策略文件的全部内容

``` java
/** Java 2 Access Control Policy for the JaasAzn Application **/
 
 
/** Code-Based Access Control Policy for JaasAzn **/
 
grant codebase "file:./JaasAzn.jar" {
 
   permission javax.security.auth.AuthPermission 
                    "createLoginContext.JaasSample";
   permission javax.security.auth.AuthPermission "doAsPrivileged";
};
 
 
/** User-Based Access Control Policy for the SampleAction class
 ** instantiated by JaasAzn 
 **/
 
grant    codebase "file:./SampleAction.jar",
    Principal javax.security.auth.kerberos.KerberosPrincipal 
        "your_user_name@your_realm"  {
 
   permission java.util.PropertyPermission "java.home", "read";
   permission java.util.PropertyPermission "user.home", "read";
   permission java.io.FilePermission "foo.txt", "read";
};
``` java
# 运行授权教程的代码
为了执行我们的JAAS授权教程代码，所有你需要做的是：

## 将下面的文件到一个文件夹

The JaasAzn.java sourcefile.
The SampleAction.java sourcefile.
The jaas.conf loginconfiguration file.
The jaasazn.policy policyfile.

# Replace "your_user_name@your_realm"in jaasazn.policy with youruser name and realm.
# Compile SampleAction.java and JaasAzn.java:

``` java
javac SampleAction.java JaasAzn.java
```

# Create a JAR file named JaasAzn.jar containing JaasAzn.class:

``` java
jar -cvf JaasAzn.jar JaasAzn.class
```

# Create a JAR file named SampleAction.jar containing SampleAction.class:

``` java
jar -cvf SampleAction.jar SampleAction.class
```

# Execute the JaasAzn application,specifying
``` java
1. by anappropriate -classpath clause that classes should be searched for intheJaasAzn.jar and SampleAction.jar JAR files,
2. by -Djava.security.manager thata security manager should be installed,
3. by -Djava.security.krb5.realm=<your_realm> thatyour Kerberos realm is the one specified.
4. by -Djava.security.krb5.kdc=<your_kdc> thatyour Kerberos KDC is the one specified.
5. by -Djava.security.policy=jaasazn.policy thatthe policy file to be used isjaasazn.policy, and
6. by -Djava.security.auth.login.config=jaas.conf thatthe login configuration file to be used is jaas.conf.
```
下面是Windows下全部的命令：

``` java
java -classpath JaasAzn.jar;SampleAction.jar 
 -Djava.security.manager 
 -Djava.security.krb5.realm=<your_realm> 
 -Djava.security.krb5.kdc=<your_kdc> 
 -Djava.security.policy=jaasazn.policy 
 -Djava.security.auth.login.config=jaas.conf JaasAzn
```

这是UNIX下全部的命令

``` java
java -classpath JaasAzn.jar:SampleAction.jar 
 -Djava.security.manager 
 -Djava.security.krb5.realm=<your_realm> 
 -Djava.security.krb5.kdc=<your_kdc> 
 -Djava.security.policy=jaasazn.policy 
 -Djava.security.auth.login.config=jaas.conf JaasAzn
```

将这些命令放到一行里。
你将被提示输入Kerberos的用户名和密码，指定在登录配置文件中的底层的Kerberos认证机制将登录到Kerberos。如果你的登录成功，你讲看到Authenticationsucceeded!信息，如果不是，你将看到AuthenticationFailed。
一旦认证成功，程序剩下的部分（SampleAction）将代表你这个用户执行，需要你已经被授权合适的权限。Jassazn.policy策略文件将授权给你必要的权限，所以你将看到java.home and user.home和你的当前文件夹是否有一个名叫foo.txt的文件的值被显示。

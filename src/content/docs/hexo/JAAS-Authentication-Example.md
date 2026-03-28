---
title: JAAS Authentication Example
tags:
  - Java ABC
categories:
  - Java
abbrlink: 1376089128
date: 2019-03-20 14:10:15
---
例子程序来源于Java文档。
1. 配置Kerberos的Server端，配置KDC（kdc.conf）和Server（krb5.conf）。
2. 增加一个Principal，一个用于程序测试。
3. 将JassAcn.java和Jaas.conf文件拷贝到一个文件夹。
4. Javac编译JassAcn.java文件
5. 用下面的命令执行class文件，替换成自己的配置
<!-- more -->

``` java
java -Djava.security.krb5.realm=HIGHGO.COM-Djava.security.krb5.kdc=hadooph.highgo.com-Djava.security.auth.login.config=jaas.conf JaasAcn
```
6. 运行此class文件，提示输入Kerberosusername和Kerberos password，验证成功，打印Authentication succeeded!，验证失败，打印Authenticationfailed和失败原因。
7. 也可将程序导入到Eclipse里运行，只要在运行时，在虚拟机参数里加入
``` java
-Djava.security.krb5.realm=HIGHGO.COM
-Djava.security.krb5.kdc=hadooph.highgo.com
-Djava.security.auth.login.config=jaas.conf
```
即可。调试什么的更方便。

Appendix

``` java JaasAcn.java
import javax.security.auth.login.LoginContext;
import javax.security.auth.login.LoginException;

import com.sun.security.auth.callback.TextCallbackHandler;

/**
 * This JaasAcn application attempts to authenticate a user and reports whether
 * ornot the authentication was successful.
 */
public class JaasAcn {
	public static void main(String[] args) {
		// Obtain a LoginContext,needed for authentication. Tell it
		// to use the LoginModuleimplementation specified by the
		// entry named"JaasSample" in the JAAS login configuration
		// file and to also use thespecified CallbackHandler.
		LoginContext lc = null;
		try {
			lc = newLoginContext("JaasSample", new TextCallbackHandler());
		} catch (LoginException le) {
			System.err.println("Cannot create LoginContext. " + le.getMessage());
			System.exit(-1);
		} catch (SecurityException se) {
			System.err.println("Cannot create LoginContext. " + se.getMessage());
			System.exit(-1);
		}
		try {
			// attemptauthentication
			lc.login();
		} catch (LoginException le) {
			System.err.println("Authentication failed:");
			System.err.println("  " + le.getMessage());
			System.exit(-1);
		}
		System.out.println("Authentication succeeded!");
	}
}

```

``` java Jaas.conf
JaasSample {
 com.sun.security.auth.module.Krb5LoginModule required;
};
```

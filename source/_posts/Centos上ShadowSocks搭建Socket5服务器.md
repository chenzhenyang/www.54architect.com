---
title: Centos上ShadowSocks搭建Socket5服务器
tags:
  - Linux
  - Centos
  - ShadowSocks
  - Socks5
  - Privoxy
categories:
  - Nuclear
abbrlink: 3396596425
date: 2019-03-21 14:57:30
---
买的VPN最近好像跑路了，看了下阿里云的国外ECS，超便宜，美国西部做活动一年才300多RMB；

Shadowsock是一个安全的socks5代理软件，提供了服务端和客户端；可以很方便的搭建一个VPN；

# 服务器端搭建
``` bash
$ wget –no-check-certificate https://raw.githubusercontent.com/teddysun/shadowsocks_install/master/shadowsocks.sh
chmod +x shadowsocks.sh
$ ./shadowsocks.sh 2>&1 | tee shadowsocks.log
```
安装成功会显示如下的信息，将下面的信息填写到客户端里面就可以了；
``` bash
Starting Shadowsocks success

Congratulations, Shadowsocks-python server install completed!
Your Server IP        :  47.88.56.208 
Your Server Port      :  8989
Your Password         :  xxxx 
Your Encryption Method:  rc4-md5

Welcome to visit:https://teddysun.com/342.html
Enjoy it!
```

# 客户端配置
![image](![](https://54architect.oss-cn-beijing.aliyuncs.com/blog.54architect.com/2019-03-21 15-06-37 的屏幕截图.png)
)

这里需要特别注意的是，有些socks5客户端提供了将socks5转为http(s)的功能，这里要选则socks5。

# Privoxy配置
Privoxy可以将socks5转为http(s)协议；
``` bash
forward-socks5   /               127.0.0.1:1080 .    
```

``` bash
sudo apt-get install privoxy 
//开启privoxy 服务就行
sudo  service  privoxy start 
// 设置http 和 https 全局代理
export http_proxy='http://localhost:8118'
export https_proxy='https://localhost:8118'
// 测试一下
wget https://www.google.com  
```

# 参考
[使用Privoxy将socks5代理转为http代理](https://blog.csdn.net/li740207611/article/details/52045471)
[Mac上Privoxy将shadowsocks的socks5代理转为http代理(解决SublimeText无法安装插件的问题)](https://blog.csdn.net/yanzi1225627/article/details/51064306)

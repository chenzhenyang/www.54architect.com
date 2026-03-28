---
title: Confluent Platform Quick Start (Docker)
abbrlink: 1992991654
date: 2019-03-20 11:33:45
tags:
  - Apache Kafka
categories:
  - Apache Kafka
---
# 问题
Confluent提供了Kafka的整套生态的docker镜像：[confluentinc/cp-docker-images](https://github.com/confluentinc/cp-docker-images)，并在[官方文档 Confluent Platform Quick Start (Docker) ](https://docs.confluent.io/current/quickstart/ce-docker-quickstart.html)中详细的描述了这些镜像的使用方法。
<!-- more -->

``` bash
$ git clone https://github.com/confluentinc/cp-docker-images
$ cd cp-docker-images
$ git checkout 5.1.2-post
$ cd examples/cp-all-in-one/
$ docker-compose up -d --build
```

如果按照上面的步骤，会发现在执行docker-compose up -d --build命令时会出现访问d1i4a15mxbxib1.cloudfront.net，访问不到的情况，是构建confluentinc/ksql-examples:5.1.2镜像时发生的，注意是在构建镜像的阶段发生的，不是在启动镜像的阶段发生的。

``` bash
Building connect
Step 1/3 : FROM confluentinc/cp-kafka-connect:5.1.2
---> a556d728ef1e
Step 2/3 : ENV CONNECT_PLUGIN_PATH="/usr/share/java,/usr/share/confluent-hub-components"
---> Using cache
---> 3fc1228c32fb
Step 3/3 : RUN confluent-hub install --no-prompt confluentinc/kafka-connect-datagen:latest
---> Running in 305285df291e
Running in a "--no-prompt" mode 
Implicit acceptance of the license below:  
Apache License 2.0 
https://www.apache.org/licenses/LICENSE-2.0 
Downloading component Kafka Connect Datagen 0.1.1, provided by Confluent, Inc. from Confluent Hub and installing into /usr/share/confluent-hub-components 
java.net.UnknownHostException: d1i4a15mxbxib1.cloudfront.net 
```

通过查看github仓库的issue，[Unable to install kafka-connect-datagen:0.1.0 #654](https://github.com/confluentinc/cp-docker-images/issues/654)，发现这个域名是[https://api.hub.confluent.io/api/plugins](https://api.hub.confluent.io/api/plugins)接口返回的配置信息包含的。

``` bash
$ curl https://api.hub.confluent.io/api/plugins
```

上面接口返回的信息其中一个如下：

``` bash
"logo":"https://d1i4a15mxbxib1.cloudfront.net/api/plugins/debezium/debezium-connector-mysql/versions/0.9.2/assets/color_debezium_256px.png"
```

# 处理过程
第一步通过站长工具，找到d1i4a15mxbxib1.cloudfront.net的IP地址

``` bash
d1i4a15mxbxib1.cloudfront.net 52.84.225.219 877978075 新加坡 Amazon数据中心
d1i4a15mxbxib1.cloudfront.net 52.84.225.183 877978039 新加坡 Amazon数据中心
d1i4a15mxbxib1.cloudfront.net 52.84.225.134 877977990 新加坡 Amazon数据中心
d1i4a15mxbxib1.cloudfront.net 52.84.225.114 877977970 新加坡 Amazon数据中心 
```

第二步在cp-docker-images/examples/cp-all-in-one/Dockerfile，找到confluentinc/ksql-examples镜像的Dockerfile文件

``` bash Dockerfile
#
# Copyright 2018 Confluent Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

FROM confluentinc/cp-kafka-connect:5.1.2

ENV CONNECT_PLUGIN_PATH="/usr/share/java,/usr/share/confluent-hub-components"

RUN confluent-hub install --no-prompt confluentinc/kafka-connect-datagen:latest
```
第三步，单独构建镜像，指定host配置，使用其中一个即可

``` bash
$ sudo docker build -t confluentinc/ksql-examples:5.1.2 \
>--add-host d1i4a15mxbxib1.cloudfront.net:52.84.225.183 \
>-f Dockerfile .
```

第四步，docker-compose启动

``` bash
$ docker-compose up -d --build
```

# 参考
[docker容器添加自定义hosts](https://blog.csdn.net/zcw1994/article/details/84568426)
[Configure Docker to use a proxy server](https://docs.docker.com/network/proxy/#configure-the-docker-client)
[Unable to install kafka-connect-datagen:0.1.0 #654](https://github.com/confluentinc/cp-docker-images/issues/654)
[Confluent Platform Quick Start (Docker)](https://docs.confluent.io/current/quickstart/ce-docker-quickstart.html)



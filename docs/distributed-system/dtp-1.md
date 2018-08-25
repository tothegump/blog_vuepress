---
title: 分布式事务探索（一） DTP 模型
date: 2018-06-18 10:07:29
tags: dtp 分布式
---

## 背景
事务在日常的业务系统中可以说非常普遍了，我们面对一个数据库资源时，一切都好说，数据库把一切都搞定了，我们要做的，就是知道事务是啥就可以了。然而，业务是快速发展的，当一个单体应用不能满足要求的时候，就要面临拆分服务，走向分布式了。
于是，你小心翼翼的拆分服务，经过精心的设计，一个不小心（呃。。。），发现有个事务需要跨越两个服务，这怎么办，服务已经拆分了，合并回去是不可能了。于是，不得不面对分布式事务这个概念了。

## 相关的概念
我们看看维基百科的解释：
`分布式事务，是涉及到两个或多个网络主机时，完成一个数据库事物的问题。通常，主机提供事物资源，事物管理器负责创建和管理全局事物，围绕着所有对资源的操作。分布式事务跟其他事物一样必须ACID特性。`
提到事务，会说到 ACID 这四个特性。分布式中，有人提出 BASE 跟 ACID 对应，呃，还是会玩啊，base 在英文中有“碱基”的意思，这样跟 acid 形成了“酸碱平衡”。当然， ACID 就是对应 atomic, consistence, independent, duration 四个特性， BASE 稍有拼凑的感觉， B-A: basic available， S: soft-state，E: eventual-consistency.
BASE 的提出，其实是有个背景的，分布式中有个很经典的，所有人都听过名字的但是很多人不知道里面实质内容只知道三者不可兼得的 CAP 理论，
还有很多人都听过的两段提交协议（三段提交协议）
因为分布式是必然的发展方向，事物又是处理业务的必要手段，于是很多人和组织都研究并给出了处理模型。
## DTP (distributed Transaction Processing) 模型
### 呃，背景
X/Open Distributed Transaction Processing (DTP) Model (X/Open XA), 是一个名叫 The Open Group 的组织提出的分布式事务处理规范，已经成为事实上的事务模型组件的行为标准。
~~两步提交 (two-phrase commit) (2PC) 算法是一个常见的保证分布式事务正确性的算法。这个算法通常适用于在短时间（几毫秒～几分钟）内就可以完成更新的场景。~~
### 了解规范
有个叫做 The Open Group 的组织，制定了一个叫做 X/Open Distributed Transaction Processing (DTP) Model，简称 X/Open XA ，（呃，这个组织的名字和这个缩写。。。），已经成为事实上的事务模型组件的行为标准。这个标准里描述了 *global transaction manager 和 local resource manager 之间的接口。*。 XA 的目标是允许多个资源（数据库， 应用服务器， 消息队列， 事务缓存等）可以在一个事务中处理，同时跨应用满足 ACID 属性。这里，其实就需要分两部分来描述清楚了。第一部分是关于这个模型，第二部分，是这个模型主要使用的两步提交算法（与之对应的，还有三步提交算法，TCC）。
`两步提交 (two-phrase commit) (2PC) 算法是一个常见的保证分布式事务正确性的算法。这个算法通常适用于在短时间（几毫秒～几分钟）内就可以完成更新的场景`
#### 题外话
到这里，其实可以想想，如果是自己来设计，会怎么做。假定另一个场景，对应着这个规范，来看看需要定义哪些角色，这些角色分别要做哪些事情吧。场景描述：
`去月亮妈妈买咖啡，月亮妈妈的会员营销做的很强大，消费送券和积分，月亮妈妈的服务拆分为积分系统和送券系统，消费行为可以理解一个应用，要使用积分系统和送券两个资源系统提供的服务，积分每天上限10分，送券系统每天上限5张券`
这里已经遇到了两个角色，在实际的系统中，不可能要应用去管理协调资源系统，那么再增加一个事务管理者角色。这些角色之间要通信，通信这个动作就引入了两个概念：通信和通信协议。这些对应了下面的组件。

### 定义的组件
DTP 模型 定义了5个基础功能组件，分别是：
* AP (Application Program): 定义事务边界，指定组成事务的行为
* RM (Resource Manager): 数据库、文件系统等资源
* TM (Transaction Manager): 给事务制定标识符，监控整个过程，负责完成事务和失败后恢复。
* CRMs (Communication Resource Managers): 控制一个或多个 TM domain 之间分布式应用的通信。
* A communication protocol （尴尬，这里不是缩写了，很不一致啊）：定义了 CRMs 支持的、分布式应用使用的底层通信服务。

可以对应上面的场景理解一下。

### 这些组件之间的接口关系
1. AP-RM 这个接口使 AP 访问资源。see XA specification
2. AP-TM 这个接口使得 AP 借助 TM 去实现全局事务管理。
3. TM-RM (the XA interface) TM 借助这些接口来管理协调事务中的各个资源，实现全局事务的提交和回滚。
4. TM-CRM (the XA+ interface) 。支持跨 TM Domains 的信息流。
5. AP-CRM 支持全局事务总 AP 之间的通信
6. CRM-OSI TP (The XAP-TP 接口) 提供了CRM 和 Open System Interconnection Distributed Transaction Processing services 之间的接口。

这里有三类重要的接口：TX, XA, XA+ ，分别对应 AP-TM, TM-RM, TM-CRM 的通信接口。

### Model Definitions
#### Instance of the model
或者称为 Instance, 是计算实体的集合，计算实体实现了功能组件和 X/Open DTP 接口。每一个 instance 可以支持一个 AP, 一个 TM, 和多个 RMs. An instance is part of a single TM domain. 一个 TM domain 可包含 一个或多个 instance.
#### TM Domain
A TM Domain 包含一个或多个使用相同 TM 的 instance.  TM 对于所有在这个 TM domain 的应用属于公共模块。这个公共的 TM 使用逻辑共享数据结构和全局事务管理的日志，比如发出全局事务标识符时，或协调全局事务恢复。
下图是4个应用的 instance 在一个 TM domain 中, 这里 TM 是同一个，标记为 TM1, 不同的 RMs 可能参与到每个 instance.
X/Open DTP Model
基本上，在一个 TM domain 中，允许一个 AP 共享多个 RMs 提供的资源。允许 RM-internal work 在一个全局事务中使用单个 TM 写作。使用 TX 和 XA 接口。
全局模式上一个软件架构，允许多个 APs 共享多个（在一个活多个 TM domains 中的） RMs 提供的资源。允许 RM-internal work 在一个全局事务中使用多个 TMs 协作。全局模式使用 STDL 语言， TX, XA, XA+ 接口，这些接口由 CRM 规范提供。 名为 TxRPC, XA/TMI, CPI-C, Version 2, and XAP-TP 接口，通过 OSI TP 接口规范通信协作。
#### 线程
一个线程数一个有着自己全部上下文的实体，由一个进程控制。可能，线程的概念必须要和 AP, TM, RM 一样普遍。
线程的概念，是 TM 与 RMs 协作的中心， APs 调用 RMs 来发起一个工作，TM 调用 RMs 来描述事务的分支。
RM 
RM 接收一个线程中来自 AP 和 TM 的调用。

![帮助理解的图片](./dtp_1.png)


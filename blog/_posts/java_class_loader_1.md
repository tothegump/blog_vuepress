---
title: Java Class Loader 1
date: 2019-03-17
tags: Java
---

# Java Class Loader 1
不知道为什么，刚开始学习 Java, 就跟一个叫做“类加载器”的概念杠上了（尴尬）。查了一些资料，总体感觉是，关于这个概念讲起来是比较简单，而且这些资料基本上都在周志明那本书的范围内。看起来很简单，看起来很容易掌握，然鹅，了解了这些概念之后，我却更加迷茫了，感觉自己都明白了，又感觉自己什么都不懂。“听过很多道理，依然过不好这一生”的感觉。

## 乱翻了一些资料
浏览了很多资料，感觉都是泛泛而谈，说来说去都是
- 类加载器一共分三类，分别是 Bootstrap Class Loader, Extension Class Loader （Java 9 之后改名为 Platform Class Loader）, Application Class Loader
- 加载时，采用“双亲委派模型” （吐槽一个，明明是 parent delegation model, 非要翻译成这么个名称，真是）
。。。

## 反思
想了一下，这样乱翻太宽泛了，我怎么才算理解了类加载的概念呢？
我整理了一下自己的思路，设定了目标和研究路径（这里先卖个关子），开始了自己的探索之旅。

## 基本概念
第一步，基本概念方面
首先，”类加载“这个词本身，就是一个动作，所以，我决定，还是要从分析这个动作的各个环节出发，来理解这个过程。
要达到这个目的，我们先假设自己什么概念都不了解（好吧，我承认，这个不是假设，是真的不了解😓）。

## 类的生命周期
想想，如果自己来写一个虚拟机，要怎么去管理类的生命周期。
0. 定义基本元素：既然 Java 语言 “every thing is a object”, 那么我们不妨把类作为一个基本元素来看。
1. 找到这个类（比如说，定位到这个类的文件地址），获取这个类的内容
2. 分析这个类的内容，根据所拥有的属性和方法，分配相对应的资源
3. 初始化
4. 使用
5. 用完了

JVM 也是这样管理的：
Loading -> linking -> initialization -> Using -> Unloading

上面步骤中，1看起来好理解，只要有地址加名称，总归是可实现的。第二步看起来就比较复杂了（确实是，后面再分析吧）。

只看第一步，需要做什么。书中说， Loading 阶段需要完成 3 件事：
1. 通过一个类的全限定名来获取此类的二进制字节流
2. 这个字节流所代表的静态存储结构转化为方法区的运行时数据结构
3. 在内存中生成一个代表这个类的 java.lang.Class 对象，作为方法区这个类的各个数据的访问入口

嗯，只有第一步能看懂😊

查查资料，[这篇资料翻译了一下](!https://mobile.developer.com/java/data/understand-jvm-loading-jvm-linking-and-jvm-initialization.html) ：
	* 	Create a binary stream of data from the class file
	* 	Parse the binary data according to the internal data structure
	* 	Create an instance of *java.lang.Class*

额，不知道为什么，感觉第三步也看懂了（这一定是幻觉）。
继续查了一番资料，更大的幻觉产生了，感觉自己看懂了第二步。
为了说服自己，这不是自我欺骗，我必须尝试解释一番。

to be continued...


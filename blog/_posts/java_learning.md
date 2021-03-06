---
title: Java 学习感受
date: 2019-03-17
tags: chinwag
---

# Java 学习感受
最近在了解 Java 技术栈，抛开众所周知的繁琐不谈，其实收获和感受还是相当多的。以我粗浅的了解，分了这几个部分：虚拟机，Java 语言本身，Web 生态，其他（就是我不知道）。
## 学习 JVM 时的感受
了解 Java 技术栈的过程，对我而言，是一个比较全面复习计算机相关领域知识的过程，这里面涉及到了很多需要关注的点，我发现，之前在接触其他语言的过程中，有很多店应该关注而没有关注过，丧失了一部分的好奇心，是对自己浑浑噩噩的一个提醒。
就以 jvm 来说，因为它本身的目标已经不是想要跟 Java 强绑定在一起了，而是形成了一个新的生态，在上面可以运行的有很多种语言。所以，真的需要把它作为一个“虚拟机”去了解，在这个过程中，我最大的感触是，是一个把原理类的课程串起来的过程，有时候感觉是涉及到了计算机组成原理，有时候要想想编译原理，更多时候，是在复习操作系统原理。
在了解到过程中，我习惯对比一下 Python 中是怎么做的，发现自己之前忽略了太多方面，或者无法清晰地描述出 Python 中对应的过程和知识点。

## 学习 Java 语言的感受
其实这里实践路线基本符合学习一门语言的预期，所以这是一个熟悉的过程：
1. 要去熟悉常用的类库 API 和一些通用做法
2. 要去熟悉了解一些项目结构的最佳实践
3. 要去了解一些常见的坑，及时避免，了解一下需要关注的点。

这个过程中，最大的感受其实不是来自 Java 本身，而是来自 Spring 这个框架，这个过程中，一直在感慨这个框架的设计的精妙和强大，Java 语言本身的限制和缺点越多，越能体现这个框架的强大和设计的精妙。

## Java 生态的感受
这一块我其实比较迷茫，Java 语言可以说，是拥有最大的生态圈了，非常多的出名的项目，Spring，Apache 系，阿里巴巴贡献的开源项目，大数据领域，以及很多大企业贡献的开源项目。可以说，非常宏伟了。

因为过于庞大，对我而言自然说盲人摸象，完全没有一个合适的概念：摸一下，有一个印象，摸一下，又有新的感受，最后由断断续续、乱七八糟的印象拼接而成。

进入到这些项目的官网，看了看，就像旅游了一趟：Spring，canal, lombok, Mybatis, MybaitsPlus, Guava,

可以这么分类：
Spring, Guava 有详细的开发者文档，标签分类很清晰
lombok 作为个人项目，也是文档很完善
canal 作为阿里的项目，中文文档很完善，虽然目录是英文的，但是点进去，文档依然是中文的，issue 中也基本上是中文交流，说明在国内影响力还是很不错的。

阿里巴巴的开源影响力还是相当厉害的，RocketMQ 作为阿里第一个 Apache 顶级项目，我们打开看看它的 Github 主页，文档完善，社区环境也非常好。

这么多牛逼的项目，可以做很多**大事**，可是我却找不到趁手的小工具，比如说，MongoDB 的 mock，类似 Python 中的 factoryboy，等。

还有一个黑点，哈哈，就是 Java 项目 Star 数很多，contributor  数量却很少，比如 guava 的 contributor/star 只有  0.005,  0.009 可以说非常K^*&G()B！@
> 这也正说明 Java 这么语言的优越性啊，一定是因为 Java 语言写出来的程序质量高，非常稳定，Feature 足够多，根本没有机会往项目里面做贡献的原因吧！  

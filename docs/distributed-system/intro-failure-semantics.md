# 一篇关于 Failure 的文章
## 背景
Wikipedia 真是一个精彩的世界，在看关于 Byzantine fault tolerance 的解释，其中提到了
> Byzantine failures are considered the most general and most difficult class of failures among the  [failure modes](https://en.m.wikipedia.org/wiki/Failure_cause) .   
发现这里 failure modes 标记了超链接。是哦，既然有 Byzantine Failure, 那就是说，还有其他的 Failure 咯，Google 一下。发现了这篇文章：
> http://alvaro-videla.com/2013/12/failure-modes-in-distributed-systems.html  
发现大神们在处理分布式问题的时候，展现了强大的问题抽象能力，并分步骤的解决问题，非常有意思。
一个分布式系统中，有很多个节点，出现错误是常态，那么如何面对这些错误呢，如何在错误是常态的情况下保证系统正常运行呢？
对于一个节点，会收到其他节点发来的消息，这些消息是否可信呢？
我们看看怎么去抽象并解决这些问题。

## Failure Semantics
**Failure Semantics** 用来描述分布式系统中会遇到的错误的分类。

### Byzantine or arbitrary failures
 这个是最复杂的错误类型，节点 A 身处一个完全混乱的环境：
- 没有收到其他节点的消息
	- 可能节点 A 自己挂了，没有能力收到消息了 **Failure!!!**
	- 可能其他节点挂了，没有能力发送消息了 **Failure!!!**
- 收到了节点 B 的消息，内容为 “Yes”：
	- 可能，节点 B 已经不正常了，他想发的内容是 “No” **Failure!!!**
	- 可能，这个消息不是 B 发出的，是节点 C 伪装成为 B 发出的 **Failure!!!**
	- 可能这个消息就是 B 发出的而且就是想发一个 “Yes” 的内容，但这个消息是100年前发的，沧海桑田，这条消息早已过期了 **Failure!!!**
这就烦恼了，完全没法玩了，咋整，简化一下问题吧

### Authentification detectable byzantine failures
验证一下身份吧，使得节点不能被伪装，这样，至少消息来源和身份是可信的。 __可以用非对称加密来实现__

### Performance failures (Timing Error)
虽然收到了正确的回复，但是，没有在正确的时间到达，要么早了，要么晚了。“在错误的时间遇到了对的人”。

### Omission failure
压根儿就没有收到回复。这其实也是没有这正确的时间到达。

### Crash failure
上面的特殊情况，总是收不到回复，其实是因为节点 crash 了

### Fail-stop failure
就是，一个服务挂了，我们认为所有正确的服务都知道他挂了。

## Failure 的关系
从上到下，是包含关系，依次简化问题，关注一个点，找出特殊情况，抽象为一种错误类型。从最开始的杂乱无章的拜占庭错误，到最后的，所有正确的服务都知道有一个服务挂了，不会被这个挂了的服务迷惑和影响。
Failure modes in distributed systems


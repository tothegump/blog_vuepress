# Python, Kafka, Faust
Kafka 的 client 端语言栈并不丰富，Python 一直没有一个好用的框架。查了一圈，底层的客户端有好几个，`kafka-python`, `confluent-kafka-python`, 似乎没问题，但实际上，这些都太底层了，缺少好用的封装。如果想要在生产环境使用这些，少不了写很多封装，处理各种边边角角的情况，比如说部署，就要有不少套路代码要写。
最容易出现的想法是，要是 Kombu 支持 Kafka 就好了，这样可以直接使用 celery 来无缝衔接 kafka. 查了一圈发现，并没有。
不过，倒是找到了一个文艺范十足的库， Faust 。名字取自歌德著作《浮士德》。取名太有深度了，歌德和卡夫卡，都是德语作家，他们都进过义务教育的课本:D
就凭这个文艺十足的命名，也值得研究一番了。
## 文档
[Quickstart — Faust 1.5.0 documentation](https://faust.readthedocs.io/en/latest/playbooks/quickstart.html#quickstart)
文档一眼扫过去，非常的有好感，Quickstart, User Guide, FAQ, Contributing, Developer Guide 应有尽有，非常清晰明了。
### 用法
如果用过 Celery 的话，会惊喜得发现，Faust 的用法和 Celery 简直一模一样。可以非常快的上手。
## github 主页
更新比较频繁， Issue 处理也比较及时，issue 标签分类清晰。
### 出品
Github 的组织是， Robinhood, 这个公司风头当然是非常猛了，可惜没有进入中国，但是准备进入，还搞了个排队，我没有排到，就退出了，非常遗憾。
另外，发现 Faust 的 Creator 竟然是 Celery 的作者，这也就不难理解怎么做到跟 Celery 的用法是如此相近了。 
## 用起来吧
我们来看看他的 Github 主页是怎么自夸的
> It is used at [Robinhood](http://robinhood.com/) to build high performance distributed systems and real-time data pipelines that process billions of events every day.
### 谁在使用
Faust 已经在 Robinhood 的高性能分布式系统中使用的非常不错了，在实时数据方面，每天处理数亿的事件。
### 简单
短短几行，就可以实现生产者和消费者，屏蔽了很多底层的逻辑。用法跟 Celery 类似，非常容易上手。
### 高可用
我觉得，这也是 Faust 最值得用的，如果你直接使用底层的库，这些逻辑都要自己处理，处理方式呢，也都是套路，且与业务无关。
### 分布式
这个好理解，可以起多个实例。
### 快
这块没有去看测评，应该还不错吧。即使有问题，我也对未来的优化有信心。
### 灵活
最开始关注到 Faust, 就是因为要找跟 Django 结合的 Kafka 客户端框架。当然这块是没问题的，而且 Faust 还能完美集成 Flask, SQLAlchemy, NTLK, Numpy, Scikit, TensorFlow 等等。


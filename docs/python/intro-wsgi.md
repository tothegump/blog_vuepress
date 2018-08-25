---
title: 简单聊下 WSGI
date: 2018-08-06 09:41:19
tags: little-target wsgi python web-server
---

## WSGI 是个什么？
是pep 3333中定义的一个规范。其实是希望把底层网络处理跟应用分开，这也是因为这 Java 中有 servlet 的成功案例，可以看到这样分一层的巨大好处。有了 wsgi 之后，Python 语言的 Web 框架变得炒鸡多，随便就可以说上来很多：Django, Flask, web.py(sign), web2py, bottle, pylons, humph (偷偷摸摸放进来，话说这个好久不更新了，提出批评)。

wsgi 主要分了两层， Application/Framework Side 和 Server/Gateway Side，如果有一些两边都沾边的组件，就叫 Middleware。

> （题外话：因为Python 有众所周知的蛋疼的编码问题，这里也着重强调了字符的类型问题）

我们常见的Web Framework 处理的都是 Application Side，跟这这个描述，你也可以很轻松的写出自己的 Web 框架。

在部署的时候，用的工具比如 uWSGI, gnunicon 都是 Server side的东西。其实在框架里面也实现了简单的server side，供调试用，没有考虑效率。

### Application Side
只需要
1. 定义一个 接收两个参数的 callable object
2. 可以多次调用

这样看起来很容易，确实是这样。如果想要用起来，就需要考虑更多细节问题。
比如，怎么路由啊， 怎么封装 request 和 response 啊，等等

实际上，wsgi中对细节有很多定义，比如 environ variables, the star_response() callable, buffering and streaming, Unicode issues, error handling, http1.1, thread support.
## 一些细节
- 定义的 callable application object 接受两个参数，虽然这描述的时候称为 environ 和 start_response, 但这两个参数并非命名参数，必须通过位置来标识。
- 参数 environ 必须是 Python 的 buildin 的字典类型，子类啊， UserDict 啊什么的都不行
- 参数 start_response 是一个接受两个必选参数和一个可选参数的可调用类型。

## environ variables
### CGI 环境变量
环境变量这个 dict 必须包含 CGI 环境变量，一部分是必须出现的（除非值为空字符串），还有一部分是可忽略的。这些环境变量比较容易理解，分别是
- Server 相关
	- SERVER_NAME, SERVER_PORT
	- SERVER_PROTOCOL
	- SCRIPT_NAME
- 请求相关
	- REQUEST_METHOD
	- PATH_INFO
	- QUERY_STRING
	- CONTENT_TYPE
	- CONTENT_LENGTH
- 其他的请求头变量
	- HTTP_*Variables* : 比如说，HEADER 中的 Authorization 字段，这里就是 HTTP_AUTHORIZATION 变量
### WSGI 变量
除了上面的 CGI 变量， environ 字典可能包含任意的操作系统环境变量，必须包含这些 WSGI 变量：
- wsgi.version
- wsgi.url_scheme  是 http 还是 https
- wsgi.input  一般请求的 body 中的数据是以类似读取文件的方式获取。
- wsgi.error
- wsgi.multithread
- wsgi.multiprocess
- wsgi.run_once
## start_response()
这个函数接受两个必选一个可选参数，可以理解为 `start_response(status, response_headers, exc_info=None)`，当然，是按照位置区分，不接受命名参数。返回一个 `write(body_data)`的可调用对象。
## Buffering and Streaming
这里要说到两种情况，一种是 response 的内容刚刚好，pia 的一下，一次就给返回去了，一种是， 要么很大，要么很耗时，只能给一坨一坨地返回。
## 未完待续
嗯。


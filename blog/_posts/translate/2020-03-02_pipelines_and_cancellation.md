---
title: [翻译]Go 并发模型: Pipelines and cancellation
date: 2020-03-02
tags:
  - golang
  - translate
  - go-blog
---
# Go Concurrency Patterns: Pipelines and cancellation
## Introduction
Go’s concurrency primitives 使得构建数据流管道来充分利用 I/O 和多核 CPU 非常容易。这篇文章展现了几个例子，跟管道，尤其是操作失败的细节，介绍了干净处理失败的技术。
## What is a pipeline
在 Go 中没有正式的关于管道（pipeline）的定义，只是很多种并发编程的一种。非正式的定义，是一系列由 channel 连接起来的 stages，每个 stage 是一组跑相同函数的 goroutines。在每个 stage 中，这些 goroutines ：
- 通过 `inbound channels` 从 upstream （上游）接收值
- 对这些数据执行一些函数，通常是产生新的值
- 通过 `outbound channels` 发送值给 `downstream`（下游）
每个 stage 有任意数量的 `inbound` 和 `outbound` channels，但是第一个 stage 只有 `outbound` 而最后一个 stage 只有 `inbound` channels。第一个 stage 也被称为 source 或 producer， 最后一个 stage被称为 sink 或 consumer。
我们从一个简单的管道例子来说明这个思路和技术。然后，会展示跟多的现实例子。
## Squaring numbers
设想有三个 stage 的 pipeline。
第一个 stage `gen` 是一个函数，将一个整数列表转换为发送这些整数的 channel 。这个 gen 函数开始一个 goroutine，发送这些整数到这个 channel 然后当所有的值都发送完后关闭这个 channel。
```Go
func gen(nums ...int) <-chan int {
	out := make(chan int)
	go func() {
		for _, n := range nums {
			out <- n
		}
		close(out)
	}()
	return out
}
```
第二个 stage， sq，从一个 channel 接收整数然后返回一个 channel，对每个接收到的整数平方，并发送。当 `inbound` channel 关闭后，这个 stage 发送完所有的值给下游，然后关闭这个 outbound channel。
```Go
func sq(in <-chan int) <-chan int {
	out := make(chan int)
	go func() {
		for n:= range in {
			out <- n * n
		}
		close(out)
	}()
	return out
}
```
由 main 函数启动这个管道，并执行最后的 stage：从第二个 stage 接收一个值并打印，直到这个 channel 关闭：

```Go
func main() {
	// Set up the pipeline
	c := gen(2, 3)
	out := sq(c)
	// Consume the output
	fmt.Println(<-out) // 4
	fmt.Println(<-out) // 9
}
```
因为对 sq 而言，他的`inbound` 和 `outbound` channels 有相同的类型，我们可以组合任意次数。我们也可以像其他 stages 一样用 range loop 重写 main ：

```Go
func main() {
	// Set up the pipeline and consume the output.
	for n := range sq(sq(gen(2, 3))) {
		fmt.Println(n) // 16 then 81
	}
}
```
## Fan-out, fan-in
多个函数可以从相同的 channel 中读取，直到 channel 关闭，这称为：`fan-out`。这个提供了一个途径，分发工作给一组可以并行利用 CPU 和 I/O 的 workers 。
一个函数可以从多个输入读取，然后处理直到所有的都关闭，然后关闭单个 channel。这称为 `fan-in`。
我们可以改变我们的管道，运行两个 `sq` 的实例，都从相同的 input channel 读取。我们引入一个新的函数 `merge` 来 `fan in` 这个结果：

```Go
func main() {
	in := gen(2, 3)
	// Distribute the sq work across two goroutines that both read from in
	c1 := sq(in)
	c2 := sq(in)
	// Consume the merge output from c1 and c2.
	for n := range merge(c1, c2) {
		fmt.Println(n)  // 4 then 9, then 4
	}
}
```

这个 `merge` 函数的作用是，把一个 channel 列表转换为单个 channel：为每个 `inbound channel` 建立一个 goroutine ，将输入的值转到 `outbound channel`,而这里 `outbound channel` 只有一个。这里有个风险：一旦 `output goroutines`开始运行，在所有的发送结束后，会有多个 goroutine 去关闭这个 `outbound channel`，给一个关闭的 channel 发送消息会导致 panic。所以，在调用 close 之前，保证所有的发送者结束非常重要。可以利用 `sync.WaitGroup` 类型来处理同步等待：

```Go
func merge(cs ...<-chan int) <-chan int {
	var wg sync.WaitGroup
	out := make(chan int)
	// Start an output goroutine for each input channel in cs. output
	// copies values from c to out until c is closed, then calls wg.Done
	output := func(c <-chan int) {
		for n := range c {
			out <- n
		}
		wg.Done()
	}
	wg.Add(len(cs))
	for _, c := range cs {
		go output(c)
	}
	// Start a goroutine to close out once all the output goroutines are done.
	// This must start after the wg.Add call.
	go func() {
		wg.Wait()
		close(out)
	}()
	return out
}
```

## Stopping short
有一个针对我们管道函数的模式：
- 当所有的发送操作完成后，stages 关闭他们的 `outbound channels`
- stages  保持从 `inbound channels` 接收值，直到所有的这些 channel 都关闭。
这个模式运行每个接收的 stage 可以写 range loop，确保所有的 goroutines 一旦退出，所有的值都被成功的发送到下游。
但是在真正的管道中，stages 不会永远收到所有的 `inbound values`。有时候，这依赖设计：接收者可能只需要处理其中的一个子集。更多情况下，当一个inbound value 代表更前一个 stage 的一个错误，这个 stage 也会有这个错误。另外一个例子，接收者不应该等等剩下的值的到来，我们期望前面的 stages 停止发送后面 stages 不需要的数据。
在我们的管道例子中，如果一个 stage 消费所有的 `inbound values` 失败，而这个 goroutines 尝试发送这些值，就会被永久阻塞。

```Go
	// Consume the first value from the output
	out := merge(c1, c2)
	fmt.Println(<-out)  // 4 or 9
	return
	// Since we didn't receive the second value from out,
	// one of the output goroutines is hung attempting to send it
}
```
这属于资源泄露：goroutines 消耗内存和 runtime 资源，以及在 goroutine stacks 保存数据的 heap 引用，而不能被垃圾回收。 Goroutines 不会被垃圾回收，他们必须自己退出。
我们需要为管道的上游 stages安排退出，即使在下游 stages 出错未能接受所有的 `inbound values`。实现这个的一个方法是，改变 `outbound channels`，使其有一个 buffer。这个 buffer 可以持有一定数量的值，当操作结束时立刻发送，如果buffer 中有空间：
c := make(chan int, 2)  // buffer size 2
c <- 1  // succeeds immediately
c <- 2  // succeeds immediately
c <- 3  // blocks until another goroutine does <-c and receives 1
当channel 在创建时，一些值就被发送。一个 buffer 可以简化代码。比如，我们可以重写 gen 来使得复制一个 integer 列表到带缓冲的 channel ，避免创建一个新的goroutine：

```Go
func gen(nums ...int) <-chan int {
	out := make(chan int, len(nums))
	for _, n := range nums {
		out <- n
	}
	close(out)
	return out
}
```
回到被阻塞的我们管道中的 goroutines 来，我们可以考虑给 merge 返回的 outbound channel增加一个 buffer ：

```Go
func merge(cs ...<-chan int) <-chan int {
	var wg sync.WaitGroup
	out := make(chan int, 1). // enough space for the unread inputs
	// ... the rest is unchanged ...
}
```
虽然这个处理了程序中被阻塞的 goroutine ，但这是 bad code。这里选择长度为1的 buffer，依赖于知道 merge 将要接收值的数量，和知道下游 stage 消耗多少。这个非常脆弱：如果我们多传递一个值给 gen ，或者下游读取更少的值，那么就又会阻塞 goroutine了。
我们得找到一个替换方法，使得下游 stage 告诉发送者，我们将要停止接收输入了。
## Explicit cancellation
当 main 决定退出，不再从 out 接收值了，他必须告诉这些上游的 goroutine 的 stages ，丢弃这些想要发送的值。通过发送值给一个叫做 done 的 channel 来实现。他发送两个值，于是这里有两个有可能阻塞的发送者了：

```Go
func main() {
	in := gen(2, 3)
	// Distribute the sq work accross two goroutines that both read from in
	c1 := sq(in)
	c2 := sq(in)
	// Consumse the first value from output
	done := make(chan struct{}, 2)
	out := merge(done, c1, c2)
	fmt.Println(<-out). // 4 or 9
	// Tell the remaining senders we're leaving
	done <- struct{}{}
	done <- struct{}{}
}
```
 负责发送的 goroutine 使用 select 语句替换了发送操作，这样就可以处理两种情况：发送 out 或者从 done 中接收值。done 的类型是个空 struct，因为他的值不重要。正是这个接收事件表明了应该放弃发送 out 了。`output` goroutines 继续在它的 inbound channel 里循环，c，所以上游 stages 没有被阻塞。（我们后面讨论如何允许一个循环提前退出）。

```Go
func merge(done <-chan struct{}, cs ...<-chan int) <- chan int {
	var wg sync.WaitGroup
	out := make(chan int)

	// Start an output goroutine for each input channel in cs. output
	// copies values from c to out until c is closed or it receives a value
	// from doen, then output calls wg.Done.
	output := func(c <-chan int) {
		for n := range c {
			select {
			case out <- n:
			case <- done:
			}
		}
		wg.Done
	}
	// ... the rest is unchanged ...
}
```

这个方法有一个问题： 每个下游接收者需要知道潜在阻塞的上游发送者的数量，然后安排这些发送至提前退出的信号。保持追踪这些个数非常乏味而且容易出错。
我们需要一个方法来告诉一个未知的，未绑定数量的 goroutines 去给下游发送他们的值。在 Go 中，我们可以通过关闭这个 channel 来达到目的，因为 [ a receive operation on a closed channel can always proceed immediately, yielding the element type's zero value ] （接收到一个关闭 channel 的操作可以立即处理，通过生成元素类型的零值）。
这意味着，main 可以通过关闭 done channel 来解锁所有的发送者。这个关闭是非常高效的广播给所有发送者的信号。我们拓展了每个管道函数接受 done 作为参数，并在通过 defer 语句来处理关闭操作，所以所有从 main 出发的返回路径，都会通过给管道 stages 信号来退出。

```Go
func main() {
	// Set up a done channel that's shared by the whole pipeline,
	// and close that channel when this pipeline exits, as a signal
	// for all the goroutines we started to exit.
	done := make(chan struct{})
	defer close(done)
	in := gen(done, 2, 3)
	// Consume the first value from output
	out := merge(done, c1, c2)
	fmt.Println(<-out) // 4 or 9
	// done will be closed by the deferred call.
}
```
现在，我们所有的管道 stages 都可以在 done 关闭时随意返回。在 merge 中的 output 程序可在不 `draining` 他的 `inbound channel`的情况下返回，因为她知道上游的 sender `sq` 会在 done 关闭时停止发送。output 保证了 `wg.Done` 会在所有的返回路径中被 defer 语句调用。

```Go
func merge(done <- chan struct{}, cs ...<-chan int) <- chan int {
	var wg sync.WaitGroup
	out := make(chan int)
	// Start an output goroutine for each input channel in cs. output
	// copies values from c to out until c or done is closed, then calls wg.Done.
	output := func(c <-chan int) {
		defer wg.Done()
		for n := range c {
			select {
			case out <- n:
			case <- done:
				return
			}
		}
	}
	// ... the rest is unchanged ...
}
```
类似的， sq 可以在 done 关闭时立刻返回。 `sq` 保证他的 out channel 在所有返回路径上通过 defer 语句关闭。

```Go
func sq(done <- chan struct{}, in <-chan int) <-chan int {
	out := make(chan int)
	go func() {
		defer close(out)
		for n := range in {
			select {
			case out <- n * n:
			case <- done:
				return
			}
		}
	}()
	return out
}
```
下面是构建管道的指导：
- 当所有的发送操作都结束时，stages 关闭他们的 outbound channel。
- 只要这些 inbound channels 不关闭，或者发送者未阻塞， stages 就会一直保持从 inbound channels 接收值。
管道通过保障所有的发送的值有足够的 buffer ，或者当接收者可能放弃这个 channel 时，从 inbound channels 显式地给发送者传递信号，来使得发送者不被阻塞。
## Digesting a tree
再来看一个更加实际的例子。
MD5 是一个文件校验和的非常有用的信息摘要算法。命令行工具 md5sum 打印出一列文件的摘要值。

```Shell
% md5sum *.go
d47c2bbc28298ca9befdfbc5d3aa4e65  bounded.go
ee869afd31f83cbb2d10ee81b2b831dc  parallel.go
b88175e65fdcbc01ac08aaf1fd9b5e96  serial.go
```
我们例子程序就想 md5sum 但是把单个目录作为参数，并打印出这个目录下每个常规文件的摘要值，并按照 path name 排序。

```shell
% go run serial.go .
d47c2bbc28298ca9befdfbc5d3aa4e65  bounded.go
ee869afd31f83cbb2d10ee81b2b831dc  parallel.go
b88175e65fdcbc01ac08aaf1fd9b5e96  serial.go
```
我们的 main 函数调用帮助函数 MD5All ，这个函数返回一个 path name 到摘要值的 map，然后排序，打印出结果：

```Go
func main() {
    // Calculate the MD5 sum of all files under the specified directory,
    // then print the results sorted by path name.
    m, err := MD5All(os.Args[1])
    if err != nil {
        fmt.Println(err)
        return
    }
    var paths []string
    for path := range m {
        paths = append(paths, path)
    }
    sort.Strings(paths)
    for _, path := range paths {
        fmt.Printf("%x  %s\n", m[path], path)
    }
}
```
函数 MD5All 是我们主要讨论的，在 serial.go 中，这个实现没有使用并发，简单的对目录树中的每个文件读取并求合。

```Go
// MD5All reads all the files in the file tree rooted at root and returns a map
// from file path to the MD5 sum of the file's contents. If the directory walk
// fails or any read operation fails, MD5All returns an error.
func MD5All(root string) (map[string][md5.Size]byte, error) {
	m := make(map[string][md5.Size]byte)
	err := filepath.Walk(root, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.Mode().IsRegular() {
			return nil
		}
		data, err := ioutil.ReadFile(path)
		if err != nil {
			return err
		}
		m[path] = md5.Sum(data)
		return nil
	})
	if err != nil {
		return nil, err
	}
	return m, nil
}
```
## Parallel digestion
在 [parallel.go] 中，把 MD5All 分成了 two-stage pipeline。 第一个 stage，`sumFiles`，遍历目录树，在一个新的 goroutine 中对每个文件获取摘要信息，然后给 channel 发送带值类型的 `result`。

```Go
type result struct {
	path string
	sum [md5.Size]byte
	err error
}
```
sumFile 返回两个 channel ：一个是 results 使用，另一个是 filepath.Walk 返回的 error 使用。函数 walk 开始一个新的 goroutine 来处理每个普通文件，然后检查 done， 如歌 done 被关闭，这个遍历立即结束：

```Go
func sumFiles(done <- chan struct{}, root string) (<-chan result, <-chan error) {
	// For each regular file, start a goroutine that sums the file and sends
	// the result on c, Send the result of the walk on error.
	c := make(chan result)
	errc := make(chan error, 1)
	go func() {
		var wg sync.WaitGroup
		err := filepath.Walk(root, fun(path string, info os.FileInfo, err error) error {
			if err != nil {
				return err
			}
			if !info.Mode().IsRegular() {
				return nil
			}
			wg.Add(1)
			go func() {
				data, err := ioutil.ReadFile(path)
				select {
				case c <- result{path, md5.Sum(data), err):
				case <- done:
				}
				wg.Done()
			}()
			// Abort the walk if done is closed.
			select {
			case <- done:
				return errors.New("walk canceled")
			default:
				return nil
			}
		})
		// Walk has returned, so all call to wg.Add are done. Start a
		// goroutine to close c once all the sends are done.
		go func() {
			wg.Wait()
			close(c)
		}()
		// No select needed here, since errc is buffered.
		errc <- err
	}()
	return c, errc
}
```
MD5All 接收从 c 中传来的摘要。MD5All返回一个错误，通过 defer 关闭 done：

```Go
func MD5All(root string) (map[string][md5.Size]byte, error) {
	// MD5All closes the done channel when it returns; it may do so
	// before receiving all the values from c and errc.
	done := make(chan struct{})
	defer close(done)

	c, errc := sumFilles(done, root)

	m := make(map[string][md5.Size]byte)
	for r := range c {
		if r.err != nil {
			return nil, r.err
		}
		m[r.path] = r.sum
	}
	if err := <- errc; err != nil {
		return nil, err
	}
	return m, nil
}
```

## Bounded parallelism
MD5All 是在 [parallel.go] 中实现，为每个文件开始一个 goroutine。在一个有很多大文件的目录中，这个会分配很多内存。
We can limit these allocations by bounding the number of files read in parallel。在 [bounded.go]中，通过创建固定数量的 goroutines 来读取文件。现在，我们的管道有三个 stages：遍历目录树，读取并计算文件摘要，收集这些摘要。
第一个 stage，walkFiles 发送了目录树中普通文件的路径：

```Go
func walkFiles(done <-chan struct{}, root string) (<-chan string, <-chan error) {
	paths := make(chan string)
	errc := make(chan error, 1)
	go func() {
		// Close the paths channel after Walk returns.
		defer close(paths)
		// No select needed for this send, since errc is buffered.
		errc <- filepath.Walk(root, func(path string, info os.FileInfo, err error) error {
			if err != nil {
				return err
			}
			if !info.Mode().IsRegular() {
				return nil
			}
			select {
			case paths <- path:
			case <-done:
				return errors.New("walk canceled")
			}
			return nil
		})
	}()
	return paths, errc
}
```

第二个 stage 开始了一个固定数量的 `digester goroutines` 来接受文件名，然后发送结果到 channel c:

```Go
func digester(done <- chan struct{}, paths <- chan string, c chan<- result) {
	for path := range paths {
		data, err := ioutil.ReadFile(path)
		select {
		case c<- result{path, md5.Sum(data), err}:
		case <- done:
			return
		}
	}
}
```

不像我们前面的例子， `digester`不会关闭他的输出 channel，因为多个 goroutines 发送给一个共享 channel。所以，MD5All 中会在所有的 digesters 完成之后关闭 channel。

```Go
    // Start a fixed number of goroutines to read and digest files.
    c := make(chan result)
    var wg sync.WaitGroup
    const numDigesters = 20
    wg.Add(numDigesters)
    for i := 0; i < numDigesters; i++ {
    	go func() {
    		digester(done, paths, c)
    		wg.Done()
    	}()
    }
    go func() {
    	wg.Wait()
    	close(c)
    }()
```
我们可以替换为，每个 digester 创建并返回她的输出 channel，但是我们需要另外的 goroutines 来 fan-in 结果。
最后一个 stage 从 c 中接收所有的 `results`，然后检查 errc 中的错误。这个检查不能更早了，因为在这个节点前， walkFiles 可能正阻塞在给下游发送值这一步。

```Go
    m := make(map[string][md5.Size]byte)
    for r := range c {
    	if r.err != nil {
    		return nil, r.err
    	}
    	m[r.path] = r.sum
    }
    // Check whether the Walk faild
    if err := <-errc; err != nil {
    	return nil, err
    }
    return m, nil
```

## Conclusion
这篇文章展现了在 Go 中构造流数据管道的技术。处理在这种管道中的失败比较 tricky，因为管道中的每个 stage都可能在向下游发送数据时阻塞，而下游 stage 可能不在关心进来的数据。我们展现了如何在关闭一个 channel 时广播 “done” 信号给所有由管道开始的 goroutines ，也指导了正确的构造管道。

Further reading:
- Go Concurrency Patterns (video) presents the basics of Go's concurrency primitives and several ways to apply them.
- Advanced Go Concurrency Patterns (video) covers more complex uses of Go's primitives, especially select.
- Douglas McIlroy's paper Squinting at Power Series shows how Go-like concurrency provides elegant support for complex calculations.
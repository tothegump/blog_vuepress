# 2019-03-24
**# 1.Algorithm**
> 每周至少做一个 leetcode 的算法题  

额，依然是一个简单的

```
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, x):
#         self.val = x
#         self.left = None
#         self.right = None

class Solution:
    def levelOrderBottom(self, root: TreeNode) -> List[List[int]]:
        return self.travel(root)

    def travel(self, root):
        if not root:
            return []
        queue = []
        stack = []
        current_list = []
        queue.append(root)
        queue.append('#')
        while queue:
            parent = queue.pop(0)
            if parent == '#':
                if current_list:
                    stack.append(current_list)
                current_list = []
                if queue:
                    queue.append('#')
                continue
            else:
                current_list.append(parent.val)
            if parent.left:
                queue.append(parent.left)
            if parent.right:
                queue.append(parent.right)
        stack.reverse()
        return stack
```


**# 2.Review**
> 阅读并点评至少一篇英文技术文章  
[A Python Interpreter Written in Python](http://aosabook.org/en/500L/a-python-interpreter-written-in-python.html)
一个简易的用 Python 语言实现的 Python 解释器。非常不错的文章，可以简单了解 Python 解释器的原理。

**# 3.Tip**
> 学习至少一个技术技巧  



**# 4.Share**
> 分享一篇有观点和思考的技术文章  
本周输出：
Python 的 Kafka 客户端，文艺范十足的 Faust ，好用。



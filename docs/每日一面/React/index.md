# React 高频面试题

## JSX
JSX是JavaScript语法扩展，可以让你在JavaScript文件中书写类似HTML的标签。

- JSX要求标签必须正确闭合。
- 使用驼峰式命名法给大部分属性命名`className`。

**为什么多个JSX标签需要被一个父元素包裹（Fragment）**

JSX看起来像HTML，但在底层其实被转化为JavaScript对象，你不能在一个函数返回多个对象，除非用一个数组把他们包装起来。

## React组件通讯
使用场景：父子组件传递数据

- **Props**：父组件可以通过`props`向子组件传递数据，子组件通过`props`接收数据。
- **Callback**：父组件将一个函数作为`props`传递给子组件，子组件调用这个回调函数，来与父组件通讯。
- **Context**：提供了一种在组件之间共享值的方式，避免了一层层传递`props`的问题。

使用场景：大型应用中需要管理复杂的状态

## Redux
Redux是一个用于管理应用状态的库，它将应用的状态存储在一个单一的store中，并通过action和reducer来修改状态。Redux的核心概念包括store、actions、reducers。

## setState是异步还是同步
<font style="color:#F5222D;">setState是异步的</font>

- setState同步会导致的问题：破坏掉`props`和`state`之间的一致性，造成一些难以debug的问题。
- 通过传递一个函数解决这个问题，因为一个函数可以在函数内访问到当前的state值。

`props`和`state`都是普通的 JavaScript 对象。它们都是用来保存信息的，这些信息可以控制组件的渲染输出，而它们的一个重要的不同点就是：`props`是传递给组件的（类似于函数的形参），而`state`是在组件内被组件自己管理的（类似于在一个函数内声明的变量）。

[React FAQ - When is setState asynchronous?](https://zh-hans.reactjs.org/docs/faq-state.html#when-is-setstate-asynchronous)

**Redux和React Redux的关系**

- 两者是两个不同的库，但它们通常一起使用来管理React应用的状态。
- React Redux是一个与Redux结合使用的库，它提供了将Redux和React集成的工具，`<Provider>`组件和`connect`函数来实现这种连接。

## React中为什么需要key
和Vue一样。

## immutable
immutable通常用来描述一个对象或者数据结构，在创建后不能被修改的特性。

- **Immer**是一个工具库，帮助我们轻易写出immutable的方式。

React更新状态（state）时，使用不可变（immutable）的原因：

- 性能优化
- 避免副作用
- 历史记录与撤销
- 并发安全性

### 数组操作的参考表

| 操作       | 改变原数组         | 返回新数组                     |
|------------|-------------------|--------------------------------|
| 添加元素   | push，unshift     | concat，[...arrr]展开运算符    |
| 删除元素   | pop，shift，splice | filter，slice                  |
| 替换元素   | splice，arr[i] = ...赋值 | map                          |
| 排序       | reverse，sort     | 先将数组复制一份              |

## 什么是纯函数
纯函数仅执行计算操作，不做其他操作。具有如下特征：

- 只负责自己的任务，不会更改在该函数调用前就已存在的对象或变量。
- 输入相同，则输出相同，给定相同的输入，纯函数总是返回相同的结果。

**好处：**

- 可预测性：纯函数的输出只取决于其输入，不依赖于任务外部状态或副作用，有助于提高应用的可预测性。
- 性能优化：可以使用浅比较来确定是否需要重新渲染组件，避免不必要的渲染和DOM操作，提高了性能。
- 可测试性。
- 可维护性。

<font style="color:#DF2A3F;">React提供了“严格模式”，在严格模式下开发时，它将会调用每个组件函数两次。通过重复调用组件函数，严格模式有助于找到违反这些规则的组件。（这也是console.log打印两次的原因）</font>
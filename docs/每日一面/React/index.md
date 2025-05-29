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

## React懒加载的实现原理

React16.6 之后，提供了 React.lazy 和 Suspense 两个新特性，来实现懒加载。配合 webpack 的 code-splitting 功能，可以实现按需加载。

Suspense 允许在子组件完成加载前展示后备方案。而 lazy 能够在组件第一次被渲染之前延迟加载组件的代码，以声明一个懒加载的组件。

```jsx
import React, { Suspense } from 'react';

const OtherComponent = React.lazy(() => import('./OtherComponent'));

function MyComponent() {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <OtherComponent />
      </Suspense>
    </div>
  );
}
```

如上代码中，通过 import()、React.lazy 和 Suspense 共同一起实现了 React 的懒加载，也就是我们常说了运行时动态加载，即 OtherComponent 组件文件被拆分打包为一个新的包（bundle）文件，并且只会在 OtherComponent 组件渲染时，才会被下载到本地。

## React.memo()和useMemo()

在类组件中，我们可以使用 `shouldComponentUpdate` 或者 `PureComponent` 来控制重新渲染。

在 React16.6 之后，提供了 `React.memo()` 对函数组件执行相同操作的能力。

`React.memo()` 是一个 高阶组件（Higher-Order Component，HOC），它接收一个组件 A 作为参数并返回一个组件 B，如果组件 B 的 props 没有发生变化，则组件 B 会阻止组件 A 的重新渲染。

`useMemo()` 是一个 React Hook。可以依赖`userMemo()`作为性能优化，函数内部引用的每个值也应该出现在依赖中。

**总结**

`React.memo()`和`useMemo()`都是用来优化React组件的性能的。

- React.memo()是用来优化函数组件的性能的。
- useMemo()是用来优化普通变量的性能的。

## 类组件和函数组件

函数组件更适合复用，作为官方的底层Api，最轻量，改造成本小，不会影响原来的组件层次结构和传说中的嵌套地狱。
类组件不同的生命周期使逻辑分散且混乱，不易维护和管理，时刻需要关注`this`问题，代码复用代价高，高阶组件的使用会导致组件树变臃肿。

## React事件和原生事件的执行顺序

### 合成事件

在传统的事件里，不同的浏览器需要兼容不同的写法，在合成事件中React提供统一的事件对象，抹平了浏览器的兼容性差异。

React通过顶层监听的形式，通过事件委托的方式来统一管理所有的事件，可以在事件上区分事件优先级，优化用户体验。

### 事件委托

事件委托的意思是可以通过给父元素绑定事件委托，通过事件对象的`target`属性获取到当前出发目标阶段的`dom`元素，进行统一管理。

在写原生`dom`循环渲染的时候，我们要给每一个子元素都添加`dom`事件，这种情况最简单的方式就是通过事件委托在父元素做一次委托，通过`target`属性判断区分做不同的操作

### 事件监听

事件监听主要用到了`addEventListener`函数，事件监听和事件绑定到的最大区别就是事件监听可以给一个事件监听多个函数操作，而事件绑定只有一次。

```js
// 可以监听多个事件，不会被覆盖
eventTarget.addEventListener('click', () => {})

eventTarget.addEventListener('click', () => {})

// 只能监听一个事件，会被覆盖
eventTarget.onclick = () => {}

eventTarget.onclick = () => {}
```

### React的合成事件和原生事件的执行顺序

React 16 版本先执行原生事件，当冒泡到 `document` 时，会执行合成事件。

React 17 版本在原生事件执行前先执行合成事件捕获阶段，原生事件执行完毕后执行冒泡阶段的合成事件，通过根节点来管理所有的事件。


## 常用的 React Hooks有哪些

**useState**：用于定义组件的State，类似于类组件的this.state。
**useEffect**：用于定义组件的副作用，类似于类组件的componentDidMount、componentDidUpdate和componentWillUnmount的结合。
**useContext**：获取 context 对象，用于在组件树中获取和使用共享的上下文。
**useReducer**：用于管理复杂状态逻辑的替代方案，类似于Redux的reducer。
**useCallback**：缓存回调函数，避免传入的回调每次都是新的函数实例而导致依赖组件重新渲染，优化性能。
**useMemo**：用于缓存计算结果，避免重复计算昂贵的操作，优化性能。
**useRef**：获取组件的真实节点，用于在函数组件之间保存可变的值，并且不会引发重新渲染。
**useImperativeHandle**：用于自定义暴露给父组件的实例值或方法。
**useLayoutEffect**：与useEffect类似，但会在浏览器渲染前执行，用于处理DOM操作。
**useDebugValue**：用于在开发者工具中显示自定义的钩子相关标签。
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


## useEffect和useLayoutEffect的区别

**场景**

- `useEffect` 在React的渲染过程中被异步调用，用于绝大多数场景；
- `useLayoutEffect` 在所有的DOM变更之后同步调用，主要用于处理DOM操作、调整样式、避免页面闪烁等问题

**效果**

- `useEffect` 按照顺序执行代码，改变屏幕像素之后执行，当改变屏幕内容时可能产生闪烁
- `useLayoutEffect` 改变屏幕像素之前执行，不会产生闪烁。

**总结**

`useLayoutEffect`比`useEffect`更早执行，`useEffect`是异步调用，不会阻塞浏览器渲染，`useLayoutEffect`是同步调用，会阻塞浏览器渲染。

## React Fiber架构是什么？解决了什么问题？

Fiber 是 React 16 引入的新的协调引擎。它将原来的同步更新机制重构为异步、可中断的更新模式，本质上是一个基于链表结构的虚拟DOM节点。

以前的React采用递归方式更新，一旦开始就无法中断。如果组件树很深，主线程会被JS长期占用，导致浏览器无法响应用户操作，产生页面卡顿问题。

Fiber 方案，引入了时间切片。它将一个耗时长的更新任务拆分为许多个小的工作单元。React 可以在执行过程中暂停，去处理用户的高优先级交互，保证了界面的流畅性。

- 两阶段执行

  - 协调阶段：异步执行，可以被中断和恢复。它会对比新旧树，找出差异

  - 提交阶段：同步执行，一旦开始就不中断。它负责把差异真正反映到DOM上

- 双缓冲技术：React在内存中构建一颗新的树，构建完成后直接替代旧树，避免了UI渲染的不完整。

- 优先级调度：它可以区分任务优先级

## 什么是高阶组件(HOC)

高阶组件(HOC)是React中用于复用组件逻辑的一种高级技巧。它是一个函数，接收一个组件作为参数，并返回一个新的组件。

核心作用：

- 代码复用：将多个组件中通用的逻辑抽离出来

- 逻辑抽象：可以在不修改原组件代码的情况下，为其增加额外的功能（权限控制、日志记录）

- 渲染劫持：可以根据Props决定是否渲染组件，或者对渲染结果进行处理。

## 说说 React 性能优化的手段有哪些？

- 属性缓存：使用React.memo包裹子组件。配合useCallback缓存回调函数，useMemo缓存复杂的计算结果，防止因父组件渲染导致子组件无意义的Props改变。

- 状态下放：将状态留在最靠近使用它的组件内部，避免一个顶层状态更新导致整棵组件树刷新

- 发布订阅模式：对于极其频繁的状态更新，可以使用useRef配置发布订阅，避免React的渲染流程

- 虚拟列表：使用react-window或 react-virtualized，只渲染用户当前可见区域的DOM节点，极大降低内存占用

## 说说React Jsx转换成真实DOM过程？

- 使用`React.createElement`或`JSX`编写React组件，实际上所有的`JSX`代码最后都会转换成`React.createElement`的函数调用。`Babel`帮助我们完成了这个转换过程。

- `createElement`函数对key和ref等特殊的props进行处理，并获取`defaultProps`对默认props进行赋值，并且对传入的子节点进行处理，最终构造成一个虚拟DOM对象

- `ReactDOM.render`将生成好的虚拟DOM渲染到指定容器上，其中采用了批处理、事物等机制并且对特定浏览器进行了性能优化，最终转换为真实DOM

## 说说React render方法的原理？在什么时候会被触发？

render 函数的核心作用是“生成虚拟DOM”。

当 React 调用 render 时，它会根据最新的Props和State，递归执行组件逻辑，并返回一棵虚拟DOM树。（一个描述UI的普通JS对象）
React 会将这次新生成的虚拟DOM树与旧的虚拟DOM树进行对比（协调阶段）
对比找出差异（即Patch）后，React才会将这些差异应用到真实的DOM上。

**触发时机**

- 状态改变：这是最常见的触发方式，只要调用了useState的更新函数，React就会标记该组件为“脏”，并排队执行render

- 属性改变：当父组件重新render时，它传给子组件的Props可能会发生变化，从而触发子组件的render

- 强制更新，调用forceUpdate方法

- 父组件重新渲染：只要父组件渲染，其下所有的子组件默认都会重新渲染。这是一个递归向下寻找差异的过程。

**如何减少render次数**

- memo缓存：用React.memo包裹子组件，进行Props浅比较

- 引用稳定：配置useCallback和useMemo，确保传给子组件的函数或对象在依赖未变时引用地址不变

- 状态下放：尽量缩短状态的影响范围，避免在顶层App组件放一个频繁变化的全局状态

## useMemo和useCallback的区别

在React中，useMemo和useCallback都是用来优化性能的钩子函数，但它们的用途和作用稍有不同。

- `useMemo` 主要用于缓存计算结果，适用于任何需要缓存值的场景。

- `useCallback` 主要用于缓存回调函数，适用于需要传递给子组件的事件处理函数，以避免不必要的重新渲染。

## 为什么不能在循环、条件或嵌套函数中调用 Hooks？

React 通过“调用顺序”而不是标识符来管理 Hook 状态；循环、条件或嵌套函数会导致 Hook 调用次数或顺序发生变化，从而破坏 React 内部 Hook 链表的映射关系，引发状态错位与不可预测行为。因此 Hooks 必须在组件顶层以固定顺序执行，这是 Hooks 能够高性能、可恢复并支持并发渲染的前提。

React 对 Hooks 的实现，本质上依赖**调用顺序**来完成状态与组件实例之间的绑定，而不是依赖变量名或函数标识。

在函数组件执行时，React 会将组件当作一个普通函数重新执行一遍。每一次 render，React 内部都会维护一个指针，按照代码执行顺序依次读取或创建 Hook 状态。例如第一次遇到 useState，就取 Hook 链表中的第一个节点；第二次遇到 useEffect，就取第二个节点，以此类推。

换句话说，React 并不知道“这是哪个useState”，它只知道“这是第几个Hook”。如果 Hook 出现在条件、循环或嵌套函数中，就会破坏这种稳定的调用顺序。

React 选择这种设计，并不是限制能力，而是为了获得三个关键收益：

- 避免为每个 Hook 建立复杂的标识系统，使 Hook 实现保持极低运行时成本
- 让函数组件具备可预测的状态恢复能力，使 Fiber 在中断与恢复渲染时仍能正确关联状态
- 使 Hook 调用在并发渲染下仍然可重放

## React中的类组件和函数组件之间有什么区别？

- 类组件：使用 ES6 类定义，具有状态和生命周期方法，适用于需要管理复杂状态和副作用的场景。
- 函数组件：使用函数定义，通过 Hooks 管理状态和副作用，语法简洁，推荐用于大多数组件。

## 讲讲 React.memo 和 JS 的 memorize 函数的区别

React.memo() 和 JS 的 memorize 函数都是用来对函数进行结果缓存，提供函数的性能表现。

- **适用范围不同：**React.memo主要用于优化React组件的性能表现，而 memorize 函数可以用于任何 JavaScript 函数的结果缓存
- **实现方式不同：**React.memo是一个React高阶组件，通过浅层比较props是否发生变化来决定是否重新渲染组件，而memorize函数是通过将函数的输入参数与其计算结果保存到一个缓存对象中，以避免重复计算相同的结果
- **缓存策略不同：**React.memo的缓存策略是浅比较，只比较props的第一层属性是否相等，不会递归比较深层嵌套对象或数组的内容。而memorize函数的缓存策略是将输入参数转换成字符串后，作为缓存的键值。如果传入的参数不是基本类型时，则需要自己实现缓存键值的计算
- **应用场景不同：**React.memo主要适用于对不经常变化额组件进行性能优化，而memorize函数则主要适用于对计算量大、执行时间长额函数进行结果缓存。

## 如果在 useEffect 的第一个参数中 return 了一个函数，那么第二个参数分别传空数组和传依赖数组，该函数分别是在什么时候执行？

在React中，当useEffect第一个参数中返回一个函数时，这个函数会在组件卸载时执行。当传递空数组时，useEffect只会在组件挂载和卸载时调用一次，因此返回的函数也只会在组件卸载时执行一次。

```js
useEffect(() => {
  // 在挂载时执行

  return () => {
    // 在卸载时执行
  }
}, []);
```

## 怎么获取函数组件的实例？

- DOM 元素：可以直接使用 useRef 来获取函数组件内部的 DOM 元素。
- 函数组件实例：函数组件没有实例，但可以通过 forwardRef 和 useImperativeHandle 来转发 ref 并暴露特定的接口或方法。

在 React 中，函数组件没有实例，因此传统的 ref 机制（用于访问类组件实例的方法）不适用。不过，可以通过以下几种方式在函数组件中使用 ref 来访问 DOM 元素或函数组件的内部逻辑：

1. 访问 DOM 元素

对于函数组件中引用DOM元素，可以使用 useRef 来创建一个 ref，并将其绑定到DOM元素上。

```js
import React, { useRef, useEffect } from 'react';

const MyComponent = () => {
  const inputRef = useRef(null);

  useEffect(() => {
    // 访问 DOM 元素
    if (inputRef.current) {
      inputRef.current.focus(); // 例如，设置焦点
    }
  }, []);

  return <input ref={inputRef} />;
};
```

2. 使用 forwardRef 转发 ref

要在函数组件中访问子组件的 DOM 元素或通过 ref 传递组件实例，可以使用 React.forwardRef 来转发 ref。

```js
import React, { forwardRef, useRef, useImperativeHandle, useEffect } from 'react';

// 子组件使用 forwardRef 来接收父组件的 ref
const ChildComponent = forwardRef((props, ref) => {
  const localRef = useRef();

  useImperativeHandle(ref, () => ({
    focus: () => {
      if (localRef.current) {
        localRef.current.focus();
      }
    }
  }));

  return <input ref={localRef} />;
});

// 父组件使用 ref 来访问子组件的方法
const ParentComponent = () => {
  const childRef = useRef();

  useEffect(() => {
    // 调用子组件的 focus 方法
    if (childRef.current) {
      childRef.current.focus();
    }
  }, []);

  return <ChildComponent ref={childRef} />;
};
```

3. useImperativeHandle 的作用

useImperativeHandle 钩子允许你定制通过 ref 访问的实例值。例如，可以将特定的方法暴露给父组件，通过 ref 调用这些方法

```js
import React, { useRef, useImperativeHandle, forwardRef } from 'react';

const CustomInput = forwardRef((props, ref) => {
  const localRef = useRef();

  useImperativeHandle(ref, () => ({
    focus: () => {
      localRef.current.focus();
    }
  }));

  return <input ref={localRef} {...props} />;
});

const ParentComponent = () => {
  const inputRef = useRef();

  const handleClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div>
      <CustomInput ref={inputRef} />
      <button onClick={handleClick}>Focus Input</button>
    </div>
  );
};
```

## React 的虚拟 DOM

虚拟 DOM 是 React 的核心机制之一。可以把它理解为真实 DOM 的一个轻量级JavaScript对象副本。

### React 为什么使用虚拟 DOM？

React 引入 VDOM 并不是因为它比原生 DOM 操作快，而是为了解决以下核心问题：

- **声明式编程：** 不需要手动调用原生DOM API，只需要描述UI状态，React会自动处理DOM操作
- **跨平台能力：** 因为 VDOM 本质上是一个普通的 JavaScript 对象，可以在任何地方使用，包括服务器端和移动端
- **批量更新与合并：** React 可以将多个状态更新合并为一个，减少不必要的DOM操作，避免频繁触发浏览器的重排和重绘

### 虚拟 DOM 和真实 DOM 有什么区别？

| 特性 | 虚拟 DOM (VDOM) | 真实 DOM |
| :--- | :--- | :--- |
| 本质 | 内存中的 JavaScript 对象。 | 浏览器渲染树的一部分，重量级对象。 |
| 性能消耗 | 操作快，不涉及 GUI 渲染开销。 | 操作慢，每次改动可能触发重排/重绘。 |
| 内存占用 | 较小。 | 较大（包含几百个标准属性和方法）。 |
| 更新方式 | 整体刷新后进行 Diff 算法 对比差异。 | 针对性地增删改查。 |

### 什么时候更新虚拟 DOM

VDOM 的更新通常发生在“协调（Reconciliation）”阶段：

1. 触发阶段：当组件的 state 或 props 发生变化时
2. 生成新树：React 会重新调用函数组件，生成一颗全新的 VDOM 树
3. Diff算法：React 会将这颗“新树”与“旧树”进行对比，找出最小的变化差异（即补丁）
4. 同步到真实DOM：只有找到的差异点会被应用到真实DOM上。

### 虚拟 DOM 的性能如何？

这是一个常见的误区：“虚拟 DOM 比真实 DOM 快”。

实际上，如果你手动写一段极其精简的原生 JS 代码去修改一个节点，它永远比 React 快，因为 React 还要额外运行 Diff 算法。

VDOM 的真正价值在于：

- 保证了性能下限： 即使你写出的代码效率一般，React 也会通过 Diff 算法确保你不会进行全页面的低效 DOM 重建。

- 在大规模应用中胜出： 在复杂的 UI 中，手动维护数千个节点的增删改查极其困难且容易出错。VDOM 自动寻找“最优路径”，在复杂度和性能之间取得了极佳平衡。

## Fiber是什么？

Fiber 是将更新任务碎片化的一种架构。它把大的渲染任务拆分成一个个微小的“工作单元”。

| 特性 | Stack Reconciler (旧) | Fiber Reconciler (新) |
| :--- | :--- | :--- |
| 执行模式 | 同步、不可中断。 | 异步、可中断、可恢复。 |
| 优先级 | 所有更新一视同仁。 | 任务有优先级（如输入反馈 > 数据请求）。 |
| 数据结构 | 依靠函数调用栈（Stack）。 | 依靠链表结构（Linked List）。 |

### Fiber架构如何实现可中断渲染

Fiber实现可中断的关键在于 时间分片（Time Slicing）。

React 内部有一个调度器（Scheduler）。在处理每一小块Fiber任务之前，它会检查当前帧还剩多少时间。

- 如果有时间：继续处理下一个Fiber节点
- 如果时间不够或有高优先级任务（如用户点击）：React会保存当前进度，把控制权还给浏览器去渲染UI或处理交互
- 等浏览器空闲了：React 再回来根据保存的指针继续工作

### 每个Fiber节点包含哪些信息

每一个React元素对应一个Fiber节点，它本质上是一个复杂的 JavaScript 对象，包含：
- 静态结构信息：type、key
- 关联关系（链表指针）：
  - return：指向父节点
  - child：指向第一个子节点
  - sibling：指向下一个兄弟节点
- 状态数据：
  - pendingProps：下次渲染的props
  - memoizedProps：上次渲染的props
  - memoizedState：上次渲染的state
- 副作用标记：
  - flags：表示需要执行的副作用操作
- 调度信息
  - lanes：表示任务的优先级

### 什么是“work in progress”Fiber树

React 使用了一种叫做 双缓存（Double Buffering） 的技术来确保渲染的流畅性。内存中同时存在两棵 Fiber 树：

1. Current Fiber Tree： 当前屏幕上显示的、真实 DOM 对应的树。

2. Work in Progress (WIP) Tree： 正在内存中构建的、反映最新状态的树。

## 协调过程是什么？

### React是如何比较新旧节点的？

**同层比较**
React只会对比同一层级的节点，不会跨层级比较。
- 如果类型不同：React会直接销毁旧树及其子节点，并从头开始构建新树
- 如果类型相同：React会保留DOM节点，仅对比并更新改变的属性，然后递归地向下对比子节点

**Key的作用**
- 没有key的情况下，React只能按顺序比较
- 有key的情况下，在Diff过程中，它会在旧集合中寻找具有相同key的节点

### diff算法的优化原则是什么？
React的Diff算法基于两个核心假设，将复杂度从 O(n^3) 降低到了 O(n)：
- 同层比较：两个不同类型的元素会产生不同的树
- Key引导：通过key属性来识别哪些子元素在不同的渲染下能保持稳定
### 什么情况下组件会被重用或销毁？

满足以下条件时，组件被重用：

1. 位置相同：节点在Fiber树中的层级和顺序一致
2. 类型相同：标签名或组件类/函数引用完全一致
3. Key相同：如果是列表元素，其key必须匹配

满足以下条件时，组件被销毁

1. 类型改变：标签名或组件类/函数引用不一致
2. Key改变：即使内容完全一样，只要key变了，React也会认为这是一个全新的组件
3. 节点被移除：在新的渲染结果中，该位置不再有对应节点

## 调度机制

### React18引入了什么调度特性

#### 并发模式

并发模式不是一种单一的API，而是React渲染机制的底层重构。它的核心能力是渲染可中断。

#### 时间分片

这是并发模式的物理实现。React将长任务拆分成段。每段结束后，React会将控制权交还给浏览器。如果浏览器有用户输入或动画要处理，React就让路；如果浏览器空闲，React继续处理下一片。

#### startTransition、useDeferredValue

在 React 18 中，所有的更新被分为两类：

1. 紧急更新（Urgent updates）： 反映直接的交互，如输入、点击、按键。需要立即响应，否则用户会感到“卡顿”。

2. 过渡更新（Transition updates）： 从一个视图转换到另一个视图。用户不期待它们立即完成（如搜索列表的过滤、图表的切换）。

**startTransition** 用于包装那些耗时的、非紧急的状态更新
**useDeferredValue** 类似于防抖，但更智能。它会让一个值“滞后”更新。React会先用旧值渲染，在后台默默计算新值，只有当CPU空闲时才把新值推送到屏幕上。

### React如何确定任务的优先级

React 内部使用 Lane（车道）模型 来管理优先级。你可以把它想象成多车道的高速公路：

- Sync Lane（同步车道）： 最高优先级，如输入框输入。

- InputContinuous Lane（连续输入车道）： 滚动、拖拽等。

- Default Lane（默认车道）： 通过 fetch 请求回来的数据更新。

- Transition Lane（过渡车道）： 通过 startTransition 标记的任务。

React 通过位运算来计算这些优先级，从而决定哪些更新应该被批量处理，哪些应该被插队。

### 任务调度与浏览器调度的关系

浏览器的一帧（60Hz）大约有 16.6ms。在这一帧里，浏览器需要完成：

1.处理输入事件

2.执行定时器

3.执行 RequestAnimationFrame (rAF)

4.执行布局（Layout）和绘制（Paint）

5.计算剩余空闲时间 (RequestIdleCallback)

React 的调度器（Scheduler）利用了类似 requestIdleCallback 的机制（但为了跨浏览器兼容性，React 自己实现了一个更强大的版本）：

- 协调： React 会在浏览器绘图后的“空闲时间”里执行 Fiber 任务。

- 让步： 如果 5ms 时间片耗尽，React 会通过 MessageChannel 发送一个宏任务，把自己挂起，确保浏览器有机会去处理下一帧的布局和绘图。

## 在 React 中如何实现代码分割？有哪些常见方式？

在 React 中，代码切割主要依赖于 React.lazy + Suspense 和 React Loadable(第三方库)，此外 Webpack 的 import() 也能实现代码分割。

1. React.lazy + Suspense

```js
const LazyComponent = React.lazy(() => import('./LazyComponent'));
function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LazyComponent />
    </Suspense>
  );
}
```

2. React Loadable

```js
import Loadable from 'react-loadable';
const LoadableComponent = Loadable({
  loader: () => import('./MyComponent'),
  loading: () => <div>Loading...</div>,
});
```

3. Webpack import + optimization.splitChunks(适用于手动分割多个模块)

```js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
  },
};
```

## 在 React 中可以做哪些性能优化？

1. 使用`React.memo`减少不必要的渲染
2. 利用`useCallback`缓存函数和`useMemo`和计算结果
3. 合理使用`shouldComponentUpdate`生命周期方法，避免不必要的渲染
4. 使用懒加载(`React.lazy + Suspense`)按需加载组件
5. 优化渲染列表，使用`key`属性帮助React识别列表项
6. 避免在渲染方法中创建新的对象或函数
7. 使用`useReducer`代替在复杂组件中的多个`useState`调用
8. 减少组件层，避免不必要的嵌套
9. 使用`React.Fragment`减少额外的DOM节点

## 什么是高阶组件？

高阶组件是React中的一种设计模式，用于增强或修改组件的行为。它是一个接受组件作为参数并返回一个新组件的函数。高阶组件本质上是一个函数，它用于复用组件逻辑和功能，避免在多个组件中重复代码。

高阶组件的特点：

1. 函数式组件增强：接受一个组件作为参数，返回一个新的组件，这个新的组件会封装和增强原始组件的功能
2. 逻辑复用：通过高阶组件，可以在多个组件中复用相同的逻辑和功能，而不需要重复代码
3. 组件装饰：为原始组件添加额外的功能或数据，例如提供额外的props、处理权限控制、数据获取等

高阶组件的常见用途：

1. 权限控制：可以创建一个高阶组件来检查用户权限，并根据权限控制组件的渲染或访问
2. 数据获取：可以在挂载时获取数据，并将数据传递给原始组件，避免在多个组件中重复数据获取逻辑
3. 行为增强：可以为组件添加额外的功能，如事件处理、日志记录等

## 受控组件与非受控组件

受控组件：组件的 state 由 React 控制，用户输入的值会同步到 state。

非受控组件：组件的 state 由 DOM 控制，React 不干预。

```js
// 受控组件
function ControlledInput() {
  const [value, setValue] = useState('');

  return (
    <input 
      type="text" 
      value={value} 
      onChange={(e) => setValue(e.target.value)} 
    />
  );
}

// 非受控组件
function UncontrolledInput() {
  const inputRef = useRef();

  const handleSubmit = () => {
    alert(inputRef.current.value);
  };

  return (
    <div>
      <input type="text" ref={inputRef} />
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}
```

### 优缺点对比

| 特性 | 受控组件 (Controlled) | 非受控组件 (Uncontrolled) |
| :--- | :--- | :--- |
| 优点 | 高度可控：可以即时验证输入、格式化文本（如自动大写）、根据输入实时改变 UI。 | 简单快捷：代码量少，性能略高（不触发 React 重新渲染），适合集成非 React 的第三方库。 |
| 缺点 | 代码冗余：需要为每个字段写 onChange 和 state；在大表单中可能引起频繁重绘。 | 难以即时反馈：无法做实时校验或根据输入值动态禁用按钮。 |
| 数据源 | React State | 浏览器 DOM |

### 场景

React 官方通常推荐使用受控组件，因为它更符合 React “数据驱动视图” 的哲学，但在某些特定场景下，非受控组件更具优势。

受控组件：

- 实时验证： 例如输入时检查密码强度、邮箱格式。

- 条件禁用： 例如只有当所有必填项都有值时，提交按钮才亮起。

- 格式化输入： 例如输入信用卡号时自动添加空格。

- 多个输入联动： A 输入框的值决定 B 输入框的可选内容。

非受控组件：

- 简单且巨大的表单： 如果你有几百个输入框，受控组件的频繁渲染可能导致肉眼可见的输入延迟。

- 文件上传 `(<input type="file">)`： 在 React 中，文件输入框始终是非受控的，因为你只能读取文件，不能通过代码设置它的值。

- 快速原型开发： 只是想简单拿个值提交，不想维护一堆 state。

## setState是如何合并更新的？

React 的合并更新（Batching）是性能优化的核心。React 不会因为你连续写了三次 setState 就让浏览器重新渲染三次。核心逻辑如下：

1. 收集更新：当调用 setState 时，React并不会立即修改组件，而是产生一个 Update 对象挂载到 Fiber 节点的队列中
2. 调度任务：React 发起一个调度任务。由于调度是异步的（利用微任务），代码会继续向下执行
3. 最终合并：如果是对象式`setState({count: 1})`，React会像`Object.assign`一样浅合并，相同字段以最后一次为准；如果是函数式`setState(prev => prev + 1)`，React 会按顺序排队执行这些函数，确保逻辑累加。

## React 生命周期有哪些？

**挂载（Mounting）**

组件被创建并插入到DOM中的过程。

- constructor()

作用：构造函数，用于初始化组件状态和绑定事件处理函数
调用时机：组件创建时调用，第一次渲染之前

- static getDerivedStateFromProps()

作用：在每次渲染之前调用，允许组件根据props更新状态
调用时机：组件创建时和每次更新时调用

- render()

作用：渲染组件的UI，碧玺实现的实现方法
调用时机：组件的第一次渲染和每次更新时调用

- componentDidMount()

作用：组件挂载完成之后调用。通常用于进行数据获取、订阅或设置DOM操作
调用时机：组件第一次渲染完成后调用

**更新（Updating）**

组件由于props或state的变化而重新渲染的过程

- static getDerivedStateFromProps()

- shouldComponentUpdate()

作用：用于控制组件是否应该更新。
调用时机：在组件的props或state变化时调用，决定是否重新渲染组件

- render()

- getSnapshotBeforeUpdate()

作用：在实际DOM更新之前调用，可以获取DOM的状态，以便在componentDidUpdate中使用
调用时机：组件更新时，在render之后，实际DOM更新之前

- componentDidUpdate()

作用：组件更新完成后调用。可以用于处理更新后的DOM或发送网络请求等
调用时机：组件更新完成后调用

**卸载（Unmounting）**

组件从DOM中移除的过程。

- componentWillUnmount()

作用：组件卸载前调用。用于清理资源，如取消订阅、清空定时器等
调用时机：组件被从DOM中移除之前调用

## useEffect 与 useLayoutEffect 有什么区别

这两个Hook的功能非常相似，都用于处理副作用。但它们在执行时机上有本质的区别。这直接影响到用户是否会看到界面闪烁。

- useEffect是异步不阻塞，执行时机在屏幕渲染后，主要用于数据获取、订阅、不操作DOM德逻辑
- useLayoutEffect是同步阻塞，执行时机在屏幕渲染前，DOM更新后，主要用于读取/修改DOM布局

## 为什么 useState 返回的是数组而不是对象？

useState 返回一个数组而不是对象，主要是为了简化状态管理和更新过程，使得状态的获取和更新更为直观和一致。这个设计决定让 React 的函数式组件更加简洁、易于维护，并减少了潜在的复杂性。

主要是解构赋值的问题

## useEffect

### useEffect的执行逻辑完全取决于它的第二个参数

| 依赖项情况 | 执行时机 | 模拟的生命周期 |
| :--- | :--- | :--- |
| 无依赖项 | 每次渲染后都会执行。 | 类似于 componentDidUpdate (无限制版)。 |
| 空数组 [] | 仅在初次渲染（Mount）后执行一次。 | componentDidMount |
| 有依赖 [deps] | 初次渲染后，以及任何一个依赖项发生变化后执行。 | 定向的 componentDidUpdate |

### 模拟类组件生命周期

1. 模拟 componentDidMount

```js
useEffect(() => {
  console.log("组件挂载了，可以在这里发起 API 请求");
}, []); // 依赖为空，只跑一次
```

2. 模拟 componentDidUpdate

```js
useEffect(() => {
  console.log("状态或属性变了，UI 已更新");
}, [count]); // 只有 count 变化时才触发
```

3. 模拟 componentWillUnmount

```js
useEffect(() => {
  const timer = setInterval(() => console.log('Tick'), 1000);
  
  return () => {
    console.log("组件卸载了，清理定时器");
    clearInterval(timer);
  };
}, []);
```

### useEffect vs useLayoutEffect

这是最容易混淆的一点。核心区别在于：它是阻塞渲染还是在渲染后异步执行？

useEffect (异步、非阻塞)

- 时机： 浏览器完成“布局”和“绘制”之后。

- 特点： 不会阻塞页面渲染。

- 场景： 绝大多数场景（API 请求、日志记录）。

useLayoutEffect (同步、阻塞)

- 时机： DOM 更新后，但浏览器绘制之前。

- 特点： 会阻塞页面渲染。它保证了你在副作用里修改 DOM 后，用户只会看到最终的结果。

- 场景： 需要测量 DOM 尺寸或位置并立即修改样式，以防止界面“闪烁”。

## useState 是如何实现的？

useState 是 React 的一个Hook，用于在函数组件中管理状态。useState的实现涉及到React的内部机制，包括状态管理、更新队列和组件的重新渲染。

**实现原理：**

1. 状态的初始化

当调用 useState 时，可以传递一个初始状态值或一个函数用于计算初始状态。React 会将这个初始状态值存储在一个内部的状态容器中，

```js
const [state, setState] = useState(initialState);
```

2. 内部数据结构

React 使用一个叫“Hooks List”的数据结构来管理各个组件的 Hook 状态。在每次组件渲染时，React 会使用这个数据结构来跟踪组件的 Hook 调用顺序和状态。

- Fiber 树：每个组件在 React 的 Fiber 树中都有一个与之对应的 Fiber 节点。Fiber 节点包含了该组件的状态信息和相关的 Hook 信息。
- Hooks 链表：useState 和其他 Hooks 会在 Fiber 节点中按照调用顺序形成一个链表。每个 Hook 记录了其当前的状态值和更新函数。

3. 状态的更新

当调用 setState 时，React会将状态更新请求加入到更新队列中。更新队列是 React 用于管理所有状态变更的机制。每当 setState被调用时，React 会将新的状态值和当前状态进行比较，决定是否需要出发重新渲染。

```js
function setState(newState) {
  // 更新队列中加入新的状态值
  updateQueue.push(newState);

  // 标记 Fiber 节点需要重新渲染
  scheduleUpdate();
}
```

4. 触发重新渲染

在调用 setState 后，React 会安排重新渲染过程。这包括以下几个步骤：

 1. 调度更新：将更新请求加入调度队列，React 会在适当的时候处理这些更新
 2. 重新渲染组件：React 会调用组件函数，执行 useState 和其他 Hook
 3. 比较新旧状态：React 会比较新旧状态，计算出哪些组件需要更新
 4. 提交更新：将计算好的更新提交到 DOM 中

5. 状态的持久化

在每次组件渲染时，React 会通过 Hooks 链表来保持状态的一致性。即使组件重新渲染，useState 会从 Fiber 节点中获取之前保存的状态值，确保状态在多次渲染中保持不变。

## 说说 React commit 阶段的执行过程

在 React 的 Fiber 架构中，commit 阶段是将更新应用到实际DOM的关键步骤。这个阶段处理在 render 阶段中计算出的所有副作用，并实际更新页面内容。

1. 提交 Fiber 树（commit阶段开始时，React会获取从 render 阶段生成的Fiber树）
2. 递归遍历 Fiber 树，处理副作用（从根节点遍历Fiber树，副作用包括插入、更新、删除实际 DOM 元素、执行生命周期方法、useEffect和useLayoutEffect的回调）
3. 应用副作用，执行插入、更新、删除实际 DOM 元素
4. 调用生命周期方法和执行副作用的回调
5. 更新 Fiber 树，清理副作用标记
6. 浏览器进行布局和绘制

## React 中为什么不直接使用 requestIdleCallback？

在React中，使用requestIdleCallback直接可能会导致一些问题，因此React并没有直接采用这个API。requestIdleCallback是一个浏览器提供的API，用于在浏览器空闲时执行任务，但在React中，有一些特殊的考虑：

1. 兼容性和一致性问题： requestIdleCallback 并非所有浏览器都支持，requestIdleCallback的执行时机不是完全可控的，这可能导致在不同环境中表现不一致。React希望提供一致的行为，以确保开发者在不同浏览器和设备上获得可预测的性能表现。

2. 实时性问题： React通常希望能够响应用户输入并立即更新UI，而requestIdleCallback执行的时机不一定能够满足实时性的需求。这可能导致用户体验上的问题，特别是在需要快速响应的场景中。

3. 调度器控制： React内部有一个任务调度器，负责管理和调度任务的执行。直接使用requestIdleCallback可能破坏React的任务调度策略，导致不可预测的结果。

为了解决这些问题，React引入了Scheduler模块，该模块允许React更好地控制任务的调度和执行。React可以根据自身的需要在不同优先级下安排任务，并确保在保证实时性的同时，提供一致的性能表现。

## 如何让 useEffect 支持 async/await？

React 的 useEffect Hook 不支持直接使用 async/await。这是因为 useEffect 的回调函数必须返回一个清理函数(可选),而 async 函数会隐式地返回一个 Promise。

1. 创建一个异步函数，然后执行该函数

```js
useEffect(() => {
  const asyncFun = async () => {
    setPass(await mockCheck());
  };
  asyncFun();
}, []);
```

2. 使用IIFE（立即执行函数表达式）
```js
useEffect(() => {
  (async () => {
    setPass(await mockCheck());
  })();
}, []);
```

3. 使用自定义Hook，如ahooks的useAsyncEffect
```js
useAsyncEffect(async (isCanceled) => {
}, []);
```
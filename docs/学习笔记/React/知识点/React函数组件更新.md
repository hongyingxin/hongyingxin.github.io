# React函数组件更新

React 的函数组件（Function Component）自 Hooks 推出以来已成为 React 开发的主流方式。理解函数组件的更新原理对于编写高效、可维护的 React 应用至关重要。

## 一 函数组件与类组件的本质区别

**类组件：**是类的实例，拥有实例属性和生命周期方法

**函数组件：**是纯函数，接受 props 作为参数，返回 JSX。

这种本质区别决定了它们的更新行为完全不同。

## 二 函数组件的执行机制

当 React 需要渲染一个函数组件时，它只是简单地调用这个函数：

```js
function MyComponent(props) {
  return <div>{props.message}</div>;
}

// React内部大致这样处理
const element = MyComponent({ message: 'Hello' });
```

每次渲染都是全新的函数调用，所有局部变量和函数都会重新创建。这与类组件形成鲜明对比，类组件在更新时会复用同一个实例。

## 三 触发更新的场景

函数组件的更新主要由以下情况触发：

1. **父组件重新渲染：**即使props未变化，父组件渲染也会导致子组件重新渲染
2. **props发生变化：**当传入组件的 props 值改变时
3. **状态更新：**通过 useState、useReducer 等 Hooks 更新状态
4. **context变化：**组件订阅的context值发生变化
5. **Hooks依赖变化：**useEffect、useMemo等Hook的依赖项发生变化

## 四 React的渲染流程

函数组件的更新遵循 React 的渲染流程：

1. **触发更新：**通过 setState、父组件渲染等途径触发更新
2. **协调阶段：**
  - React 调用函数组件获取新的 JSX
  - 与上一次渲染的 JSX 进行对比
3. **提交阶段：**
  - 将差异应用到真实DOM
  - 执行 useLayoutEffect 的回调
4. **浏览器绘制：**浏览器重绘屏幕
5. **副作用执行：**执行 useEffect 的回调

## 五 Hooks与组件更新

Hooks是函数组件能够拥有状态和生命周期的关键。

### useState 的工作原理

```js
const [count, setCount] = useState(0);
```

- React 会在组件首次渲染时为每个 useState 调用分配一个“状态单元”
- 后续更新时，React 会按照 Hooks 的调用顺序来提供对应的状态值
- setCount 调用会触发组件的重新渲染

### useEffect 与更新

```js
useEffect(() => {
  // 副作用代码
  return () => {
    // 清理函数
  };
}, [dependencies]);
```

- 组件每次渲染后，React 会比较依赖项数组
- 如果依赖项变化或没有提供依赖项数组，副作用会重新执行
- 清理函数会在副作用重新执行前或组件卸载时执行

## 六 优化更新性能

由于函数组件每次更新都会完整执行函数体，我们需要一些优化手段：

### React.memo

```js
const MyComponent = React.memo(function MyComponent(props) {
  /* 使用props渲染 */
});
```

React.memo 会对 props 进行浅比较，避免不必要的重新渲染。

### useMemo

```js
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
```

useMemo 可以缓存计算结果，避免每次渲染都重复计算。

### useCallback

```js
const memoizedCallback = useCallback(() => {
  doSomething(a, b);
}, [a, b]);
```

useCallback 可以缓存函数引用，避免子组件函数引用变化而重新渲染。

## 七 闭包陷阱

函数组件更新时的一个常见问题时“过时闭包”：

```js
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCount(count + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []) // 空依赖数组，只会在组件挂载时执行一次

  return <div>Count: {count}</div>;
}
```

解决方案就是使用函数式更新或添加依赖：

```js
setCount(c => c + 1); // 函数式更新
```
或者
```js
useEffect(() => {
  const id = setInterval(() => {
    setCount(count + 1);
  }, 1000);
  return () => clearInterval(id);
}, [count]); // 添加count依赖 
```

## 八 并发模式下的更新

React 18引入了并发特性，更新机制变得更加复杂：

- **自动批处理：**多个状态更新会自动批处理，减少渲染次数
- **过渡更新：**使用 startTransition 标记非紧急更新
- **Suspense：**组件可以“暂停”渲染等待数据

这些特性使 React 能够优先处理用户交互等紧急更新，提升用户体验。

## 九 总结

React 函数组件的更新原理可以概括为：

1. 每次更新都是全新的函数调用
2. Hooks维护了组件的状态和行为
3. React通过协调算法高效更新DOM
4. 优化手段可以避免不必要的计算和渲染
5. 理解闭包陷阱对编写正确代码至关重要
6. 并发模式带来了更智能的更新调度

## 常见考点

### 1. 函数组件的初次渲染

#### 请简述React函数组件的初次渲染过程

初次渲染过程即 Mounting 阶段

当 React 决定将组件挂载到DOM上时，会经历以下步骤：

- 执行函数：React调用你的函数组件
- 生成虚拟DOM：函数运行后返回JSX，React会将其转化为虚拟DOM树
- 构建Fiber树：React会为该组件创建一个Fiber节点，用于追踪组件的状态、Hook链表
- 提交更新Commit：React将生成的虚拟DOM转换为真实的HTML元素，并插入到页面中
- 副作用处理：渲染完成后，执行 useLayoutEffect 或 useEffect 的回调

#### 在初次渲染过程中，React是如何处理函数组件的输入props和状态state的？

Props：React将传递给组件的所有属性打包成一个对象、作为第一个参数传入函数。在初次渲染时，Props就像快照，反映了父组件传来的初始值

State：当函数执行到 useState 时，由于是初次渲染，React 会在内部的 Fiber 节点上创建一个状态链表。它会将传入 useState(initialValue)的初始值存入该节点。

### 2. 函数组件的更新触发

#### 哪些因素会触发React函数组件的更新？

函数组件的重新渲染通常由以下三个引擎驱动：

- Props变化：父组件重新渲染并向子组件传递了新的属性
- State变化：调用了 useState 返回的 setState 函数或 useReducer 的 dispatch 函数
- Context变化：组件订阅的 useContext 的值发生了变化
- 强制更新：父组件本身发生了重绘

#### 当props或state发生变化时，React是如何检测到这些变化的？

React的检测机制遵循“浅比较”策略：

针对内部状态State：

当你调用 setState 时，React使用 Object.is 算法来对比新旧值：

 - 原始类型：直接比较值。如果值没变，React会跳过渲染
 - 引用类型：只比较内存地址

针对属性Props：

 - 默认情况下，只要父组件重新渲染，子组件默认就会重新执行，无论Props是否变化
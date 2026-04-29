# 重新整理的React面试题

## 1. 如何实现路由懒加载

核心思路：将路由组件拆分为独立的JavaScript代码块（Chunk），仅在访问该路由时进行加载。

- 1. 使用`React.lazy`动态导入组件，包装`import()`语法，Vite会识别该语法自动进行代码分割

- 2. 使用`Suspense`包裹组件，因为是动态加载，在组件完成下载前需要渲染一些降级内容

- 3. 使用`ErrorBoundary`捕获组件下载失败

**栗子**

```js
import React, { Suspense } from 'react';
const LazyComponent = React.lazy(() => import('./LazyComponent'));
function App() {
  return (
    <ErrorBoundary fallback={<div>加载失败</div>}>
      <Suspense fallback={<div>加载中...</div>}>
        <LazyComponent />
      </Suspense>
    </ErrorBoundary>
  );
}
```

总结： 路由懒加载 = `React.lazy` + `import()` + `Suspense` + `ErrorBoundary`。

## 2.`React.memo()`和`useMemo()`的区别

`React.memo()`是一个高级组件（HOC），用于缓存组件本身；而`useMemo()`是一个Hook，用于缓存函数执行的结果（值）。

### React.memo()：缓存组件

`React.memo`用于包裹一个组件。它通过对组件的`props`进行浅比较来决定是否跳过重新渲染

```js
const MyComponent = React.memo((props) => {
  console.log("子组件渲染了");
  return <div>{props.value}</div>;
});
```

### useMemo()：缓存值

`useMemo`是在组件内部使用的Hook。它接收一个函数和一个依赖项数组，只有当依赖项发生变化时，才会重新运行该函数。

```js
const memoizedValue = useMemo(() => {
  return computeExpensiveValue(a, b);// 仅在 a 或 b 变化时重新计算
}, [a, b]);
```

---

这两者通常是一起使用，用于优化子组件的性能。

因为父组件向子组件传递一个对象或数组，在JavaScript中，每次父组件渲染都会生成一个新的引用，导致`React.meo`的浅比较失效。这时需要使用`useMemo`来缓存这个对象或数组，避免每次都重新计算。

```js
function Parent() {
  const [count, setCount] = useState(0);

  // 如果不用 useMemo，每次 Parent 渲染，data 的引用都会变
  const data = useMemo(() => ({ name: 'React' }), []); 

  return <Child data={data} />;
}

// 子组件必须用 React.memo 包裹，配合 useMemo 才能真正生效
const Child = React.memo(({ data }) => {
  console.log("Child render");
  return <div>{data.name}</div>;
});
```

### 注意事项

- 1. 不要过度使用，缓存本身有内存和计算开销

- 2. 浅比较局限，如果`props`是深层嵌套对象，需要传入第二个参数`areEqual`手动控制对比逻辑

## 3. 如何理解合成事件

合成事件是React模拟原生DOM事件而实现的一套跨浏览器事件机制。

### 原因

1. 跨浏览器兼容性：不同浏览器对事件对象的属性定义不同（比如`e.target`vs`e.srcElement`）。React将这些差异封装在合成事件对象中，提供了一致的API

2. 性能优化（事件委托）：React并不是把事件监听器挂载到每个具体的DOM节点上，而是采用事件委托的方式。

3. 更好的跨端支持：合成事件层作为一个抽象层，使得事件系统可以更容易地移植到不同的平台，如React Native。

### 原理

当写下`<button onClick={handleClick}>`时，React并不会给这个`<button>`元素添加`addEventListener`

1. 事件注册：在组件挂载时，React会根据组件声明的事件类型，在根节点（如`#root`）上监听原生事件

2. 事件分发：在用户点击按钮，原生事件冒泡到根节点，React的事件系统会捕获这个事件

3. 合成对象创建：React内部会根据原生事件创建一个`SyntheticEvent`实例

4. 回调执行：React模拟捕获和冒泡过程，找到对应的React组件并执行回调函数

### 版本变化

1. 委托节点改变：

  - React 16：事件委托在`document`全局上
  - React 17：事件委托在`root`容器节点上
  - 原因：解决在同一个页面存在多个React版本时，事件冒泡冲突问题

2. 事件池移除

  - React 16中为了性能，合成事件对象会被复用，异步访问`e`会报错

  - React 17废弃了事件池，可以随时在异步逻辑中访问

### 和原生事件的执行

在一个React组件中，原生事件和合成事件谁先执行？

原生事件先执行：因为合成事件是靠冒泡到根节点才触发的。
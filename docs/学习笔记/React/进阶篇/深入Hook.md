# 深入Hook

## 1. 不能在循环、条件判断或嵌套函数中调用Hook?

React 官方文档中明确强调了“只在最顶层使用Hooks”，是因为React内部依赖于Hook的“调用顺序”来正确关联状态。

React 为每个组件维护了一个单向链表，并用一个内部指针来追踪当前执行到哪一个Hook。

- 初次渲染（Mounting）：按照Hooks的书写顺序，依次在链表中创建节点，并把指针指向它们

- 更新渲染（Updating）：重新执行组件函数，再次按照完全相同的顺序，一个一个去链表里读取对应的旧状态

React 选择这种设计，并不是限制能力，而是为了获得三个关键收益：

- 避免为每个 Hook 建立复杂的标识系统，使 Hook 实现保持极低运行时成本（不需要注册各种key）
- 确保 Hook 调用顺序稳定，避免条件语句或循环中的 Hook 错位
- 简化 Hook 的内部实现，使其更易于维护和扩展


### 深入了解Hook的实现原理

在React源码中（具体在`react-reconciler`包的`ReactFiberHooks.js`文件），每一个在组件写的Hook，在底层都会被封装成一个Hook对象。

核心代码如下：
```js
type Hook = {
  memoizedState: any,  // 存储该 Hook 的当前状态值（对于 useState，就是那个 state）
  baseState: any,
  baseQueue: Update<any, any> | null,
  queue: UpdateQueue<any, any> | null, // 存储更新队列（比如你多次调用 sethook）
  next: Hook | null,   // 指向下一个 Hook 节点的指针！这就是单向链表的关键
};
```

这个Hook链表挂载在当前组件对应的Fiber节点的`memoizedState`属性上。

```plaintext
FiberNode (当前组件)
   │
   └── memoizedState ──▶ Hook 1 (useState)
                            │
                            └── next ──▶ Hook 2 (useEffect)
                                             │
                                             └── next ──▶ Hook 3 (useState)
                                                              │
                                                              └── next ──▶ null
```

这里需要区分：Fiber节点的`memoizedState`存的是第一个Hook节点，而Hook节点的`memoizedState`存的是具体的业务状态值（如果是useState，这里存的就是状态值；如果是useEffect，这里存的就是effect对象的链表）。

React在内部把Hooks的执行分为不同的阶段。最核心的是两个`dispatcher（调度器）`：`HooksDispatcherOnMount`（初次渲染）和`HooksDispatcherOnUpdate`（更新渲染）。

在组件运行时，React底层有一个全局指针`workInProgressHook`，用来指向当前正在处理的Hook节点。

- 阶段一：Mounting（初次渲染）

当第一次调用组件，代码从上到下执行，此时调用的是`mountState`。

```js
function mountWorkInProgressHook() {
  const hook = {
    memoizedState: null,
    baseState: null,
    baseQueue: null,
    queue: null,
    next: null,
  };

  if (workInProgressHook === null) {
    // 这是组件的第一个 Hook，挂载到 Fiber 上
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  } else {
    // 不是第一个，就把上一个 Hook 的 next 指向当前新创建的 Hook
    workInProgressHook = workInProgressHook.next = hook;
  }
  return workInProgressHook;
}
```
- 阶段二：Updating（更新渲染）

当组件重新渲染时，React不再创建新链表，而是调用`updateState`，并通过`updateWorkInProgressHook`去读取旧链表。

```js
function updateWorkInProgressHook() {
  let nextCurrentHook;
  
  if (currentHook === null) {
    // 刚开始更新，去找上一次渲染保留的 Fiber 节点上的第一个 Hook
    const current = currentlyRenderingFiber.alternate;
    nextCurrentHook = current.memoizedState;
  } else {
    // 沿着上一次的链表向后走
    nextCurrentHook = currentHook.next;
  }

  // 关键！把 currentHook 指针向后移
  currentHook = nextCurrentHook; 

  // 基于旧的 Hook，克隆/复出一个新的 workInProgressHook 供本次渲染使用
  const newHook = {
    memoizedState: currentHook.memoizedState,
    baseState: currentHook.baseState,
    baseQueue: currentHook.baseQueue,
    queue: currentHook.queue,
    next: null,
  };

  if (workInProgressHook === null) {
    currentlyRenderingFiber.memoizedState = workInProgressHook = newHook;
  } else {
    workInProgressHook = workInProgressHook.next = newHook;
  }

  return workInProgressHook;
}
```

### 总结

React从设计架构上抛弃了传统的“靠key键值对寻址”，选择使用“靠执行顺序在单向链表里指针移位寻址”的方式，性能上更加高效。

这种“以时间换空间/纯进度”的设计，唯一的代价就是：增加开发者的心智负担，必须保证每次渲染时，组件内的Hooks的调用顺序一致。
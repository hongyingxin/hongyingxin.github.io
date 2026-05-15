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

#### Hook 对象

在React源码中（具体在`react-reconciler`包的`ReactFiberHooks.js`文件），每一个在组件写的Hook，在底层都会被封装成一个Hook对象。

核心代码如下：
```js
type Hook = {
  memoizedState: any,  // 存储该 Hook 的当前状态值（对于 useState，就是那个 state）
  baseState: any,     // 跳过某些低优先级更新时的基础状态
  baseQueue: Update<any, any> | null,   // 跳过某些低优先级更新时的基础更新队列
  queue: UpdateQueue<any, any> | null, // 存储更新队列（比如你多次调用 sethook）
  next: Hook | null,   // 指向下一个 Hook 节点的指针！这就是单向链表的关键
};
```
这个Hook链表挂载在当前组件对应的Fiber节点的`memoizedState`属性上。

1. memoizedState（状态缓存区）

这是Hook最核心的字段，用来存真正的数据。

虽然每个Hook对象（`useState`、`useEffect`等）的结构完全一模一样，但由于它们的业务逻辑不同，同一个字段里存的数据结构会大相径庭。

- `useState(0)`：`memoizedState`存的就是当前的基础具体值，比如数字0

- `useRef(initialValue)`：`memoizedState`存的是一个标准的ref对象：`{current: initialValue}`

- `useEffect(fn, [])`：`memoizedState`存的是一个特殊的effect对象，这个Effect对象自身也包含了一个循环链表：`{tag: HookEffectTag.EFFECT, create: fn, destroy: null, deps: [...], next: null}`

- `useMemo(fn, [])`：`memoizedState`存的是一个数组：`[fn, deps]`

2. next（链表指针）

这是串联整个组件所有Hooks的纽带。

组件里的第一个Hook对象的`next`指向第二个Hook对象，以此类推，最后一个Hook对象的`next`指向`null`。


3. queue（更新队列）

专门服务于`useState`或`useReducer`这种会触发重渲染的Hook。

当多次调用`setCount(count => count + 1)`时，React会把这个更新动作包装成一个个`Update`对象，并添加到Hook节点的`queue`更新队列中。

假设组件存在以下三个Hook：

```js
const [name, setName] = useState('Alice');
const ageRef = useRef(25);
useEffect(() => {}, []);
```

那么它们的Hook链表对象如下：

```js
// FiberNode.memoizedState 最终指向下面这个链表：
{
  // 1. 第一个 Hook: useState('Alice')
  memoizedState: 'Alice', 
  queue: { /* 存放 setName 的更新队列 */ },
  next: {
    // 2. 第二个 Hook: useRef(25)
    memoizedState: { current: 25 }, 
    queue: null, // useRef 不需要触发更新，没有 queue
    next: {
      // 3. 第三个 Hook: useEffect(...)
      memoizedState: { 
        tag: 5,           // HookHasEffect
        create: () => {}, // 副作用函数
        destroy: undefined,
        deps: [],         // 依赖项
        next: { /* 环形链表 */ } 
      },
      queue: null,
      next: null // 后面没有 Hook 了，指向 null
    }
  }
}
```

#### Hook 链表

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
// 全局变量，用来追踪当前执行到组件的哪一个 Hook 了
let workInProgressHook = null;

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

## 2. React 三层关系

在React源码中，React由`ReactFiber`、`ReactFiberWorkLoop`、`ReactFiberHooks`三个核心模块组成。

### Hook 链表的代码描述

在组件内部，Hook链表是通过在执行时不断将新Hook节点的`next`指向下一个新节点来动态构建的。

在源码的`mountWorkInProgressHook`函数中，它的代码逻辑如下：

```js
// 全局变量，用来追踪当前执行到组件的哪一个 Hook 了
let workInProgressHook = null; 

function mountWorkInProgressHook() {
  // 1. 创建一个纯粹的 Hook 节点对象
  const hook = {
    memoizedState: null, // 存具体的数据，如 'Alice'
    next: null,          // 指向下一个 Hook
  };

  if (workInProgressHook === null) {
    // 说明这是该组件的第一个 Hook，把它作为链表头
    // currentlyRenderingFiber 代表当前正在渲染的组件 Fiber 节点
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  } else {
    // 说明不是第一个，把上一个 Hook 的 next 指向它，并把指针后移
    workInProgressHook = workInProgressHook.next = hook;
  }
  
  return workInProgressHook;
}
```

### 组件Fiber的代码描述

组件（Fiber节点）在代码中是一个构造函数`FiberNode`。它的职责是用指针把自己织入应用树，同时用一个属性兜住上面的Hook链表。

源码`ReactFiber.js`的逻辑如下

```js
function FiberNode(tag, pendingProps, key) {
  // ------------------ 1. 组件自身信息 ------------------
  this.tag = tag;               // 区分是函数组件、类组件还是原生DOM
  this.type = null;             // 指向组件函数本身，例如 function Profile() {...}
  this.stateNode = null;        // 如果是原生标签，指向真实 DOM 节点

  // ------------------ 2. 编织应用树/链表的指针 ------------------
  this.child = null;            // 纵向：指向大儿子组件
  this.sibling = null;          // 横向：指向亲兄弟组件
  this.return = null;           // 纵向：指向父亲组件

  // ------------------ 3. 挂载 Hook 链表的属性 ------------------
  // 核心：在函数组件中，这个属性专门用来存上面第一层 Hook 链表的第一个节点
  this.memoizedState = null;    
  
  this.pendingProps = pendingProps;
}
```

### 整个应用树的代码描述

整个应用在代码的最顶层，由一个叫`FiberRootNode`的构造函数来描述。它不负责具体的业务，它只负责整个组件树的根部。

源码`ReactFiberRoot.js`的逻辑如下

```js
function FiberRootNode(containerInfo) {
  // 整个应用的宿主环境信息（比如 DOM 中的 #root 节点）
  this.containerInfo = containerInfo; 
  
  // 核心：指向整个组件树的根 Fiber 节点（RootFiber）
  this.current = null; 
  
  // 其他全局调度信息，如未处理的任务优先级、过期时间等
  this.finishedWork = null;
}
```
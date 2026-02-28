# React Fiber架构

## 背景

JavaScript 引擎和页面渲染引擎两个线程时互斥的，当其中一个线程执行时，另一个线程只能挂起等待。

在这样的机制下，如果 JavaScript 线程长时间地占用了主线程，那么渲染层面的更新就不得不长时间地等待，界面长时间不更新，会导致页面响应度变差，用户可能会感觉到卡顿。

而这正是 React 15 的 Stack Reconciler 所面临的问题，即是 JavaScript 对主线程的超时占用问题。Stack Reconciler 是一个同步的递归过程，使用的是 JavaScript 引擎自身的函数调用栈，它会一直执行到栈空为止，所以当 React 在渲染组件时，从开始到渲染完成整个过程是一气呵成的。如果渲染的组件比较庞大，js 执行会占据主线程较长时间，会导致页面响应度变差。

而且所有的任务都是按照先后顺序，没有区分优先级，这样就会导致优先级比较高的任务无法被优先执行。

## Fiber 是什么

React Fiber 是 Facebook 花费两年余时间对 React 做出的一个重大改变与优化，是对 React 核心算法的一次重新实现。从Facebook在 React Conf 2017 会议上确认，React Fiber 在React 16 版本发布

在react中，主要做了以下的操作：

  - 为每个增加了优先级，优先级高的任务可以中断低优先级的任务。然后再重新，注意是重新执行优先级低的任务

  - 增加了异步任务，调用requestIdleCallback api，浏览器空闲的时候执行

  - dom diff树变成了链表，一个dom对应两个fiber（一个链表），对应两个队列，这都是为找到被中断的任务，重新执行

从架构角度来看，Fiber 是对 React 核心算法（即调和过程）的重写

从编码角度来看，Fiber 是 React 内部所定义的一种数据结构，它是 Fiber 树结构的节点单位，也就是 React 16 新架构下的虚拟DOM

一个 fiber 就是一个 JavaScript 对象，包含了元素的信息、该元素的更新操作队列、类型，其数据结构如下：

```js
type Fiber = {
  // 用于标记fiber的WorkTag类型，主要表示当前fiber代表的组件类型如FunctionComponent、ClassComponent等
  tag: WorkTag,
  // ReactElement里面的key
  key: null | string,
  // ReactElement.type，调用`createElement`的第一个参数
  elementType: any,
  // The resolved function/class/ associated with this fiber.
  // 表示当前代表的节点类型
  type: any,
  // 表示当前FiberNode对应的element组件实例
  stateNode: any,

  // 指向他在Fiber节点树中的`parent`，用来在处理完这个节点之后向上返回
  return: Fiber | null,
  // 指向自己的第一个子节点
  child: Fiber | null,
  // 指向自己的兄弟结构，兄弟节点的return指向同一个父节点
  sibling: Fiber | null,
  index: number,

  ref: null | (((handle: mixed) => void) & { _stringRef: ?string }) | RefObject,

  // 当前处理过程中的组件props对象
  pendingProps: any,
  // 上一次渲染完成之后的props
  memoizedProps: any,

  // 该Fiber对应的组件产生的Update会存放在这个队列里面
  updateQueue: UpdateQueue<any> | null,

  // 上一次渲染的时候的state
  memoizedState: any,

  // 一个列表，存放这个Fiber依赖的context
  firstContextDependency: ContextDependency<mixed> | null,

  mode: TypeOfMode,

  // Effect
  // 用来记录Side Effect
  effectTag: SideEffectTag,

  // 单链表用来快速查找下一个side effect
  nextEffect: Fiber | null,

  // 子树中第一个side effect
  firstEffect: Fiber | null,
  // 子树中最后一个side effect
  lastEffect: Fiber | null,

  // 代表任务在未来的哪个时间点应该被完成，之后版本改名为 lanes
  expirationTime: ExpirationTime,

  // 快速确定子树中是否有不在等待的变化
  childExpirationTime: ExpirationTime,

  // fiber的版本池，即记录fiber更新过程，便于恢复
  alternate: Fiber | null,
}
```

## 如何解决问题

Fiber把渲染更新过程拆分成多个子任务，每次只做一小部分，做完看是否还有剩余时间，如果有继续下一个任务；如果没有，挂起当前任务，将时间控制权交给主线程，等主线程不忙的时候在继续执行

即可以中断与恢复，恢复后也可以复用之前的中间状态，并给不同的任务赋予不同的优先级，其中每个任务更新单元为 React Element 对应的 Fiber 节点

Fiber 实现的方式是requestIdleCallback这一 API，但 React 团队 polyfill 了这个 API，使其对比原生的浏览器兼容性更好且拓展了特性。

> window.requestIdleCallback()方法将在浏览器的空闲时段内调用的函数排队。这使开发者能够在主事件循环上执行后台和低优先级工作，而不会影响延迟关键事件，如动画和输入响应。函数一般会按先进先调用的顺序执行，然而，如果回调函数指定了执行超时时间 timeout，则有可能为了在超时前执行函数而打乱执行顺序。

requestIdleCallback回调的执行的前提条件是当前浏览器处于空闲状态。

即requestIdleCallback的作用是在浏览器一帧的剩余空闲时间内执行优先度相对较低的任务。首先 React 中任务切割为多个步骤，分批完成。在完成一部分任务之后，将控制权交回给浏览器，让浏览器有时间再进行页面的渲染。等浏览器忙完之后有剩余时间，再继续之前 React 未完成的任务，是一种合作式调度。

简而言之，由浏览器给我们分配执行时间片，我们要按照约定在这个时间内执行完毕，并将控制权还给浏览器。

React 16 的Reconciler基于 Fiber 节点实现，被称为 Fiber Reconciler。

作为静态的数据结构来说，每个 Fiber 节点对应一个 React element，保存了该组件的类型（函数组件/类组件/原生组件等等）、对应的 DOM 节点等信息。

作为动态的工作单元来说，每个 Fiber 节点保存了本次更新中该组件改变的状态、要执行的工作。

每个 Fiber 节点有个对应的 React element，多个 Fiber 节点是如何连接形成树呢？靠如下三个属性：

```js
// 指向父级Fiber节点
this.return = null
// 指向子Fiber节点
this.child = null
// 指向右边第一个兄弟Fiber节点
this.sibling = null
```

## 架构核心

Fiber 架构可以分为三层：

- Scheduler 调度器 —— 调度任务的优先级，高优任务优先进入 Reconciler
- Reconciler 协调器 —— 负责找出变化的组件
- Renderer 渲染器 —— 负责将变化的组件渲染到页面上

相比 React15，React16 多了Scheduler（调度器），调度器的作用是调度更新的优先级。

在新的架构模式下，工作流如下：

- 每个更新任务都会被赋予一个优先级。

- 当更新任务抵达调度器时，高优先级的更新任务（记为 A）会更快地被调度进 Reconciler 层；

- 此时若有新的更新任务（记为 B）抵达调度器，调度器会检查它的优先级，若发现 B 的优先级高于当前任务 A，那么当前处于 Reconciler 层的 A 任务就会被中断，调度器会将 B 任务推入 Reconciler 层。

- 当 B 任务完成渲染后，新一轮的调度开始，之前被中断的 A 任务将会被重新推入 Reconciler 层，继续它的渲染之旅，即“可恢复”。

Fiber 架构的核心即是"可中断"、"可恢复"、"优先级"

### Scheduler 调度器

这个需要上面提到的requestIdleCallback，React 团队实现了功能更完备的 requestIdleCallback polyfill，这就是 Scheduler。除了在空闲时触发回调的功能外，Scheduler 还提供了多种调度优先级供任务设置。

### Reconciler 协调器

在 React 15 中是递归处理虚拟 DOM 的，React 16 则是变成了可以中断的循环过程，每次循环都会调用shouldYield判断当前是否有剩余时间。

```js
function workLoopConcurrent() {
  // Perform work until Scheduler asks us to yield
  while (workInProgress !== null && !shouldYield()) {
    // workInProgress表示当前工作进度的树。
    workInProgress = performUnitOfWork(workInProgress)
  }
}
```

React 16 是如何解决中断更新时 DOM 渲染不完全的问题呢？

在 React 16 中，Reconciler与Renderer不再是交替工作。当Scheduler将任务交给Reconciler后，Reconciler会为变化的虚拟 DOM 打上的标记。

```js
export const Placement = /*             */ 0b0000000000010
export const Update = /*                */ 0b0000000000100
export const PlacementAndUpdate = /*    */ 0b0000000000110
export const Deletion = /*              */ 0b0000000001000
```

- Placement表示插入操作
- PlacementAndUpdate表示替换操作
- Update表示更新操作
- Deletion表示删除操作

整个Scheduler与Reconciler的工作都在内存中进行，所以即使反复中断，用户也不会看见更新不完全的 DOM。只有当所有组件都完成Reconciler的工作，才会统一交给Renderer。

### Renderer 渲染器

Renderer根据Reconciler为虚拟 DOM 打的标记，同步执行对应的 DOM 操作。

## Fiber 更新过程

虚拟 DOM 更新过程分为 2 个阶段：

- render/reconciliation 协调阶段(可中断/异步)：通过 Diff 算法找出所有节点变更，例如节点新增、删除、属性变更等等, 获得需要更新的节点信息，对应早期版本的 Diff 过程。

- commit 提交阶段(不可中断/同步)：将需要更新的节点一次过批量更新，对应早期版本的 patch 过程。

## 总结

上文是作者根据网上的资料整理而成的，看起来文邹邹也不好记忆，于是我整理了一份简洁的，从设计动机、底层结构、运行循环、以及调度优先级这四个核心概念来总结 Fiber 架构。

### 设计动机

从“递归”到“链表”的数据结构

在 Fiber 之前，React 遍历 VDOM 使用的是递归。递归一旦开始，调用栈（Stack）就必须执行到底，无法中途跳出。

Fiber 把 VDOM 树转换成了线性链表结构。每个 Fiber 节点不仅保存了组件信息，还保存了三个关键指针：

- child: 指向第一个子节点。

- sibling: 指向右侧第一个兄弟节点。

- return: 指向父节点。

有了这三个指针，React 就可以通过 while 循环来遍历树。执行完一个任务后，如果主线程忙，React 可以直接记录下当前的 Fiber 节点，暂时退出循环，等空闲了再回来继续。

### 底层结构

双缓存机制

为了保证渲染的连续性，React 同时维护两棵 Fiber 树：

1. Current Tree (当前树)：对应当前屏幕上显示的 UI。

2. workInProgress Tree (工作树)：正在内存中构建的新树。

运行流程：

- 当更新触发时，React 会根据 current 树克隆出 workInProgress 树。

- 所有的 Diff 算法、副作用标记（Effect Tag）都在 workInProgress 树上完成。

- Commit 阶段：一旦工作树构建完成，React 只需将根节点的指针从 current 指向 workInProgress，瞬间完成 UI 切换

### 运行循环

这是 Fiber 能够实现“可中断”的关键点。React 将工作分成了性质截然不同的两个阶段：

1. Render 阶段 (可中断)

  - 目标：生成一棵带有副作用标记（如 Insertion, Update, Deletion）的 Fiber 树。

  - 过程：从根节点开始遍历，利用 shouldYield() 判断是否需要把控制权交还给浏览器。

  - 结果：产生一个“副作用清单”（Effect List）。

2. Commit 阶段 (不可中断)

  - 目标：把所有的变更真正应用到 DOM 上。

  - 过程：执行所有的 DOM 操作、调用 useEffect 或 componentDidMount 等。

  - 特点：为了保证 UI 的一致性，这个阶段必须同步执行，不能被打断。

### 调度优先级

如果说 Fiber 是底层的建筑，那么 Scheduler 就是总指挥。它负责判断现在该干哪件事。

React 为任务定义了不同的优先级 (Lane 模型)：

  1. Immediate: 离散交互（如点击、输入），最高优先级。

  2. User Blocking: 连续交互（如滚动、拖拽）。

  3. Normal: 网络请求、默认更新。

  4. Low/Idle: 预加载、日志记录。

**时间切片 (Time Slicing)：**

Scheduler 会利用浏览器的空闲时间（通常是 5ms 为一帧的切片）来执行 Render 阶段的任务。如果 5ms 用完了，React 会保存进度，把控制权还给浏览器去绘制 UI，下一帧再继续。
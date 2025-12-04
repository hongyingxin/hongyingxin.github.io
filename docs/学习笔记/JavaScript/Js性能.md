# Javascript性能

## requestAnimationFrame

## requestIdleCallback

window.requestIdleCallback(callback) 方法插入一个函数，这个函数将在浏览器空闲时期被调用。这使开发者能够在主事件循环上执行后台和低优先级工作，而不会影响延迟关键事件，如动画和输入响应。

> 备注：此 API 无法在 Web Worker 中使用。

### 示例

```javascript
requestIdleCallback(callback)
requestIdleCallback(callback, options)
```

**参数**
- callback：回调函数，将在浏览器空闲时期被调用。
- options：可选参数，包含以下属性：
  - timeout：回调函数执行的最长时间，单位为毫秒，默认值为0。

**返回值**
- 返回一个ID，可以在后续通过`cancelIdleCallback`方法取消回调函数的执行。

### 场景

- 1. 数据分析和统计
- 2. 预加载和预渲染
- 3. 日志处理和上报
- 4. 虚拟列表的离屏渲染（React Fiber）
- 5. 搜索索引构建
- 6. DOM清理和回收

## web worker

## requestIdleCallback 和 requestAnimationFrame 和 web worker 的区别

| 特性 | requestIdleCallback | requestAnimationFrame | Web Worker |
|------|-------------------|---------------------|------------|
| 执行时机 | 浏览器空闲时 | 每帧渲染前（~16.6ms） | 独立线程，随时 |
| 线程 | 主线程 | 主线程 | 后台线程 |
| 用途 | 低优先级任务 | 动画和视觉更新 | 重计算任务 |
| 阻塞渲染 | 可能（如果超时） | 会（必须快速完成） | 不会 |
| 访问 DOM | ✅ 可以 | ✅ 可以 | ❌ 不能 |
| 执行频率 | 不确定（看浏览器） | ~60fps | 持续运行 |
| 通信成本 | 无 | 无 | 高（postMessage） |

**requestIdleCallback**

```js
// 特点：在浏览器空闲时执行
requestIdleCallback((deadline) => {
  // deadline.timeRemaining() 告诉你还有多少空闲时间
  while (deadline.timeRemaining() > 0 && tasks.length) {
    doLowPriorityWork();
  }
}, { timeout: 1000 }); // 最多等待 1 秒
```

优点：

- 1. 不阻塞高优先级任务（用户交互、动画）
- 2. 可以访问DOM
- 3. 自动调度，无需手动控制

缺点：

- 1. 执行时机不确定，需要使用timeout参数来设置最大等待时间
- 2. 浏览器支持有限（Safari不支持）
- 3. 属于主线程，仍然存在卡顿风险

**requestAnimationFrame**

```js
// 特点：在浏览器重绘前执行
function animate() {
  // 更新动画状态
  updatePosition();
  renderFrame();
  
  requestAnimationFrame(animate); // 下一帧继续
}
requestAnimationFrame(animate);
```

优点：

- 1. 与浏览器刷新率同步（60fps）
- 2. 页面不可见时自动暂停
- 3. 最适合做动画

缺点：

- 1. 必须快速完成（16.6ms）
- 2. 不适合耗时任务
- 3. 频繁执行，不适合低频任务

**Web Worker**

```js
// 特点：独立线程，真正的并行计算
const worker = new Worker('worker.js');

// 主线程
worker.postMessage({ data: largeDataset });
worker.onmessage = (e) => {
  console.log('计算完成:', e.data);
};

// worker.js（独立线程）
onmessage = (e) => {
  const result = heavyComputation(e.data);
  postMessage(result); // 返回结果
};
```

优点：

- 1.真正的多线程，不阻塞主线程
- 2.适合重量级计算
- 3.不影响页面响应

缺点：

- 1.不能访问 DOM
- 2.通信有成本（序列化/反序列化）
- 3.需要单独的文件
- 4.调试相对困难

### 总结

requestIdleCallback：主线程空闲时做不紧急的事（分析、预加载）

requestAnimationFrame：每帧渲染前做视觉更新（动画、滚动）

Web Worker：独立线程做重计算（数据处理、加密、图像处理）

### 扩张：React Fiber

React Fiber 的时间切片（time slicing）是一种优化技术，用于将 React 组件的渲染过程分解为多个小任务，从而提高渲染性能。其概念来源于requestIdleCallback。

不过 React 没有直接使用 requestIdleCallback，而是自己实现了调度器（Scheduler）。因为浏览器的兼容性问题，requestIdleCallback 在 Safari 中不支持；React 需要更精确的优先级控制,requestAnimationFrame 的执行时机无法精确控制；另外 requestIdleCallback 的执行频率太低（最多 50ms 一次），无法满足 React 的渲染需求。

```js
// React Fiber 的核心思想（简化版）
function workLoop(deadline) {
  while (nextUnitOfWork && deadline.timeRemaining() > 1) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
  }
  
  if (nextUnitOfWork) {
    requestIdleCallback(workLoop); // 还有工作，下次继续
  }
}

requestIdleCallback(workLoop);
```
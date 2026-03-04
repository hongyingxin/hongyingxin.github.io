# React 19 新特性

React 19 是 React 框架的一次重大版本更新，其核心目标是减少开发者的“样板代码”（Boilerplate），并进一步优化**并发渲染与服务器端渲染（SSR）**的体验。

本文将这次的更新总结为以下四个核心维度

## React Compiler

这是 React 19 最受期待的特性。过去，为了避免不必要的重复渲染，开发者必须手动使用 useMemo、useCallback 和 React.memo。

- 变化： React 19 引入了 React Compiler。它是一个底层编译器，能够自动识别组件逻辑并进行记忆化处理（Memoization）。

- 影响： 开发者不再需要手动优化性能，React 会在编译阶段自动帮你完成。这意味着代码更简洁，且能获得极致的运行性能。

### 为什么需要自动化编译器

在 React 19 之前，React 的渲染机制是：父组件更新，子组件默认全部重新渲染（除非你手动优化）。

为了避免无意义的重绘，开发者不得不大量使用：

- useMemo：缓存复杂的计算结果。

- useCallback：缓存函数引用，防止子组件因 Prop 变化而重排。

- React.memo：跳过未发生 Prop 变化的组件渲染。

痛点： 这增加了巨大的心智负担。开发者经常忘记添加依赖项，或者为了保险起见在所有地方都加上这些 API，导致代码变得臃肿、难以维护（即所谓的“样板代码”）。

### 实现原理

React Compiler 是一个 构建时（Build-time） 编译器（类似于 Babel 插件）。它会解析你的代码并自动注入“记忆化”逻辑。

它的核心逻辑：

它不再依赖开发者手动标记，而是通过静态分析 JavaScript 的语义来判断：

1. 哪些值是稳定的？ 如果一个变量的计算依赖项没变，它就会被缓存。

2. 哪些组件是纯粹的？ 如果 Prop 没变，它就会自动跳过该组件的执行。

### 对比

React 18的代码

需要像这样子写代码，才能保证性能

```js
const MemoizedComponent = React.memo(({ items }) => {
  const sortedItems = useMemo(() => {
    return [...items].sort();
  }, [items]);

  const handleClick = useCallback(() => {
    console.log("Clicked!");
  }, []);

  return <div onClick={handleClick}>{/* 渲染列表 */}</div>;
});
```

React 19的代码
```js
// 没有任何 useMemo 或 useCallback
function MyComponent({ items }) {
  const sortedItems = [...items].sort();
  const handleClick = () => console.log("Clicked!");

  return <div onClick={handleClick}>{/* 渲染列表 */}</div>;
}
```

编译器在后台会自动将其转换为类似于前者的逻辑。 它甚至能比人类做得更细致，实现细粒度的“自动缓存”。

### 如何使用

#### 方式一

将 React 编译器安装为 devDependency：

```bash
pnpm install -D babel-plugin-react-compiler@latest
```

在 Vite 引入

如果你使用 Vite，可以将插件添加到 vite-plugin-react 中：

```js
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
  ],
});
```
#### 方式二

为 Vite 使用一个独立的 Babel 插件

```bash
npm install -D vite-plugin-babel
```

```js
// vite.config.js
import babel from 'vite-plugin-babel';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    babel({
      babelConfig: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
  ],
});
```

## React Actions

React Actions 是 React 19 的另一个重要特性。它是一个规范化的异步状态处理机制，让开发者可以更方便地处理异步状态。

以前处理表单提交时，我们需要手动维护 pending、error 等状态。

Actions： 现在你可以将异步函数直接传递给元素（如表单）。React 会自动处理异步生命周期。

相关Hook：

- useActionState： 自动处理 Action 的返回结果、错误信息和挂起状态（取代了复杂的 useState 组合）。

- useFormStatus： 让子组件能够直接感知父表单的提交状态（如按钮自动变灰，无需层层传参）。

- useOptimistic： 轻松实现“乐观更新”，即在请求成功前先给用户展示成功的 UI 效果，若失败则自动回滚。

## Server Components

虽然 RSC 在 Next.js 中已经应用了一段时间，但 React 19 正式将其纳入了稳定版规范。

- Server Components： 组件可以在服务器上预先运行，只将结果发送给客户端，从而显著减少客户端的 JS 包体积。

- Server Actions： 客户端可以直接调用服务器上的异步函数，实现前后端逻辑的无缝衔接。

## 易用性的改进

React 19 解决了很多困扰开发者多年的“小痛点”：

- ref 作为一个普通的 Prop： 你不再需要使用 forwardRef 这种繁琐的 API 了。现在可以直接像传 id 一样传递 ref 给函数组件。

- `<Context>` 替代 `<Context.Provider>`： 以后直接写 `<Theme.Provider>` 变成了简短的 `<Theme>`。

- Document Metadata 支持： 你可以直接在组件里写 `<title>`、`<meta>` 和 `<link>` 标签。React 会自动将它们提升（Hoisting）到页面的 `<head>` 部分，这对 SEO 非常友好。

- Resource Loading（资源加载）： React 19 会智能调度脚本和样式的加载顺序，支持 preinit 等 API，防止资源加载引起的闪烁。

## 新的API

use 是一个极其灵活的新 API。它最大的特点是可以在条件语句或循环中调用（打破了以往 Hooks 的限制）：

- 处理 Promise： 你可以在组件里直接 const data = use(promise)，React 会在 Promise 完成前自动展示 Suspense 的 fallback。

- 处理 Context： 它是 useContext 的替代方案，但可以在条件判断中使用。
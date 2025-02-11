# React 性能优化

## 优化方向
1. 减少重新 render 的次数(或者说减少不必要的渲染)
2. 减少计算的量

## 记忆化
记忆化(memoization)是一种优化技术，用于避免不必要的重新渲染，从而提高性能。记忆化的核心思想是缓存函数的结果，避免重复计算，尤其是在组件的渲染过程中。React提供了几种方式来实现记忆化，主要包括React.memo和useMemo。

- **memo**：用于记忆化函数组件的渲染结果，避免不必要的渲染

- **useMemo**：用于记忆化计算结果，只有在依赖性变化时才重新计算

- **useCallback**：用于记忆化函数，避免函数在每次渲染时重新创建

<font style="color:#F5222D;">默认情况下，当一个组件重新渲染时，React会递归地重新渲染它的所有子组件。</font>

<font style="color:#F5222D;">在JavaScript中，function(){}和()=>{}总是会生成不同的函数。这会导致props永远不会是相同的，memo对性能的优化永远不会生效，这就是useCallback起作用的地方。</font>

## React.memo
**`React.memo`** 为高阶组件，用于缓存函数组件的渲染结果。与`React.PureComponent`非常相似，<font style="color:#F5222D;">但只适用于函数组件，React.PureComponent适用于类组件。</font>

### 使用方法

```javascript
memo(Component, arePropsEqual?)
```

- **Component**：要进行记忆化的组件

- **arePropsEqual**：可选参数，一个函数，接受两个参数：组件的前一个props和新的props


如果函数组件在给定相同 props 的情况下渲染相同的结果，可以通过将其包装在 `React.memo` 中调用，以此通过记忆组件渲染结果的方式来提高组件的性能表现。

`React.memo` 仅检查 props 变更。如果函数组件被 `React.memo` 包裹，且其实现中拥有 `useState` 或 `useContext` 的 Hook，当 `context` 发生变化时，它仍会重新渲染。<font style="color:#DF2A3F;">因此需要在`memo`中同时使用`useMemo`和useCallback。</font>

当`memo`使用`state`更新记忆化组件或者使用`context`更新记忆化组件，它会重新渲染。

默认情况下只会对复杂对象做浅层对比，如果想控制对比过程，将自定义的比较函数通过第二个参数传入来实现。类似于shouldComponentUpdate()，不过需要注意的是，如果pros相等，areEqual会返回true；如果props不相等，则返回false。这与shouldComponentUpdate()方法的返回值相反，shouldComponentUpdate()返回值默认为true,如果props相等，则返回false，不进行渲染。

<font style="color:#DF2A3F;">使用场景：</font>子组件只做展示，纯组件。父组件重新渲染但props没有改变，此时子组件不做重新渲染。

### 在每个地方都应该添加memo吗？
如果传递给组件的props是一个对象或者普通函数，则memo是完全无用的。这就是为什么需要在memo中同时使用`useMemo`和`useCallback`。

**`useCallback`** 能缓存函数，配合 **`memo`**。

## useCallback()
**`useCallback`** 是一个允许在多次渲染中缓存函数的React Hook。

把函数以及依赖项作为参数传入 useCallback，它将返回该回调函数的 memoized 版本，这个 memoizedCallback 只有在依赖项有变化的时候才会更新。如果我们的 callback 传递了参数，当参数变化的时候需要让它重新添加一个缓存，可以将参数放在 useCallback 第二个参数的数组中，作为依赖的形式，使用方式跟 useEffect 类似。

在函数式组件里每次重新渲染，函数组件都会重新渲染，这会导致两次创建的函数肯定发生了改变，所以导致了子组件重新渲染。适合处理props传递改变了，但数值一样。

<font style="color:#F5222D;">使用场景：父组件传方法函数给子组件，因为函数组件每次重新渲染，函数也重新渲染，当其实props是没有改变，此时子组件不做重新渲染。</font>

## useMemo()
**`useMemo`** 是一个React Hook，用于记忆化计算结果。它会缓存计算的结果，只有在依赖项数组中的值发生变化时才会重新计算。

当有超大额的计算时，可以将计算出来的值缓存起来，每次调用函数直接返回缓存的值，这样实现一些性能优化。使用useMemo做计算结果缓存。<font style="color:#F5222D;">（与Vue里面的计算属性computed相似）</font>



### useCallback和useMemo有何关系

`useMemo`和`useCallback`经常一同出现，都是用来优化子组件。

- `useMemo`缓存函数调用的结果。

- `useCallback`缓存函数本身。

```javascript
function useCallback(fn, dependencies) {
  return useMemo(() => fn, dependencies)
}

// 因为函数声明function(){}和表达式声明()=>{}在重新渲染时都会产生一个不同的函数，
// 所以使用useMemo记忆函数，计算函数必须返回另一个函数。
// demo 1
export default function Page({ productId, referrer }) {
  const handleSubmit = useMemo(() => {
    return (orderDetails) => {
      post('/product/' + productId + '/buy', {
        referrer,
        orderDetails
      });
    };
  }, [productId, referrer]);

  return <Form onSubmit={handleSubmit} />;
}

// demo 2
export default function Page({ productId, referrer }) {
  const handleSubmit = useCallback((orderDetails) => {
    post('/product/' + productId + '/buy', {
      referrer,
      orderDetails
    });
  }, [productId, referrer]);

  return <Form onSubmit={handleSubmit} />;
}

// demo1 和 demo2 完全等价
```



## 一个组件重新渲染，一般三种情况：

1. 要么是组件自己的状态改变
2. 要么是父组件重新渲染，导致子组件重新渲染，但是父组件的 props 没有改版
3. 要么是父组件重新渲染，导致子组件重新渲染，但是父组件传递的 props 改变

## 不太重要的API
### React.PureComponent
**`React.PureComponent`** 定义React组件的基类，内部实现`shouldComponentUpdate()`，以浅层对比prop和state的方式来实现了改函数。在赋予React组件相同的props和state时，render()函数会渲染相同的内容，这种情况下使用`React.PureComponent`可提高性能。

**`React.PureComponent`** 中的`shouldComponentUpdate()`仅作对象的浅层对比，如果对象是复杂的嵌套结构，则有可能无法检查出差别。建议使用immutable对象或者forceUpdate()来确保组件能够被正确地更新。

**`React.PureComponent`** 中的`shouldComponentUpdate()`将跳过所有子组件的prop更新。

### shouldComponentUpdate()（简称SCU）
当props或state发生变化时调用，返回值默认为true。首次渲染或使用`forceUpdate()`时不会调用该方法。

通过对比props减少render次数。


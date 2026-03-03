---
hidden: true
---

# JSX 转换成真实DOM过程

## 是什么

react通过将组件编写的JSX映射到屏幕，以及组件中的状态发生了变化之后 React会将这些「变化」更新到屏幕上，JSX通过babel最终转化成React.createElement这种形式。

```js
<div>
  <img src="avatar.png" className="profile" />
  <Hello />
</div>
```
会被 babel 转换成：

```js
React.createElement(
  "div",
  null,
  React.createElement("img", {
    src: "avatar.png",
    className: "profile"
  }),
  React.createElement(Hello, null)
);
```
在转化过程中，babel在编译时会判断 JSX 中组件的首字母：

- 当首字母为小写时，其被认定为原生 DOM 标签，createElement 的第一个变量被编译为字符串

- 当首字母为大写时，其被认定为自定义组件，createElement 的第一个变量被编译为对象

最终都会通过RenderDOM.render(...)方法进行挂载，如下：

```js
ReactDOM.render(<App />,  document.getElementById("root"));
```

## 过程

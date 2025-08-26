## amfe-flexible

## amfe-flexible 原理

这是阿里巴巴团队开发的移动端自适应库，主要通过动态设置`rem`基准值来实现移动端适配。

**amfe-flexible的核心原理是：**

- 将屏幕宽度分成 10 等份，用 rem 作为基准单位
- 动态计算并设置 html 根元素的 font-size
- 通过监听事件实现响应式更新
- 处理高清屏和设备像素比问题

### 核心工作原理

```js
// adjust body font size
function setBodyFontSize () {
  if (document.body) {
    document.body.style.fontSize = (12 * dpr) + 'px'
  }
  else {
    document.addEventListener('DOMContentLoaded', setBodyFontSize)
  }
}
```

**设备像素比（DPR）处理：**

- 获取设备像素比`var dpr = window.devicePixelRatio || 1`

- 根据DPR动态调整body字体大小，确保在高清屏幕上文字清晰度

```js
// set 1rem = viewWidth / 10
function setRemUnit () {
  var rem = docEl.clientWidth / 10
  docEl.style.fontSize = rem + 'px'
}
```

**rem基准值设置：**

- 核心算法：将屏幕宽度除以10作为1rem的值
- 例如：iPhone6（375px），1rem = 37.5px
- 设计师按照750px设计稿时，可以直接除以100获得rem值

### 响应式更新机制

```js
// reset rem unit on page resize
window.addEventListener('resize', setRemUnit)
window.addEventListener('pageshow', function (e) {
  if (e.persisted) {
    setRemUnit()
  }
})
```

**动态监听：**

- 监听`resize`事件：屏幕旋转或窗口大小变化时重新计算

- 监听`pageshow`事件：处理页面缓存恢复的情况

### 高清屏适配

```js
// detect 0.5px supports
if (dpr >= 2) {
  var fakeBody = document.createElement('body')
  var testElement = document.createElement('div')
  testElement.style.border = '.5px solid transparent'
  fakeBody.appendChild(testElement)
  docEl.appendChild(fakeBody)
  if (testElement.offsetHeight === 1) {
    docEl.classList.add('hairlines')
  }
  docEl.removeChild(fakeBody)
}
```

**0.5px支持检测：**

- 通过创建一个隐藏的`div`元素，并设置`border: 0.5px solid transparent`，然后检查其`offsetHeight`是否为1px，来判断浏览器是否支持0.5px

- 如果支持，则将`hairlines`类添加到`html`元素上，用于后续的样式处理

## 实际使用

假设设计稿是750px宽度：

```css
/* 设计稿中一个元素宽度为 150px */
.element {
  width: 1.5rem; /* 150 ÷ 100 = 1.5rem */
}
```

在实际项目中，一般会搭配`postcss-pxtorem`插件来使用，将设计稿中的px转换为rem。

```js
// vite.config.js
export default defineConfig({
  css: {
    postcss: {
      plugins: [
        postCssPxToRem({
          rootValue: 37.5, // 1rem的大小
          propList: ['*'], // 需要转换的属性，这里选择全部都进行转换
          minPixelValue: 2,
        }),
      ],
    },
  },
})
```

**计算过程：**

- iPhone 6（375px）：1rem = 37.5px → 1.5rem = 56.25px
- iPhone 6 Plus（414px）：1rem = 41.4px → 1.5rem = 62.1px
- 元素会按比例缩放，保持视觉效果一致

**优势：**

- 简单易用：无需复杂计算，直接按比例转换
- 自动响应：屏幕变化时自动重新计算
- 高清适配：处理不同 DPR 设备的显示问题
- 兼容性好：支持大多数移动端浏览器

**劣势：**

- 依赖 JavaScript：页面加载时可能出现闪烁
- rem 计算复杂：开发时需要不断转换单位
- 字体适配问题：过度缩放可能导致可读性问题
- 维护成本：随着 CSS 发展，纯 CSS 方案更优

## 最新方案

使用`viewport`来设置视口宽度为设备宽度，然后使用`clamp`函数来设置元素的宽度。

```css
/* 设置合理的 viewport */
/* <meta name="viewport" content="width=device-width, initial-scale=1.0"> */

/* 使用相对单位组合 */
.container {
  max-width: 100vw;
  padding: clamp(1rem, 5vw, 2rem);
}

.text {
  font-size: clamp(0.875rem, 2.5vw, 1.125rem);
}
```

## 深入理解

实际编译后的代码如下，可以看到`html`元素的`font-size`被设置为`37.5px`，`body`元素的`font-size`被设置为`24px`。

也许有人会问，为什么要分别设置`html`元素和`body`元素的`font-size`？

`body`元素的`font-size`的作用：为没有明确设置 `font-size` 的元素提供默认值，确保普通文字在所有设备上都有合适的可读性，避免文字过度缩放。

设置 `font-size: 1rem` 的效果：绕过继承机制，直接基于 `html` 的 `font-size` 计算，实现文字的响应式缩放，1rem = 37.5px。

```html
<html lang="en" style="font-size: 37.5px;">
  <body style="font-size: 24px;" class="">
  </body>
</html>
```

### html 元素的 font-size

HTML元素的font-size作为rem的计算基准，用于响应式布局的尺寸计算。

```js
var docEl = document.documentElement
// set 1rem = viewWidth / 10
function setRemUnit () {
  var rem = docEl.clientWidth / 10
  docEl.style.fontSize = rem + 'px'
}

setRemUnit()
```

### body 元素的 font-size

Body元素的font-size用于设置基础字体大小，影响页面中所有元素的默认字体大小。

```js
document.body.style.fontSize = (12 * dpr) + 'px'
```

### 例子
```html
<html style="font-size: 37.5px;">
<body style="font-size: 24px;">
  <div class="container">
    <p class="text1">没有设置font-size的文字</p>
    <p class="text2">设置了font-size: 1rem的文字</p>
  </div>
</body>
</html>
```
```css
.text1 {
  /* 没有设置 font-size */
  /* 继承链：找不到 → 继承 body 的 24px */
  /* 实际显示：24px */
}

.text2 {
  font-size: 1rem;
  /* 明确设置了 rem 单位 */
  /* 计算：1 × html的font-size = 1 × 37.5px = 37.5px */
  /* 实际显示：37.5px */
}
```

## 知识点补充

###  CSS 单位

- px像素是绝对单位，表示固定的像素值，1px 就是屏幕上的一个物理像素点，不会随着屏幕大小变化
- em是相对单位，表示相对于父元素的font-size，如果父元素的font-size为16px，那么1em=16px，子元素的em会基于父元素的em计算
- rem是相对单位，表示相对于根元素的font-size，如果根元素的font-size为16px，那么1rem=16px
- vw/vh是相对单位，表示相对于视口的宽度和高度，1vw=1%的视口宽度，1vh=1%的视口高度

### CSS 继承

CSS 继承是指子元素会继承父元素的样式属性，如果子元素没有设置该属性，则会继承父元素的属性。

可继承的属性：

- color
- font-family
- font-size
- font-weight
- text-align

不可继承的属性：

- width
- height
- border
- margin
- padding

## 参考资料

[amfe-flexible 官方文档](https://github.com/amfe/lib-flexible)
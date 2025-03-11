---
tag:
 - 未完成
---

# 前端主题切换实现方案对比

## 1. CSS类名切换

实现原理：最简单直接的实现方式，通过切换根元素的类名来改变样式。

```css
/* 明亮主题 */
.theme-light {
  --bg-color: #ffffff;
  --text-color: #333333;
}

/* 暗黑主题 */
.theme-dark {
  --bg-color: #1f1f1f;
  --text-color: #ffffff;
}
```

实现思路：
- 预定义不同主题的样式类
- 通过 JavaScript 切换根元素的类名
- 子元素通过继承获得对应主题样式

代表网站：
- 知乎：通过切换 html 标签的 data-theme 属性来切换主题
- 掘金：通过切换 body 标签的主题类型来切换主题
- B站：使用类型切换配合 css 变量来切换主题

**以 掘金 为例**

通过切换 body 标签的主题类型实现切换

![掘金暗黑模式](../../public/assets/juejin.png)


```html
<!-- 掘金的主题切换实现 -->
<body class="theme-dark">
  <!-- 还会配合 CSS 变量使用 -->
  <style>
    .theme-dark {
      --juejin-bg: #151515;
    }
  </style>
</body>
```

优点：简单方便

缺点：需要预先定义好主题样式

## 2. CSS变量

实现原理：使用 CSS 变量定义主题相关的样式值，通过改变变量值实现主题切换。

```css
:root {
  --primary-color: #1890ff;
  --bg-color: #ffffff;
}

[data-theme='dark'] {
  --primary-color: #177ddc;
  --bg-color: #141414;
}

.button {
  background-color: var(--primary-color);
  color: var(--bg-color);
}
```

实现思路：
- 定义主题相关的 CSS 变量
- 不同主题下给变量设置不同的值
- 组件样式通过 var() 函数引用变量

代表网站：

 - Ant Design Pro：使用 css 变量实现主题定制
 - Element Plus：基于 css 变量的主题系统
 - GitHub: 使用 css 变量实现暗黑模式

优点：动态性强，可以随时修改变量值,继承性好，一处定义多处使用,支持运行时切换

缺点：IE11 不支持

## 3. 动态切换样式文件(不常用)

实现原理：准备多套主题 CSS 文件，通过切换 link 标签的 href 实现主题切换

```html
<link rel="stylesheet" href="theme-light.css" title="light" />
<link rel="stylesheet" href="theme-dark.css" title="dark" />
```

代表网站：
 - 早期的 WordPress 主题

优点：主题隔离清晰，便于单独维护，按需加载

缺点：需要额外的网络请求，切换时会有闪烁

## 4. Css in JS

实现原理：使用 JavaScript 动态生成和管理样式，实现主题的完全可编程控制。

```js
const theme = {
  light: {
    background: '#ffffff',
    text: '#000000'
  },
  dark: {
    background: '#000000',
    text: '#ffffff'
  }
};

const StyledComponent = styled.button`
  background: ${props => props.theme.background};
  color: ${props => props.theme.text};
`;
```

实现思路：
- 使用 JavaScript 对象定义主题配置
- 通过 ThemeProvider 注入主题
- 组件通过 props 获取主题值

代表网站：
 - styled-components 官网

优点：类型安全，支持 TypeScript,主题切换灵活，支持复杂逻辑,动态计算样式

缺点：运行时开销，首屏加载较慢

## 5. 预处理变量

实现原理：使用预处理器（如 Sass、Less）定义主题变量，运行时动态替换

```scss
$theme-colors: (
  'light': (
    'background': #ffffff,
    'text': #000000
  ),
  'dark': (
    'background': #000000,
    'text': #ffffff
  )
);
```

实现思路：
- 使用预处理器变量定义主题
- 通过 mixin 生成不同主题的样式
- 编译时生成完整的主题样式表

代表网站：
 - Bootstrap：使用 Sass 变量
 - 早期的Ant Design：使用预处理器变量 Less 实现主题定制

优点：编译时确定，性能好

缺点：不支持动态切换，需要预编译

## 6. 混合

实现原理：结合 CSS 变量和类型切换，配合预处理器使用

```scss
// 1. 使用 CSS 变量作为基础
:root {
  --primary: #1890ff;
}

// 2. 预处理器处理静态样式
@mixin theme-color($color) {
  --primary: $color;
}

// 3. JavaScript 控制主题逻辑
const setTheme = (color) => {
  document.documentElement.style.setProperty('--primary', color);
};
```

实现思路：
- CSS 变量处理动态样式
- 预处理器处理静态样式
- JavaScript 控制主题逻辑
- LocalStorage 持久化主题设置

代表网站：
 - 新版 Ant Design：使用 CSS 变量和 Less 混合实现主题定制
 - Vue 和 React 官网：CSS 变量 + ；类名切换

优点：结合了多种方案优点，兼顾性能和灵活性

缺点：实现相对复杂，需要统一规范








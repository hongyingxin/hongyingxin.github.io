# CSS 方案

## CSS Modules

**概述:** CSS Modules 是一种将 CSS 文件模块化的方式。每个 CSS 文件都被视为一个模块，类名会被自动生成唯一的标识符，避免全局命名冲突。

**使用场景:** 适合中小型项目，或需要与现有 CSS 代码库集成的项目。

**优点:**
- 局部作用域: 避免了全局样式冲突。
- 简单易用: 使用常规 CSS 语法，易于上手。

**缺点:**
- 构建配置: 需要配置构建工具（如 Webpack）来支持 CSS Modules。
- 调试困难: 生成的类名不易于调试。

### 示例

```css
/* styles.module.scss */
.draw {
  background-color: blue;
  color: white;
}
```

```js
// Component.jsx
import React from 'react';
import styles from './styles.module.scss';

const Component = () => {
  return <div className={styles.draw}>Hello, CSS Modules!</div>;
};

export default Component;
```

---

## Styled Components

**概述:** Styled Components 是一种 CSS-in-JS 解决方案，允许你在 JavaScript 文件中定义样式。它使用标签模板字面量来创建样式化的组件。

**使用场景:** 适合需要动态样式或组件化样式的项目。

**优点:**
- 动态样式: 可以根据组件的 props 动态生成样式。
- 组件化: 样式与组件紧密结合，易于维护。

**缺点:**
- 运行时开销: 可能会增加应用的运行时开销。
- 学习曲线: 对于不熟悉 CSS-in-JS 的开发者，可能需要时间适应。

### 示例

```js
// Component.jsx
import React from 'react';
import styled from 'styled-components';

const StyledDiv = styled.div`
  background-color: ${(props) => (props.primary ? 'blue' : 'gray')};
  color: white;
  padding: 10px;
`;

const Component = () => {
  return <StyledDiv primary>Hello, Styled Components!</StyledDiv>;
};

export default Component;
```

---

## Emotion

**概述:** Emotion 是另一个流行的 CSS-in-JS 库，提供了更灵活的 API 和更高的性能。

**使用场景:** 适合需要高性能和灵活性的项目。

**优点:**
- 灵活性: 提供了多种使用方式（如 styled 和 css 函数）。
- 高性能: 经过优化，性能优于某些其他 CSS-in-JS 解决方案。

**缺点:**
- 学习曲线: 需要时间来熟悉其 API 和用法。

### 示例

```js
// Component.jsx
/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import React from 'react';

const style = (primary) => css`
  background-color: ${primary ? 'blue' : 'gray'};
  color: white;
  padding: 10px;
`;

const Component = ({ primary }) => {
  return <div css={style(primary)}>Hello, Emotion!</div>;
};

export default Component;
```

---

## Sass/Scss/Less

**概述:** Sass/Scss/Less 是一种 CSS 预处理器，提供了变量、嵌套、混合等功能，增强了 CSS 的功能性。

**使用场景:** 适合大型项目或需要复杂样式的项目。

**优点:**
- 强大的功能: 支持变量、嵌套、条件语句等，增强了 CSS 的可维护性。
- 社区支持: 有广泛的社区支持和丰富的文档。

**缺点:**
- 构建步骤: 需要额外的构建步骤来编译 Sass 文件。
- 学习曲线: 对于初学者，可能需要时间来掌握其语法。

### 示例

```scss
/* styles.scss */
$primary-color: blue;

.draw {
  background-color: $primary-color;
  color: white;

  .inner {
    padding: 10px;
  }
}
```

```js
// Component.jsx
import React from 'react';
import './styles.scss';

const Component = () => {
  return (
    <div className="draw">
      <div className="inner">Hello, Sass!</div>
    </div>
  );
};

export default Component;
```

---

## Tailwind CSS

**概述:** Tailwind CSS 是一种实用的 CSS 框架，提供了大量的类来快速构建 UI，而不是编写自定义 CSS。

**使用场景:** 适合快速开发和原型设计的项目。

**优点:**
- 快速开发: 通过组合类快速构建 UI，减少了样式文件的数量。
- 一致性: 促进了设计的一致性和可重用性。

**缺点:**
- 类名过多: 可能导致 HTML 中类名过多，影响可读性。
- 学习曲线: 需要时间来熟悉其类名和用法。

### 示例

```js
// Component.jsx
import React from 'react';

const Component = () => {
  return (
    <div className="bg-blue-500 text-white p-4">
      Hello, Tailwind CSS!
    </div>
  );
};

export default Component;
```

---

## 原生 CSS

**概述:** 使用标准的 CSS 文件来定义样式，适合简单的项目。

**使用场景:** 适合小型项目或简单的静态页面。

**优点:**
- 简单直接: 易于理解和使用，不需要额外的库或工具。
- 无依赖: 不依赖于任何外部库，减少了项目的复杂性。

**缺点:**
- 样式管理: 随着项目的增长，样式管理可能变得困难。
- 全局命名冲突: 可能会遇到样式冲突的问题。

### 示例

```css
/* styles.css */
.draw {
  background-color: blue;
  color: white;
  padding: 10px;
}
```

```js
// Component.jsx
import React from 'react';
import './styles.css';

const Component = () => {
  return <div className="draw">Hello, Native CSS!</div>;
};

export default Component;
```

---

## 总结

个人倾向于Sass，因为活动页面需要大量的CSS样式，而Tailwind需要大量自定义配置。Sass目前主要有个问题，就是样式隔离。vue中因为有scoped，所以可以很好的隔离样式，但是react中没有，所以需要手动去隔离。目前我采用BEM的命名方式，并且结合了嵌套选择器，来隔离样式。

- **小型项目:** 可以考虑使用 CSS Modules 或原生 CSS。
- **中型项目:** Styled Components 或 Emotion 是不错的选择。
- **大型项目:** Sass/SCSS 或 Tailwind CSS 可以提供更好的可维护性和一致性。
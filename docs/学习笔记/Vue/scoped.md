# Vue的scoped原理

## Vue中的scoped

scoped是一种基于属性选择器的样式隔离方案，它并不是传统意义上的CSS模块化方案。它通过为组件生成唯一的属性选择器来实现样式的隔离，提高了样式的可维护性和组件的独立性。

### scoped的工作原理

当在 `<style>` 标签上使用 `scoped` 属性时，Vue 会为当前组件的每个元素添加一个唯一的 `data-v-xxxxxx` 属性，并将样式规则中的选择器修改为包含该属性的形式。

#### 编译阶段：

在编译 `.vue` 文件时，Vue 的编译器会处理 `<style>` 标签，具体步骤如下：

1. **解析样式**：使用 `postcss` 解析样式，生成 AST（抽象语法树）。
2. **添加属性选择器**：遍历 AST，为每个选择器添加 `[data-v-xxxxxx]` 属性选择器。
3. **生成唯一属性**：`xxxxxx` 是一个基于组件文件路径和内容的哈希值，确保唯一性。

#### 运行时：

在运行时，Vue 会为组件的根元素和所有子元素添加 `data-v-xxxxxx` 属性。

### scoped的优点

1. **样式隔离**：scoped可以有效地防止组件间的样式冲突，确保每个组件的样式都是独立的。
2. **提高可维护性**：由于样式被限制在组件内部，因此当需要修改或调试样式时，可以更容易地定位到相关的组件和样式。

### scoped的局限性

1. **性能影响**：虽然scoped样式带来了很多好处，但由于需要为每个组件生成唯一的属性选择器和修改样式选择器，因此可能会对性能产生一定的影响。然而，在大多数情况下，这种影响是可以接受的。
2. **无法使用全局样式库**：如果需要使用全局样式库（如Bootstrap），则需要在全局样式文件中引入，而不能在scoped样式中使用。这是因为scoped样式被限制在组件内部，无法应用到全局元素上。
3. **深度选择器**：在某些情况下，你可能需要为scoped样式添加一个全局样式或修改子组件的样式。这时可以使用深度选择器（如Vue 3中的`::v-deep`或Vue 2中的`/deep/`、`>>>`）来"穿透"scoped限制。但需要注意的是，过度使用深度选择器可能会破坏样式的隔离性。

### 源码解析

以下是 Vue 源码中与 `scoped` 样式相关的关键部分：

#### 1. `src/compiler/style-processor.js`

该文件负责处理 `<style>` 标签，主要逻辑如下：

```javascript
export function addScopedIdToSelector(id, selector) {
    return selector.replace(/^(\w+)/, $1[data-v-${id}])
}
```

这个函数为选择器添加 `data-v-xxxxxx` 属性。

#### 2. `src/compiler/modules/style.js`

该模块在编译模板时处理样式，主要逻辑如下：

```javascript
function addScopedAttr(el, id) {
    el.attrsMap['data-v-' + id] = ''
    el.attrsList.push({ name: 'data-v-' + id, value: '' })
}
```

这个函数为元素添加 `data-v-xxxxxx` 属性。

#### 3. `src/platforms/web/runtime/modules/attrs.js`

该模块在运行时处理元素属性，主要逻辑如下：

```javascript
function updateAttrs(oldVnode, vnode) {
    const el = vnode.elm
    const oldAttrs = oldVnode.data.attrs || {}
    const attrs = vnode.data.attrs || {}
    for (let key in attrs) {
        if (attrs[key] !== oldAttrs[key]) {
            el.setAttribute(key, attrs[key])
        }
    }
}
```

这个函数在更新元素属性时，确保 `data-v-xxxxxx` 属性被正确应用。

### 示例

假设有以下组件：

```html
<template>
    <div class="example">Hello World</div>
</template>
<style scoped>
    .example {
        color: red;
    }
</style>
```

编译后生成的样式和模板如下：

```html
<div class="example" data-v-f3f3eg9>Hello World</div>
<style>
    .example[data-v-f3f3eg9] {
        color: red;
    }
</style>
```

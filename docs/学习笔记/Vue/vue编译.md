# Vue编译优化详解

## 1. 静态提升（Static Hoisting）

### 1.1 什么是静态提升？

静态提升是Vue编译器的一个重要优化策略。它会在编译时识别出模板中的静态内容（不会改变的部分），并将这些静态内容的创建代码提升到渲染函数之外，这样在组件重新渲染时就不需要重复创建这些静态节点。

### 1.2 工作原理

让我们通过一个简单的例子来理解：

```vue
<template>
  <div>
    <h1>静态标题</h1>
    <p>{{ message }}</p>
    <span class="static-class">静态内容</span>
  </div>
</template>
```

#### 未开启静态提升时的编译结果：

```javascript
function render() {
  return createVNode('div', null, [
    createVNode('h1', null, '静态标题'), // 每次渲染都会创建
    createVNode('p', null, message.value),
    createVNode('span', { class: 'static-class' }, '静态内容'), // 每次渲染都会创建
  ])
}
```

#### 开启静态提升后的编译结果：

```javascript
// 静态节点被提升到渲染函数外部
const _hoisted_1 = createVNode('h1', null, '静态标题')
const _hoisted_2 = { class: 'static-class' }
const _hoisted_3 = createVNode('span', _hoisted_2, '静态内容')

function render() {
  return createVNode('div', null, [
    _hoisted_1, // 直接使用缓存的节点
    createVNode('p', null, message.value),
    _hoisted_3, // 直接使用缓存的节点
  ])
}
```

### 1.3 源码实现分析

静态提升的核心实现在 `packages/compiler-core/src/transforms/cacheStatic.ts` 文件中。

#### 1.3.1 常量类型级别

Vue定义了4个常量类型级别（ConstantTypes），用于判断节点的静态程度：

```typescript
export enum ConstantTypes {
  NOT_CONSTANT = 0, // 非常量，包含动态内容
  CAN_SKIP_PATCH, // 可以跳过patch，但不能提升
  CAN_CACHE, // 可以被缓存
  CAN_STRINGIFY, // 可以被字符串化（最高级别的静态）
}
```

#### 1.3.2 主要执行流程

1. **入口函数 `transform`**：

```typescript
export function transform(root: RootNode, options: TransformOptions): void {
  const context = createTransformContext(root, options)
  traverseNode(root, context)
  if (options.hoistStatic) {
    // 如果开启了静态提升
    cacheStatic(root, context)
  }
  // ...
}
```

2. **`cacheStatic` 函数**：

```typescript
export function cacheStatic(root: RootNode, context: TransformContext): void {
  walk(
    root,
    undefined,
    context,
    !!getSingleElementRoot(root), // 根节点不能被提升
  )
}
```

3. **`walk` 函数遍历AST**：

```typescript
function walk(
  node: ParentNode,
  parent: ParentNode | undefined,
  context: TransformContext,
  doNotHoistNode: boolean = false,
  inFor = false,
) {
  const { children } = node
  const toCache: (PlainElementNode | TextCallNode)[] = []

  for (let i = 0; i < children.length; i++) {
    const child = children[i]

    // 只有纯元素和文本调用才能被缓存
    if (
      child.type === NodeTypes.ELEMENT &&
      child.tagType === ElementTypes.ELEMENT
    ) {
      const constantType = doNotHoistNode
        ? ConstantTypes.NOT_CONSTANT
        : getConstantType(child, context)

      if (constantType > ConstantTypes.NOT_CONSTANT) {
        if (constantType >= ConstantTypes.CAN_CACHE) {
          // 标记为CACHED，并加入待缓存列表
          ;(child.codegenNode as VNodeCall).patchFlag = PatchFlags.CACHED
          toCache.push(child)
          continue
        }
      } else {
        // 节点可能包含动态子节点，但其props可能可以被提升
        const codegenNode = child.codegenNode!
        if (codegenNode.type === NodeTypes.VNODE_CALL) {
          const props = getNodeProps(child)
          if (props) {
            codegenNode.props = context.hoist(props)
          }
        }
      }
    }
    // 递归处理子节点...
  }

  // 处理收集到的待缓存节点
  for (const child of toCache) {
    child.codegenNode = context.cache(child.codegenNode!)
  }
}
```

#### 1.3.3 判断节点是否可提升

`getConstantType` 函数负责判断节点的常量类型：

```typescript
export function getConstantType(
  node: TemplateChildNode | SimpleExpressionNode | CacheExpression,
  context: TransformContext,
): ConstantTypes {
  const { constantCache } = context

  switch (node.type) {
    case NodeTypes.ELEMENT:
      // 检查是否是普通元素
      if (node.tagType !== ElementTypes.ELEMENT) {
        return ConstantTypes.NOT_CONSTANT
      }

      // 检查缓存
      const cached = constantCache.get(node)
      if (cached !== undefined) {
        return cached
      }

      // 检查三个方面：
      // 1. props是否包含动态内容
      const generatedPropsType = getGeneratedPropsConstantType(node, context)
      if (generatedPropsType === ConstantTypes.NOT_CONSTANT) {
        return ConstantTypes.NOT_CONSTANT
      }

      // 2. 子节点是否都是静态的
      for (let i = 0; i < node.children.length; i++) {
        const childType = getConstantType(node.children[i], context)
        if (childType === ConstantTypes.NOT_CONSTANT) {
          return ConstantTypes.NOT_CONSTANT
        }
      }

      // 3. 是否有动态绑定
      for (let i = 0; i < node.props.length; i++) {
        const p = node.props[i]
        if (p.type === NodeTypes.DIRECTIVE && p.name === 'bind' && p.exp) {
          const expType = getConstantType(p.exp, context)
          if (expType === ConstantTypes.NOT_CONSTANT) {
            return ConstantTypes.NOT_CONSTANT
          }
        }
      }

      // 缓存结果并返回
      constantCache.set(node, returnType)
      return returnType

    case NodeTypes.TEXT:
    case NodeTypes.COMMENT:
      return ConstantTypes.CAN_STRINGIFY // 纯文本和注释是完全静态的

    case NodeTypes.IF:
    case NodeTypes.FOR:
      return ConstantTypes.NOT_CONSTANT // 条件和循环是动态的

    // ... 其他类型
  }
}
```

### 1.4 静态提升的限制

并不是所有看起来静态的内容都会被提升，以下情况不会被提升：

1. **根节点的直接子节点** - 可能会接收父组件的 fallthrough attributes
2. **v-for 内部的节点** - 虽然结构静态，但会多次创建
3. **包含自定义指令的节点** - 自定义指令可能有副作用
4. **包含动态绑定的节点** - 即使绑定的值是常量
5. **组件节点** - 组件的内部状态是动态的

### 1.5 静态提升的好处

1. **减少内存分配** - 静态节点只创建一次，减少GC压力
2. **提升渲染性能** - 跳过静态节点的创建过程
3. **减少diff开销** - 静态节点标记为CACHED，diff时可以快速跳过

### 1.6 实际编译示例

让我们看一个更复杂的例子：

```vue
<template>
  <div class="container">
    <header>
      <h1>网站标题</h1>
      <nav>
        <a href="/home">首页</a>
        <a href="/about">关于</a>
      </nav>
    </header>
    <main>
      <h2>{{ pageTitle }}</h2>
      <p>当前用户：{{ username }}</p>
      <div class="static-footer">
        <p>版权所有 © 2023</p>
      </div>
    </main>
  </div>
</template>
```

编译后的代码（简化版）：

```javascript
// 提升的静态节点
const _hoisted_1 = { class: 'container' }
const _hoisted_2 = /*#__PURE__*/ createElementVNode('header', null, [
  /*#__PURE__*/ createElementVNode('h1', null, '网站标题'),
  /*#__PURE__*/ createElementVNode('nav', null, [
    /*#__PURE__*/ createElementVNode('a', { href: '/home' }, '首页'),
    /*#__PURE__*/ createElementVNode('a', { href: '/about' }, '关于'),
  ]),
])
const _hoisted_3 = { class: 'static-footer' }
const _hoisted_4 = /*#__PURE__*/ createElementVNode(
  'p',
  null,
  '版权所有 © 2023',
  -1 /* CACHED */,
)

function render(_ctx, _cache) {
  return createElementVNode('div', _hoisted_1, [
    _hoisted_2, // 整个header被提升
    createElementVNode('main', null, [
      createElementVNode(
        'h2',
        null,
        toDisplayString(_ctx.pageTitle),
        1 /* TEXT */,
      ),
      createElementVNode(
        'p',
        null,
        '当前用户：' + toDisplayString(_ctx.username),
        1 /* TEXT */,
      ),
      createElementVNode('div', _hoisted_3, [_hoisted_4]),
    ]),
  ])
}
```

注意 `/*#__PURE__*/` 注释，这是告诉打包工具这些函数调用是纯函数，有助于 tree-shaking。

### 1.7 如何控制静态提升

在生产环节下默认开启以提升性能，在开发环境默认关闭以提升开发体验。我们也可以根据需要在构建工具中配置

```js
// vite.config.js
export default {
  plugins: [
    vue({
      template: {
        compilerOptions: {
          hoistStatic: false, // 关闭静态提升
        },
      },
    }),
  ],
}
```

## 2. 补丁标记（Patch Flags）

### 2.1 什么是补丁标记？

补丁标记（Patch Flags）是Vue 3编译器的另一个重要优化。编译器会在编译时分析每个动态节点，标记出它们的动态部分类型。在运行时的diff过程中，Vue可以根据这些标记进行有针对性的更新，而不需要检查整个节点的所有属性。

### 2.2 工作原理

让我们通过例子来理解：

```vue
<template>
  <div>
    <p :class="dynamicClass">{{ message }}</p>
    <span :id="dynamicId" :title="dynamicTitle">静态文本</span>
    <input :value="inputValue" @input="onInput" />
  </div>
</template>
```

编译后会生成带有补丁标记的代码：

```javascript
function render() {
  return createVNode('div', null, [
    createVNode(
      'p',
      {
        class: dynamicClass.value,
      },
      toDisplayString(message.value),
      3 /* TEXT, CLASS */,
    ),

    createVNode(
      'span',
      {
        id: dynamicId.value,
        title: dynamicTitle.value,
      },
      '静态文本',
      8 /* PROPS */,
      ['id', 'title'],
    ),

    createVNode(
      'input',
      {
        value: inputValue.value,
        onInput: onInput,
      },
      null,
      8 /* PROPS */,
      ['value'],
    ),
  ])
}
```

注意每个动态节点后面的数字注释，这些就是补丁标记。

### 2.3 补丁标记类型

Vue定义了多种补丁标记，每种标记代表不同类型的动态内容：

```typescript
export enum PatchFlags {
  TEXT = 1, // 动态文本内容
  CLASS = 1 << 1, // 动态class绑定（值为2）
  STYLE = 1 << 2, // 动态style绑定（值为4）
  PROPS = 1 << 3, // 动态属性（值为8）
  FULL_PROPS = 1 << 4, // 有动态key的属性（值为16）
  NEED_HYDRATION = 1 << 5, // 需要hydration的属性（值为32）
  STABLE_FRAGMENT = 1 << 6, // 子节点顺序不变的fragment（值为64）
  KEYED_FRAGMENT = 1 << 7, // 有key的fragment（值为128）
  UNKEYED_FRAGMENT = 1 << 8, // 无key的fragment（值为256）
  NEED_PATCH = 1 << 9, // 需要patch的非props属性（值为512）
  DYNAMIC_SLOTS = 1 << 10, // 动态插槽（值为1024）

  // 特殊标记
  CACHED = -1, // 静态节点，可以跳过整个子树
  BAIL = -2, // 退出优化模式
}
```

补丁标记使用位运算，可以组合多个标记。例如 `3` 表示 `TEXT | CLASS`。

### 2.4 源码实现分析

#### 2.4.1 编译时分析

在 `packages/compiler-core/src/transforms/transformElement.ts` 中，编译器会分析元素的动态部分：

```typescript
function buildProps(
  node: ElementNode,
  context: TransformContext,
  // ...
) {
  // patchFlag analysis
  let patchFlag = 0
  let hasRef = false
  let hasClassBinding = false
  let hasStyleBinding = false
  let hasHydrationEventBinding = false
  let hasDynamicKeys = false
  let hasVnodeHook = false
  const dynamicPropNames: string[] = []

  const analyzePatchFlag = ({ key, value }: Property) => {
    if (isStaticExp(key)) {
      const name = key.content
      const isEventHandler = isOn(name)

      // 检查是否需要hydration
      if (
        isEventHandler &&
        (!isComponent || isDynamicComponent) &&
        name.toLowerCase() !== 'onclick' &&
        name !== 'onUpdate:modelValue' &&
        !isReservedProp(name)
      ) {
        hasHydrationEventBinding = true
      }

      // 跳过缓存的处理器或常量值
      if (
        value.type === NodeTypes.JS_CACHE_EXPRESSION ||
        ((value.type === NodeTypes.SIMPLE_EXPRESSION ||
          value.type === NodeTypes.COMPOUND_EXPRESSION) &&
          getConstantType(value, context) > 0)
      ) {
        return
      }

      // 分析不同类型的动态绑定
      if (name === 'ref') {
        hasRef = true
      } else if (name === 'class') {
        hasClassBinding = true
      } else if (name === 'style') {
        hasStyleBinding = true
      } else if (name !== 'key' && !dynamicPropNames.includes(name)) {
        dynamicPropNames.push(name)
      }
    } else {
      hasDynamicKeys = true
    }
  }

  // 遍历所有props进行分析
  for (let i = 0; i < props.length; i++) {
    const prop = props[i]
    if (prop.type === NodeTypes.ATTRIBUTE) {
      // 静态属性处理...
    } else {
      // 指令处理，包括v-bind、v-on等
      const { name, arg, exp, loc, modifiers } = prop
      // 分析并设置标记...
    }
  }

  // 设置最终的patchFlag
  if (hasDynamicKeys) {
    patchFlag |= PatchFlags.FULL_PROPS
  } else {
    if (hasClassBinding && !isComponent) {
      patchFlag |= PatchFlags.CLASS
    }
    if (hasStyleBinding && !isComponent) {
      patchFlag |= PatchFlags.STYLE
    }
    if (dynamicPropNames.length) {
      patchFlag |= PatchFlags.PROPS
    }
    if (hasHydrationEventBinding) {
      patchFlag |= PatchFlags.NEED_HYDRATION
    }
  }

  if (
    !shouldUseBlock &&
    (patchFlag === 0 || patchFlag === PatchFlags.NEED_HYDRATION) &&
    (hasRef || hasVnodeHook || runtimeDirectives.length > 0)
  ) {
    patchFlag |= PatchFlags.NEED_PATCH
  }

  return {
    props: propsExpression,
    directives: runtimeDirectives,
    patchFlag,
    dynamicPropNames,
    shouldUseBlock,
  }
}
```

#### 2.4.2 运行时优化

在 `packages/runtime-core/src/renderer.ts` 中，patchElement函数使用补丁标记进行优化的diff：

```typescript
const patchElement = (
  n1: VNode,
  n2: VNode,
  // ...
) => {
  const el = (n2.el = n1.el!)
  let { patchFlag, dynamicChildren, dirs } = n2
  patchFlag |= n1.patchFlag & PatchFlags.FULL_PROPS

  const oldProps = n1.props || EMPTY_OBJ
  const newProps = n2.props || EMPTY_OBJ

  // 根据patchFlag进行针对性更新
  if (patchFlag > 0) {
    if (patchFlag & PatchFlags.FULL_PROPS) {
      // 包含动态key，需要完整diff
      patchProps(el, oldProps, newProps, parentComponent, namespace)
    } else {
      // class
      if (patchFlag & PatchFlags.CLASS) {
        if (oldProps.class !== newProps.class) {
          hostPatchProp(el, 'class', null, newProps.class, namespace)
        }
      }

      // style
      if (patchFlag & PatchFlags.STYLE) {
        hostPatchProp(el, 'style', oldProps.style, newProps.style, namespace)
      }

      // props
      if (patchFlag & PatchFlags.PROPS) {
        // 只更新动态的props
        const propsToUpdate = n2.dynamicProps!
        for (let i = 0; i < propsToUpdate.length; i++) {
          const key = propsToUpdate[i]
          const prev = oldProps[key]
          const next = newProps[key]
          if (next !== prev || key === 'value') {
            hostPatchProp(el, key, prev, next, namespace, parentComponent)
          }
        }
      }
    }

    // text
    if (patchFlag & PatchFlags.TEXT) {
      if (n1.children !== n2.children) {
        hostSetElementText(el, n2.children as string)
      }
    }
  } else if (!optimized && dynamicChildren == null) {
    // 未优化的完整diff
    patchProps(el, oldProps, newProps, parentComponent, namespace)
  }
}
```

### 2.5 补丁标记的优势

1. **精确更新** - 只更新真正变化的部分，避免不必要的DOM操作
2. **跳过静态内容** - 静态属性在编译时已确定，运行时直接跳过
3. **优化数组遍历** - 通过dynamicProps数组，只遍历动态属性
4. **减少比较次数** - 根据标记类型，只比较特定的属性

### 2.6 实际优化效果示例

考虑一个复杂的组件：

```vue
<template>
  <div class="static-class" :id="dynamicId">
    <h1 :style="titleStyle">{{ title }}</h1>
    <p class="info" :class="{ active: isActive }">
      用户名：<span>{{ username }}</span>
    </p>
    <button @click="handleClick" :disabled="isDisabled">
      点击次数：{{ count }}
    </button>
    <ul>
      <li v-for="item in list" :key="item.id" class="item">
        {{ item.name }}
      </li>
    </ul>
  </div>
</template>
```

编译后的渲染函数会包含详细的补丁标记：

```javascript
function render(_ctx, _cache) {
  return createElementBlock(
    'div',
    {
      class: 'static-class',
      id: _ctx.dynamicId,
    },
    [
      createElementVNode(
        'h1',
        {
          style: _ctx.titleStyle,
        },
        toDisplayString(_ctx.title),
        5 /* TEXT, STYLE */,
      ),

      createElementVNode(
        'p',
        {
          class: normalizeClass(['info', { active: _ctx.isActive }]),
        },
        [
          createTextVNode('用户名：'),
          createElementVNode(
            'span',
            null,
            toDisplayString(_ctx.username),
            1 /* TEXT */,
          ),
        ],
        2 /* CLASS */,
      ),

      createElementVNode(
        'button',
        {
          onClick: _ctx.handleClick,
          disabled: _ctx.isDisabled,
        },
        [
          createTextVNode('点击次数：'),
          createTextVNode(toDisplayString(_ctx.count), 1 /* TEXT */),
        ],
        8 /* PROPS */,
        ['disabled'],
      ),

      createElementVNode('ul', null, [
        (openBlock(true),
        createElementBlock(
          Fragment,
          null,
          renderList(_ctx.list, item => {
            return (
              openBlock(),
              createElementBlock(
                'li',
                {
                  key: item.id,
                  class: 'item',
                },
                toDisplayString(item.name),
                1 /* TEXT */,
              )
            )
          }),
          128 /* KEYED_FRAGMENT */,
        )),
      ]),
    ],
    8 /* PROPS */,
    ['id'],
  )
}
```

通过这些补丁标记，Vue在更新时：

- 更新h1时只检查style和文本内容
- 更新p时只检查class
- 更新button时只检查disabled属性
- 列表使用KEYED_FRAGMENT标记进行优化的列表diff

## 3. 动态子节点标记（Block Tree）

### 3.1 什么是Block Tree？

Block Tree是Vue 3的核心优化机制之一。它将模板分割成嵌套的"块"（blocks），每个块追踪其内部的动态节点。通过这种方式，Vue可以在更新时跳过静态内容，只处理动态节点。

核心概念：

- **Block**：一个追踪了其所有动态后代节点的VNode
- **dynamicChildren**：存储在Block上的动态子节点数组
- **openBlock/closeBlock**：创建和关闭Block的函数

### 3.2 工作原理

在没有Block优化的情况下，Vue需要遍历整个虚拟DOM树进行diff：

```javascript
// 传统的完整遍历
function patch(n1, n2) {
  // 需要遍历所有子节点
  for (let i = 0; i < n2.children.length; i++) {
    patch(n1.children[i], n2.children[i])
  }
}
```

使用Block优化后：

```javascript
// Block优化后的遍历
function patchElement(n1, n2) {
  if (n2.dynamicChildren) {
    // 只遍历动态节点
    patchBlockChildren(
      n1.dynamicChildren,
      n2.dynamicChildren,
      // ...
    )
  } else {
    // fallback到完整diff
    patchChildren(n1, n2, ...)
  }
}
```

### 3.3 Block的创建时机

Vue会在以下情况创建新的Block：

1. **组件的根节点**
2. **带有v-if/v-else-if/v-else的节点**
3. **带有v-for的节点**
4. **带有v-memo的节点**
5. **动态组件 `<component :is="...">`**
6. **`<template v-for>` 中的每个子节点**

让我们看一个例子：

```vue
<template>
  <div>                          <!-- Block 1 (根) -->
    <h1>静态标题</h1>
    <p>{{ message }}</p>

    <div v-if="show">            <!-- Block 2 -->
      <span>条件内容</span>
      <span>{{ count }}</span>
    </div>

    <ul>
      <li v-for="item in list"   <!-- Block 3 (每个li) -->
          :key="item.id">
        {{ item.name }}
      </li>
    </ul>
  </div>
</template>
```

编译后的代码结构：

```javascript
function render() {
  return (
    openBlock(),
    createElementBlock('div', null, [
      _hoisted_1, // <h1>静态标题</h1> - 静态，不在dynamicChildren中
      createElementVNode(
        'p',
        null,
        toDisplayString(message.value),
        1 /* TEXT */,
      ),

      show.value
        ? (openBlock(),
          createElementBlock('div', { key: 0 }, [
            _hoisted_2, // <span>条件内容</span>
            createElementVNode(
              'span',
              null,
              toDisplayString(count.value),
              1 /* TEXT */,
            ),
          ]))
        : createCommentVNode('v-if', true),

      createElementVNode('ul', null, [
        (openBlock(true),
        createElementBlock(
          Fragment,
          null,
          renderList(list.value, item => {
            return (
              openBlock(),
              createElementBlock(
                'li',
                {
                  key: item.id,
                },
                toDisplayString(item.name),
                1 /* TEXT */,
              )
            )
          }),
          128 /* KEYED_FRAGMENT */,
        )),
      ]),
    ])
  )
}
```

### 3.4 源码实现分析

#### 3.4.1 Block的创建和追踪机制

在 `packages/runtime-core/src/vnode.ts` 中定义了Block的核心机制：

```typescript
// Block栈，用于处理嵌套的Block
export const blockStack: VNode['dynamicChildren'][] = []
// 当前活跃的Block
export let currentBlock: VNode['dynamicChildren'] = null

// 打开一个新的Block
export function openBlock(disableTracking = false): void {
  blockStack.push((currentBlock = disableTracking ? null : []))
}

// 关闭当前Block
export function closeBlock(): void {
  blockStack.pop()
  currentBlock = blockStack[blockStack.length - 1] || null
}

// 创建Block节点
export function createBlock(
  type: VNodeTypes | ClassComponent,
  props?: Record<string, any> | null,
  children?: any,
  patchFlag?: number,
  dynamicProps?: string[],
): VNode {
  return setupBlock(
    createVNode(
      type,
      props,
      children,
      patchFlag,
      dynamicProps,
      true /* isBlock: 防止Block追踪自己 */,
    ),
  )
}

// 设置Block，将currentBlock赋值给vnode.dynamicChildren
function setupBlock(vnode: VNode) {
  vnode.dynamicChildren =
    isBlockTreeEnabled > 0 && currentBlock && currentBlock.length > 0
      ? currentBlock
      : null
  closeBlock()
  if (vnode.dynamicChildren) {
    currentBlock.push(vnode)
  }
  return vnode
}
```

#### 3.4.2 动态节点的收集

在创建VNode时，会自动将动态节点添加到当前Block中：

```typescript
function createBaseVNode(
  type: VNodeTypes | ClassComponent | typeof NULL_DYNAMIC_COMPONENT,
  props: (Data & VNodeProps) | null = null,
  children: unknown = null,
  patchFlag = 0,
  dynamicProps: string[] | null = null,
  shapeFlag: number = type === Fragment ? 0 : ShapeFlags.ELEMENT,
  isBlockNode = false,
  needFullChildrenNormalization = false,
): VNode {
  // ... 创建vnode

  // 追踪动态节点
  if (
    isBlockTreeEnabled > 0 &&
    !isBlockNode && // 避免Block追踪自己
    currentBlock && // 有当前活跃的Block
    // 有patchFlag说明是动态节点，组件节点也需要追踪
    (vnode.patchFlag > 0 || shapeFlag & ShapeFlags.COMPONENT) &&
    // NEED_HYDRATION标记不算动态节点
    vnode.patchFlag !== PatchFlags.NEED_HYDRATION
  ) {
    currentBlock.push(vnode)
  }

  return vnode
}
```

#### 3.4.3 编译器的Block生成

**v-if的Block生成**（`packages/compiler-core/src/transforms/vIf.ts`）：

```typescript
function createChildrenCodegenNode(
  branch: IfBranchNode,
  keyIndex: number,
  context: TransformContext,
): BlockCodegenNode | MemoExpression {
  const { helper } = context
  const keyProperty = createObjectProperty(
    `key`,
    createSimpleExpression(`${keyIndex}`, false),
  )
  const { children } = branch
  const firstChild = children[0]
  const needFragmentWrapper =
    children.length !== 1 || firstChild.type !== NodeTypes.ELEMENT

  if (needFragmentWrapper) {
    // 多个子节点，需要Fragment包装
    return createVNodeCall(
      context,
      helper(FRAGMENT),
      createObjectExpression([keyProperty]),
      children,
      PatchFlags.STABLE_FRAGMENT,
      undefined,
      undefined,
      true, // isBlock
      false,
      false,
      branch.loc,
    )
  } else {
    // 单个元素节点，转换为Block
    const ret = firstChild.codegenNode
    const vnodeCall = getMemoedVNodeCall(ret)
    if (vnodeCall.type === NodeTypes.VNODE_CALL) {
      convertToBlock(vnodeCall, context) // 转换为Block
    }
    injectProp(vnodeCall, keyProperty, context)
    return ret
  }
}
```

**v-for的Block生成**（`packages/compiler-core/src/transforms/vFor.ts`）：

```typescript
// v-for会为每个子项创建Block
const renderExp = createCallExpression(helper(RENDER_LIST), [forNode.source])

// ... 处理子节点

childBlock.isBlock = !isStableFragment
if (childBlock.isBlock) {
  helper(OPEN_BLOCK)
  helper(getVNodeBlockHelper(context.inSSR, childBlock.isComponent))
} else {
  helper(getVNodeHelper(context.inSSR, childBlock.isComponent))
}
```

### 3.5 运行时的优化diff

在 `packages/runtime-core/src/renderer.ts` 中，patchElement使用dynamicChildren优化diff：

```typescript
const patchElement = (
  n1: VNode,
  n2: VNode,
  parentComponent: ComponentInternalInstance | null,
  parentSuspense: SuspenseBoundary | null,
  namespace: ElementNamespace,
  slotScopeIds: string[] | null,
  optimized: boolean,
) => {
  const el = (n2.el = n1.el!)
  let { patchFlag, dynamicChildren, dirs } = n2

  // 如果有dynamicChildren，使用优化的Block diff
  if (dynamicChildren) {
    patchBlockChildren(
      n1.dynamicChildren!,
      dynamicChildren,
      el,
      parentComponent,
      parentSuspense,
      resolveChildrenNamespace(n2, namespace),
      slotScopeIds,
    )
    if (__DEV__) {
      // 开发环境下需要遍历静态节点以支持HMR
      traverseStaticChildren(n1, n2)
    }
  } else if (!optimized) {
    // 没有dynamicChildren，回退到完整diff
    patchChildren(
      n1,
      n2,
      el,
      null,
      parentComponent,
      parentSuspense,
      resolveChildrenNamespace(n2, namespace),
      slotScopeIds,
      false,
    )
  }

  // ... patch props
}

// 优化的Block子节点更新
const patchBlockChildren: PatchBlockChildrenFn = (
  oldChildren,
  newChildren,
  fallbackContainer,
  parentComponent,
  parentSuspense,
  namespace,
  slotScopeIds,
) => {
  for (let i = 0; i < newChildren.length; i++) {
    const oldVNode = oldChildren[i]
    const newVNode = newChildren[i]
    // 确定容器（用于不稳定的fragment）
    const container =
      oldVNode.el &&
      (oldVNode.type === Fragment ||
        !isSameVNodeType(oldVNode, newVNode) ||
        oldVNode.shapeFlag & ShapeFlags.COMPONENT)
        ? hostParentNode(oldVNode.el)!
        : fallbackContainer
    patch(
      oldVNode,
      newVNode,
      container,
      null,
      parentComponent,
      parentSuspense,
      namespace,
      slotScopeIds,
      true, // optimized
    )
  }
}
```

### 3.6 Block Tree的优势

1. **跳过静态内容** - 静态节点不会被收集到dynamicChildren中，更新时直接跳过
2. **扁平化动态节点** - 将嵌套的动态节点扁平化到Block的dynamicChildren数组中
3. **稳定的节点结构** - 在Block内部，节点结构是稳定的，可以直接通过索引对应
4. **减少遍历深度** - 不需要递归遍历整个树，只需要遍历dynamicChildren

### 3.7 Block Tree的限制

需要注意的是，以下情况会影响Block优化：

1. **手写的渲染函数** - 编译器无法分析，会标记BAIL退出优化
2. **动态的节点结构** - 如果节点结构可能改变，需要回退到完整diff
3. **v-memo指令** - 会创建特殊的Block来处理记忆化

## 4. 事件监听器缓存（Cache Handlers）

### 4.1 问题背景

在Vue 2中，每次渲染时内联事件处理函数都会创建新的函数实例：

```vue
<template>
  <button @click="count++">{{ count }}</button>
</template>
```

编译后（Vue 2风格）：

```javascript
function render() {
  return h(
    'button',
    {
      on: {
        click: () => this.count++, // 每次渲染都创建新函数
      },
    },
    this.count,
  )
}
```

这导致：

1. **内存分配增加** - 每次渲染都创建新函数
2. **子组件不必要更新** - 父组件传递的函数引用改变，导致子组件重新渲染

### 4.2 缓存机制

Vue 3通过编译时分析和运行时缓存解决这个问题：

```vue
<template>
  <div>
    <button @click="increment">点击</button>
    <button @click="count++">内联递增</button>
    <child @custom="handleCustom" />
  </div>
</template>
```

开启事件缓存后的编译结果：

```javascript
function render(_ctx, _cache) {
  return createElementVNode('div', null, [
    createElementVNode(
      'button',
      {
        onClick: _ctx.increment, // 方法引用，不需要缓存
      },
      '点击',
    ),

    createElementVNode(
      'button',
      {
        onClick: _cache[0] || (_cache[0] = $event => _ctx.count++), // 缓存内联函数
      },
      '内联递增',
    ),

    createVNode(_component_child, {
      onCustom:
        _cache[1] || (_cache[1] = (...args) => _ctx.handleCustom(...args)),
    }),
  ])
}
```

### 4.3 源码实现分析

#### 4.3.1 编译时分析（transformOn）

在 `packages/compiler-core/src/transforms/vOn.ts` 中：

```typescript
export const transformOn: DirectiveTransform = (
  dir,
  node,
  context,
  augmentor,
) => {
  const { loc, modifiers, arg } = dir
  let { exp } = dir

  // 分析表达式类型
  let shouldCache: boolean = context.cacheHandlers && !exp.isStatic
  let isMemberExp = false

  if (exp) {
    if (exp.type === NodeTypes.SIMPLE_EXPRESSION) {
      if (isSimpleIdentifier(exp.content)) {
        // 简单标识符：onClick="handler" - 不需要缓存
        shouldCache = false
      } else if (isMemberExpression(exp.content)) {
        // 成员表达式：onClick="obj.method" - 需要缓存
        isMemberExp = true
      }
    }

    // 检查是否是内联语句
    const isInlineStatement = !(isSimpleIdentifier(exp.content) || isMemberExp)

    if (isInlineStatement || (shouldCache && isMemberExp)) {
      // 包装内联语句为函数表达式
      exp = createCompoundExpression([
        `${
          isInlineStatement
            ? !__BROWSER__ && context.isTS
              ? `($event: any)`
              : `$event`
            : `${
                !__BROWSER__ && context.isTS ? `\n//@ts-ignore\n` : ``
              }(...args)`
        } => ${hasMultipleStatements ? `{` : `(`}`,
        exp,
        hasMultipleStatements ? `}` : `)`,
      ])
    }
  }

  let ret: DirectiveTransformResult = {
    props: [
      createObjectProperty(
        eventName,
        exp || createSimpleExpression(`() => {}`, false, loc),
      ),
    ],
  }

  // 应用缓存
  if (shouldCache) {
    // 缓存处理器避免每次渲染创建新函数
    ret.props[0].value = context.cache(ret.props[0].value)
  }

  return ret
}
```

#### 4.3.2 v-model的缓存

在 `packages/compiler-core/src/transforms/vModel.ts` 中：

```typescript
export const transformModel: DirectiveTransform = (dir, node, context) => {
  const { exp, arg } = dir
  // ... 处理v-model逻辑

  const assignmentExp = createCompoundExpression([
    `${eventArg} => ((`,
    exp,
    `) = $event)`,
  ])

  const props = [
    createObjectProperty(propName, dir.exp!),
    createObjectProperty(eventName, assignmentExp),
  ]

  // 缓存v-model处理器（如果适用）
  if (
    !__BROWSER__ &&
    context.prefixIdentifiers &&
    !context.inVOnce &&
    context.cacheHandlers &&
    !hasScopeRef(exp, context.identifiers)
  ) {
    props[1].value = context.cache(props[1].value)
  }

  return { props }
}
```

#### 4.3.3 缓存条件判断

在 `packages/compiler-core/src/transform.ts` 中的缓存逻辑：

```typescript
export function createTransformContext(root, options) {
  const context = {
    // ... 其他属性

    cache(
      exp: JSChildNode,
      isVNode?: boolean,
      inVOnce?: boolean,
    ): CacheExpression {
      const index = context.cached.length
      const cache = createCacheExpression(index, exp, isVNode)
      if (inVOnce) {
        cache.isVOnce = true
      }
      context.cached.push(cache)
      return cache
    },

    // 缓存启用条件
    cacheHandlers: !__BROWSER__ && options.cacheHandlers !== false,
  }
}
```

### 4.4 运行时缓存机制

生成的渲染函数使用 `_cache` 数组存储缓存的函数：

```javascript
// 编译生成的代码
function render(_ctx, _cache) {
  return createElementVNode(
    'button',
    {
      onClick:
        _cache[0] ||
        (_cache[0] = $event => {
          _ctx.count++
          _ctx.$emit('update')
        }),
    },
    'Click me',
  )
}

// 运行时，组件实例的render context
const instance = {
  // ...
  renderCache: [], // _cache 参数的来源
}
```

缓存的工作流程：

1. 首次渲染：`_cache[0]` 为undefined，执行赋值操作创建函数并缓存
2. 后续渲染：直接使用 `_cache[0]` 中缓存的函数引用

## 5. 内联组件属性优化

### 5.1 属性标准化优化

Vue编译器会在编译时对组件属性进行标准化处理，减少运行时开销。

#### 5.1.1 Class和Style的预处理

在 `packages/compiler-core/src/transforms/transformElement.ts` 中：

```typescript
export function buildProps(
  node,
  context,
  props,
  isComponent,
  isDynamicComponent,
  ssr,
) {
  // ... 属性分析

  // 预标准化props
  if (!context.inSSR && propsExpression) {
    switch (propsExpression.type) {
      case NodeTypes.JS_OBJECT_EXPRESSION:
        // 静态对象表达式的优化处理
        const classKeyIndex = propsExpression.properties.findIndex(
          p => p.key === 'class' || p.key.content === 'class',
        )
        const styleKeyIndex = propsExpression.properties.findIndex(
          p => p.key === 'style' || p.key.content === 'style',
        )

        const classProp = propsExpression.properties[classKeyIndex]
        const styleProp = propsExpression.properties[styleKeyIndex]

        // Class标准化
        if (classProp && !isStaticExp(classProp.value)) {
          classProp.value = createCallExpression(
            context.helper(NORMALIZE_CLASS),
            [classProp.value],
          )
        }

        // Style标准化
        if (
          styleProp &&
          (hasStyleBinding ||
            (styleProp.value.type === NodeTypes.SIMPLE_EXPRESSION &&
              styleProp.value.content.trim()[0] === `[`) ||
            styleProp.value.type === NodeTypes.JS_ARRAY_EXPRESSION)
        ) {
          styleProp.value = createCallExpression(
            context.helper(NORMALIZE_STYLE),
            [styleProp.value],
          )
        }
        break

      case NodeTypes.JS_CALL_EXPRESSION:
        // mergeProps调用，无需额外处理
        break

      default:
        // 单个v-bind，包装为normalizeProps
        propsExpression = createCallExpression(
          context.helper(NORMALIZE_PROPS),
          [
            createCallExpression(context.helper(GUARD_REACTIVE_PROPS), [
              propsExpression,
            ]),
          ],
        )
        break
    }
  }

  return {
    props: propsExpression,
    directives: runtimeDirectives,
    patchFlag,
    dynamicPropNames,
    shouldUseBlock,
  }
}
```

#### 5.1.2 内联ref优化

对于setup中的ref，编译器会进行特殊处理：

```typescript
// 在buildProps中处理ref
if (name === 'ref') {
  hasRef = true
  pushRefVForMarker()

  // 内联模式下的ref优化
  if (!__BROWSER__ && value && context.inline) {
    const binding = context.bindingMetadata[value.content]
    if (
      binding === BindingTypes.SETUP_LET ||
      binding === BindingTypes.SETUP_REF ||
      binding === BindingTypes.SETUP_MAYBE_REF
    ) {
      isStatic = false
      properties.push(
        createObjectProperty(
          createSimpleExpression('ref_key', true),
          createSimpleExpression(value.content, true, value.loc),
        ),
      )
    }
  }
}
```

### 5.2 属性去重和合并

编译器还会对重复的属性进行去重处理：

```typescript
// 去重属性的实现
function dedupeProperties(properties: Property[]): Property[] {
  const knownProps: Map<string, Property> = new Map()
  const deduped: Property[] = []

  for (let i = 0; i < properties.length; i++) {
    const prop = properties[i]
    if (prop.key.type === NodeTypes.SIMPLE_EXPRESSION && !prop.key.isStatic) {
      deduped.push(prop)
      continue
    }

    const name = getStaticPropertyName(prop)
    const existing = knownProps.get(name)

    if (existing) {
      if (name === 'style' || name === 'class' || isOn(name)) {
        // 合并style、class和事件处理器
        mergeAsArray(existing, prop)
      }
    } else {
      knownProps.set(name, prop)
      deduped.push(prop)
    }
  }

  return deduped
}
```

## 6. Tree-shaking优化

### 6.1 按需导入机制

Vue 3编译器生成的代码支持完整的tree-shaking，只导入实际使用的功能。

#### 6.1.1 Helper函数的按需导入

在 `packages/compiler-core/src/codegen.ts` 中：

```typescript
function genModulePreamble(
  ast: RootNode,
  context: CodegenContext,
  genScopeId: boolean,
  inline?: boolean,
) {
  const {
    push,
    newline,
    optimizeImports,
    runtimeModuleName,
    ssrRuntimeModuleName,
  } = context

  // 只导入实际使用的helper函数
  if (ast.helpers.size) {
    const helpers = Array.from(ast.helpers)
    if (optimizeImports) {
      // Webpack代码分割优化
      // 避免 Object(a.b) 或 (0,a.b) 的包装开销
      push(
        `import { ${helpers
          .map(s => helperNameMap[s])
          .join(', ')} } from ${JSON.stringify(runtimeModuleName)}\n`,
      )
      push(
        `\n// Binding optimization for webpack code-split\nconst ${helpers
          .map(s => `_${helperNameMap[s]} = ${helperNameMap[s]}`)
          .join(', ')}\n`,
      )
    } else {
      push(
        `import { ${helpers
          .map(s => `${helperNameMap[s]} as _${helperNameMap[s]}`)
          .join(', ')} } from ${JSON.stringify(runtimeModuleName)}\n`,
      )
    }
  }

  // SSR helper函数
  if (ast.ssrHelpers && ast.ssrHelpers.length) {
    push(
      `import { ${ast.ssrHelpers
        .map(s => `${helperNameMap[s]} as _${helperNameMap[s]}`)
        .join(', ')} } from "${ssrRuntimeModuleName}"\n`,
    )
  }

  // 用户组件和指令的导入
  if (ast.imports.length) {
    genImports(ast.imports, context)
    newline()
  }

  genHoists(ast.hoists, context)
  newline()

  if (!inline) {
    push(`export `)
  }
}
```

#### 6.1.2 条件性Helper导入

编译器根据模板内容决定导入哪些helper：

```typescript
// 在transform过程中收集需要的helper
export function transform(root: RootNode, options: TransformOptions): void {
  const context = createTransformContext(root, options)
  traverseNode(root, context)

  if (options.hoistStatic) {
    cacheStatic(root, context)
  }

  if (!options.ssr) {
    createRootCodegen(root, context)
  }

  // 最终化helper集合
  root.helpers = new Set([...context.helpers.keys()])
  root.components = [...context.components]
  root.directives = [...context.directives]
  root.imports = context.imports
  root.hoists = context.hoists
  root.temps = context.temps
  root.cached = context.cached
  root.transformed = true
}

// helper的使用示例
context.helper(CREATE_ELEMENT_VNODE) // 添加到helpers集合
context.helper(TO_DISPLAY_STRING) // 只有使用插值时才添加
context.helper(NORMALIZE_CLASS) // 只有动态class时才添加
```

### 6.2 纯函数标记

编译器生成的代码包含 `/*#__PURE__*/` 注释，帮助打包工具进行tree-shaking：

```javascript
// 生成的代码示例
const _hoisted_1 = /*#__PURE__*/ createElementVNode('h1', null, '标题', -1)
const _hoisted_2 = /*#__PURE__*/ createElementVNode(
  'p',
  { class: 'info' },
  '信息',
  -1,
)

export function render(_ctx, _cache) {
  return /*#__PURE__*/ createElementVNode('div', null, [
    _hoisted_1,
    _hoisted_2,
    /*#__PURE__*/ createElementVNode(
      'span',
      null,
      toDisplayString(_ctx.message),
      1,
    ),
  ])
}
```

### 6.3 未使用功能的剔除

通过模块化设计，未使用的Vue功能可以被完全剔除：

```javascript
// 只有使用了对应功能才会导入
import { ref, computed } from 'vue' // 使用了响应式
import { Transition } from 'vue' // 使用了过渡
import { KeepAlive } from 'vue' // 使用了keep-alive
import { Teleport } from 'vue' // 使用了传送门

// 编译器指令tree-shaking
import { vShow } from 'vue' // 使用了v-show
import { vModelText } from 'vue' // 使用了v-model
```

## 7. 预编译优化

### 7.1 SFC编译时优化

Single File Component在编译时会进行多项优化。

#### 7.1.1 模板预编译配置

在 `packages/compiler-sfc/src/compileTemplate.ts` 中：

```typescript
function doCompileTemplate({
  filename,
  id,
  scoped,
  slotted,
  inMap,
  source,
  ast: inAST,
  ssr = false,
  ssrCssVars,
  isProd = false,
  compiler,
  compilerOptions = {},
  transformAssetUrls,
}: SFCTemplateCompileOptions): SFCTemplateCompileResults {
  let { code, ast, preamble, map } = compiler.compile(inAST || source, {
    mode: 'module',
    prefixIdentifiers: true, // 启用标识符前缀
    hoistStatic: true, // 启用静态提升
    cacheHandlers: true, // 启用事件缓存
    ssrCssVars:
      ssr && ssrCssVars && ssrCssVars.length
        ? genCssVarsFromList(ssrCssVars, shortId, isProd, true)
        : '',
    scopeId: scoped ? longId : undefined,
    slotted,
    sourceMap: true,
    ...compilerOptions,
    hmr: !isProd, // 开发环境启用HMR
    nodeTransforms: nodeTransforms.concat(compilerOptions.nodeTransforms || []),
    filename,
    onError: e => errors.push(e),
    onWarn: w => warnings.push(w),
  })

  return { code, ast, preamble, source, errors, tips, map }
}
```

#### 7.1.2 作用域CSS优化

```typescript
// CSS作用域ID生成和注入
const shortId = id.replace(/^data-v-/, '')
const longId = `data-v-${shortId}`

// 在模板编译中注入scopeId
if (scoped) {
  // 为每个元素添加作用域属性
  compilerOptions.scopeId = longId
}

// CSS变量注入（SSR）
if (ssr && ssrCssVars && ssrCssVars.length) {
  compilerOptions.ssrCssVars = genCssVarsFromList(
    ssrCssVars,
    shortId,
    isProd,
    true,
  )
}
```

#### 7.1.3 资源URL转换

```typescript
// 处理静态资源引用
const assetUrlRE = /(?:^|\s)src\s*=\s*("[^"]*"|'[^']*')/
const srcsetRE = /(?:^|\s)srcset\s*=\s*("[^"]*"|'[^']*')/

function transformAssetUrl(node: ElementNode, context: TransformContext) {
  if (node.type === NodeTypes.ELEMENT) {
    for (let i = 0; i < node.props.length; i++) {
      const prop = node.props[i]
      if (prop.type === NodeTypes.ATTRIBUTE) {
        // 转换静态资源URL
        if (prop.name === 'src' || prop.name === 'href') {
          prop.value = transformUrl(prop.value, context)
        }
      }
    }
  }
}
```

### 7.2 编译时宏处理

#### 7.2.1 defineProps和defineEmits

```typescript
// 编译时宏的处理
export function compileScript(sfc, options) {
  // 检测编译时宏
  if (node.type === 'CallExpression') {
    const callee = node.callee
    if (callee.type === 'Identifier') {
      const name = callee.name

      if (name === 'defineProps') {
        // 编译时处理props定义
        return compileDefineProps(node, options)
      }

      if (name === 'defineEmits') {
        // 编译时处理emits定义
        return compileDefineEmits(node, options)
      }

      if (name === 'defineExpose') {
        // 编译时处理expose定义
        return compileDefineExpose(node, options)
      }
    }
  }
}
```

#### 7.2.2 setup语法糖优化

```typescript
// <script setup> 的编译优化
function compileScriptSetup(sfc, options) {
  const script = sfc.scriptSetup

  // 自动导入优化
  const imports = new Set()

  // 响应式变量分析
  const refBindings = new Set()
  const reactiveBindings = new Set()

  // 编译时常量提取
  const compileTimeConstants = new Map()

  // 生成优化的setup函数
  return {
    code: generateSetupCode(script, {
      imports,
      refBindings,
      reactiveBindings,
      compileTimeConstants,
    }),
    bindings: analyzeBindings(script),
    imports: Array.from(imports),
  }
}
```

## 8. Block Tree优化的深层实现

### 8.1 Fragment优化

Fragment是一个特殊的Block类型，用于处理多根节点：

```typescript
// Fragment的创建和优化
export const Fragment = Symbol(__DEV__ ? 'Fragment' : undefined)

function createFragment(
  children: VNodeArrayChildren,
  patchFlag?: number,
): VNode {
  return createVNode(
    Fragment,
    null,
    children,
    patchFlag | PatchFlags.STABLE_FRAGMENT,
  )
}

// 编译器生成Fragment代码
function genFragment(node: FragmentNode, context: CodegenContext) {
  push(`${helper(FRAGMENT)}, null, `)
  genNodeList(node.children, context)

  if (node.patchFlag) {
    push(`, ${node.patchFlag}`)
  }
}
```

### 8.2 条件渲染的Block优化

```typescript
// v-if/v-else-if/v-else的Block处理
function patchConditionalRender(
  n1: VNode | null,
  n2: VNode,
  container: RendererElement,
  anchor: RendererNode | null,
  parentComponent: ComponentInternalInstance | null,
  parentSuspense: SuspenseBoundary | null,
  namespace: ElementNamespace,
  slotScopeIds: string[] | null,
  optimized: boolean,
) {
  if (n1 == null) {
    // 挂载分支
    if (n2.children) {
      patch(
        null,
        n2.children,
        container,
        anchor,
        parentComponent,
        parentSuspense,
        namespace,
        slotScopeIds,
        optimized,
      )
    }
  } else {
    // 更新分支 - 可能切换不同的条件分支
    if (n2.children !== n1.children) {
      // 分支切换，需要卸载旧分支，挂载新分支
      unmount(n1.children, parentComponent, parentSuspense, true)
      patch(
        null,
        n2.children,
        container,
        anchor,
        parentComponent,
        parentSuspense,
        namespace,
        slotScopeIds,
        optimized,
      )
    }
  }
}
```

### 8.3 循环渲染的Block优化

```typescript
// v-for的优化diff算法
function patchKeyedChildren(
  c1: VNode[],
  c2: VNodeArrayChildren,
  container: RendererElement,
  parentAnchor: RendererNode | null,
  parentComponent: ComponentInternalInstance | null,
  parentSuspense: SuspenseBoundary | null,
  namespace: ElementNamespace,
  slotScopeIds: string[] | null,
  optimized: boolean,
) {
  let i = 0
  const l2 = c2.length
  let e1 = c1.length - 1
  let e2 = l2 - 1

  // 1. 从前往后同步
  while (i <= e1 && i <= e2) {
    const n1 = c1[i]
    const n2 = (c2[i] = optimized
      ? cloneIfMounted(c2[i] as VNode)
      : normalizeVNode(c2[i]))

    if (isSameVNodeType(n1, n2)) {
      patch(
        n1,
        n2,
        container,
        null,
        parentComponent,
        parentSuspense,
        namespace,
        slotScopeIds,
        optimized,
      )
    } else {
      break
    }
    i++
  }

  // 2. 从后往前同步
  while (i <= e1 && i <= e2) {
    const n1 = c1[e1]
    const n2 = (c2[e2] = optimized
      ? cloneIfMounted(c2[e2] as VNode)
      : normalizeVNode(c2[e2]))

    if (isSameVNodeType(n1, n2)) {
      patch(
        n1,
        n2,
        container,
        null,
        parentComponent,
        parentSuspense,
        namespace,
        slotScopeIds,
        optimized,
      )
    } else {
      break
    }
    e1--
    e2--
  }

  // 3. 处理剩余节点（新增、删除、移动）
  if (i > e1) {
    if (i <= e2) {
      // 新增节点
      const nextPos = e2 + 1
      const anchor = nextPos < l2 ? (c2[nextPos] as VNode).el : parentAnchor
      while (i <= e2) {
        patch(
          null,
          (c2[i] = optimized
            ? cloneIfMounted(c2[i] as VNode)
            : normalizeVNode(c2[i])),
          container,
          anchor,
          parentComponent,
          parentSuspense,
          namespace,
          slotScopeIds,
          optimized,
        )
        i++
      }
    }
  } else if (i > e2) {
    // 删除节点
    while (i <= e1) {
      unmount(c1[i], parentComponent, parentSuspense, true)
      i++
    }
  } else {
    // 复杂情况：使用最长递增子序列算法优化移动
    const s1 = i
    const s2 = i

    // 构建新节点的key映射
    const keyToNewIndexMap: Map<string | number | symbol, number> = new Map()
    for (i = s2; i <= e2; i++) {
      const nextChild = (c2[i] = optimized
        ? cloneIfMounted(c2[i] as VNode)
        : normalizeVNode(c2[i]))
      if (nextChild.key != null) {
        keyToNewIndexMap.set(nextChild.key, i)
      }
    }

    // 处理旧节点，确定哪些需要patch，哪些需要移动或删除
    let j
    let patched = 0
    const toBePatched = e2 - s2 + 1
    let moved = false
    let maxNewIndexSoFar = 0

    const newIndexToOldIndexMap = new Array(toBePatched)
    for (i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0

    for (i = s1; i <= e1; i++) {
      const prevChild = c1[i]
      if (patched >= toBePatched) {
        unmount(prevChild, parentComponent, parentSuspense, true)
        continue
      }

      let newIndex
      if (prevChild.key != null) {
        newIndex = keyToNewIndexMap.get(prevChild.key)
      } else {
        // 无key的情况，尝试找到相同类型的节点
        for (j = s2; j <= e2; j++) {
          if (
            newIndexToOldIndexMap[j - s2] === 0 &&
            isSameVNodeType(prevChild, c2[j] as VNode)
          ) {
            newIndex = j
            break
          }
        }
      }

      if (newIndex === undefined) {
        unmount(prevChild, parentComponent, parentSuspense, true)
      } else {
        newIndexToOldIndexMap[newIndex - s2] = i + 1
        if (newIndex >= maxNewIndexSoFar) {
          maxNewIndexSoFar = newIndex
        } else {
          moved = true
        }
        patch(
          prevChild,
          c2[newIndex] as VNode,
          container,
          null,
          parentComponent,
          parentSuspense,
          namespace,
          slotScopeIds,
          optimized,
        )
        patched++
      }
    }

    // 移动和挂载新节点
    const increasingNewIndexSequence = moved
      ? getSequence(newIndexToOldIndexMap)
      : EMPTY_ARR
    j = increasingNewIndexSequence.length - 1

    for (i = toBePatched - 1; i >= 0; i--) {
      const nextIndex = s2 + i
      const nextChild = c2[nextIndex] as VNode
      const anchor =
        nextIndex + 1 < l2 ? (c2[nextIndex + 1] as VNode).el : parentAnchor

      if (newIndexToOldIndexMap[i] === 0) {
        // 新节点，需要挂载
        patch(
          null,
          nextChild,
          container,
          anchor,
          parentComponent,
          parentSuspense,
          namespace,
          slotScopeIds,
          optimized,
        )
      } else if (moved) {
        // 需要移动的节点
        if (j < 0 || i !== increasingNewIndexSequence[j]) {
          move(nextChild, container, anchor, MoveType.REORDER)
        } else {
          j--
        }
      }
    }
  }
}
```

### 8.4 Block Tree的性能收益

通过以上所有优化，Vue 3的编译器实现了：

1. **编译时分析**：

   - 静态内容提升，减少运行时创建
   - 补丁标记精确指示动态部分
   - 事件缓存避免函数重复创建
   - 属性标准化减少运行时处理

2. **运行时优化**：

   - Block Tree跳过静态子树
   - 扁平化动态节点收集
   - 优化的diff算法（最长递增子序列）
   - 精确的属性更新

3. **构建优化**：

   - Tree-shaking移除未使用代码
   - 按需导入减少包体积
   - 纯函数标记帮助打包优化

4. **开发体验**：
   - SFC编译时优化
   - 编译时宏减少运行时开销
   - 更好的TypeScript支持

## 总结

- 1. 静态提升（Static Hoisting）。将静态内容提升到渲染函数外部，避免重复创建，通过ConstantTypes判断节点的静态程度，显著减少内存分配和渲染开销。
- 2. 补丁标记（Patch Flags）。编译时标记动态内容类型（TEXT、CLASS、STYLE、PROPS等），运行时根据标记进行精确更新，避免全量diff，使用位运算支持标记组合。
- 3. 动态子节点标记（Block Tree）。将模板分割成Block，追踪每个Block内的动态节点，通过dynamicChildren数组扁平化动态节点，跳过静态子树，只处理动态节点。
- 4. 事件监听器缓存（Cache Handlers）。缓存内联事件处理函数，避免每次渲染创建新函数，减少内存分配，防止子组件不必要更新，智能判断哪些函数需要缓存。
- 5. 内联组件属性优化。编译时对class、style等属性进行标准化预处理，属性去重和合并优化，内联ref的特殊处理。
- 6. Tree-shaking优化。按需导入helper函数和Vue功能模块，纯函数标记帮助打包工具优化，未使用功能完全剔除。
- 7. 预编译优化。SFC编译时的多项优化配置，编译时宏处理（defineProps、defineEmits等），作用域CSS和资源URL转换。
- 8. Block Tree优化的深层实现。Fragment优化处理多根节点，条件渲染和循环渲染的Block处理，最长递增子序列算法优化v-for的diff。

通过一句话总结了vue3的编译优化，这也是官方提到优化带来的：

- 更快的渲染速度 - 通过静态提升和Block Tree
- 更小的包体积 - 通过Tree-shaking
- 更精确的更新 - 通过补丁标记
- 更少的内存开销 - 通过事件缓存和属性优化
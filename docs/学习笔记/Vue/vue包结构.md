# vue包结构

Vue3采用monorepo结构，将功能模块化分离为独立的packages，形成分层的依赖关系。

```mermaid
┌─────────────────┐
│      vue        │  ← 用户入口包
└─────────────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌───▼───────────┐
│ comp- │ │ runtime-dom   │
│ iler  │ │               │
│ chain │ └───┬───────────┘
└───────┘     │
              │
     ┌────────▼────────┐
     │  runtime-core   │
     │                 │
     └────────┬────────┘
              │
     ┌────────▼────────┐
     │   reactivity    │
     │                 │
     └────────┬────────┘
              │
     ┌────────▼────────┐
     │     shared      │
     └─────────────────┘
```

## shared包 基础层

shared包是Vue3的基础层，提供了一些共享的工具函数和常量。

- 作用：为所有包提供基础工具函数和类型定义
- 依赖：无
- 被依赖：所有包

```text
packages/shared/
├── src/
│   ├── codeframe.ts          # 代码框架生成
│   ├── domAttrConfig.ts      # DOM属性配置
│   ├── domTagConfig.ts       # DOM标签配置
│   ├── general.ts            # 通用工具函数
│   ├── globalsAllowlist.ts   # 全局变量白名单
│   ├── index.ts              # 入口文件
│   ├── looseEqual.ts         # 松散相等比较
│   ├── makeMap.ts            # 创建映射表
│   ├── normalizeProp.ts      # 属性标准化
│   ├── patchFlags.ts         # 补丁标记定义
│   ├── shapeFlags.ts         # 形状标记定义
│   ├── slotFlags.ts          # 插槽标记定义
│   ├── toDisplayString.ts    # 转换为显示字符串
│   └── typeUtils.ts          # 类型工具
```

## reactivity包 响应式层

reactivity包是Vue3的响应式系统，提供了响应式数据的实现。

- 作用：实现Vue3的响应式系统核心
- 依赖：`@vue/shared`
- 特点：可独立使用，支持Tree-shaking

```text
packages/reactivity/
├── src/
│   ├── baseHandlers.ts       # 基础代理处理器
│   ├── collectionHandlers.ts # 集合类型代理处理器
│   ├── computed.ts           # computed计算属性
│   ├── constants.ts          # 常量定义
│   ├── dep.ts               # 依赖收集
│   ├── deferredComputed.ts  # 延迟计算属性
│   ├── effect.ts            # 副作用函数
│   ├── effectScope.ts       # 副作用作用域
│   ├── index.ts             # 入口文件
│   ├── reactive.ts          # reactive API
│   ├── readonly.ts          # readonly API
│   ├── ref.ts               # ref API
│   └── watch.ts             # watch API
```

## runtime-core包 运行时层 核心

runtime-core包是Vue3的运行时核心，提供了Vue3的运行时核心功能。

- 作用：平台无关的运行时核心
- 依赖：`@vue/shared`、`@vue/reactivity`
- 特点：不包含DOM操作，可用于SSR

```text
packages/runtime-core/
├── src/
│   ├── apiAsyncComponent.ts   # 异步组件API
│   ├── apiCreateApp.ts        # createApp API
│   ├── apiDefineComponent.ts  # defineComponent API
│   ├── apiInject.ts           # provide/inject API
│   ├── apiLifecycle.ts        # 生命周期API
│   ├── apiSetupHelpers.ts     # setup辅助函数
│   ├── apiWatch.ts            # watch API
│   ├── component.ts           # 组件核心逻辑
│   ├── componentEmits.ts      # 组件事件处理
│   ├── componentOptions.ts    # 组件选项处理
│   ├── componentProps.ts      # 组件props处理
│   ├── componentPublicInstance.ts # 组件公开实例
│   ├── componentRenderContext.ts  # 组件渲染上下文
│   ├── componentRenderUtils.ts    # 组件渲染工具
│   ├── componentSlots.ts      # 组件插槽处理
│   ├── renderer.ts            # 渲染器核心
│   ├── scheduler.ts           # 调度器
│   ├── vnode.ts              # 虚拟节点
│   └── ...更多文件
```

## runtime-dom包 运行时层 DOM运行时

- 作用：DOM平台的运行时实现
- 依赖：`@vue/runtime-core，@vue/shared`
- 特点：包含所有DOM相关操作

```text
packages/runtime-dom/
├── src/
│   ├── components/           # DOM特定组件
│   │   ├── Transition.ts     # 过渡组件
│   │   └── TransitionGroup.ts # 过渡组合组件
│   ├── directives/          # DOM指令
│   │   ├── vModel.ts        # v-model指令
│   │   ├── vOn.ts           # v-on指令
│   │   └── vShow.ts         # v-show指令
│   ├── modules/             # DOM模块
│   │   ├── attrs.ts         # 属性处理
│   │   ├── class.ts         # class处理
│   │   ├── events.ts        # 事件处理
│   │   ├── props.ts         # props处理
│   │   └── style.ts         # 样式处理
│   ├── index.ts             # 入口文件
│   ├── nodeOps.ts           # DOM节点操作
│   └── patchProp.ts         # 属性patch
```

## runtime-test包 运行时层 测试运行时

- 作用：为单元测试提供的运行时环境
- 依赖：`@vue/runtime-core，@vue/shared`

```text
packages/runtime-test/
├── src/
│   ├── index.ts             # 入口文件
│   ├── nodeOps.ts           # 测试节点操作
│   ├── patchProp.ts         # 测试属性patch
│   ├── serialize.ts         # 序列化工具
│   └── triggerEvent.ts      # 触发事件工具
```

## compiler-core包 编译器层 核心

- 作用：平台无关的编译器核心逻辑
- 依赖：`@vue/shared`
- 特点：上一篇`vue编译`的的编译优化主要实现

```text
packages/compiler-core/
├── src/
│   ├── transforms/           # 转换器
│   │   ├── transformElement.ts    # 元素转换
│   │   ├── transformExpression.ts # 表达式转换
│   │   ├── transformText.ts       # 文本转换
│   │   ├── vBind.ts              # v-bind转换
│   │   ├── vFor.ts               # v-for转换
│   │   ├── vIf.ts                # v-if转换
│   │   ├── vModel.ts             # v-model转换
│   │   ├── vOn.ts                # v-on转换
│   │   ├── vSlot.ts              # v-slot转换
│   │   └── cacheStatic.ts        # 静态缓存转换
│   ├── ast.ts               # AST节点定义
│   ├── codegen.ts           # 代码生成
│   ├── compile.ts           # 编译主函数
│   ├── parser.ts            # 解析器
│   ├── transform.ts         # 转换核心
│   └── ...更多文件
```

## compiler-dom包 编译器层 DOM编译器

- 作用：DOM平台的编译器扩展
- 依赖：`@vue/compiler-core，@vue/shared`

```text
packages/compiler-dom/
├── src/
│   ├── transforms/          # DOM特定转换
│   │   ├── transformStyle.ts     # 样式转换
│   │   ├── vHtml.ts             # v-html指令
│   │   ├── vModel.ts            # v-model DOM版本
│   │   ├── vOn.ts               # v-on DOM版本
│   │   ├── vShow.ts             # v-show指令
│   │   ├── vText.ts             # v-text指令
│   │   └── Transition.ts        # 过渡组件转换
│   ├── index.ts             # 入口文件
│   ├── parserOptions.ts     # DOM解析选项
│   └── runtimeHelpers.ts    # 运行时辅助函数
```

## compiler-sfc包 编译器层 SFC单文件组件编译器

- 作用：.vue文件的完整编译处理
- 依赖：`@vue/compiler-core， @vue/compiler-dom，@vue/shared`

```text
packages/compiler-sfc/
├── src/
│   ├── script/              # script标签处理
│   │   ├── defineEmits.ts   # defineEmits宏
│   │   ├── defineProps.ts   # defineProps宏
│   │   ├── defineExpose.ts  # defineExpose宏
│   │   ├── defineModel.ts   # defineModel宏
│   │   └── ...更多文件
│   ├── style/               # style标签处理
│   │   ├── cssVars.ts       # CSS变量处理
│   │   ├── pluginScoped.ts  # scoped CSS插件
│   │   └── preprocessors.ts # CSS预处理器
│   ├── template/            # template标签处理
│   │   └── transformAssetUrl.ts # 资源URL转换
│   ├── compileScript.ts     # script编译
│   ├── compileStyle.ts      # style编译
│   ├── compileTemplate.ts   # template编译
│   └── parse.ts             # SFC解析
```

## compiler-ssr包 编译器层 SSR编译器

- 作用：服务端渲染的编译优化
- 依赖：`@vue/compiler-core，@vue/shared`

```text
packages/compiler-ssr/
├── src/
│   ├── transforms/          # SSR转换器
│   │   ├── ssrTransformComponent.ts  # 组件SSR转换
│   │   ├── ssrTransformElement.ts    # 元素SSR转换
│   │   ├── ssrVFor.ts               # v-for SSR转换
│   │   ├── ssrVIf.ts                # v-if SSR转换
│   │   └── ...更多文件
│   ├── index.ts             # 入口文件
│   ├── ssrCodegenTransform.ts # SSR代码生成转换
│   └── runtimeHelpers.ts    # SSR运行时辅助
```

## server-renderer包 服务端渲染层 

- 作用：服务端渲染的运行时实现
- 依赖：`@vue/runtime-core，@vue/shared`

```text
packages/server-renderer/
├── src/
│   ├── helpers/             # SSR辅助函数
│   ├── render.ts            # 渲染核心
│   ├── renderToStream.ts    # 流式渲染
│   ├── renderToString.ts    # 字符串渲染
│   └── index.ts             # 入口文件
```

## vue包 用户入口层 主包

- 作用：用户的主要入口包，整合所有功能
- 依赖：几乎所有其他包
- 特点：提供完整的Vue功能

```text
packages/vue/
├── src/
│   ├── index.ts             # 主入口
│   ├── runtime.ts           # 运行时版本入口
│   └── compat.ts            # 兼容版本入口
├── compiler-sfc/           # SFC编译器重导出
├── server-renderer/        # 服务端渲染器重导出
├── jsx-runtime/            # JSX运行时
└── examples/               # 示例文件
```

## vue-compat包 用户入口层 兼容包

- 作用：提供Vue2到Vue3的兼容性支持
- 依赖：`@vue/runtime-core，@vue/shared`

```text
packages/vue-compat/
├── src/
│   ├── index.ts             # 兼容入口
│   ├── instance.ts          # 实例兼容
│   ├── global.ts            # 全局API兼容
│   └── ...更多兼容文件
```

## 总结

**包之间的依赖关系**

![包之间的依赖关系](/public/assets/学习笔记/Vue/vue包结构.png)

**各包的使用场景**

| 包名 | 使用场景 | 独立使用 |
|------|----------|----------|
| shared | 工具函数 | ❌ |
| reactivity | 响应式系统 | ✅ |
| runtime-core | 自定义渲染器 | ✅ |
| runtime-dom | 浏览器应用 | ✅ |
| runtime-test | 单元测试 | ✅ |
| compiler-core | 自定义编译器 | ✅ |
| compiler-dom | 浏览器编译 | ✅ |
| compiler-sfc | SFC编译 | ✅ |
| compiler-ssr | SSR编译 | ✅ |
| server-renderer | SSR应用 | ✅ |
| vue | 完整应用 | ✅ |
| vue-compat | Vue2迁移 | ✅ |
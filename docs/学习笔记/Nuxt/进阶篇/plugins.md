# 插件

## 1. 自动加载机制

Nuxt 3 会自动加载 plugins/ 目录下的所有插件文件（支持 .ts/.js/.mjs），并在应用启动时自动执行。

- 文件名中的 .client、.server、.global 等后缀还能控制插件的加载时机和环境（如只在客户端加载）。
- 你只需把插件文件放到 plugins/ 目录，无需在 nuxt.config.ts 里手动引入或注册。

## 2. Pinia 插件注册方式
Pinia 的插件（如 pinia-plugin-persistedstate）需要通过 $pinia.use(...) 注册到 Pinia 实例上。
在 Nuxt 3 里，推荐做法就是在插件文件里这样写：

```ts
import { defineNuxtPlugin } from '#app'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

export default defineNuxtPlugin(({ $pinia }) => {
  $pinia.use(piniaPluginPersistedstate)
})
```

- Nuxt 会自动把 $pinia 实例注入到插件上下文。
- 这样注册后，所有 Pinia store 都能自动获得持久化能力。

## 3. 推荐的原因

### 插件注册的灵活性和可维护性

- 插件文件方式：
  - 你可以在插件文件里写任意初始化逻辑（如条件注册、依赖注入、环境判断等），不仅仅是注册插件。
  - 插件文件天然支持 TypeScript 类型推断和 IDE 智能提示。
  - 插件逻辑和业务代码解耦，易于维护和复用。
- nuxt.config.ts 方式：
  - 只适合声明 Nuxt 官方支持的模块和全局配置，不适合写具体的初始化逻辑。
  - 不能灵活控制插件的加载时机和环境。

### 官方推荐的插件注册方式

- Nuxt 3 的设计理念是“约定优于配置”，插件相关逻辑都集中在 plugins/ 目录，职责单一、结构清晰。
- 插件文件可以灵活控制加载时机（如 .client 只在客户端加载），而 nuxt.config.ts 主要用于全局配置和模块声明。

### SSR/客户端环境的区分

- 有些插件（如 pinia-plugin-persistedstate）只需要在客户端生效，用 .client.ts 文件名后缀可以确保只在浏览器端注册，避免 SSR 报错或无效。
-如果在 nuxt.config.ts 里注册，无法做到这种精细的环境区分。
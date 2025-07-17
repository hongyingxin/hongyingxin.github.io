# SEO和元数据

由于 app.vue 是 Nuxt 的入口文件，缺少 index.html 文件，所以关于 head 的配置需要通过 `nuxt.config.ts` 文件配置。

```typescript
export default defineNuxtConfig({
  app: {
    head: {
      title: 'Nuxt',
    },
  },
})
```

`useHead` 组合式函数管理头部标签。
`useSeoMeta` 组合式函数以对象形式定义站点的 SEO 元数据标签。
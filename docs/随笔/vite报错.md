# Vite 报错问题

2024年12月20日

我在使用 Vite 新建一个 Vue 项目时，按照官方的配置进行设置，但在执行 `npm run dev` 时遇到了报错问题。

```javascript
X [ERROR] Expected identifier but found "import"

    (define name):1:0:
      1 │ import.meta.dirname
        ╵ ~~~~~~

X [ERROR] Expected identifier but found "import"

    (define name):1:0:
      1 │ import.meta.filename
        ╵ ~~~~~~

X [ERROR] Expected identifier but found "import"

    (define name):1:0:
      1 │ import.meta.url
        ╵ ~~~~~~
```

报错信息显示无法加载配置文件 `D:\person\my-component\vite.config.ts`，启动开发服务器时出现以下错误：

```
Error: Build failed with 3 errors:
(define name):1:0: ERROR: Expected identifier but found "import"
(define name):1:0: ERROR: Expected identifier but found "import"
(define name):1:0: ERROR: Expected identifier but found "import"
```

尝试过升级 Node 版本到 v20+，但问题依旧。降级 Node 版本到 v16.14 稳定版本时，部分插件不支持。

修改 `vite.config.ts` 文件和 `tsconfig.json` 文件也无效。

在 Google 上搜索后发现了这个问题：[GitHub Issue #4010](https://github.com/evanw/esbuild/issues/4010)。采用了其中的方案并解决了问题。

## 解决方案

### 方案1（推荐）：降级 esbuild 到 v0.24.0

```bash
npm i -D esbuild@0.24.0
```

### 方案2：在 `package.json` 中添加 `resolutions` 字段，并重新安装依赖

```json
"resolutions": {
  "esbuild": "0.24.0"
}
```

这是 esbuild v0.24.1 版本引入的一个问题，它影响了 Vite 的配置文件加载。目前降级到 esbuild v0.24.0 是最稳定的解决方案。

esbuild v0.24.1 是在 2024年2月27日发布的。这个版本引入了一个关于 `import.meta` 处理的变更，导致了与 Vite 的配置文件加载不兼容的问题。

## 具体时间线：

- esbuild v0.24.0：2024年2月26日发布
- esbuild v0.24.1：2024年2月27日发布（引入问题的版本）
- 问题报告：2024年2月28日在 GitHub 上被报告
- 当前状态：问题仍在讨论中，尚未完全解决

这就是为什么我们建议暂时使用 v0.24.0 版本，因为它是最后一个稳定且没有这个问题的版本。esbuild 团队正在处理这个问题，但目前还没有确定的修复时间。

相关 issues：[GitHub Issue #4010](https://github.com/evanw/esbuild/issues/4010)
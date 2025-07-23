---
tag:
 - Nuxt 电影
---

# Vercel 部署排错篇

我的 Movie 项目基础版已经完成，所以准备部署到 Vercel 上。Vercel 部署比较简单，甚至可以一键部署。
不过在这个过程我也是遇到很多奇奇怪怪的问题，所以在这里记录一下。

## 1. 配置错误

Vercel 日志报错：

```
Node.js process exited with exit status: 128. The logs above can help with debugging the issue
```

基本上遇到这个问题首选 AI 解决，但在 AI 帮我处理的过程中，引发了另一个新问题。

## 2. 代码无法同步

在 AI 的修改下，新增了很多配置文件，但是 Vercel 的构建还是不行。在阅读 Vercel 的文档后，在 Vercel 控制台发现 `Deployments` 中构建的分支并不是最新的分支内容，GitHub 仓库的提交没有同步过来。

随后在 GitHub 仓库中，看到了 Commit 记录中，有几个红色标志 ❌，显示：

```
All checks have failed, Vercel - Deployment failed
```

尝试在 StackOverflow 上搜索，也找不到有用的信息，部分回答指向 Vercel 的 actions 无法获取最新的代码提交内容，需要自己进行 hook 钩子配置。

我删除 Vercel 上的项目，重新导入部署，发现现在部署也不行了。于是我换了另外一个项目部署，发现可以正常部署。就把排查方向放在了自己项目上。从正常部署到部署失败，通过 commit 记录看到了 AI 新增的配置修改，于是就回滚代码，绕回了第一个错误处。

## 3. 配置错误（绕回第一个问题）

阅读了 Vercel 的文档，同时熟悉了控制台操作，发现我本地部署和线上部署都是正常的，能够进行构建打包输出。于是排查方向重点放在日志 logs 上。

在我访问页面时，日志报错：

```
-------------initializeGenres <ref *1> (此处省略)
```

这个信息是 Pinia store 中初始化数据时，打印的日志信息。于是我做了大量的边界处理，确保 store 这里正确的初始化数据。

解决了上面的报错，日志又报错：

```
heroContent Promise {
```

这个也是我在获取数据时打印的日志信息，大概原因就是请求无法正常获取到数据。接着把排查方向放到请求和 env 的配置上。

## 4. env 配置问题

在排查 env 上，我发现 `.gitignore` 中居然增加了 `.env` 文件，忽视了这个文件，项目树这个文件也是暗的。

翻阅了 [Nuxt 官方文档](https://nuxt.com.cn/docs/guide/directory-structure/env/)，也终于找到问题了，Nuxt 项目中，env 文件是默认不参与构建的，会被忽略。这也导致了 Vercel 无法获取到 env 中的配置信息。

官方推荐使用 Vercel 的环境变量来配置。但我直接使用 env 文件，修改了 `.gitignore` 文件，重新部署，这一次终于成功了。

## 5. 图片问题

在部署成功后，访问页面，发现图片无法正常显示。问题链接示例：

```
https://my-nuxy-movie.vercel.app/_ipx/w_400&f_webp&q_80/https:/image.tmdb.org/t/p/w342/3XRp7u1GTrCWBnj2pGKRZz4NA5x.jpg
```

这个问题比较容易解决，因为我配置了 image，Nuxt Image 会尝试使用 IPX 优化外部图片，但 TMDB 可能不允许跨域访问。一开始在写 Card 组件就遇到过，并且也写了 TODO 记录。

> **注意事项：**
> - IPX 处理器需要 domains 配合，但 TMDB 可能限制了域名
> - TMDB 图片提供了不同尺寸的图片，所以 nuxtImg 意义不大，此处主要是学习 nuxtImg 的用法
> - 参考文档：[Nuxt Image 文档](https://image.nuxtjs.org.cn/)

于是选择放弃使用 IPX 处理器，直接使用 TMDB 的图片地址。

## 6. 总结

至此，部署终于成功了。这一次的问题花费了大半天时间。
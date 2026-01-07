# 性能优化面试题

## 什么是首屏和白屏时间

通过`Performance API`接口获取当前页面与性能相关的信息，从而计算出首屏和白屏时间。

### 白屏时间

白屏时间（FP）是指浏览器从响应用户输入网址，到浏览器开始显示内容的时间。

白屏时间 = 地址栏输入网址回车 - 浏览器出现第一个元素。

通常认为浏览器开始渲染`<body>`标签或者解析完`<head>`标签作为白屏结束的标志。

影响白屏时间的因素：网络，服务端性能，前端页面结构设计。

计算白屏时间的代码：

```js
// 获取绘制相关的条目
const paintEntries = performance.getEntriesByType('paint');

// 获取首次绘制 (First Paint)
const fp = paintEntries.find(entry => entry.name === 'first-paint');
console.log('白屏时间 (FP):', fp ? fp.startTime : '尚未计算');

// 或者使用首次内容绘制 (First Contentful Paint)
const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
console.log('白屏时间 (FCP):', fcp ? fcp.startTime : '尚未计算');
```

**优化白屏时间**

白屏时间主要受**网络延迟**、**服务器响应**和**资源下载速度**影响。

- **网络层优化**：
  - **DNS 预解析**：通过 `<link rel="dns-prefetch" href="//example.com">` 提前解析域名。
  - **使用 CDN**：将静态资源部署到离用户更近的节点。
  - **资源压缩**：开启 Gzip 或 Brotli 压缩，减少传输体积。
- **渲染阻塞优化**：
  - **JS 异步加载**：使用 `async` 或 `defer` 加载非关键脚本，避免阻塞 HTML 解析。
- **服务端优化**：
  - **采用 SSR/SSG**：直接返回渲染好的 HTML，减少客户端渲染负担。
  - **HTTP 缓存**：合理配置强缓存和协商缓存。

### 首屏时间

首屏时间（LCP）是指浏览器从响应用户输入网址，到首屏内容渲染完成的时间。

首屏时间 = 地址栏输入网址后回车 - 浏览器第一屏渲染完成。

影响首屏时间的因素：白屏时间，资源下载执行时间。

计算首屏时间的代码：

```js
// 获取最大内容绘制 (LCP)
const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
if (lcpEntries.length > 0) {
  const lcp = lcpEntries[lcpEntries.length - 1];
  console.log('首屏时间 (LCP):', lcp.startTime);
}
```

**优化首屏时间**

首屏时间受**白屏时间**、**关键路径资源加载**以及 **JavaScript 执行效率**影响。

- **图片优化**（首屏通常包含图片）：
  - **使用现代格式**：采用 WebP 或 AVIF 格式。
  - **图片压缩**：在保证质量的前提下，尽可能减小体积。
  - **响应式图片**：使用 `srcset` 根据屏幕密度加载不同大小的图片。
  - **懒加载**：对非首屏图片使用 `loading="lazy"`。
- **关键资源预加载**：
  - **Preload**：使用 `<link rel="preload" as="image" href="...">` 提前加载首屏大图。
- **代码优化**：
  - **代码分割 (Code Splitting)**：通过动态导入减少首屏 JS Bundle 体积。
  - **Tree Shaking**：剔除无用代码。
  - **减少 DOM 节点**：减少渲染开销和 Diff 成本。
  - **减少 长任务**：避免复杂的 JS 计算阻塞主线程绘制。

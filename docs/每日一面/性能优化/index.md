# 性能优化面试题

## 什么是首屏和白屏时间

通过`Performance API`接口获取当前页面与性能相关的信息，从而计算出首屏和白屏时间。

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
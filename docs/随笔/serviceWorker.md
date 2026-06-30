# Service Worker

## 什么是 Service Worker

Service Worker 是浏览器后台运行的脚本，可以用来实现离线缓存、消息推送、后台同步等功能，属于网站的渐进增强功能。

## 特点

1. 访问 JavaScript 驱动的缓存 API，Service Worker 核心是 Cache 接口，它是一种完全独立于 HTTP 缓存的缓存机制。
2. 异步、事件驱动型 API，Service Worker 通过事件驱动型处理请求。
3. 预缓存和运行时缓存，预缓存是提前缓存资源，通过提前下载网页的静态资源存储在 Cache 实例中，提高后续网页的访问速度；运行时缓存是指在运行时从网络请求资源时将缓存策略应用于资源，保证离线访问。
4. 与主线隔离，Service Worker 类似于 Web Worker，运行在单独的线程中，不会造成主线程阻塞。

## 限制

1. Service Worker 运行在独立 worker 线程，因此无法访问 DOM、Window 对象。
2. 完全异步，Service Worker 的 API 都是异步的，因此无法使用同步 API，例如同步 XHR、Web Storage。
3. 必须在 HTTPS 环境下运行，因为 Service Worker 可以修改网络请求，容易造成中间人攻击。

## 生命周期

**注：** MDN 的生命周期为：下载、安装、激活；Chrome 的生命周期为：注册、安装、激活。

### 1. 注册

Service Worker 提供了 `register` 方法，用于注册 service worker，`register` 方法接收两个参数，第一个参数是 service worker 的脚本路径，第二个参数是 service worker 的配置对象，并返回一个 Promise 对象。

```javascript
const registerServiceWorker = async () => {
  // 检查浏览器是否支持 service worker
  if ('serviceWorker' in navigator) {
    try {
      // 注册 service worker
      const registration = await navigator.serviceWorker.register(
        'sw.js',
        {
          scope: './',
        }
      );
      if (registration.installing) {
        console.log('Service worker installing');
      } else if (registration.waiting) {
        console.log('Service worker installed');
      } else if (registration.active) {
        console.log('Service worker active');
      }
    } catch (error) {
      console.error(`Registration failed with ${error}`);
    }
  }
};

registerServiceWorker();
```

这样就注册了一个 service worker，它工作在 worker 线程中，没有访问 DOM 的权限。

### 2. 安装

当你的 service worker 注册之后，浏览器会尝试安装并激活它。`install` 事件会在注册成功之后触发，每个 service worker 仅调用一次 `install`，并且在更新之前不会再次触发。在此事件中，我们会创建一个 Cache 实例，用于缓存资源。

```javascript
const addResourcesToCache = async (resources) => {
  // 创建一个叫做 v1 的 Cache 实例
  const cache = await caches.open('v1');
  // 将资源添加到 Cache 实例中
  await cache.addAll(resources);
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    addResourcesToCache([
      "/",
      "/index.html",
      "/style.css",
      "/app.js",
      "/image-list.js",
      "/star-wars-logo.jpg",
      "/gallery/bountyHunters.jpg",
      "/gallery/myLittleVader.jpg",
      "/gallery/snowTroopers.jpg",
    ]),
  );
});
```

当安装成功之后，service worker 就会激活，但是第一次完成安装或者激活时，并没有什么用。

### 3. 激活

激活事件在两种情况下会触发：

1. 对于新的 service worker 在安装成功之后，会立即激活。
2. 另一种情况比较绕，当你有新版本的 service worker 安装成功后并不会被激活，只有当没有加载页面时，才会激活。

安装发生的时候，前一个版本依然在响应请求。新的版本正在后台安装。我们调用了一个新的缓存 v2，所以前一个 v1 版本的缓存不会被扰乱。当没有页面在使用之前的版本的时候，这个新的 service worker 就会激活并开始响应请求。

在这个生命周期中，我们一般会进行旧缓存的删除。

```javascript
self.addEventListener("activate", (event) => {
  // 这里可以添加删除旧缓存的代码
});
```

## fetch 事件

Service worker 两大核心，一个是 Cache API，用于缓存资源；另一个是 Fetch API，用于拦截网络请求。在网页获取资源时，都会触发 `fetch` 事件，我们可以通过监听 `fetch` 事件，来拦截网络请求，并返回缓存的资源。

```javascript
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

在上面代码中，我们监听了 `fetch` 事件，调用 `respondWith` 方法来劫持网络请求，然后调用 `caches.match` 方法来匹配缓存的资源，如果匹配到缓存的资源，则返回缓存的资源，否则调用 `fetch` 方法来请求网络资源。

## 缓存策略

### 1. 仅缓存

这种策略直接无视网络，只从缓存中读取数据，适合缓存静态资源(如Logo、固定的图标、基础CSS/JS)。

![Excel Image](/public/assets/w_1.png)

工作流程：请求 -> Service Worker -> 缓存。如果缓存中没有，请求就会失败。

当 Service Worker 控制页面时，匹配的请求只会进入缓存。这意味着，所有缓存的资源都需要先预缓存，然后才能使用该模式。在更新 Service Worker 之前，这些资源永远不会在缓存中更新。

### 2. 仅网络

![Excel Image](/public/assets/w_2.png)

这种与仅缓存相反，请求通过 Service Worker 传递到网络，而无需与 Service Worker 缓存进行任何交互。当用户离线时，此方法将始终无效。适合对实时性要求极高的数据，例如：余额、积分、订单状态等。

工作流程：请求 -> Service Worker -> 网络。如果网络请求失败，请求就会失败。

### 3. 先缓存，然后回退到网络

![Excel Image](/public/assets/w_3.png)

PWA最常用的策略之一，优先追求加载速度。

这是一个绝佳的策略，适用于所有静态资源（例如 CSS、JavaScript、图片和字体），尤其是采用哈希技术的算法。它通过绕过 HTTP 缓存可能启动的任何服务器的内容新鲜度检查，来提高不可变资源的速度。更重要的是，所有缓存的资源都将可以离线使用。

请求流程如下：

1. 请求命中缓存。如果资源在缓存中，请从缓存中提供。
2. 如果请求不在缓存中，请转到网络。
3. 在网络请求完成后，将其添加到缓存中，然后从网络返回响应。

### 4. 网络优先，回退到缓存

![Excel Image](/public/assets/w_4.png)

此策略非常适合存在以下情况的 HTML 或 API 请求：在线时，您需要的是资源的最新版本，但您想让其离线访问的是最新可用版本。

请求流程如下：

1. 您首先要访问网络以获取请求，然后将响应放入缓存中。
2. 如果您稍后处于离线状态，则您会在缓存中回退到该响应的最新版本。

### 5. 过时重新验证

这是用户体验最平衡的策略，它既保证了响应速度，又保证了背景更新。

![Excel Image](/public/assets/w_5.png)

在到目前为止我们介绍过的策略中，是最复杂的。从某些方面来看，它与后两种策略类似，但该过程会优先考虑对资源的访问速度，同时在后台保持最新状态。这个策略非常适合需要更新的一些重要信息，但并非至关重要。想像一下社交媒体网站的头像。这些信息会在用户进行适当操作时进行更新，但并非每个请求都绝对要求使用最新版本。

请求流程如下：

1. 第一次请求资源时，从网络中提取资源，将其放在缓存中，并返回网络响应。
2. 对于后续请求，先从缓存中提供资源，然后再“在后台”提供资源，从网络重新请求该资产并更新资产的缓存条目。
3. 在此日期之后再提交请求，您将收到从网络提取的最后一个版本（在上一步中放入缓存）。

## 调试

Application 面板中的 Service Workers 标签页是 DevTools 中检查和调试服务工作线程的主要位置。

![Excel Image](/public/assets/w_6.png)

Cache Storage 标签页提供了一个已使用（服务工作线程）Cache API 缓存的只读资源列表。

![Excel Image](/public/assets/w_7.png)

## Workbox

Workbox 是 Google 推出的一套 JavaScript 库，旨在简化 Service Worker 的开发。

Workbox 的功能模块化非常清晰，主要解决以下几个痛点：

1. 路由与策略 (Routing & Strategies)

正如你之前了解的五种策略，在 Workbox 中实现它们只需要几行代码。它提供了一个 registerRoute 方法，可以根据 URL 的正则或后缀匹配，自动应用特定的缓存策略。

2. 预缓存 (Precaching)

这是 PWA 的核心。Workbox 可以配合 Webpack、Vite 或 CLI 工具，在构建阶段自动生成一个资源清单，并在 Service Worker 安装时提前下载这些核心文件（如 index.html, app.js）。

这里需要首次联网访问页面，才能后台下载资源清单，离线可用。并不需要把所有页面都点开过才能离线访问，只需联网访问一次。

好处：确保应用在离线时也能瞬间打开。

智能更新：只有内容发生变化的资源才会被重新下载。

3. 缓存管理 (Cache Expiration)

原生 API 很难手动控制缓存的大小。Workbox 的 workbox-expiration 模块可以让你轻松设置：

数量限制：缓存最多保留 50 张图片。

时间限制：缓存有效期为 30 天，过期自动清理。

4. 后台同步 (Background Sync)

如果你在离线时发送了一个 POST 请求（比如发帖或点赞），workbox-background-sync 会把请求排队，并在用户恢复网络连接时自动重新发送，确保数据不丢失。

### 更新

在 Workbox 生态下，Server Worker 的更新机制本质上依旧遵循浏览器的标准生命周期，但 Workbox 通过自动化构建和运行时的机制，极大地简化了资产比对和激活控制的流程。

Workbox 的更新和激活动态主要可以分为以下四个阶段：

1. 触发检查

浏览器会自动检查 Server Worker 的更新。但需要注意的是：浏览器检查更新是去请求 sw.js 文件，如果设置了强缓存，浏览器会直接从缓存中读取，不会去请求服务器。

2. 资产对比与文件哈希

Workbox 最核心的能力之一就是 预缓存 机制。

构建时生成清单：当你运行打包命令（vite-plugin-pwa）时，Workbox会扫描打包产物，并生产一份包含文件路径和内容哈希的清单，自动注入到 sw.js 中。

```js
// 自动生成的预缓存清单
workbox.precaching.precacheAndRoute([
  { url: '/index.html', revision: 'a1b2c3d4' },
  { url: '/assets/index.js', revision: 'e5f6g7h8' }
]);
```

当我们修改后重新打包，文件的 hash 值就会发生变化，浏览器检测到 sw.js 字节不同，就会立刻判定 Server Worker 有更新，并下载新脚本，触发 install 事件。

3. 安装与等待阶段

新 SW 下载后，会进入 install （安装）阶段。

Workbox 接管 install 事件，重新下载资源文件，当所有新资产下载完毕后，新 SW 会进入 installed (已安装)状态，并在后台等待（Waiting）。因为此时旧的 SW 还在控制着当前打开的页面。为了防止由于“新 SW 引入了新结构，而旧页面还在运行”导致页面崩溃，浏览器默认会让新 SW 处于等待状态，直到用户关闭所有相关标签页后，旧 SW 被销毁，新 SW 才会正式激活。

4. 激活与覆盖更新

让新 SW 在后台等，前端检测到等待状态后，弹窗提示用户手动控制刷新。

前端代码监听 sw.js 的生命周期状态

```js
// 注册 Service Worker 时
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then((reg) => {
    // 监听等待状态的 SW
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      newWorker.addEventListener('statechange', () => {
        // 当新 SW 下载完并进入 waiting 状态时
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // 💡 触发前端弹窗：提醒用户“检测到新版本，请点此刷新更新”
          showUpdateToast(() => {
            // 用户点击刷新后，向新 SW 发送跳过等待的信号
            newWorker.postMessage({ type: 'SKIP_WAITING' });
          });
        }
      });
    });
  });

  // 监听控制权更替，一旦新 SW 接管，立刻刷新页面
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}
```

SW 内部接收信号

```js
// sw.js 内部
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
```
总结

Workbox 在构建时通过扫描资产，将带有内容 Hash 的预缓存清单注入到 sw.js 中。当代码变动导致 sw.js 字节改变时，浏览器就会触发更新。

在运行时的 install 阶段，Workbox 会增量下载变更的资产。为了确保线上安全更新，我们在项目中没有采用激进的 skipWaiting，而是在主线程监听 SW 的等待状态，当新 SW 进入 waiting 状态时，前端弹出提示框引导用户确认，用户点击后通过 postMessage 触发 SKIP_WAITING 并结合 controllerchange 事件实现页面的无缝静默刷新。

### 五种缓存策略

1. Stale-While-Revalidate（过时同步 / 边用边刷）

工作原理： 当浏览器发起请求时，Workbox 会同时去查缓存和走网络。但它会优先把本地现有的旧缓存立刻返回给用户（实现秒开），如果网络请求成功拿到了新数据，SW 会在后台默默更新本地缓存。

因果结果： 用户这次看到的是旧数据，但下一次访问时，看到的就是最新数据。

适用场景： 时效性要求不高，但对加载速度极其敏感的资产。如网站首页 HTML、新闻列表、社交媒体 Feeds、用户的头像等。

2. Cache First

工作原理： 浏览器发起请求，Workbox 率先去查缓存。

  如果缓存有：直接返回，完全不走网络（0ms 响应）。

  如果缓存没有：再去走真实网络请求，拿到数据后存入缓存，并返回给用户。

适用场景： 体积大、基本不怎么变动的静态资产。如第三方字体文件、核心 UI 图片、不带 Hash 的公共基础 JS 库。

3. Network First

工作原理： 浏览器发起请求，Workbox 会优先尝试走网络获取最新数据。

  如果网络通畅：获取新数据，展示给用户，并静默更新本地缓存。

  如果网络断开或超时（离线/弱网）：立刻进入降级机制，去本地缓存里捞出上一次的数据展示给用户。

适用场景： 对数据实时性要求极高，但又需要做离线兜底的场景。如商品的价格列表、用户的账户余额、订单状态、以及各种核心业务 API。

4. Network Only

工作原理： 比较直接。Service Worker 拿到请求后不做任何拦截和缓存操作，直接转发给真实网络。网络断了，请求就直接失败。

适用场景： 绝对不能缓存的数据。如非 GET 请求（POST 提交表单、DELETE、PUT 操作）、非同源的支付接口、或者带有敏感隐私信息的实时金融数据。

5. Cache Only

工作原理： 只从缓存里读数据。如果缓存里没有，直接报 404 错误，绝对不走网络。

适用场景： 配合 Pre-caching（预缓存） 使用。比如你在构建时就已经把一套完整的离线皮肤包、或者本地离线地图数据强制写入了缓存，运行时只需通过 Cache Only 去读取这批现成的资产。

## PWA

PWA (Progressive Web App)，全称“渐进式 Web 应用”。把网页包装成一个APP。

1. 可靠

通过 Service Worker 实现。即便断网或网络极差，应用也能秒开。

2. 快速

由于资源都在本地缓存，消除了网络延迟，交互非常流畅，没有白屏等待。

3. 沉浸式体验

- Manifest (清单文件)：一个 JSON 文件，定义了应用的图标、启动页颜色。

- 可安装性：在 Chrome 或 Safari 上，你可以点击“添加到主屏幕”。它会像 App 一样有个图标，点开后没有浏览器地址栏，全屏运行。

- 推送通知：像原生 App 一样给用户发消息。

## 拓展

### Service Worker 和 Web Worker 的区别

Service Worker 和 Web Worker 是两种不同的浏览器技术，尽管它们都运行在独立的线程中，但它们的用途和特性有显著的区别：

1. Service Worker 主要用于拦截和处理网络请求，支持离线缓存、消息推送、后台同步等功能。适用于增强网页的性能和用户体验，特别是在网络不稳定或离线的情况下。
2. Web Worker 用于在后台线程中执行 JavaScript 代码，主要用于处理计算密集型任务，以避免阻塞主线程。适合需要并行处理的任务，如复杂计算、数据处理等。

### Service Worker 缓存 和 HTTP 缓存的区别

Service Worker 缓存和 HTTP 缓存都是用于存储和管理资源的机制，但它们在控制、灵活性、持久性和作用范围上有显著的区别。

1. Service Worker 缓存通过 Cache API 明确控制，提供了极高的灵活性。可以精确地决定哪些资源需要缓存、何时更新缓存，以及如何响应请求。通过拦截 fetch 事件，Service Worker 可以动态决定是从缓存中提供资源还是从网络获取，支持复杂的缓存策略，如优先缓存、网络优先、过时重新验证等。此外，Service Worker 缓存的数据可以在浏览器关闭后仍然存在，直到被明确删除，但它仅在注册的 Service Worker 控制的范围内生效。
2. HTTP 缓存由服务器通过 HTTP 头（如 Cache-Control、Expires、ETag 等）控制，客户端浏览器根据这些头信息自动管理缓存。虽然 HTTP 缓存策略相对固定，主要依赖于服务器提供的缓存指令，但它适用于所有请求，不限于特定的页面或范围。HTTP 缓存的数据通常在浏览器关闭后仍然存在，但可能会受到浏览器的缓存清理策略影响。

## 参考

- [Service_Worker_API](https://developer.mozilla.org/zh-CN/docs/Web/API/Service_Worker_API)
- [workbox](https://developer.chrome.google.cn/docs/workbox/service-worker-overview?hl=zh-cn)
- [devtools](https://developer.chrome.google.cn/docs/devtools/application?hl=zh-cn)


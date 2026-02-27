# AI工具开发遇到问题

在写一个AI工具，前端使用React，后端使用Next.js。这里记录下开发过程中遇到的问题及解决方案。

## 墙的问题

因为 Gemini 在国内无法访问，需要使用代理。但是项目使用了 Node 发送请求，无法走本地 VPN，需要代码显式配置或者修改 IP 映射。同时考虑到后面部署也存在这个问题，就研究出一套解决方案：**Cloudflare Workers**

Cloudflare 是一家全球网络服务商，提供 CDN、DNS、WAF、DDoS 防护、AI 代理等服务。这里我们使用到它的 Workers 服务。

使用 Workers 的好处是：它可以避开国内无法直接访问 gemini.google.com 的问题。因为 Workers 运行在 Cloudflare 的全球节点上，相当于一个海外代理，而且比 Page Rules 更强大。

- 1. 创建 Worker 脚本

  - 注册并登录 Cloudflare 控制台，点击左侧的“Workers & Pages”

  - 点击“创建应用程序”，选择“Hello World”模板，删除原有代码，粘贴以下代码：

  ```javascript
  export default {
    async fetch(request, env, ctx) {
      const url = new URL(request.url);
      // 将你的子域名请求转发到 Gemini 官网
      url.host = 'gemini.google.com';
      
      const newRequest = new Request(url.toString(), {
        method: request.method,
        headers: request.headers,
        body: request.body,
        redirect: 'follow'
      });

      return fetch(newRequest);
    },
  };
  ```

  - 点击保存并部署版本。

- 2. 绑定子域名

  - 代码部署好后，需要把这个脚本挂载到自己的域名上

  - 回到刚才创建的 Worker 页面，点击“设置”，在域和路由点击“添加”，添加自定义域

  - 输入我们的子域名 "ai.hongyingxin.com"，保存。因为 Cloudflare 会自动添加 DNS 解析记录

- 3. 修改 DNS 解析

  - 在 Cloudflare 控制台，点击左侧的“域”选项，选择“加入域”，添加 "hongyingxin.com" 域名，

  - 然后点击我们的域名进入域名配置，点击右侧的“DNS”，进入记录页面，向下滚动找到 Cloudflare 名称服务器，获取到两个 DNS 地址

  - 在阿里云域名控制台，找到 "hongyingxin.com" 域名，点击进行 DNS 管理下面的 DNS 修改，修改 DNS 服务器，修改为自定义 DNS 并添加上面提到的两个地址，保存同步。

到此，我们的配置就完成了。阿里云通过修改 DNS 记录，交出所有权限到 Cloudflare。

以后增加子域名等操作到 Cloudflare 上配置，阿里云则负责端口等安全组。

访问网站路线图如下：

- 用户浏览器 访问 ai.hongyingxin.com。
- 根域名服务器 问阿里云：“这个域名归谁管？”
- 阿里云 回答：“我只负责收钱，解析请去问 Cloudflare。” (这就是你改 NS 的作用)
- Cloudflare 接手：“ai 这个子域名在我这里有记录，它是一个 Worker，请执行以下代码...”
- 结果：页面成功打开。

## 模块化架构

采用Module-first架构

按功能模块进行文件夹划分，心智负担低，更强的可扩展性，利于重构。

与之前按文件类型划分的架构不同，pages放所有的页面，components放所有的组件，当项目变大，component文件夹会有几百个文件

## 面试生成报错速度慢的问题

在面试结束生成报告时，因为需要完整的上下文加上分析，导致接口数据非常慢。

1. 这里采用了流式响应，generateContentStream替换generateContent，后端通过sse推送给前端，（接口）
前端不再等待fetch完成，而是读取response.body（前端）

页面上不再显示loading，增加了一个预览状态，报告没有解析出来前，用户能看到一个代码滚动的效果，实时显示AI正在生成的JSON源码（界面）

2. 替换gemini-2.5-pro为gemini-2.5-flash，启动和生成速度提高5倍，

## SDK遇到的问题

### Gemini要求对话历史的第一条消息必须是user

使用`systemInstruction`。这是最优雅的做法，不需要在history里伪造第一句话，而是把这些放在系统提示词里。

### 关键参数配置

generationConfig参数对象

```js
{
  stopSequences: ["用户:"],   // 遇到这个词就强制停止
  candidateCount: 1,         // 每个问题生成的答案数量
  maxOutputTokens: 2048,     // 限制回复长度
  temperature: 0.7,          // 采样温度：0.0 严谨，1.0 奔放
  topP: 0.95,                // 核采样
  topK: 40,                  // 采样候选集大小
  responseMimeType: "application/json" // 2026年主流：强制要求返回 JSON
}
```

## 页面刷新后404问题

前端使用了`React Router`的History模式下，页面刷新后404问题。

这里去修改`Nginx`的配置，通过配置请求转发策略`try_files`解决问题。

**原理：** 

刷新时404，浏览器真的去向服务器请求`https//.../interview/setup`这个文件，但`Nginx`发现在`var/jenkins_home/deploy_web`目录下根本没有这个文件夹，所以就报错了。

通过`try_files`配置，如果请求的文件不存在，则重定向到`index.html`文件。

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

这样，当页面刷新时，就会重定向到`index.html`文件，从而解决问题。  

## 对话记录和历史记录方案

在很多AI对话的场景里，都会有对话记录和历史记录的需求。这个需求如何实现，在AI工具的开发中，我采用了下面的解决方案：

当我们有多个对话记录以及切换对话后希望能确保对话的上下文一致性，采用了“全量历史回传”和“SDK会话初始化”相结合的机制。

**1. 前端：完整的消息链维护**

在ChatPage.tsx中，维护了一个名为messages的状态数组

发送请求时：每次点击发送，前端并不仅仅发送当前这一条消息，而是将当前会话中所有的历史消息封装成一个数组historyWithUser

持久化：这个数组被完整地保存在IndexDB中。当切换会之前的会话时，会从数据库加载这个完整的数组，确保下一条消息发出去时，依然带着最原始、最完整的历史。

**2. 后端：历史记录的格式化**

在AIController.js中，接收到前端传来的messages数组后，会进行如下处理，这一步确保了发送给Google API的数据结构是严格遵循对话顺序的。

```js
// 排除最后一条作为当前输入，其余全部转化为 Gemini SDK 要求的历史格式
const history = messages.slice(0, -1).map(m => ({
  role: m.role, // 'user' 或 'model'
  parts: [{ text: m.content }],
}));

const currentMessage = messages[messages.length - 1].content;
```

**3. SDK：启动有状态会话**

这是最关键的一步。利用Goodle Gemini SDK提供的 startChat 方法，启动一个有状态的会话。

```js
const model = this.geminiClient.getModel({ model: modelId });
// 使用之前的 history 初始化会话
const chat = model.startChat({ history });
// 在这个有“记忆”的会话中发送当前消息
const result = await chat.sendMessageStream(currentMessage);
```

我并没有让后端或AI侧去存储状态（这在无状态的REST API中很难保证稳定），而是每次请求都把“剧本”历史记录重新传递给AI看一遍。

这样做的优缺点：

- 优点：绝对一致。无论你刷新多少次页面，只要 IndexedDB 里的消息没变，递给 AI 的“剧本”就是一样的，它的理解就不会产生偏差。

- 缺点：随着对话变长，每次发送的 Token 数量会增加（因为历史记录也要占 Token）。

>注：目前市面上几乎所有的 Web 类 Chat 产品（如 ChatGPT、Gemini 官网）在底层都是通过这种回传历史记录的方式来实现上下文记忆的。

## 图片识别功能方案

在AI对话中，除了简单的文本对话，还需要支持图片识别功能。这个功能主要使用`Gemini`的多模态能力。

**整体流程设计**

图片识别作为Chat模块对话上下文的一部分。

- 1. 前端采集：用户通过拖拽、粘贴或点击按钮选择图片。

- 2. 前端预览与压缩：在发送前展示预览图，并进行必要的压缩（Gemini 对图片大小有建议，通常不需要超大图）。

- 3. 数据传输：将图片转为 Base64 编码（或通过 FormData 上传文件），随同文字 Prompt 一起发送给后端。

- 4. 后端处理：后端 NestJS 接收到请求，将图片数据封装成 Gemini SDK 要求的 inlineData 格式。

- 5. AI 推理：调用 Gemini 2.0 模型，利用其视觉能力进行分析。

- 6. 结果返回：通过流式（Stream）将识别和分析结果实时返回给前端。

**具体实现**

- 1. 前端交互

    - 输入框增强：在 ChatPage.tsx 的输入框左侧增加一个“图片”图标按钮。

    - 粘贴支持：监听 onPaste 事件，支持用户直接 Ctrl+V 粘贴截图。

    - 预览卡片：在输入框上方显示待发送图片的缩略图，并提供“删除”按钮。

    - 消息展示：对话记录中，用户发送的消息应包含图片缩略图，点击可查看大图。

- 2. 数据接口说明

Gemini SDK 要求图片数据格式为 inlineData，需要将图片转为 Base64 编码。以如下格式发送

```js
{
  inlineData: {
    data: "base64_string...",
    mimeType: "image/jpeg"
  }
}
```
我们需要在 apps/web/src/modules/chat/api.ts 中扩展 ChatMessage 的定义，支持包含图片附件。

- 3. 后端逻辑

在 AiController 中，我们需要调整处理逻辑。Gemini 2.0 的 generateContent 方法支持混合输入（文本块 + 图像块）：

```js
const result = await model.generateContent([
  "请分析这张图片中的内容并回答：这是什么？", // 文本 Prompt
  {
    inlineData: {
      data: Buffer.from(file).toString("base64"),
      mimeType: "image/png"
    }
  }
]);
```

## 配置 Key 解决方案

AI 项目需要支持用户提供自己的 **API Key**。

前端设计比较简单：用户在设置界面填入 API Key，点击保存后，前端将其保存到 `localStorage` 中，后续发起请求时在 `Header` 中携带。

后端则需要新增一个接口来确定 Key 是否有效，这里借助官方提供的模型接口来校验。

比较麻烦的点是如何动态切换 Key，因为一开始的 `onModuleInit` 单例模式不再适用，在调研后总结了三种方案：

**方案一：显式参数传递**

这个方案不再依赖于 `this.genAI` 这个单例属性，而是将 API Key 作为参数传给 `Service` 方法，然后从请求头获取 Key 并传给具体方法。

```js
// gemini-client.service.ts
async generateText(prompt: string, customApiKey?: string) {
  // 如果有 customApiKey 就用它，没有就用环境变量里的
  const client = customApiKey 
    ? new GoogleGenerativeAI(customApiKey) 
    : this.defaultGenAI; // defaultGenAI 在 onModuleInit 初始化
  
  const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
  // ...
}

@Post('chat')
async chat(@Body() body: any, @Headers('x-gemini-api-key') apiKey?: string) {
  return this.geminiService.generateText(body.prompt, apiKey);
}
```

这种方案逻辑清晰，但是需要修改的地方比较多，工程量大，而且调用链路深的话每一层都需要透传 API Key，代码显得冗长。

**方案二：使用 Request Scope**

将 `Service` 声明为 `Scope.REQUEST` 作用域，这样每次请求都会创建一个新的 `Service` 实例，从而实现动态切换 Key。

```js
@Injectable({ scope: Scope.REQUEST })
export class GeminiClientService {
  private client: GoogleGenerativeAI;

  constructor(
    @Inject(REQUEST) private request: Request,
    private configService: ConfigService
  ) {
    // 构造函数里直接处理
    const apiKey = this.request.headers['x-gemini-api-key'] as string;
    const finalKey = apiKey || this.configService.get('GEMINI_API_KEY');
    this.client = new GoogleGenerativeAI(finalKey);
  }

  async generateText(prompt: string) {
    // 直接使用 this.client，不需要关心 key 是哪来的
    const model = this.client.getGenerativeModel({ model: "..." });
  }
}
```

这种方法虽然免去传参问题，但是性能开销大，每个请求都需要重新创建一个 `Service` 以及依赖的 `Model` 实例，性能不如方案一。

**方案三：使用 AsyncLocalStorage (ALS)**

这是目前 Node.js 社区处理“请求上下文”最优雅的方式（类似 Java 的 `ThreadLocal`）。

具体实现逻辑如下：

- 创建一个中间件（`Middleware`），拦截所有请求。
- 从 `Header` 提取 API Key 并存入 `ALS`。
- `Service` 内部通过 `ALS` 获取 API Key。

这种方法既不需要层层透传参数，也不需要 `Request Scope` 的高性能开销。只是实现稍微复杂一点，需要配置中间件。

本项目也是采用这种方案，原因如下：

1. **侵入性极低**：你不需要修改 `InterviewService`、`AiController` 或者任何调用了 `GeminiClientService` 的地方。它们依然像以前一样调用方法，Key 在背后自动流转。
2. **无状态**：`Service` 依然是单例，我们只是在执行具体方法时，根据当前执行栈的“上下文”来选择 Key。
3. **可扩展性**：如果你以后想增加“用户自定义模型版本”、“用户自定义 `Temperature`”，都可以直接塞进 `RequestContext`。

### 具体实现

**1. 创建 Context 模块**

首先需要一个地方来定义 `AsyncLocalStorage` 实例。这个实例应该在整个应用中是单例的。

```js
// apps/api/src/common/context/request-context.ts
import { AsyncLocalStorage } from 'async_hooks';

export interface IRequestContext {
  apiKey?: string;
  // 以后还可以存 userId, traceId 等
}

export const requestContext = new AsyncLocalStorage<IRequestContext>();
```

**2. 实现中间件**

中间件负责在请求进来时，从 `Header` 提取 Key 并“开启”存储空间。

```js
// apps/api/src/common/middleware/context.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { requestContext } from '../context/request-context';

@Injectable()
export class ContextMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    const apiKey = req.headers['x-gemini-api-key'];
    
    // 关键点：将后续的所有执行流包裹在 requestContext.run 中
    requestContext.run({ apiKey }, () => {
      next();
    });
  }
}
```

**3. 重构 GeminiClientService**

这是最优雅的地方：`Service` 不再需要改动任何方法签名（参数），它只需要从“环境”中取 Key。

```js
// apps/api/src/modules/ai/gemini-client.service.ts
import { requestContext } from '../../common/context/request-context';

@Injectable()
export class GeminiClientService {
  // ... 之前的 defaultGenAI 初始化逻辑 ...

  private getClient(): GoogleGenerativeAI {
    // 自动从当前请求上下文中获取 Key
    const context = requestContext.getStore();
    const customApiKey = context?.apiKey;

    if (customApiKey) {
      return new GoogleGenerativeAI(customApiKey);
    }
    return this.defaultGenAI;
  }

  async generateText(prompt: string) {
    // 方法参数依然很干净，不需要显式传 Key
    const client = this.getClient();
    const model = client.getGenerativeModel({ model: "..." });
    // ...
  }
}
```

**4. 注册中间件**

在 `AppModule` 中应用此中间件。

```js
// apps/api/src/app.module.ts
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ContextMiddleware)
      .forRoutes('*'); // 拦截所有路由
  }
}
```

## 配置模型方案

与配置 Key 一样，系统需要支持用户自定义选择 AI 模型。

后端的方案与之前的 Key 配置一致。前端部分做了进一步优化，将模型列表放入缓存中，采用 **SWR (Stale-While-Revalidate)** 模式。

具体流程如下：

1. **读取缓存**：组件加载时，优先从 `localStorage` 读取并展示模型列表。
2. **后台验证**：同时发起 API 请求获取最新列表。
3. **静默更新**：如果 API 返回的列表与缓存不同，则更新 UI 并同步到缓存。
4. **强制刷新**：只有在 API Key 变更（保存或清除）时，才强制显示加载状态并完全更新缓存。

在 `useState` 初始化时，直接从 `localStorage` 读取模型列表，如果列表不存在，则从后端获取。这意味着当用户切换到设置页面时，模型列表会立即显示，不再有加载动画的闪烁。页面加载时，如果有缓存，会先展示缓存内容，并在后台静默发起请求校验。如果模型列表有变化，UI 会自动平滑更新。

**缓存失效时机**：在保存新 Key 和还原默认时。强制移除旧缓存并显示 `Loading`，确保获取的是新 Key 对应的模型列表。

## AI 会话支持 Markdown 格式和代码高亮

在常见的 Chat 会话中，少不了代码高亮和文档解析。因此 AI 项目也需要实现该功能。这里主要使用了 React 的第三方插件 `react-markdown` 和 `react-syntax-highlighter`。

通过创建通用 Markdown 组件，可以支持 Markdown 格式和代码高亮。实现以下功能点：

- **代码高亮**：支持多种编程语言的语法高亮，并采用了优雅的 `oneLight` 主题。
- **深度定制样式**：针对 `h1/h2/h3` 标题、列表、引用块（`Blockquote`）和行内代码进行了视觉优化，确保与全站 UI 风格一致。
- **GFM 支持**：通过 `remark-gfm` 插件支持了表格、任务列表、删除线等 GitHub 特色语法。

集成到 `ChatPage` 模块中后，AI 回复会自动渲染为美观的 Markdown 格式，用户发送的消息则保留为纯文本渲染。

### 后续优化

由于 `react-syntax-highlighter` 的依赖包体积较大，全局引入后的体积高达 2MB，因此这里采用了按需引入的方式，只引入常用的编程语言语法高亮，并将完整的 `Prism` 改为 `PrismLight`。

```js
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
// 导入需要的语言，减少打包体积
import js from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import ts from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown';
// 注册语言
SyntaxHighlighter.registerLanguage('javascript', js);
SyntaxHighlighter.registerLanguage('js', js);
SyntaxHighlighter.registerLanguage('typescript', ts);
SyntaxHighlighter.registerLanguage('ts', ts);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('py', python);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('css', css);
SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('sh', bash);
SyntaxHighlighter.registerLanguage('markdown', markdown);
SyntaxHighlighter.registerLanguage('md', markdown);
```

## Service Worker 支持

AI 项目想引入 Service Worker 来实现离线缓存，本次主要围绕“加速加载”和“离线体验”这两个核心目标展开。

因为是 Vite 脚手架，所以这里使用了 `vite-plugin-pwa` 插件，自动生成 Service Worker 文件，并配置了相关参数。其核心原理是采用 Chrome 的 `Workbox` 库，简化了 Service Worker 的编写。

### 实现思路

- **1. 预缓存静态资源**：在 Service Worker 安装阶段，提前缓存所有静态资源，包括 HTML、CSS、JavaScript、图片等。
- **2. 离线回退**：当用户完全断网时，Service Worker 会拦截请求，并返回缓存的资源。
- **3. 运行时缓存**：主要针对 API 请求和第三方资源。由于 `Gemini API` 需要实时响应，这里不使用缓存，只对字体、图片等资源使用缓存。

### 具体实现

**1. 核心依赖引入**

在 `apps/web` 下安装 `vite-plugin-pwa` 插件。该插件基于 `Workbox`，提供了开箱即用的 Service Worker 生成和配置能力。

**2. Service Worker 配置 (Vite Config)**

修改 `apps/web/vite.config.ts`：

配置 `VitePWA` 插件。

策略选择：`registerType: 'autoUpdate'` (自动更新，简化用户流程)。

资源预缓存：配置 `globPatterns` 匹配 `**/*.{js,css,html,ico,png,svg}`，确保核心应用代码被缓存。

导航回退：设置 `navigateFallback: 'index.html'`，确保 SPA 路由（如 `/chat`）在离线刷新时能加载主应用。

运行时缓存：配置 `runtimeCaching` 策略，缓存 Google Fonts 或其他必要的 CDN 资源（如有）。

**3. 应用层适配**

- **入口文件注册**：在 `apps/web/src/main.tsx` 或 `App.tsx` 中无需手动编写复杂注册代码，插件会自动注入注册脚本（基于配置）。
- **离线提示 UI**：
    - 创建 `apps/web/src/shared/components/OfflineBanner.tsx` 组件。
    - 使用 `navigator.onLine` 和 `window.addEventListener('online'/'offline')` 监听网络状态。
    - 当检测到离线时，在页面顶部显示醒目的提示条："当前处于离线模式，功能受限"。

- **API 请求优化**：
    - 修改 `apps/web/src/shared/api/client.ts`。在发起请求前检查网络状态，若离线则直接抛出 "网络未连接" 错误，避免无效等待。

**4. 验证方案**

使用 Chrome DevTools -> Application -> Service Workers 面板测试：

- 勾选 "Offline" 模拟断网。
- 刷新页面，验证应用是否能正常加载（从 Service Worker 读取）。
- 验证 API 请求是否被拦截并提示。

这里遇到一个bug，在离线模式下，`onLine/offline` 事件无法正确监听网络事件，因为我们返回了缓存资源，所以需要发起一次 `fetch` 请求静态资源来判断网络状态。

## 流式响应具体实现

流式响应主要用于面试反馈报告的生成。由于AI生成完整的评估报告需要较长时间，如果采用传统的一问一答模式，用户等待时间过长。

SSE是基于HTTP的一种轻量级、只读的通信协议。它规定了数据格式Content-Type 必须是 text/event-stream，报文格式必须以data:开头，以\n\n两个换行符结尾，并且它是长连接，需要显式断开。

**核心思想：**AI每产出一个字或者一个数据块，后端就立即将其推送给前端，前端实时更新界面。

### 后端实现

后端通过SSE(Server-Sent Events)技术实现流式推送

**控制器层：**使用NestJs提供的@Sse()装饰器定义一个SSE接口。它要求返回一个Observable(响应式流)。

```js
// apps/api/src/modules/interview/interview.controller.ts
@Post('feedback/stream')
@Sse()
getFeedbackStream(@Body() body: any) {
  return this.interviewService.getFeedbackStream(body.history, body.config);
}
```

**服务层：**调用 Google Gemini API 的 generateContentStream 方法获取原始 AI 流，并将其封装成RxJS 的 Observable 发送给前端

```js
// apps/api/src/modules/interview/interview.service.ts
// 调用 Gemini 的流式接口
const result = await evaluationModel.generateContentStream(prompt);

return new Observable((subscriber) => {
  (async () => {
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      // 以 SSE 要求的格式发送数据块
      subscriber.next({ data: { text: chunkText } } as MessageEvent);
    }
    subscriber.complete();
  })();
});
```

### 前端实现

为传统的 EventSource 只支持GET请求和没法自定义Header，使用WebSocket不适合这种场景，所以前端使用了原生的 fetch API 结合 ReadableStream 来手动解析流数据。

与axios.get()和response.json()不同，它们在底层其实也用了 reader，直到所有的二进制数据都下载完了才一次性返序列化，而response.body.getReader()能提前拿到数据

**API 封装：**在 client.stream 方法中，通过 response.body.getReader() 读取二进制，并使用 TextDecoder 解码成字符串。为了处理粘包与拆包问题，我们创建了一个缓冲区，通过“拼接+寻找边界+截取与循环”解决这个问题

```js
// apps/web/src/shared/api/client.ts
const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = '';
while (true) {
  const { done, value } = await reader.read(); // 读取一块数据
  if (done) break;
  buffer += decoder.decode(value, { stream: true });
}
```

**业务调用：**

```js
// apps/web/src/modules/interview/api.ts
getFeedbackStream: async (history, config, onChunk) => {
  let fullText = '';
  await client.stream('/ai/feedback/stream', { history, config }, (chunkText) => {
    fullText += chunkText; // 累加文本
    onChunk(fullText);     // 更新 UI 状态
  });
  return fullText;
}
```
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

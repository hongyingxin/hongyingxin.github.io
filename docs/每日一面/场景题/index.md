# 场景题

## 1. 你参与过哪些前端基建方面的建设？

1. 项目架构

    - 目录结构：定义项目文件和目录的组织结构，确保项目的可维护性和可扩展性

    - 代码规范：统一代码风格和规范，使用ESlint、Prettier等工具进行代码检查和格式化

    - 模块化：采用模块化设计，将代码拆分为独立的模块，提高可重用性和可维护性

    - 脚手架：自动生成项目的基础结构，包括目录结构、配置文件、示例代码

2. 构建工具和配置

    - 构建工具：使用工具如Webpack、Vite、Rollup等进行项目的构建和打包

    - 配置管理：配置构建工具以支持各种功能，如代码分割、热重载、环境变量等

    - 优化：配置代码压缩、缓存策略、Tree Shaking等，提升构建产物的性能和效率

3. 开发环境

    - 开发服务器：设置本地开发服务器，支持热重载和调试功能

    - 环境配置：管理开发、测试、生产环境的配置和变量

4. 包管理

    - 依赖管理：使用npm、yarn或pnpm等工具管理项目依赖，确保依赖版本一致性

    - 发布管理：管理和发布自定义的npm包或组件库

5. 自动化流程

    - CI/CD：配置持续集成（CI）和持续部署（CD）流程，自动化构建、测试和部署

    - 测试：集成单元测试、集成测试和端到端测试工具，如Jest、Cypress等，确保代码质量

6. 代码质量

    - 静态分析：使用ESlint、TSLint等工具进行代码静态检查

    - 测试覆盖率：监控测试覆盖率，确保关键字代码路径被充分测试

7. 文档

    - 代码文档：编写和维护项目文档，包括API文档、开发指南和使用说明

    - 自动化文档生成：使用工具如Storybook、JSDoc等生成组件库和API文档

8. 组件库

    - 设计系统：构建和维护一套一致的设计系统和组件库，提高开发效率和界面一致性

    - 共享组件：创建和管理共享组件，促进代码复用

9. 性能优化

    - 前端性能：优化页面加载速度、响应时间和渲染性能

    - 网络请求：管理和优化网络请求策略，减少请求次数和数据传输量

10. 安全

    - 安全最佳实践：遵循前端安全最佳实践，如防范XSS和CSRF攻击

    - 敏感数据保护：确保敏感数据不被暴露或滥用

## 2. 网页如何禁止别人移除水印

为了防止水印被删除，可以利用 MutationObserver API 监听 DOM 变化。MutationObserver 可以监控 DOM 树的变化并触发回调函数。回调函数可以用于检测水印是否被移除，并采取相应的措施进行恢复。

## 3. 排除页面白屏问题

用户访问页面白屏可能由多种原因引起，以下时一些可能的原因和排查步骤：

1. 网络问题：用户的网络连接可能存在问题，无法正确加载页面内容。可以要求用户检查网络连接，或者自己尝试载不同网络环境下测试网页的加载情况
2. 服务端问题：服务器未正确响应用户请求，导致页面无法加载。可以检查服务器的状态、日志和错误信息，查看是否有任何异常。同时，可以确认服务器上的相关服务是否正常运行
3. 前端代码问题：页面的前端代码可能存在错误或异常，导致页面无法正常渲染。可以检查浏览器额开发者工具，查看是否有任何错误信息或警告。同时，可以尝试将页面的JavaScript、CSS和HTML代码分离出来进行单独测试，以确定具体的问题所在
4. 浏览器兼容性问题：不同浏览器对于某些代码的支持可能不一致，导致页面载某些浏览器中无法正常加载。可以尝试在不同浏览器中测试页面的加载情况，同时使用浏览器的开发者工具检查是否有任何错误或警告
5. 第三方资源加载问题：页面可能依赖于某些第三方资源（如外部脚本、样式表等），如果这些资源无法加载，可能导致页面白屏。可以检查网络请求是否正常，是否有任何资源加载失败的情况
6. 缓存问题：浏览器可能在缓存中保存了旧版本的页面或资源，导致新版本无法加载。可以尝试清除浏览器缓存，或者通过添加随机参数或修改文件名的方式强制浏览器重新加载页面和资源
7. 其它可能原因：页面白屏问题还可能由于安全策略（CSP、CORS）限制、跨域问题、DNS解析问题等引起。可以使用浏览器的开发者工具检查网络请求和错误信息，查找可能额问题。

## 4. 低代码平台的页面数据结构该如何设计

低代码平台中的页面数据结构设计至关重要，它承载了页面的所有元素、布局、属性、样式、交互等内容。这一数据结构应该简洁、灵活、可扩展，以支持不同的页面需求、动态渲染、版本控制、状态管理等场景。

**页面数据结构的设计原则：**

1. 结构化清晰：数据结构应该明确反映出页面的布局、组件的嵌套关系等
2. 灵活扩展：支持多种组件类型和功能的动态扩展
3. 性能优化：在渲染时高效解析和转换为实际的页面
4. 组件化：以组件为基础额设计，组件可以是基础组件、布局组件、容器组件等
4. 可维护性：支持后续版本额平滑升级，适应多种需求。

**基础结构设计**

页面数据结构可以用树状结构表示页面的组件层级关系。每个页面由一个根节点开始，每个节点代表页面中的一个元素或组件。每个组件可以有其属性、样式、事件及其子组件。下面是页面数据结构的一个基本模型。

```json
{
  id: "page-root",
  type: "page",
  props: {
    title: “页面标题”,
    style: {
      backgroundColor: "#ffffff",
      padding: "10px"
    }
  },
  children: [
    {
      id: "header",
      type: "Header",
      props: {
        title: "头部",
        style: {
          color: "#000000",
          fontSize: "16px"
        }
      },
      events: {
        onClick: "handleClick"
      }
    }
  ]
}
```

**关键字段解释：**

- id：每个节点都有一个唯一的id，用于标识组件，方便操作和查找

- type：组件的类型，代表具体的组件：如Header、Text、Image等。每个type对应不同的组件逻辑

- props：组件的属性，包括样式、内容、功能等。如style用于定义样式，text、src等用于设置具体内容

- children：组件的子节点数组，表示当前组件下嵌套的子组件。通过children实现组件树的嵌套结构

- events：组件的事件处理配置，映射到具体的事件处理函数

## 5. 如何设计前端项目的灰度发布

前端项目的灰度发布是一种逐步上线的策略，允许新版本的功能仅在特定的用户群体中逐步推广，以减少大规模发布的风险。以下是实现灰度发布的关键思路和步骤：

**1. 实现灰度发布的核心思路**

- 用户分组：根据特定规则（如用户ID、IP地址、地理位置）对用户进行分组，将一部分用户标记为灰度用户

- 版本控制：同时维护多个前端版本，例如旧版本（稳定版）和新版本（灰度版）

- 动态加载：根据用户分组决定加载哪个版本的前端代码

- 实时监控：在灰度发布中，监控用户的行为和系统性能，及时发现问题

**2. 实现灰度发布的具体方法**

- 通过反向代理实现：使用Nginx将不同的用户请求转发到不用的前端版本

- 通过前端代码控制：在前端逻辑中引入灰度规则，根据用户属性动态加载不同版本，使用动态加载工具（import()）实现灰度版本的按需加载

- 基于CDN的灰度发布：使用CDN提供的分流能力，通过URL参数、Cookie或Header决定静态资源的加载路径

**3. 灰度发布中的关键问题**

- 灰度规则

- 数据一致性

- 监控与回滚

- 用户体验

## 6. 在即时通信场景中，在同步消息时，如何确保消息的最终一致性

即时通讯中的最终一致性依赖于服务端权威、全局唯一标识和 ACK 机制；实时推送解决实时性，增量拉取作为兜底补偿；离线和多设备通过游标同步和幂等合并收敛状态；前端允许短暂不一致，但始终以服务端事件流为最终结果，从而在网络不稳定和设备切换的情况下保证消息最终一致。

- 一致性的基本原则：所有消息内容和状态的最终结果，必须以服务端为准

- 消息同步的核心机制

    - 全局唯一标识与顺序保证：每条消息由服务端分配全局唯一messageId，确保消息的顺序性和唯一性

    - ACK+重传机制：ACK机制确保“至少一次送达”，去重机制保证“最多一次展示”

    - 增量拉取作为兜底路径：实时推送无法覆盖所有异常场景，因此必须存在拉取补偿机制

- 多设备与离线场景的处理：离线设置的消息处理与多设备同时在线的状态收敛

- 网络延迟与乱序的应对：乱序到达与延迟ACK

- 工程层面的关键约束：幂等性设计

- 前端在最终一致性中的角色定位：前端的职责不是“保证绝对正确”，而是在服务端数据到达时主动收敛到正确状态

## 7. 有一个需要支持10万条数据渲染分表格组件，如何设计和优化

10 万条数据表格的核心是控制渲染规模；必须基于行（必要时加列）虚拟化，将 DOM 数量限制在可视区范围；数据处理与渲染解耦，重计算放在数据层甚至 Worker 中；通过稳定 key、行级 memo 和简化布局，确保滚动和交互始终流畅。

问题的本质已经时如何控制渲染规模、更新成本和交互响应时间。

设计时应当从数据层、渲染层、交互层协同入手，而不是寄希望于某一个单点优化。

### 一、整体设计原则

核心原则只有一个：任何时刻参与渲染和布局计算的DOM数量必须是可控的。10万条数据不可能全部进入真实DOM，否则无论是首屏渲染、滚动还是重排都会不可接受。

### 二、渲染层：虚拟化是前提，不是优化项

- 行虚拟化：表格只渲染视口+buffer缓冲区，其余数据只存在内存中，成熟方案例如react-window/react-virtualized

    - 通过scrollTop计算当前可见的起始索引和结束索引

    - 只渲染这一区间的数据

    - 用一个占位容器模拟完整滚动高度

- 固定高度 vs 动态高度

    - 固定行高：计算简单，性能最好

    - 动态行高：需要行高缓存 + 二分查找

### 三、列与布局层面的优化

- 列虚拟化：当列数非常多时，需要同时做横向虚拟化，否则单行DOM过多同样会拖慢布局和绘制

- 减少布局复杂度

    - 避免table原生布局计算，优先使用div+grid

    - 避免每个单元格内存在复杂嵌套结构

    - 能静态的样式不依赖JS计算

### 四、数据与计算层优化

- 排序、过滤、搜索不直接作用于渲染层

这些操作应当在数据层完成，对于复杂规则，使用Web Worker做计算

- 结构共享与不可变数据

### 五、React框架的优化

- 行级组件隔离：通过React.memo或shouldComponentUpdate等手段，避免不必要的重新渲染

- key的稳定性：使用稳定key，避免因数据顺序变化导致组件重新渲染

### 六、滚动与交互体验优化

- 滚动事件处

    - 使用容器scroll而非window.scroll

    - 通过requestAnimationFrame避免额外setState抖动

- 选中、高亮等状态设计

    - 状态尽量用Set/Map结构存储

    - 判断逻辑在行内部完成

## 8. 如何更改组件库中组件的主题

在前端项目中，当需要修改组件库的主题时，一般有几种常见方法：**覆盖 CSS 变量**、**通过配置提供的主题 API**、**使用自定义样式**或 **CSS-in-JS**。

## 9. ChatGPT的对话功能实现，为什么选择SSE协议而非Websocket

ChatGPT的对话功能实现选择 Server-Sent Events（SSE）协议而非WebSocket，主要是基于两者在使用场景和实现复杂度上的差异。

### 1. 数据流单向性

- SSE是单向的：SSE是由服务器主动推送消息到客户端的单向数据协议，客户端只需要接收服务器传来的消息。这种模式适合像ChatGPT这样的应用场景，因为用户请求发送到服务器后，服务器只需要持续向客户端推送生成的对话数据。客户端没有必要频繁地向服务器发送数据

- WebSocket是双向的：WebSocket是全双工通信协议，允许客户端和服务器互相发送消息。虽然WebSocket功能更强大，但ChatGPT场景中并不需要客户端和服务器之间的高频双向通信

### 2. 实现和维护复杂度

- SSE简单易用：SSE只需要服务器推送消息，客户端可以通过标准额EventSource API轻松接收消息，并且基于HTTP协议实现。无需像WebSocket那样进行复杂的连接握手和状态管理。这使得SSE在实现和维护上相对简单

- WebSocket较复杂：WebSocket在建立连接时需要进行协议升级，并且要管理双向通信，增加了复杂度。尤其在某些代理、防火墙等网络环境中，WebSocket的握手和长连接更容易遇到阻碍

### 3. 兼容性和可靠性

- SSE通过HTTP/1.1实现：SSE是基于HTTP/1.1的长连接协议，通常能够更好地穿透代理服务器、防火墙等网络设施。这在需要保证消息推送可靠时非常重要

- WebSocket需要协议升级：WebSocket需要从HTTP升级到WebSocket协议（ws或wss），某些网络环境可能会阻断这种升级过程，从而影响连接的可靠性

### 4. 自动重连和消息重发

- SSE提供自动重连功能：如果网络中断或连接丢失，SSE会自动尝试重连，且服务器可以通过Last-Event-ID实现消息重发，从而保证消息不回丢失

- WebSocket重连复杂：WebSocket需要自行实现重连逻辑和消息重发功能，增加了开发的复杂度和维护成本

### 5. 使用场景的适配性

- SSE适合低频的消息推送：SSE适用于不需要高频交互、消息量适中但要求可靠推送的应用场景，如实时通知、数据流等

- WebSocket适合高频双向通信：WebSocket更适合需要双向、低延迟、高频数据交互的应用场景，比如在线游戏、实时协作工具等

### 6. 资源效率和性能

- SSE使用较少的资源：SSE是通过HTTP长连接传输数据，资源消耗少，尤其是在只需要单向通信的场景中，避免了WebSocket双向通信带来的额外负责

- WebSocket性能较优但资源消耗大：WebSocket在高频双向通信时有更高的性能，但对于像ChatGPT这种场景，其双向通信能力未被充分利用，反而会增加资源开销。

## 10. 前端怎么做错误监控

前端错误监控是确保应用稳定性和用户体验的重要手段。以下是一些常见的前端错误监控方法：

### 1. 捕获JavaScript错误

- 使用`window.onerror`事件：捕获全局JavaScript错误

- 使用`window.addEventListener('error')`：捕获未处理的错误和资源加载错误

- 使用`window.addEventListener('unhandledrejection')`：捕获未处理的Promise错误

```js
// 捕获 JavaScript 错误
window.onerror = function (message, source, lineno, colno, error) {
    console.log('Error captured:', { message, source, lineno, colno, error });
    // 发送错误信息到服务器
    sendErrorToServer({ message, source, lineno, colno, error });
    return true; // 防止浏览器默认处理
};

// 捕获未处理的 Promise 拒绝
window.addEventListener('unhandledrejection', function (event) {
    console.log('Unhandled rejection:', event.reason);
    // 发送错误信息到服务器
    sendErrorToServer({ reason: event.reason });
});

// 发送错误信息到服务器
function sendErrorToServer(error) {
    fetch('/log-error', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(error)
    });
}
```

### 2. 使用监控工具

集成专业的前端错误监控工具可以提供更多功能，如自动错误捕获、用户上下文、异常堆栈跟踪等

- Sentry：提供JavaScript错误捕获、性能监控、用户上下文等功能

- Rollbar：实时错误监控和日志记录，支持自定义错误报告

- LogRocket：记录用户会话、错误和性能数据

- New Relic：性能监控和错误捕获，集成各种前端和后端数据

## 11. 怎么在前端页面中添加水印

在前端页面中添加水印可以通过以下几种方法实现：

- CSS方法：简单易用，适合静态内容，兼容性好

- Canvas方法：灵活，可以创建动态水印，但涉及到绘图，可能对性能有影响

- 背景图像：简单但不易于调整文本位置和样式

- JavaScript动态生成：灵活可操作DOM，适合动态内容

## 12. React如何实现Vue中的keep-alive功能

在React中实现类似于Vue中keep-alive的功能，可以使用组件状态和React的生命周期方法来控制组件的挂载和卸载。

创建一个KeepAlive组件，用于存储和管理被“缓存”的组件。

```js
import React, { useState } from 'react';

// KeepAlive 组件
const KeepAlive = ({ children, name }) => {
  const [cache, setCache] = useState({});

  // 保存组件
  const saveCache = () => {
    setCache((prev) => ({
      ...prev,
      [name]: children,
    }));
  };

  // 恢复组件
  const getCachedComponent = () => {
    return cache[name] || children;
  };

  // 组件挂载时保存
  React.useEffect(() => {
    saveCache();
  }, [children]);

  return <>{getCachedComponent()}</>;
};

// 示例用法
const App = () => {
  const [activeComponent, setActiveComponent] = useState('ComponentA');

  return (
    <div>
      <button onClick={() => setActiveComponent('ComponentA')}>Component A</button>
      <button onClick={() => setActiveComponent('ComponentB')}>Component B</button>

      <KeepAlive name={activeComponent}>
        {activeComponent === 'ComponentA' ? <ComponentA /> : <ComponentB />}
      </KeepAlive>
    </div>
  );
};

const ComponentA = () => <div>Component A</div>;
const ComponentB = () => <div>Component B</div>;

export default App;
```

- 状态管理：KeepAlive组件使用一个状态cache来存储被缓存的组件

- 保存和恢复：在组件挂载时保存当前子组件到缓存中；每次渲染时，检查缓存并返回之前的组件，避免重新渲染


## 13. 如何设计一个前端日志埋点SDK

实现一个前端日志埋点SDK是为了能够有效地跟踪和记录用户行为、性能数据以及错误日志，帮助开发者进行数据分析和故障排查。一个好的埋点SDK设计需要兼顾灵活性、性能、可扩展性和可靠性。

### 1. 基本功能设计

**核心目标：**

- 用户行为埋点：记录点击、页面访问、表单提交等用户操作

- 性能数据采集：收集页面加载时间、资源请求耗时等性能指标

- 错误日志记录：捕捉和记录JavaScript错误或异常

- 数据上报：将埋点数据发送到服务器或日志管理系统

### 2. SDK的架构设计

#### 2.1 初始化模块

- SDK需要在页面加载时进行初始化，指定相关配置（API服务器地址、环境配置、采样率）

- 配置项可以允许动态定制，比如开关某些类型的日志记录、设置自定义属性等

- 提供全局`init()`方法来接收配置，并完成SDK的初始化

#### 2.2 事件捕获模块

- 自动捕获：通过DOM事件代理机制`（addEventListener）`来监听点击事件、表单提交、页面跳转等，自动采集用户行为

- 自定义埋点：允许开发者通过SDK提供的接口主动记录埋点数据。例如`trackEvent()`方法，用于记录自定义时间及其相关信息

- 性能埋点：利用浏览器额`Performance API`，采集页面加载时间、资源加载时长、DOM渲染时间等数据

- 错误日志捕获：通过监听`window.onerror`、`window.addEventListener('error')`、`window.addEventListener('unhandledrejection')`等事件，自动捕获JavaScript错误和未处理的Promise错误

#### 2.3 数据存储与缓冲模块

- 队列机制：埋点数据不应立即上报服务器，避免频繁发送请求。可以将捕获的数据暂存到队列中，并在达到一定数量或定时触发时统一发送

- 持久化存储：为应对网络波动或断线情况，SDK需要将未成功发送的数据暂时保存在浏览器的LocalStorage或SessionStorage中，并在网络恢复时重新尝试发送

#### 2.4 上报模块

- 数据批量上报： 提供队列机制，每隔一段时间或达到一定数量后，将埋点数据批量上报至后端日志服务器

- 上报策略：支持通过POST或GET请求上报数据。可根据日志量及网络状态选择合适的上报方式

- 上报时机：可以在页面卸载前进行最后一次批量上报，确保在用户离开页面时捕获到的日志不回丢失

- 可靠性：在上报失败时，支持自动重试机制，并记录上报状态

#### 2.5 数据格式化与压缩模块

- 数据格式：通常以JSON格式发送埋点数据，包含时间戳、事件类型、页面信息、用户ID等信息

- 数据压缩：为减小网络传输量，SDK可以将数据压缩后发送

#### 2.6 插件机制

- 可扩展性：SDK可以设计成模块化或插件化，允许用户根据需要加载特定功能模块（如性能监控、错误捕获、页面行为捕获）

- 第三方集成：可以提供API支持与第三方工具集成（如Google Analytics、Mixpanel等），方便开发者将数据上报至不同平台

### 3. SDK API设计
```js
// 初始化 SDK，传入配置
LoggerSDK.init({
  apiUrl: 'https://logserver.com/track',  // 日志上报的地址
  appId: 'my-app-id',                     // 应用 ID
  env: 'production',                      // 当前环境：开发、测试、生产
  samplingRate: 0.1,                      // 采样率，1 为全量记录，0.1 为 10% 采样
  autoTrack: true,                        // 是否自动捕获用户行为
  captureErrors: true                     // 是否捕获 JS 错误
});

// 自定义事件埋点
LoggerSDK.trackEvent({
  event: 'button_click',
  elementId: 'submit-button',
  label: '提交按钮点击'
});

// 手动记录页面加载性能
LoggerSDK.trackPerformance();

// 手动记录自定义错误
LoggerSDK.trackError({
  errorType: 'network',
  message: 'Failed to fetch data',
  url: '/api/data'
});
```

### 4. 性能优化

- 懒加载SDK：通过一步脚本加载，确保SDK不影响页面的首屏渲染

- 最小化SDK体积：使用Rollup等工具对SDK进行打包压缩，减少加载时间

- 延迟执行：初始化和数据上报都可以异步进行，避免阻塞页面的其它功能

- 采样机制：对埋点进行采样，减少不必要的埋点上报压力

## 14. 如果需要使用JS执行100万个任务，如何保证浏览器不卡顿


### 1. 使用分块处理（Chunking）

将100万个任务分成小块，逐块处理，每块处理完成后将控制权交还给浏览器，利用空闲时间继续处理

**实现方式：** setTimeout 或 setInterval

```js
function processInChunks(tasks, chunkSize = 100) {
  function processChunk() {
    const chunk = tasks.splice(0, chunkSize);
    chunk.forEach(task => task());
    if (tasks.length > 0) {
      setTimeout(processChunk, 0); // 让出主线程
    }
  }
  processChunk();
}

// 示例
const tasks = Array.from({ length: 1000000 }, (_, i) => () => console.log(i));
processInChunks(tasks);
```

### 2. requestIdleCallback

requestIdleCallback 是浏览器提供的一个API，用于在浏览器空闲时执行回调函数。

```js
function processWithIdleCallback(tasks) {
  function processChunk(deadline) {
    while (deadline.timeRemaining() > 0 && tasks.length > 0) {
      const task = tasks.shift();
      task();
    }
    if (tasks.length > 0) {
      requestIdleCallback(processChunk);
    }
  }
  requestIdleCallback(processChunk);
}

// 示例
const tasks = Array.from({ length: 1000000 }, (_, i) => () => console.log(i));
processWithIdleCallback(tasks);
```

### 3. web worker

将复杂任务计算放到 web worker中执行，避免阻塞主线程

主线程代码：
```js
const worker = new Worker("worker.js");
worker.postMessage(1000000); // 发送任务数量
worker.onmessage = (e) => {
  console.log(e.data); // 接收 worker 处理结果
};
```
worker脚本
```js
onmessage = (e) => {
  const tasks = e.data;
  for (let i = 0; i < tasks; i++) {
    // 模拟任务
  }
  postMessage("All tasks completed!");
};
```

### 4. 任务调度器

创建自定义任务调度器，根据优先级和剩余时间动态分配任务
```js
class Scheduler {
  constructor() {
    this.tasks = [];
  }

  add(task) {
    this.tasks.push(task);
  }

  run(chunkSize = 100) {
    const execute = () => {
      const chunk = this.tasks.splice(0, chunkSize);
      chunk.forEach(task => task());
      if (this.tasks.length > 0) {
        setTimeout(execute, 0);
      }
    };
    execute();
  }
}

// 示例
const scheduler = new Scheduler();
for (let i = 0; i < 1000000; i++) {
  scheduler.add(() => console.log(i));
}
scheduler.run();
```

### 5. 微任务

利用Promise和await将任务且分到微任务队列中，减少对主线程的持续占用。
```js
async function processTasks(tasks) {
  for (let i = 0; i < tasks.length; i++) {
    tasks[i]();
    if (i % 100 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0)); // 让出主线程
    }
  }
}

// 示例
const tasks = Array.from({ length: 1000000 }, (_, i) => () => console.log(i));
processTasks(tasks);
```

## 15. 前端实现倒计时为什么会有误差？如何解决

前端倒计时会产生误差的主要原因是 setTimeout 和 setInterval 的执行机制以及 JavaScript 单线程的特性。

### 产生的原因

1. setTimeout 和 setInterval 的执行机制

- setTimeout(fn, delay)并不会在精准的 delay 毫秒后执行 fn，而是至少 delay 毫秒后执行

- setInterval(fn, delay)也是如此，它的下一次执行时间是当前任务执行完后才开始计算 delay，所以可能比预期时间更长。

2. JavaScript 是单线程的

JS是单线程的，如果主线程在执行其它任务（如渲染、事件回调等），定时器回调可能会被延迟执行

3. 浏览器的最小事件间隔限制

大多数浏览器最小的定时器间隔是4ms（在非活跃标签页或后台页面，可能会被调整到1s甚至更长）

4. 设备性能与负载

如果设备负载高，主线程被占用，定时器可能会延迟执行，导致倒计时出现误差。

### 解决方案

1. 基于`Data.now()`或 `performance.now()`进行校正：记录开始事件，每次执行倒计时时，计算与实际过去时间的偏差，并动态调整，误差不会随时间累计，适合高精度倒计时

2. 使用`requestAnimationFrame`代替`setInterval`，`requestAnimationFrame`具有更高的执行精度，并且能在页面可见时保持稳定

3. 服务端同步时间
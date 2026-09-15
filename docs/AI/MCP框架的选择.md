# MCP 框架的选择

MCP（Model Context Protocol，模型上下文协议）是由 Anthropic 推出的一种开放标准，旨在解决 AI 模型（如 Claude、Cursor 等）与外部数据源/工具（如数据库、本地文件、API）之间连接碎片化的问题。

最近在写一款工具，需要使用 MCP 框架，于是研究了下 MCP 框架。

MCP 协议主要由三大支柱组成：

- **Tools（工具，最常用）**：让 AI 执行动作（例如：「执行这段 SQL」、「发送一条 Slack 消息」）。AI 可以决定何时调用它，并传入参数。
- **Resources（资源）**：让 AI 读取数据。就像一个只读的 URL（例如：`file://logs/today.txt`），AI 可以直接读取其内容作为上下文。
- **Prompts（提示词模板）**：预设的对话模板（例如：「代码审查模式」）。

---

## 框架对比

| 框架名称 | 维护者/来源 | 适用语言 | 特点与优势 | 适用场景 |
| --- | --- | --- | --- | --- |
| `@modelcontextprotocol/sdk` | Anthropic 官方 | TypeScript / JavaScript | 官方第一优先级维护，更新最快。完全支持 MCP 的三大核心功能：Resources、Prompts 和 Tools。基于 JSON-RPC 2.0。 | **首选推荐。** 适合 Node.js 生态开发者，编写企业内部工具、前端自动化、或连接 JS/TS 工具链。 |
| `mcp` (Python SDK) | Anthropic 官方 | Python | 官方维护，完美集成 Python 的异步生态（asyncio）。提供非常简洁的装饰器语法（如 `@mcp.tool()`），开发效率极高。 | **首选推荐。** 适合数据科学、AI/LLM 应用、自动化脚本、数据分析等 Python 生态的接入。 |
| `mcp-go` | 社区 (Metoro) | Go | 社区高质量实现。利用 Go 的高性能、低内存占用和单二进制分发优势，适合轻量、常驻后台的 MCP 服务。 | 适合云原生环境、系统级工具、或对分发体积和性能有极高要求的场景。 |
| `mcp-java` / `mcp-rust` | 社区 | Java / Rust | 社区针对特定语言的移植版本。Rust 适合极致性能和安全性；Java 适合接入企业级遗留系统（如 Spring 生态）。 | 适合特定技术栈的团队或已有大型后端系统的集成。 |

---

## 技术选型：官方 SDK 二选一

Anthropic 官方主推两个 SDK，**根据你的技术栈二选一即可**：

| SDK | 一句话 |
| --- | --- |
| **Python SDK (`mcp`)** | **强烈推荐。** 代码量最少，装饰器语法，开发极快。 |
| **TypeScript SDK (`@modelcontextprotocol/sdk`)** | 工具链强依赖 Node.js/npm，或团队是全栈/前端背景时选它。 |

### 详细对比

| 维度 | Python SDK (`mcp`) | TypeScript SDK (`@modelcontextprotocol/sdk`) |
| --- | --- | --- |
| **推荐人群** | 数据科学、AI/LLM、自动化脚本、后端 Python 团队 | Node.js 生态、全栈/前端、强依赖 npm 包的工具链 |
| **开发体验** | **代码量最少**：`FastMCP` + 装饰器，业务逻辑为主 | 需手写 `ListTools` / `CallTool` 与 JSON Schema，样板代码更多 |
| **类型与 Schema** | 类型提示 + Docstring → 自动生成 MCP JSON Schema | 手动在 `inputSchema` 中描述入参；可配合 `zod` 等库 |
| **协议能力** | Tools 上手极快；Resources / Prompts 同样由官方维护 | 三大支柱支持最完整、官方更新最快 |
| **运行方式** | `mcp.run(transport='stdio')`，供 Cursor / Claude 进程间调用 | `StdioServerTransport` + `server.connect()` |
| **环境成本** | 需 Python 3.10+、pip/uv、可选 venv | 本地通常已有 Node.js，与前端工程一致 |
| **一句话结论** | 想**最快**写出可用 Tool → 选 Python | 团队已是前端/Node → 选 TypeScript |

### 前端开发者怎么选？

若核心技术栈是前端，**优先 TypeScript SDK**，而不是为了「装饰器更短」去切 Python：

| 优势 | 说明 |
| --- | --- |
| **零环境成本** | 本地肯定有 Node.js、npm/pnpm/yarn |
| **庞大生态** | 可直接用 `axios`/`ky` 调接口、`fs-extra` 读写文件、`cheerio` 抓网页、`zod` 做校验 |
| **类型安全** | 借助 TS 和官方 SDK 类型定义，减少 JSON-RPC 字段写错 |

Python 的 `FastMCP` 适合「本来就在写 Python」的场景；对前端而言，切语言带来的环境成本往往大于语法上的简短优势。

---

## Python SDK：`mcp` 与 FastMCP 的关系

`FastMCP` 与底层 `modelcontextprotocol/python-sdk` **同属 Anthropic 官方仓库**（GitHub：`modelcontextprotocol/python-sdk`），不是第三方框架。

```bash
pip install mcp
```

执行上述命令会**同时**安装底层核心协议和高级 `FastMCP` 封装。

| 层级 | 模块 | 特点 | 适用场景 |
| --- | --- | --- | --- |
| **底层（硬核模式）** | `mcp.server` | 手动处理 JSON-RPC、`RequestHandler`，用 JSON Schema 定义每个 Tool | 深度定制协议、复杂中间件、高度动态的 MCP 服务 |
| **高层（极速模式）** | `mcp.server.fastmcp` | 借鉴 FastAPI：类型提示 + Docstring 自动转成 MCP JSON Schema | **绝大多数场景**，官方最推荐的 Python 写法 |

**不必在「装 mcp」和「用 FastMCP」之间二选一**——用 `FastMCP` 就是在用官方最推荐、最现代化的 Python 开发方式。

---

## 实战一：5 分钟用 Python 写「本地时间」工具

这里以 Python 为例，带你写一个最简单的 MCP Server，让 AI 可以通过它获取你指定的本地信息。

### 1. 环境准备

- Python 3.10 或更高版本
- 推荐使用 [uv](https://github.com/astral-sh/uv) 或 pip 安装依赖

```bash
mkdir my-mcp-python && cd my-mcp-python
pip install mcp
# 若使用 uv：
# uv init && uv add mcp
```

### 2. 编写 Server（`server.py`）

在项目目录创建 `server.py`：

```python
from mcp.server.fastmcp import FastMCP
import datetime

# 1. 初始化 FastMCP 服务，给它起个名字
mcp = FastMCP("My-First-MCP-Server")


# 2. 定义一个 Tool（工具）
# AI 会根据函数文档字符串（Docstring）和参数类型，自动理解这个工具的用途
@mcp.tool()
def get_local_time(timezone_offset: int = 0) -> str:
    """
    获取指定时区偏移量下的当前本地时间。

    参数:
        timezone_offset: 相对 UTC 的时区偏移小时数 (例如：北京时间传入 8)
    """
    utc_time = datetime.datetime.utcnow()
    local_time = utc_time + datetime.timedelta(hours=timezone_offset)
    return f"当前的本地时间是: {local_time.strftime('%Y-%m-%d %H:%M:%S')}"


if __name__ == "__main__":
    # 3. 启动服务（默认 stdio 模式，供 Cursor/Claude 进程间调用）
    mcp.run(transport="stdio")
```

::: tip 核心精髓
看见 `"""获取指定时区..."""` 了吗？**千万不要删掉它！** MCP 会把这段注释和参数类型 `int` 变成 JSON Schema 发给 AI。AI 就是靠读这段人类语言来决定何时、如何调用这个函数。
:::

### 3. 本地验证（可选）

在终端单独运行（会等待 stdio 输入，一般直接交给 Cursor 启动即可）：

```bash
python server.py
# 或：uv run server.py
```

### 4. 在 Cursor 中配置

MCP Server 编写好后，是一个通过**标准输入输出（stdio）**通信的后台进程。需要告诉 Cursor 如何启动它。

1. 打开 **Cursor → Settings → Models → MCP**
2. 点击 **+ Add New MCP Server**
3. 填写：

| 字段 | 值 |
| --- | --- |
| **Name** | `my-time-server` |
| **Type** | `command` |
| **Command** | `python /绝对路径/to/your/server.py` |

若使用 uv，可写：

```bash
uv run /绝对路径/to/your/server.py
```

4. 点击 **Save**。旁边小圆点变为**绿色 (Connected)** 即成功。

### 5. 测试

在 Cursor Chat 中提问：

> 帮我查一下北京时间（UTC+8）现在几点了？

你会看到 Cursor 提示 **Calling tool `get_local_time`**，并返回正确时间。

---

## 实战二：前端专属 TypeScript 保姆级教程

### 1. 3 分钟项目初始化

```bash
# 1. 创建并进入目录
mkdir my-mcp-server && cd my-mcp-server

# 2. 初始化项目
npm init -y

# 3. 安装 MCP 核心 SDK
npm install @modelcontextprotocol/sdk

# 4. 安装 TS 开发依赖
npm install -D typescript @types/node tsx
```

创建 `tsconfig.json`：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"]
}
```

修改 `package.json`，增加 ESM 与启动脚本：

```json
{
  "name": "my-mcp-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

目录结构：

```text
my-mcp-server/
├── package.json
├── tsconfig.json
└── src/
    └── index.ts
```

### 2. 编写 Server（`src/index.ts`）

包含两个工具：`get_project_status`（模拟项目状态）、`fetch_meta`（抓取网页标题）。

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// 1. 初始化 MCP 服务
const server = new Server(
  {
    name: "frontend-helper-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {}, // 声明拥有 Tools 能力
    },
  }
);

// 2. 注册工具列表（告诉 AI 能干什么，以及入参长什么样）
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_project_status",
        description: "获取当前前端项目的开发状态和基础信息",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "fetch_meta",
        description:
          "传入一个网页 URL，解析并返回该页面的 Meta 信息（标题和描述）",
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "完整的网页 URL (例如 https://example.com)",
            },
          },
          required: ["url"],
        },
      },
    ],
  };
});

// 3. 处理工具的实际执行逻辑（AI 决定调用某个工具时触发）
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "get_project_status") {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                projectName: "Xiao-Zhi-AI-Platform",
                framework: "React 19 & Next.js",
                packageManager: "pnpm (Monorepo)",
                status: "Healthy",
                lastDeploy: new Date().toLocaleString(),
              },
              null,
              2
            ),
          },
        ],
      };
    }

    if (name === "fetch_meta") {
      const url = args?.url as string;
      const response = await fetch(url);
      const html = await response.text();

      const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
      const descMatch = html.match(
        /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i
      );
      const title = titleMatch ? titleMatch[1].trim() : "未找到标题";
      const description = descMatch ? descMatch[1].trim() : "未找到描述";

      return {
        content: [
          {
            type: "text",
            text: `网页标题: ${title}\n描述: ${description}\n源地址: ${url}`,
          },
        ],
      };
    }

    throw new Error(`未找到工具: ${name}`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      isError: true,
      content: [{ type: "text", text: `执行出错: ${message}` }],
    };
  }
});

// 4. 启动服务，使用 stdio 与客户端通信
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("MCP Frontend Helper Server 正在运行...");
```

::: warning 日志输出
**必须用 `console.error` 打印日志。** `console.log` 会写入 stdout，与 MCP 协议数据混在一起，导致客户端解析失败、连接报错。
:::

本地调试：

```bash
npm run dev
```

### 3. 在 Cursor 中配置

| 字段 | 值 |
| --- | --- |
| **Name** | `frontend-helper` |
| **Type** | `command` |
| **Command** | 见下方 |

**Command 示例**（把路径换成你机器上的绝对路径）：

```bash
npx --prefix /Users/你的用户名/path/to/my-mcp-server run dev
```

或使用 node 直接跑编译产物：

```bash
node /绝对路径/my-mcp-server/dist/index.js
```

保存后小圆点变**绿色 (Connected)** 即可。

### 4. 调教 AI 测试

在 Cursor Chat 或 Composer 中：

> 帮我看一下我现在前端项目的状态，顺便帮我查一下 https://react.dev 的网页标题是什么？

应看到连续两次 **Tool Calling**，并返回项目 JSON 与网页标题。

### 5. 给前端的进阶脑洞

| 方向 | 可以做什么 |
| --- | --- |
| **组件库直连** | 读取公司内部 UI 组件库文档，让 Cursor 写代码时遵守设计规范 |
| **国际化自动化** | 读写 `locales/zh-CN.json`，翻译后直接写入，省去复制粘贴 |
| **构建/部署** | 提供执行 `pnpm build`、分析打包体积的工具，辅助优化 Vite/Webpack |

---

## 在 Cursor 中配置（通用说明）

无论 Python 还是 TypeScript，MCP Server 对客户端而言都是：

1. 由 Cursor **启动一个子进程**
2. 通过 **stdin/stdout** 交换 JSON-RPC 消息
3. 子进程退出或 stdout 被污染 → 连接失败（红点）

### 配置路径

**Settings → Models → MCP → + Add New MCP Server**

### 配置对照表

| 字段 | Python 示例 | TypeScript 示例 |
| --- | --- | --- |
| Name | `my-time-server` | `frontend-helper` |
| Type | `command` | `command` |
| Command | `python /绝对路径/server.py` | `npx --prefix /绝对路径/my-mcp-server run dev` |

### 常见问题排查

| 现象 | 可能原因 | 处理 |
| --- | --- | --- |
| 一直红点 / Disconnected | Command 路径错误或 Python/Node 不在 PATH | 用绝对路径；终端先手动跑通同一命令 |
| 连上但 AI 不调工具 | Docstring / `description` 太模糊 | 写清工具用途与参数含义 |
| TS 连上立刻断开 | 用了 `console.log` | 改用 `console.error` |
| 调工具报错 | 依赖未装、网络权限 | 检查 `pip install` / `npm install`；fetch 需网络 |

## 延伸阅读

- [Model Context Protocol 官网](https://modelcontextprotocol.io/)
- Python SDK：[modelcontextprotocol/python-sdk](https://github.com/modelcontextprotocol/python-sdk)
- TypeScript SDK：[modelcontextprotocol/typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk)

# MCP 传输机制：Stdio、SSE 与 Streamable HTTP

笔记整理自：[一文了解：MCP 传输机制 Stdio、SSE 与 Streamable HTTP 的核心区别](https://zhuanlan.zhihu.com/p/1896209461112197767)

## 1. Stdio：通过本地子进程通信

客户端启动 MCP 服务端子进程，通过标准输入和标准输出交换 JSON-RPC 消息：

```text
客户端 ── 写入 stdin ──→ MCP 服务端子进程
客户端 ←── 读取 stdout ── MCP 服务端子进程
```

消息以换行符分隔；`stdout` 只能输出合法的 MCP 消息，调试日志应写入 `stderr`，否则可能破坏协议解析。这是实现 Stdio 服务端时需要注意的细节。[官方 Stdio 规范](https://modelcontextprotocol.io/specification/2024-11-05/basic/transports#stdio)

这种方式不需要为 MCP 通信开放网络端口，适合本地工具接入和原型调试。其典型形态是客户端管理自己的服务端子进程，不直接提供供多个远程客户端共享的服务入口。

需要区分“传输在本地”和“工具只访问本地”：**Stdio 服务端自身仍可调用远程 API**。同样，传输方式不会自动限制工具权限，也不能保证业务数据永不外发；这是由传输与工具执行职责不同得出的工程判断。

## 2. HTTP + SSE：发送与接收使用不同端点

原文中的“SSE”指旧版 MCP 的 **HTTP + SSE 传输方案**。它由两个通道配合完成通信：

```text
客户端 ── HTTP POST ──→ 消息接收端点
客户端 ←── SSE 事件流 ── SSE 端点（通过 GET 建立）
```

客户端先连接 SSE 端点，服务端通过 `endpoint` 事件告知发送消息所用的 URI。随后客户端用 POST 发送消息，服务端通过 SSE 返回消息。服务端作为独立进程，可接入多个客户端。[官方 HTTP + SSE 规范](https://modelcontextprotocol.io/specification/2024-11-05/basic/transports#http-with-sse)

**单向的是 SSE 事件流，整个 MCP 连接仍能双向交换消息。** `/sse`、`/messages` 是常见路径示例，并非协议规定的固定名称。

它支持远程访问和主动推送，但需要维护接收消息的长连接以及独立的发送入口。理解这种结构，有助于维护仍使用旧版传输的服务。

## 3. Streamable HTTP：统一端点，按需返回事件流

Streamable HTTP 在 `2025-03-26` 版规范中替代旧 HTTP + SSE 传输。客户端向统一的 MCP 端点发送 POST；对于包含 JSON-RPC 请求的 POST，服务端可以返回普通 JSON，也可以返回 SSE 事件流：

```text
客户端 ── POST /mcp ──→ 服务端
客户端 ←── JSON 或 SSE ── 服务端
```

这里的 `/mcp` 只是示例，路径也可以由服务自行定义。客户端还可以向同一端点发送 GET，建立接收服务端消息的 SSE 流；服务端若不提供该能力，可以返回 `405 Method Not Allowed`。

会话管理也是可选的：服务端可以在初始化时分配 `Mcp-Session-Id`，客户端随后携带它；没有会话需求的实现不必采用这一机制。[官方 Streamable HTTP 规范](https://modelcontextprotocol.io/specification/2025-03-26/basic/transports#streamable-http)

因此，它的灵活性体现在：普通请求无需一律维持 SSE 长连接，需要流式消息时仍可使用 SSE。统一端点也让接口组织更直接。

## 4. 三种方式怎么选

| 对比项 | Stdio | 旧 HTTP + SSE | Streamable HTTP |
| --- | --- | --- | --- |
| 通信载体 | 本地进程的标准输入、输出 | HTTP POST 与 SSE 长连接 | HTTP，按需使用 SSE |
| 入口组织 | 子进程与管道 | 发送、接收分开 | 统一 MCP 端点 |
| 服务部署 | 通常随客户端启动 | 独立服务 | 独立服务 |
| 典型用途 | 本地工具、开发调试 | 已有远程服务的兼容维护 | 新建远程服务 |

## 5. 原文中需要澄清的表述

- **被替代的是旧 HTTP + SSE 传输方案，SSE 技术本身仍在使用。** Streamable HTTP 同样可以承载 SSE 事件流。
- **“动态升级”不等于 HTTP `Upgrade` 握手。** 这里是服务端选择返回 `application/json` 或 `text/event-stream`，仍然使用 HTTP。
- **统一端点不要求命名为 `/message`。** 关键在于同一个 MCP 端点承担相应的 HTTP 请求。

以上区别均可从 [2025-03-26 版传输规范](https://modelcontextprotocol.io/specification/2025-03-26/basic/transports)核对。判断一种传输方式时，应分别看消息从哪里发送、从哪里接收，以及是否需要维护连接和会话，避免把传输方式直接等同于安全性或扩展能力。

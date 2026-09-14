# 飞书MCP

飞书是我们日常的办公软件，本文介绍 AI Agent 如何接入飞书，实现开发的闭环。

目前主要有三种接入方式：

## 接入方式

### 1. 飞书 CLI + Agent Skills（目前最推荐）

飞书官方明确支持 Cursor：装 CLI，再装 Skills。Cursor 会自动加载 `~/.cursor/skills/` 里的技能，Agent 用自然语言操作飞书时，会去跑 `lark-cli`。

```bash
# 一键安装 CLI + Skills
npx @larksuite/cli@latest install

# 国内飞书初始化
lark-cli config init --new --brand feishu --lang zh

# 代表你本人操作（日历、私聊、个人文档）时再登录
lark-cli auth login
```

装完后重启 Cursor，技能才会进 Agent。之后可以直接说「帮我建一篇飞书文档」「读这个知识库节点」。

覆盖范围比 MCP 广：消息、文档、知识库、表格、多维表格、日历、会议纪要、邮箱、任务、审批等。

官方说明：给 Agent 一双操作飞书的手 · larksuite/cli

<https://open.feishu.cn/document/mcp_open_tools/feishu-cli-let-ai-actually-do-your-work-in-feishu>

<https://github.com/larksuite/cli>

### 2. OpenAPI MCP：@larksuiteoapi/lark-mcp

这才是真正的 MCP。飞书开放平台把 OpenAPI 包成 MCP Server，Cursor 有一键安装按钮。

在 Cursor 的 MCP 配置里类似：

```json
{
  "mcpServers": {
    "lark-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "@larksuiteoapi/lark-mcp",
        "mcp",
        "-a",
        "<APP_ID>",
        "-s",
        "<APP_SECRET>"
      ]
    }
  }
}
```

要用用户身份（读个人文档、发消息）时，先终端登录，再加 `--oauth` 和 `--token-mode user_access_token`。

仓库：larksuite/lark-openapi-mcp

<https://github.com/larksuite/lark-openapi-mcp>

### 3. 飞书远程 MCP（个人托管，正在收）

在 飞书 MCP 配置平台 创建远程服务，点「添加到 Cursor」即可。

官方已经写了：MCP Token 个人托管链路会逐步下线，推荐改用飞书 CLI。 目前远程 MCP 主要还是云文档，能力比 CLI 窄，新服务有效期也缩短到 7 天。

## 怎么选

| 方式 | 是不是 MCP | 适合 |
| --- | --- | --- |
| CLI + Skills | 否，Agent 调终端命令 | Cursor Agent 日常操作飞书，官方主推 |
| lark-mcp | 是 | 要 MCP 工具协议、对话中直接调 OpenAPI |
| 远程 MCP | 是 | 临时试用；不建议当长期方案 |

日常在 Cursor Agent 里操作飞书，优先走 CLI + Skills。需要 MCP 协议再配 lark-mcp。

## lark-mcp 接入

接入比较简单，按照官方文档配置即可。

```json
{
  "mcpServers": {
    "lark-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "@larksuiteoapi/lark-mcp",
        "mcp",
        "-a",
        "<APP_ID>",
        "-s",
        "<APP_SECRET>",
        "-d"
        "https://open.feishu.cn"
      ]
    }
  }
}
```

这里的`APP_ID`和`APP_SECRET`需要到飞书开放平台 -> 开发者后台 -> 创建一个智能体。

另外需要开通要用的权限（发消息、云文档、通讯录等），不然访问会报错。

配置完成后，我们就可以直接在 Cursor Agent 获取到飞书上的各种文档内容了。
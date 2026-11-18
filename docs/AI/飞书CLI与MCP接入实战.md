# 在 Mac 上接入飞书 CLI 与 MCP：让 Codex、Cursor 读取文档和聊天

> AI 生成说明：本文由 AI 辅助整理，结合官方文档与本机实际操作编写。
> 验证时间：2026 年 11 月 18 日，
> CLI 版本：1.0.100。

平时开发时，需求放在飞书 Wiki，接口变更和联调结论散落在聊天中。让 AI 帮忙分析前，往往需要先复制文档、截图和聊天记录。

接入飞书后，可以直接在 Codex 或 Cursor 中说：

```text
读取这篇飞书 Wiki，整理涉及前端的需求和待确认问题。
```

```text
查看我与某位同事最近 3 天的私聊，整理接口变更，并附原消息链接。
```

本文介绍两条接入路线：**本地飞书 CLI + Skills**，以及 **飞书 OpenAPI MCP**。日常在 Codex、Cursor 中工作，优先使用已经验证可行的 CLI；需要以 MCP 工具形式接入时，再选择 OpenAPI MCP。

## 一、先分清 CLI、Skill 和 MCP

| 名称 | 作用 | AI 如何调用 |
| --- | --- | --- |
| 飞书 CLI：`@larksuite/cli` | 本机安装的飞书业务工具 | 执行 `lark-cli` 命令 |
| 飞书 Skills：`lark-*` | 告诉 Agent 如何选命令、处理身份和权限 | Agent 读取 `SKILL.md` 后调用 CLI |
| OpenAPI MCP：`@larksuiteoapi/lark-mcp` | 将飞书 OpenAPI 封装成 MCP 工具 | 客户端连接 MCP Server 后调用工具 |
| 个人远程 MCP | 飞书托管的远程工具服务 | 客户端连接远程地址并授权 |

**CLI 本身不是 MCP Server，Skill 也不是飞书授权凭证。** 安装 Skill 只是让 Agent 知道如何使用工具；能否访问资源，还要看应用权限、用户授权和资源本身的访问权限。

个人远程 MCP 与 OpenAPI MCP 是不同方案。不能因为某个远程 MCP 没有聊天工具，就判断所有飞书 MCP 都不能读取聊天。OpenAPI MCP 官方支持通过 `-t` 选择 API 工具，包含消息列表接口；具体能力仍以服务实际加载的工具为准。

## 二、推荐方案：一份 CLI，两个 Agent 共用

调用关系如下：

```text
Codex / Cursor
    ↓ 读取飞书 Skills
    ↓ 执行本机 lark-cli
共用 CLI 安装与本地登录配置
    ↓ 用户身份或应用身份
飞书 OpenAPI
```

只需要安装一份 CLI。Codex 和 Cursor 分别发现技能后，可以调用同一个命令和本机账号配置，不必重复创建应用、重复保存密钥。

本次安装后的实际情况：

| 项目 | 结果 |
| --- | --- |
| Mac 环境 | Apple Silicon，Node.js 22.18.0 |
| CLI 版本 | `lark-cli 1.0.100` |
| CLI 可执行文件 | 位于当前 nvm Node 版本的 `bin/lark-cli` |
| 官方 Skills | 共 28 个，安装在 `~/.agents/skills/` |
| 安装目标 | Codex、Cursor |
| Wiki | 已成功读取两篇 Wiki 的目录 |
| 群聊 | 已成功获取群聊列表与一条历史消息 |
| 私聊 | 已成功定位指定联系人会话，读取最近 20 条消息 |
| MCP | 本文提供官方配置参考，本次未完成 MCP 端到端验收 |

这些是本机验证结果，不代表所有企业租户都开放了相同权限，也不代表每种文档、附件和消息类型都已测试。

## 三、安装飞书 CLI

### 1. 检查环境与已有配置

先检查是否已经安装，避免重复配置：

```bash
node -v
npm -v
npx -v
command -v lark-cli
```

如果能找到 CLI，再检查：

```bash
lark-cli --version
lark-cli profile list
lark-cli auth status
```

同时保留已有的 Codex、Cursor MCP 设置。**安装 CLI 不需要删除原有 MCP，也不需要在 MCP 配置中新增一个 CLI Server。**

### 2. 按官方指南安装

本次采用飞书官方 Agent 安装指南中的步骤：

```bash
npm install -g @larksuite/cli
```

为 Codex、Cursor 安装用户级 Skills：

```bash
npx -y skills add https://open.feishu.cn -g -a codex cursor --skill '*' -y
```

参数中，`-g` 表示用户级安装，`-a codex cursor` 指定目标 Agent，`--skill '*'` 安装该来源的全部技能。若已有同名技能或自行修改过技能内容，先备份并检查差异。

官方快速开始页面也提供一键入口：

```bash
npx @larksuite/cli@latest install
```

这是另一种安装入口，不需要把两种方式都重复执行。以当前官方指南和命令帮助为准。

### 3. 初始化飞书应用

**确认没有需要复用的配置后**，才执行：

```bash
lark-cli config init --new
```

CLI 会生成配置链接，在浏览器中完成应用创建或配置。登录、授权以及企业审批由用户在界面中确认。

已有应用或多个配置时，先查看：

```bash
lark-cli profile list
lark-cli config init --help
```

当前版本支持 `--name` 追加命名配置；不要直接重复执行初始化去覆盖默认配置。

### 4. 申请所需的用户读取权限

读取用户自己的文档和聊天，需要用户身份。本次先请求以下权限：

```bash
lark-cli auth login \
  --scope 'wiki:wiki:readonly docs:document.content:read im:chat:read im:message:readonly' \
  --no-wait --json
```

| 权限 | 用途 |
| --- | --- |
| `wiki:wiki:readonly` | 读取知识库相关信息 |
| `docs:document.content:read` | 查看云文档内容 |
| `im:chat:read` | 查看会话信息 |
| `im:message:readonly` | 获取聊天消息 |

这是基本读取验证的起点。按姓名搜索通讯录、跨会话搜索消息、读取特殊资源时，可能还需要其他权限。出现缺少权限的明确错误后，再决定是否补充。

`--no-wait --json` 会返回授权链接和设备码。打开这次新生成的链接，在飞书中检查并确认权限；完成后，Agent 使用本次返回的设备码完成登录：

```bash
lark-cli auth login --device-code '<本次返回的设备码>'
```

设备码属于临时认证信息，不要写进博客、配置示例或仓库。链接或二维码过期时，应重新发起同范围授权，不要反复刷新旧二维码。

**注意授权页的额外勾选项。** 本次页面默认勾选了“一并开通并授权消息与群组、云空间的免审权限”，最终实际授予范围包含了额外读写权限。命令只请求读取权限，不代表最后一定只获得读取权限；不需要这些能力时，应取消额外选项，再核对最终授权范围。

### 5. 验证登录

```bash
lark-cli auth status --json --verify
```

重点检查是否使用 `user` 身份、服务端验证是否成功，以及用户令牌是否可用。部分旧令牌可能显示 `needs_refresh`；本次后续实际读取成功，无需重新授权。最终仍要用真实业务读取来验收。

## 四、Codex 和 Cursor 如何共用

本次安装器把两个 Agent 的飞书 Skills 都安装到了共享目录：

```text
~/.agents/skills/
├── lark-shared/SKILL.md
├── lark-doc/SKILL.md
├── lark-wiki/SKILL.md
├── lark-im/SKILL.md
└── 其他 lark-* 技能
```

本机没有在 `~/.codex/skills/` 或 `~/.cursor/skills/` 中另放一份飞书技能。检查时应以安装器输出和实际文件为准，不要只看某个客户端的专属目录。

安装后完全退出并重开 Codex、Cursor，在新聊天中执行一次验证：

```text
使用本机飞书 CLI，只读获取这篇 Wiki 的目录。
请使用用户身份，不发送消息、不修改文档。
文档链接：<替换为自己的 Wiki 链接>
```

如果 Agent 找不到 CLI，先检查它的执行环境：

```bash
command -v lark-cli
lark-cli --version
```

使用 nvm 时，命令路径随 Node 版本变化。切换后找不到命令时，可按本文「nvm 切换 Node 后 CLI 可能找不到：原因与排查」章节排查，或将原生程序独立保存到固定目录。不要把别人电脑的路径直接复制到自己的设置中。

两个客户端共用 CLI，不表示它们的 MCP 配置文件也会自动同步；CLI 的登录态与 OpenAPI MCP 的登录态也不能默认互通。

## 五、如何读取 Wiki 文档

直接把 Wiki URL 交给文档读取命令即可，不需要手动把 Wiki 节点 Token 当成 Docx Token 使用：

```bash
lark-cli docs +fetch \
  --as user \
  --doc 'https://example.feishu.cn/wiki/<WIKI_TOKEN>' \
  --scope outline \
  --max-depth 2
```

先取目录，可以验证可读性并控制数据量。需要正文时再读取全文：

```bash
lark-cli docs +fetch \
  --as user \
  --doc 'https://example.feishu.cn/wiki/<WIKI_TOKEN>'
```

也可以限定关键词：

```bash
lark-cli docs +fetch \
  --as user \
  --doc 'https://example.feishu.cn/wiki/<WIKI_TOKEN>' \
  --scope keyword \
  --keyword '接口|验收'
```

`--scope outline` 成功，只能说明目录读取成功，不能写成“已读取全文”。文档中嵌入的多维表格、电子表格、图片等资源，也可能需要对应技能和额外权限。

`lark-doc` 负责正文读取与编辑；`lark-wiki` 主要负责知识空间、成员和节点结构管理。

## 六、如何读取某个人的聊天记录

### 1. 找到联系人或已有私聊

如果已有通讯录搜索权限：

```bash
lark-cli contact +search-user \
  --as user \
  --query '<同事姓名>' \
  --has-chatted
```

本次尝试时，返回缺少 `contact:user:search`。这代表**通讯录搜索未授权**，并不代表聊天记录读取失败。

可以选择补充这项权限，也可以用已有权限查看私聊列表，在返回结果中匹配姓名：

```bash
lark-cli im +chat-list \
  --as user \
  --types p2p \
  --page-size 100 \
  --sort active_time
```

返回的 `chat_id` 可以直接用于读取私聊。列表可能分页，不能只查一页就断定没有该联系人；同名时应先确认对应人。

### 2. 获取指定私聊的最近消息

```bash
lark-cli im +chat-messages-list \
  --as user \
  --chat-id 'oc_<会话ID>' \
  --page-size 20 \
  --order desc \
  --no-reactions
```

也可以在已知对方 `open_id` 时使用：

```bash
lark-cli im +chat-messages-list \
  --as user \
  --user-id 'ou_<用户ID>' \
  --page-size 20 \
  --no-reactions
```

`--chat-id` 和 `--user-id` 二选一。`--no-reactions` 表示本次不额外获取表情回复，附件默认也不会下载。

### 3. 限定时间范围与处理分页

```bash
lark-cli im +chat-messages-list \
  --as user \
  --chat-id 'oc_<会话ID>' \
  --start '2026-11-16T00:00:00+08:00' \
  --end '2026-11-19T00:00:00+08:00' \
  --page-size 20 \
  --no-reactions
```

当 `has_more` 为 `true` 时，仍有未读取的历史记录，按返回的分页游标继续。不要把最近 20 条消息描述成全部聊天记录。

读取范围是**当前授权用户能够访问的会话**，不能用自己的用户授权获取其他两个人之间、自己未参与的私聊。

### 4. 消息搜索是另一项能力

```bash
lark-cli im +messages-search --help
```

该命令用于跨聊天搜索消息，但搜索权限与会话历史读取权限不同。本次已验证的是私聊与群聊历史读取，没有完成跨会话消息搜索验收。

## 七、另一条路线：飞书 OpenAPI MCP

如果客户端需要通过 MCP 工具调用飞书，使用官方项目：

- npm 包：`@larksuiteoapi/lark-mcp`
- 仓库：[larksuite/lark-openapi-mcp](https://github.com/larksuite/lark-openapi-mcp)

它与 CLI 是两个独立工具。以下内容按官方 README 整理，**本次没有重新安装或验证 MCP 服务**。

### 1. 准备应用和 OAuth

在飞书开放平台创建或复用合适的应用，取得 App ID、App Secret，开放所需 API 权限。调用用户资源时，还要完成用户 OAuth 授权。

官方 MCP 文档的默认 OAuth 回调地址为：

```text
http://localhost:3000/callback
```

先在应用后台配置相同地址，再使用登录命令。可先看当前版本支持的选项：

```bash
npx -y @larksuiteoapi/lark-mcp login --help
npx -y @larksuiteoapi/lark-mcp mcp --help
```

官方用户登录命令的结构如下：

```bash
npx -y @larksuiteoapi/lark-mcp login \
  -a '<APP_ID>' \
  -s '<APP_SECRET>' \
  --scope offline_access docx:document:readonly
```

这里所有凭证均为占位符。真实密钥只保存在本机受保护的配置中，不要提交仓库。上述官方参数形式会把 Secret 放在进程参数中，使用时还应注意命令历史、进程查看和截图泄露。

### 2. Cursor 配置参考

将以下服务条目合并到 Cursor 的用户级 MCP 配置 `~/.cursor/mcp.json`，保留其他服务：

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
        "--oauth",
        "--token-mode",
        "user_access_token"
      ]
    }
  }
}
```

国内飞书默认使用 `https://open.feishu.cn`。国际版 Lark 的域名与应用要匹配，不能混用。

`--oauth` 配合 `--token-mode user_access_token`，明确使用个人用户令牌。仅配置 App ID、App Secret，不等于完成了个人账号授权；自动回退为应用身份时，也可能出现能调用接口却读不到个人资源的情况。

### 3. Codex 配置参考

Codex 对应的用户级配置在 `~/.codex/config.toml`。同样只合并新增服务块，不覆盖原文件：

```toml
[mcp_servers.lark-mcp]
command = "npx"
args = [
  "-y",
  "@larksuiteoapi/lark-mcp",
  "mcp",
  "-a", "<APP_ID>",
  "-s", "<APP_SECRET>",
  "--oauth",
  "--token-mode", "user_access_token"
]
```

这是相同 MCP 启动参数在 Codex 配置中的表达方式。配置后必须在对应客户端检查服务状态、工具列表和一次真实读取；不能仅凭配置保存成功就宣布接入完成。

### 4. 只加载需要的工具

官方 MCP 支持通过 `-t` 指定接口或预设。例如只加载消息列表接口，可在启动参数末尾加入：

```json
["-t", "im.v1.message.list"]
```

这只是需要追加到原 `args` 的参数片段，不是完整 MCP 配置。其他工具按官方工具列表选择，且必须与已授予的权限匹配。

限制加载工具与限制飞书授权是两回事：前者控制 Agent 能调用哪些 MCP 工具，后者控制应用和用户凭证能访问哪些 API。两层都需要检查。

### 5. 远程 MCP 的边界

远程 MCP 是另一种托管接入方式，不能直接套用本地 OpenAPI MCP 的启动配置。此前尝试远程 MCP 时，当前聊天没有可调用的飞书读取工具，因此未能取得 Wiki 正文。

这个结果说明当时会话工具不可用，不能据此断言文档没有权限、所有 MCP 都不支持 Wiki，或所有飞书 MCP 都不支持聊天。

远程服务的可用工具、有效期和迁移政策可能调整，使用前以飞书当前说明为准，不把临时托管服务当成长期可用保证。

## 八、官方 Skills 放在哪里，有哪些

本次实际安装路径是：

```text
~/.agents/skills/<技能名称>/SKILL.md
```

共 28 个。安装技能不等于获得该业务的授权。

| 技能 | 用途 |
| --- | --- |
| `lark-shared` | 登录、身份、权限与公共规则 |
| `lark-doc` | 云文档与 Wiki 正文 |
| `lark-wiki` | 知识空间、成员、节点结构 |
| `lark-im` | 私聊、群聊、消息与会话管理 |
| `lark-contact` | 通讯录搜索与人员资料 |
| `lark-drive` | 云盘、文件和权限 |
| `lark-markdown` | 飞书原生 Markdown 文件 |
| `lark-base` | 多维表格 |
| `lark-sheets` | 电子表格 |
| `lark-slides` | 幻灯片 |
| `lark-whiteboard` | 画板 |
| `lark-calendar` | 日历、日程、会议室 |
| `lark-meeting` | 会议、妙记与逐字稿 |
| `lark-mail` | 邮件 |
| `lark-task` | 任务与任务清单 |
| `lark-approval` | 审批 |
| `lark-attendance` | 考勤 |
| `lark-okr` | OKR |
| `lark-event` | 实时事件监听 |
| `lark-apps` | 妙搭应用开发与托管 |
| `lark-openapi-explorer` | 探索尚未封装的 OpenAPI |
| `lark-skill-maker` | 自定义飞书 Skill |
| `lark-workflow-meeting-summary` | 会议纪要汇总 |
| `lark-workflow-standup-report` | 日程与待办摘要 |
| `lark-minutes` | 兼容入口，转交 `lark-meeting` |
| `lark-note` | 兼容入口，转交 `lark-meeting` |
| `lark-vc` | 兼容入口，转交 `lark-meeting` |
| `lark-vc-agent` | 兼容入口，转交 `lark-meeting` |

CLI 自身也带有技能内容，可直接查询：

```bash
lark-cli skills list
lark-cli skills read lark-shared
lark-cli skills read lark-im
lark-cli skills read lark-im references/lark-im-chat-messages-list.md
```

如果本地 `SKILL.md` 引用了不存在的参考文件，可以使用最后一种方式读取 CLI 内嵌的对应文件。升级后的技能数量和内容可能变化，以实际版本为准。

## 九、nvm 切换 Node 后 CLI 可能找不到：原因与排查

### 1. 哪些情况下可能找不到命令

通过 `npm install -g @larksuite/cli` 安装时，“全局”通常是当前 nvm Node 版本的全局目录，并非所有 Node 版本共用。本次的命令入口位于：

```text
~/.nvm/versions/node/v22.18.0/bin/lark-cli
```

切换到另一个 Node 版本后，PATH 中的 Node 目录通常也会调整。如果目标版本没有安装 CLI，且 PATH 中没有其他可用的 `lark-cli` 入口，就可能出现 `command not found`。如果目标版本也安装了 CLI，或存在可用的独立入口，切换后仍可能正常使用。旧版本下安装的文件通常仍在，切回去后也可能重新找到。

因此，**切换 Node 不等于 CLI 一定失效**。也可能只是切换后调用了另一份 CLI，需要通过实际命令路径和版本判断。

**这通常是程序入口或 PATH 问题，不代表飞书授权、Skills 被删除。** 不要一遇到找不到命令就重新创建应用或重新授权。

### 2. 先确认当前执行的是哪一份

在出现问题的终端或 Agent 执行环境中检查：

```bash
node -v
nvm current
npm root -g
command -v lark-cli
type -a lark-cli
```

若能找到命令，再检查版本与认证：

```bash
lark-cli --version
lark-cli auth status --json --verify
```

`nvm` 是 Shell 函数，部分 Agent 非交互环境可能没有加载它；此时仍可通过 `node -v`、`npm root -g` 和命令路径判断环境。终端正常而 Codex、Cursor 异常时，应在对应 Agent 内检查，而不是只看外部终端。

临时恢复可在当前 Node 下重新执行 `npm install -g @larksuite/cli`。如果经常切换版本，并希望减少对各 Node 版本全局包的依赖，可以考虑下面的独立安装方案；当前使用正常时，不必仅因使用 nvm 就迁移。

### 3. 可选方案：独立保存原生程序

本次检查发现，npm 包中的 `scripts/run.js` 是 Node 启动入口，实际调用的是包内 `bin/lark-cli`。在这台 Apple Silicon Mac 上，后者是可独立执行的 `Mach-O arm64` 原生程序，直接运行已返回版本 `1.0.100`。

因此可以将**原生程序本体**复制到不受 nvm 管理的固定目录，例如：

```text
~/.local/bin/lark-cli
```

不要只复制 `scripts/run.js`，也不要建立指向 nvm 版本目录的符号链接；前者仍依赖 Node 和包目录，后者会在旧 Node 被卸载后失效。

**以下是后续可执行的迁移方案。本次仅验证了原生程序可直接运行，尚未在本机完成迁移。**

先切到已经安装飞书 CLI 的 Node 版本，再定位和验证原生文件：

```bash
# 版本号替换为自己安装 CLI 时所用的版本
nvm use 22.18.0

lark_native_bin="$(npm root -g)/@larksuite/cli/bin/lark-cli"
file "$lark_native_bin"
"$lark_native_bin" --version
```

确认文件存在、架构正确且能运行后，再复制：

```bash
mkdir -p "$HOME/.local/bin"

# -i 表示目标已存在时先询问，避免直接覆盖已有程序
cp -i "$lark_native_bin" "$HOME/.local/bin/lark-cli"
chmod u+x "$HOME/.local/bin/lark-cli"
"$HOME/.local/bin/lark-cli" --version
```

如果目标已有文件，先检查它的来源和版本，再决定是否覆盖；不要把另一个工具的同名入口替换掉。

### 4. 设置 PATH，并在切换后验收

使用 zsh 时，检查 `~/.zshrc` 是否已有相同配置。在 **nvm 初始化与其他 PATH 设置之后**，加入一次：

```bash
export PATH="$HOME/.local/bin:$PATH"
```

重新打开终端，或加载配置并清除命令缓存：

```bash
source "$HOME/.zshrc"
rehash
command -v lark-cli
type -a lark-cli
lark-cli --version
```

预期优先命中 `~/.local/bin/lark-cli`，而不是 `~/.nvm/versions/node/.../bin/lark-cli`。

再切换到另一个已安装的 Node 版本，重复检查命令路径、版本和一次 Wiki 读取。若仍命中 nvm 目录，检查是否有后续脚本重新调整 PATH，或存在同名 alias、函数。

Codex、Cursor 不一定与交互式终端加载完全相同的 Shell 配置。修改后完全退出再打开两个应用，并分别在 Agent 内执行 `command -v lark-cli`。若某个环境仍不读取该 PATH，可让 Agent 直接使用独立程序的绝对路径；以各自实际读取成功为验收标准。

该方案通常可继续使用原有飞书配置、系统钥匙串中的凭证以及 `~/.agents/skills/` 中的技能，无需为迁移程序再创建应用。认证报错时，再按具体错误排查。

### 5. 后续如何更新，避免更新错位置

独立程序是复制出来的一份文件。以后只执行 `npm install -g @larksuite/cli@latest`，更新的仍是当前 Node 的 npm 包，**不会自动同步已经复制到 `~/.local/bin/` 的程序**。

采用这条安装路线时，更新流程为：

1. 在选定的维护用 Node 版本下更新官方 npm 包。
2. 按上面的定位方式检查新包的原生文件，确认版本和运行正常。
3. 备份当前独立程序，再把新原生文件复制到固定目录。
4. 分别检查固定路径和 `command -v lark-cli` 返回的版本，确认没有继续调用旧入口。
5. 按官方说明更新 Skills，并在两个 Agent 中做一次只读验证。

不要假设未来版本仍使用相同包内结构，也不要默认 `lark-cli update` 一定更新的是独立副本；执行前先看当前版本帮助、更新目标路径和官方说明。

迁移完成后，旧 nvm 目录中的 CLI 可以暂时保留。只要固定目录优先命中，就不必急着卸载；但应避免两份程序版本不同却无法确认实际调用的是哪份。

### 6. 快速判断表

| 现象 | 优先检查 |
| --- | --- |
| 切换 Node 后 `command not found` | 新 Node 的全局包与 PATH；不先重新授权 |
| 删除旧 Node 后入口失效 | 是否只做了指向旧目录的符号链接 |
| 固定目录里有程序，实际仍用旧版 | `type -a lark-cli`、PATH 顺序、alias/函数与命令缓存 |
| 终端正常，Agent 找不到命令 | Agent 自身环境与应用重启；必要时使用独立绝对路径 |
| npm 更新成功，CLI 版本没变 | 独立副本尚未替换，或实际调用了另一份入口 |
| 命令能运行，但 Wiki/聊天报错 | 转查身份、授权与资源权限，不再归因于 nvm |

### 7. 本机实际切换测试（2026 年 11 月 18 日）

本次在临时子 Shell 中实际执行 `nvm use`，只检查命令路径与 `--version`，未重新安装 CLI、修改默认 Node 或变更飞书授权。

| Node 版本 | 沿用当前 Agent 的 PATH | 临时去除重复 nvm PATH 入口后 |
| --- | --- | --- |
| 14.17.0 | 可运行，命中 22.18.0 下的 CLI | 找不到 CLI |
| 16.16.0 | 可运行，命中 22.18.0 下的 CLI | 找不到 CLI |
| 16.20.2 | 可运行，命中 22.18.0 下的 CLI | 找不到 CLI |
| 18.20.8 | 可运行，命中 22.18.0 下的 CLI | 找不到 CLI |
| 22.16.0 | 可运行，命中 22.18.0 下的 CLI | 找不到 CLI |
| 22.18.0 | 可运行，CLI 版本 1.0.100 | 可运行，CLI 版本 1.0.100 |

当前 Agent 的 PATH 中，`~/.nvm/versions/node/v22.18.0/bin` 出现了两次。第一轮切换后仍能找到旧版本目录中的入口。第二轮仅在临时子进程中将初始 Node 入口保留一份，再逐个切换；其余路径保持原样，因此观察到上述差异。

**本机结论：切换 Node 后是否找不到 CLI，确实取决于 PATH 与目标版本的安装情况。** 当前 Agent 环境中能继续使用，并不能证明独立终端、重启后的应用或卸载旧 Node 后也一定可用。

测试结束后，调用环境仍使用 Node 22.18.0，默认别名仍为 22.18.0。此次没有执行独立安装迁移，也没有验证各版本下的飞书业务 API；表中“可运行”仅指 CLI 能启动并输出版本。

## 十、常见问题

| 现象 | 判断与处理 |
| --- | --- |
| 二维码或链接已失效 | 先检查配置、登录状态；如果仍需授权，重新生成对应链接。应用已创建时不要再创建一次 |
| Wiki 能读，按姓名搜人失败 | 检查具体缺少的权限，例如 `contact:user:search`，不要把它当成聊天读取失败 |
| 能列会话，但读不到指定消息 | 检查消息读取权限、身份、会话成员关系以及 API 可见范围 |
| MCP 已添加，但聊天中没有飞书工具 | 检查该客户端会话是否真正加载服务与工具；添加成功不等于当前聊天可调用 |
| 返回空列表 | 先核对是否使用了 `bot` 身份，以及是否查错资源范围；空成功不代表用户没有数据 |
| CLI 报 `keychain not initialized` | 检查当前执行环境能否访问 macOS 钥匙串；本次在可访问钥匙串的环境中执行后恢复，未降低凭证保护 |
| 想只读，但授权页出现更新、删除权限 | 检查额外勾选项与最终授予的 scope，必要时在飞书授权管理中撤销后重新授权 |
| 读完 20 条就没有后续了 | 检查 `has_more`，通过分页继续；不要推断这些就是全部记录 |

不要因为自动化环境访问不到钥匙串，就直接执行凭证存储降级。降级会改变凭证保护方式，应先解决执行环境的访问问题。

## 十一、本次验收结论

本次完成的是 CLI 路线：安装、共享技能、应用配置、用户授权，以及 Wiki、群聊、指定联系人私聊的只读验证。没有发送消息、修改飞书文档，也没有把真实聊天内容或凭证写入本文。

后续日常操作可以直接在 AI 聊天中提出需求，不需要手动记住所有命令；Agent 负责读取技能、选用命令和处理分页。遇到新增授权时，仍由用户查看具体权限后确认。

## 参考资料

- [飞书 CLI 官方安装指南](https://open.feishu.cn/document/no_class/mcp-archive/feishu-cli-installation-guide.md)
- [飞书 CLI：给 Agent 一双操作飞书的手](https://open.feishu.cn/document/mcp_open_tools/feishu-cli-let-ai-actually-do-your-work-in-feishu)
- [飞书 Agent 集成能力概述](https://open.feishu.cn/document/mcp_open_tools/overview-of-lark-agent-integration-capabilities)
- [飞书 CLI 官方仓库](https://github.com/larksuite/cli)
- [飞书 OpenAPI MCP 官方仓库与配置示例](https://github.com/larksuite/lark-openapi-mcp)
- [OpenAPI MCP 工具列表](https://github.com/larksuite/lark-openapi-mcp/blob/main/docs/reference/tool-presets/tools-en.md)

整理来源包括「飞书MCP读取聊天」中的方案讨论，以及后续 Mac 安装与读取验证。历史聊天中的命令建议未直接视为成功证据，本文以实际运行结果和官方用法为准。

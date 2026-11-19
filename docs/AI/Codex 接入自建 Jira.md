# Codex 接入自建 Jira

> 验证时间：2026 年 11 月 19 日。
> 验证环境：macOS、Codex 桌面端、Jira Server 8.20.11、mcp-atlassian 0.24.6。
> 文中的公司域名、账号、项目和工单编号均使用示例值，令牌只保留占位符。

开发时，缺陷描述、复现步骤和验收要求经常都在 Jira 中。让 AI 协助排查之前，通常要先把工单内容复制到聊天里；如果还要整理自己名下的缺陷，又得在浏览器中筛选一次。

这次我想让 Codex 直接完成这件事：

```text
查询分配给我的未解决缺陷，按优先级排序，附上工单链接。
```

接入过程中，先尝试了官方 Atlassian 插件，随后确认公司使用的是自建 Jira，最终通过开源项目 `mcp-atlassian` 接入成功。中间还遇到了钥匙串反复要求授权、连接配置完成后仍通过 Python 脚本查询等问题。

本文按这条过程整理，并补充另一种思路：在内置浏览器中登录业务系统，让 Codex 在有效登录态下直接操作页面。

## 一、Jira 是什么

[Jira](https://www.atlassian.com/software/jira/guides/getting-started/introduction) 是 Atlassian 提供的工作跟踪与项目管理工具。软件团队常用它管理需求、开发任务、缺陷和迭代，也可以按团队习惯配置自己的流程。

日常开发中，可以先理解几个概念：

| 概念 | 含义 | 示例 |
| --- | --- | --- |
| 项目（Project） | 一组相关工作的归属空间 | 某个产品或业务线 |
| 工单（Issue） | 一条需要跟踪的工作记录 | `PROJ-123` |
| 工单类型（Issue Type） | 区分不同性质的工作 | 需求、缺陷、开发任务、缺陷子任务 |
| 经办人（Assignee） | 当前负责处理这条工单的人 | 分配给我的缺陷 |
| 工作流（Workflow） | 工单在不同状态间流转的规则 | 打开、处理中、待验证、关闭 |

工单里通常还有优先级、描述、附件、评论和关联关系。对开发者来说，Jira 既是任务列表，也是理解问题背景的重要入口。

Jira 的查询语言叫 **JQL**。例如：

```text
assignee = currentUser() AND resolution IS EMPTY
ORDER BY priority DESC, updated DESC
```

这表示查询分配给当前登录账号、尚未填写解决结果的工单，并按优先级和更新时间排序。具体还要不要过滤“缺陷”，取决于项目里的工单类型设置。

## 二、公司使用的是自建 Jira

Jira 的部署方式会影响 AI 的接入方式。

| 部署方式 | 服务在哪里 | 接入时需要确认什么 |
| --- | --- | --- |
| Jira Cloud | Atlassian 托管的云服务 | Atlassian 账号、云站点、授权范围 |
| Jira Server / Data Center | 公司自行部署和维护 | 公司实例地址、版本、网络与实例认证方式 |

本次公司环境是 **Jira Server 8.20.11**，通过类似下面的地址访问：

```text
https://jira.example.com/browse/PROJ-123
```

公司自建实例中的账号与权限，不能直接当作 Atlassian Cloud 的授权来使用。浏览器能打开公司 Jira，也不代表某个云端连接器就能访问这台服务。

域名可以帮助初步判断，但最终应以管理员信息或实例返回的部署类型为准。排查时，我们通过实例的 `/rest/api/2/serverInfo` 返回信息确认了版本与 `Server` 部署类型；该接口能否匿名访问，以实际配置为准。

**接入前先确认部署方式，比先安装一个名字里带 Jira 的插件更有效。**

## 三、为什么要让 Codex 读取 Jira

Codex 已经可以在代码仓库中阅读文件、定位实现和修改代码。接入 Jira 后，就可以把工单与代码分析连起来：

1. 查询自己负责的缺陷。
2. 读取某张工单的描述、复现步骤和讨论。
3. 在当前工作区中定位相关模块。
4. 结合代码分析原因、提出修复方案并验证。

例如：

```text
读取 PROJ-123，整理复现步骤、预期行为和实际行为。
结合当前仓库定位可能相关的页面与接口，先给出分析。
```

这里先区分三层东西：

| 名称 | 在这次接入中的作用 |
| --- | --- |
| Codex | 理解任务、选择工具，并结合代码开展工作 |
| Atlassian 插件 | 客户端中的集成入口，背后有对应的服务和认证要求 |
| MCP Server | 按 MCP 协议提供查询、读取等工具，再通过 Jira API 访问数据 |

使用本地 MCP 后，调用关系是：

```text
Codex
  → 调用 jira_search / jira_get_issue 等工具
本机 mcp-atlassian 进程
  → 使用个人访问令牌访问 Jira REST API
公司自建 Jira
```

本地运行 MCP 解决的是服务访问与工具调用。查询结果仍会进入 AI 的任务上下文，不等于所有数据处理都只发生在本机。

## 四、先尝试官方 Atlassian 插件

一开始，我们在插件目录里找到了官方 Atlassian 集成。它提供 Jira、Confluence 等产品的读取和操作能力，从功能描述看，很适合查询工单。

但核对官方 MCP 文档后发现：**该服务的接入前提是 Atlassian Cloud 站点。公司这套自建 Jira，不能直接套用官方插件的云站点连接流程。**

官方仓库的 [Before you start](https://github.com/atlassian/atlassian-mcp-server#before-you-start) 明确列出了 Cloud 站点这一前提。

本次尝试期间曾返回“未连接”。这个错误本身只能说明当时连接没有建立，不能单独证明所有自建 Jira 都不支持；判断接入路线，还需要结合官方声明的支持范围。

这里也容易混淆两个名字很接近的项目：

| 项目 | 维护方 | 与本文场景的关系 |
| --- | --- | --- |
| `atlassian/atlassian-mcp-server` | Atlassian 官方 | 官方云端 MCP，面向 Atlassian Cloud |
| `sooperset/mcp-atlassian` | 开源社区 | 支持 Cloud 和 Server / Data Center，可连接公司自建实例 |

换用开源项目后，我们配置的是一个独立的本地 MCP 连接，没有修改官方插件的服务地址。

## 五、通过 mcp-atlassian 接入自建 Jira

[mcp-atlassian](https://github.com/sooperset/mcp-atlassian) 是面向 Jira 和 Confluence 的第三方开源 MCP Server。项目文档列出的 Jira Server / Data Center 支持范围为 **8.14 及以上版本**，本次公司环境在这个范围内。

这次使用的组合是：**本机安装 MCP Server + 公司 Jira 个人访问令牌 + Codex 用户级配置**。

### 1. 创建公司 Jira 的个人访问令牌

先登录公司 Jira，依次打开：

```text
右上角头像 → 个人资料（Profile）
  → 个人访问令牌（Personal access tokens）
  → 创建令牌（Create token）
```

给令牌填写用途名称，例如 `Codex`，设置有效期后创建，并在关闭页面前保存。

这里需要的是**在公司 Jira 实例中创建的 PAT（Personal Access Token）**，不是在 Atlassian 云账号管理页生成的 Cloud API Token。PAT 使用所属账号的权限，不会因为生成了令牌就自动获得更多项目权限。[官方 PAT 说明](https://confluence.atlassian.com/enterprise/using-personal-access-tokens-1026032365.html)

如果找不到入口，先确认实例版本以及管理员是否启用了该功能。

### 2. 安装 uv 和固定版本的工具

本次在 Mac 上通过 Homebrew 安装 `uv`：

```bash
brew install uv
```

再用独立工具环境安装这次验证的版本：

```bash
uv tool install --python 3.12 'mcp-atlassian==0.24.6'
```

这样不会向业务项目的 Python 环境中安装依赖。安装器会准备所需的 Python 与工具依赖。

查看可执行文件所在目录：

```bash
uv tool dir --bin
```

本次返回的是 `~/.local/bin`。可以用完整路径检查版本：

```bash
"$(uv tool dir --bin)/mcp-atlassian" --version
```

这次输出为 `mcp-atlassian, version 0.24.6`。其他版本、Docker 和 `uvx` 运行方式，可参考[项目安装文档](https://mcp-atlassian.soomiles.com/docs/installation)。

### 3. 追加 Codex 用户级配置

Codex 的用户级 MCP 配置位于 `~/.codex/config.toml`。编辑前先备份原文件，保留其中已有的模型、项目和其他 MCP 配置。

本次最终采用直接在个人配置中保存令牌的方式，示例如下：

```toml
[mcp_servers.company_jira]
command = "/Users/YOUR_USER/.local/bin/mcp-atlassian"
startup_timeout_sec = 60
tool_timeout_sec = 60

[mcp_servers.company_jira.env]
JIRA_URL = "https://jira.example.com"
JIRA_PERSONAL_TOKEN = "REPLACE_WITH_YOUR_JIRA_PAT"
READ_ONLY_MODE = "true"
JIRA_PROJECTS_FILTER = "PROJ"
```

替换其中的用户名、实例地址、令牌和项目标识；`command` 应填写上一步确认的实际完整路径。公司 Jira 如果部署在 `/jira` 这样的子路径下，`JIRA_URL` 也要保留该实例路径。

| 配置项 | 含义 |
| --- | --- |
| `company_jira` | 自定义连接名称，后续检查时使用同一个名字 |
| `JIRA_URL` | 自建 Jira 的实例地址，不是某张工单的 URL |
| `JIRA_PERSONAL_TOKEN` | 公司 Jira 的个人访问令牌 |
| `READ_ONLY_MODE` | 本地 MCP 以只读模式提供工具 |
| `JIRA_PROJECTS_FILTER` | 设置需要查询的项目范围，多个项目可用逗号分隔 |

项目过滤是 MCP 中的查询范围设置，最终数据访问权限仍由 Jira 账号权限控制；服务端权限也不会因为开启只读模式而被修改。[项目配置说明](https://mcp-atlassian.soomiles.com/docs/configuration)

将配置文件限制为仅当前用户可读写：

```bash
chmod 600 ~/.codex/config.toml
```

**这个方案会把令牌以明文写入个人配置。** `600` 只限制文件访问权限，不提供加密；不要把真实配置或含令牌的备份提交到仓库。若企业要求统一管理凭证，可以改用密码管理器或钥匙串读取方式。

Codex 使用 TOML 配置，网上用于其他客户端的 `mcpServers` JSON 示例，需要转换格式后才能放入这个文件。[Codex MCP 配置文档](https://developers.openai.com/codex/mcp/)

### 4. 重启客户端并确认工具已经加载

保存配置后，可以先检查：

```bash
codex mcp get company_jira
```

它可以帮助确认连接配置是否被识别，但还不能代替实际业务读取。

本次修改配置后，旧聊天没有立即加载新的工具。重启 Codex 后，当前聊天中出现了对应 Jira 工具，随后直接查询成功。遇到类似情况，可以重启客户端并重新检查；必要时新开聊天。

### 5. 用真实查询完成验收

可以让 Codex 执行：

```text
使用 company_jira 查询 PROJ 项目中分配给我的未解决缺陷，
包含缺陷子任务，按优先级排序，返回标题、状态和工单链接。
```

或者读取单张工单：

```text
读取 PROJ-123，整理问题描述、复现步骤和待确认事项。
```

本次最终验证了：

| 验证项 | 结果 |
| --- | --- |
| 当前账号认证 | 成功 |
| 单张工单读取 | 成功获取标题、状态和经办人 |
| 查询分配给自己的未解决缺陷 | 成功，返回两条缺陷子任务 |
| 客户端原生工具调用 | 重启后成功，无需再运行临时查询脚本 |
| Jira 写入操作 | 未执行，本次连接保持只读 |

## 六、接入中遇到的问题

### 1. 浏览器能打开，程序却访问不了

本次排查时，受限执行环境里一度无法解析公司 Jira 域名；改在本机终端验证后，站点可以访问，但匿名请求会跳到登录页。

这对应两个不同的问题：

- **网络可达性**：程序所在环境能否解析域名、连接公司网络或 VPN。
- **业务认证**：请求是否带上了 Jira 接受的登录凭据。

遇到这类问题，先核对执行环境、网络和认证，不要因为一次域名解析失败，就判断整台电脑无法访问；也不要因为浏览器已经登录，就认为 MCP 或独立 HTTP 请求自动拥有同样的登录态。

### 2. 为什么查询 Jira 会要求输入 Mac 登录密码

最初我们把 PAT 保存在 macOS 钥匙串，使用下面的配置按需取出：

```toml
JIRA_PERSONAL_TOKEN_COMMAND = "/usr/bin/security find-generic-password -s company-jira -a YOUR_USER -w"
```

这个示例的前提是，钥匙串中已经存在服务名为 `company-jira`、账号为 `YOUR_USER` 的对应条目。

读取时，macOS 可能弹出系统授权框，要求允许 `security` 访问该条目。此时输入本机密码，是在批准读取钥匙串里的令牌，不是在用 Mac 登录密码认证 Jira。

Apple 对两个按钮的解释很明确：“允许一次”只批准当前访问，下次可能再次询问；“始终允许”会保存持续访问授权。[Apple 中文说明](https://support.apple.com/zh-cn/guide/keychain-access/kyca1243/mac)

此外，`mcp-atlassian` 会在首次需要凭证时运行读取命令，并在同一个进程内复用结果。临时脚本每次重新启动 MCP 进程，就可能重新触发凭证读取；如果没有持续授权，弹窗便会反复出现。

本次为了减少交互，最终选择把 PAT 直接保存到个人配置中，并移除 `JIRA_PERSONAL_TOKEN_COMMAND`。迁移后验证通过，查询不再依赖钥匙串读取。钥匙串方案仍可使用，前提是把对应条目的访问授权配置好。

这两种方案选择一种即可。是否允许明文保存，要结合本机使用习惯和公司的凭证管理要求决定。

### 3. 为什么之前每次都在执行一份 Python 脚本

安装后，工具已经可以在本机启动，但当前聊天尚未加载这个 MCP。为了先验证连接，我们用 Python MCP 客户端启动服务，再调用 `jira_get_issue` 和 `jira_search`。

这种做法适合安装排查，但后续继续沿用，就会让每次查询都表现为“运行脚本、启动服务、读取凭证、请求 Jira”。

客户端重启并加载连接后，Codex 已经可以直接调用工具：

```text
原来的验证方式：Codex → 临时 Python 客户端 → MCP Server → Jira
接入后的使用方式：Codex → 已加载的 MCP 工具 → Jira
```

`mcp-atlassian` 本身仍然是后台运行的 Python 程序，但日常查询不需要另外编写或执行一份桥接脚本。**“包已安装”“配置已保存”“聊天已获得工具”是三个需要分别确认的状态。**

### 4. “我的缺陷”为什么可能查不全

首先要把“我的”说清楚：这里查询的是**经办人为当前账号**的工单，不等同于由我报告、我参与讨论或我关注的所有工单。

其次，项目可能把具体工作分配到“缺陷子任务”。只筛选 `Bug` 或“缺陷”，可能会漏掉真正分配给开发者的记录。

可以先检查实际类型，再使用类似的 JQL：

```text
project = PROJ
AND assignee = currentUser()
AND issuetype in ("缺陷", "缺陷子任务")
AND resolution IS EMPTY
ORDER BY priority DESC, updated DESC
```

类型名称和 ID 都要以当前实例为准，不能照抄另一家公司的定义。`resolution IS EMPTY` 与具体状态名也不是同一概念；若团队定义的“未完成”范围不同，需要相应调整条件。

同时检查 `JIRA_PROJECTS_FILTER`、当前账号权限，以及搜索结果是否还有后续分页。本次查询范围只覆盖配置的一个项目，不代表已经查询了公司所有项目。

## 七、另一种思路：通过内置浏览器访问

有些系统没有合适的 MCP，也不方便申请 API 凭证。这时，可以直接通过 Codex 当前客户端提供的内置浏览器访问页面。

调用方式变为：

```text
Codex → 内置浏览器中的已登录页面 → 筛选列表、打开工单、读取内容
```

### 1. 在内置浏览器里完成登录

可以这样开始：

```text
使用内置浏览器打开 https://jira.example.com。
如果需要登录，交给我手动完成；登录后继续查看分配给我的缺陷。
```

用户在浏览器中完成账号、验证码或 SSO 登录后，浏览器会按网站规则保存 Cookie 等会话信息。只要相关数据仍被保留、服务端会话也仍有效，后续就可以继续在该浏览器环境中操作。

需要保留的是**浏览器会话**，不必把密码或 Cookie 复制到聊天和文档里。

内置浏览器有独立的用户配置，不会自动继承日常 Chrome 的登录态。应在实际使用的浏览器中完成登录，或者使用客户端支持的浏览器扩展、配置导入能力；这些功能是否可用，以当前客户端为准。[官方 Browser 文档](https://learn.chatgpt.com/docs/browser)

### 2. 登录后，让 Codex 根据页面完成任务

例如：

```text
使用内置浏览器进入公司 Jira。
筛选分配给我的未解决缺陷，包含缺陷子任务。
整理标题、优先级、状态和链接；列表有分页时继续检查。
本次只读取，不修改工单。
```

它会根据页面当前内容选择筛选条件、进入详情和提取信息。对没有接入工具的内部管理系统，这是一条可尝试的通用路线。

### 3. 登录态可以复用，但有边界

网站会话过期、主动退出、清理浏览器数据、切换浏览器配置、SSO 要求重新认证等，都可能使登录失效。能否跨聊天或跨重启复用，还取决于客户端实际使用的浏览器环境。

因此，后续任务应先确认页面仍处于登录状态，再继续操作。浏览器路线也需要可用的浏览器控制工具和公司网络；在某个终端或云端环境中运行 Codex，不代表一定拥有桌面端的浏览器能力。

**本次完成端到端验收的是 MCP 路线。浏览器控制尝试曾超时，因此这一节是替代方案说明，不代表已经通过浏览器成功读到了公司 Jira 工单。**

## 八、MCP 与浏览器怎么选

| 场景 | 优先考虑 |
| --- | --- |
| Jira Cloud，官方集成满足需求 | 官方 Atlassian 插件 / MCP |
| 自建 Jira，支持 PAT，希望长期查询工单 | 本地 `mcp-atlassian` |
| 系统缺少合适的集成，但可以正常网页登录 | 内置浏览器 |
| 批量筛选、分页查询、提取固定字段 | MCP 更便于结构化处理 |
| 查看页面效果、附件展示、复杂 UI 或插件页面 | 浏览器更便于观察实际界面 |

我会把本次验证成功的 MCP 作为日常读取入口，再在需要观察页面时使用浏览器。两者的认证相互独立：浏览器登录不等于 MCP 已授权，MCP 有效也不等于网页已经登录。

对其他业务平台也可以沿用这个判断过程：先确认现有集成是否支持当前部署方式，再考虑本地工具；如果页面可操作而接口接入成本较高，就尝试保留有效浏览器会话来完成任务。

## 参考链接

- [Jira 官方入门：What is Jira?](https://www.atlassian.com/software/jira/guides/getting-started/introduction)
- [Atlassian 官方 MCP 仓库与接入前提](https://github.com/atlassian/atlassian-mcp-server)
- [开源项目 mcp-atlassian](https://github.com/sooperset/mcp-atlassian)
- [mcp-atlassian 安装](https://mcp-atlassian.soomiles.com/docs/installation)
- [mcp-atlassian 认证与 PAT 配置](https://mcp-atlassian.soomiles.com/docs/authentication)
- [mcp-atlassian 配置与凭证读取命令](https://mcp-atlassian.soomiles.com/docs/configuration)
- [Atlassian：使用个人访问令牌](https://confluence.atlassian.com/enterprise/using-personal-access-tokens-1026032365.html)
- [Codex MCP 配置文档](https://developers.openai.com/codex/mcp/)
- [官方 Browser 文档](https://learn.chatgpt.com/docs/browser)
- [Apple：如果系统请求访问 Mac 上的钥匙串](https://support.apple.com/zh-cn/guide/keychain-access/kyca1243/mac)
- [uv 安装指南](https://docs.astral.sh/uv/getting-started/installation/)
- [相关笔记：飞书 CLI 与 MCP 接入实战](</AI/飞书 CLI 与 MCP 接入实战.md>)
- [相关笔记：AI Coding 自测（二）：内置浏览器与 Playwright 对比](</AI/AI Coding 自测（二）：内置浏览器与 Playwright 对比.md>)

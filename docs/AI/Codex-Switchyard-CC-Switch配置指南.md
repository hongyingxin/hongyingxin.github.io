# 在 Mac 上配置 Codex：从 Switchyard 公司 API 到 CC Switch 双模式切换

> AI 生成说明：本文由 AI 辅助整理与撰写。

如果公司提供了统一的 AI API 网关，我们可以让 Codex 桌面应用使用公司 Key 处理工作任务，同时保留个人 ChatGPT 账号处理自己的业务。

本文记录一套已经验证可用的配置流程：先接入 Switchyard，再使用 CC Switch 管理个人和公司两种模式。

## 一、准备 Switchyard API Key

打开公司的 [Switchyard 使用指南](https://switchyard.newlang.cn/guide)，通过飞书登录。

进入「密钥管理」，生成并保存自己的 API Key。密钥通常只在创建时完整显示一次，不要把它发到聊天、截图中，也不要提交到 Git 仓库。

本次使用的连接参数如下：

| 参数 | 内容 |
|---|---|
| 服务商 | Switchyard |
| API 地址 | `https://switchyard.newlang.cn/v1` |
| API 协议 | Responses API |
| 模型名称 | `gpt-5.4` |
| API Key | 自己在 Switchyard 获取的密钥 |

这里的 `gpt-5.4` 是公司网关中的虚拟模型名称。实际请求哪个模型，由 Switchyard 的个人、团队或全局映射规则决定。

## 二、配置 Codex 桌面应用

Mac 版 Codex 桌面应用会读取 `~/.codex/config.toml`，不需要为了配置桌面端另外安装 Codex CLI。

修改前先备份原文件。编辑时可以使用图形化编辑器，不必使用 Vim。

将以下内容合并到配置中：

```toml
model_provider = "switchyard"
model = "gpt-5.4"
model_reasoning_effort = "medium"
personality = "pragmatic"
disable_response_storage = true
preferred_auth_method = "apikey"

[model_providers.switchyard]
name = "switchyard"
base_url = "https://switchyard.newlang.cn/v1"
wire_api = "responses"
requires_openai_auth = false
http_headers = { "x-openai-actor-authorization" = "switchyard" }
experimental_bearer_token = "替换为自己的 Switchyard API Key"
```

编辑时注意三点：

- 前六行是全局设置，应放在第一个 TOML 表头之前。
- 已有同名配置项就修改，不要重复添加，也不要覆盖其他插件、MCP 等设置。
- API Key 保留英文双引号，只替换引号里面的内容。

这段配置来自公司的使用指南，其中额外请求头属于公司提供的兼容配置。指南说明，**Codex 0.149 及以上通过 `experimental_bearer_token` 配置密钥，无需修改 `auth.json`**。本次实际检查的内置 Codex 版本高于该要求。

保存后，按 **⌘Q** 完全退出 Codex，再重新打开。桌面应用读取配置的机制可参考 [OpenAI 官方网关说明](https://learn.chatgpt.com/docs/enterprise/connect-to-a-gateway)。

## 三、确认请求确实走公司 API

重启后，新建一个聊天，发送简单的测试消息，例如：

```text
只回复：连接成功
```

收到回复后，打开 Switchyard，查看调用记录，确认有一条与测试时间一致、属于自己 Key 的请求。

**能收到回复，只能证明请求成功；公司网关中出现对应记录，才能确认使用了公司 API。**

不要通过询问模型“你是什么模型”来判断路由，也不要仅凭界面显示的模型名称判断实际后端。

## 四、为什么个人信息入口变了？

切换到公司 API 后，本次配置下的左下角菜单显示为 `switchyard`，原来的一些个人账号入口也不再显示。

这是应用使用公司 API 模式后的界面变化，并不代表个人 ChatGPT 账号被删除，也不代表 Plus 已自动取消。

个人账号和订阅仍可以通过 [ChatGPT 官网](https://chatgpt.com/)管理。公司 API 与个人订阅是两套独立的使用和计费关系。

如果还需要用个人账号处理自己的业务，就需要在两种模式之间切换。为了避免反复修改配置文件，可以使用 CC Switch。

## 五、安装 CC Switch 并导入配置

从 [CC Switch 项目仓库](https://github.com/farion1231/cc-switch)下载适合 Mac 的安装包，安装后打开应用。

如果 Homebrew 安装长时间停留在：

```text
Auto-updating Homebrew...
```

表示它还在更新 Homebrew，不一定已经开始下载 CC Switch。改用手动安装包时，可在原终端按 **Control + C** 停止安装流程。

首次打开 CC Switch 后，选择左侧的 **Codex**。本次安装自动导入了原来的公司配置，界面中出现两个入口：

| 入口 | 含义 |
|---|---|
| OpenAI Official | 使用个人 ChatGPT 官方登录 |
| default | 从本地导入的 Switchyard 公司配置 |

检查 `default` 下方的地址是否为：

```text
https://switchyard.newlang.cn/v1
```

确认后，可以点击铅笔图标，将它改名为「公司 Switchyard」，方便区分。已有 Key 和其他参数不需要重新填写。

## 六、日常如何切换？

保持 CC Switch 的**直连模式**即可。

处理个人业务时：

1. 等当前任务结束。
2. 在 CC Switch 中启用 **OpenAI Official**。
3. 在 Codex 中按 **⌘Q** 完全退出，再重新打开。
4. 如果提示登录，使用自己的 ChatGPT 账号登录。
5. 新建个人业务的聊天。

处理公司业务时：

1. 在 CC Switch 中启用「公司 Switchyard」。
2. 完全退出并重新打开 Codex。
3. 新建公司业务的聊天。
4. 首次切换后，可再次检查 Switchyard 调用记录。

**直连模式下，每次切换都需要重启 Codex，但不需要重启电脑或 CC Switch。** 仅关闭窗口不等于退出应用。[CC Switch 切换说明](https://github.com/farion1231/cc-switch/blob/main/docs/user-manual/en/2-providers/2.2-switch.md)

新版 CC Switch 还提供“直连切换时保留官方登录”的设置，用于控制切到第三方 API 时是否保留官方登录状态。保留登录与请求使用哪个服务商是两回事，实际调用仍需核对当前启用的配置。

## 七、个人与公司业务的使用边界

CC Switch 解决的是**服务商配置切换**，不会自动隔离个人和公司的聊天历史。

因此，个人与公司业务应分别新建聊天。不要切到公司网关后，继续发送包含私人内容的旧聊天；旧聊天上下文可能随下一次请求一起发送。

如果仍需要个人账号的 Plus 权益，可以保留订阅；如果只使用公司 API，则可以根据自己的其他使用需求决定是否取消。切换 API 本身不会停止 Plus 自动续费。

完成配置后，日常只需要记住一个流程：

**在 CC Switch 选择用途对应的服务商 → 完全退出并重开 Codex → 新建对应业务的聊天。**

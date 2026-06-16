# jenkins 实战

## 自动化部署

Jenkins想要实现自动化部署，需要通过 Webhooks 将 Github 仓库与 Jenkins 关联起来。当仓库发生变化时，Github 会通过 Jenkins 自动触发。

### Generic Webhook Trigger vs GitHub Plugin

Github Plugin 是搭建 Jenkins 自动安装的推荐基本插件，自带 Webhook 触发功能。配置非常简单，勾选一下，然后把生成的 URL 填到 Github 里就搞定了。

Generic Webhook Trigger 是万能触发器，需要我们自己到 Jenkins 的插件商店下载，支持定义 JSON 和配置安全 Token。

### 目标仓库 Github vs Codeup

**Github 配置 Webhook**

- 打开目标仓库，点击右上角的 Setting -> Webhooks -> Add webhook

- PayLoad URL 填写我们的 Jenkins 域名，格式如下：`http://你的服务器IP:端口/github-webhook/`**（固定格式）**

- Content type 选择 application/json，Which event 选择 Just the push event，点击 Add webhook 完成配置

**Codeup 配置 Webhook**

- 登陆阿里云 Codeup，打开目标代码库，点击左侧菜单的 设置 -> Webhooks -> 添加 Webhook

- 填写链接URL，数据 Jenkins 触发地址，格式如下：`http://你的服务器IP:端口/generic-webhook-trigger/invoke?token=[配置的Token]`

- 勾选触发事件，确认保存。
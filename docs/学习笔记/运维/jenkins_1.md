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

## Jenkins 访问 Codeup

1. 生成 SSH 密钥对

登陆到运行 Jenkins 的服务器，在终端运行以下命令

```bash
# 切换到 jenkins 用户，如果没有多角色，这行可以忽略
su - jenkins
# 生成 SSH 密钥
ssh-keygen -t ed25519 -C “jenkins_codeup”
```

提示保存路径时，若不想覆盖原有的`is_rsa`，可以重命名，然后一路回车即可。

2. 将公钥添加到 Codeup

打开并复制刚刚生成的公钥内容

```bash
cat ~/.ssh/id_ed25519.pub
```

登陆阿里云Codeup

点击右上角头像 -> 个人设置 -> SSH公钥

点击 添加目标公钥，把复制的内容粘贴进去，标题随意填写（如：Mac-Jenkins），点击确定。

3. 将私钥配置到 Jenkins 凭据

- 登录 Jenkins 仪表盘，依次进入 系统管理 (Manage Jenkins) ➡️ 凭据 (Credentials) ➡️ 系统 (System) ➡️ 全局凭据 (Global credentials)。

- 点击左侧的 添加凭据 (Add Credentials)。

- 按如下配置填写：
  - 类型 (Kind): SSH Username with private key
  - 范围 (Scope): Global (Jenkins, nodes, items, all child items)
  - ID: 自定义（如 codeup-ssh-key，后续流水线中会用到）
  - 描述 (Description): 填写描述信息（如 Codeup 仓库 SSH 密钥）
  - 用户名 (Username): 建议填写你在 Codeup 上的账号（如你的邮箱或注册名）
  - 私钥 (Private Key): 选择 直接输入 (Enter directly)，然后点击 添加 (Add)，将 Jenkins 服务器上的私钥内容（通常为 ~/.ssh/id_ed25519 的内容）粘贴进去。有密码的话同时填入 Passphrase，无密码则留空。

- 点击 确定 (OK) 保存。

4. 验证主机指纹

为了避免 Jenkins 构建时因首次连接 Codeup 弹出询问验证而导致卡住，必须手动确认主机指纹。

在 Jenkins 终端执行以下命令：

```bash
ssh -T git@codeup.aliyun.com
```

5. 测试拉取代码

在 Jenkins 中创建一个新任务，选择 流水线 (Pipeline) 类型

```groovy
pipeline {
    agent any

    stages {
        stage('测试拉取代码') {
            steps {
                echo '开始从 阿里云 Codeup 拉取代码...'
                
                // 这里使用你刚才在 Jenkins 凭据里填写的 ID：codeup-ssh-key
                git credentialsId: 'codeup-ssh-key', 
                    url: 'git@codeup.aliyun.com:你的组织名/你的项目名.git', 
                    branch: 'master' // 如果是 main 分支请改为 main
                
                echo '代码拉取成功！'
                
                // 顺便打印一下拉取下来的文件目录，证明真的拉到了
                sh 'ls -la'
            }
        }
    }
}
```

## Jenkins 访问不同服务器

在实际的生产环境中，Jenkins 服务器与部署服务器分离是最标准、最安全的架构。这样可以避免 Jenkins 在编译代码时占用过高内存，从而影响线上业务的稳定性。

既然两台服务器独立，核心的解决思路就很简单：在 Jenkins 上打包，然后通过 SSH 协议将打包后的文件传输到远端部署服务器，最后在远端解压并让 Nginx 生效。

这里使用密钥对的方式，将 Jenkins 服务器与部署服务器关联起来。

1. 生成 SSH 密钥对

生成一对名为`id_rsa_deploy`的密钥对

```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa_deploy -N ""
```

2. 把“锁”传给远端服务器

把公钥的内容，写进远端服务器的信任列表里

```bash
ssh-copy-id -i ~/.ssh/id_rsa_deploy.pub root@你的远端服务器IP
```

回车，会出现以下提示词：Are you sure you want to continue connecting (yes/no/[fingerprint])?

输入 yes，然后回车，这时候需要输出远端服务器的root登陆密码

看到提示 Number of key(s) added: 1，就说明成功了！

这里也有另一种方法，在远端`/root/.ssh/authorized_keys`文件中，追加公钥内容

3. 把“钥匙”存进 Jenkins 凭据

```bash
cat ~/.ssh/id_rsa_deploy
```

Jenkins 网页 -> 添加凭据 -> 选择 SSH Username with private key

把刚刚复制的私钥内容粘贴到 Jenkins 里，给它起个 ID 叫 deploy-server-key

Jenkins 使用 ssh 传输文件，需要去安装 SSH Agent 插件，这个插件用来动态加载密钥进行 scp 和 ssh 操作。

## 两个 ssh-keygen 命令的区别

这两个命令的核心区别在于加密算法不同以及自动化程度不同。我们可以逐个参数对齐来看：

| 参数 | `ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa_deploy -N ""` | `ssh-keygen -t ed25519 -C "jenkins_codeup"` |
| --- | --- | --- |
| `-t`（算法） | rsa：老牌加密算法，兼容性无敌。 | ed25519：现代加密算法，比 RSA 更安全、更小、解析更快。 |
| `-b`（位数） | 4096：RSA 必须指定位数（2048 位及以上才安全，4096 是最高安全级）。 | 无：Ed25519 长度固定，不需要指定位数。 |
| `-f`（路径） | `~/.ssh/id_rsa_deploy`：直接指定了文件名，不会覆盖你默认的 `id_rsa`，非常安全。 | 无：没有指定。运行时终端会停下来问你「存成什么名字」，如果一路回车，会默认叫 `id_ed25519`。 |
| `-N ""`（密码） | `""`：直接指定密码短语为空，全程闭眼自动生成，不会弹窗打扰。 | 无：没有指定。运行时终端会停下来两次，问你要不要给密钥加密码。 |
| `-C`（注释） | 无 | `"jenkins_codeup"`：给公钥末尾加个「小尾巴」注释，方便你以后在 Codeup 后台一眼看出这是给谁用的。 |

## webhook 触发器

1. Jenkins 配置 webhook 监听器，语法如下

```groovy
// 【新增配置】触发器：监听 Codeup 的 Webhook 信号
triggers {
    GenericTrigger(
        genericVariables: [
            // 从 Codeup 传过来的 JSON 数据中提取推送的分支名
            [key: 'push_branch', value: '$.ref']
        ],
        // 【核心暗号】自定义一个只有你和 Codeup 知道的 Token
        token: 'dev-webhook', 
        
        // 正则过滤器：只有当推送的分支正好是 dev 分支时，才允许触发构建
        regexpFilterText: '$push_branch',
        regexpFilterExpression: 'refs/heads/dev',
        
        causeString: 'Triggered by Codeup Webhook for dev branch',
        silentResponse: false
    )
}
```

2. 阿里云 Codeup 后台配置 Webhook

打开目标仓库 -> 点击左侧菜单最下方的设置 -> 选择 Webhooks -> 点击右上角的新建 Webhook -> 填写配置信息

URL：填写 Jenkins 接收暗号的专用外部地址，格式如下：

```Plaintext
http://<你的Jenkins服务器公网IP>:<端口>/generic-webhook-trigger/invoke?token=faha-front-dev-webhook
```

选择触发事件(Triggers)：勾选推送事件(Push events)

点击保存

**测试**

阿里云 Codeup 的 Webhook 设置页面，可以测试 Webhook，以及历史测试记录，我们可以在这里进行测试，排查错误情况。

**Generic Webhook Trigger jenkins插件**

Jenkins 配置完 webhook 后，需要手动点击一次“立即构建”，才能触发。当这次手动构建成功后，配置的 Triggers 区域的 Generic Webhook Trigger 已经被 Jenkins 自动勾选上了，而且展开后的 Token 栏里写的 faha-front-dev-webhook。

**Jenkins 的冷启动限制：**

当你在 Jenkinsfile 里新写了或者修改了 triggers 触发器，Jenkins 在没运行过这个文件之前，是根本不知道你加了触发器的。它必须被手动执行一次，解析了整段 Groovy 代码后，才会把这个 Webhook 监听器真正注册到系统里。

## 内网穿透

内网穿透（NAT 穿透）是一种让处于局域网（内网）中的设备能够被互联网（外网）直接访问的技术。

通常情况下，家里的电脑或私有 NAS 只有局域网 IP（如 192.168.x.x），由于没有公网 IP，且受到路由器 NAT（网络地址转换）设备的阻挡，外网设备无法直接发起连接。内网穿透技术通过建立一条安全的通信隧道，将公网的请求无缝转发到你的内网设备上。

工作原理

大部分内网穿透都基于“中转服务器”机制，具体流程如下：

1. 建立隧道：处于内网的设备主动向一台拥有公网 IP 的中转服务器发起连接，并维持这个连接。

2. 分配地址：中转服务器为内网设备分配一个公网可访问的特定域名和端口号。

3. 请求转发：当你在外网访问这个公网域名和端口时，中转服务器会将请求顺着之前建立好的隧道，精准“牵线搭桥”传回给内网设备，实现双向数据互通。

因为 Jenkins 是本地跑的服务，阿里云 Codeup 在云端无法访问，这导致了 Webhook 无法触发。

这里采用 Cloudflare Tunnel 来解决这个问题。

Cloudflare 官方提供了一种叫 Quick Tunnels(匿名快速隧道) 的服务，可以在不注册帐号的请求下做零时穿透，但每次重启终端域名都会变，所以主要走 named Tunnel(永久固定隧道)。

1. 在 Cloudflare 后台创建永久隧道

- 登录你的 Cloudflare 官网后台。

- 在左侧菜单栏点击 Zero Trust（如果是第一次进入，根据提示免费开通即可，不需要绑定信用卡）。

进入 Zero Trust 控制台后，点击左侧的 Networks ➔ Tunnels，然后点击 Create a tunnel。

选择 Cloudflared（默认选中的），点击 Next。

给你的隧道起个名字（比如叫 mac-jenkins），点击 Save tunnel。

2. 本地 Mac 绑定隧道

- 选好名字保存后，网页上会让你选择你的操作系统，点击 Mac。

- 网页下方会直接给你生成好一段安装和运行命令，长得像下面这样（带有你独一无二的专属 Token）：

- 复制这一整行命令，粘贴到你 Mac 的终端里回车执行。

这行命令主要是下载客户端，执行`service install`，把本地的隧道注册成 Mac 的系统服务。

3. 把域名和本地 Jenkins 端口缝合

完成上一步后，回到 CF 网页，你会看到网页下方的 Status 变成了 Connected（说明你的 Mac 已经和云端对接成功）。点击 Next 进入下一步：

在 Public Hostnames 界面填写想要的固定域名：

- Subdomain（子域名）：填 jk 或者 jenkins

- Domain（主域名）：下拉菜单里直接选择你那个在 CF 解析的个人域名。

- Type（类型）：选择 HTTP

- URL（路径）：填 localhost:8080（你本地 Jenkins 的地址）

点击 Save tunnel。大功告成！Cloudflare 会自动在你的域名解析里加一条记录，把这个子域名彻底指向你的 Mac。

域名配置好了，可以直接访问，如果能看到 Jenkins 登陆界面，说明 Cloudflare 成功穿透内网，公网专线开通。

4. 阿里云 Codeup 绑定 Webhook 地址


**整个自动化流水线的闭环流向如下：**

开发者 ➔ Push 代码到 阿里云 Codeup。

Codeup ➔ 发送 Webhook 信号 ➔ Cloudflare 免费隧道 (trycloudflare.com)。

Cloudflare ➔ 把信号穿透回 ➔ 你本地的 Mac (Jenkins)。

本地 Jenkins ➔ 触发打包命令（pnpm run build），在本地生成 dist 文件夹。

本地 Jenkins ➔ 自动执行打包后的脚本，通过 SSH 密钥将 dist 远程推送到公司的服务器（47.238.123.223）。
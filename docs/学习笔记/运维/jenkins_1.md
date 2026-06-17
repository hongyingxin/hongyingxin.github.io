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

## 两个 ssh-keygen 命令的区别

这两个命令的核心区别在于加密算法不同以及自动化程度不同。我们可以逐个参数对齐来看：

| 参数 | `ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa_deploy -N ""` | `ssh-keygen -t ed25519 -C "jenkins_codeup"` |
| --- | --- | --- |
| `-t`（算法） | rsa：老牌加密算法，兼容性无敌。 | ed25519：现代加密算法，比 RSA 更安全、更小、解析更快。 |
| `-b`（位数） | 4096：RSA 必须指定位数（2048 位及以上才安全，4096 是最高安全级）。 | 无：Ed25519 长度固定，不需要指定位数。 |
| `-f`（路径） | `~/.ssh/id_rsa_deploy`：直接指定了文件名，不会覆盖你默认的 `id_rsa`，非常安全。 | 无：没有指定。运行时终端会停下来问你「存成什么名字」，如果一路回车，会默认叫 `id_ed25519`。 |
| `-N ""`（密码） | `""`：直接指定密码短语为空，全程闭眼自动生成，不会弹窗打扰。 | 无：没有指定。运行时终端会停下来两次，问你要不要给密钥加密码。 |
| `-C`（注释） | 无 | `"jenkins_codeup"`：给公钥末尾加个「小尾巴」注释，方便你以后在 Codeup 后台一眼看出这是给谁用的。 |
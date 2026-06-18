# Jenkins 钉钉机器人

Jenkins 集成钉钉机器人，可以在群里发送打包消息。

## 配置

1. 在钉钉群获取机器人

- 打开你想接收通知的钉钉群，点击右上角的 群设置 ➔ 智能群助手 ➔ 添加机器人。

- 选择 “自定义” (Custom) 机器人。

- 安全设置（核心）：勾选 “加签” (Secret)。钉钉会生成一串形如 SECxxxxxx 的密钥，把它复制保存下来（不要选自定义关键词，加签是最安全、最省心的）。

- 点击完成，钉钉会吐出一个 Webhook 地址，同样复制保存下来。

2. 在 Jenkins 中安装并配置插件

**安装插件**

- 进入 Jenkins 主页，点击 Manage Jenkins (管理 Jenkins) ➔ Plugins (插件管理)。

- 在 Available Plugins (可选插件) 里搜索 DingTalk 或 钉钉。

- 勾选它并点击安装，等待安装完成后重启一下 Jenkins。

**系统全局配置**

- 回到 Manage Jenkins ➔ System (系统配置)。

- 往下滑动直到找到 “钉钉” 或 “DingTalk” 配置区域。

- 点击 高级/添加机器人：

    - 机器人 id：随便起个英文名，比如 dingding-robot（记住这个 ID，等下写代码要用）。

    - 名称：群里显示的名字，比如 Codeup打包小助手。

    - Webhook 地址：粘贴刚才在钉钉群复制的完整 URL。

    - 加密密钥：粘贴刚才钉钉生成的 “加签” (Secret) 密钥。

- 点击右下角的 “测试” (Test) 按钮，如果你的钉钉群立刻收到了一条测试消息，说明配置成功！点击页面最下方的 保存。

3. 集成到 Jenkinsfile

这里使用 post 钩子，让它在构建成功或失败时自动触发通知。

```groovy
post {
  success {
            dingtalk (
                robot: 'dingding-robot', // 对应你在系统配置里填的机器人 id
                type: 'MARKDOWN',
                title: '🚀 前端部署成功通知',
                text: [
                    "### 🚀 前端项目部署成功",
                    "---",
                    "- **项目名称**: `faha-front`",
                    "- **构建分支**: `dev`",
                    "- **构建编号**: #${BUILD_NUMBER}",
                    "- **目标服务器**: ${REMOTE_HOST}",
                    "- **部署状态**: 🎉 静态资源已精准送达，线上已生效！"
                ]
            )
        }
  failure {
            dingtalk (
                robot: 'dingding-robot',
                type: 'MARKDOWN',
                title: '❌ 前端部署失败警告',
                text: [
                    "### ❌ 前端项目构建/部署失败",
                    "---",
                    "- **项目名称**: `faha-front`",
                    "- **构建分支**: `dev`",
                    "- **构建编号**: #${BUILD_NUMBER}",
                    "- **排查建议**: 请立刻前往 Jenkins 查看控制台日志 (Console Output) 排查错误。"
                ]
            )
        }
}
```

## 进阶玩法

### @负责人

目前前端人员太少，这个没啥意义。暂时不做。

### 流水线耗时与产物分析

高级的 CI/CD 通知会帮开发者监控构建性能。既然你用了 pnpm 提升速度，那就更需要直观的数据反馈。

玩法：利用 Jenkins 内置的全局变量 ${currentBuild.durationString}。

效果：在钉钉文本里加上：

⏱️ 本次构建耗时: ${currentBuild.durationString.replace('and counting', '')}

📦 产物大小: 4.2 MB (已自动完成 Gzip 压缩)

价值：每次看群通知，你就能一眼看出本地的 node_modules 缓存有没有生效，打包体积是不是突然暴增，从而及时优化 Vite 配置。

核心是：在打包完成后，用脚本量一下 dist.tar.gz 的体重，顺便向 Jenkins 索要本次构建消耗的时间，然后一起塞进钉钉里。

在 `stage('2. 本地前端构建')` 压缩完包后，加一段代码读取体积。

在 post 模块中，引入耗时变量 `${currentBuild.durationString}`。

```groovy
stage('2. 本地前端构建') {
    steps {
        echo '进入 vite-vue 目录并使用 pnpm 编译...'
        dir('vite-vue') {
            sh 'pnpm install'
            sh 'pnpm run build'
            sh 'tar -czf dist.tar.gz dist/'
            
            // 捞出压缩包的体积】
            script {
                // 使用 Mac/Linux 自带的 du 命令，并用 awk 过滤出大小
                env.DIST_SIZE = sh(script: "du -sh dist.tar.gz | awk '{print \$1}'", returnStdout: true).trim()
            }
        }
    }
}
post {
  success {
    // 在发送前，用 script 块把时间洗成纯中文
    script {
        env.FRIENDLY_DURATION = currentBuild.durationString
            .replace('and counting', '') // 去掉 Jenkins 的未计完尾巴
            .replace('hr', '小时')
            .replace('min', '分')
            .replace('sec', '秒')
            .replace('s', '')           // 兼容某些老版本带复数 s 的情况
            .replace(' ', '')           // 彻底挤掉空格，让排版更紧凑（例如：1分5秒）
    }
  }
}
```

### 双向互动 

玩法：在钉钉机器人后台开启 “Outgoing（企业内部机器人）” 功能。

场景：

- 线上突然出 Bug，你不需要翻墙或者登录本地 Jenkins。

- 你直接在钉钉群里 @机器人 并输入：回滚上一个版本 或者 强行重新打包。

- 钉钉会把这行文字转成 Webhook 丢给你本地的 Jenkins。

- Jenkins 收到指令后，自动执行回滚脚本，并把执行结果再次丢回群里。

这套玩法在大厂里叫 ChatOps（通过聊天做运维）。

## ChatOps 多版本回滚

### 申请 chatOps 机器人

有企业认证的，可以跳过这一环节

钉钉有一条硬性限制：在普通群聊（或非企业认证的组织）中直接添加的“自定义机器人”，只支持单向接收消息（即 Jenkins ➔ 钉钉），它的设置面板里是不提供 Outgoing 反向外发功能开关的。

不过这个很容易解决，钉钉是可以创建“一人公司”，唯一的限制是这个通过内部开发做出来的机器人，只能在属于你这个自建团队的群聊里生效。你不能把它跨群放到别人公司的正式大群里去。

### 配置 chatOps 机器人

配置 Outgoing POST 地址，把 Jenkins 地址填入即可。个人的话，需要到钉钉开发平台找到消息接收地址填入。

这里需要注意，/invoke?token 需要跟 Jenkins流水线的 token一致，不然触发不了。

### 回滚机制

大厂标准的多版本滚动回滚机制，是利用构建号+软链接。

**1. 什么是软链接**

软链接可以直接理解为 Windows 的“桌面快捷方式”或者 Mac 的“替身”。它本身不是一个真正的文件夹，它只是一个“指路牌（箭头）”。

原本服务器目录长这样：

```plaintext
/vite-vue/
└── dist/  <-- 这是一个真正的文件夹，里面装着 index.html 和 js/css
```

使用多版本方案后，在服务器上建了一个 releases（版本库），目录结构变成了这样：

```plaintext
/vite-vue/
├── dist ───► 指向当前的快捷方式 ───► 链接到 releases/dist_#12/
└── releases/
    ├── dist_#10/  （过去正常的旧版本文件）
    ├── dist_#11/  （过去正常的旧版本文件）
    └── dist_#12/  （刚刚构建出来、可能有 Bug 的最新版文件）
```

**2. Nginx是如何读取的**

Nginx 配置文件（nginx.conf）里，配的静态资源根目录永远是死代码，指向这个快捷方式：

```Nginx
server {
    listen 80;
    server_name polarchats.com;
    
    # 🔍 注意：Nginx 只认这个名字叫 dist 的路径！
    root /data/java/webapps/static/polarchats.com/front/vite-vue/dist; 
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

当用户访问网站，Nginx 去读取 /vite-vue/dist/index.html 时，操作系统发现 dist 是个快捷方式，就会自动、透明地带 Nginx 顺着箭头走到当前的实体目录 /vite-vue/releases/dist_#12/index.html。

在这个过程中，Nginx 根本不知道、也不需要知道后面真正的文件夹叫 #12 还是 #11。它只管向 dist 要东西。

**3. 正向部署vs紧急回滚**

既然 Nginx 只看 dist 这个快捷方式，那掌控线上的版本，就变成了“改写快捷方式的指向”。

场景A：正向部署

Jenkins 跑完 pnpm build，把新文件传到了 releases/dist_#12

然后执行下面语句，把名为 dist 的快递方式，修改为指向 releases/dist_#12

```bash
ln -sfn releases/dist_#12 dist
```

场景B：紧急回滚

Jenkins 收到指令，不需要重新打包，因为旧版本 dist_#11 还完好无损地躺在 releases 文件夹里

Jenkins 只需要在服务器上执行：

```bash
ln -sfn releases/dist_#11 dist
```

### 回滚 Job

把“正向部署”和“紧急回滚”拆成两个独立的 Jenkins 任务，不仅结构更清晰，还能完美避开很多隐藏的逻辑大坑。在大厂的运维规范里，这叫“职责分离（Separation of Concerns）”。

正向部署：听阿里云 Codeup 的话。只有 git push 或者合并代码到 dev 分支，它就自动触发

紧急回滚：听钉钉机器人的话。只有当你在群里艾特机器人喊“回滚”时，它才触发。

```groovy
pipeline {
    agent any
    
    triggers {
        GenericTrigger(
            genericVariables: [
                [key: 'chat_user', value: '$.senderNick'],
                [key: 'chat_content', value: '$.text.content']
            ],
            // 钉钉机器人 Outgoing 里的 Token 保持不变
            token: '', 
            
            // 只要包含“回滚”两个字就放行，具体数字交给下面 Groovy 解析
            regexpFilterText: '$chat_content',
            regexpFilterExpression: '.*回滚.*',
            
            causeString: '钉钉群成员 [$chat_user] 触发了自定义级数回滚指令',
            silentResponse: false
        )
    }

    environment {
        // 服务器
        REMOTE_HOST   = ''
        // 文件路径
        REMOTE_PARENT = ''
    }

    stages {
        stage('解析指令中的数字') {
            steps {
                script {
                    // 用正则提取用户输入的数字
                    // 匹配“回滚”后面跟着的任意数字，例如 "回滚 2" 或 "回滚2个版本"
                    def matcher = (chat_content =~ /回滚\s*(\d+)/)
                    
                    if (matcher.find()) {
                        env.ROLLBACK_STEPS = matcher[0][1] // 提取出数字
                    } else {
                        env.ROLLBACK_STEPS = "1" // 如果只输入了“回滚”，默认退 1 个版本
                    }
                    echo "系统解析成功：准备回滚 ${env.ROLLBACK_STEPS} 个版本"
                }
            }
        }

       stage('精准历史指针回退') {
            steps {
                dingtalk (
                    robot: 'dingding-robot',
                    type: 'MARKDOWN',
                    title: '🚨 收到紧急回滚指令',
                    text: ["### 🚨 线上回滚指令已受理\n> 执行人: @${chat_user}\n> 目标动作: 正在尝试向后回退 **${env.ROLLBACK_STEPS}** 个版本..."]
                )

                sshagent(['deploy-server-key']) {
                    // 💡【核心优化】：将远程命令用单引号 '' 包裹，本地 Shell 绝不解析里面的 $ 变量
                    sh """
                        ssh -o StrictHostKeyChecking=no root@${REMOTE_HOST} '
                            cd ${REMOTE_PARENT}
                            
                            # 1. 注入 Groovy 捞到的步长，转为纯正的远程 Shell 变量
                            ROLLBACK_STEPS=${env.ROLLBACK_STEPS}
                            
                            # 2. 检查当前软链接
                            if [ ! -L "dist" ]; then
                                echo "【ERROR】当前线上不是软链接结构，无法执行多版本回滚！" && exit 1
                            fi
                            current_version=\$(basename \$(readlink dist))
                            
                            # 3. 捞出 releases 目录下所有的正常历史版本并排序
                            all_versions=(\$(ls releases/ | grep "dist_#" | sort -V))
                            
                            # 4. 寻找当前版本在数组中的索引位置
                            current_idx=-1
                            for i in "\${!all_versions[@]}"; do
                               if [ "\${all_versions[\$i]}" = "\$current_version" ]; then
                                   current_idx=\$i
                                   break
                               fi
                            done
                            
                            if [ \$current_idx -eq -1 ]; then
                                echo "【ERROR】找不到当前版本在历史库中的位置" && exit 1
                            fi
                            
                            # 5. 计算目标索引
                            target_idx=\$((current_idx - ROLLBACK_STEPS))
                            
                            echo "【调试日志】当前版本索引: \$current_idx, 申请回退步长: \$ROLLBACK_STEPS, 目标索引: \$target_idx"
                            
                            # 6. 🔥 真正的安全边界检查（现在 \$target_idx 会被完美解析了）
                            if [ \$target_idx -lt 0 ]; then
                                echo "【ERROR】历史版本不足！当前最多可回滚 \$current_idx 个版本，你却要退 \$ROLLBACK_STEPS 个！"
                                exit 1
                            fi
                            
                            # 7. 安全过关，精准切换
                            target_version=\${all_versions[\$target_idx]}
                            ln -sfn releases/\$target_version dist
                            
                            echo "【SUCCESS】回滚成功！当前已指向: \$target_version"
                        '
                    """
                    // 切换成功后，利用 returnStdout 强行让 Jenkins 去服务器读出最新的真实软链接名字
                    script {
                        env.ACTUAL_ONLINE_VERSION = sh(
                            script: "ssh -o StrictHostKeyChecking=no root@${REMOTE_HOST} 'basename \$(readlink ${REMOTE_PARENT}/dist)'",
                            returnStdout: true
                        ).trim()
                    }
                }
            }
        }
    }

    post {
        success {
            dingtalk (
                robot: 'dingding-robot',
                type: 'MARKDOWN',
                title: '✅ 生产环境回滚成功',
                text: [
                    "### ✅ 生产环境已成功回滚",
                    "---",
                    "- **操作结果**: 🎉 成功往回倒了 `${ROLLBACK_STEPS}` 个版本！",
                    "- **当前线上版本**: 📦 **`${env.ACTUAL_ONLINE_VERSION}`**", 
                    "- **当前线上状态**: 🟢 运行中",
                    "- **温馨提示**: Nginx 软链接已顺畅切换，历史其余版本完好保留，支持随时再次回滚。"
                ]
            )
        }
        failure {
            dingtalk (
                robot: 'dingding-robot',
                type: 'MARKDOWN',
                title: '❌ 生产环境回滚失败',
                text: [
                    "### ❌ 生产环境回滚失败！",
                    "---",
                    "- **可能原因**: ",
                    "  1. 远端历史 releases 目录下的备份版本总数，小于你请求回滚的级数。",
                    "  2. 权限问题或软链接断开。",
                    "- **排查建议**: 请前往 Jenkins 查看 Console 错误日志，或登录服务器查看 `releases/` 目录实际存了几个版本。"
                ]
            )
        }
    }
}
```
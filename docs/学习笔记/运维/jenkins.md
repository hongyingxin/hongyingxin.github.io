# Jenkins

本文主要记录了在Mac上安装和使用Jenkins的过程，以及一些常见问题和解决方法。

## Homebrew

Homebrew 是 macOS 上的包管理器，用于安装和管理软件。

### 安装

打开终端，输入以下命令：

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

在这个过程中，我们需要输入管理员密码，即我们的Mac密码。下载完成后，终端会输出一段命令，让我们将Homebrew添加到Path环境变量中。

![image.png](/public/assets/随笔/brew.png)

```bash
Next steps:
- Run these commands in your terminal to add Homebrew to your PATH:
    echo >> /Users/hong/.zprofile
    echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> /Users/hong/.zprofile
    eval "$(/opt/homebrew/bin/brew shellenv)"
```

按照提示依次执行命令即可配置完成。

### 验证安装

```bash
brew --version
```

如果安装成功，会输出 Homebrew 的版本号。

```bash
Homebrew 4.6.17
```

至此，我们就完成了Homebrew的安装。

### 安装软件

我们可以使用brew命令来安装软件。这里安装`Java`和`Jenkins`。

```bash
brew install openjdk@17
brew install jenkins-lts
```

启动Jenkins：

```bash
brew services start jenkins-lts

# ==> Successfully started `jenkins-lts` (label: homebrew.mxcl.jenkins-lts)
```

检查Jenkins服务状态并获取初始化管理员密码：

```bash
brew services list | grep jenkins
# jenkins-lts started         hong ~/Library/LaunchAgents/homebrew.mxcl.jenkins-lts.plist
sleep 10 && cat ~/.jenkins/secrets/initialAdminPassword
# fccdc71a32d440cb88d15bee278b66fd
```

到这里我们的Jenkins就安装完成了。打开浏览器，输入`http://localhost:8080`，输入初始化管理员密码，即可进入Jenkins页面。

![image.png](/public/assets/随笔/jenkins.png)

## 汉化

看英语觉得费劲,下载中文插件。有了上面的插件下载经验,方便了许多。

下载方式:回到Jenkins首页Dashboard --> Manage Jenkins --> Manage Plugins -->  Available  --> 输入Chinese 

安装完成后,我们就可以看到中英混合的界面了(哈哈哈)。

## 工作空间

### 主要目录结构

Jenkins主目录位于 `~/.jenkins` 目录下。(即`/Users/hong/.jenkins`)

**关键目录说明**

1. 工作空间目录:`~/.jenkins/workspace`

  - 这里存放项目的源代码(从Git等拉取的代码)
  - 因为我们在Jenkins创建了两个项目,对应:`My-demo`和`webDemo`

2. 构建历史目录:`~/.jenkins/jobs/<项目名称>/builds`

  - ~/.jenkins/jobs/My-demo/builds/ - My-demo项目的构建历史
  - ~/.jenkins/jobs/webDemo/builds/ - webDemo项目的构建历史

3. 具体构建文件位置:`~/.jenkins/jobs/[项目名]/builds/[构建号]/`

**构建产物通常存放在**

- 工作空间内的构建目录(如 dist/, build/, target/ 等)
- Archive artifacts 配置的目录
- 自定义的输出目录

**如何查看具体构建产物**

我们可以在Jenkins Web界面中:
- 访问:http://localhost:8080/job/[项目名]/[构建号]/
- 点击 "Workspace" 查看工作空间文件
- 点击 "Build Artifacts" 查看归档的构建产物

建议:在Jenkins项目配置中查看 "Post-build Actions" → "Archive the artifacts" 设置,这会告诉你具体的构建产物路径。

**注意点**

因为`./jenkins`目录是隐藏的,Mac通过按`Command + Shift + .`可以显示隐藏文件。 Windows通过按`Ctrl + Shift + .`可以显示隐藏文件。

## Git构建

一般情况下,Jenkins需要配置Git进行代码拉取。

1. 首先我们需要去下载git插件

2. 然后在项目选择配置 -> Configuration -> Source Code Management 配置 Git 信息。
   - Repository URL: 填写Git仓库地址
   - Credentials: 添加对应项目的帐户名密码

![图片](/public/assets/随笔/jenkins_2.png)

这里以阿里云CodeUp为例需要配置的凭据是:

  - Username:阿里云帐号用户名或邮箱
  - Password:阿里云帐号的密码
  - ID:自定义,这里我们填写`codeup`
  - Description:自定义,这里我们填写`CodeUp`

3. 添加好账户密码后,在Credentials中选择我们刚刚添加的凭据。这样子我们就可以在Jenkins中使用Git拉取代码了。

## 仓库多项目配置

由于仓库有多个项目,如`chargeManager`、`guildDataNew1`、`payer`、`vite-project`等,所以我们需要配置多个项目。Jenkins的源码管理配置有几种方式来处理。

### 稀疏检出(Sparse Checkout)

这种方式只检出你需要的特定项目目录,节省空间和时间。

配置步骤:
  1. 源码管理 → 选择 Git
  2. Repository URL: https://codeup.aliyun.com/your-repo.git
  3. Credentials: 选择你的凭据
  4. Additional Behaviours → 点击 Add → 选择 Sparse Checkout paths
  5. Path: 填写你要构建的项目路径,例如:
     ```text
     chargeManager
     guildDataNew1
     payer
     vite-project
     ```

### 子目录构建

检出整个仓库,但只在特定子目录中构建。

配置步骤:
  1. 源码管理 → Git
  2. Repository URL: https://codeup.aliyun.com/your-repo.git
  3. Additional Behaviours → Add → Check out to a sub-directory
  4. Local subdirectory for repo: 填写目标目录名
  5. 在构建脚本中切换到对应项目目录:
      ```shell
      cd $WORKSPACE/[项目名]
      npm install
      npm run build
      ```

### 多个Git仓库配置

如果项目相对独立,可以配置多个Git源。

配置步骤:

1. 源码管理 → Git
2. 点击 Add Repository 添加多个仓库
3. 为每个仓库配置不同的:
   - Repository URL
   - Branch
   - Local subdirectory

### Pipeline方式

使用Jenkinsfile进行更精细的控制。

```shell
pipeline {
    agent any
    
    stages {
        stage('Checkout') {
            steps {
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: '*/main']],
                    userRemoteConfigs: [[
                        url: 'https://codeup.aliyun.com/your-repo.git',
                        credentialsId: 'your-credentials-id'
                    ]],
                    extensions: [
                        [$class: 'SparseCheckoutPaths', 
                         sparseCheckoutPaths: [
                             [path: 'project-a/*'],
                             [path: 'shared-libs/*']
                         ]
                        ]
                    ]
                ])
            }
        }
        
        stage('Build Project A') {
            steps {
                dir('project-a') {
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }
    }
}
```

我比较喜欢使用Pipeline方式,因为可以更精细的控制构建过程。


## node安装

因为我们使用jenkins构建vite项目,所以需要安装nodejs。

### 安装nodejs插件

路径:manage --> plugins --> available --> 搜索nodejs --> 安装。

这一步跟我们安装普通插件一样,比较简单,这里不展开讲了。

### 配置nodejs插件

除了安装,我们还需要在全局工具中进行配置。

路径:manage --> tools --> NodeJS installations --> 添加nodejs版本 --> 保存。

![图片](/public/assets/随笔/jenkins_3.png)

### 在job使用

配置完全局工具后,我们还需要在项目中使用nodejs。

路径:job --> configuration --> environment --> 添加nodejs版本 --> 保存。

![图片](/public/assets/随笔/jenkins_4.png)

为了测试安装是否成功,我们在`Build Steps`模块中添加一个`Execute shell`步骤,输入以下命令:

```shell
node -v
```

如果安装成功,会输出nodejs的版本号。

至此,我们就完成了nodejs的安装和配置。


## 归档机制

Jenkins默认不会自动归档构建产物。

虽然我们上文提到`jobs`目录是构建历史目录,它只会保存构建日志(log)、构建配置(build.xml)、变更记录(changelog.xml),构建产物需要我们手动配置。

**为什么不自动归档**

- 磁盘空间考虑 - 构建产物可能很大,自动归档会快速消耗磁盘空间
- 灵活性 - 不是所有项目都需要保存构建产物
- 性能 - 避免不必要的文件复制操作
- 安全 - 让用户明确指定哪些文件需要保存

**Jenkins的设计理念**

```text
Workspace (工作区) → 临时存储,可能被清理
     ↓ (需要手动配置)
Archive (归档区) → 永久保存构建产物
```

**常见的归档配置**

1. Archive Artifacts (最常用)

```text
Post-build Actions → Archive the artifacts
Files to archive: vite-project/build_v/**/*
```

2. Publish Over SSH (发布到远程服务器)

```text
Post-build Actions → Send build artifacts over SSH
```

3. Copy Artifact Plugin (复制到其他Job)

```text
用于在不同Job之间传递构建产物
```

**举例**

方式1:通过Jenkins UI配置

  - 进入`webDemo` Job配置
  - 滚动到 Post-build Actions
  - 点击 Add post-build action
  - 选择 Archive the artifacts
  - 在 Files to archive 中填入
    ```text
    vite-project/build_v/**/*
    ```
  - 保存配置

方式2:在Shell脚本中添加归档命令

修改构建脚本,在最后添加:

```shell
#!/bin/bash
cd vite-project
npm install  
npm run build

# 手动归档构建产物
echo "=== 归档构建产物 ==="
BUILD_ARCHIVE_DIR="/Users/hong/.jenkins/jobs/webDemo/build_v/${BUILD_NUMBER}/archive"
mkdir -p "$BUILD_ARCHIVE_DIR"
cp -r build_v/* "$BUILD_ARCHIVE_DIR/"
echo "构建产物已归档到: $BUILD_ARCHIVE_DIR"
ls -la "$BUILD_ARCHIVE_DIR"
```

## 问题1

第一次安装Jenkins时,访问页面,输入初始化管理员密码,然后选择社区推荐的插件安装方式,提示出现错误,无法安装插件。

![image.png](/public/assets/随笔/jenkins_1.png)

```
安装过程中出现一个错误: No such plugin: cloudbees-folder
```

这个提示很明显,就是缺少了`cloudbees-folder`这个插件导致的。我们暂时跳过,然后手动安装这个插件。

[cloudbees-folder插件下载地址](https://updates.jenkins-ci.org/download/plugins/cloudbees-folder/)

[清华镜像源](https://mirrors.tuna.tsinghua.edu.cn/jenkins/plugins/cloudbees-folder/)

下载后,点击[系统设置] -> [插件管理] -> [高级] -> [上传插件],上传下载的插件,安装即可。

## 问题2

在进入 manage 页面时,报错。

```text
Some plugins could not be loaded due to unsatisfied dependencies. Fix these issues and restart Jenkins to re-enable these plugins.

Dependency errors:

Folders Plugin (6.1062.v2877b_d6b_b_eeb_)
Plugin is missing: ionicons-api (94.vcc3065403257) 在这个页面http://localhost:8080/manage/报错
```

这是一个依赖插件缺失的问题。我们只需要安装缺失的插件(ionicons-api)即可。

- 打开 http://localhost:8080/manage/pluginManager/
- 点击 "Available" 标签页
- 在搜索框中输入 "ionicons-api"
- 勾选 "ionicons-api" 插件
- 点击 "Install without restart" 或 "Download now and install after restart"
- 安装完成后,重启 Jenkins

## 问题3

```bash
ERROR: Error fetching remote repo 'origin'
Finished: FAILURE
```

在构建过程中出现这个错误,失败原因是Git fetch操作超时了。

出现这个问题,主要有两个原因:

1. Git fetch超时:操作在10分钟后超时(ERROR: Timeout after 10 minutes)
2. 仓库过大:从日志可以看到远程仓库提示"当前仓库较大,建议使用「部分克隆」按需下载文件",差不多有1G大小

解决:

1. 使用浅克隆(Shallow Clone)

在 Jenkins job > Source Code Management > Additional Behaviours > Advanced clone behaviours。

将`Timeout`选项设置为30分钟,将超时时间设置为30分钟(默认10分钟);然后将`Shallow clone`勾选,启动浅克隆,只下载最近的提交历史;最后`Shallow clone depth`设置为1,只获取最新的一个提交历史。

2. 使用部分克隆(Sparse Checkout)

在 Jenkins job > Source Code Management > Additional Behaviours > Sparse Checkout paths
。

将path设置为需要检出的项目目录,例如:
```text
chargeManager
guildDataNew1
payer
vite-project
```

保存配置,重新构建即可。


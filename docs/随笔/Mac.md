# Mac

## Mac 常用终端命令

开始加入Mac的怀抱，记录一些常用的命令。

### 路径概念

#### 绝对路径
以 "/" 开头的路径，完整描述文件位置的路径。例如：`/Users/username/Documents/file.txt`

#### 相对路径
不以 "/" 开头的路径，表示相对于当前位置的路径。
- `./` 表示当前目录
- `../` 表示上一级目录
- `../../` 表示上上级目录

### 常用命令

#### 1. 显示当前目录路径
```bash
pwd
```

#### 2. 查看目录内容
```bash
ls [参数] [目录名]
```

参数说明：
- `-w` 显示中文
- `-l` 显示详细信息
- `-a` 显示隐藏文件
- `-R` 显示子目录文件
- `-la` 显示所有文件（包括隐藏文件）

示例：
```bash
ls                  # 显示当前目录下的所有文件或文件夹
ls /path/to/dir     # 显示指定目录下的所有文件或文件夹
ls -a               # 显示当前目录下隐藏文件
ls -l               # 显示当前目录下详细信息
ls -R               # 显示当前目录下子目录文件
ls -w               # 显示当前目录下中文文件
ls -la              # 显示所有文件
```

#### 3. 切换目录
```bash
cd [目录名]
```

常用命令：
- `cd .` 进入当前目录
- `cd ..` 返回上一级目录
- `cd ../..` 返回上两级目录
- `cd ~` 进入用户根目录
- `cd /` 进入根目录
- `cd ./` 进入当前目录

#### 4. 创建目录
```bash
mkdir [目录名]
```

示例：
```bash
mkdir new_folder                    # 在当前目录创建文件夹
mkdir /path/to/new_folder          # 使用绝对路径创建文件夹
```

#### 5. 删除目录
```bash
rmdir [目录名]
```

注意：只能删除空目录，如需删除非空目录，使用 `rm -r` 命令。

#### 6. 创建文件
```bash
touch [文件名]
```

示例：
```bash
touch new_file.txt
```

#### 7. 删除文件
```bash
rm [参数] [文件/目录]
```

参数说明：
- `-r` 递归删除目录及其内容
- `-f` 强制删除，不提示

示例：
```bash
rm file.txt                    # 删除文件
rm -r folder                   # 删除文件夹及其内容
rm -rf folder                  # 强制删除文件夹及其内容
```

#### 8. 复制文件/目录
```bash
cp [参数] [源文件] [目标文件]
```

参数说明：
- `-R` 递归复制目录

示例：
```bash
cp file.txt /path/to/dest/     # 复制文件
cp -R folder /path/to/dest/    # 复制目录
```

#### 9. 移动/重命名文件
```bash
mv [源文件] [目标文件]
```

示例：
```bash
mv old.txt new.txt             # 重命名文件
mv file.txt /path/to/dest/     # 移动文件
```

#### 10. 文本编辑（vim）
```bash
vim [文件名]
```

vim 基本操作：
1. 模式切换
   - 按 `i` 进入编辑模式
   - 按 `ESC` 返回指令模式

2. 保存和退出
   - `:w` 保存文件
   - `:q` 退出编辑
   - `:q!` 强制退出不保存
   - `:wq` 保存并退出

3. 光标移动（指令模式下）
   - `h` 左移
   - `j` 下移
   - `k` 上移
   - `l` 右移

#### 11. 清屏
```bash
clear
```

#### 12. 打开文件/应用
```bash
open [文件/目录/应用路径]
```

示例：
```bash
open .                          # 打开当前目录
open /Applications/Safari.app/  # 打开应用
open -n /Applications/Safari.app/  # 打开新的应用实例
```

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

启动Jenkins

```bash
brew services start jenkins-lts

# ==> Successfully started `jenkins-lts` (label: homebrew.mxcl.jenkins-lts)
```

检查Jenkins服务状态并获取初始化管理员密码
```bash
brew services list | grep jenkins
# jenkins-lts started         hong ~/Library/LaunchAgents/homebrew.mxcl.jenkins-lts.plist
sleep 10 && cat ~/.jenkins/secrets/initialAdminPassword
# fccdc71a32d440cb88d15bee278b66fd
```

到这里我们的Jenkins就安装完成了。打开浏览器，输入`http://localhost:8080`，输入初始化管理员密码，即可进入Jenkins页面。

![image.png](/public/assets/随笔/jenkins.png)

## Jenkins

第一次安装Jenkins时，访问页面，输入初始化管理员密码，然后选择社区推荐的插件安装方式，提示出现错误，无法安装插件。

![image.png](/public/assets/随笔/jenkins_1.png)

```
安装过程中出现一个错误： No such plugin: cloudbees-folder
```

这个提示很明显，就是缺少了`cloudbees-folder`这个插件导致的。我们暂时跳过，然后手动安装这个插件。

[cloudbees-folder插件下载地址](https://updates.jenkins-ci.org/download/plugins/cloudbees-folder/)

[清华镜像源](https://mirrors.tuna.tsinghua.edu.cn/jenkins/plugins/cloudbees-folder/)

下载后，点击[系统设置] -> [插件管理] -> [高级] -> [上传插件]，上传下载的插件，安装即可。
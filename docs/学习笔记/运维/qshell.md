# qshell

Qshell 是利用七牛文档上公开的API实现的一个方便开发者测试和使用七牛API服务的命令行工具。

qshell只是个命令行工具，所以我们安装官方的教程完成安装即可。

这里需要注意的是，因为权限问题，需要使用`chmod + x`命令来为文件添加可执行权限；并且将qshell复制到`/usr/local/bin/`目录下，这样我们就可以在任何地方使用qshell命令了。

```shell
sudo cp ~/Downloads/qshell /usr/local/bin/
sudo chmod +x /usr/local/bin/qshell
```

我们可以通过执行以下命令来验证qshell是否安装成功。
```shell
# 检查版本
qshell --version

# 查看帮助
qshell help
```

## 配置

我们还需要配置一下账户信息

```shell
# 配置账户信息
qshell account <AccessKey> <SecretKey> <Bucket>

# 查看账户信息
qshell account

# 列出所有账户信息
qshell account list
```

**根据官方文档，以下命令对文件夹操作很有用：**
- listbucket：列举存储空间中的文件
- fput：上传单个文件
- qupload：批量上传文件
- rput：以分片上传的方式上传文件
- qdownload：批量下载文件（可按前缀下载整个"文件夹"）

因为七牛云对象存储中没有真正的“文件夹”概念，文件夹实际上是通过文件名中的路径前缀来模拟额度。当我们上传文件时，在文件名中包含路径分隔符`/`，就会在控制台中显示为文件夹结构。

我们在本地创建一个名为`test.txt`文件，并上传到七牛云对象存储。
```shell
echo "Hello, World!" > test.txt
qshell fput <Bucket> my-test/test.txt ./test.txt
```

上传成功后，我们就可以在七牛云对象存储中看到我们上传的文件。

参考：https://developer.qiniu.com/kodo/1302/qshell

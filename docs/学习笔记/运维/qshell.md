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

参考：https://developer.qiniu.com/kodo/1302/qshell

# shell

## command

`command -v`检查某个命令是否存在

**返回值**
- 如果命令存在：输出命令的路径
- 如果命令不存在：不输出任何内容，返回非 0 退出码

**示例**
```shell
# 检查 pnpm 是否安装
$ command -v pnpm
/usr/local/bin/pnpm          # ← 输出路径，说明已安装

# 检查不存在的命令
$ command -v notexist
                             # ← 没有输出，返回非 0
$ echo $?
1    
```
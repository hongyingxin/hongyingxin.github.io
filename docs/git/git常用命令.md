# Git常用命令

Git工具是开发中必不可少的工具，本文整理了一些常用的Git命令。

## 1. 初始化配置

配置用户信息是使用Git的基础。

```bash
# 设置用户名
git config --global user.name "your_name"
# 设置邮箱
git config --global user.email "your_email"
# 查看配置
git config --list
# 查看提交号
git reflog
```

## 2. 仓库初始化

```bash
# 初始化仓库
git init
# 克隆仓库
git clone <仓库地址>
```

## 3. 状态查看

```bash
# 查看状态
git status
# 查看提交历史
git log
# 查看分支
git branch -v
# 查看远程分支
git branch -r
# 查看所有分支
git branch -a
```

## 4. 分支操作

```bash
# 创建分支
git branch <分支名>
# 切换分支
git checkout <分支名>
# 创建并切换分支
git checkout -b <分支名>
# 删除分支
git branch -d <分支名>
# 强制删除分支
git branch -D <分支名>
# 合并分支
git merge <分支名>
# 查看分支合并图
git log --graph --oneline --all
```

## 5. 远程操作

```bash
# 查看远程仓库
git remote -v
# 添加远程仓库
git remote add <远程仓库名> <远程仓库地址>
# 删除远程仓库
git remote remove <远程仓库名>
# 拉取远程仓库
git pull <远程仓库名> <分支名>
# 推送远程仓库
git push <远程仓库名> <分支名>
```

## 6. 日志查看

```bash
# 查看日志
git log
# 查看简化日志
git log --oneline
# 查看增删改查
git log --stat
# 查看图形化日志
git log --graph --oneline --all
```

## 7. 差异比较

```bash
# 查看差异
git diff
# 查看指定文件差异
git diff <文件名>
# 查看指定提交差异
git diff <提交号>
```

## 8. 撤销操作

```bash
# 撤销未提交的修改
git checkout -- <文件名>
# 撤销已提交的修改
git reset --hard <提交号>
# 撤销提交
git reset --soft <提交号>
```

## 9. 重置操作

```bash
# 重置到上一版本
git reset --hard HEAD^
# 重置到指定提交
git reset --hard <提交号>
# 重置到指定提交并强制推送
git reset --hard <提交号> && git push -f
```

## 10. 添加文件

```bash
# 添加文件
git add <文件名>
# 添加所有文件
git add .
```

## 11. 暂存文件

```bash
# 暂存文件
git stash
# 查看暂存
git stash list
# 恢复暂存
git stash apply
```

## 12. 提交文件

```bash
# 提交文件
git commit -m "提交信息"
# 提交并添加文件
git commit -a -m "提交信息"
```

## 13. 其他选项

```bash
-f  --force: 强制
-d  --delete: 删除
-D  --delete --force: 强制删除
-m  --move: 移动或重命名
-M  --move --force: 强制移动或重命名
-r  --remote: 远程
-a  --all: 所有
```

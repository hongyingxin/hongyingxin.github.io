# Git

## Git提交

`git add -A`和 `git add .` `git add -u`在功能上看似很相近，但还是存在一点差别

`git add .` ：他会监控工作区的状态树，使用它会把工作时的所有变化提交到暂存区，包括文件内容修改(modified)以及新文件(new)，但不包括被删除的文件。

`git add -u` ：他仅监控已经被add的文件（即tracked file），他会将被修改的文件提交到暂存区。add -u 不会提交新文件（untracked file）。（git add --update的缩写）

`git add -A` ：是上面两个功能的合集（git add --all的缩写）

## Git解决合并冲突

![Git解决合并冲突](/public/assets/git/1.jpg)

**步骤**

- 1. 更新远程分支

- 2. 从想要合并的远程分支切换新分支处理

- 3. 将新分支合并到当前的开发分支

拉取远程分支 origin develop（注意：不用加/）

## Git修改分支名称

![Git修改分支名称](/public/assets/git/2.png)


![Git修改分支名称](/public/assets/git/3.png)

## Git错误合并的解决方式

日常的Git操作中，我们不可避免的出现错误合并分支。

栗子：

我当前在 `feature/share` 上进行功能开发，想要合并到 `development` 测试分支上去，但是错误的把 `development` 分支合并到 我当前这条 `feature/share` 的分支上面。

![Git错误合并的解决方式](/public/assets/git/4.png)

输入 `git log` 查看日志

![Git错误合并的解决方式](/public/assets/git/5.png)

`git reflog` 查看merge操作的上一个提交记录的版本号

![Git错误合并的解决方式](/public/assets/git/6.png)

`git reset --hard` 版本号

![Git错误合并的解决方式](/public/assets/git/7.png)

`git log` 再次查看记录，嘻嘻！成功撤回merge

![Git错误合并的解决方式](/public/assets/git/8.png)
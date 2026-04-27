# git清除缓存

## 方法1
```bash
git rm -r --cached .
git add .
git status
git commit -m 'update .gitignore'
git push
```
读了下git文档，才发现，这些东西其实很简单，很容易理解。cached其实就是暂存区，然后一个是工作的目录，你的工作目录的东西做出修改时，会和缓存区进行对比，因此你git status时，会显示出来这个差异，因此为了使.gitignore中的内容生效，那么就删除掉暂存区，然后将所有本地文件追踪一下，就得到最新的暂存区文件。

## 方法2
删除项目.git文件夹的 config
# Cursor使用

Cursor是我最常用的编辑器，这里记录关于Cursor的使用笔记。

## cursorignore

Cursor Agent 在全仓库搜索上下文时超时或卡住，任务被中断。

例如：我在三个项目A、B、C中全局索引，这时候经常出现Agent对话突然中断。

网上的建议是关掉 Instant Grep（索引搜索）

操作步骤：Cursor Settings → Indexing & Docs → 关闭「Index Repositories for Instant Grep」

关掉后一般会退回 ripgrep 直搜。

担心检索速度太慢的问题，于是又尝试了 cursorignore 。

cursorignore 是一个用于忽略文件的工具，它可以帮助你忽略一些文件，这些文件不会被Cursor索引。

跟 .gitignore 类似。作用是缩小索引和搜索范围，通常最有效。

相关文档：[cursor grep功能](https://cursor.com/cn/changelog/2-1)
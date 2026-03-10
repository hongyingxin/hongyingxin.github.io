# Cursor 使用指南

## Cursor 插件

1. Rules： 持久化的AI指南和编码规范（.mdc文件）
2. Skills： 处理复杂任务的专用Agent能力
3. Agents： 自定义Agent配置和提示词
4. Commands： Agent可执行的命令文件
5. MCP Servers： Model Context Protocol集成
6. Hooks： 由事件触发的自动化脚本

## Rules

规则为Agent提供系统级指令。它们将提示词、脚本等打包在一起，便于在团队内管理和共享工作流。

Cursor支持四种类型的规则：

  - 项目规则：存储在`.cursor/rules`中，受版本控制且仅作用于你的代码库

  - 用户规则：在你的Cursor环境中全局生效，供Agent（聊天）使用

  - 团队规则：在仪表盘中集中管理的团队级规则，适用于Team和Enterprise用户

  - AGENTS.md：以Markdown格式编写的Agent指令，是`.cursor/rules`的简化替代方案

### 编写规则的最佳实践

1. 规则控制在500行以内
2. 将大型规则拆分为多个可组合的规则
3. 提供具体示例或引用相关文件
4. 避免模糊的指导，想攥写清晰的内部文档那样来写规则

## Skills

Agent Skills 是一个开放标准，用于为 AI Agent 扩展专用能力。Skills将特定领域的知识和工作流打包封装，供 Agent 调用以完成特定任务。

### 什么是Skills？

Skills是最近非常火的一个概念，其指一种可移植、受版本控制的包，用来教会 Agent 执行特定领域的任务。Skills 可以包含脚本、模板和参考信息，Agent 可以通过其工具对这些内容进行操作。

### 工作原理

Cursor启动时，会自动从技能目录中发现技能，并将其提供给Agent。Agent会获知可用的技能，并根据上下文决定何时使用它们。也可以在Agent对话中输入`/`并搜索技能名称来手动调用技能。

## Agent（子代理）

Agent 是专门化的AI助手，Cursor的代理可以将任务委派给它们。每个子代理在自己的上下文窗口中运行，处理特定类型的工作，并将结果返回给父代理。使用子代理可以拆解复杂任务、并行执行工作，并在主对话中保留上下文。

## MCP

### 什么是MCP？

Model Context Protocol 让 Cursor 能连接到外部工具和数据源。

## Hooks（钩子）
# Cursor 三板斧

> 工具的上限，取决于你怎么「调教」它。

笔记整理自：[Cursor 的三板斧：Rules, Commands 与 Agent Skills](https://www.fanyamin.com/2026-01-12-cursor-rules-commands.html)

很多人用 Cursor 还停留在 Tab 补全和 Cmd+K 问答。真正拉开差距的，是把 AI 从「问答机器」调教成「可编程助理」。核心就是三样东西：

| 概念 | 是什么 | 解决什么 |
| --- | --- | --- |
| **Rules** | AI 的行为准则（持久化 System Prompt） | 让 AI 记住「你是谁」、偏好和规范 |
| **Commands** | 预设任务模板（可复用 Prompt） | 让复杂任务一行 `/xxx` 触发 |
| **Agent Skills** | 专业知识和工作流（`SKILL.md` + 资源） | 让 AI 掌握特定领域的「做事方法」 |
| **MCP** | AI 的工具箱（外部能力接口） | 让 AI 能调文件、API、数据库等 |

关系可以记成一句话：

```text
Rules（你是谁）+ Commands（做什么）+ Skills（怎么做）+ MCP（用什么工具）
                              ↓
                     可编程的 AI 助手
```

---

## 1. Rules：给 AI 立规矩

**一句话**：Rules 是写给 AI 的行为准则，告诉它「你是谁、怎么做事、有什么偏好」。

- 位置：`.cursor/rules/`
- 格式：Markdown（通常 `.mdc`）
- 本质：持久化 System Prompt

### 基本结构

```md
---
alwaysApply: true
---

# 1. 你是谁
- 背景、角色、专业领域

# 2. 你怎么做事
- 写作 / 编码风格
- 偏好和禁忌

# 3. 输出规范
- 格式、语言、其他约束
```

### 实践建议

- 不要太长，尽量控制在 500 行以内
- 要具体，别写「写得好一点」这种空话
- 可按场景拆分：`core.mdc`、`coding.mdc`、`writing.mdc`
- 用 `alwaysApply: true/false` 控制是否始终生效

---

## 2. Commands：给 AI 下任务

**一句话**：Commands 是预设的任务模板，用 `/command-name` 触发，让 AI 按你定义的流程执行复杂任务。

- 位置：`.cursor/commands/`
- 格式：Markdown
- 本质：可复用 Prompt 模板 + 工作流定义

### 基本结构

```md
# Design Doc Generator

你是一位资深架构师，擅长编写清晰、完整的技术设计文档。

## Usage
- `/design-doc <feature-name>` - 生成设计文档
- `/design-doc <feature-name> @<jira-ticket>` - 从 Jira 提取背景

## Instructions
1. 如果提供了 Jira ticket，先读取需求背景
2. 按模板生成设计文档
3. 用 PlantUML 生成架构图和时序图
4. 输出到 `docs/design/` 目录
```

### 常用 Command 示例

| Command | 用途 |
| --- | --- |
| `/design-doc` | 生成技术设计文档 |
| `/api-spec` | 生成 API 接口规范 |
| `/code-review` | 代码审查 |
| `/explain-code` | 解释代码逻辑 |
| `/test-cases` | 根据需求生成测试用例 |
| `/release-notes` | 生成发布说明 |

### 命名建议

- 用动词或名词开头：`design-doc`、`code-review`
- 保持简短，语义清晰，看名字就知道干什么

---

## 3. Agent Skills：给 AI 加技能

**一句话**：Agent Skills 是轻量开放格式，用来扩展 AI Agent 的专业知识和工作流。

一个 Skill 本质上是一个包含 `SKILL.md` 的文件夹：

```text
my-skill/
├── SKILL.md          # 必需：指令 + 元数据
├── scripts/          # 可选：可执行代码
├── references/       # 可选：参考文档
└── assets/           # 可选：模板、资源
```

### SKILL.md 示例

```md
---
name: design-doc-generator
description: 根据需求生成技术设计文档
---

# 设计文档生成器

## 何时使用此技能
当用户需要创建技术设计文档时使用……

## 如何生成设计文档
1. 从 Jira ticket 提取需求
2. 按公司模板结构编写
3. 用 PlantUML 生成图表
```

### 工作机制：渐进式披露

1. **发现（Discovery）**：启动时只加载每个 Skill 的 `name` 和 `description`
2. **激活（Activation）**：任务匹配时再读取完整 `SKILL.md`
3. **执行（Execution）**：按指令执行，按需加载引用文件或脚本

好处：既保持响应速度，又能按需拿到更多上下文。

### Skills vs MCP

- **Skills**：定义「做什么」和「怎么做」（知识与流程）
- **MCP**：提供「能做什么」（工具与能力）

两者结合，AI 才不只是「嘴炮」，而是真能干活。

---

## 4. MCP：给 AI 装手脚

MCP（Model Context Protocol）让 AI 能调用外部能力，例如：

- 读写文件系统
- 执行终端命令
- 调用外部 API（Jira、GitLab、Confluence）
- 访问数据库
- 操作浏览器

在 Cursor 中通过 MCP Server 提供，可以理解为 AI 的手和脚。

---

## 5. 为什么这三样重要？

### 从问答机器到个人助理

没有这三样，AI 像刚入职实习生：聪明，但不了解你、公司、项目。每次都要重新解释。

有了这三样，AI 更像跟了你三年的助理：知道风格、熟悉项目、懂工作流。

### 从一次性对话到可复用工作流

调出一个完美 Prompt 很爽，但第二天常常找不到。Commands 把好用 Prompt 固化下来，下次一行 `/xxx` 就能复用。

### 从只会说到能做事

- Skills 告诉 AI「生成设计文档的流程是什么」
- MCP 让 AI「真的去读 Jira、写文件、调 API」

这是质的飞跃。

---

## 6. 完整工作流示例

场景：要给「用户认证服务重构」写技术设计文档。

1. 触发 Command：`/design-doc 用户认证服务重构 @JIRA-12345`
2. Cursor 读取 Rules：技术栈、文档规范、写作偏好
3. 调用 Skills + MCP：读 Jira、看现有代码、参考历史设计文档
4. 按流程执行：分析需求 → 生成结构 → 写章节 → 画图 → 做方案对比与风险评估
5. 输出结果：写入 `docs/design/auth-service-refactor.md`

以前可能半天，现在一行命令启动。

---

## 7. 实用技巧

### Rules 分层

```text
.cursor/rules/
├── core.mdc          # 全局规则，始终生效
├── coding.mdc        # 编码相关
├── writing.mdc       # 写作相关
└── project-xxx.mdc   # 特定项目
```

### 善用 @ 引用

```text
/design-doc 支付网关重构 @ZOOM-67890
帮我分析 @https://example.com/api-doc 这个 API 文档
根据 @docs/design/auth-service.md 生成测试用例
```

### 迭代优化 Prompt

1. 先写一个「能用」的版本
2. 用几次，发现问题
3. 针对问题优化
4. 重复，直到满意

---

## Checklist

- [ ] 在 `.cursor/rules/` 下创建 `core.mdc`，写下背景、技术栈和团队规范
- [ ] 把常用文档模板整理成 Commands
- [ ] 配置需要的 MCP（如 Jira / GitLab）
- [ ] 试着用 `/design-doc` 生成一份设计文档
- [ ] 收集反馈，持续优化 Commands 和 Skills

---

## 一句话总结

别只是「用」Cursor，要学会「调教」它。

教得好，它是超级助理；教不好，它只是贵一点的自动补全。

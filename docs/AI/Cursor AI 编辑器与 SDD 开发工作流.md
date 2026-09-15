# Cursor AI 编辑器与 SDD 开发工作流

> 参考：[Cursor AI 编辑器 + SDD 开发工作流实战指南](https://developer.volcengine.com/articles/7628548837216354350)

## 1. Cursor 的核心使用方式

Cursor 是基于 VS Code 的 AI 编辑器，原有 VS Code 的插件、快捷键和主题大多可以继续使用。它的核心能力不是单纯“聊天”，而是把 AI 放进真实工程环境里，让 AI 能理解上下文、修改文件、运行命令并辅助完成开发闭环。

Cursor 中常见的 AI 交互方式主要有三类：

| 交互方式 | 适用场景 | 特点 |
| --- | --- | --- |
| Tab 补全 | 写代码时的行内补全、续写 | 最轻量，直接在光标处生成代码 |
| Chat 聊天 | 解释代码、回答问题、生成片段 | 适合问答和局部辅助 |
| Agent 模式 | 跨文件修改、端到端实现需求 | 可以读写文件、执行终端命令、完成复杂任务 |

简单来说：

- 写代码时让 Cursor 接着补，用 Tab。
- 想理解代码或问一个局部问题，用 Chat。
- 要完成一个跨文件功能、修复 Bug 或重构，用 Agent。

### 1.1 Tab 补全 Demo

Tab 补全适合在写代码过程中做轻量续写。

例如你先写一段注释：

```ts
// 计算用户年龄
```

Cursor 可能会根据上下文自动补全：

```ts
function calculateAge(birthday: string): number {
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}
```

这个场景下不需要打开 Agent，也不需要把需求描述得很复杂，直接按 `Tab` 接受即可。

### 1.2 Chat Demo

Chat 更适合问答、解释和局部生成。

示例：

```text
解释一下 @src/utils/auth.ts 里的 getToken 方法在做什么。
```

或者：

```text
帮我写一个正则表达式，用来校验邮箱格式，并说明边界情况。
```

Chat 的重点不是“让 AI 直接改完整个项目”，而是帮你理解、分析、生成小片段。

### 1.3 Agent Demo

Agent 适合端到端任务，因为它可以读文件、改文件、跑命令。

示例：

```text
帮我给 User 模型加一个 avatar 字段，数据库迁移、后端接口、前端展示都一起处理。
```

Agent 理想的执行过程：

```text
1. 读取数据库 schema
2. 修改 User 模型
3. 生成 migration
4. 修改后端用户资料接口
5. 修改前端用户资料组件
6. 运行类型检查和测试
7. 汇总改动结果
```

这种跨文件任务如果只用 Chat，很容易遗漏上下文；用 Agent 更合适。

## 2. 上下文控制

AI 编程质量很大程度取决于上下文质量。

Cursor 支持通过 `@` 引用把上下文精确交给 AI：

| 引用方式 | 含义 | 适用场景 |
| --- | --- | --- |
| `@filename.ts` | 引用具体文件 | 让 AI 精准理解某个文件 |
| `@folder/` | 引用整个目录 | 给 AI 一个模块范围 |
| `@codebase` | 语义搜索整个仓库 | 不知道代码在哪里时使用 |
| `@docs` | 引用文档 | 让 AI 基于文档回答，而不是凭记忆 |
| `@web` | 搜索互联网 | 查询新版本、新框架、新资料 |
| `@git` | 引用 Git 历史 | 分析最近改动或提交背景 |

上下文使用原则：

1. 先收窄范围，再让 AI 改代码。
2. 能引用具体文件，就不要只说“帮我改一下”。
3. 复杂任务先让 AI 理解现有结构，再要求实现。

反例：

```text
帮我改一下登录逻辑
```

更好的写法：

```text
帮我改一下 @src/auth/login.ts 的登录逻辑，参考 @src/auth/register.ts 的错误处理方式。
```

## 3. Rules：给 AI 立规矩

Rules 是写给 AI 的长期项目规范。它可以固定技术栈、编码风格、目录结构和验证方式，避免多轮对话后 AI 忘记约定。

典型用途：

- 统一代码风格，例如 TypeScript strict mode、禁止 `any`。
- 固定技术栈，例如 React + Zustand、NestJS + Prisma。
- 约定目录结构，例如组件统一放到 `src/components/`。
- 约定验证命令，例如每次改完运行 `pnpm test` 或 `pnpm lint`。

项目规则一般放在：

```text
.cursor/rules/
```

示例：

```text
.cursor/
└── rules/
    ├── general.mdc
    ├── frontend.mdc
    └── backend.mdc
```

Rules 常见类型：

| 类型 | 触发方式 | 适用场景 |
| --- | --- | --- |
| Always | 每次对话都生效 | 全局项目规范 |
| Auto | 匹配特定文件时生效 | 前端、后端、测试等分模块规范 |
| Agent Requested | AI 判断是否需要 | 适合有明确描述的专项规则 |
| Manual | 手动引用 | 临时或低频规则 |

除了 `.cursor/rules/`，也可以使用 `AGENTS.md` 描述项目如何启动、目录结构、环境变量名称和协作约定。

### 3.1 Rules 文件 Demo

一个通用规则文件可以这样写：

```markdown
---
description: 项目通用开发规范
globs:
alwaysApply: true
---

# 项目规范

## 技术栈

- 语言：TypeScript strict mode
- 包管理器：pnpm
- 测试框架：Vitest

## 代码规范

- 不使用 `any` 类型
- 函数需要有明确的返回类型
- 错误处理使用自定义 Error 类，不使用裸字符串
- 提交信息格式使用 `feat(scope): 描述` 或 `fix(scope): 描述`

## 验证命令

- 类型检查：`pnpm tsc --noEmit`
- 单元测试：`pnpm test`
- 代码检查：`pnpm lint`
```

前端专项规则可以这样写：

```markdown
---
description: 前端 React 组件规范
globs: src/components/**/*.tsx, src/pages/**/*.tsx
alwaysApply: false
---

# 前端组件规范

- 使用函数组件和 Hooks，不使用 Class 组件
- 简单状态使用 `useState`
- 跨组件状态使用 Zustand
- 样式方案使用 Tailwind CSS
- 组件文件中可以就近放置类型定义
```

### 3.2 AGENTS.md Demo

如果项目不想拆很多 `.mdc` 文件，也可以先用一个 `AGENTS.md` 描述协作约定：

````markdown
# AGENTS.md

## 启动方式

```bash
pnpm install
pnpm dev
```

## 环境变量

需要在 `.env.local` 中配置以下变量：

- `DATABASE_URL`
- `NEXTAUTH_SECRET`

不要把真实密钥写进文档或对话。

## 目录结构

- `app/`：Next.js App Router 页面
- `lib/`：工具函数和服务
- `components/`：共享 UI 组件
- `prisma/`：数据库 schema

## 协作约定

- 修改后先运行类型检查
- 新增业务逻辑需要补充测试
- 不要随意引入新依赖
````

## 4. Skills：给 AI 加能力包

Rules 更像“约束”，Skills 更像“工作流能力”。

| 对比项 | Rules | Skills |
| --- | --- | --- |
| 定位 | 规范和约束 | 能力和方法论 |
| 内容 | 简短规则清单 | 操作步骤、模板、脚本、参考资料 |
| 触发 | 自动、按文件或手动触发 | AI 根据上下文主动调用，也可手动调用 |
| 适合场景 | 统一风格 | 复杂流程，例如调试、TDD、SDD |

常见 Skills 类型：

- `brainstorming`：实现前先探索需求。
- `writing-plans`：编写实现计划和任务拆解。
- `test-driven-development`：按 TDD 流程先写测试再实现。
- `systematic-debugging`：系统化排查 Bug。
- `subagent-driven-development`：把独立任务分派给子 Agent。
- `verification-before-completion`：完成前必须跑验证命令。

### 4.1 Skills 调用 Demo

如果你希望 AI 按某个固定流程工作，可以直接在对话里说明：

```text
按照 SDD 流程帮我实现“用户头像上传”功能。
先不要写代码，先产出 Proposal、Spec、Design 和 Tasks。
```

理想情况下，AI 不会直接开始改文件，而是先进入规划阶段：

```text
1. 读取现有用户模块代码
2. 输出 Proposal，说明本次变更范围
3. 输出 Spec，描述头像上传行为
4. 输出 Design，说明前后端和存储方案
5. 输出 Tasks，拆成可执行任务
6. 等你确认后再进入实现
```

### 4.2 OpenSpec 作为 Skill 的 Demo

OpenSpec 可以作为 Cursor 的 Skill 或命令工作流使用。

例如在 Agent 对话中输入：

```text
/opsx:propose add-user-avatar
```

AI 会围绕 `add-user-avatar` 创建一次独立变更：

```text
openspec/changes/add-user-avatar/
├── proposal.md
├── design.md
├── tasks.md
└── specs/
    └── user-profile/
        └── spec.md
```

这样每次变更都有自己的上下文，不会把所有需求都混在一个对话里。

## 5. 为什么需要 SDD

Prompt 提示词工程的常见问题是：一开始 AI 写得很快，但项目越大越容易失控。

典型问题包括：

1. 代码腐化：多轮对话后 AI 忘记之前约定，技术选型和代码风格开始混乱。
2. 上下文过长：项目稍大后，把所有代码都塞给 AI 会消耗大量 Token，也更容易出现幻觉。
3. 局部修复引发连锁问题：AI 为了修一个 Bug，可能破坏另一个模块。

SDD（Spec-Driven Development，规范驱动开发）的核心思想是：

```text
先对齐需求和规范，再让 AI 写代码。
```

它把自然语言需求逐步转化为可执行任务，降低 AI “自由发挥”的空间。

## 6. SDD 标准流程

一个典型的 SDD 流程可以拆成几个阶段：

```text
人类想法 -> Proposal -> Spec -> Design -> Tasks -> Implement
```

| 阶段 | 解决的问题 | 产物 |
| --- | --- | --- |
| Proposal | 为什么做、做什么、不做什么 | 提案 |
| Spec | 系统应该表现出什么行为 | 行为规格 |
| Design | 技术上怎么实现 | 技术设计 |
| Tasks | 具体怎么拆任务 | 可勾选任务清单 |
| Implement | 按任务实现代码 | 代码和验证结果 |

### 6.1 Proposal：提案

Proposal 用于明确需求意图、范围和边界。

重点回答：

- 为什么要做？
- 本次做哪些内容？
- 哪些内容明确不做？
- 大致采用什么方案？

### 6.2 Spec：行为规格

Spec 不关心怎么实现，只描述系统应该有什么行为。

常见写法：

```text
GIVEN 某个前置条件
WHEN 用户执行某个动作
THEN 系统产生某个结果
```

这种写法可以让需求更容易被验证，也方便后续检查实现是否偏离。

### 6.3 Design：技术设计

Design 用来说明技术方案和架构决策。

重点包括：

- 为什么选择这个方案？
- 会改哪些模块？
- 是否引入新依赖？
- 是否影响已有接口或数据结构？
- 有哪些风险和兼容性问题？

### 6.4 Tasks：任务拆解

Tasks 把设计方案拆成原子化、可勾选的 TODO。

好的任务应该足够具体，例如：

```markdown
- [ ] 1.1 创建主题状态管理模块
- [ ] 1.2 添加 CSS 变量
- [ ] 1.3 实现本地存储持久化
- [ ] 1.4 添加主题切换组件
- [ ] 1.5 补充测试或验证步骤
```

### 6.5 Implement：编码实现

最后才进入实现阶段。AI 按任务逐项改代码、运行命令、更新任务状态。

这个阶段不应该随意扩展范围。如果实现中发现设计有问题，应回到 Proposal、Spec 或 Design 修正后再继续。

## 7. OpenSpec 工作流

OpenSpec 是一个轻量级 SDD 框架，适合把每次变更独立管理起来。

它的核心思路是：每次变更都是一个独立文件夹。

典型结构：

```text
openspec/
├── specs/
│   └── <domain>/
│       └── spec.md
├── changes/
│   └── <change-name>/
│       ├── proposal.md
│       ├── design.md
│       ├── tasks.md
│       └── specs/
│           └── <domain>/
│               └── spec.md
└── config.yaml
```

其中：

- `specs/` 表示当前系统已经生效的规格。
- `changes/` 表示正在进行的变更。
- 每个变更目录中包含提案、设计、任务和增量规格。

### 7.1 安装和初始化 Demo

OpenSpec 通常需要先安装并初始化。

```bash
# 全局安装
npm install -g @fission-ai/openspec@latest

# 进入项目目录
cd your-project

# 初始化 OpenSpec
openspec init
```

初始化后，项目中会多出 `openspec/` 目录，用来保存当前规格和后续变更。

### 7.2 从 0 到 1 创建一个变更

假设要给项目增加“暗色模式”，可以在 Cursor Agent 中输入：

```text
/opsx:propose add-dark-mode
```

AI 应该生成类似结果：

```text
openspec/changes/add-dark-mode/
├── proposal.md
├── design.md
├── tasks.md
└── specs/
    └── ui/
        └── spec.md
```

### 7.3 Proposal 示例

`proposal.md` 重点说明为什么做、做什么、不做什么。

```markdown
# Proposal: Add Dark Mode

## Intent

用户反馈夜间使用页面刺眼，需要增加暗色模式，降低长时间使用时的视觉疲劳。

## Scope

In scope:

- 设置页面增加主题切换入口
- 支持亮色和暗色主题切换
- 检测系统主题偏好
- 本地保存用户主题偏好

Out of scope:

- 自定义主题色
- 每个页面单独配置主题
- 后台同步多端主题偏好

## Approach

使用 CSS 自定义属性实现主题变量切换，使用 React Context 管理主题状态，并通过 `localStorage` 持久化用户选择。
```

### 7.4 Spec 示例

Spec 只描述行为，不描述实现细节。

```markdown
# Delta for UI

## ADDED Requirements

### Requirement: Theme Selection

系统 SHALL 允许用户在亮色主题和暗色主题之间切换。

#### Scenario: 手动切换主题

- GIVEN 用户位于任意页面
- WHEN 用户点击主题切换按钮
- THEN 页面主题 SHALL 立即切换
- AND 用户选择 SHALL 保存到本地
- AND 用户刷新页面后 SHALL 保持上次选择

#### Scenario: 跟随系统主题

- GIVEN 用户没有保存过主题偏好
- WHEN 应用首次加载
- THEN 系统 SHALL 使用操作系统的主题偏好
```

这里的关键词有明确含义：

- `SHALL` / `MUST`：必须实现。
- `SHOULD`：推荐实现，但允许有例外。
- `MAY`：可选实现。
- `GIVEN` / `WHEN` / `THEN`：描述可验证场景。

### 7.5 Design 示例

Design 说明技术方案和架构决策。

```markdown
# Design: Add Dark Mode

## Architecture Decisions

### Decision: Use React Context

选择 React Context 管理主题状态，而不是引入 Redux。

原因：

- 主题只是简单的全局状态
- 不涉及复杂状态流转
- 避免引入额外依赖

### Decision: Use CSS Custom Properties

选择 CSS 变量管理颜色，而不是 CSS-in-JS。

原因：

- 与现有样式兼容
- 无运行时样式生成成本
- 浏览器原生支持

## File Changes

- `src/contexts/ThemeContext.tsx`：新增主题上下文
- `src/components/ThemeToggle.tsx`：新增主题切换组件
- `src/styles/globals.css`：增加亮色和暗色变量
- `src/App.tsx`：接入 ThemeProvider

## Risks

- 如果已有组件使用硬编码颜色，需要逐步替换为 CSS 变量
- 如果服务端渲染页面，需要注意初始主题和客户端主题不一致导致闪烁
```

### 7.6 Tasks 示例

`tasks.md` 应该拆成可以逐项勾选的小任务。

```markdown
# Tasks

## 1. Theme Infrastructure

- [ ] 1.1 创建 `ThemeContext`
- [ ] 1.2 支持 `light` / `dark` 两种主题状态
- [ ] 1.3 从 `localStorage` 读取用户主题偏好
- [ ] 1.4 没有用户偏好时读取系统主题

## 2. Styling

- [ ] 2.1 在 `globals.css` 中定义亮色主题变量
- [ ] 2.2 在 `globals.css` 中定义暗色主题变量
- [ ] 2.3 将核心页面颜色替换为 CSS 变量

## 3. UI

- [ ] 3.1 创建 `ThemeToggle` 组件
- [ ] 3.2 在设置页面接入主题切换组件
- [ ] 3.3 增加切换后的视觉反馈

## 4. Verification

- [ ] 4.1 验证刷新页面后主题保持不变
- [ ] 4.2 验证首次访问时跟随系统主题
- [ ] 4.3 运行类型检查和测试
```

### 7.7 Apply / Verify / Archive Demo

确认 Proposal、Spec、Design、Tasks 都没问题后，再进入实现：

```text
/opsx:apply
```

AI 理想的执行日志类似：

```text
Working on 1.1: 创建 ThemeContext...
✓ 1.1 Complete

Working on 1.2: 支持 light / dark 两种主题状态...
✓ 1.2 Complete

Working on 2.1: 定义亮色主题变量...
✓ 2.1 Complete

All tasks complete.
```

实现完成后再验证：

```text
/opsx:verify
```

验证通过后归档：

```text
/opsx:archive
```

归档后，Delta Specs 会合入 `openspec/specs/`，变更目录会进入 archive，作为历史记录保留。

## 8. Delta Specs

Delta Specs 是 OpenSpec 的核心概念：不重写整份规格，只描述这次变更改了什么。

常见区段：

| 区段 | 含义 |
| --- | --- |
| `ADDED Requirements` | 新增行为 |
| `MODIFIED Requirements` | 修改已有行为 |
| `REMOVED Requirements` | 移除行为 |

Delta Specs 的好处：

- 容易看出本次变更的真实影响。
- 多个变更可以并行推进。
- Code Review 时只需要重点审查变化部分。
- 归档后可以合入主规格，形成新的系统行为说明。

## 9. OpenSpec 常见命令

核心命令：

| 命令 | 作用 |
| --- | --- |
| `/opsx:propose <name>` | 创建变更并生成提案、规格、设计和任务 |
| `/opsx:explore` | 探索需求，不直接创建制品 |
| `/opsx:apply` | 按任务清单逐项实现 |
| `/opsx:verify` | 验证实现是否符合规格 |
| `/opsx:archive` | 归档变更并合入主规格 |

在 Cursor 中，有些命令可能会使用短横线形式，例如：

```text
/opsx-propose add-user-avatar
```

## 10. 实战流程

以“添加用户头像上传功能”为例，可以这样推进：

### 10.1 发起提案

```text
/opsx:propose add-user-avatar
```

先生成 `proposal.md`，确认本次功能只做单张头像上传，不做批量上传、图片编辑等扩展功能。

### 10.2 审查规格

检查 Spec 是否覆盖关键行为：

- 用户可以上传头像。
- 上传成功后头像立即展示。
- 文件类型和大小有限制。
- 上传失败时有明确错误提示。

### 10.3 审查设计

检查 Design 是否合理：

- 文件存储在哪里？
- 数据库是否需要新增字段？
- 前端是否已有上传组件可复用？
- 后端接口是否需要鉴权？
- 是否会影响已有用户资料接口？

### 10.4 拆解任务

把实现拆成小任务：

```markdown
- [ ] 1.1 增加用户头像字段
- [ ] 1.2 实现头像上传接口
- [ ] 1.3 增加文件校验逻辑
- [ ] 1.4 修改用户资料页面
- [ ] 1.5 添加错误提示
- [ ] 1.6 运行测试和类型检查
```

### 10.5 执行和验证

```text
/opsx:apply
/opsx:verify
/opsx:archive
```

实现过程中如果发现需求、设计或任务有问题，不要直接硬改代码，而是先回到对应制品修正。

## 11. 常见问题

### 11.1 AI 改了一堆无关文件

原因通常是任务描述太泛或上下文太大。

处理方式：

- 缩小 `@` 引用范围。
- 明确告诉 AI 只允许修改哪些文件。
- 先让 AI 输出计划，再确认是否执行。

### 11.2 AI 编造不存在的 API

原因通常是缺少真实文档或项目示例。

处理方式：

- 引用官方文档。
- 引用项目中已有同类实现。
- 要求 AI 先搜索现有代码再实现。

### 11.3 制品和代码脱节

原因通常是实现中临时改变了方案，但没有同步更新 Spec 或 Design。

处理方式：

- 一旦方案变化，先更新设计文档。
- 任务状态要及时同步。
- 完成后用 Verify 检查实现是否匹配规格。

### 11.4 Diff 太大难审阅

原因通常是一次性任务太大。

处理方式：

- 拆成更小的变更。
- 先做接口和数据结构，再做 UI。
- 每完成一组任务就运行验证命令。

## 12. 最佳实践

1. 小问题用 Chat，大任务用 Agent。
2. 不确定代码位置时先用 `@codebase` 或语义搜索。
3. 跨模块改动先写 Proposal 和 Design。
4. 实现前先让 AI 输出 Tasks。
5. 每次只推进一个明确变更。
6. 把反复出现的约定沉淀到 Rules。
7. 把复杂流程沉淀到 Skills。
8. 完成前一定要验证，不能只相信 AI 的口头说明。

## 13. 总结

Prompt 提示词工程适合快速完成局部任务，但随着项目变复杂，很容易遇到上下文过长、风格不一致和局部修改破坏全局的问题。

SDD 的价值在于把“直接让 AI 写代码”改成“先形成规范，再按规范写代码”。Proposal、Spec、Design、Tasks 这些制品不是额外负担，而是帮助人和 AI 对齐上下文、控制范围、降低返工成本的工具。

Cursor 的 Rules、Skills、Agent 和 OpenSpec 这类工作流结合起来，可以形成一套更稳定的 AI 辅助开发方式：

```text
Rules 固化长期约定
Skills 固化复杂流程
Spec 对齐需求和设计
Agent 执行具体实现
验证命令保证结果可信
```

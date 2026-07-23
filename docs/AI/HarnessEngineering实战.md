# Harness Engineering 实战

在上一篇文章中，我们完成了 OpenSpec 工作流，而这一篇主要是引入 Harness Engineering。

Harness 的核心公式很简单 `Agent = Model + Harness`。

模型负责「能做什么」，Harness 负责「在什么环境里、按什么规则、被怎样验证地去做」。

**现状：** 你已有 OpenSpec 工作流（spec、skills、verify），这是 Harness 的规范内核；缺入口地图、机械约束、自动化反馈、熵管理。

**核心思路：** 不是另起炉灶，而是在 OpenSpec 外面包一层 Agent 操作环境——AGENTS.md 导航、lint 约束、hook/CI 验证、verify 闭环。

**与 OpenSpec 的关系：** OpenSpec = 需求与工作流；Harness = 让 Agent 可靠执行 OpenSpec 的环境。

**先对照一下现状：**

```text
┌─────────────────────────────────────────────────────────────────┐
│                    openspec-demo 当前 Harness                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Feedforward（引导 Agent 做什么）          状态                  │
│  ─────────────────────────────────────────────────────────────  │
│  openspec/config.yaml（context + rules）   ✅ 已有               │
│  openspec/specs/（机器可读需求）            ✅ 已有               │
│  .cursor/skills/（OpenSpec 工作流）         ✅ 已有               │
│  .cursor/commands/（/opsx:* 命令）          ✅ 已有               │
│  AGENTS.md（Agent 入口地图）                ❌ 缺失               │
│  docs/（渐进式披露文档体系）                 ❌ 缺失               │
│                                                                 │
│  Feedback（验证 Agent 做得对不对）         状态                  │
│  ─────────────────────────────────────────────────────────────  │
│  Vitest 测试                               ✅ 有，但未自动化串联  │
│  openspec-verify-change skill              ✅ 有，但需手动触发    │
│  vue-tsc（build 脚本里）                    ⚠️  有，但未独立暴露   │
│  ESLint / Prettier                         ❌ 缺失               │
│  pre-commit / Cursor hooks                 ❌ 缺失               │
│  CI pipeline                               ❌ 缺失               │
│                                                                 │
│  Constraints（机械约束边界）                状态                  │
│  ─────────────────────────────────────────────────────────────  │
│  目录约定（config.yaml 文字描述）           ⚠️  软约束            │
│  架构依赖规则（components/views 分层）      ❌ 未强制             │
│  Agent 可读 lint 错误信息                   ❌ 缺失               │
│                                                                 │
│  Entropy Management（防腐化）              状态                  │
│  ─────────────────────────────────────────────────────────────  │
│  spec ↔ 代码一致性检查                      ⚠️  手动 verify       │
│  文档 gardening                            ❌ 缺失               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**结论：** OpenSpec 已经提供了 Harness 的「规范层骨架」，但还缺 入口地图、机械约束、实时反馈环、熵管理 四块。

这和 OpenAI 那套实践并不冲突——OpenSpec 负责 what，Harness 负责 how the agent operates。

## 入口地图

入口地图主要是解决 Context Engineering 上下文工程的问题。

OpenAI 的做法不是把全部知识塞进一个巨型 prompt，而是 AGENTS.md 当目录，docs/ 当系统记录。

目前我们这个项目还缺少一份文档入口，需要补充`AGENTS.md`文件和`docs`文件夹。

```bash
openspec-demo/
├── AGENTS.md              ← 入口地图（≤100 行）
├── docs/
│   ├── ARCHITECTURE.md    ← 分层规则、依赖方向
│   ├── CONVENTIONS.md     ← 命名、测试、提交约定
│   └── WORKFLOW.md        ← OpenSpec 工作流速查
├── openspec/
│   ├── config.yaml        ← 已有，继续作为 OpenSpec 规则源
│   └── specs/             ← 已有，需求真相源
└── src/
    ├── components/        ← 纯 UI，无业务逻辑
    ├── composables/       ← 业务逻辑 + 状态
    ├── views/             ← 页面组装
    └── router/
```

## 机械约束

机械约束主要解决`Pipeline`流水线怎么跑的问题。Harness 的关键是 lint 报错本身就能指导 Agent 修复。

在团队里，会使用文档来规范和约束，或者是文字注释远远不够，别口头约定，规范代码使用 `ESLint` / `Prettier`，保证逻辑使用单元测试，改完代码跑一遍 `npm run lint`

```text
依赖方向（只允许向下）：

  views/
    ↓
  components/ + composables/
    ↓
  （无更下层）

禁止：
  composables/ → components/
  components/  → views/
  views/       → views/（跨页面 import）
```

### 实现路径（由简到繁）

| 层级 | 工具 | 成本 | 价值 |
|------|------|------|------|
| L1 | ESLint + eslint-plugin-import | 低 | 依赖方向、unused import |
| L2 | 自定义 ESLint rule（Agent 可读 message） | 中 | 「请将 localStorage 逻辑移到 composables/」 |
| L3 | Vitest 结构测试（扫描 import graph） | 中 | 不依赖 ESLint 插件生态 |
| L4 | CI gate | 低（GitHub Actions） | 防止 Agent 绕过本地检查 |

OpenAI 的经验：lint 错误信息 = Agent 的 remediation prompt。

## 实时反馈环和熵管理

```text
Agent 行动
    │
    ▼
┌─────────────┐     失败      ┌──────────────┐
│ PostToolUse │ ────────────▶ │ Agent 自修复  │
│   Hook      │               └──────────────┘
│ (lint/test) │
└──────┬──────┘
       │ 通过
       ▼
┌─────────────┐
│  /opsx:verify│  ← 你已有这个 skill！
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Archive    │
│  + sync spec│
└─────────────┘
```

已有的优势：

- openspec-verify-change = inferential sensor（语义验证）
- Vitest = computational sensor（确定性验证）
- 3 个已归档变更 = 可复用的 Harness 迭代样本

还缺的环：

- Agent 每次改文件后 自动 跑 vitest / vue-tsc（Cursor hooks 或 pre-commit）
- CI 在 PR 上跑 test + verify（即使 solo 项目也建议有，给 Agent 一个外部裁判）
- 定期 /opsx:sync 或 doc-gardening，防止 spec 和代码漂移

## 整合方式

OpenSpec 不应被 Harness 替代，而应成为 Harness 的 核心子系统：

```text
┌────────────────────────────────────────────────────┐
│                  Harness Layer                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │ AGENTS.md│  │ ESLint   │  │ Cursor Hooks     │ │
│  │ docs/    │  │ CI       │  │ pre-commit       │ │
│  └────┬─────┘  └────┬─────┘  └────────┬─────────┘ │
│       │             │                  │            │
│       └─────────────┼──────────────────┘            │
│                     ▼                               │
│  ┌─────────────────────────────────────────────┐   │
│  │            OpenSpec Core                     │   │
│  │  specs/ → changes/ → tasks → verify → archive│  │
│  └─────────────────────────────────────────────┘   │
│                     │                               │
│                     ▼                               │
│  ┌─────────────────────────────────────────────┐   │
│  │              src/ + tests/                   │   │
│  └─────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────┘
```

工作流：

- 1. /opsx:explore — 探索（你现在就在做）
- 2./opsx:new — 创建变更 + spec delta
- 3./opsx:apply — Agent 实施（Harness 约束其行为）
- 4.Hook 自动跑 test/lint — 实时反馈
- 5./opsx:verify — 对照 spec 做完整性检查
- 6./opsx:archive — 归档 + sync spec
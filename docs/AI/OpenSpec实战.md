# OpenSpec实战

这是一篇快速上手 OpenSpec 的实战教程。

## 安装与配置

首先需要检查`Node.js`的版本，需要`>= 20.19.0`。

然后全局安装 OpenSpec CLI，运行以下命令

```bash
npm install -g @openspeccn/openspec@latest 2>&1
```

安装成功后，可以通过 `openspec --version` 检查安装是否成功。

```bash
openspec --version
```

然后进入项目根目录，通过 `openspec init` 初始化 OpenSpec 配置。

```bash
openspec init --tools cursor --force
```

接下来，它会让你选择你常用的 AI 编程工具，这里以`Cursor`为例。

然后自动生成`openspec`文件夹。

Cursor 还会生成 `commands`和`skills`文件夹。

目录结构如下


```
openspec-demo/
├── openspec/
│   ├── specs/          # 单一事实来源 — 系统当前行为
│   ├── changes/        # 进行中的变更（每个功能一个文件夹）
│   └── config.yaml     # 项目上下文与规则
├── .cursor/
│   ├── commands/       # /opsx:* 斜杠命令
│   └── skills/         # OpenSpec 技能文件
```

![img](/public/assets/ai/1.png)

openSpec 内有引导式入门教程，通过命令`/opsx:onboard`，完整走一遍工作流。

也可以直接通过命令`/opsx: new add-todo-api`，系统会在 `.openspec/active_change/` 下生成四大文档的模板。

一个完整的 OpenSpec 周期如下：

| 步骤 | 做了什么 |
| --- | --- |
| Explore | 分析现状，决定用原生 http |
| New | 创建 add-health-endpoint 变更 |
| Proposal | 明确 Why / What / Scope |
| Specs | 定义 WHEN/THEN 可测试需求 |
| Design | 决定技术方案 |
| Tasks | 拆成 8 个 checkbox |
| Apply | 写代码 + 测试 |
| Archive | 合并 spec，保留历史 |

常见命令如下：

| 命令 | 作用 |
| --- | --- |
| `/opsx:explore` | 编码前先思考、调研 |
| `/opsx:new` | 开始新变更，逐步创建工件 |
| `/opsx:ff` | 快进 — 一次性生成全部工件 |
| `/opsx:apply` | 按 tasks 实现 |
| `/opsx:verify` | 验证实现与规范一致 |
| `/opsx:archive` | 归档完成的变更 |

## 实战

接下来，我们按照一个完整的生命周期进行实战。通过 cursor 输入窗口，输入`/`唤起命令。

- `/opsx:explore` 编码前先思考、调研：这时候进入探索模式，了解当前项目情况以及接下来的任务

- `/opsx:new` 创建变更：根据探索结论创建 OpenSpec 变更，此步骤生成`openspec/changes/变更文件夹`

接下来有两个选项，一个是运行`/opsx:ff`，一次性生成全部工件，一个是运行`/opsx:continue`，逐步创建工件。这里为了演示方便，我们选择了后者。

- `/opsx:continue`创建`proposal.md`文件，明确 Why / What / Scope，这时候`design`或`specs`均可创建。这里我们选择了`design`。

- `/opsx:continue`创建`design.md`文件，定义 决定技术方案。

- `/opsx:continue`创建`specs.md`文件，定义 WHEN/THEN 可测试需求。

- `/opsx:continue`创建`tasks.md`文件，拆成 任务清单。

此刻所有工件都准备就绪，可以用`/opsx:apply`开始实现。

- `/opsx:apply`开始实现，这时候会根据`tasks.md`文件中的任务清单，逐步实现。

- `/opsx:verify`验证实现与规范一致。

- `/opsx:archive`归档完成的变更。

## 问题总结

### explore 和 new 阶段的区别

`explore`阶段是编码前先思考、调研，`new`阶段是创建变更，根据探索结论创建 OpenSpec 变更，此步骤生成`openspec/changes/变更文件夹`。

前者适合想法还比较模糊，不确定具体需求的情况，后者则是方向确定了，需要开始创建工件。

当然也可以直接跳过`explore`阶段，直接进入`new`阶段。但容易在`proposal`阶段才发现`scope`不对

### new 如何自定义名称

在 `/opsx:new` 后面直接写你想要的 kebab-case 名称就行，AI 就不会帮你推导名字。

```bash
/opsx:new add-todo-api
```

### 文件内容中英文问题

在`openspec/config/config.yaml`文件中，可以配置文件内容中英文问题。

### spec 上级文件名称

spec 文件的上级，是根据在`proposal.md`文件中，`What`部分的内容自动生成的。

### spec 是测试用例吗

spec 文件是行为规范，但可以写成被测试覆盖的场景。一般格式是需求 + 场景描述。

### 四个主要文件的流程

```bash
proposal  →  specs   →  design  →  tasks  →  代码
  为什么      做什么      怎么做      做哪些
  做什么      (详细)     (技术)     (清单)
  (高层)
```

- proposal ≈ 立项书 / PRD 摘要（偏 WHY + 范围，不写细节）
- spec ≈ 详细需求 / 验收标准（偏 WHAT，可测试）
- design ≈ 技术方案 / 设计文档（偏 HOW，技术层面）
- tasks ≈ 开发任务拆分（偏 DO，给 /opsx:apply 用）
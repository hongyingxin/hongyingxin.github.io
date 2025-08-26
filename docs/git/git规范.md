# Git 规范指南

## Commit 提交规范

Git 提交规范是一种约定，旨在使提交消息更具有可读性和一致性。以下是一种常见的 Git 提交规范示例：

**提交消息格式：**

```javascript
<类型>(<范围>): <主题>
<主体>
<页脚>
```

**提交消息字段解释：**

- **类型 (Type)：** 表示本次提交的类型，常见的类型包括：
  - `feat`：新功能（feature）
  - `fix`：修复问题（bug）
  - `docs`：文档更新
  - `style`：代码格式、样式调整，不影响代码含义的变化
  - `refactor`：重构代码，既不修复错误也不添加功能
  - `test`：增加或修改测试代码
  - `chore`：构建过程或辅助工具的变动
- **范围 (Scope)：** 可选字段，表示本次提交的影响范围，如文件名、模块名等
- **主题 (Subject)：** 简明扼要地描述本次提交的目的，一般不超过 50 个字符
- **主体 (Body)：** 详细描述本次提交的内容、原因和影响等信息
- **页脚 (Footer)：** 可选字段，包含与本次提交相关的链接、引用、问题编号等元数据

**示例：**

```javascript
feat(user): add logout functionality

Added a new logout button to the user dashboard for improved user experience.

Closes #123
```

**注意事项：**

提交消息应该清晰、简明地表达本次提交的目的和内容。遵循规范有助于团队成员更容易理解提交历史，并生成更加详尽的变更日志。可以使用工具或钩子来自动验证提交消息是否符合规范。

[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)

## 分支命名规范

良好的分支命名规范可以提高团队协作的效率，使代码库的结构更加清晰。以下是一些常见的分支命名规范：

**主分支：**

- `main` 或 `master`：用于发布稳定版本的分支。

**开发分支：**

- `develop`：用于整合开发人员的工作，包含最新的开发版本。

**功能分支：**

- `feature/<功能描述>`：用于开发新功能，功能描述可以是简短的概括。
  - 例如：`feature/login-page`

**修复分支：**

- `bugfix/<问题描述>`：用于修复特定的 bug 或问题。
  - 例如：`bugfix/fix-crash-issue`

**发布分支：**

- `release/<版本号>`：用于准备发布的版本，通常在发布前进行测试和准备。
  - 例如：`release/v1.0.0`

**热修复分支：**

- `hotfix/<问题描述>`：用于紧急修复生产环境中的问题。
  - 例如：`hotfix/fix-security-vulnerability`

**其他分支：**

- `docs/<文档描述>`：用于更新文档。
- `refactor/<重构描述>`：用于重构代码。
- `test/<测试描述>`：用于编写测试代码。

**注意事项：**

分支命名应该清晰、简洁，并能够准确地描述分支的用途。避免使用过于复杂或含糊不清的命名，以免造成困惑。可以在团队中制定统一的命名规范，并通过文档或工具进行传达和强制执行。可以使用工具来自动创建和管理分支，以减少人为错误和重复工作。

**功能分支：** `feature/type/xxx` （type：需求所属分类）
- **App 版本：** `type = 版本号`，如 `feature/v1.1.4/cpAward`（注意加上 `v`）
- **活动：** `type = act_yyyy`（yyyy = 活动上线年份），如：`feature/act_2024/520`
- **其它：** `type = yyyy.MM.dd`（开始日期），如：`feature/2024.05.20/language`

**修复分支：** `hotfix/type/xxx`

能定位问题所在 feature 的，以该 feature 名命名：`hotfix/2024.05.20/language` `hotfix/act_2024/520`

其它以修复日期命名：`hotfix/yyyy.MM.dd`


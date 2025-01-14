---
tag:
 - 未完成
---


# Git 规范提交记录

在团队协作中，保持一致的提交记录格式有助于提高代码库的可读性和可维护性。Husky、Commitlint 和 Commitizen 是三个强大的工具，可以帮助我们在提交代码时自动检查和生成符合规范的提交信息。

## Husky

Husky 是一个 Git 钩子工具，它允许我们在特定的 Git 操作（如 commit、push 等）之前或之后执行自定义脚本。通过 Husky，我们可以在提交代码之前自动运行代码检查、测试等任务。

### 安装和配置 Husky

1. **安装 Husky**：

   ```bash
   npm install husky --save-dev
   ```

2. **在 `package.json` 中添加 Husky 配置**：

   ```json
   {
     "scripts": {
       "prepare": "husky install"
     }
   }
   ```
   prepare脚本会在 npm install 之后自动执行，依旧是说在安装完依赖后会执行husky install 命令，该命令会创建.husky目录，并添加husky的配置文件。
   
3. **设置 Husky 钩子**：

   在项目根目录下创建一个 `.husky` 目录，并在其中添加钩子脚本。例如，添加 `commit-msg` 钩子：

   ```bash
   npx husky add .husky/commit-msg 'npx --no-install commitlint --edit "$1"'
   ```
   这样可以确保在安装依赖时自动设置 Husky 钩子。

## Commitlint

Commitlint 是一个用于检查提交信息是否符合特定格式的工具。它通常与 Husky 一起使用，以确保每次提交的消息都符合预定义的规范。

### 安装和配置 Commitlint

1. **安装 Commitlint 及其配置**：

   ```bash
   npm install @commitlint/{config-conventional,cli} --save-dev
   ```

2. **配置 Commitlint**：

   在项目根目录下创建一个 `commitlint.config.js` 文件，并添加以下内容：

   ```javascript
   module.exports = {
     extends: ['@commitlint/config-conventional']
   };
   ```

## Commitizen

Commitizen 是一个帮助开发者编写符合规范的提交信息的工具。它提供了一个交互式的命令行界面，指导用户逐步填写提交信息。

### 安装和配置 Commitizen

1. **安装 Commitizen**：

   ```bash
   npm install commitizen --save-dev
   ```

2. **安装适配器**：

   以 `cz-conventional-changelog` 为例，这是一个常用的适配器，符合 Conventional Commits 规范：

   ```bash
   npm install cz-conventional-changelog --save-dev
   ```

3. **配置 Commitizen**：

   在 `package.json` 中添加以下配置，以便 Commitizen 使用指定的适配器：

   ```json
   {
     "config": {
       "commitizen": {
         "path": "@commitlint/cz-commitlint"
       }
     }
   }
   ```

### 使用 Commitizen

安装和配置完成后，你可以使用以下命令来创建提交：

```bash
npx cz
```

或者，如果你想将其作为 `git cz` 命令的别名，可以在 `package.json` 中添加一个脚本：

```json
{
  "scripts": {
    "commit": "git-cz"
  }
}
```

然后你可以使用 `npm run commit` 来启动 Commitizen 的交互式提交界面。

## 结论

通过结合使用 Husky、Commitlint 和 Commitizen，我们可以在团队中强制执行一致的提交信息格式。这不仅提高了代码库的可读性，还帮助团队成员更好地理解每次提交的目的和影响。使用这些工具可以显著提高项目的质量和协作效率。此外，Husky 还可以配置其他钩子，例如 `pre-commit` 钩子，用于在提交之前运行测试或代码格式化工具。通过灵活配置，Husky 可以帮助团队在开发过程中保持高质量的代码标准。
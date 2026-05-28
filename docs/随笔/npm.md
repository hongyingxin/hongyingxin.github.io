# 工具链对比

## npm, yarn, pnpm 对比

npm 是 Node.js 默认的包管理器。早期 npm 因为嵌套式 `node_modules`、重复安装、目录层级深、文件读写多等原因，安装速度较慢。npm v3 之后引入依赖铺平，改善了速度和目录结构，但也带来了幽灵依赖问题。

yarn 是为了解决早期 npm 安装慢、版本不稳定等问题而诞生的。Yarn v1 通过并行下载、全局缓存、`yarn.lock` 和依赖铺平等机制，让安装速度和稳定性都有明显提升，但同样可能存在幽灵依赖。

pnpm 通过全局内容寻址存储、硬链接和符号链接来复用依赖，安装速度更快，也更节省磁盘空间。同时 pnpm 的依赖结构更严格，能有效避免 npm 和 yarn v1 中常见的幽灵依赖问题。

> 这里需要注意：npm v3 也引入铺平依赖的方案，和 yarn 类似，但两者都存在同一个问题：幽灵依赖。

## 1. npm (Node Package Manager)

npm 是最早的 Node.js 包管理器，也是 Node.js 默认自带的工具。

早期的 npm，尤其是 v3 之前，安装速度较慢，主要和它的底层依赖结构有关。

早期 npm 使用的是嵌套式 `node_modules`：

```txt
node_modules/
  a/
    node_modules/
      lodash/
  b/
    node_modules/
      lodash/
```

这种结构的好处是依赖关系清晰：`a` 用自己的 `lodash`，`b` 用自己的 `lodash`。但问题也很明显：

- 相同依赖会被重复安装多次，磁盘占用大。
- 目录层级很深，文件数量多，安装时需要大量读写文件。
- 在早期 Windows 系统上容易遇到路径过长问题。
- 每个项目都有自己的 `node_modules`，不像 pnpm 那样复用全局内容寻址存储。

npm v3 开始引入更扁平的 `node_modules` 结构，会尽量把依赖提升到项目根目录：

```txt
node_modules/
  a/
  b/
  lodash/
```

这样可以减少重复安装和目录深度，安装速度也有所提升。但扁平化也带来了一个问题：幽灵依赖。

**幽灵依赖** 指的是：项目代码里使用了某个包，但这个包并没有写在当前项目的 `package.json` 里，只是因为它被其它依赖顺手提升到了根目录，所以当前项目也能 `import` 或 `require` 到它。

例如项目只安装了 `a`：

```json
{
  "dependencies": {
    "a": "^1.0.0"
  }
}
```

而 `a` 依赖了 `lodash`。如果 npm 把 `lodash` 提升到了根目录，那么项目代码里可能也能这样写：

```js
import lodash from "lodash";
```

这段代码看起来能正常运行，但 `lodash` 其实不是项目自己声明的依赖。一旦 `a` 升级、不再依赖 `lodash`，或者换成 pnpm 这种更严格的包管理器，项目就可能突然报错。这就是幽灵依赖的问题。

npm v7 的重点改动不是首次引入扁平化，而是在安装器和依赖解析上做了比较大的升级：

- 原生支持 `workspaces`，更适合管理多包项目。
- 默认自动安装 `peerDependencies`，减少手动补依赖的情况。
- 使用新的依赖树处理逻辑，让依赖解析和锁文件结果更稳定。
- `package-lock.json` 升级到 lockfile v2，记录的信息更完整。

所以可以简单理解为：npm v3 主要改善了 `node_modules` 的结构，npm v7 主要改善了依赖解析、peer 依赖和 Monorepo 支持。

**优点：**

- Node.js 默认内置，不需要额外安装。
- 使用最广泛，文档和社区资料最丰富。
- npm scripts 是事实上的脚本标准。
- npm v7+ 原生支持 workspaces。

**缺点：**

- 速度和磁盘空间利用率通常不如 pnpm。
- 对大型项目或 Monorepo 来说，体验不是最优。

```bash
# 安装依赖
npm install
npm i package-name
npm i -D package-name  # 开发依赖

# 运行脚本
npm run dev
npm run build

# 发布包
npm publish

# 更新包
npm update
```

## 2. yarn (Yet Another Resource Negotiator)

yarn 是 Facebook 早期为了解决 npm 安装慢、依赖不稳定等问题推出的包管理器。

它当年主要解决的是 npm 早期的几个痛点：

- 安装过程不够稳定，同一个项目在不同机器上可能装出不同的依赖版本。
- 安装速度慢，依赖下载和构建过程并行度不够。
- 缓存能力弱，重复安装同一个依赖时体验不好。

Yarn v1 的核心改进是 `yarn.lock`、并行安装和全局缓存。

一个包管理器安装依赖，大致会经历几个阶段：

```txt
解析依赖版本 -> 下载依赖包 -> 解压并写入 node_modules -> 执行 install/postinstall 脚本
```

Yarn v1 当年比 npm 快，主要是因为它在这些阶段做了优化：

- **并行下载**：npm 早期很多步骤更偏串行，Yarn 会并发请求多个依赖包，网络等待时间更短。
- **全局缓存**：下载过的包会缓存在本地。下次其它项目再安装同一个版本时，可以直接从缓存读取，不需要重新走网络下载。
- **确定性依赖树**：`yarn.lock` 让 Yarn 更快知道应该安装哪个具体版本，减少重复解析和版本漂移带来的不确定性。
- **更好的安装调度**：Yarn 会把解析、下载、链接依赖等步骤拆得更清楚，并尽量并行处理能并行的任务。

所以 Yarn 的快，不只是“命令执行更快”，而是减少了网络请求、重复下载和串行等待。

`yarn.lock` 会把每个依赖的实际版本、下载地址、完整性校验信息都记录下来。这样即使 `package.json` 里写的是 `^1.2.3`，团队里不同的人执行安装时，也会尽量得到同一份依赖树。

```txt
package.json 负责描述“我想要什么范围的依赖”
yarn.lock 负责记录“这次实际安装了哪个确定版本”
```

Yarn v1 默认仍然使用 `node_modules`，并且和 npm v3 之后类似，也会做依赖提升，也就是常说的“铺平”。

假设项目依赖了 `a` 和 `b`，它们都依赖同一个版本的 `lodash`。如果完全按嵌套结构安装，目录会像这样：

```txt
node_modules/
  a/
    node_modules/
      lodash/
  b/
    node_modules/
      lodash/
```

Yarn v1 会尽量把可以共用的依赖提升到根目录：

```txt
node_modules/
  a/
  b/
  lodash/
```

这样做的好处是减少重复安装、降低目录深度，也能让依赖查找更快一些。

但铺平也会带来一个副作用：幽灵依赖。也就是说，如果某个包被提升到了根目录，即使项目没有在 `package.json` 中直接声明它，代码也可能暂时能引用到。

需要注意的是，yarn 有两个阶段：

- Yarn Classic：通常指 yarn v1，很多老项目仍然在使用。
- Yarn Berry：通常指 yarn v2+，引入了 Plug'n'Play、`.yarnrc.yml` 等新机制。

判断一个项目用的是 Yarn v1 还是 v2+，可以看这几个地方：

```bash
yarn --version
```

如果输出是 `1.x.x`，就是 Yarn Classic；如果是 `2.x.x`、`3.x.x`、`4.x.x`，通常就是 Yarn Berry。

也可以看项目文件：

| 判断点 | Yarn v1 | Yarn v2+ |
| --- | --- | --- |
| 版本号 | `1.x.x` | `2.x.x`、`3.x.x`、`4.x.x` |
| 配置文件 | 常见 `.yarnrc` | 常见 `.yarnrc.yml` |
| 依赖目录 | 默认使用 `node_modules` | 默认可能使用 PnP，也可以配置成 `node_modules` |
| PnP 文件 | 通常没有 | 可能有 `.pnp.cjs` |
| 缓存目录 | 全局缓存为主 | 项目内常见 `.yarn/cache` |

如果 `package.json` 里有 `packageManager` 字段，也能直接看出来：

```json
{
  "packageManager": "yarn@4.1.0"
}
```

这个例子说明项目希望使用 Yarn v4，也就是 Yarn Berry。

Yarn Berry 最大的变化是 Plug'n'Play，简称 PnP。PnP 不再依赖传统的 `node_modules` 目录，而是通过一个映射文件告诉 Node.js：某个包应该从哪里加载。

传统 `node_modules` 大致是这样：

```txt
node_modules/
  react/
  vite/
  lodash/
```

PnP 更像是这样：

```txt
.pnp.cjs  # 记录依赖到真实文件位置的映射关系
.yarn/cache/
  react-npm-xxx.zip
  vite-npm-xxx.zip
```

这样做的好处是：

- 不需要生成庞大的 `node_modules` 目录，安装速度可以更快。
- 依赖关系更严格，未声明的依赖不会被随便访问。
- 依赖可以以压缩包形式缓存，适合零安装（Zero-Installs）工作流。

但 PnP 也有成本：有些工具默认假设依赖一定在 `node_modules` 里，遇到 PnP 时可能需要额外配置。所以很多团队即使用 Yarn Berry，也会选择 `nodeLinker: node-modules`，继续使用传统的 `node_modules`。

**优点：**

- 并行安装，早期性能明显优于 npm。
- 支持离线缓存。
- `yarn.lock` 能保证依赖版本一致。
- 在一些老项目和团队项目中仍然很常见。

**缺点：**

- v1 和 v2+ 差异较大，迁移和维护时需要注意。
- Plug'n'Play 模式下，部分工具链可能需要额外配置。

```bash
# 安装
yarn
yarn add package-name
yarn add -D package-name

# 运行脚本
yarn dev
yarn build

# 缓存清理
yarn cache clean

# 工作区操作
yarn workspace workspace-name add package-name
```

## 3. pnpm (Performance npm)

pnpm 是现在很常用的新一代包管理器。它最大的特点是使用全局内容寻址存储和硬链接来复用依赖，因此安装速度快，也更节省磁盘空间。

pnpm 默认不会让项目随意访问没有声明的依赖。这个特性会让依赖关系更严格，也更适合大型项目和 Monorepo。

### pnpm 为什么快、为什么省空间

npm 和 yarn v1 默认会把依赖复制到每个项目自己的 `node_modules` 里。不同项目如果都依赖同一个版本的 `lodash`，通常每个项目都会各自保存一份。

pnpm 的思路不一样：它会先把依赖包存进一个全局内容寻址存储，通常可以理解成一个全局仓库。项目里的 `node_modules` 不直接复制完整依赖，而是通过硬链接和符号链接指向这份全局存储。

```txt
全局 store
  lodash@4.17.21
  react@18.2.0

项目 A node_modules
  lodash -> 全局 store 里的 lodash@4.17.21

项目 B node_modules
  lodash -> 全局 store 里的 lodash@4.17.21
```

这里有两个概念：

- **硬链接**：多个文件名指向磁盘上的同一份真实内容，看起来像每个项目都有一份，实际上不重复占用空间。
- **符号链接**：类似快捷方式，用来组织 `node_modules` 里的依赖访问路径。

所以 pnpm 的快主要来自几个方面：

- 已经下载过的包可以直接复用全局 store，不需要重复下载。
- 相同版本的依赖不会在每个项目里重复复制，磁盘占用更小。
- 安装时更多是在建立链接，而不是大量复制文件。
- 依赖结构更稳定，适合在大型项目和 Monorepo 中复用。

### pnpm 的 node_modules 结构

pnpm 的 `node_modules` 看起来比 npm/yarn v1 更特殊。它会把真实依赖放在 `.pnpm` 目录里，然后再通过符号链接组织访问关系。

大致结构如下：

```txt
node_modules/
  .pnpm/
    lodash@4.17.21/
      node_modules/
        lodash/
    a@1.0.0/
      node_modules/
        a/
        lodash -> ../../lodash@4.17.21/node_modules/lodash
  a -> .pnpm/a@1.0.0/node_modules/a
```

这种结构的关键点是：项目只能直接访问自己在 `package.json` 里声明过的依赖。

例如项目只安装了 `a`：

```json
{
  "dependencies": {
    "a": "^1.0.0"
  }
}
```

即使 `a` 自己依赖了 `lodash`，项目代码里也不应该直接写：

```js
import lodash from "lodash";
```

因为 `lodash` 不是当前项目声明的直接依赖。pnpm 通过更严格的链接结构，让这种幽灵依赖更容易暴露出来。

如果项目真的要使用 `lodash`，就应该显式安装：

```bash
pnpm add lodash
```

这也是 pnpm 常被认为更“严格”的原因：它不是故意让使用变麻烦，而是让依赖关系和 `package.json` 保持一致。

### pnpm 和 Monorepo

pnpm 对 Monorepo 支持很好，核心配置是 `pnpm-workspace.yaml`：

```yaml
packages:
  - "packages/*"
  - "docs"
```

在 Monorepo 中，可以用 `--filter` 只操作某一个包：

```bash
pnpm --filter package-name dev
pnpm --filter package-name add axios
pnpm --filter package-name build
```

这比在多个子项目之间手动切目录更方便，也更适合大型项目统一管理依赖和脚本。

**优点：**

- 安装速度快。
- 磁盘空间利用率高。
- 严格的依赖管理能减少幽灵依赖。
- 对 Monorepo 支持很好。

**缺点：**

- 老项目切换到 pnpm 时，可能会暴露原本没有声明完整的依赖。
- 少数工具如果默认假设扁平 `node_modules`，可能需要额外配置。

```bash
# 安装
pnpm install
pnpm add package-name
pnpm add -D package-name

# 运行脚本
pnpm dev
pnpm build

# 工作区操作
pnpm --filter package-name add dependency
```

## 幽灵依赖

前面一直提到幽灵依赖问题，这里再详细解释一下。

幽灵依赖指的是：项目代码里使用了某个包，但这个包并没有写在当前项目的 `package.json` 里，只是因为它被其它依赖顺手提升到了根目录，所以当前项目也能 `import` 或 `require` 到它。

### 产生的原因

幽灵依赖是npm(v3+)和yarn(v1)架构设计上的副产品。它们的底层采用了扁平化的node_modules结构。

假设你的项目依赖关系如下：

- 项目安装了包A

- 包A的内部代码依赖了包B

在扁平化之前，node_modules结构如下：

```txt
node_modules/
  └─ 包 A/
       └─ node_modules/
            └─ 包 B/  （你无法直接引用，因为路径太深）
```

在扁平化之后，为了减少文件重复和路径过长的问题，npm和yarn依赖平铺到了根目录。

```txt
node_modules/
  ├─ 包 A/
  └─ 包 B/  （包 B 被提到了根目录！）
```

这时候，神奇的事情发生了：因为 Node.js 寻找模块的机制是逐级往上查找 node_modules 的根目录。既然 包 B 就在根目录下，你的业务代码哪怕没有安装过 包 B，直接写 import B from 'B'，居然也能完美运行，不会报错！ 这个 包 B，就是幽灵依赖。

### 产生的问题

幽灵依赖的问题主要有两个：

1. 版本失控与代码突发崩溃

因为 包 B 的版本是由 包 A 决定的。万一哪天你升级了 包 A，而新版的 包 A 不再依赖 包 B 了，或者 包 B 升到了一个破坏性的大版本（Breaking Change），你的项目在重新打包时就会直接报错崩溃（找不到模块或方法报错）。而你甚至都不知道为什么。

2. 不同环境下的表现不一致

幽灵依赖能不能被成功引用，完全取决于 npm 扁平化算法提升了哪个包。在你的电脑上可能刚好提升了 包 B，代码能跑通；但持续集成环境（CI/CD）或者同事的电脑上，由于安装顺序或环境不同，可能根本没提升 包 B，导致“在我的电脑上是好的，部署到服务器就挂了”。

### 彻底解决

1. pnpm诞生的一大核心就是为了解决幽灵依赖问题。

pnpm抛弃了扁平化结构，使用树状的符号链接。在pnpm创建的node_modules根目录下，只会存在显式声明在`package.json`中的依赖。

包A依赖的包B，会被严格限制在包A自己的私有空间里。如果直接`import B`，编译阶段会报错`Module not found`，从根本上杜绝了写出幽灵依赖的可能。

2. yarn pnp

yarn v2版本引入了Plug'n'Play（PnP）模式，彻底抛弃了node_modules，通过一个`.pnp.cjs`文件来记录依赖到真实文件位置的映射关系。依赖关系更严格，同样杜绝了幽灵依赖。

3， 社区工具

depcheck 可以检查项目中未使用的依赖，帮助你清理幽灵依赖。

## nvm (Node Version Manager)

nvm 不是包管理器，而是 Node.js 的版本管理工具。它用来安装多个 Node.js 版本，并在不同项目之间切换。

```bash
# 版本管理
nvm install 16.14.0
nvm use 16.14.0
nvm alias default 16.14.0

# 查看版本
nvm ls
nvm current

# 切换源
nvm use node  # 使用最新版
nvm use lts   # 使用 LTS 版本
```

## 项目配置文件对比

**npm (package.json)**

```json
{
  "name": "project-name",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build"
  },
  "dependencies": {
    "vue": "^3.3.4"
  },
  "devDependencies": {
    "typescript": "^5.0.2"
  }
}
```

**yarn (package.json + yarn.lock)**

```json
{
  "name": "project-name",
  "packageManager": "yarn@3.6.0",
  "workspaces": [
    "packages/*"
  ],
  "dependencies": {
    "vue": "^3.3.4"
  }
}
```

**pnpm (pnpm-workspace.yaml + package.json)**

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'docs'
```

```json
// package.json
{
  "name": "project-name",
  "engines": {
    "node": ">=16",
    "pnpm": ">=8"
  }
}
```

**总结：**

项目中推荐使用pnpm构建，nvm管理Node.js版本。

## 团队开发

```bash
# 推荐工作流
nvm use 16                  # 设置 Node 版本
pnpm install                # 安装依赖
pnpm dev                    # 开发
pnpm test                   # 测试
pnpm build                  # 构建
pnpm changeset              # 版本管理
pnpm publish                # 发布
```

## 安装命令参数详解

### 常用安装参数

**依赖类型参数**

```bash
# 生产依赖 (dependencies)
npm install package-name
yarn add package-name

# 开发依赖 (devDependencies)
npm install -D package-name
yarn add -D package-name

# 全局安装
npm install -g package-name
yarn global add package-name
```

**版本控制参数**

```bash
# 安装精确版本
npm install package-name --save-exact
yarn add package-name --exact

# 安装指定版本
npm install package-name@1.2.3
yarn add package-name@1.2.3
```

**其它常用参数**

```bash
# 强制重新安装
npm install --force
yarn add --force

# 忽略脚本
npm install --ignore-scripts
yarn add --ignore-scripts

# 离线安装
npm install --offline
yarn add --offline
```

**package.json中的依赖类型**

```json
{
  "dependencies": {
    // 生产环境依赖
    "vue": "^3.3.4"
  },
  "devDependencies": {
    // 开发环境依赖
    "vite": "^4.4.0",
    "typescript": "^5.0.2"
  },
  "peerDependencies": {
    // 同伴依赖，指定兼容的依赖版本
    "react": ">=16.8.0"
  },
  "optionalDependencies": {
    // 可选依赖，安装失败不会导致整个安装失败
    "colors": "^1.4.0"
  }
}
```

**版本号说明**

```json
{
  "dependencies": {
    "package1": "1.2.3",    // 精确版本
    "package2": "^1.2.3",   // 兼容更新 (1.x.x)
    "package3": "~1.2.3",   // 补丁更新 (1.2.x)
    "package4": "*",        // 最新版本
    "package5": ">=1.2.3",  // 大于等于指定版本
    "package6": "1.2.3-beta.1" // 预发布版本
  }
}
```

### 常见使用场景

**前端项目常用开发依赖（-D）**

```bash
# TypeScript 相关
pnpm add -D typescript @types/node

# 构建工具
pnpm add -D vite @vitejs/plugin-vue

# 代码规范
pnpm add -D eslint prettier

# 测试工具
pnpm add -D vitest @vue/test-utils
```

**生产依赖（默认）**

```bash
# 框架核心
pnpm add vue vue-router pinia

# UI 组件库
pnpm add element-plus

# 工具库
pnpm add axios lodash dayjs
```

**全局依赖（-g）**

```bash
# CLI 工具
npm i -g @vue/cli
npm i -g typescript
npm i -g pnpm
```

**总结：**

- `-D`用于开发工具和构建相关依赖
- 默认安装（不带参数）用于运行时必须的依赖
- `-g`用于全局命令工具

**npm安装命令中的-save参数**

```bash
# 历史版本 (npm v5 之前)

# 保存到 dependencies
npm install package-name --save
npm install package-name -s

# 保存到 devDependencies
npm install package-name --save-dev
npm install package-name -D

# 现代版本 (npm v5+)

# --save 已经是默认行为，不需要显式指定
npm install package-name  # 自动保存到 dependencies

# 仍然需要 -D 来保存到 devDependencies
npm install package-name -D

# 完整的保存相关参数对比

# 1. 保存到 dependencies (生产依赖)
npm install package-name            # 现代推荐
npm install package-name --save     # 旧版写法
npm install package-name -s         # 旧版简写

# 2. 保存到 devDependencies (开发依赖)
npm install package-name -D
npm install package-name --save-dev

# 3. 保存到 optionalDependencies (可选依赖)
npm install package-name -O
npm install package-name --save-optional

# 4. 保存到 peerDependencies (同步依赖)
# 注意：这个需要手动编辑 package.json

# 最佳实践建议
# 推荐使用这些命令
pnpm add package-name      # 添加生产依赖
pnpm add -D package-name   # 添加开发依赖
pnpm add -g package-name   # 添加全局依赖

# 不推荐使用这些旧语法
npm install package-name -s
npm install package-name --save
```

- `--save` / `-s` 保存到 `dependencies`
- `--save-dev` / `-D` 保存到 `devDependencies`

npm v5+已经默认会保存到 `dependencies`，以上的命令变得多余。


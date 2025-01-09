# 工具链对比

1. **npm (Node Package Manager)**

   最早的Node.js包管理器，是默认的标准

   **优点：**

   - Node.js默认包管理器，生态完整
   - 使用最广泛，文档丰富
   - npm script标准
   - npm v7+原生支持workspaces

   **缺点：**

   - 安装速度慢

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

2. **yarn (Yet Another Resource Negotiator)**

   Facebook开发的替代npm的工具

   **优点：**

   - 并行安装，性能好
   - 离线缓存
   - yarn.lock确保依赖版本一致性

   **缺点：**

   - 某些包可能与yarn不兼容

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

3. **pnpm (Performance npm)**

   新一代包管理工具

   **优点：**

   - 最快的包管理器
   - 磁盘空间利用最优（硬链接）
   - 严格的依赖管理
   - 完美支持monorepo

   **缺点：**

   - 生态圈没有前两者完整

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

4. **nvm (Node Version Manager)**

   Node.js的版本管理工具，用来管理多个Node.js版本，便于切换版本。

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

### 项目配置文件对比

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

### 团队开发

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

### 安装命令参数详解

#### 常用安装参数

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

#### 常见使用场景

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
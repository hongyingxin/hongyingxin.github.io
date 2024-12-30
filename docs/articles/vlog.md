# 搭建个人博客

最近一直想搭建一个属于自己的博客，既能记录学习过程，也能当做简历的一个亮点。静态站点主要有 Hexo、Hugo、VuePress、VitePress 等。作为一个 Vue 技术栈的开发者，我主要对比了 VuePress 和 VitePress 这两个框架。

## 为什么选择 VitePress？

在对比 VuePress 和 VitePress 后，我选择了 VitePress，主要有以下几个原因：

1. **更快的开发体验**：
   - VitePress 基于 Vite 构建，冷启动和热更新速度都比 VuePress 快很多
   - VuePress 基于 Webpack，在大型项目中构建速度较慢

2. **更简洁的配置**：
   - VitePress 的配置更加直观，去掉了很多不必要的功能
   - VuePress 功能全面但配置较为复杂，有些功能可能永远用不到

3. **更现代的技术栈**：
   - VitePress 默认使用 Vue 3 和 TypeScript
   - VuePress 2.x 虽然也支持 Vue 3，但生态不如 VitePress 新鲜

4. **更小的打包体积**：
   - VitePress 打包后的体积明显小于 VuePress
   - 这意味着更快的加载速度和更好的用户体验

虽然 VuePress 的生态更加丰富，插件也更多，但对于个人博客来说，VitePress 的简洁和性能优势更适合我的需求。而且Vue团队将重点转向了VitePress，VuePress 2.x 将不再维护。

## 搭建过程

### 1. 项目初始化
首先创建一个新的项目文件夹，然后初始化项目：

```bash
# 1.使用你习惯的方式创建一个新文件夹
# 进入项目目录后执行：
npm init -y

# 安装 VitePress 和 Vue
npm install -D vitepress vue

# 2.vitePress也附带一个命令行设置向导，可以帮组你构建一个基本项目
npx vitepress init
```

### 2. 项目结构
创建以下目录结构：
```
my-blog/
├── docs/
│ ├── .vitepress/
│ │ └── config.mts # 配置文件
│ ├── articles/ # 文章目录
│ │ └── index.md # 文章列表
│ └── index.md # 首页
└── package.json
```

### 3. 启动并运行

```bash
{
  "scripts": {
    "docs:dev": "vitepress dev docs",
    "docs:build": "vitepress build docs",
    "docs:preview": "vitepress preview docs"
  },
}
```

### 4.部署到 GitHub Pages

#### Github Pages简介
GitHub Pages 是一项静态站点托管服务，它直接从 GitHub 上的仓库获取 HTML、CSS 和 JavaScript 文件，（可选）通过构建过程运行文件，然后发布网站。

#### 部署流程

1. **创建仓库**
 - 登录 GitHub 账号，点击右上角的 "+" 号，选择 "New repository"
 - 输入`userName.github.io`作为仓库名称，将`userName`替换为你的GitHub用户名，例如：如果用户名是`caixunkun`，则仓库名称为`caixunkun.github.io`
 - 选择 "Public" 或 "Private" 取决于你的需求。从 2020 年开始，GitHub Pages 支持从公共和私有仓库发布网站。但建议选择Public，因为私有仓库需要付费。

2. **配置 GitHub Actions**

在项目根目录创建 `.github/workflows/deploy.yml`：
```yaml
   name: Deploy VitePress site to Pages
   on:
     push:
       branches: [master]  # 设置要部署的分支
     workflow_dispatch:    # 允许手动触发部署
   permissions:
     contents: read
     pages: write
     id-token: write
   jobs:
     build:
       runs-on: ubuntu-latest
       steps:
         - name: Checkout
           uses: actions/checkout@v4
         - name: Setup Node
           uses: actions/setup-node@v4
           with:
             node-version: 18
             cache: npm
         - name: Install dependencies
           run: |
             rm -rf node_modules package-lock.json
             npm install
             npm install @rollup/rollup-linux-x64-gnu  # 解决 rollup 依赖问题
         - name: Build
           run: |
             npm run docs:build
             touch docs/.vitepress/dist/.nojekyll  # 防止 GitHub Pages 忽略以下划线开头的文件
         - name: Upload artifact
           uses: actions/upload-pages-artifact@v3
           with:
             path: docs/.vitepress/dist
     deploy:
       needs: build
       runs-on: ubuntu-latest
       environment:
         name: github-pages
         url: ${{ steps.deployment.outputs.page_url }}
       steps:
         - name: Deploy
           id: deployment
           uses: actions/deploy-pages@v4     
```
3. **仓库设置**
  - 进入仓库的 Settings > Pages
  - 在 "Build and deployment" 部分：
    - Source: 选择 "GitHub Actions"
    - 确保 HTTPS 已启用

4. **VitePress 配置**
    - 由于使用 `username.github.io` 作为仓库名，需要在 `docs/.vitepress/config.mts` 中设置正确的 base：
    ```typescript
    export default defineConfig({
      base: '/',  // 对于 username.github.io 仓库使用 '/'
      // ... 其他配置
    })
    ```
5. **推送和部署**
    - 提交代码到 master 分支：
    ```bash
    git add .
    git commit -m "update: site content"
    git push
    ```
    - GitHub Actions 会自动触发部署流程
    - 可以在仓库的 Actions 标签页查看部署进度
    - 部署完成后，访问 `https://username.github.io` 查看网站

## 总结

在搭建过程中遇到了一些问题，记录下来供大家参考：

#### 1. GitHub Pages 部署问题
一开始部署到 GitHub Pages 时遇到了一些困难：
- **Actions 构建失败**：原来是缺少了 rollup 的依赖。
- **页面空白**：base 路径配置错误导致。
- **样式丢失**：忘记添加 .nojekyll 文件。
- **部署后无法访问**：需要等待几分钟让变更生效。

**解决方案**：
1. 在 workflow 中添加 rollup 依赖安装。
2. 正确配置 base 路径。
3. 确保添加 .nojekyll 文件。
4. 确保仓库名称格式正确，检查 GitHub Pages 设置是否正确，等待几分钟让变更生效。

#### 2. Markdown 编写效率
为了提高写作效率，我在 VS Code 中安装了几个非常好用的插件：
- **Markdown All in One**：提供了很多快捷键。
- **Paste Image**：直接粘贴图片，特别方便。
- **markdownlint**：帮助规范 Markdown 格式。

#### 3. 后续计划

- [ ] 自定义主题样式
- [ ] 添加评论功能
- [ ] 优化移动端显示
- [ ] 添加文章目录
- [ ] 优化 SEO

#### 4. 总结

搭建博客的过程虽然遇到了一些问题，但整体来说还是比较顺利的。VitePress 的开发体验确实很好，特别是热更新的速度让人惊喜。

希望这个博客能够督促自己多写文章，记录学习过程，也希望能帮助到其他想要搭建博客的朋友。

## 参考资料

- [VitePress 官方文档](https://vitepress.dev/)
- [GitHub Pages 部署指南](https://docs.github.com/cn/pages)
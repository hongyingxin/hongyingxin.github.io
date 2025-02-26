# React后管项目初始化

## 1. 项目初始化
选择一个文件夹目录，打开终端，输入以下命令，使用Vite创建一个名为 react-admin 的 React 项目，并使用 TypeScript 模板。

```bash
npm create vite@latest react-admin -- --template react-ts

cd react-admin

npm install

npm run dev
```

## 2. 安装依赖
```bash
# 路由
npm install react-router-dom

# 状态管理
npm install @reduxjs/toolkit react-redux

# UI 框架
npm install antd @ant-design/icons

# 网络请求
npm install axios

# 国际化
npm install i18next react-i18next

# 工具库
npm install dayjs
```
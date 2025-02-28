# 问题收集

## eslint配置报错
```typescript
export interface ResultData<T = any> extends Result {
  data: T;
}
// Unexpected any. Specify a different type.
```
解决方法：

TypeScript使用 any 会绕过类型检查，所以默认是禁止的

在eslint.config.js新增这条配置
```javascript
rules: {
  '@typescript-eslint/no-explicit-any': 'off'
}
```

## @路径符号报错
```javascript
import { message } from "@/hooks/useMessage";
// 找不到模块“@/hooks/useMessage”或其相应的类型声明
```
解决方法：

在vite.config.ts中添加路径别名配置

在tsconfig.app.json中添加路径别名配置

```bash
# 安装依赖
npm install --save-dev @types/node
```

```typescript
import path from 'path'
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')  // 添加这个配置
    }
  }
})
```

```js
"baseUrl": ".",
"paths": {
  "@": ["src"],
  "@/*": ["src/*"]
}
```
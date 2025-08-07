# Vite项目添加ESlint和Prettier

前端代码格式的重要性不容忽视。良好的代码格式不仅提高了代码的可读性，还能促进团队协作，减少因格式不一致而导致的错误。使用工具如ESlint和Prettier可以自动化代码检查和格式化，确保代码风格的一致性，从而提高开发效率和代码质量。

## ESlint
Eslint主要用于检测和修复JavaScript和Typescript代码中的问题。功能是检查代码中的错误和潜在的bug。

### 配置文件
- `.eslintrc.json`
- `.eslintrc.js`

`.eslintrc.json`是用JSON格式来配置Eslint的规则和选项，适合简单和静态配置。

`.eslintrc.config.js`是用JavaScript格式来配置Eslint，适合于需要动态配置或复杂逻辑的场景。

```javascript
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'prettier', // 确保 Prettier 配置优先
  ],
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': 'error',
  },
};
```

## Prettier
Prettier主要用于代码格式化，确保代码的风格。功能是自动格式化代码，处理代码中如缩进、引号使用等格式问题。

### 配置文件
- `.prettierrc`
- `.prettierrc.js`

```javascript
module.exports = {
  semi: false,
  singleQuote: true,
  trailingComma: 'es5',
  tabWidth: 2,
  printWidth: 80,
};
```

## 如何配置
在VSCode中安装插件，分别是ESlint和Prettier。

![Excel Image](/public/assets/eslint_1.png)

![Excel Image](/public/assets/eslint_2.png)

在`package.json`文件中添加相应的依赖包，然后运行`npm install`或`yarn`安装依赖。

```javascript
"devDependencies": {
  "@typescript-eslint/eslint-plugin": "^6.17.0",
  "@typescript-eslint/parser": "^6.17.0",
  "eslint": "^8.56.0",
  "eslint-config-prettier": "^9.1.0",
  "eslint-plugin-prettier": "^5.1.2",
  "eslint-plugin-react": "^7.33.2",
  "eslint-plugin-react-hooks": "^4.6.0",
  "prettier": "^3.1.1"
}
```

在项目根目录下新建以下四个文件：
- `.eslintignore`
- `.eslintrc.cjs`
- `.prettierignore`
- `.prettierrc.cjs`

### .eslintignore
指定ESlint运行时需要忽视的文件或目录。

```javascript
*.sh
node_modules
*.md
*.woff
*.ttf
.vscode
.idea
dist
/public
/docs
.husky
.local
/bin
/src/mock/*
stats.html
```

### .eslintrc.cjs
配置ESlint的规则和设置。

```javascript
// @see: http://eslint.cn

module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  settings: {
    react: {
      version: "detect",
    },
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    jsxPragma: "React",
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ["react", "@typescript-eslint", "prettier"],
  extends: [
    "eslint:recommended",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended",
    "plugin:prettier/recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  rules: {
    "no-var": "error",
    "no-multiple-empty-lines": ["error", { max: 1 }],
    "no-use-before-define": "off",
    "prefer-const": "off",

    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/prefer-ts-expect-error": "error",
    "@typescript-eslint/ban-ts-comment": "error",
    "@typescript-eslint/no-inferrable-types": "off",
    "@typescript-eslint/no-namespace": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/ban-types": "off",
    "@typescript-eslint/no-var-requires": "off",
    "@typescript-eslint/no-empty-function": "off",
    "@typescript-eslint/no-non-null-assertion": "off",

    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "off",
  },
};
```

### .prettierignore
指定Prettier在格式化时需要忽略的文件或目录。

```javascript
/dist/*
.local
/node_modules/**
**/*.svg
**/*.sh
/public/*
stats.html
```

### .prettierrc.cjs
配置Prettier的格式化规则。

```javascript
// @see: https://www.prettier.cn

module.exports = {
  printWidth: 130,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: false,
  quoteProps: "as-needed",
  jsxSingleQuote: false,
  trailingComma: "none",
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: "avoid",
  requirePragma: false,
  insertPragma: false,
  proseWrap: "preserve",
  htmlWhitespaceSensitivity: "css",
  endOfLine: "auto",
  rangeStart: 0,
  rangeEnd: Infinity
};
```

关于规则的详细信息可以参考这两个网站：[Prettier](https://www.prettier.cn) 和 [ESLint](http://eslint.cn)。

最后，需要在你的项目目录下新增`.vscode/setting.json`文件。

```javascript
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.stylelint": "explicit"
  },
  "stylelint.enable": true,
  "stylelint.validate": ["css", "less", "postcss", "scss", "sass", "html"],
  "files.eol": "\n",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[jsonc]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[scss]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[html]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[markdown]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[less]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```
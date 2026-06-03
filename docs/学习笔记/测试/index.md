# 前端测试框架选择

2026年主流前端测试框架推荐：单元/集成测试首选 Vitest (速度快，Vite生态) 或 Jest (成熟全面)，E2E端到端测试首选 Playwright (现代快) 或 Cypress (调试体验好)。针对组件测试，推荐使用 React Testing Library 或 Vue Test Utils。

## 1. 单元测试与集成测试 (Unit & Integration)

- Vitest (推荐): 专为现代 Vite 项目设计，兼容 Jest API，速度比 Jest 快。

- Jest: Facebook 出品，功能全面，开箱即用，是 React 官方推荐的成熟选择。

- Mocha: 灵活丰富，需配合 Chai 等断言库使用。

## 2. E2E 端到端测试 (End-to-End)

- Playwright (推荐): 现代化的自动化工具，速度快、支持跨浏览器（Chromium, Firefox, WebKit），特别适合CI/CD。

- Cypress: 提供极致的开发者调试体验，界面友好，适合前端开发调试。

- Selenium: 传统自动化工具，兼容性极强但配置较复杂。

## 3. 组件测试 (Component Testing)

- React Testing Library / Vue Test Utils: 关注用户行为而非内部实现，配合 Vitest/Jest 使用。
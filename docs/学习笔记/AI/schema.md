# schema

目前在写蓝湖MCP，用设计稿直接生成代码。在这个过程中，发现有无开启设计稿转代码的差距巨大。

于是研究了下schema，也就是转代码的工具。

蓝湖的 schema.json 不是通用标准，而是蓝湖 DDS（Design to Code Service）的私有格式，通过 dds.lanhuapp.com 的 store_schema_revise 生成。

```mermaid
PSD/Sketch/Figma
    ↓ 设计师在蓝湖上传 + 开启「设计稿转代码」
蓝湖后台 DDS 服务
    ↓ store_schema_revise
*.schema.json（私有结构：layout + CSS + children）
    ↓ convert_lanhu_to_html()
HTML + CSS 规格
```

## 代替方案

由于这个是蓝湖特有的，所以找替代方案，即psd转schema/json的方案。

### A. 同类 D2C 平台（有自己的 JSON/Schema，不是蓝湖 Schema）

| 工具 | 输入 | 输出 | 特点 |
| --- | --- | --- | --- |
| imgcook（阿里） | Sketch / PSD / Figma / 图片 | 自有 JSON + React/Vue 代码 | 国内成熟，有 Sketch/PSD/Figma 插件，偏直接出代码 |
| MasterGo 转代码 | MasterGo 设计稿 | 结构化数据 + 代码 | 国内协作平台自带 |
| Pixso 转代码 | Pixso 设计稿 | 结构化 + 代码 | 类似 MasterGo |
| CodeFun / 其他 D2C | 设计稿 | 多端代码 | 偏成品代码，不是给 AI 的中间 schema |

这类是「换一条 D2C 链路」，不是产出蓝湖 `schema.json`，但目标一样：结构化设计数据 → 高还原代码。

### B. PSD 解析库（自己定义 Schema）

| 工具 | 语言 | 输出 | 局限 |
| --- | --- | --- | --- |
| ag-psd | JS/TS | 原始 PSD 图层树 | 只有结构，没有 flex/语义布局 |
| psd.js / psd-parser | JS | 图层树 + 文字/样式 | 同上，需自己做 layout 推断 |
| psd-converter | Python + MCP | UI JSON（含 flex、tokens、CSS） | 较新，偏 AI 工作流，需自研对接 |
| Polotno psd-import | JS | Polotno schema | 偏 canvas 编辑器，不是 Web 组件 schema |

适合 Node 重构时自建 schema 层：PSD → 你的 JSON Schema → HTML/CSS。

### C. Figma 生态（如果设计源是 Figma 不是 PSD）

| 插件 | 输出 |
| --- | --- |
| NightHeron JSON Extractor | 结构化 AST JSON + assets ZIP，含 Auto Layout → Flex |
| Specs (Figma) | YAML/JSON，给 Cursor/Claude 用 |
| Anima / Locofy / Builder.io | 直接出 React/Vue 代码 |

Figma 链路通常比纯 PSD 解析更准，因为有 Auto Layout 语义。
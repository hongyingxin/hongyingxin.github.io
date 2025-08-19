# Vite

<!-- 插件 -->
## rollup-plugin-visualizer

`rollup-plugin-visualizer` 是一个基于 Rollup 的插件，用来分析项目中的文件大小以及引入情况，以此来做优化。

这个插件提供了多种配置选项，可以根据实际需要选择是否开启 gzipSize 和 brotliSize 来分析文件大小。template 可以设置分析图的类型，支持 treemap、sunburst、network 等，通过这些图表可以清晰地看到文件的依赖关系和层次结构。

### 配置参数说明

- `gzipSize`: 是否开启 gzip 压缩分析
- `brotliSize`: 是否开启 brotli 压缩分析  
- `filename`: 分析图生成的文件名，默认为 `stats.html`
- `open`: 是否在打包后自动打开分析文件，默认为 `true`
- `template`: 分析图的类型，可选值：treemap、sunburst、network
- `emitFile`: 是否将分析图生成为文件

### 安装
```bash
npm install rollup-plugin-visualizer -D
```

### 使用
```javascript
import { visualizer } from "rollup-plugin-visualizer";

export default {
  plugins: [
    visualizer({
      gzipSize: true, // 是否开启 gzip 压缩
      brotliSize: true, // 是否开启 brotli 压缩
      emitFile: false, // 是否将分析图生成文件，默认是 true
      template: "treemap", // 分析图的类型，有 treemap、sunburst、network
      filename: "test.html", // 分析图生成的文件名
      open: true // 如果存在本地服务端口，将在打包后自动展示
    }),
  ],
}
```

生成的分析文件打开后如下图所示，可以通过 Exclude 和 Include 功能来过滤查看特定文件：

![rollup-plugin-visualizer](/public/assets/vite_1.png)

通过这个可视化工具，可以很直观地看到各个模块的大小占比和引入情况，帮助发现循环依赖或者无用的模块引入，从而针对性地进行打包优化。

<!-- 基础 -->
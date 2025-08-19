# Vite

## 基本概念

### Vite由两部分组成

- **开发服务器**：基于原生ES模块提供了丰富的内建功能
- **构建指令**：使用Rollup打包代码

### 快的原因

1. **NPM依赖解析和预构建**：将模块转换为ESM格式
2. **模块热替换**：提供了一套原生ESM的HMR API

Vite利用了ES模块的特性，能够直接运行在浏览器中而不需要打包，更快地重新加载和热更新模块。

Webpack需要将模块打包成一个或者多个bundle文件，还需要翻译器loader处理webpack识别不了的文件（webpack只能处理js文件），导致重新加载和热更新速度变慢。

**ES模块**指ECMAScript模块，是JavaScript中用于组织和导出代码的标准化方式。
主要特性：导出和导入、静态分析、单独请求、作用域、默认导出

## 性能优化

### 常见性能问题

1. 服务器启动慢
2. 页面加载慢
3. 构建慢

### 优化方案

1. **减少解析操作**：解析导入路径是一项昂贵的操作，应明确导入路径
2. **避免使用桶文件**：桶文件指重新导出同一目录下其他文件API的文件

### 代码分割

Vue3默认支持动态导入组件来实现代码分割，无需额外配置。只需在路由或者组件中使用动态导入即可实现按需加载。

## Vite 插件

### rollup-plugin-visualizer

**功能**：一个基于Rollup的插件，用来分析项目中的文件大小以及引入情况，以此来做优化。

**使用方法**：

```javascript
import { visualizer } from "rollup-plugin-visualizer";

export default {
  plugins: [
    visualizer({
      gzipSize: true,
      brotliSize: true,
      emitFile: false,
      filename: "test.html", // 分析图生成的文件名
      open: true // 如果存在本地服务端口，将在打包后自动展示
    }),
  ],
}
```

### vite-plugin-compression

**功能**：一个基于vite的插件，使用gzip或者brotli来压缩资源，减少页面的加载时间和网络带宽，提高用户访问速度和体验。

**业务场景**：
当前端资源过大，服务器请求资源会比较慢。前端可以将资源通过Gzip压缩使文件体积减少大概60%，压缩后的文件，通过后端简单处理，浏览器可以将其正常解析出来。

**配置要求**：
1. 浏览器的请求头中包含 `content-encoding: gzip`，证明浏览器支持该属性
2. Nginx服务器启用Gzip压缩（http、server、location）
3. 服务端配置

**使用方法**：

```javascript
import viteCompression from 'vite-plugin-compression';

export default {
  plugins: [
    viteCompression({
      verbose: true, // 默认即可
      disable: false, // 开启压缩(不禁用)，默认即可
      deleteOriginFile: false, // 删除源文件
      threshold: 10240, // 压缩前最小文件大小
      algorithm: 'gzip', // 压缩算法
      ext: '.gz', // 文件类型
    })
  ]
}
```

**参考文章**：[Vite 插件压缩配置](https://juejin.cn/post/7319624802677899301#heading-5)

### unplugin-vue-components

**功能**：一个提供了按需引入组件的插件。

**业务场景**：
开发项目时使用组件库进行开发，分为全局引入和按需引入两种加载方式：
- **全局引入**：存在产物体积大的问题
- **按需引入**：存在需要手动引入组件和引入样式的问题

`unplugin-vue-components` 可以不需要手动引入组件，能够让开发者像全局组件那样进行开发，但实际上又是按需引入。

**使用方法**：

```javascript
// 引入插件
import Components from 'unplugin-vue-components/vite';
// 通过解析器引入对应的组件库，这里是Vant
import { VantResolver } from 'unplugin-vue-components/resolvers';

export default {
  plugins: [
    Components({
      resolvers: [VantResolver()],
    }),
  ]
}
```

**对比效果**：

```javascript
// 未使用前
import { Button } from 'vant';
// 模板中使用
<van-button type="primary">主要按钮</van-button>

// 使用后
// 无需手动导入，直接使用
<van-button type="primary">主要按钮</van-button>
```

**参考文章**：[Vue组件按需引入配置](https://cloud.tencent.com/developer/article/2296682)

### vite-plugin-cdn-import

**功能**：指定modules在生产环境中使用CDN引入，减少构建时间，提高生产环境页面加载速度。

**业务场景**：
项目优化线上发布的时候，减少JS的体积是常用的手段，例如vuex、axios等采取cdn的引入形式，而不是把它们打入bundle的形式。

**注意事项**：
- 使用CDN未必会加快速度（增加http请求cdn的次数）
- 主要作用是减小打包体积（没有将package单独cdn引入，它们会增加build的大小）
- 对应的JS和CSS需要从远程地址读取

**使用方法**：

```javascript
import { Plugin as importToCDN } from 'vite-plugin-cdn-import';

const prodCDN = [
  // 配置需要CDN引入的模块
];

export default {
  plugins: [
    importToCDN({
      prodUrl: '', // 文件路径
      modules: prodCDN // 需要cdn的文件
    })
  ]
}
```

### vite-plugin-imagemin

**功能**：用来做图片压缩，因为压缩算法问题，压缩率不高。建议采用第三方工具（如tinypng）对图片压缩。

## Vite优化

### 参考文章

- [Vite性能优化实践](https://juejin.cn/post/7336637599895748644)
- [Vite构建优化指南](https://juejin.cn/post/7248118049584332856#heading-10)
- [Vite打包优化策略](https://juejin.cn/post/7242113868554059836)
- [Vite开发优化技巧](https://juejin.cn/post/7235818900818526265)

### Vite优化思路

1. **分析阶段**：使用visualizer插件进行分析
2. **压缩优化**：使用compression对打包文件进行gzip压缩
3. **按需引入**：使用components对第三方组件库按需引入，减少包体积
4. **CDN优化**：使用Plugin引入cdn，减少包体积
5. **图片压缩**：使用imagemin对图片进行压缩，但效果不理想

### Vite优化策略实现过程

1. **静态分析**
   在构建过程中，Vite首先会使用esbuild对所有的模块进行静态分析，生成模块的依赖图

2. **构建入口**
   根据入口文件（如index.html或指定的入口文件）开始解析，确定所有的依赖模块

3. **模块解析**
   Vite通过解析import语句，递归地解析每一个被引用的模块，构建完整的依赖树

4. **Tree Shaking**
   对依赖树进行优化，移除没有被引用的模块。这一步是通过esbuild的Tree Shaking功能完成的

5. **代码拆分**
   根据依赖关系和代码中使用的动态导入语句，Vite会将代码拆成多个代码块（chunks），以便于实现按需加载

6. **打包输出**
   最终，Vite会使用esbuild或Rollup对模块进行打包，将各个代码块输出到指定的目录中

### 总结

通过上述步骤，Vite能够高效地进行打包，仅包含实际被引用的代码，从而大大提升了构建速度和优化了输出文件的体积。


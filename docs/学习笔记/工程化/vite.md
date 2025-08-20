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
## sourcemap

sourcemap 是一个映射文件，它建立了压缩/混淆后的代码与原始源代码之间的对应关系，主要是为了方便错误调试，定位问题代码所在行以及性能分析工具以及Sentry等第三方错误监控工具。

然而，sourcemap 会增加构建时间，并且会增加打包后的文件大小。由于 .map 文件指向于源文件，存在暴漏源代码的风险。

```javascript
// 原始代码 (src/main.ts)
function calculateTotal(price: number, tax: number): number {
  return price * (1 + tax);
}

// 构建后的代码 (build_v/assets/js/main-abc123.js)
function a(b,c){return b*(1+c)}

// Sourcemap 文件告诉浏览器：
// 第1行第1个字符的 "function a" 对应原始代码的 "function calculateTotal"
```

`build.sourcemap` 是 vite 构建的一个选项，构建后是否生成 source map 文件。

- 类型：boolean | 'inline' | 'hidden'
- 默认值：false
- 示例：
  - build.sourcemap = true：生成一个独立的 source map 文件
  - build.sourcemap = 'inline'：source map将作为一个 data url 附加在输出文件
  - build.sourcemap = 'hidden'：跟`true`一样，但是 bundle 文件相应的注释将不被保留

```javascript
// vite.config.js
export default {
  build: {
    sourcemap: true,
  },
};
```

## manualChunks

`build.rollupOptions` 是 vite 构建的一个选项，用于自定义底层的 `Rollup` 打包配置。具体配置需要去查看 [Rollup 文档](https://rollupjs.org/configuration-options/)。

`manualChunks` 是 `rollupOptions.output` 中的一个配置项，用于将代码拆分成多个 chunk。这跟小程序的分包策略类似，可以按照业务模块进行拆分。通过配置 `manualChunks` 可以实现更好的缓存策略和模块管理。

output 配置项，默认根据文件引入内容进行拆分，并根据文件大小进行合并，依据哈希值生成文件名。

```javascript
rollupOptions: {
  // 默认值配置，写不写都一样
  output: {
    chunkFileNames: 'assets/js/[name]-[hash].js',
    entryFileNames: 'assets/js/[name]-[hash].js',
    assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
  }
}
```

`manualChunks` 支持手动配置 chunk 文件名，entry 文件名，以及资源文件名，并且按照 views 目录下的文件进行拆分，将活动和模块拆分。

```javascript
rollupOptions: {
  output: {
    chunkFileNames: 'assets/js/[name]-[hash].js',
    entryFileNames: 'assets/js/[name]-[hash].js',
    assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
    manualChunks: (id) => {
      if (id.includes('views/')) {
        const pathParts = id.split('/');
        const viewIndex = pathParts.findIndex((part) => part === 'views');

        if (viewIndex !== -1 && pathParts[viewIndex + 1]) {
          const moduleName = pathParts[viewIndex + 1];

          // 活动页面
          if (moduleName === 'activity') {
            const activityName = pathParts[viewIndex + 2];
            if (activityName) {
              return `activity-${activityName}`;
            }
            return 'activity-common';
          }

          // 其他模块
          return `module-${moduleName}`;
        }
      }
    },
  },
},
```

为了方便对比，我们将使用 `manualChunks` 打包输出文件为 build_v 目录；没有使用 `manualChunks` 打包输出文件为 build_v2 目录。

文件打包后如下图所示：

![manualChunks](/public/assets/vite_3.png)

| 方面 | build_v (有 manualChunks) | build_v2 (无 manualChunks) |
|------|---------------------------|----------------------------|
| **JS文件数量** | 25个 | 82个 |
| **总大小** | 451M | 451M |
| **文件命名** | 有意义的模块名 | 随机哈希名 |

**分析结论：**

1. **文件数量优化**：使用 `manualChunks` 后，JS文件数量从82个减少到25个，减少了69.5%
2. **总大小不变**：代码总量保持一致（451M），说明只是重新组织了代码分割方式
3. **命名可读性**：命令模式从随机哈希名`36-D1OT2XjX.js`改为有意义的模块名`activity-2024pk-D3mN1sDp.js`，按业务逻辑分组，便于理解和缓存

## modulePreload

推测性加载（Speculative Loading）是指在访问相关页面之前，提前加载可能需要的模块，以减少用户等待时间。

推测性加载主要通过两种方式实现，一种是浏览器自动实现，一种是根据浏览器提供指令实现。

**类型：**

  - preconnect 跨源连接预热，用于在跨源连接上使用

  - dns-prefetch 跨源连接预热，在所有跨源连接上使用

  - preload 用于提前加载当前页面可能需要的资源，与页面主资源的加载并行进行，用于预加载图片、CSS、JavaScript 等资源

  - prefetch 也是用于提前加载可能需要的资源，不过是在浏览器空闲的时候进行

  - modulepreload 与 preload 类似，不过它用于加载 JavaScript 模块

`modulePreload` 是 vite 构建的一个选项，用于配置是否启用模块预加载。

  - 类型：boolean
  - 默认值：true

```html
<!-- Vite 自动生成 -->
<link rel="modulepreload" crossorigin href="./assets/js/activity-2025brazilNationalDay.js">
```

Vite 分析入口文件的直接依赖，构建模块依赖关系图，识别关键加载路径上的模块，最后在 HTML 中自动添加预加载链接。

Vite 预加载策略是按照最大模块选择逻辑

**相关文档：**

- [模块预加载 polyfill ](https://guybedford.com/es-module-preloading-integrity#modulepreload-polyfill)
 
## 打包时间

如何确定打包所花费的时间，我们需要有一个衡量的标准，然后通过对比来确定是否优化成功。

我们可以使用 time 命令来查看打包所花费的时间。

```bash
time vite build
```

当然，也可以通过将 time 命令加入到 package.json 的执行脚本。

```json
{
  "scripts": {
    "build": "vue-tsc && vite build --mode prod",
    "build:time": "time npm run build",
    "build:measure": "echo '开始时间:' && date && npm run build && echo '结束时间:' && date"
  }
}
```

**运行结果**
```bash
npm run build  36.18s user 3.76s system 162% cpu 24.642 total
```

执行完命令后，我们获取到以上结果。

36.18s user 表示用户态时间，3.76s 表示系统态时间，162% 表示 CPU 利用率，24.642 表示总时间。


### 测试 sourcemap 

通过上面的知识，我们现在可以测试 sourcemap 对打包时间的影响。

#### 时间维度
关闭 sourcemap （第一次测试）
```bash
npm run build  36.18s user 3.76s system 162% cpu 24.642 total
```
开启 sourcemap （第二次测试）
```bash
npm run build  38.66s user 5.76s system 39% cpu 1:52.03 total
```

通过对比，我们看到关闭 sourcemap 情况下，打包花费了 24.642 秒，开启 sourcemap 后，打包花费了 112.03 秒，相差了 87.39 秒。
> 备注：这里只针对时间，另外cpu利用率以及系统态时间没有计算在内。

| 项目 | 关闭 sourcemap | 开启 sourcemap | 差值 | 增长率 |
|------|---------------|---------------|------|--------|
| **打包时间** | 24.642秒 | 112.03秒 | +87.39秒 | +354.7% |
| **文件总数** | 2,786个 | 2,868个 | +82个 | +2.9% |
| **总大小** | 472MB | 480MB | +8MB | +1.7% |

#### 空间维度

![sourcemap](/public/assets/vite_2.png)

通过上图，我们可以得知关闭 sourcemap 情况下，打包后文件总数为 2786 个，总大小为 472.mb。开启 sourcemap 后，打包后文件总数为 2868 个，总大小为 480.mb。两者相差 82mb，82个文件。

| 项目 | 关闭 sourcemap | 开启 sourcemap | 差值 | 增长率 |
|------|---------------|---------------|------|--------|
| **打包时间** | 24.642秒 | 112.03秒 | +87.39秒 | +354.7% |
| **文件总数** | 2,786个 | 2,868个 | +82个 | +2.9% |
| **总大小** | 472MB | 480MB | +8MB | +1.7% |

#### 偏差

项目构建过程可能受到各种因素的影响，为了数据的准确性，我们应该多次测试，然后取平均值。

**关闭 sourcemap 测试数据**
| 测试次数 | 用户态时间 | 系统态时间 | CPU利用率 | 总耗时 | 构建状态 |
|---------|-----------|-----------|----------|--------|----------|
| 第1次 | 40.47s | 5.55s | 124% | 37.090s | ✓ 28.61s |
| 第2次 | 38.58s | 4.79s | 146% | 29.669s | ✓ 27.28s |
| 第3次 | 36.69s | 4.55s | 41% | 1:38.28s | ✓ 1m 37s |
| **平均值** | **38.58s** | **4.96s** | **103.7%** | **55.01s** | **50.96s** |

**开启 sourcemap 测试数据**
| 测试次数 | 用户态时间 | 系统态时间 | CPU利用率 | 总耗时 | 构建状态 |
|---------|-----------|-----------|----------|--------|----------|
| 第1次 | 39.14s | 6.89s | 101% | 50.744s | ✓ 49.57s |
| 第2次 | 43.50s | 6.53s | 42% | 1:57.78s | ✓ 1m 57s |
| 第3次 | 44.49s | 6.89s | 101% | 50.744s | ✓ 49.57s |
| **平均值** | **42.38s** | **6.77s** | **81.3%** | **73.09s** | **72.05s** |


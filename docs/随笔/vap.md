# VAP 源码阅读

为什么会去阅读 vap 源码？因为在使用的过程中，发现有一个很奇怪的bug，当svga资源文件为25帧时，会出现无法播放视频只有音频的情况。尽管通过设置accurate为true启用精准模式，可以解决这个问题，但还是比较好奇，所以需要去阅读源码，了解其背后的原理。

## Vap 简介

Vap 是腾讯企鹅电竞开发的视频动画播放解决方案，目前已不维护。

[插件地址](https://github.com/Tencent/vap/tree/master)
[web 地址](https://github.com/Tencent/vap/tree/master/web)

### 使用

**安装**
```bash
npm i video-animation-player
```

**创建实例**
```ts
import Vap from 'video-animation-player'
// init
let vap = new Vap(options)
```

**实例方法**

```ts
// 实例方法
1、on(): 绑定h5 video事件或者自定义事件(frame： 接收当前帧和播放时间戳)  如on('playing', function() { // do some thing })
2、destroy()：销毁实例，清除video、canvas等
3、pause()：暂停播放
4、play()：继续播放
5、setTime(s)：设置播放时间点(单位秒)
```

### 实现原理

Vap的核心是基于mp4视频实现透明背景，H264解码出来的是YUV数据，转换为RGB后是不带Alpha通道的。通过在视频中额外开发一块区域，RGB区域存储原始的彩色图像数据，而Alpha区域存储透明度数据，最后利用OpenGL将这些数据合成为带透明通道的ARGB图像。

## 开发流程

我们直接 git clone 下来，h5 的逻辑都在 `vap/web` 目录下。其中src目录是源码，dist目录是构建后的库文件，demo目录是演示项目。

**目录结构**

```text
vap/web/
├── src/                 # 源码目录（您修改这里）
│   ├── video.ts        # 视频基础控制
│   ├── webgl-render-vap.ts  # WebGL渲染
│   └── ...
├── dist/               # 构建输出目录
│   └── vap.js         # 编译后的库文件
└── demo/              # 演示项目
    └── src/components/HelloWorld.vue  # 引用 ../../../dist/vap.js
```

通过目录结构可知，该项目由rollup构建，rollup 会监听src目录下的文件变化，如果发生变化，会自动重新构建，生成新的dist/vap.js。为了调试，我们需要开启两个服务，在 `vap/web` 目录下执行 `npm run dev` 开启rollup监听，然后在 `vap/web/demo` 目录下执行 `npm run dev` 开启demo服务。

**开发流程**

![流程图](/public/assets/vap_1.png)

## 源码文件

将项目跑起来后，我们就可以开始阅读源码了。目录结构如下：

```text
├── src/                      # 源码目录
│   ├── index.ts              # 入口文件
│   ├── type.ts               # 类型定义
│   ├── video.ts              # 视频基础
│   ├── webgl-render-vap.ts   # WebGL渲染
│   ├── vap-frame-parser.ts   # 配置解析
│   ├── gl-utils.ts           # WebGL工具
```

**架构图**

![架构图](/public/assets/vap_2.png)

### index.ts

index.ts是VAP库的统一入口点，用工厂模式创建播放器实例，检测WebGL支持。

```ts
export default function (options?: VapConfig) {
  if (canWebGL()) {
    return new WebglRenderVap(options);
  } else {
    throw new Error('your browser not support webgl');
  }
}
```

### type.ts

type.ts定义了VAP库的类型，包括播放器配置，这里不展开。

```ts
export interface VapConfig {
  container: HTMLElement;      // DOM容器（必需）
  src: string;                // 视频文件URL（必需）
  config: string | object;    // 配置文件URL或JSON对象（必需）
  fps?: number;               // 帧率控制
  width?: number;             // 画布宽度
  height?: number;            // 画布高度
  loop: boolean;              // 是否循环播放
  mute?: boolean;             // 是否静音
  precache?: boolean;         // 是否预缓存
  accurate: boolean;          // 是否使用精确帧同步
  onLoadError?: Function;     // 加载错误回调
  onDestroy?: Function;       // 销毁回调
  [key: string]: any;         // 扩展属性
}
```

### video.ts

video.ts是视频基础控制层，主要功能是 HTML5 Video 的封装和管理，跨浏览器兼容性处理，帧同步机制实现以及播放声明周期控制。

这个文件是这次源码阅读的重点，所以放后面详细分析。

### webgl-render-vap.ts

webgl-render-vap.ts继承自video.ts的VapVideo实例，实现WebGL渲染，VAP透明度渲染核心逻辑就在这个文件中。

### vap-frame-parser.ts

vap-frame-parser.ts是VAP配置解析器，负责解析VAP配置文件，生成VAP帧数据。解析配置中的src数组（融合资源定义），根据srcType分别处理文字(txt)和图片(img)，使用Canvas绘制文字并转换为ImageData，异步加载网络图片，建立textureMap映射，供WebGL渲染使用。

### gl-utils.ts

gl-utils.ts是WebGL工具类，封装了WebGL的常用操作，如创建纹理，创建着色器程序，创建帧缓冲区等。

```ts
// 着色器创建
export function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

// 程序创建和链接
export function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.useProgram(program);
  return program;
}

// 纹理创建
export function createTexture(gl, index, imgData?) {
  const texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + index);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  // 设置纹理参数：最近邻过滤，边缘夹紧
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return texture;
}
```

**协作关系**

![架构图](/public/assets/vap_3.png)

**列表关系**

| 文件 | 主要职责 | 关键功能 | 依赖关系 |
|------|----------|----------|----------|
| index.ts | 入口门面 | WebGL检测、实例创建 | → webgl-render-vap |
| type.ts | 类型定义 | TypeScript接口定义 | 被所有文件引用 |
| video.ts | 视频基础层 | 视频播放控制、事件管理、帧同步 | → type.ts |
| webgl-render-vap.ts | 渲染引擎 | WebGL渲染、着色器管理、透明度合成 | → video.ts, vap-frame-parser, gl-util |
| vap-frame-parser.ts | 配置解析器 | 配置解析、融合资源管理、文字渲染 | → type.ts |
| gl-util.ts | WebGL工具库 | 着色器、程序、纹理创建和管理 | 被webgl-render-vap使用 |

## video.ts

因为 video.ts 是这次排查文件的重点，所以着重分析这个文件。

### 1. 配置初始化

setOptions 方法负责初始化，这里的options也就是我们传入的配置。

相对比较简单，做了一些边界处理，控制台输出报错信息。这里有三个必传参数，分别是视频地址，配置文件地址，dom容器。

```ts
setOptions(options: VapConfig) {
    if (!options.container || !options.src) {
      console.warn('[Alpha video]: options container and src cannot be empty!');
    }
    this.options = Object.assign(
      {
        // 视频url
        src: '',
        // 循环播放
        loop: false,
        fps: 20,
        // 容器
        container: null,
        // 是否预加载视频资源
        precache: false,
        // 是否静音播放
        mute: false,
        config: '',
        accurate: false,
        // 帧偏移, 一般没用, 预留支持问题素材
        offset: 0,
      },
      options
    );
    this.setBegin = true;
    this.useFrameCallback = false;
    this.container = this.options.container;
    if (!this.options.src || !this.options.config || !this.options.container) {
      console.error('参数出错：src(视频地址)、config(配置文件地址)、container(dom容器)');
    }
    return this;
  }
```

### 2. 视频预缓存

precacheSource 方法负责预缓存视频资源，如果配置了precache为true，则会在视频加载完成后，预缓存视频资源。

这里会调用一个异步方法，使用XHR下载视频文件为blob对象，然后使用URL.createObjectURL创建一个blob url供video元素使用。需要注意的是，这里针对IOS设备做了特殊处理，需要转换为DataURL再转回Blob，解决IOS播放限制问题。

> 目前不知道出于何种原因，猜测如下：
> 1. 用户手势要求，视频需要用户手势触发播放，所以需要预缓存。
> 2. Blob URL差异性
> 3. 同源策略严格，对跨域资源限制

```ts
precacheSource(source): Promise<string> {
  const URL = (window as any).webkitURL || window.URL;
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', source, true);
    xhr.responseType = 'blob';
    xhr.onload = function () {
      if (xhr.status === 200 || xhr.status === 304) {
        const res = xhr.response;
        if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
          const fileReader = new FileReader();

          fileReader.onloadend = function () {
            const resultStr = fileReader.result as string;
            const raw = atob(resultStr.slice(resultStr.indexOf(',') + 1));
            const buf = Array(raw.length);
            for (let d = 0; d < raw.length; d++) {
              buf[d] = raw.charCodeAt(d);
            }
            const arr = new Uint8Array(buf);
            const blob = new Blob([arr], { type: 'video/mp4' });
            resolve(URL.createObjectURL(blob));
          };
          fileReader.readAsDataURL(xhr.response);
        } else {
          resolve(URL.createObjectURL(res));
        }
      } else {
        reject(new Error('http response invalid' + xhr.status));
      }
    };
    xhr.send();
  });
}
```

### 3. 视频初始化

initVideo 方法负责初始化视频元素，创建video元素，设置视频播放参数。

通过设置 crossorigin 属性，解决跨域问题，如果配置项有设置缓存的话，就调用上面提到的`precacheSource`方法预缓存视频资源。

这里判断当前浏览器是否支持 `requestVideoFrameCallback`，如果支持并且配置项的 accurate 为 true，则使用 `requestVideoFrameCallback` 方法，否则使用 `requestAnimationFrame` 方法。这样确保动画和视频播放的帧率一致。

最后绑定了视频事件。

```ts
initVideo() {
  const options = this.options;
  // 创建video
  let video = this.video;
  if (!video) {
    video = this.video = document.createElement('video');
  }
  // 支持跨域
  video.crossOrigin = 'anonymous';
  // 无法使用 autoplay="false" 来关闭视频的自动播放功能；只要 <video> 标签中有这个属性，视频就会自动播放
  video.autoplay = false;
  // 下载整个视频文件 autoplay优先级比preload高
  video.preload = 'auto';
  // 内嵌播放
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  // 配置项中是否静音
  if (options.mute) {
    // 静音
    video.muted = true;
    // 设置音量为0
    video.volume = 0;
  }
  // 隐藏视频元素
  video.style.display = 'none';
  video.loop = !!options.loop;
  if (options.precache) {
    this.precacheSource(options.src)
      .then((blob) => {
        console.log('sample precached.');
        video.src = blob;
        document.body.appendChild(video);
      })
      .catch((e) => {
        console.error(e);
      });
  } else {
    video.src = options.src;
    // 这里要插在body上，避免container移动带来无法播放的问题
    document.body.appendChild(this.video);
    video.load();
  }

  this.firstPlaying = true;
  // this.useFrameCallback 是一个布尔值标志，用于控制是否使用 requestVideoFrameCallback API
  // 当浏览器支持 requestVideoFrameCallback 且用户配置了 accurate 选项时，启用精确的视频帧同步
  // 这样可以确保动画与视频帧完美对齐，而不是依赖 requestAnimationFrame 的近似同步
  if ('requestVideoFrameCallback' in this.video) {
    this.useFrameCallback = !!this.options.accurate;
  }
  // 取消之前的动画请求
  this.cancelRequestAnimation();

  // 绑定事件
  this.offAll();
  ['playing', 'error', 'canplay'].forEach((item) => {
    this.on(item, this['on' + item].bind(this));
  });
}
```

### 4. 帧同步机制

`drawFrame` 和 `requestAnimFunc` 方法负责帧同步机制，确保动画和视频播放的帧率一致。

`drawFrame` 根据 `useFrameCallback`字段判断是否使用 `requestVideoFrameCallback` 方法，否则使用 `requestAnim` 方法。

`requestAnim`即`requestAnimFunc`方法，是一种降级方案，当浏览器不支持 `requestVideoFrameCallback` 时，使用 `requestAnimationFrame` 方法。因为显示屏默认帧数fps为60，所以`index % (60/fps) == 0`按比例跳帧。例如fps为20时，每3帧渲染一次。
> 这里60是重点，画起来

`setTimeout`是兜底方案，当浏览器都不支持以上两种方案时采用，最低兼容性保证，按 1000/fps 毫秒渲染一次。

![帧同步机制](/public/assets/vap_4.png)

### 5. 事件系统

这一部分就是通过on/once绑定事件，然后通过事件触发回调。

### 6. 完整流程

![完整流程](/public/assets/vap_5.png)

## 总结

至此，我们完成了 video.ts 的源码阅读。在这过程中，其实我们也发现了为什么25帧fps无法播放，因为`60 / fps = 60 / 25 = 2.4`永远不会等于0，导致程序错误，没有调用play()。

我们可以通过这样来修改源码，解决这个问题。

```ts
// 原代码
if (!(index % (60 / fps))) {
  return cb();
}
// 修改后
const frameInterval = Math.max(1, Math.round(60 / fps));
if (index % frameInterval === 0) {
  return cb();
}
```
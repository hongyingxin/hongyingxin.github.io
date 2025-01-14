# Vap视频播放组件封装

### 背景
目前，语聊行业中，播放礼物特效除了svga格式，也有mp4格式的视频，所以需要一个通用的视频播放组件。VAP（Video Animation Player）是企鹅电竞开发，用于播放酷炫动画的实现方案。本文将介绍基于Vap插件的Vue组件封装。

### MP4播放插件
VAP（Video Animation Player）是企鹅电竞开发，用于播放酷炫动画的实现方案。
- [Github 地址](https://github.com/Tencent/vap/tree/master)

### 一、使用

#### 1. 安装
```bash
npm i video-animation-player
```

#### 2. 创建实例
```javascript
import Vap from 'video-animation-player'
// init
let vap = new Vap(options)
```

#### 3. 实例方法
```javascript
// 实例方法
1. on(): 绑定h5 video事件或者自定义事件(frame： 接收当前帧和播放时间戳)  如on('playering', function() {// do some thing})
2. destroy(): 销毁实例，清除video、canvas等
3. pause(): 暂停播放
4. play(): 继续播放
5. setTime(s): 设置播放时间点(单位秒)
```

#### 4. 实例参数

| 参数名      | 类型          | 必填 | 默认值 | 说明                                                                 |
|-------------|---------------|------|--------|----------------------------------------------------------------------|
| container   | HTMLElement   | 是   | null   | DOM容器                                                              |
| src         | string        | 是   | ''     | mp4视频地址                                                          |
| config      | object        | 是   | ''     | 配置json对象                                                         |
| width       | number        | 否   | 375    | 宽度                                                                 |
| height      | number        | 否   | 375    | 高度                                                                 |
| fps         | number        | 否   | 20     | 动画帧数（生成素材时在工具中填写的fps值）                            |
| mute        | boolean       | 否   | false  | 是否对视频静音                                                       |
| loop        | boolean       | 否   | false  | 是否循环播放                                                         |
| type        | string/number | 否   | undefined | 组件基于type字段做了实例化缓存，不同的VAP实例应该使用不同的type值（如0、1、2等） |
| beginPoint  | number        | 否   | 0      | 起始播放时间点(单位秒),在一些浏览器中可能无效                        |
| fontStyle   | string        | 否   | ''     | 融合字体样式                                                         |
| accurate    | boolean       | 否   | false  | 是否启用精准模式（使用requestVideoFrameCallback提升融合效果，浏览器不兼容时自动降级） |
| precache    | boolean       | 否   | false  | 是否预加载视频资源（默认关闭，即边下边播）                           |
| onDestroy   | function      | 否   | undefined | 组件销毁时回调                                                      |
| onLoadError | function      | 否   | undefined | 加载失败回调                                                        |
| ext         | any           | 否   | ''     | 融合参数（和json配置文件中保持一致）                                 |

### 封装思路

1. 需要有一个方法调用播放，入参是对象
2. 默认是全屏播放，可以设置是否全屏，点击可以关闭
3. 需要有暂停、播放、函数回调
4. 部分mp4没有配置json对象，需要通过mp4文件生成json对象
5. 需要缓存，避免每次都请求
6. startIndex 和 maxLength 是用来限制遍历最大次数的

### 组件实现

#### 1. 组件模板
```vue
<template>
  <!-- 蒙层 -->
  <div v-if="showMask && showVap"
    class="y-vap__mask"
    @click="closeVap"
  ></div>
  <!-- vap容器 -->
  <div v-show="showVap" ref="vapRef" class="y-vap" :class="{ 'is-fullscreen': fullscreen }" :style="{ objectFit }"></div>
</template>
```

#### 2. 属性定义
```javascript
// props参数
const props = defineProps({
  /**
   * 是否只播放一次，默认：是
   */
  singlePlay: {
    type: Boolean,
    default: true,
  },
  /**
   * 是否开启全屏模式，默认：否
   */
  fullscreen: {
    type: Boolean,
    default: true,
  },
  /**
   * 是否开启蒙层，默认：否
   */
  showMask: {
    type: Boolean,
    default: true,
  },
});

// 定义事件
const emit = defineEmits<{
  (e: 'playing'): void
  (e: 'pause'): void
  (e: 'ended'): void
}>();

// 对外暴露方法
defineExpose({
  openVap,
  closeVap,
  pause,
  onPlaying,
});
```

#### 3. 方法实现
核心播放方法，主要通过调用openVap方法，传入参数，然后调用vap插件的play方法，实现视频播放。
```javascript
const openVap = async (options: OpenVapOptions) => {
  if (!vapRef.value) return;
  
  currentVapUrl.value = options.vapUrl;
  
  let json = {};
  let blob: Blob | null = null;
  // 方法二 => 使用参数传入的json
  if (options.jsonConfig) {
    if (typeof options.jsonConfig === 'string') {
      // 如果json是字符串json地址，则请求json并缓存请求结果
      [blob, json] = await getJsonInfoByFile(options.jsonConfig, options.vapUrl);
    } else {
      // 否则直接使用传入的json对象
      json = options.jsonConfig;
    }
  }
  // 方法一 => json配置信息从vap/MP4中获取
  else {
    // 从vap/MP4获取json信息
    if (common.browser.ios) {
      // 请求类型为text(该方法播放请求两遍)
      [blob, json] = await getVapJsonInfoRequestText(options.vapUrl, options.startIndex, options.maxLength);
    } else {
      // 请求类型为blob(该方法播放只请求一遍MP4,但iOS不兼容)
      [blob, json] = await getVapJsonInfo(options.vapUrl, options.startIndex, options.maxLength);
    }
  }

  objectFit.value = options.objectFit ? options.objectFit : 'cover';
  const src = blob ? await blobToUrl(blob) : options.vapUrl;

  vap.play({
    container: vapRef.value,
    src,
    loop: !props.singlePlay,
    beginPoint: 0,
    accurate: !!options.accurate,
    type: options.vapUrl,
    config: json as object,
    ...(options.extend || {}),
    onLoadError(e) {
      console.log('onLoadError:', e);
    },
    onDestroy() {
      console.log('onDestroy');
    },
  });

  vap.once('playing', onPlaying);
  vap.once('ended', onEnded);
  vap.once('pause', onPause);
};
```

#### utils工具方法
```javascript
// 从vap/MP4文件中获取json信息(带MP4文件数据blob)
const fetchJsonData = () => {}
// 从json文件中获取json信息
const getJsonInfoByFile = () => {}
// blob 转 url
const blobToUrl = () => {}
```

#### 4. 优化方案
通过对json文件的缓存，可以减少请求次数，提高播放效率。
```javascript
const jsonCache: Map<string, [Blob | null, object]> = new Map();
```


### 基本用法

#### 1. 可以直接copy该组件代码到项目中使用
#### 2. 也可以通过npm安装使用
```bash
npm install hong-vue-ui
```

引入组件

```javascript
// 全局引入
import HongUI from "hong-vue-ui";
import "hong-vue-ui/dist/style.css";

app.use(HongUI);
```

使用组件

```vue
<template>
  <y-vap 
    ref="vapRef"
    :fullscreen="fullscreen"
    :show-mask="showMask"
    @playing="onPlaying"
    @pause="onPause"
    @ended="onEnded"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'

const vapRef = ref()

const loadAnimation = async () => {
  await vapRef.value?.openVap('demo.mp4')
}
</script>
```
### 遇到问题

在优化组件的过程中，我希望能够用Map来缓存视频和json文件，避免不必要的请求。发现json文件缓存没有问题，但是视频缓存并不是一定生效。当我切换资源播放时，Network都会发起一次新的请求。排查许久也没找到原因，终于经过debugger一行行排查，将问题锁定到vap插件自身的play方法中。于是去看了video-animation-player的源码，发现vap插件在play方法中，明白了为什么缓存不总是生效。问题在于：
1. 即使我们缓存了 URL.createObjectURL() 创建的 URL，但这个 URL 仍然指向一个 Blob 对象
2. 当设置 video.src 时，浏览器仍然需要从这个 Blob URL 加载数据
3. 这就是为什么我们看到了 304 请求 - 浏览器在验证 Blob URL 是否有变化
#### play方法实现源码
```javascript
class Vap extends EventEmitter {
  play(options: PlayOptions) {
    // ... 其他初始化代码

    // 创建 video 元素
    const video = document.createElement('video')
    video.src = options.src  // 这里会触发视频加载
    video.style.objectFit = 'fill'
    video.muted = true
    // ... 其他设置

    // 加载视频
    video.load()  // 这里也会触发加载
    
    // 播放视频
    video.play()
  }
}
```
#### 解决方案
1. 缓存video元素本身
   ```javascript
   // 视频元素缓存
   const videoElementCache: Map<string, HTMLVideoElement> = new Map();
   ```
2. 直接缓存Blob数据
   ```javascript
   const videoCache: Map<string, { 
     url: string, 
     lastUsed: number,
     blob: Blob  // 添加 blob 缓存
   }> = new Map();
   ```

### 后续方向
- 将vap组件和svga组件合并，统一封装成一个特效播放组件
- 企业电竞这个项目停止维护了，后续寻找新的播放替代方案

### 参考

- [vap](https://github.com/Tencent/vap/tree/master)
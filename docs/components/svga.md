# 封装一个SVGA动画组件

## 前言

礼物特效是语聊公司常见的需求，我司在开发h5活动页面时，大量使用到SVGA动画，包括活动首页的Head动态头图，抽奖游戏的动画，榜单礼物的预览等等。因此，封装一个SVGA动画组件，可以大大提高开发效率。

## Svga是什么？

SVGA 是一种跨平台的开源动画格式，支持 Android、iOS、Web 和 Flutter 等平台。

## SVGAPlayer-Web

SVGAPlayer-Web是一个开源项目，主要由JavaScript编写，旨在为Web平台提供SVGA动画的播放功能。

- [Github 地址](https://github.com/svga/SVGAPlayer-Web/tree/master)

## 思维导图

<details>
  <summary>点击查看思维导图</summary>

  ![SVGA 思维导图](/public/assets/svga_1.png)

</details>

## 封装思路

- 向下兼容，支持原本插件的所有功能
- 组件支持动画播放控制（播放、暂停、停止）
- 提供完成的生命周期事件
- 支持全屏显示和区域显示两种业务场景

## 组件实现

### 1. 组件结构

```vue
<template>
  <!-- 蒙层 -->
  <div 
    v-if="showMask && isVisible"
    class="y-svga__mask"
    @click="handleMaskClick"
  ></div>

  <!-- SVGA 容器 -->
  <div 
    ref="container"
    class="y-svga"
    :class="{ 'is-fullscreen': fullscreen }"
    :style="{ width, height }"
    v-show="isVisible"
  ></div>
</template>
```

### 2. 属性定义

```javascript
const props = defineProps({
  /** 容器宽度 */
  width: {
    type: String,
    default: '100%'
  },
  /** 容器高度 */
  height: {
    type: String,
    default: '100%'
  },
  /** 循环次数 (0: 无限循环) */
  loops: {
    type: Number,
    default: 0
  },
  /** 是否自动播放 */
  autoPlay: {
    type: Boolean,
    default: true
  },
  /** 是否全屏显示 */
  fullscreen: {
    type: Boolean,
    default: true
  },
  /** 是否显示蒙层 */
  showMask: {
    type: Boolean,
    default: true
  }
})  
```

### 3. 对外接口

```javascript
// 对外暴露的方法
defineExpose({
  load,
  startAnimation,
  pauseAnimation,
  stopAnimation,
  clear
})

// 事件通知
const emit = defineEmits([
  'onFinished',
  'onFrame',
  'onPercentage',
  'onLoad',
  'onMaskClick'
])
```
### 4. 播放功能

``` javascript
const initPlayer = () => {
  if (!container.value) return
  
  player = new SVGA.Player(container.value)
  parser = new SVGA.Parser()
  
  player.loops = props.loops
  player.clearsAfterStop = props.clearsAfterStop
  player.fillMode = props.fillMode

  // 设置事件监听
  player.onFinished(() => {
    emit('onFinished')
    if (props.loops === 1) {
      isVisible.value = false
    }
  })
}
```

### 5. 缓存机制

```javascript
// 缓存管理
const videoCache = new Map<string, VideoItem>()
const MAX_CACHE_SIZE = 10

const manageCache = () => {
  if (videoCache.size > MAX_CACHE_SIZE) {
    const firstKey = Array.from(videoCache.keys())[0]
    if (firstKey) {
      videoCache.delete(firstKey)
    }
  }
}
```

## 基本用法

安装组件库

```bash
npm install hong-vue-ui
```
引入组件

```js
// 全局引入
import HongUI from "hong-vue-ui";
import "hong-vue-ui/dist/style.css";

app.use(HongUI);
```
使用组件

```vue
<template>
  <y-svga
    ref="svgaRef"
    width="200px"
    height="200px"
    :loops="1"
    :auto-play="true"
    :fullscreen="true"
    :show-mask="true"
    @onLoad="handleLoad"
    @onFinished="handleFinished"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'

const svgaRef = ref()

const loadAnimation = async () => {
  await svgaRef.value?.load('path/to/animation.svga')
}
</script>
```
## 总结

至此，一个简易的SVGA组件就封装完成了。主要适用于榜单礼物的预览，所以提供了load方法，只需要提供svga文件路径即可。对于抽奖场景，我则提供了fullscreen属性，可以区域显示。为了优化性能，我则提供了缓存机制，可以缓存svga文件，减少重复加载。

## 后续方向
- 支持更多配置选项，支持动态图像和文本，音频
- 因为SVGAPlayer-Web停止维护了，所以会寻找更好的播放替代方案
- 因为特效播放不止SVGA一种，后面会增加mp4播放方式，并且整合到一起

参考

- [SVGAPlayer-Web](https://github.com/svga/SVGAPlayer-Web/tree/master)


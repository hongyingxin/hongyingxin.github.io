# 微前端

## 1. 什么是微前端

微前端这个概念借鉴了微服务的架构理念，核心是将一个大的前端应用拆分成多个小应用，每个小应用独立运行，互不干扰。目前在前端开发中，更多是用来解决技术债，将原本运行已久的项目跟新项目融合成一个应用。

## 2. micro-app

micro-app是由京东推出的一款微前端框架，其核心借鉴WebComponents的思想，通过**js沙箱**、**样式隔离**、**元素隔离**、**路由隔离**模拟实现了**ShadowDom**的隔离特性，并结合**CustomElements**将微前端封装成一个类**WebComponent**组件，从而实现微前端的组件化渲染。

后续需要深入学习原理的几个核心点：

- js沙箱
  - with沙箱（默认模式）
  - iframe沙箱
- 样式隔离
- 元素隔离
- 路由隔离
- shadowDom
- customElements
- WebComponents

## 3. 快速开始

在 `micro-app-demo/` 目录下准备好了两个应用：一个 主应用 (main-app) 和一个 子应用 (sub-app)，它们均使用 Vue 3 + Vite 构建。

项目结构

- main-app (基座): 运行在 http://localhost:3000，负责加载子应用。

- sub-app (子应用): 运行在 http://localhost:3001，被嵌入到主应用中。


### 核心配置文件

**安装依赖**

```bash
npm i @micro-zoe/micro-app --save
```

#### 1. 主应用初始化

在主应用中引入并启动`micro-app`

```js
// main-app/src/main.ts
import { createApp } from "vue"
import App from "./App.vue"
import microApp from "@micro-zoe/micro-app"

// 启动 micro-app
microApp.start()

createApp(App).mount("#app")
```

#### 2. 在主应用中引入子应用

micro-app通过自定义元素`<micro-app>`加载子应用，使用方式像`iframe`一样简洁

```vue
<!-- main-app/src/App.vue -->
<template>
  <div style="padding: 20px; border: 5px solid #ccc;">
    <h1>这是主应用 (Main App)</h1>
    <p>正在加载子应用：</p>
    <!-- 使用 iframe 模式以更好地兼容 Vite 的 ESM 模块系统 -->
    <micro-app 
      name="sub-app" 
      url="http://localhost:3001/" 
      iframe
    ></micro-app>
  </div>
</template>
```

> name：必传参数，必须以字母开头 url：必传参数，必须指向子应用的index.html

#### 3. 子应用CORS配置

micro-app从主应用通过fetch加载子应用的静态资源，由于主应用与子应用的域名不一定相同，所以子应用需要支持跨域。

```js
import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3001,
    cors: true, // 开启跨域
    headers: {
      "Access-Control-Allow-Origin": "*",
    }
  }
})
```

## 4. 数据通信

### 子应用获取来自主应用的数据

目前有两种方式获取来自主应用的数据

**方式1:直接获取数据**

```js
const data = window.microApp.getData() // 返回主应用下发的data数据
```

**方式2:绑定监听函数**
```js
/*
 * dataListener: 绑定函数
 * autoTrigger: 在初次绑定监听函数时如果有缓存数据，是否需要主动触发一次，默认为false
*/
window.microApp.addDataListener(dataListener: (data: Object) => any, autoTrigger?: boolean)
```

### 子应用向主应用发送数据

```js
// dispatch只接受对象作为参数
window.microApp.dispatch({type: '子应用发送给主应用的数据'})
```

`dispatch`接受对象作为参数，数据会缓存下来，并且它是异步执行的，多个操作会在下一帧合并为一次执行。

`forceDispatch`方法可以强制发送

### 主应用向子应用发送数据

主应用向子应用发送数据有两种方式

**方式1:直接发送数据**

```vue
<template>
  <micro-app
    name='my-app'
    url='xx'
    :data='dataForChild' // data只接受对象类型，数据变化时会重新发送
  />
</template>

<script>
export default {
  data () {
    return {
      dataForChild: {type: '发送给子应用的数据'}
    }
  }
}
</script>
```

**方式2:手动发送数据**

手动发送数据需要通过`name`指定接受数据的子应用，此值和`<micro-app>`的`name`属性一致。

```js
import microApp from '@micro-zoe/micro-app'

// 发送数据给子应用 my-app，setData第二个参数只接受对象类型
microApp.setData('my-app', {type: '新的数据'})

```

### 主应用获取子应用的数据

**方式1:直接获取数据**
```js
import microApp from '@micro-zoe/micro-app'

const childData = microApp.getData(appName) // 返回子应用的data数据

```

**方式2:监听自定义事件**

### 具体例子

```vue
<!-- main-app/src/App.vue -->
<template>
  <div style="padding: 20px; border: 5px solid #ccc;">
    <h1>这是主应用 (Main App)</h1>
    <div style="margin-bottom: 20px;">
      <p>主应用数据：<strong>{{ mainMessage }}</strong></p>
      <button @click="sendToSub">向子应用发送消息</button>
      <p v-if="fromSub">来自子应用的回传：<span style="color: blue;">{{ fromSub }}</span></p>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"

const mainMessage = ref("Hello from Main!")
const subAppData = ref({ msg: mainMessage.value })
const fromSub = ref("")

const sendToSub = () => {
  const newMsg = `Main updated at ${new Date().toLocaleTimeString()}`
  mainMessage.value = newMsg
  subAppData.value = { msg: newMsg }
}

const handleDataFromSub = (e) => {
  console.log("主应用收到子应用数据:", e.detail.data)
  fromSub.value = e.detail.data.reply
}
</script>
```

```vue
<!-- sub-app/src/App.vue -->
<template>
  <p>我是嵌入在主应用中的 Vue 3 应用。</p>
  <div style="background-color: #eee; padding: 10px; margin: 10px 0;">
    <p>收到主应用的数据：<strong style="color: green;">{{ mainMsg }}</strong></p>
    <button @click="sendToMain">回传消息给主应用</button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue"

const count = ref(0)
const mainMsg = ref("暂无")

// 定义数据监听回调
const handleDataChange = (data) => {
  console.log("子应用收到主应用数据:", data)
  if (data.msg) {
    mainMsg.value = data.msg
  }
}

const sendToMain = () => {
  // 使用 window.microApp.dispatch 向主应用发送数据
  if (window.microApp) {
    window.microApp.dispatch({ reply: `Sub App replied at ${new Date().toLocaleTimeString()}` })
  }
}

onMounted(() => {
  // 绑定监听
  if (window.microApp) {
    // 监听主应用下发的数据
    window.microApp.addDataListener(handleDataChange, true) // 第二个参数为 true 表示立即执行一次
  }
})

onUnmounted(() => {
  // 解绑监听
  if (window.microApp) {
    window.microApp.removeDataListener(handleDataChange)
  }
})
</script>
```

- 主应用 -> 子应用:

  - 在主应用界面点击 “向子应用发送消息” 按钮。
  - 你会发现子应用内部的绿色文字会实时更新。
  - 原理: 主应用通过 `<micro-app>` 标签的 `:data` 属性下发数据。

- 子应用 -> 主应用:

  - 在子应用内部点击 “回传消息给主应用” 按钮。
  - 主应用会捕获到该事件并在页面上方显示蓝色文字。
  - 原理: 子应用通过 `window.microApp.dispatch` 发送数据，主应用通过 `@datachange` 监听。

## 5. 路由系用

通过拦截浏览器路由事件以及自定义的location、history，实现了一套虚拟路由系统。

## 6. 样式隔离

MicroApp的样式隔离是默认开启的，开启后会以`<micro-app>`标签作为样式作用域，利用标签的name属性为每个样式添加前缀，将子应用的样式影响禁锢在当前标签区域。

```css
.test {
  color: red;
}

/* 转换为 */
/* xxx为子应用的name */
micro-app[name=xxx] .test {
  color: red;
}
```

## 7. 资源共享

在微前端的结构中，公共依赖共享是一个非常重要的优化点。如果不做处理，主应用加载一次Vue，每个子应用又歌词加载一次Vue，会导致资源浪费。

在`micro-app`中，有两种共享方式：

**方式一 globalAssets**

globalAssets用于设置全局共享资源，它和预加载的思路相同，在浏览器空闲时加载资源并放入缓存。

当子应用加载相同地址的js或css资源时，会直接从缓存中提取数据，从而提升渲染速度。

```js
// ... 现有导入
import microApp from "@micro-zoe/micro-app"

// 1. 定义主应用的全局公共工具
window.commonUtils = {
  sayHello: (name) => `Hello ${name}, this is from Main App!`,
  version: '1.0.0'
}

// 2. 启动时可以配置全局资源（JS/CSS），避免重复下载
microApp.start({
  globalAssets: {
    js: [], // 这里可以放公共库的 CDN 地址，如 ['https://lib.baomitu.com/axios/1.2.1/axios.min.js']
    css: []
  }
})
```
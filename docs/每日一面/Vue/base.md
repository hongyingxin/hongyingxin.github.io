# Vue

## 一、基础题

### 1. computed 和 watch 的区别
`computed` 是计算属性，依赖其他属性计算值，并且 `computed` 的值有缓存，只有当计算值变化才会返回内容。（原理：依赖收集、缓存机制、懒计算、自动更新）；

`watch` 监听到值的变化就会执行回调，在回调中可以进行一些逻辑操作。

### 2. v-show 和 v-if 的区别
`v-show` 只是在 `display:none` 和 `display:block` 之间切换。无论初始条件是什么都会渲染出来，后面只需要切换CSS。`v-show` 在初始渲染时有更高的开销，但是切换开销很小，更适合于频繁切换的场景。

`v-if` 当属性初始为 `false` 时，组件就不会被渲染，直到条件为 `true`，并且切换条件时会触发销毁和挂载组件。`v-if` 在切换时开销更高，更适合不经常切换的场景，并且基于 `v-if` 的这种惰性渲染机制，可以在必要的时候才去渲染组件，减少整个页面的初始渲染开销。

### 3. v-for 和 v-if 的优先级
vue2中，`v-for`的优先级是高于`v-if`，渲染函数会先执行循环再判断条件，vue3完全相反，`v-if`的优先级高于`v-for`。

文档明确指出不推荐同时使用`v-if`和`v-for`，因为这样两者的优先级不明显。

可以使用计算属性或者将`v-if`移动到上一级元素或者使用`template`标签包裹。

### 4. v-for 为什么需要 key
Vue 默认按照"就地更新"的策略来更新通过`v-for`渲染的元素列表。当数据项的顺序改变时，Vue 不会随之移动 DOM 元素的顺序，而是就地更新每个元素，确保它们在原本指定的索引位置上渲染。

key 的特殊属性主要用在 Vue 的虚拟 DOM 算法，在新旧`nodes`对比时辨识`VNodes`。使用 key 时，它会基于 key 的变化重新排列元素顺序，并且会移除 key 不存在的元素。

不使用`index`，因为当数组删除后，数组的下标一定发生变化

### 5.NextTick是什么
官方对其的定义

> 在下次 DOM 更新循环结束之后执行延迟回调。在修改数据之后立即使用这个方法，获取更新后的 DOM

我们可以理解成，`Vue` 在更新 `DOM` 时是异步执行的。当数据发生变化，`Vue`将开启一个异步更新队列，视图需要等队列中所有数据变化完成之后，再统一进行更新。

原理：`Vue`在更新`DOM`时是异步执行的。只要侦听到数据变化，`Vue` 将开启一个队列，并缓冲在同一事件循环中发生的所有数据变更。如果同一个`watcher` 被多次触发，只会被推入到队列中一次。然后，在下一个的事件循环"tick"中，`Vue` 刷新队列并执行实际 (已去重的) 工作。`Vue` 在内部对异步队列尝试使用原生的 `Promise.then`、`MutationObserver` 和 `setImmediate`，如果执行环境不支持，则会采用 `setTimeout(fn, 0)` 代替。（微任务）

### 6. watch 和 watchEffect 的区别
`watch`和`watchEffect`都是监听器，它们之间的主要区别是追踪响应式依赖的方式。

`watch`只监听指明的数据源，不会监听回调中的数据，需要数据源改变后才会执行。

`watchEffect`自动监听数据源作为依赖，运行后立即执行。

侦听器的几个属性：
- `immediate`：创建时立即触发回调
- `deep`：强制深度遍历
- `flush`：回调函数的刷新时机
- `once`：一次性侦听器

## 二、生命周期

Vue生命周期总共可以分为8个阶段：创建前后, 载入前后,更新前后,销毁前销毁后，以及一些特殊场景的生命周期。

因为`setup`是围绕`beforeCreate`和`created`生命周期运行，所有没有这两个周期。其它都可以编写在`setup`内，要前面加上"on"前缀。

| 选项式生命周期 | 组合式生命周期 | 描述 | 使用场景 |
| :-- | :-- | :-- | :-- |
| beforeCreate |  | 组件实例被创建之初 | 执行时组件实例还未创建，通常用于插件开发中执行一些初始化任务 |
| created |  | 组件实例已经完全创建 | 组件初始化完毕，各种数据可以使用，常用于异步数据获取 |
| beforeMount | onBeforeMount | 组件挂载之前 | 未执行渲染、更新，dom未创建 |
| mounted | onMounted | 组件挂载到实例上去之后 | 初始化结束，dom已创建，可用于获取访问数据和dom元素 |
| beforeUpdate | onBeforeUpdate | 组件数据发生变化，更新之前 | 更新前，可用于获取更新前各种状态 |
| updated | onUpdated | 组件数据更新之后 | 更新后，所有状态已是最新 |
| beforeDestroy | onBeforeUnmount | 组件实例销毁之前 | 销毁前，可用于一些定时器或订阅的取消 |
| destroyed | onUnmounted | 组件实例销毁之后 | 组件已销毁，作用同上 |
| activated | onActivated | keep-alive 缓存的组件激活时 |
| deactivated | onDeactivated | keep-alive 缓存的组件停用时调用 |

### 1. 各个生命周期的内容

- **beforeCreate**: 在组件实例初始化完成之后立即调用，此时获取不到`props`和`data`数据。
- **created**: 在组件实例处理完所有与状态相关的选项后调用，`data`、`computed`、`methods`、`watch`等属性可以调用。
- **beforeMount**: 在组件被挂载之前调用，还没有创建DOM（这个钩子在服务端渲染时不会被调用）。
- **mounted**: 在组件被挂载之后调用，DOM渲染完毕。
- **beforeUpdate**: 在组件更新之前调用。
- **updated**: 在组件更新之后调用。
- **beforeUnmount**: 在组件被卸载之前调用。
- **unmounted**: 在组件卸载之后调用。

### 2. 父子组件生命周期

#### 加载渲染过程
**父** `beforeCreate` -> **父** `created` -> **父** `beforeMount` -> **子** `beforeCreate` -> **子** `created` -> **子** `beforeMount` -> **子** `mounted` -> **父** `mounted`

#### 子组件更新过程
**父** `beforeUpdate` -> **子** `beforeUpdate` -> **子** `updated` -> **父** `updated`

#### 父组件更新过程
**父** `beforeUpdate` -> **父** `updated`

#### 销毁过程
**父** `beforeDestroy` -> **子** `beforeDestroy` -> **子** `destroyed` -> **父** `destroyed`

### 3. 数据请求在created和mounted的区别

`created`是在组件实例一旦创建完成的时候立刻调用，这时候页面`dom`节点并未生成；

`mounted`是在页面`dom`节点渲染完毕之后就立刻执行的。触发时机上`created`是比`mounted`要更早的，两者的相同点：都能拿到实例对象的属性和方法。

讨论这个问题本质就是触发的时机，放在`mounted`中的请求有可能导致页面闪动（因为此时页面`dom`结构已经生成），但如果在页面加载前完成请求，则不会出现此情况。建议对页面内容的改动放在`created`生命周期当中。

## 三、组件通信

### 1.组件间通信的分类可以分成以下

- **父子组件**：`props`、`emit`、`ref`
- **兄弟组件**：`vuex`、`pinia`、`eventBus`（Vue3 删除了事件总线，可以用 `mitt` 第三方库）
- **跨层组件**：`provide/inject` 依赖注入

### 2.常见的通信方式

- **Props / $emit**  
  最常用的父子组件通信方式，分别用于从父组件向子组件传递数据和从子组件向父组件触发事件。

- **$parent / $children**  
  Vue 实例提供的两个属性，用于在组件内部访问其父组件和子组件。Vue3 中无法访问 `$children`，需要使用 `refs`。

- **provide / inject**  
  在一个祖先组件中提供数据，然后在后代组件中注入并使用这些数据。2.2.0 新增跨级组件通信。

- **$attrs / $listeners**  
Vue 中用于处理组件属性和事件的特殊属性，主要用于在具有嵌套关系的组件中传递属性和事件。  2.4.0 新增。

- **$emit / $on**  
  中央事件总线 `eventBus`。一种 Vue 中用于实现组件通信的事件总线模式。vue3.0 废除。

- **Vuex 和 Pinia**  
  Vue 的官方状态管理库，用于管理应用程序的状态。

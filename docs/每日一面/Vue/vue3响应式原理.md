# Vue3响应式原理

## Vue3和Vue2的响应式原理有什么差别？

从设计目标上看，Vue2和Vue3的响应式系统都在解决同一个问题：在不显式声明依赖的情况下，建立数据与视图之间的自动更新关系。区别不在于“是否响应式”，而在于依赖的收集方式、更新触发的时机以及系统的可扩展性。

在Vue2中，响应式的核心建立在Object.defineProperty之上。每一个被观测的对象属性，都会被单独劫持其getter和setter。当组件渲染时，getter会触发依赖收集，将当前的渲染watcher记录到该属性的依赖列表中；当属性被修改时，setter触发依赖通知，相关watcher重新执行。这个模型是“以属性为中心”的：每个属性维护自己的依赖集合。它的优势是实现直观、行为稳定，但代价也很明显————必须在初始化阶段递归遍历对象，无法感知属性的新增和删除，对数组的支持需要通过方法重写来间接实现。

Vue3则彻底重构了这一套机制，响应式的基础从“属性劫持”转向了“对象代理”。通过Proxy拦截对象的读写、枚举和结构性操作，Vue3可以在运行时动态感知属性的访问和变化，而不需要在初始化阶段预先处理所有字段。依赖收集不再绑定在某个具体的getter上，而是通过一个全局的依赖追踪机制，将“当前正值执行的副作用函数”与“被访问的目标对象 + key”建立映射关系。这种设计让响应式系统从“属性驱动”升级为“访问驱动”，在能力上覆盖了新增、删除属性、Map / Set 等复杂数据结构。

在更新模型上，两者也存在本质差异。Vue2的watcher是以组件为主的，计算属性、监听器和渲染watcher在语义上是不同类型，但底层机制相对分散。Vue3将这些概念统一为effect，通过调度器控制执行时机，使响应式系统更具可组合性。这种统一模型也是Composition API得以成立的提前。

从性能和可维护性角度看，Vue2的响应式成本主要体现在初始化阶段和深层对象遍历上，而Vue3将成本更多地推迟到“真正发生访问和修改时”。同时，Proxy的存在让代码路径更加集中，减少了针对数据和特殊场景的补丁式实现。但相应地，Vue3也放弃了对IE等不支持Proxy环境的兼容。

总结来看，Vue2的响应式是“静态劫持 + 属性级依赖”，而Vue3的响应式时“动态代理 + 访问级依赖”。前者在早期浏览器环境下时工程最优解，后者则为复杂状态管理和更强的表达能力打开了空间。

## Vue3的响应式原理

闭环逻辑：核心机制 -> 依赖收集 -> 派发更新

1. 核心底层：Proxy 代理

“Vue3 响应式的核心是 ES6 的 Proxy。它不再像 Vue2 那样去修改原始对象的属性，而是为目标对象创建一个代理层。通过这个代理层，我们可以拦截对象几乎所有的操作，包括读取、设置、删除，甚至是遍历。这就从根源上解决了 Vue2 无法监听新增属性和数组下标的问题。”

2. 依赖收集：三级数据结构（核心加分点）

“在底层，Vue3 维护了一套非常精巧的依赖管理系统。它用了一个全局的 WeakMap，我们通常叫它 targetMap：

- 第一层 (WeakMap)：键是‘原始对象’，值是一个 Map。

- 第二层 (Map)：键是‘具体的属性名’（key），值是一个 Set。

- 第三层 (Set)：存储的是所有依赖这个属性的‘副作用函数’（Effect）。

这种结构保证了依赖关系的精准对应，而且由于使用了 WeakMap，当原始对象被销毁时，整个依赖链条也会被自动垃圾回收。”

3. 运行流程：Effect Track Trigger

“整个响应式过程可以拆解为三步：

- effect(副作用)：watch、computed、对象的访问，Vue内部都把这个当成一个effect。当我们读取/访问一个响应式属性时，执行effect时会将其设为全局activeEffect

- Track（追踪）：此时Proxy的get拦截器被触发，会调用track进行依赖收集。它通过activeEffect获取当前正在运行的副作用函数，并将其存入targetMap对应的set合集中

- Trigger（触发）：当我们修改属性时，Proxy的set拦截器被触发，会调用trigger进行派发更新。它从targetMap中找到该属性对应的所有effect，并将其加入调度队列异步执行，而从完成视图更新或数据同步

## vue3和vue2响应式原理对比

### 第一版

1. 最根本的区别在于底层 API 的重构。Vue2 使用的是ES5的`Object.defineProperty`，通过遍历递归给对象添加`getter`和`setter`；Vue3 使用的是ES6的`Proxy`实现了对象整体的代理拦截。（底层逻辑）

2. Vue2 无法监听到对象属性的新增或删除，必须使用`vue.set`，Vue3 的 `Proxy`拦截的是整个对象（动态属性）；Vue2 无法拦截数组索引的修改和长度变化，只能重写数组方法，Vue3 则原生支持数组操作和`Map/Set`等集合类型（数组支持）。

3. Vue2 为每个属性都绑定一个`Dep`实例，Vue3 改用全局统一的`WeakMap`管理依赖关系（内存开销）；Vue2 在初始化需要递归遍历整个`Data`树，Vue3 是惰性劫持，只有访问到深层属性才会转换为响应式（性能开销）。

### 第二版

对于 Vue2 和 Vue3 的响应式对比，我主要从三个层面来理解：

首先是底层机制：Vue2 依赖 Object.defineProperty，它是通过递归遍历属性来劫持 getter/setter。而 Vue3 彻底重构，采用 ES6 的 Proxy。Proxy 的强大之处在于它拦截的是对象整体，而不是某个具体属性，这让它在处理动态性上有了质的飞跃。

其次是解决的开发痛点：在 Vue2 中，由于 API 限制，我们无法监听到对象属性的新增、删除，以及数组索引的直接修改，往往需要 $set 这种补丁方案。而 Vue3 完美的解决了这些问题，并且原生支持了 Map、Set 等现代集合类型。

最后是性能与架构的优化：Vue2 会在初始化时进行全量递归，数据量大时会有明显的阻塞。Vue3 则是按需劫持，只有当访问到深层对象时才会将其转化为响应式。同时，Vue3 抛弃了给每个属性绑定 Dep 的做法，改用全局统一的 WeakMap 来管理依赖链条，这不仅让内存开销更小，也使得依赖追踪逻辑更加扁平高效。

## 依赖收集的原理

依赖收集，就是在副作用执行的过程中，建立起“数据”与“函数”之间关联关系的过程。它的目的是为了让vue知道当某个数据变动时，应该去通知哪些视图进行更新。

当一个Effect开始运行（比如组件挂载）时，它会先把自身赋值给全局的activeEffect。

Effect内部的代码会读取响应式数据，触发Proxy的get拦截器

在get拦截器内部，Vue执行track函数。它会检查当前的activeEffect是否有值，然后加入到targetMap中对应的set合集中。

## 为什么是WeakMap而不是Map?WeakMap是啥样子的？

Map属于强引用，只要Map实例本身还在，它内部引用的对象就不会被垃圾回收机制销毁。

示例：在Vue页面定义一个大数据对象，当这个页面销毁或这个对象不再使用时，由于全局的targetMap还存着对这个对象的引用，导致这个对象永远无法被回收，最终导致内存泄漏。

WeakMap属于弱引用，它的键（Key）必须是对象且不可遍历。如果除了WeakMap之外，没有任何地方再引用这个对象，那么垃圾回收机制就会自动回收这个对象。

targetMap是一个三层嵌套的树状结构：

- WeakMap(Target -> Map)：区分不同的对象
- Map(Key -> Set)：区分同一个对象不同的属性
- Set(Effect)：存储所有依赖这个属性的副作用函数，Set确保唯一性

```js
// 1. 第一层：WeakMap (targetMap) 键：原始对象 值：该对象对应的 depsMap
{
  [obj]: { 
    // 2. 第二层：Map (depsMap) 键：对象的属性名 (key) 值：该属性对应的 dep 集合
    "name": [
      // 3. 第三层：Set (dep) 存储：所有依赖这个属性的副作用函数 (effect)
      effect1, 
      effect2
    ],
  }
}
```

## Proxy这么好，为什么ref还保留Vue2的.value(getter/setter)实现？

Proxy只能代理对象（Object），没法代理原始值（String、Number、Boolean、Symbol、BigInt、Null、Undefined）。

Vue 通过套壳的方式，把原始值包装成一个对象，然后对这个对象进行代理。

因为Proxy的开销比Object.defineProperty大。对于ref这种结构固定的简单对象，直接使用类(class)的get/set访问器（底层逻辑同Object.defineProperty）性能更高。

只有通过reactive包装的对象以及ref里的对象内容，才会进入targetMap中。

如果ref是基本类型，是通过dep存储的。

如果ref是对象，内核还是通过reactive实现的。

**总结**

Proxy 虽然强大，但它只能代理对象。对于基础类型，Vue3 必须通过 ref 包装成对象。而 ref 并没有选择 Proxy 而是采用类访问器（.value），是因为针对单属性对象的劫持，原生 get/set 性能更优。在依赖管理上，基础类型的 ref 通常将依赖直接存在实例的 dep 属性中，而对象类型的 ref 则会通过 reactive 机制平铺到全局的 targetMap 中。

## Vue3的响应式在什么场景下会“失效”

核心原因：解构是“值的拷贝”，而不是“引用重定向”。

Proxy本质是一个中转站，只有通过代理对象（Proxy）去访问它的属性时，拦截起（getter/setter）才会生效。

```js
const state = reactive({ count: 0 });
```
```js
let { count } = state;
// 相当于：let count = state.count;
```

假设有一个响应式对象，当执行解构赋值时，发生以下变化：

- 触发拦截：在解构的时候，访问了`state,count`，这触发了proxy的get拦截器
- 值传递：proxy把值0丢给变量count
- 关系断裂：此时变量count只是一个普通数字，它和原来的state对象以及彻底脱钩了。

解决方案：toRefs的原理

```js
const state = reactive({ count: 0 });
const { count } = toRefs(state);
```

toRefs会吧state的每个属性都包装成一个`ObjectRefImpl`实例（一种特殊的ref），当访问`count.value`时，内部会自动去原对象state里面取值。

本质：它把解构得到的“值”，变成了解构得到的“代理引用”。

**总结：**

解构赋值之所以失效，是因为 Proxy 只能拦截对对象属性的操作。解构过程本质上是将对象属性的值，赋值给了一个新的局部变量。

如果是基本类型，这种赋值是值拷贝，新变量与原对象完全断开了物理连接；
如果是引用类型，虽然地址没变，但由于你直接操作了子对象，跳过了原对象的 Proxy 拦截器，导致无法触发 trigger 更新。

所以在 Vue3 中，如果需要解构，必须使用 toRefs 或 toRef 来建立一层‘代理引用’，确保访问始终经过响应式系统的拦截。

## targetMap的结构

对上面“为什么是WeakMap而不是Map?WeakMap是啥样子的？”的targetMap的进一步解析

模拟代码

```js
import { reactive, effect } from 'vue';
// 原始对象（数据源）
const user = { name: 'Gopher', age: 25 };
// 响应式代理
const proxyUser = reactive(user);
// 场景 A：组件 1 用到了 name
effect(() => {
  console.log('组件1读取name:', proxyUser.name);
});
// 场景 B：组件 2 既用到了 name，又用到了 age
effect(() => {
  console.log('组件2读取name和age:', proxyUser.name, proxyUser.age);
});
```
targetMap的结构

当上述代码执行完“读取”后，全局的targetMap会填充成下面的样子。它通过三层嵌套，精准地记录了哪个对象的哪个属性被哪个函数依赖了。

```js
// 全局唯一的 targetMap
targetMap = WeakMap {
  // 键：原始对象 user (注意是内存地址，不是字符串)
  { name: 'Gopher', age: 25 }: Map {
    // 键：属性名 "name"
    "name": Set { 
      effect1, // 来自组件 1
      effect2  // 来自组件 2
    },
    // 键：属性名 "age"
    "age": Set { 
      effect2  // 只有组件 2 用到了它
    }
  }
}
```

从数据源到targetMap映射过程可以想象成一个查表过程：

- 1. 第一层（WeakMap）：当`user.name`被读取时，Vue拿到原始对象`user`，去`targetMap`中查询原始对象对应的`depsMap`

- 2. 第二层（Map）：拿到`depsMap`后，再查询具体属性名`name`对应的`dep`集合

- 3. 第三层（Set）：把当前的渲染函数（Effect）丢进这个`Set`里

三层结构的原因：

- 第一层：区别不同的对象，
- 第二层：区别同一个对象的不同属性
- 第三层：复用副作用函数，确保依赖收集的唯一性

键Key是原始对象的原因：

Proxy代理后会产生一个代理对象，而Vue在targetMap中存储的是原始对象(Raw Object)。
主要是防止用户混用原始对象和代理对象导致依赖收集错乱。

第二层是Map的原因：

- 第二层的key一定是属性名，所以不能使用weakMap

- Map比Object更适合这种频繁增删改查的场景

### 惰性代理

对上面“targetMap的结构”的进一步解析

如果对象是多层嵌套的话，Vue2 的做法是平铺处理，即递归遍历；Vue3 的做法是按需递归，即惰性劫持。

Vue3 的Proxy只代理当前层。只有当你真正访问（读取）到深层对象时，它才会实时地把那一层转为代理，并存入targetMap中。

```js
const data = { 
  level1: { 
    level2: { name: 'Gopher' } 
  } 
};
const proxyData = reactive(data);
```

在targetMap中，嵌套对象并不是挂在父对象下面的一个子属性，而是作为对立的键(Key)
存在。

访问`proxyData.level1.level2.name`时，targetMap会填充成下面的样子：

```js
targetMap = WeakMap {
  // 键1：根对象 data
  { level1: {...} }: Map { 
    "level1": Set { effect } 
  },
  // 键2：嵌套对象 level1 (只有被访问后才会出现在这里)
  { level2: {...} }: Map { 
    "level2": Set { effect } 
  },
  // 键3：嵌套对象 level2
  { name: 'Gopher' }: Map { 
    "name": Set { effect } 
  }
}
```
# Vue 响应式原理

## 思维导图
![Excel Image](/public/assets/vue/reactivity_system_1.png)

### 数据流
- `Observe.setter` >> `dep.notify` >> `watch.update`
- `Observe.getter` >> `dep.depend` >> `watch.addDep`

## Observer（监听器）

Observer 监听器负责对数据进行劫持监听，通过给对象添加 getter 和 setter 方法，将普通的 JavaScript 数据对象转化为响应式对象。

### 主要方法：
1. **walk()** 方法遍历对象的所有属性，对每个属性调用 **defineReactive** 方法。
2. **defineReactive** 方法中，通过 `Object.defineProperty`（Vue3 使用 ES6 的 Proxy）为对象定义 getter 和 setter 方法，getter 方法负责依赖收集，setter 方法负责派发更新。（每一个属性都有一个 Dep 实例）
3. **getter**：当访问某个属性时，getter 会被触发，进行依赖收集（Vue 一开始会将当前的 watcher 添加到依赖列表中）`dep.depend()` 方法负责依赖收集。
4. **setter**：当修改某个属性时，setter 会被触发，进行派发更新（Vue 会通知所有依赖这个属性的 watcher，触发视图更新）`dep.notify()` 方法负责派发更新。

### 设计模式：
观察者模式：Observer负责将数据对象转换为响应式对象，使得数据变化能够被观察和响应。

### 代码实现
```javascript
class Observer {
  constructor(value) {
    this.value = value; // 保存被观察的值
    this.walk(value); // 遍历对象的属性
  }

  // 遍历对象的所有属性
  walk(obj) {
    Object.keys(obj).forEach(key => defineReactive(obj, key, obj[key]));
  }
}

// 将对象的属性定义为响应式
function defineReactive(obj, key, val) {
  const dep = new Dep(); // 每个属性都有一个 Dep 实例，用于管理依赖

  Object.defineProperty(obj, key, {
    enumerable: true, // 属性可枚举
    configurable: true, // 属性可配置
    // getter 方法，访问属性时触发
    get() {
      if (Dep.target) {
        dep.depend(); // 依赖收集，将当前的 watcher 添加到依赖列表
      }
      return val; // 返回属性值
    },
    // setter 方法，修改属性时触发
    set(newVal) {
      if (val !== newVal) { // 只有在值变化时才进行更新
        val = newVal; // 更新属性值
        dep.notify(); // 派发更新，通知所有依赖的 watcher
      }
    }
  });
}
```

## Dep（依赖收集器）

Dep 依赖管理器负责管理和通知依赖于某个数据属性的所有 Watcher 订阅者。每个响应式数据属性都有一个 Dep 实例，负责存储依赖于该属性的所有 Watcher。

### 主要方法：
1. **addSub()** 方法负责将 Watcher 添加到订阅列表。
2. **depend()** 方法会将当前的 Watcher 添加到 Dep 的订阅列表中。
3. **notify()** 方法会通知所有订阅者，调用它们的 update 方法进行更新。

### 设计模式：
单例模式：Dep.target是一个全局的Watcher，用于依赖收集。
发布-订阅模式：Dep作为发布者，维护一个订阅列表，并在数据变化时通知所有订阅者

### 代码实现
```javascript
let uid = 0; // 唯一标识符，用于区分不同的 Dep 实例

class Dep {
  constructor() {
    this.id = uid++; // 为每个 Dep 实例分配一个唯一 ID
    this.subs = []; // 存储依赖于该属性的所有 Watcher
  }

  // 添加订阅者到列表
  addSub(sub) {
    this.subs.push(sub); // 将 Watcher 添加到订阅列表
  }

  // 将当前的 Watcher 添加到依赖列表
  depend() {
    if (Dep.target) {
      Dep.target.addDep(this); // 将当前的 Dep 添加到 Watcher 的依赖中
    }
  }

  // 通知所有订阅者进行更新
  notify() {
    this.subs.forEach(sub => sub.update()); // 调用每个 Watcher 的 update 方法
  }
}

Dep.target = null; // 全局的 Watcher，用于依赖收集
```

## Watcher（订阅者）

Watcher 订阅者负责在数据变化时执行回调。它会在初始化时读取数据，触发 getter 依赖收集，并在数据变化时通知进行更新。

### 主要方法：
1. **constructor** 方法中，Dep.target 被设置为当前的 Watcher，并触发 getter 方法进行依赖收集。
2. **addDep** 方法将当前的 Watcher 添加到 Dep 实例的订阅列表中。
3. 当数据发生变化时，setter 方法派发更新会调用 `dep.notify()`，通知所有订阅者进行更新。
4. Watcher 类的 **update()** 方法被调用，执行回调函数。

### 设计模式：
观察者模式：Watcher 作为观察者，订阅数据的变化，并在变化时执行相应的操作。

### 代码实现
```javascript
class Watcher {
  constructor(obj, key, cb) {
    this.obj = obj; // 被观察的对象
    this.key = key; // 被观察的属性
    this.cb = cb; // 回调函数
    Dep.target = this; // 将当前的 Watcher 实例指向 Dep.target
    this.value = obj[key]; // 触发 getter，进行依赖收集
    Dep.target = null; // 重置 Dep.target
  }

  // 将当前 Watcher 添加到 Dep 的订阅列表中
  addDep(dep) {
    dep.addSub(this); // 添加依赖到 dep
  }

  // 更新 Watcher 的值并执行回调函数
  update() {
    this.value = this.obj[this.key]; // 更新当前值
    this.cb(this.value); // 执行回调
  }
}
```

## 发布-订阅模式

**定义**：发布-订阅模式是一种消息传递模式，允许对象之间的松散耦合。发布者发布事件，订阅者订阅这些事件。发布者与订阅者之间没有直接的依赖关系，而是通过一个中介（事件管理器）来进行通信。

**实例**：在 Vue 中，`Dep` 负责将数据变化的消息发布给所有订阅者 `Watcher`。这是一种发布和订阅的机制，使得数据的变化能够被不同的组件和视图响应。

**特点**：
- 发布者发布消息（`notify`）。
- 订阅者接受消息并处理（`update`）。
- 通过中介进行通信。


## 观察者模式

**定义**：观察者模式定义了一种一对多的依赖关系，让多个观察者对象同时监听某一个主题对象。当这个主题对象的状态发生变化时，它的所有依赖者（观察者）都会收到通知并自动更新。

**实例**：`Dep` 类本身作为一个主题（被观察者），管理一组观察者（`Watcher`）。每当数据发生变化时，`Dep` 通知所有的观察者进行更新。

**特点**：
- 主题（`Dep`）管理多个观察者（`Watcher`）。
- 一对多的依赖关系。
- 主题状态变化时，所有观察者都得到通知。
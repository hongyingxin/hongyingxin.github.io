# JavaScript 进阶 - ES6

## let 和 const 

### let

1. 不存在变量提升，变量只能在声明后使用

```javascript
console.log(foo) // undefined
var foo = 2

console.log(bar) // ReferenceError: Cannot access 'bar' before initialization
let bar = 2
```

2. 暂时性死区，在声明前访问会报错

```javascript
var tmp = 123
if (true) {
  tmp = 'abc' // ReferenceError
  let tmp
}
```

3. 不允许重复声明

```javascript
let a = 1
let a = 2 // SyntaxError: Identifier 'a' has already been declared
```

4. 块级作用域

```javascript
function f1 () {
  let n = 5;
  if(true) {
    let n = 10
  }
  console.log(n) // 5
}
```

### const

const保证的是变量指向的那个内存地址所保存的数据不得改动。引用数据类型有一个指针的概念。

const可以添加属性，但不能赋值操作。

```javascript
const foo = {};

// 为 foo 添加一个属性，可以成功
foo.prop = 123;
foo.prop // 123

// 将 foo 指向另一个对象，就会报错
foo = {}; // TypeError: "foo" is read-only
```

## Hoisting 提升

JavaScript提升是指在代码执行前，变量和函数声明会被移动到其所在作用域的顶部的行为。这是JavaScript引擎的工作方式，它在编译阶段会先处理所有的声明，然后再执行代码。

### 1. 变量提升

只有 `var` 声明的变量才会提升，`let` 和 `const` 不会提升。提升后的变量值为 `undefined`。

```javascript
console.log(a); // undefined
var a = 2;

// 上面的代码在JavaScript引擎中的理解方式：
// var a;
// console.log(a);
// a = 2;
```

### 2. 函数提升

函数声明会整体提升，包括函数体。函数表达式只会提升变量声明，函数体不会提升。函数声明的优先级高于变量声明。

```javascript
// 函数声明
sayHello(); // "Hello!"
function sayHello() {
  console.log("Hello!");
}

// 函数表达式
sayHi(); // TypeError: sayHi is not a function
var sayHi = function() {
  console.log("Hi!");
};

// 上面的代码在JavaScript引擎中的理解方式：
// function sayHello() { console.log("Hello!"); }
// var sayHi;
// sayHello();
// sayHi();
// sayHi = function() { console.log("Hi!"); };
```

### 3. 变量提升的优先级

函数声明的优先级高于变量声明。

```javascript
console.log(foo); // [Function: foo]
var foo = 'bar';
function foo() {
  return 'foo';
}
```

## 强引用和弱引用

### 强引用（Strong Reference）

指的是普通的对象引用，只要有强引用指向某个对象，该对象就不会被垃圾回收。JavaScript中的常规变量赋值、对象属性、数组元素等都是强引用，Map、Set、Array等数据结构对其元素也是强引用。

```javascript
let obj = { name: 'example' };  // obj 强引用了这个对象
let arr = [obj];               // 数组也强引用了这个对象
let map = new Map();
map.set(obj, 'value');         // Map对obj是强引用

// 即使原始引用被清除
obj = null;

// 对象仍然可以通过数组或Map访问
console.log(arr[0]);          // { name: 'example' }
// 对象不会被垃圾回收，因为arr和map仍然引用它
```

### 弱引用（Weak Reference）

指的是不会阻止对象被垃圾回收的引用。如果一个对象只有弱引用指向它，没有强引用，那么它会被垃圾回收。JavaScript中通过WeakMap、WeakSet实现弱引用。弱引用不会被计入引用计数。

```javascript
let obj = { name: 'example' };  // obj 强引用了这个对象
let weakMap = new WeakMap();
weakMap.set(obj, 'value');      // weakMap对obj是弱引用

// 当清除强引用
obj = null;

// 对象会被垃圾回收，weakMap中对应的键值对也会消失
// 无法通过weakMap访问原对象，但这个过程不是立即的
```

### 强弱引用对比

| 特性 | 强引用 | 弱引用 |
|------|--------|--------|
| 垃圾回收 | 阻止回收 | 不阻止回收 |
| 数据结构 | Map, Set, Array等 | WeakMap, WeakSet |
| 可遍历性 | 可以遍历 | 不可遍历 |
| 引用计数 | 计入计数 | 不计入计数 |
| 内存泄漏风险 | 较高 | 较低 |

## 箭头函数

箭头函数没有自己的this对象，函数体内的this对象，就是定义该函数所在的作用域指向的对象，而不是使用时所在的作用域指向的对象。

### 1. 语法特点

```javascript
// 基本形式
const fn = (参数) => {函数体};

// 单个参数可省略括号
const fn = 参数 => {函数体};

// 无参数必须保留括号
const fn = () => {函数体};

// 函数体只有一行return语句可省略大括号和return
const fn = 参数 => 表达式; // 等同于: const fn = (参数) => { return 表达式; };

// 直接返回对象字面量需用括号包裹
const fn = () => ({ name: 'John' });
```

### 2. 箭头函数的特点

1. 没有自己的this对象

```javascript
// 传统函数的this绑定
const obj = {
  name: 'Object',
  regularMethod: function() {
    console.log(this.name); // "Object"
    
    setTimeout(function() {
      console.log(this.name); // undefined (在浏览器中可能是window.name)
    }, 1000);
  }
};

// 箭头函数的this绑定
const obj2 = {
  name: 'Object',
  arrowMethod: function() {
    console.log(this.name); // "Object"
    
    setTimeout(() => {
      console.log(this.name); // "Object" (继承外部作用域的this)
    }, 1000);
  }
};
```

2. 没有arguments对象

```javascript
function regular() {
  console.log(arguments); // Arguments对象
}

const arrow = () => {
  console.log(arguments); // 报错或指向外层函数的arguments
};
```

3. 不能作为构造函数

```javascript
const Person = (name) => {
  this.name = name; // 箭头函数不绑定this
};

const john = new Person('John'); // TypeError: Person is not a constructor
```

4. 没有prototype属性

```javascript
const fn = () => {};
console.log(fn.prototype); // undefined
```

5. 不能用作Generator函数

```javascript
// 正确的Generator函数
function* generator() {
  yield 1;
}

// 箭头函数不能使用yield
const arrowGenerator = *() => { // 语法错误
  yield 1;
};
```

6. 不能用bind、call、apply改变this指向

```javascript
const arrow = () => {
  console.log(this);
};

const obj = { name: 'Object' };
arrow.call(obj); // 不会指向obj，仍然是定义时的this
```

## Set和Map

### Set

Set 类似于数组，但是成员的值都是唯一的，没有重复的值。

#### 基本用法

```javascript
// 创建Set
const set = new Set([1, 2, 3, 4, 5]);
// 获取Set的大小
set.size;
// 添加元素
set.add(6);
// 删除元素
set.delete(3);
// 检查元素是否存在
set.has(2);
// 清空Set
set.clear();
// 遍历Set
for (let item of set.keys()) {
  console.log(item);
}
for (let item of set.values()) {
  console.log(item);
}
for (let item of set.entries()) {
  console.log(item);
}
```

#### 应用场景

1. 数组去重
2. 集合运算（交集、并集、差集）
3. 数据存储

### Map

Map 类似于对象，也是键值对的集合，但是“键”的范围不限于字符串，各种类型的值（包括对象）都可以当作键。

## WeakSet和WeakMap

### WeakSet

WeakSet 是 Set 的变体，它只存储对象的弱引用，不能存储原始值。

### WeakMap

WeakMap 是 Map 的变体，它只存储对象的弱引用，不能存储原始值。
# JavaScript 基础题

## 1. 数据类型

JS 数据类型分为两大类：

- 基本数据类型：Number、String、Boolean、Null、Undefined、Symbol、BigInt 共 7 种，基本数据类型存储在栈中
- 引用数据类型：Object 共 1 种，引用数据类型存储在堆中，栈中存储的是引用地址（即指针），该指针指向堆中该对象的地址

## 2. 栈和堆

在数据结构中，栈中数据的存取方式为先进后出，堆中数据的存取方式为先进先出。（堆类似于队列）

在数据缓存中，栈区内存由编译器自动分配释放，存放函数的参数值，局部变量的值等。堆区内存一般由开发者分配释放，若开发者不释放，程序结束时可能由垃圾回收机制回收。

比如浅拷贝和深拷贝的区别就是基于堆内存的引用机制：浅拷贝复制引用地址，深拷贝会在堆内存中开辟新空间。

## 3. 类型判断

### 3.1 typeof 运算符

`typeof` 运算符返回一个字符串表示操作数的类型。 `typeof`对于基本数据类型，除了 `null` 都会返回相应的类型。（对象类型检测侧不准确）

```js
typeof 123; // "number"
typeof 'abc'; // "string"
typeof true; // "boolean"
typeof undefined; // "undefined"
typeof null; // "object" (这被认为是一个语言设计上的错误)
typeof []; // "object"
typeof {}; // "object"
typeof function() {}; // "function"
```

### 3.2 instanceof 运算符

`instanceof` 通过原型链的方式来判断是否为构建函数的实例（不能检测原始类型）

```js
[] instanceof Array; // true
{} instanceof Object; // true
function() {} instanceof Function; // true
new Date() instanceof Date; // true
[] instanceof Object; // true (数组也是对象)
```

### 3.3 Object.prototype.toString.call()

用于获取对象的精准类型。返回一个字符串，表示对象的内部[[Class]]属性，格式为"[object Type]"，通常被用作一个更可靠的类型检查方法。

```js
Object.prototype.toString.call(123); // "[object Number]"
Object.prototype.toString.call('abc'); // "[object String]"
Object.prototype.toString.call(true); // "[object Boolean]"
Object.prototype.toString.call(undefined); // "[object Undefined]"
Object.prototype.toString.call(null); // "[object Null]"
Object.prototype.toString.call([]); // "[object Array]"
Object.prototype.toString.call({}); // "[object Object]"
Object.prototype.toString.call(function() {}); // "[object Function]"
Object.prototype.toString.call(new Date()); // "[object Date]"
Object.prototype.toString.call(/regex/); // "[object RegExp]"
```

### 3.4 特定判断Api

`Array.isArray()` 用于检测一个值是否为数组，返回布尔值

`Number.isNaN()` 用于检测一个值是否为NaN，返回布尔值

`Number.isInteger()` 用于检测一个值是否为整数，返回布尔值

`isNaN()` 用于检测一个值是否为null，返回布尔值（内部强制类型转换，将非数字转换成NaN）

### 相关面试题请看[面试题集合](../JavaScript/面试题/.md#类型判断)
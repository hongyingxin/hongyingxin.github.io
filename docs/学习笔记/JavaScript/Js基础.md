# JavaScript基础

## typeof

typeof 运算符返回一个字符串，表示操作数的类型。

### 描述

| 类型 | typeof 返回结果 | 备注 |
|------|----------------|------|
| Undefined | `"undefined"` | |
| Null | `"object"` | 这是一个历史遗留的bug |
| Boolean | `"boolean"` | |
| Number | `"number"` | |
| BigInt | `"bigint"` | ES2020新增 |
| String | `"string"` | |
| Symbol | `"symbol"` | ES6新增 |
| Function | `"function"` | 在ECMA-262中实现[[Call]]；classes也是函数 |
| 其他任何对象 | `"object"` | 包括数组、对象、Date等 |

### 示例

```javascript
// 基本类型
console.log(typeof undefined);     // "undefined"
console.log(typeof null);          // "object" (历史遗留问题)
console.log(typeof true);          // "boolean"
console.log(typeof 42);            // "number"
console.log(typeof 42n);           // "bigint"
console.log(typeof "hello");       // "string"
console.log(typeof Symbol("id"));  // "symbol"

// 函数
console.log(typeof function() {}); // "function"
console.log(typeof class C {});    // "function"

// 对象
console.log(typeof {});            // "object"
console.log(typeof []);            // "object"
console.log(typeof new Date());    // "object"
console.log(typeof /regex/);       // "object"

```

### typeof null

```js
// JavaScript 诞生以来便如此
typeof null === "object";
```

在 JavaScript 最初的实现中，JavaScript 中的值是由一个表示类型的标签和实际数据值表示的。对象的类型标签是 0。由于 null 代表的是空指针（大多数平台下值为 0x00），因此，null 的类型标签是 0，typeof null 也因此返回 "object"。

### new 操作符

```js
typeof new Boolean(true) === "object";
typeof new Number(1) === "object";
typeof new String("abc") === "object";
typeof new Function() === "function";
```

所有使用 new 调用的构造函数都将返回非基本类型（"object" 或 "function"）。大多数返回对象，但值得注意的例外是 Function，它返回一个函数。
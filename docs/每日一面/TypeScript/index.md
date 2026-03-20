# TypeScript 面试题

## 如何检查TypeScript中的null和undefined

通过使用一个缓冲检查，我们可以检测空和未定义：
```js
if (x == null) {
}
```

## 如何管理和优化tsconfig

tsconfig应被视为工程规范而非临时配置；通过分层与继承降低维护成本；类型严格性需要渐进式收紧而非一次性激进开启；合理控制编译范围以优化性能；在复杂工程中利用tsconfig约束依赖边界，使类型系统服务于长期可维护性。

## Boolean和boolean有什么区别？

在TypeScript中，Boolean和boolean都与布尔类型（true或false）相关，但它们有本质的区别：

boolean是TypeScript中的原始类型，它表示一种简单的布尔值类型。它只能是两个值之一：true或false。

boolean类型用于变量、参数、返回值等处，表示值本身是布尔值。
```js
let isActive: boolean = true;
let isAvailable: boolean = false;
```

Boolean是JavaScript的内置对象类型，它是一个构造函数，类似于其他对象类型（例如String、Number）。使用Boolean时，实际上是在引用一个对象类型，它可以通过new Boolean()来实例化一个布尔对象。

这里的Boolean是构造函数，而boolean是原始类型。
```js
let isActiveObject: Boolean = new Boolean(true);
let isAvailableObject: Boolean = new Boolean(false);
```

**总结：**

1. boolean：表示原始布尔类型，可以是true或false，用于变量、函数返回值。它是一个基本数据类型
2. Boolean：表示布尔对象类型，实际上是Boolean构造函数的实例。它是一个对象类型，通过new Boolean()创建，通常不推荐这样子做，因为它的行为可能导致一些不必要的复杂性。布尔对象在比较时会转换为true，即使它的值是false。

## 了解ts工具了下Exclude与Omit的使用吗？及它们两个的区别？

Exclude和Omit都是TypeScript中的工具类型，它们的作用是处理和转换类型的集合，在实际开发中高效地操作类型。

Exclude是TypeScript提供的一个工具类型，它的作用是从联合类型中排查指定的类型。

```js
Exclude<T, U>
// T是目标类型
// U是排除的类型
```

`Exclude<T, U>`的作用是构建一个新的类型，它是从`T`中排除掉所有在`U`中的类型。

```js
type A = string | number | boolean;
type B = string | boolean;

type Result = Exclude<A, B>;
```

Omit是TypeScript中的另一个工具类型，它用于从一个类型中排除指定的键（属性）。

```js
Omit<T,K>
// T是目标类型
// K是排除的键
```

`Omit<T,K>`会构建一个新的类型，它是从`T`中排除掉了`K`中的所有属性。

```js
interface Person {
  name: string;
  age: number;
  address: string;
}

type OmittedPerson = Omit<Person, 'address'>;
// OmittedPerson的类型是 { name: string, age: number }
```

**总结：**

1. Exclude：用于处理联合类型，排除某些类型（通常是值类型）以产生一个新的联合类型。它关注的是类型的值，而不是对象的属性。

2. Omit：用于处理对象类型，从对象中排除指定的属性，生成一个新的对象类型。它关注的是类型的属性，而非值。
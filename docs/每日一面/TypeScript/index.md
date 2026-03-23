# TypeScript 面试题

## 1. 如何检查TypeScript中的null和undefined

通过使用一个缓冲检查，我们可以检测空和未定义：
```js
if (x == null) {
}
```

## 2. 如何管理和优化tsconfig

tsconfig应被视为工程规范而非临时配置；通过分层与继承降低维护成本；类型严格性需要渐进式收紧而非一次性激进开启；合理控制编译范围以优化性能；在复杂工程中利用tsconfig约束依赖边界，使类型系统服务于长期可维护性。

## 3. Boolean和boolean有什么区别？

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

## 4. 了解ts工具了下Exclude与Omit的使用吗？及它们两个的区别？

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

## 5. extends 关键字会在哪些场景下使用？

extends 关键字常见的用途包括：

- 1. 接口继承：使一个接口可以继承另一个接口
- 2. 类继承：允许一个类继承另一个类，获得父类的属性和方法
- 3. 条件类型：用来判断类型是否满足某个条件，并基于此做出不同的处理
- 4. 泛型约束：用来约束泛型参数，确保泛型类型满足特定条件
- 5. 联合类型判断：判断一个类型是否满足某个联合类型
- 6. 索引签名继承：在继承时加入对索引签名的支持

## 6. never 是什么类型？

在 TypeScript 中，never 是一个特殊的类型，它表示“从不”发生的值。换句话说，never 类型用于表示那些不可能存在的值或永远不会完成的情况。它通常用于以下几种场景：

- 1. 不可能的返回值

never 类型常用于函数的返回类型，表示该函数不会正常返回。通常这种情况发生在函数抛出错误或者函数进入无限循环时。

```js
function throwError(message: string): never {
  throw new Error(message); // 函数抛出错误，不会返回任何值
}
```

在上述示例中，throwError 函数会抛出一个错误，因此它不会正常返回到调用者。

- 2. 类型保护中的 never

never 类型也可以用于类型保护来确保所有可能的情况都被处理。常用于 switch 语句或其他条件语句中，确保每个分支都已被处理。

```js
type Animal = "dog" | "cat";

function getAnimalSound(animal: Animal): string {
  switch (animal) {
    case "dog":
      return "Woof!";
    case "cat":
      return "Meow!";
    default:
      // 确保所有可能的值都已处理
      const _exhaustiveCheck: never = animal;
      throw new Error(`Unhandled case: ${_exhaustiveCheck}`);
  }
}
```

在这个示例中，`_exhaustiveCheck` 被赋值为 animal，这是为了确保 switch 语句中的每个可能的分支都被处理。如果有遗漏，TypeScript 编译器将会报错。

- 3. 作为函数参数

never 类型也可以用于函数参数中，表示函数参数类型应该从不出现这种情况。例如，某些类型保护函数可以返回 never 来表示某种类型的不存在。

```js
function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${x}`);
}

function handle(value: "a" | "b") {
  switch (value) {
    case "a":
      console.log("Handling 'a'");
      break;
    case "b":
      console.log("Handling 'b'");
      break;
    default:
      assertNever(value);  // 如果 value 不是 "a" 或 "b"，将会触发类型错误
  }
}
```

## 7. infer 关键字是什么？

infer 关键字用于在条件类型中推断类型。它允许你在条件类型中声明一个类型变量并推断出它的类型，通常用来提取或推断复杂类型的内部结构。

```js
type ConditionalType<T> = T extends SomeType<infer U> ? U : FallbackType;
```

- `SomeType<infer U>`：在条件类型的条件部分，SomeType 是一个带有类型参数的类型，U 是我们要推断的类型变量
- U：被推断的类型变量，可以在条件为 true 时使用
- FallbackType：在条件为 false 时的备用类型

# 数组类型定义

## 简单定义

```typescript
// 1. 在元素类型后面接上[]
const numArr: number[] = [1, 2, 3];
const strArr: string[] = ['a', 'b', 'c'];

// 2. 使用数组泛型
const list: Array<number> = [1, 2, 3];
```

## 数组中有多种数据类型

```typescript
const arr: (number | string)[] = [1, 'a', 2];
```

## 数组中对象的定义

```typescript
const arr: { name: string; age: number }[] = [
  { name: '小姐', age: 18 }
];
```

## 使用别名 type

```typescript
type lady = [name: string, age: number];
const xiaojie: lady = [
  { name: '小姐', age: 18 }
];
```

## 使用 class

```typescript
class Madam {
  name: string;
  age: number;
}
const xiaojie: Madam[] = [];
```

## 定义一个对象并从中推断它的键

```typescript
const persons = [
  { name: 'John', age: 12 },
  { name: 'Ben', age: 20 }
];

const fun = (info: typeof persons) => {
  // You will get intellisense here
  console.log(info[0].name);
};
```

## 如果希望对象具有固定键，则可以使用类型和接口

```typescript
interface IPerson {
  id?: string; // ID is optional (use of ? operator)
  name: string; // Name is Required
  age: number;
}

const persons: Array<IPerson> = [
  { name: 'John', age: 12 },
  { name: 'Ben', age: 20 }
];

// Both are same: Array<IPerson> === IPerson[]
const fun = (info: Array<IPerson>) => {
  // You will get intellisense here
  console.log(info[0].name);
};
```

## 如果希望对象具有固定键，并且需要提供部分信息

```typescript
// Partial 是高级用法
interface IPerson {
  id?: string; // ID is optional (use of ? operator)
  name: string; // Name is Required
  age: number;
}

const persons: Array<Partial<IPerson>> = [
  { name: 'John' }, // You can do it.
  { name: 'Ben', age: 20 }
];

// Both are same: Array<IPerson> === IPerson[]
const fun = (info: Partial<IPerson>[]) => {
  // You will get intellisense here
  console.log(info[0].name);
};
```
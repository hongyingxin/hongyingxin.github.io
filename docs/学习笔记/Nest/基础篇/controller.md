# Controller 控制器

什么是 Controller？语义化翻译就是控制器。在 Nest 中，Controller 负责处理传入的请求并将响应返回给客户端。

## 如何定义控制器

在类声明上，定义 @Controller() 装饰器，即可将类定义为控制器。在 Nest 中，几乎所有的装饰器都是以方法形式存在的，以下是 @Controller() 装饰器的源码：

```typescript
export function Controller(prefix?: string): ClassDecorator {
  const path = isUndefined(prefix) ? '/' : prefix;
  return (target: object) => {
    Reflect.defineMetadata(PATH_METADATA, path, target);
  };
}
```

从源码可以看出，控制器装饰器有一个可选的方法参数，该参数默认值是 `/`，表示控制器的基本路径。

现在，让我们来定义一个前缀为 cats 的控制器

```typescript
import { Controller } from '@nestjs/common';

@Controller('cats')
export class CatsController { }
```

## 请求装饰器

在类的方法声明上，定义 @Get()、@Post()、@Put()、@Delete() 等装饰器，即可定义它的请求类型。

```typescript
import { Controller, Get } from '@nestjs/common';

@Controller('cats')
export class CatsController {
  @Get()
  findAll(): string[] {
    return ['cat1', 'cat2'];
  }
  @Get(':id')
  findOne(@Param('id') id: string): string {
    return `cat ${id}`;
  }
  @Post()
  create(@Body() createCatDto: CreateCatDto): string {
    return 'cat';
  }
  @Put(':id')
  update(@Param('id') id: string, @Body() updateCatDto: UpdateCatDto): string {
    return `cat ${id}`;
  }
  @Delete(':id')
  remove(@Param('id') id: string): string {
    return `cat ${id}`;
  }
}
```

## 参数装饰器

在定义路由时，方法参数中，我们使用到了 @Param()、@Body() 等装饰器，这些装饰器就是参数装饰器。它们与`express`中的`req.params`、`req.body`等类似，用于获取请求中的参数。

| Nest.js 装饰器 | Express.js 对应 | 说明 |
|---------------|----------------|------|
| `@Request()` | `req` | 获取完整的请求对象 |
| `@Response()` | `res` | 获取响应对象 |
| `@Next()` | `next` | 获取 next 函数 |
| `@Session()` | `req.session` | 获取会话对象 |
| `@Param(param?: string)` | `req.params` / `req.params[param]` | 获取路由参数 |
| `@Body(param?: string)` | `req.body` / `req.body[param]` | 获取请求体数据 |
| `@Query(param?: string)` | `req.query` / `req.query[param]` | 获取查询参数 |
| `@Headers(param?: string)` | `req.headers` / `req.headers[param]` | 获取请求头 |


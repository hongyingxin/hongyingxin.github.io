# Middleware 中间件

中间件是请求发出者和路由处理器之间的桥梁，可以轻松地访问请求和响应对象。在 Nest 中，中间件可以使用多个，它们之间使用 `next()` 方法作为连接，连接后的所有中间件将在整个请求-响应周期内通过 `next()` 依次执行。

> **注意**：默认情况下，Nest 中间件等同于 Express 中间件。

以下是从 Express 官方文档中复制的中间件功能列表：

- 执行任何代码
- 对请求和响应对象进行更改
- 结束请求-响应周期
- 调用堆栈中的下一个中间件函数
- 如果当前中间件功能没有结束请求-响应周期，它必须调用 `next()` 将控制权传递给下一个中间件功能，否则请求将被搁置

## 定义

中间件可以分为类中间件和函数式中间件。

我们可以在函数中或者带有 `@Injectable()` 装饰器的类中定义中间件。

如果我们的中间件不需要任何依赖性时，可以直接使用一个简单函数来定义它。

```ts
// 函数式中间件
import { Request, Response, NextFunction } from 'express';

export function logger(req: Request, res: Response, next: NextFunction) {
  console.log(`Request...`);
  next();
}
```

我们也可以通过继承 NestMiddleware 接口来定义中间件。

```ts
// 类中间件
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log(`Request...`);
    next();
  }
}
```

## 依赖注入

中间件支持依赖注入，与提供者（Provider）和控制器（Controller）一样，中间件也可以通过构造函数 `constructor` 注入依赖。

```ts
import { Injectable, Inject, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';

@Injectable()
export class SomeMiddleware implements NestMiddleware {
  constructor(@Inject(SomeService) private readonly someService: SomeService) {}

  use(req: Request, res: Response, next: Function) {
    // do some logic...
    this.someService.method();

    console.log('Request...');
    next();
  }
}
```

## 使用

中间件可以通过使用模块类的 `configure()` 方法来设置。包含中间件的模块必须实现 `NestModule` 接口。

```ts
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { CatsModule } from './cats/cats.module';

@Module({
  imports: [CatsModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('cats');
  }
}
```

`apply()` 方法既可接收单个中间件，也可通过多个参数指定多个中间件。

```ts
// 单个中间件
.apply(LoggerMiddleware)
// 多个中间件
.apply(LoggerMiddleware, LoggerMiddleware2, LoggerMiddleware3)
```

`forRoutes()` 方法可接收单个字符串、多个字符串、`RouteInfo` 对象、控制器类甚至多个控制器类。

我们可以通过 `path` 和 `method` 来指定中间件的适用范围。`path` 是路由路径，`method` 是请求方法。

当我们的路由越来越多时，可能出现多个 `forRoutes()` 方法，这种时候我们可以使用路由通配符来拦截路由。

```ts
// 单个字符串，拦截路径为 cats 的请求
.forRoutes('cats');
// 多个字符串，拦截路径为 cats 和 dogs 的请求
.forRoutes('cats', 'dogs');
// RouteInfo 对象，拦截路径为 cats 的 GET 请求
.forRoutes({ path: 'cats', method: RequestMethod.GET });
// 控制器类，拦截 CatsController 的所有请求
.forRoutes(CatsController);
// 多个控制器类，拦截 CatsController 和 DogsController 的所有请求
.forRoutes(CatsController, DogsController);
// 路由通配符，拦截路径为 ab*cd 的请求
.forRoutes({ path: 'ab*cd'});
```

`exclude()` 方法用来排除路由，与 `forRoutes()` 方法类似，可以接收单个字符串、多个字符串、`RouteInfo` 对象来指定需要排除的路由。

```ts
// 单个字符串，排除路径为 cats 的请求
.exclude('cats');
// 多个字符串，排除路径为 cats 和 dogs 的请求
.exclude('cats', 'dogs');
// RouteInfo 对象，排除路径为 cats 的 GET 请求
.exclude({ path: 'cats', method: RequestMethod.GET });
```

## 全局中间件

如果我们需要一次性将中间件绑定到所有的路由，可以使用 `INestApplication` 接口的 `use()` 方法。

```ts
const app = await NestFactory.create(AppModule);
// 这里必须使用函数中间件
app.use(LoggerMiddleware);
await app.listen(3000);
```

## 执行顺序

中间件按照注册顺序执行：

全局中间件 > 模块中间件 > 路由中间件 > 控制器中间件

## 使用场景

中间件在实际开发中使用场景非常广泛，适合用力做一些全局的逻辑处理，比如：

- 日志记录
- 权限验证
- 请求解析
- 跨域处理
- 错误处理

```ts
// 日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// 认证中间件
app.use('/api', (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
});

// 限流中间件
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 限制每个IP 15分钟内最多100个请求
}));
```
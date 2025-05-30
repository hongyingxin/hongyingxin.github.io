# 网络通讯

## HTTP 状态码场景整理

### 2xx 成功响应

#### 200 OK
- 标准含义：请求成功
- 实际场景：当你在浏览器中访问一个网页，页面成功加载时就会返回 200。例如访问 GitHub 主页，请求成功后服务器返回页面内容。

#### 201 Created
- 标准含义：请求成功并创建了新的资源
- 实际场景：当你在 GitHub 上创建新仓库时，服务器成功创建仓库后返回 201，表示资源已创建成功。

#### 204 No Content
- 标准含义：服务器成功处理请求，但不需要返回任何实体内容
- 实际场景：当你在 GitHub 上点击 star 某个仓库时，服务器成功处理了请求但不需要返回内容，此时返回 204。

### 3xx 重定向响应

#### 301 Moved Permanently
- 标准含义：请求的资源已永久移动到新位置
- 实际场景：当访问 http://github.com 时，服务器会返回 301，将请求永久重定向到 https://github.com。

#### 302 Found
- 标准含义：请求的资源临时移动到新位置
- 实际场景：当你未登录访问 GitHub 的个人设置页面时，会被临时重定向到登录页面。

#### 304 Not Modified
- 标准含义：资源未修改，可使用缓存版本
- 实际场景：当你重复访问 GitHub 的静态资源（如 logo 图片）时，如果资源未变化，浏览器将使用缓存版本。

#### 307 Temporary Redirect
- 标准含义：临时重定向，与 302 类似但要求保持原有请求方法
- 实际场景：当 GitHub API 服务进行临时维护时，可能会将 API 请求临时重定向到备用服务器。

#### 308 Permanent Redirect
- 标准含义：永久重定向，与 301 类似但要求保持原有请求方法
- 实际场景：当 GitHub API 的接口版本更新时，旧版本 API 地址会被永久重定向到新版本地址。

### 4xx 客户端错误

#### 400 Bad Request
- 标准含义：请求语法错误，服务器无法理解
- 实际场景：当你向 GitHub API 发送格式错误的 JSON 数据时，服务器无法解析而返回 400。

#### 401 Unauthorized
- 标准含义：请求需要用户认证
- 实际场景：当你使用过期的 GitHub Token 访问 API 时，服务器会返回 401 要求重新认证。

#### 403 Forbidden
- 标准含义：服务器理解请求但拒绝执行
- 实际场景：当你尝试访问他人的私有 GitHub 仓库时，即使已登录但没有权限，服务器会返回 403。

#### 404 Not Found
- 标准含义：请求的资源不存在
- 实际场景：当你访问一个已被删除或不存在的 GitHub 仓库时，服务器会返回 404。

#### 429 Too Many Requests
- 标准含义：用户在给定时间内发送了太多请求
- 实际场景：当你短时间内向 GitHub API 发送过多请求时，超过限制会返回 429。

### 5xx 服务器错误

#### 500 Internal Server Error
- 标准含义：服务器遇到了不知道如何处理的情况
- 实际场景：当 GitHub 服务器出现未预期的错误时，比如数据库查询异常，会返回 500。

#### 502 Bad Gateway
- 标准含义：作为网关的服务器从上游服务器收到无效响应
- 实际场景：当 GitHub 的负载均衡服务器无法正常连接到后端服务器时会返回 502。

#### 503 Service Unavailable
- 标准含义：服务器暂时无法处理请求
- 实际场景：当 GitHub 进行系统维护或服务器过载时，可能会返回 503。

#### 504 Gateway Timeout
- 标准含义：网关或代理服务器未能及时从上游服务器获取响应
- 实际场景：当 GitHub 的某个请求处理时间过长，超过了网关服务器的等待时间时会返回 504。


## Fetch、Axios、Ajax 三者的区别？

这三者都是用于发起 HTTP 请求的技术方案，各有特点：

1. **Fetch** 是浏览器原生提供的 API，基于 Promise 设计。
优点：原生支持无需引入第三方库，基于 Promise 可以使用 async/await，语法简洁直观。
缺点：不会自动处理错误状态码（如 400、500），默认不带 Cookie，不支持请求超时和进度监控。

2. **Axios** 是一个基于 Promise 的 HTTP 客户端，同时支持浏览器和 Node.js。
优点：自动转换 JSON 数据，支持请求和响应拦截，可以统一处理错误，浏览器兼容性好。
缺点：需要引入第三方库，包体积较大。

3. **Ajax** 是最早的异步请求解决方案，基于 XMLHttpRequest API。
优点：浏览器兼容性最好，原生支持进度监控和超时设置。
缺点：写法繁琐需要手动处理各种状态，使用回调函数容易产生回调地狱，需要手动处理数据格式。

**总结：**
在实际开发中，现在主流的选择是 Axios，因为它提供了更完善的功能和更好的开发体验。如果是简单的请求且不考虑兼容性，使用 Fetch 也是不错的选择。Ajax 因为写法繁琐，现在主要用于理解原理。

## Axios发送两次请求，204的原因

Options请求是一种Http请求方法，用于获取目标资源支持的通信选项。它是一种预检请求，用来确定服务器是否支持跨域请求。
浏览器发送一个Options请求作为预检请求，通常发生在跨源资源共享（Cors）的情况下，当浏览器检测到跨域请求时，会先发送一个Options请求来确定服务器是否支持跨域请求。

## GET 和 POST 的区别？

GET 和 POST 是 HTTP 中最常用的两种请求方法，它们有以下主要区别：

1. **语义不同**
GET 用于获取服务器上的某个资源，而 POST 用于向服务器提交数据。

2. **数据传输方式**
GET 通过 URL 传递参数，数据附加在 URL 的末尾；POST 通过请求体传递参数。

3. **安全性**
GET 以明文形式传输，安全性低；POST 通过请求体传输，相对安全。

4. **使用场景**
GET 主要用于获取资源，如请求页面、查询数据；POST 主要用于提交资源，如提交表单、上传文件。

### 扩展：
实际上 GET 和 POST 还有其他区别，比如浏览器对 URL 长度的限制会影响 GET 请求的数据量，而 POST 请求的数据量则没有限制。此外，GET 请求可以被缓存、收藏和保存历史记录，而 POST 请求则不可以。

## URL路径解析

![例子](../../public/assets/面试/网络/mdn-url-all.png)

**协议**

http是协议，它表明了浏览器必须使用何种协议，通常是HTTP协议或是HTTPS协议

**域名**

www.example.com是域名，域名通常用于代替复杂的IP地址
1. www是子域名，也称为二级域名。一个域名可以有多个二级域名，
2. example是域名的主体部分，表示网站的名称或品牌
3. .com是顶级域名，表示所提供的服务类型，.gov是政府部门，.edu是教育研究机构

**端口**

:80是端口

**资源路径**

/path/to/myfile.html是服务器上资源的路径

**参数**

?key1=value&key2=value2是网址的额外参数，用&符号分隔

**锚点**

#SomewhereInTheDocument是资源本身的一部分锚点，类似于书签。

## CDN 服务

CDN 内容分发网络是一种分布式的服务器系统，通过将内容缓存到地理位置分散的服务器上来加速网站的加载速度和性能。CDN的主要目标是通过将内容传送给离用户最近的服务器来减少网络延迟和提高网站的响应速度。
### 原理：
**内容缓存**：CDN提供商在全球各地部署多个节点服务器，称为边缘服务器。网站的静态内容会被缓存到这些边缘服务器上

**请求路由**：当用户访问一个使用CDN的网站时，用户的请求会被路由到离用户最近的CDN边缘服务器上（通过DNS重定向机制实现）

## CORS 跨域资源共享

跨源资源共享是一种基于Http头的机制，用于使网页能够向其他源（域、协议、端口）发出跨域请求，从而在不同源之间共享资源。跨源资源共享还通过一种机制来检查服务器是否会允许要发送的真实请求，该机制通过浏览器发起一个到服务器的跨源资源的“预检”请求。

CORS机制通过在Http头部中使用一些特定的字段，使服务器能够告知浏览器是否允许跨域请求。
- **Access-Control-Allow-Origin**: 指定了允许访问该资源的源，可以是单个源或者使用通配符 * 表示允许来自任何源的请求。
- **Access-Control-Allow-Methods**: 指定了允许的 HTTP 方法，例如 GET、POST 等。
- **Access-Control-Allow-Headers**: 指定了允许的 HTTP 头部信息。


## CSP 内容安全策略

CSP 指的是内容安全策略，用来检测并削弱某些特定类型的攻击，包括跨站脚本（XSS）和数据注入攻击等。它的本质是建立一个白名单，告诉浏览器哪些外部资源可以加载和执行。我们只需要配置规则，如何拦截由浏览器自己来实现。
通常有两种方式来开启 CSP，一种是设置 meta 标签的方式 <meta http-equiv="Content-Security-Policy">，一种是设置 HTTP 首部中的 Content-Security-Policy。

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' https://apis.google.com; img-src 'self' https://lh3.googleusercontent.com">
```

```js
// 设置 CSP 规则
const csp = "default-src 'self'; script-src 'self' https://apis.google.com; img-src 'self' https://lh3.googleusercontent.com";

// 设置 CSP 规则
document.querySelector('meta[http-equiv="Content-Security-Policy"]').setAttribute('content', csp);
```

## 什么是 XSS 攻击？

XSS（Cross-Site Scripting）跨站脚本攻击，是一种代码注入攻击。攻击者通过在目标网站上注入恶意脚本，使之在用户的浏览器上运行，从而获取用户的敏感信息如 Cookie、Session 等。

1. **XSS 类型**

存储型：恶意代码存储在数据库中，用户访问页面时从数据库加载。

反射型：恶意代码存在 URL 中，服务器接收后返回给浏览器解析。

DOM型：恶意代码通过 DOM 操作方式修改页面内容。

2. **防范措施**

输入过滤：对用户输入的内容进行特殊字符过滤。

输出转义：显示内容时对特殊字符进行 HTML 实体编码。

CSP策略：限制加载其他域名的资源文件，禁止向第三方域名请求数据。

HttpOnly：Cookie 设置 HttpOnly 属性，禁止 JavaScript 读取。

3. **具体实现**
```javascript
// 转义 HTML 字符
function escapeHtml(str) {
    return str.replace(/[&<>"']/g, match => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[match]);
}

// CSP 配置
Content-Security-Policy: default-src 'self'

// Cookie 设置
Set-Cookie: name=value; HttpOnly
```

### 扩展：
现代框架（如 React、Vue）默认会转义输出的内容，但使用 dangerouslySetInnerHTML（React）或 v-html（Vue）时要特别注意 XSS 风险。

## 什么是 CSRF 攻击？

CSRF 攻击指的是请求伪造攻击，攻击者诱导用户进入一个第三方网站，然后该网站向被攻击网站发送跨站请求。如果用户在被攻击网站中保存了登录状态，那么攻击者就可以利用这个登录状态，绕过后台的用户验证，冒充用户向服务器执行一些操作。

1. **攻击原理**

CSRF 攻击的本质是利用了 cookie 会在同源请求中携带发送给服务器的特点，以此来实现用户的冒充。用户登录了 A 网站，获取了 Cookie。用户访问攻击者的 B 网站，B 网站发起一个伪造请求到 A 网站。A 网站收到请求后，因为携带了用户的 Cookie，认为是用户本人的操作。

2. **防范措施**

Token 验证：服务器生成随机 Token，每次请求都要验证。

Referer 校验：检查请求来源是否合法。

SameSite Cookie：限制 Cookie 在跨站请求时的发送。

双重 Cookie：请求时需要在请求参数中携带 Cookie 中的值。

3. **具体实现**
```javascript
// 服务端生成 Token
const token = generateToken();
ctx.cookies.set('csrfToken', token);

// 前端请求时携带 Token
axios.post('/api/data', data, {
    headers: {
        'X-CSRF-Token': token
    }
});

// Cookie 设置 SameSite
Set-Cookie: name=value; SameSite=Strict

// Referer 校验
const referer = ctx.request.headers.referer;
if (!referer || !referer.startsWith('https://example.com')) {
    ctx.throw(403);
}
```

### 扩展：
CSRF 和 XSS 的区别：XSS 是获取用户的信息，CSRF 是伪造用户的操作。XSS 需要向页面注入脚本，CSRF 不需要注入脚本。
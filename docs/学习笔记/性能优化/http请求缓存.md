# HTTP请求缓存详解

## 前言

HTTP 缓存是 Web 性能优化的核心技术之一，它通过减少网络请求和服务器负载来显著提升用户体验。理解 HTTP 缓存机制不仅有助于优化网站性能，更是前端工程师必备的技能。

## HTTP缓存基础概念

### 缓存的分类

HTTP 缓存主要分为两种类型：

**1. 强缓存（Strong Cache）**
- 浏览器直接从本地缓存读取，不发送请求到服务器
- 通过 `Expires` 或 `Cache-Control` 控制
- 状态码：`200 (from disk cache)` 或 `200 (from memory cache)`

**2. 协商缓存（Negotiation Cache）**
- 浏览器发送条件请求到服务器验证缓存是否有效
- 通过 `ETag/If-None-Match` 或 `Last-Modified/If-Modified-Since` 控制
- 状态码：`304 Not Modified`（缓存有效）或 `200`（缓存失效）

## 强缓存控制头部

### Expires（HTTP/1.0）
```http
Expires: Wed, 21 Oct 2024 07:28:00 GMT
```
- 指定资源的绝对过期时间
- 缺点：依赖客户端时间，可能不准确
- 兼容性好，支持老版本浏览器

### Cache-Control（HTTP/1.1）
```http
Cache-Control: public, max-age=3600
```
- 使用相对时间，更加可靠
- 功能更强大，优先级高于 Expires
- 常用指令：
  - `max-age=秒数`：缓存有效时间
  - `public`：可被所有缓存存储
  - `private`：只能被浏览器缓存
  - `no-cache`：每次都要验证
  - `no-store`：完全不缓存

### Expires vs Cache-Control

Expires 和 Cache-Control 两者可以选择一个使用，也可以同时使用。但一般情况下建议同时设置。因为 Expires 是 HTTP/1.0 的缓存头，可以兼容老版本浏览器（如IE6～IE8），而 Cache-Control 是 HTTP/1.1 的缓存头，两者同时设置可以确保兼容性。

```text
# 如果同时存在，现代浏览器按以下优先级处理：
Cache-Control: max-age=3600     # 优先级最高
Expires: Wed, 21 Oct 2024 07:28:00 GMT    # 备选方案
```

## 协商缓存控制头部

### Last-Modified（最后修改时间）

```http
Last-Modified: Wed, 03 Sep 2025 06:54:11 GMT

If-Modified-Since: Wed, 03 Sep 2025 06:54:11 GMT
```

Last-Modified/If-Modified-Since 是基于文件的修改时间来判断缓存是否有效。

服务器在响应中返回该资源文件最后一次修改的时间戳，浏览器将此信息与本地缓存的资源进行比对。

工作流程：

1. 第一次请求时，服务器返回资源和其 Last-Modified 时间。
2. 后续请求时，浏览器在请求头中带上 If-Modified-Since 字段，包含之前获取的 Last-Modified 时间。
3. 服务器收到请求后，比较资源实际修改时间和 If-Modified-Since 时间，如果时间未变，则返回 304 Not Modified 响应，浏览器直接使用本地缓存。

### ETag（内容指纹）

ETag/If-None-Match 是基于文件的内容指纹来判断缓存是否有效。

ETag 是服务器为资源生成的唯一标识符（一个字符串，通常是资源内容的哈希值）。

工作流程：

1. 第一次请求时，服务器返回资源和其 ETag 值。
2. 后续请求时，浏览器在请求头中带上 If-None-Match 字段，包含之前获取的 ETag 值。
3. 服务器比较资源的 ETag 和请求中的 ETag。如果两者一致，则返回 304 Not Modified 响应；如果不一致，则返回新版本的资源。

```http
ETag: "68b7e613-510"

If-None-Match: "68b7e613-510"
```

### Last-Modified vs ETag

ETag比Last-Modified更精确，因为Last-Modified的时间单位是秒，而ETag可以通过算法保证每次修改都能不同。

ETag比Last-Modified更精确，Last-Modified的时间单位是秒，如果某个文件在1秒内改变了多次，其Last-Modified可能无法体现出实际修改。ETag则每次都能改变，保证了精度。

ETag的性能不如Last-Modified，因为Last-Modified只需要记录时间，而ETag需要服务器通过算法计算哈希值。

当同时使用时，服务器会优先考虑ETag进行协商缓存。

## 强缓存+协商缓存组合运行流程

在实际项目中，我们通常同时配置强缓存和协商缓存，以达到最佳的性能效果。下面详细描述这种组合策略的完整运行流程。

### 典型的缓存配置

```http
# 服务器响应头（同时设置强缓存和协商缓存）
HTTP/1.1 200 OK
Cache-Control: public, max-age=3600        # 强缓存1小时
ETag: "v1.0-abc123"                        # 协商缓存（ETag）
Last-Modified: Wed, 03 Sep 2025 06:54:11 GMT  # 协商缓存（时间）
Expires: Wed, 03 Sep 2025 07:54:11 GMT     # 强缓存备选（兼容性）
```

### 完整的缓存决策流程

```
用户请求资源 (GET /app.js)
      ↓
浏览器检查本地缓存
      ↓
   本地是否有缓存？
    ├─ 否 → 发送请求到服务器（首次访问）
    └─ 是 ↓
      ↓
检查强缓存是否有效？
├─ Cache-Control: max-age 未过期
│  └─ 直接返回缓存 (200 from cache) 【最快路径】
├─ Cache-Control: no-cache 
│  └─ 跳过强缓存，直接进入协商缓存
└─ 强缓存过期 ↓
      ↓
检查是否有协商缓存标识？
├─ 无ETag也无Last-Modified
│  └─ 发送普通请求到服务器
└─ 有协商缓存标识 ↓
      ↓
发送条件请求到服务器
GET /app.js HTTP/1.1
If-None-Match: "v1.0-abc123"           # 优先使用ETag
If-Modified-Since: Wed, 03 Sep 2025 06:54:11 GMT
      ↓
服务器验证资源是否变化
├─ ETag匹配 且 文件未修改
│  ├─ 返回：304 Not Modified
│  ├─ 响应头：ETag: "v1.0-abc123"
│  ├─ 响应头：Cache-Control: public, max-age=3600 (重新开始强缓存)
│  └─ 浏览器：继续使用本地缓存 + 重置强缓存计时器
└─ ETag不匹配 或 文件已修改
   ├─ 返回：200 OK + 新内容
   ├─ 响应头：ETag: "v2.0-def456" (新的ETag)
   ├─ 响应头：Cache-Control: public, max-age=3600 (新的强缓存)
   └─ 浏览器：更新本地缓存 + 开始新的强缓存周期
```

### 实际运行时间线示例

以一个CSS文件为例，展示强缓存+协商缓存的完整生命周期：

```
时间点 0分钟：【首次请求】
├─ 请求：GET /style.css
├─ 响应：200 OK (1.2KB)
│   ├─ Cache-Control: public, max-age=3600 (1小时强缓存)
│   ├─ ETag: "css-v1.0"
│   └─ Last-Modified: Wed, 03 Sep 2025 06:54:11 GMT
├─ 耗时：200ms
└─ 结果：建立缓存，开始1小时强缓存期

时间点 30分钟：【强缓存期内】
├─ 请求：GET /style.css
├─ 浏览器检查：强缓存未过期 ✅
├─ 响应：200 (from disk cache)
├─ 耗时：0ms ⚡️
└─ 结果：直接使用本地缓存，无网络请求

时间点 70分钟：【强缓存过期，文件未变化】
├─ 请求：GET /style.css
├─ 浏览器检查：强缓存已过期 ❌
├─ 发送条件请求：
│   ├─ If-None-Match: "css-v1.0"
│   └─ If-Modified-Since: Wed, 03 Sep 2025 06:54:11 GMT
├─ 服务器验证：文件未修改 ✅
├─ 响应：304 Not Modified
│   ├─ ETag: "css-v1.0" (相同)
│   └─ Cache-Control: public, max-age=3600 (重新开始1小时)
├─ 耗时：50ms
└─ 结果：继续使用本地缓存 + 重新开始强缓存计时

时间点 150分钟：【强缓存过期，文件已更新】
├─ 请求：GET /style.css
├─ 浏览器检查：强缓存已过期 ❌
├─ 发送条件请求：
│   ├─ If-None-Match: "css-v1.0"
│   └─ If-Modified-Since: Wed, 03 Sep 2025 06:54:11 GMT
├─ 服务器验证：文件已修改 ❌
├─ 响应：200 OK (1.5KB 新内容)
│   ├─ ETag: "css-v2.0" (新版本)
│   ├─ Last-Modified: Wed, 03 Sep 2025 08:30:15 GMT
│   └─ Cache-Control: public, max-age=3600 (新的1小时周期)
├─ 耗时：180ms
└─ 结果：更新本地缓存 + 开始新的强缓存周期
```

## 实战案例分析

让我们通过两个真实URL来理解不同的缓存策略：

### 案例一：纯协商缓存策略

**URL**: `https://ditto.res.wooyavip.com/build_v/index.html`

**响应头分析**：
```http
HTTP/2 200
server: nginx/1.27.4
last-modified: Wed, 03 Sep 2025 06:54:11 GMT
etag: "68b7e613-510"
# 注意：没有 Cache-Control 或 Expires
```

**缓存特点**：
- ❌ 没有强缓存配置，缺少 Cache-Control 或 Expires
- ✅ 支持协商缓存，设置了 ETag 和 Last-Modified
- 🔧 使用 Nginx 服务器

**工作流程**：
```
1. 首次请求 → 服务器返回完整内容 + 缓存标识
   Response: 200 OK
   Content: HTML内容
   ETag: "68b7e613-510"
   Last-Modified: Wed, 03 Sep 2025 06:54:11 GMT

2. 后续请求 → 浏览器发送条件请求
   Request Headers:
   If-None-Match: "68b7e613-510"
   If-Modified-Since: Wed, 03 Sep 2025 06:54:11 GMT

3. 服务器响应 → 基于条件判断
   - 未修改: 304 Not Modified (空响应体)
   - 已修改: 200 OK (新内容)
```

### 案例二：强缓存+协商缓存组合策略

**URL**: `https://res.sayyouditto.com/build_v/index.html`

**响应头分析**：
```http
HTTP/2 200
server: cloudflare
cache-control: public, max-age=30
last-modified: Wed, 03 Sep 2025 07:26:17 GMT
cf-cache-status: DYNAMIC
x-qiniu-zone: as0
```

**缓存特点**：
- ✅ 支持强缓存，设置了 Cache-Control: public, max-age=30，明确30秒缓存策略
- ✅ 支持协商缓存，设置了 last-modified: Wed, 03 Sep 2025 07:26:17 GMT，强缓存过期后启用协商缓存
- 🔧 使用 Cloudflare CDN 加速和 x-qiniu-zone 七牛云存储标识


**工作流程**：
```
阶段一：强缓存期内（0-30秒）
1. 首次请求 → 正常获取内容
   Response: 200 OK
   Cache-Control: public, max-age=30
   Last-Modified: Wed, 03 Sep 2025 07:26:17 GMT

2. 30秒内再次请求 → 直接使用本地缓存
   浏览器: 200 (from disk cache)
   网络请求: 无

阶段二：强缓存过期后（30秒后）
3. 缓存过期请求 → 发送条件请求
   Request Headers:
   If-Modified-Since: Wed, 03 Sep 2025 07:26:17 GMT

4. 服务器响应 → 协商缓存生效
   - 未修改: 304 Not Modified
   - 已修改: 200 OK + 新的Cache-Control
```

## 缓存策略最佳实践

### 1. 根据资源类型制定策略

**HTML文件**：
```http
# 方案一：不缓存（确保实时性）
Cache-Control: no-cache

# 方案二：短期缓存（平衡性能和实时性）
Cache-Control: public, max-age=300
```

**CSS/JS文件**：
```http
# 版本控制 + 长期缓存
Cache-Control: public, max-age=31536000  # 1年
# 文件名：app.v1.2.3.css
```

**图片资源**：
```http
# 中长期缓存
Cache-Control: public, max-age=86400  # 1天
```

**API数据**：
```http
# 根据数据特性调整
Cache-Control: private, max-age=300  # 用户相关数据，5分钟
Cache-Control: public, max-age=3600  # 公共配置，1小时
Cache-Control: no-store              # 敏感数据，不缓存
```

### 2. Nginx配置示例

```nginx
# 静态资源长期缓存
location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, max-age=31536000";
    add_header Vary Accept-Encoding;
}

# HTML文件短期缓存
location ~* \.html$ {
    expires 5m;
    add_header Cache-Control "public, max-age=300";
}

# API接口缓存
location /api/ {
    expires 10m;
    add_header Cache-Control "private, max-age=600";
}
```

### 3. Node.js/Express配置示例

```javascript
const express = require('express');
const app = express();

// 静态资源配置
app.use('/static', express.static('public', {
  maxAge: '1y',
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'public, max-age=300');
    }
  }
}));

// API缓存配置
app.get('/api/config', (req, res) => {
  res.set('Cache-Control', 'public, max-age=3600');
  res.json({ config: 'data' });
});

app.get('/api/user/:id', (req, res) => {
  res.set('Cache-Control', 'private, max-age=300');
  res.json({ user: 'data' });
});

// 实时数据不缓存
app.get('/api/realtime', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ timestamp: Date.now() });
});
```
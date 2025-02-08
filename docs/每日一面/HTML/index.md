# HTML

## 1. HTML语义化

- 1. 让页面的内容结构化，便于对浏览器、搜索引擎解析
  
- 2. 搜索引擎的爬虫依赖，利于SEO

## 2. iframe的优缺点

iframe元素是包含另一个文档的内联框架，即行内框架。

**缺点：**
- 会阻塞主页面的 Onload 加载事件
- 搜索引擎无法检索，不利于 SEO
- 浏览器后退按钮失效
- 共享连接池，影响页面的并行加载

## 3. src和href的区别

src用于引用资源，替换当前元素；href用于在当前文档和引用资源之间确立联系。

- src表示引用资源，用于img、script、iframe上
- href标识超文本引用，用在link、a上

## 4. HTML5有哪些新特性

- 拖拽释放(Drag and drop) API

- 语义化更好的内容标签（header,nav,footer,aside,article,section）

- 音频、视频 API(audio,video)

- 画布(Canvas) API

- 地理(Geolocation) API

- 本地离线存储 localStorage 长期存储数据，浏览器关闭后数据不丢失；

- sessionStorage 的数据在浏览器关闭后自动删除

- 表单控件，calendar、date、time、email、url、search

- 新的技术 webworker, websocket, Geolocation

## 5. HTML5的离线存储

在用户没有与因特网连接时，可以正常访问站点或应用，在用户与因特网连接时，更新用户机器上的缓存文件。

原理：HTML5 的离线存储是基于一个新建的.appcache 文件的缓存机制(不是存储技术)，通过这个文件上的解析清单离线存储资源，这些资源就会像 cookie 一样被存储了下来。之后当网络在处于离线状态下时，浏览器会通过被离线存储的数据进行页面展示。

## 6. Canvas 和 SVG 有什么区别

- Canvas 是一种通过 JavaScript 来绘制 2D 图形的方法。Canvas 是逐像素来进行渲染的，因此当我们对 Canvas 进行缩放时，
    会出现锯齿或者失真的情况。
    
- SVG 是一种使用 XML 描述 2D 图形的语言。SVG 基于 XML，这意味着 SVG DOM 中的每个元素都是可用的。我们可以为某个元素
    附加 JavaScript 事件监听函数。并且 SVG 保存的是图形的绘制方法，因此当 SVG 图形缩放时并不会失真。

## 7. meta viewport 原理是什么

meta viewport 标签的作用是让当前 viewport 的宽度等于设备的宽度，同时不允许用户进行手动缩放

viewport的原理：移动端浏览器通常都会在一个比移动端屏幕更宽的虚拟窗口中渲染页面，这个虚拟窗口就是 viewport; 目的是正常展示没有做移动端适配的网页，让他们完整的展示给用户

## 8. HTML5存储类型的区别

HTML5 提供了几种存储类型，主要包括 localStorage、sessionStorage 和 IndexedDB

| 存储类型 | 持久性 | 存储大小 | 作用域 | 使用场景 |
|----------------|----------------------------|------------------|----------------------------|------------------------------------|
| localStorage | 数据在浏览器关闭后仍然存在 | 5-10MB（取决于浏览器） | 同源下共享 | 存储用户偏好设置、主题等长期数据 |
| sessionStorage | 数据仅在当前会话中存在 | 5-10MB（取决于浏览器） | 仅在同一标签页或窗口中可用 | 存储临时数据，如表单输入、用户会话信息 |
| IndexedDB | 数据在浏览器关闭后仍然存在 | 数百MB或更多（取决于浏览器） | 同源下共享 | 存储大量结构化数据，如离线应用、复杂数据查询 |

**总结：**
- localStorage：持久存储，适合长期数据。
- sessionStorage：会话存储，适合临时数据。
- IndexedDB：适合存储大量结构化数据，支持复杂查询。

## 9. 行内元素和块级元素有什么区别

### 行内元素（Inline Elements）

不会在前后产生换行，只占据内容所需的宽度。常见元素有`<span>`、`<a>`、`<strong>`、`<em>`、`<img>`

### 块级元素（Block Elements）

会在前后产生换行，通常占据一整行的宽度。常见元素有`<div>`、`<h1>`、 `<p>`、`<ul>`、`<header>`

## 10. async和defer的区别

- 脚本没有 defer 或 async，浏览器会立即加载并执行指定的脚本，也就是说不等待后续载入的文档元素，读到就加载并执
        行。

- defer 属性表示延迟执行引入的 JavaScript，即这段 JavaScript 加载时 HTML 并未停止解析，这两个过程是并行的。
        当整个 document 解析完毕后再执行脚本文件，在 DOMContentLoaded 事件触发之前完成。多个脚本按顺序执行。

- async 属性表示异步执行引入的 JavaScript，与 defer 的区别在于，如果已经加载好，就会开始执行，也就是说它的执
        行仍然会阻塞文档的解析，只是它的加载过程不会阻塞。多个脚本的执行顺序无法保证。
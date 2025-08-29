# 性能优化

## 浏览器渲染原理

要了解web性能，我们需要先了解浏览器渲染原理。

## 性能测量

如何衡量性能？有以下三个方法：

- chrome 自带的 Performance 面板
- Performance API
- 第三方检查工具

## Chrome Performance 面板



![Performance API](/public/assets/performance_1.png)

这个就是默认的 Performance 面板。下面是一些关键指标：

### Core Web Vitals 核心指标

#### LCP (Largest Contentful Paint) - 最大内容绘制

LCP是指报告视口内可见的最大图片、文本块或视频的渲染时间（相对于用户首次导航到网页的时间）。

**评判标准：**
- **优秀**：≤ 2.5秒
- **需要改进**：2.5-4.0秒  
- **较差**：> 4.0秒

**优化方法：**
- 优化服务器响应时间
- 预加载关键资源
- 压缩和优化图片
- 使用CDN加速
- 移除渲染阻塞的资源

#### CLS (Cumulative Layout Shift) - 累积布局偏移

CLS测量页面加载过程中所有意外布局偏移的累计分数，反映页面视觉稳定性。

**评判标准：**
- **优秀**：≤ 0.1
- **需要改进**：0.1-0.25
- **较差**：> 0.25

**优化方法：**
- 为图片和视频设置尺寸属性
- 为动态内容预留空间
- 避免在现有内容上方插入内容
- 使用font-display属性处理字体加载

#### INP (Interaction to Next Paint) - 交互到下次绘制

INP测量用户与页面交互（点击、按键、触摸）到浏览器下次绘制之间的延迟时间，评估页面的交互响应性。

**评判标准：**
- **优秀**：≤ 200毫秒
- **需要改进**：200-500毫秒
- **较差**：> 500毫秒

**优化方法：**
- 减少JavaScript执行时间
- 优化事件处理函数
- 使用Web Workers处理繁重任务
- 避免长任务阻塞主线程
- 优化第三方脚本

### 操作界面

接下来让我们来熟悉 Performance 的操作面板。

#### 顶部控制面板

![Performance 操作面板](/public/assets/performance_2.png)

顶部控制面板从左到右依次是：

- 录制按钮（圆形按钮）：开始/停止性能录制，一般用于录制页面交互过程的性能变化数据，选择任意想要测试的过程，点击"Record"，并在测量结束之后，点击"Stop"，之后Chrome就会自动解析这段时间内抓取的数据，并生成报告。
- 重新录制按钮（刷新图标）：一般用于录制首屏加载的性能变化数据，它会自动刷新整个页面，并开始记录性能。
- 清除按钮（垃圾桶图标）：清除所有记录的数据。
- 上下箭头：用于上传和下载每一次性能检测报告
- Screenshots(截图)：是否截图，勾选后在录制过程中自动截取页面截图，可以观察到不同时间点的视觉变化
- Memory(内存)：是否同时录制内存使用情况，勾选后会显示堆内存、文档数量、DOM节点数等信息
- Dim 3rd parties(淡化第三方脚本)：是否淡化第三方脚本，勾选后可以更清晰地关注自己网站的性能问题

#### 性能控制面板

![Performance 性能限制设置](/public/assets/performance_3.png)

- CPU节流：限制CPU使用率，模拟低端设备性能
- Network：限制网络速度，模拟不同网络环境
- show custom tracks：是否显示自定义性能轨道
- Enable advanced paint instrumentation(slow)：记录渲染时间的细节
- Enable CSS selector stats(slow)：记录CSS选择器的统计信息

#### 录制面板

当我们选择录制或者重新录制的时候，在完成录制之后会弹出该面板。

![Performance 录制面板](/public/assets/performance_4.png)

##### 左侧面板

**顶部标签区**

- Insights: 智能分析结果，提供性能优化建议
- Annotations: 注释功能，可以添加自定义标记

**中间数值区**

LCP/INP/CLS数值显示: 直接显示三大核心性能指标的测量结果（上文有讲到）

**性能分析板块**

- LCP by phase：分析LCP各个阶段的耗时分布
- Render blocking requests：识别阻塞渲染的关键资源
- Network dependency tree：显示资源加载的依赖关系图
- Improve image delivery：图片优化建议，显示可节省的文件大小
- 3rd parties：第三方脚本性能影响分析
- Use efficient cache lifetimes：缓存策略优化建议
- Legacy JavaScript：检测可移除的未使用JavaScript代码

##### 右侧面板

**概览面板**

概览面板主要是对页面表现行为的一个概述，区域由三个图形记录组成。

- FPS（Frames Per Second）:绿色的柱越高， FPS 值也越高。FPS 图表上方的红色小块指明了长帧(long frame)，这些可能是卡顿。
- CPU(CPU Resources):这个面积图(area chart)表明了哪种事件在消耗 CPU 资源。
- NET:每种不同颜色的条代表一种资源。条越长表明获取该资源所花的时间越长
> 每个条中的浅色部分代表等待时间（资源请求被发送到收到第一个响应字节的时间），深色部分代表文件传输时间（从收到第一个字节到这个资源完全被下载好

> 蓝色 代表 HTML 文件，黄色 代表 Script 文件，紫色 代表 Stylesheets 文件， 绿色 代表 Media 文件，灰色 代表其他资源。

**火焰图（详细轨道区域）**

火焰图（Flame Chart）是可视化 CPU 堆栈(stack)的信息记录。

这里可以从不同的角度分析框选区域。例如：Network、Frames、Interactions等。

- Network网络轨道：每个横条代表一个网络请求，长度表示请求耗时，颜色区分资源类型（HTML、CSS、JS、图片等）
- Frames 帧轨道：绿色条表示帧渲染，红色表示掉帧，帧率信息
- Animations 动画轨道：显示CSS动画和过渡效果
- Timings 时机轨道：关键性能节点标记，如FCP、LCP等Web Vitals指标
- Main 主线程轨道：显示主线程活动，JavaScript执行、样式计算、布局等，不同颜色代表不同类型的任务
- Thread pool 线程池：显示Web Worker等后台线程活动
- GPU 图形处理轨道：显示GPU相关的渲染活动

**底部详情区域**

![Performance 底部详情](/public/assets/performance_5.png)

底部详情区域显示了当前选中的时间线区域内的详细信息。并提供了导航标记。具体有：

- Nav(Navigation Start)：导航开始时间，页面开启加载的起始点，所有其它性能指标的时间基准点
- FCP(First Contentful Paint)：首次内容绘制，页面首次绘制任何文本、图片或其它内容的时间点，用户首次看到页面有内容的时刻
- DCL(DOMContentLoaded)：DOM内容加载完成，HTML文档完全加载和解析完成的时间点，不等待样式表、图片等资源，纯DOM结构就绪
- L(Load Event)：页面完全加载事件，所有资源（图片、样式、脚本等）都加载完成的时间点，window.onload事件触发时刻
- LCP(Largest Contentful Paint)：最大内容绘制，视口内最大元素完成渲染的时间点，Core Web Vitals指标之一

其中，`Nav → FCP `是白屏时间，`FCP → LCP`是内容加载完善过程，`DCL`是 JavaScript可以安全操作DOM的时间点，`L`是页面完全加载时间。

**Summary**

从宏观层面概括了浏览器加载的总时间，主要记录了各个阶段的名称、占用时间、颜色信息。这里一般来说，需要着重关注的有两个：一是黄色的区域，代表脚本执行时间，另一个是紫色的渲染时间。

- 颜色：蓝色 ；英文：Loading；含义：加载
- 颜色：黄色 ；英文：Scripting；含义：脚本
- 颜色：紫色 ；英文：Rendering；含义：渲染
- 颜色：绿色 ；英文：Painting；含义：绘制
- 颜色：深灰 ；英文：Other；含义：其他
- 颜色：浅灰 ；英文：Idle；含义：空闲

**Bottom-Up**

Bottom-Up 是自底向上分析，按耗时排序，一共有三列数据。

- Self Time：代表任务自身执行所消耗的时间。
- Total Time：代表此任务及其调用的附属子任务一共消耗的时间。
- Activity：具体的活动，部分带有Source Map链接，可以直接定位到花费时间的具体源码，方便我们进行定位和优化。Activity中也有标注各自的颜色，和Summary中颜色是对应的。可以根据颜色快速判断是脚本执行、加载、还是渲染过程。

**Call-Tree**

Bottom-Up类似事件冒泡，Call Tree类似事件捕获。自上而下的Call-Tree更符合我们的人类正常思维，可以更直观地分析浏览器对页面的build精确到毫秒级的情况

**Event-Log**

展示所有阶段包括loading、javascripting、rendering、painting中各事件的耗时情况，并提供了filter输入框和按钮供你快速过滤，常见的优化级别中一般用不到它。

## Performance API

Performance API 是浏览器提供的一组 API，用于测量和分析网页的性能。

## LightHouse 第三方检查

LightHouse 是一个第三方检查工具，用于检查网页的性能。

## 性能优化
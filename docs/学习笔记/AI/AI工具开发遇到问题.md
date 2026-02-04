# AI工具开发遇到问题

在写一个AI工具，前端使用React，后端使用Next.js。这里记录下开发过程中遇到的问题及解决方案。

## 墙的问题

因为 Gemini 在国内无法访问，需要使用代理。但是项目使用了 Node 发送请求，无法走本地 VPN，需要代码显式配置或者修改 IP 映射。同时考虑到后面部署也存在这个问题，就研究出一套解决方案：**Cloudflare Workers**

Cloudflare 是一家全球网络服务商，提供 CDN、DNS、WAF、DDoS 防护、AI 代理等服务。这里我们使用到它的 Workers 服务。

使用 Workers 的好处是：它可以避开国内无法直接访问 gemini.google.com 的问题。因为 Workers 运行在 Cloudflare 的全球节点上，相当于一个海外代理，而且比 Page Rules 更强大。

- 1. 创建 Worker 脚本

  - 注册并登录 Cloudflare 控制台，点击左侧的“Workers & Pages”

  - 点击“创建应用程序”，选择“Hello World”模板，删除原有代码，粘贴以下代码：

  ```javascript
  export default {
    async fetch(request, env, ctx) {
      const url = new URL(request.url);
      // 将你的子域名请求转发到 Gemini 官网
      url.host = 'gemini.google.com';
      
      const newRequest = new Request(url.toString(), {
        method: request.method,
        headers: request.headers,
        body: request.body,
        redirect: 'follow'
      });

      return fetch(newRequest);
    },
  };
  ```

  - 点击保存并部署版本。

- 2. 绑定子域名

  - 代码部署好后，需要把这个脚本挂载到自己的域名上

  - 回到刚才创建的 Worker 页面，点击“设置”，在域和路由点击“添加”，添加自定义域

  - 输入我们的子域名 "ai.hongyingxin.com"，保存。因为 Cloudflare 会自动添加 DNS 解析记录

- 3. 修改 DNS 解析

  - 在 Cloudflare 控制台，点击左侧的“域”选项，选择“加入域”，添加 "hongyingxin.com" 域名，

  - 然后点击我们的域名进入域名配置，点击右侧的“DNS”，进入记录页面，向下滚动找到 Cloudflare 名称服务器，获取到两个 DNS 地址

  - 在阿里云域名控制台，找到 "hongyingxin.com" 域名，点击进行 DNS 管理下面的 DNS 修改，修改 DNS 服务器，修改为自定义 DNS 并添加上面提到的两个地址，保存同步。

到此，我们的配置就完成了。阿里云通过修改 DNS 记录，交出所有权限到 Cloudflare。

以后增加子域名等操作到 Cloudflare 上配置，阿里云则负责端口等安全组。

访问网站路线图如下：

- 用户浏览器 访问 ai.hongyingxin.com。
- 根域名服务器 问阿里云：“这个域名归谁管？”
- 阿里云 回答：“我只负责收钱，解析请去问 Cloudflare。” (这就是你改 NS 的作用)
- Cloudflare 接手：“ai 这个子域名在我这里有记录，它是一个 Worker，请执行以下代码...”
- 结果：页面成功打开。
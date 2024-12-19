import { defineConfig } from 'vitepress'

export default defineConfig({
  base: 'hongyingxin.github.io',
  title: "我的博客",
  description: "我的个人博客网站",
  
  // 主题配置
  themeConfig: {
    // 导航栏
    nav: [
      { text: '首页', link: '/' },
      { text: '文章', link: '/articles/' },
    ],

    // 社交链接
    socialLinks: [
      { icon: 'github', link: 'https://github.com/你的用户名' }
    ]
  }
})

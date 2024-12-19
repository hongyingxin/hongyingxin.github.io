import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/',
  title: "洪英鑫的博客",
  description: "个人技术博客",
  
  // 主题配置
  themeConfig: {
    // 导航栏
    nav: [
      { text: '首页', link: '/' },
      { text: '文章', link: '/articles/' },
    ],

    // 社交链接
    socialLinks: [
      { icon: 'github', link: 'https://github.com/hongyingxin' }
    ],
  }
})

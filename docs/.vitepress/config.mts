import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/',
  title: "三寸光阴一个鑫",
  description: "个人技术博客",
  
  // 主题配置
  themeConfig: {
    // 导航栏
    nav: [
      { text: '首页', link: '/' },
      { text: '随笔', 
        items: [
          { text: '文章', link: '/随笔/index.md' },
        ]
      },
      { text: '每日一面', 
        items: [
          { text: 'HTML', link: '/每日一面/HTML/' },
          { text: 'CSS', link: '/每日一面/CSS/' },
          { text: 'Vue', link: '/每日一面/Vue/' },
        ]
      },
      { text: '学习笔记',
        items: [
          { text: 'JavaScript', link: '/学习笔记/JavaScript/' },
          { text: 'React', link: '/学习笔记/React/' },
          { text: 'Vue', link: '/学习笔记/Vue/' },
        ]
      }
    ],

    // 社交链接
    socialLinks: [
      { icon: 'github', link: 'https://github.com/hongyingxin' }
    ],
  }
})

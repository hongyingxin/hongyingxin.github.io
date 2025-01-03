// import { defineConfig } from 'vitepress'

// 导入生成配置工具方法
import { defineConfig, getThemeConfig } from '@sugarat/theme/node'

// 主题独有配置，所有配置项，详见文档: https://theme.sugarat.top/
const blogThemeConfig = getThemeConfig({
  // 关闭搜索
  search: false,
  // 关闭深色模式过渡动画
  darkTransition: false,
  // 友情链接
  friend: [
    {
      nickname: '粥里有勺糖',
      des: '你的指尖用于改变世界的力量',
      avatar:
        'https://img.cdn.sugarat.top/mdImg/MTY3NDk5NTE2NzAzMA==674995167030',
      url: 'https://theme.sugarat.top/'
    },
  ]
})

export default defineConfig({
  // 继承博客主题配置
  extends: blogThemeConfig,
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
          { text: '搭建个人博客', link: '/随笔/vlog.md' },
          { text: '翻译导出工具', link: '/随笔/excel.md' },
          { text: '组件库开发指南', link: '/随笔/组件库开发指南.md' },
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

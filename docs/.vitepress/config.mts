// import { defineConfig } from 'vitepress'

// 导入生成配置工具方法
import { defineConfig, getThemeConfig } from '@sugarat/theme/node'

// 主题独有配置，所有配置项，详见文档: https://theme.sugarat.top/
const blogThemeConfig = getThemeConfig({
  // 开启搜索
  // search: true,
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
  
  // 忽略死链接检查
  ignoreDeadLinks: false,
  
  // 主题配置
  themeConfig: {
    // 导航栏
    nav: [
      { text: '首页', link: '/' },
      { text: '随笔', 
        items: [
          { text: '组件库', link: '/components/index.md' },
          { text: 'Git', link: '/git/index.md' },
        ]
      },
      { text: '每日一面', 
        items: [
          { text: 'HTML', link: '/每日一面/HTML/' },
          { text: 'CSS', link: '/每日一面/CSS/' },
          { text: 'JavaScript', link: '/每日一面/JavaScript/' },
          { text: 'Vue', link: '/每日一面/Vue/' },
          { text: 'React', link: '/每日一面/React/' },
          { text: '网络', link: '/每日一面/网络/' },
          { text: '工程化', link: '/每日一面/工程化/' },
          
        ]
      },
      { text: '学习笔记', 
        // link: '/学习笔记/index.md'
        items: [
          { text: '首页', link: '/学习笔记/' },
          { text: 'JavaScript', link: '/学习笔记/JavaScript/' },
          { text: 'React', link: '/学习笔记/React/' },
          { text: 'Vue', link: '/学习笔记/Vue/' },
          { text: 'TypeScript', link: '/学习笔记/TypeScript/' },
          { text: 'Electron', link: '/学习笔记/Electron/' },
          { text: 'Nuxt', link: '/学习笔记/Nuxt/' },
          { text: 'Nest', link: '/学习笔记/Nest/' },
          { text: '性能优化', link: '/学习笔记/性能优化/' },
          { text: '工程化', link: '/学习笔记/工程化/' },
        ]
      },
    ],

    // 社交链接
    socialLinks: [
      { icon: 'github', link: 'https://github.com/hongyingxin' }
    ],
  },
  // vite配置
  vite: {
    server: {
      port: 10086,
    },
    // 配置静态资源处理
    assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg'],
    // 配置别名，让图片路径更简单
    resolve: {
      alias: {
        '@assets': '/public/assets'
      }
    }
  },
})

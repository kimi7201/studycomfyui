import { defineConfig } from 'vitepress'

const isGhPages = Boolean(process.env.GITHUB_PAGES)
const github = 'https://github.com/your-username/studycomfyui'

export default defineConfig({
  lang: 'zh-CN',
  title: 'StudyComfyUI',
  description: '看懂 ComfyUI 工作流，改出属于自己的工作流 —— 学中做，做中学',
  base: isGhPages ? '/studycomfyui/' : '/',
  cleanUrls: true,
  lastUpdated: true,
  vite: { build: { emptyOutDir: false } },
  head: [
    ['meta', { name: 'theme-color', content: '#0a0e1a' }],
    ['link', { rel: 'icon', href: `${isGhPages ? '/studycomfyui' : ''}/favicon.svg`, type: 'image/svg+xml' }],
  ],
  locales: {
    root: {
      label: '简体中文',
      lang: 'zh-CN',
      themeConfig: {
        nav: [
          { text: '首页', link: '/' },
          { text: '快速开始', link: '/guide' },
          { text: 'English', link: '/en/' },
          { text: 'GitHub', link: github },
        ],
        footer: {
          message: '学中做，做中学 · MIT Licensed',
          copyright: 'Copyright © 2026 StudyComfyUI',
        },
        socialLinks: [{ icon: 'github', link: github }],
      },
    },
    en: {
      label: 'English',
      lang: 'en-US',
      title: 'StudyComfyUI',
      description: 'Understand ComfyUI workflows and build your own — learn by doing',
      themeConfig: {
        nav: [
          { text: 'Home', link: '/en/' },
          { text: 'Quick Start', link: '/en/guide' },
          { text: '中文', link: '/' },
          { text: 'GitHub', link: github },
        ],
        footer: {
          message: 'Learn by doing, do by learning · MIT Licensed',
          copyright: 'Copyright © 2026 StudyComfyUI',
        },
        socialLinks: [{ icon: 'github', link: github }],
      },
    },
  },
})

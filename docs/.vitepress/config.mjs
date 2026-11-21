import { defineConfig } from 'vitepress'

const isGhPages = Boolean(process.env.GITHUB_PAGES)

export default defineConfig({
  title: 'StudyComfyUI',
  description: '看懂 ComfyUI 工作流，改出属于自己的工作流 —— 学中做，做中学',
  base: isGhPages ? '/studycomfyui/' : '/',
  cleanUrls: true,
  lastUpdated: true,
  head: [
    ['meta', { name: 'theme-color', content: '#0a0e1a' }],
    ['link', { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }],
  ],
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '快速开始', link: '/guide' },
      { text: 'GitHub', link: 'https://github.com/your-username/studycomfyui' },
    ],
    footer: {
      message: '学中做，做中学 · MIT Licensed',
      copyright: 'Copyright © 2026 StudyComfyUI',
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/your-username/studycomfyui' },
    ],
  },
})

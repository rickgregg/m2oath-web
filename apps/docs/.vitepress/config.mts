import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'M2Oath Documentation',
  description: 'Developer documentation for M2Oath',
  base: '/docs/',
  themeConfig: {
    nav: [
      { text: 'Getting Started', link: '/getting-started/' }
    ]
  }
})

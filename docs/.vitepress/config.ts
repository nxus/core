import {defineConfig} from 'vitepress'

export default defineConfig({
  title: 'Nxus Core',
  description: 'Nxus Core documentation',
  themeConfig: {
    nav: [
      {text: 'Guides', link: '/guides/getting-started'},
      {text: 'API', link: '/api/'},
    ],
    sidebar: {
      '/guides/': [
        {text: 'Getting started', link: '/guides/getting-started'},
        {text: 'Architecture & core concepts', link: '/guides/architecture'},
        {text: 'Configuration', link: '/guides/configuration'},
        {text: 'Boot lifecycle', link: '/guides/boot-lifecycle'},
        {text: 'Modules', link: '/guides/modules'},
        {text: 'Application patterns', link: '/guides/application-patterns'},
        {text: 'Upgrade guide (modules v4 → v5)', link: '/guides/upgrading-v4-to-v5-modules'},
      ],
      '/api/': [{text: 'API reference', link: '/api/'}],
    },
  },
})



import { defineConfig } from 'astro/config'
import cloudflare from '@astrojs/cloudflare'
import tailwind from '@astrojs/tailwind'

export default defineConfig({
  output: 'server', // SSR mode — every request is server-rendered
  adapter: cloudflare({
    platformProxy: {
      enabled: true, // Access KV, R2, D1 bindings in dev
    },
  }),
  integrations: [tailwind()],
  vite: {
    ssr: {
      external: ['node:buffer', 'node:crypto'],
    },
  },
})

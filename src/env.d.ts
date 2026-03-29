/// <reference types="astro/client" />

type Runtime = import('@astrojs/cloudflare').Runtime<{
  SITE_CACHE: KVNamespace
  PAYLOAD_API_URL: string
  PAYLOAD_API_KEY?: string
  WEBHOOK_SECRET: string
}>

declare namespace App {
  interface Locals extends Runtime {}
}

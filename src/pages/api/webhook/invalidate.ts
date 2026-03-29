/**
 * Webhook endpoint — called by Payload CMS afterChange hooks.
 *
 * When content is updated in the CMS, this endpoint:
 * 1. Validates the webhook secret
 * 2. Invalidates the KV cache for the affected site
 * 3. Optionally pre-warms the cache with fresh data
 *
 * This is the KEY to the architecture: the frontend only talks to Payload
 * when triggered by a webhook, never on user requests.
 */

import type { APIRoute } from 'astro'
import { invalidateCache, prewarmCache } from '@/lib/resilient-fetch'

export const POST: APIRoute = async ({ request, locals }) => {
  const runtime = locals.runtime as {
    env: {
      SITE_CACHE: KVNamespace
      PAYLOAD_API_URL: string
      PAYLOAD_API_KEY?: string
      WEBHOOK_SECRET: string
    }
  }

  // Validate webhook secret
  const secret = request.headers.get('X-Webhook-Secret')
  if (secret !== runtime.env.WEBHOOK_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await request.json() as {
      type: string
      siteId?: string
      domain?: string
      pageSlug?: string
    }

    // We need the domain to invalidate KV cache.
    // If not provided directly, we could look it up, but the Payload hook sends it.
    let domain = body.domain

    if (!domain && body.siteId) {
      // Fetch domain from Payload for this siteId
      try {
        const res = await fetch(
          `${runtime.env.PAYLOAD_API_URL}/api/sites/${body.siteId}`,
          {
            headers: runtime.env.PAYLOAD_API_KEY
              ? { Authorization: `Api-Key ${runtime.env.PAYLOAD_API_KEY}` }
              : {},
          },
        )
        if (res.ok) {
          const site = await res.json() as { domain: string }
          domain = site.domain
        }
      } catch {
        // If we can't look up the domain, we can't invalidate
      }
    }

    if (!domain) {
      return new Response(JSON.stringify({ error: 'Domain not resolved' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Invalidate old cache
    await invalidateCache(domain, runtime.env)

    // Pre-warm with fresh data
    const warmed = await prewarmCache(domain, runtime.env)

    return new Response(
      JSON.stringify({
        success: true,
        domain,
        type: body.type,
        prewarmed: warmed,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Invalid request body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }
}

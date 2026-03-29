/**
 * Form submission endpoint.
 * Forwards contact form data to Payload CMS form-submissions collection.
 * If Payload is down, stores in KV for later retry.
 */

import type { APIRoute } from 'astro'

export const POST: APIRoute = async ({ request, locals }) => {
  const runtime = locals.runtime as {
    env: {
      SITE_CACHE: KVNamespace
      PAYLOAD_API_URL: string
      PAYLOAD_API_KEY?: string
    }
  }

  try {
    const body = await request.json() as {
      siteId: string
      page: string
      data: Record<string, string>
    }

    if (!body.siteId || !body.data) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 })
    }

    // Try to submit to Payload CMS
    try {
      const res = await fetch(`${runtime.env.PAYLOAD_API_URL}/api/form-submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(runtime.env.PAYLOAD_API_KEY
            ? { Authorization: `Api-Key ${runtime.env.PAYLOAD_API_KEY}` }
            : {}),
        },
        body: JSON.stringify({
          site: body.siteId,
          page: body.page,
          data: body.data,
        }),
        signal: AbortSignal.timeout(5000),
      })

      if (res.ok) {
        return new Response(JSON.stringify({ success: true }), { status: 200 })
      }
    } catch {
      // Payload is down — queue in KV for later processing
    }

    // Fallback: store in KV for retry
    const key = `form-queue:${body.siteId}:${Date.now()}`
    await runtime.env.SITE_CACHE.put(key, JSON.stringify(body), {
      expirationTtl: 60 * 60 * 24 * 7, // Keep for 7 days
    })

    return new Response(JSON.stringify({ success: true, queued: true }), { status: 200 })
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 })
  }
}

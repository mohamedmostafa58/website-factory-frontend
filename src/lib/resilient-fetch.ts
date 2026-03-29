/**
 * Resilient Fetch Utility
 *
 * Strategy:
 * 1. Try to fetch from Payload CMS API
 * 2. On success → save to Cloudflare KV cache → return fresh data
 * 3. On failure → return cached data from KV → site stays up even if CMS is down
 *
 * The frontend NEVER crashes due to CMS unavailability.
 */

import type { SiteBundle } from './types'

interface Env {
  SITE_CACHE: KVNamespace   // Cloudflare KV binding
  PAYLOAD_API_URL: string   // e.g. "https://cms.yourfactory.com"
  PAYLOAD_API_KEY?: string  // Optional API key for authenticated reads
}

const CACHE_TTL = 60 * 60 * 24 * 30 // 30 days — KV cache is our safety net
const STALE_THRESHOLD = 60 * 1000    // 60 seconds — consider data stale after this

function kvKey(domain: string): string {
  return `site-bundle:${domain}`
}

/**
 * Fetch site bundle with resilient caching.
 * Returns cached data if API is unreachable.
 */
export async function fetchSiteBundle(
  domain: string,
  env: Env,
): Promise<{ bundle: SiteBundle | null; fromCache: boolean; error?: string }> {
  const cacheKey = kvKey(domain)

  // Step 1: Try live fetch from Payload CMS
  try {
    const apiUrl = `${env.PAYLOAD_API_URL}/api/site-bundle/${encodeURIComponent(domain)}`
    const headers: Record<string, string> = {
      Accept: 'application/json',
    }
    if (env.PAYLOAD_API_KEY) {
      headers['Authorization'] = `Api-Key ${env.PAYLOAD_API_KEY}`
    }

    const response = await fetch(apiUrl, {
      headers,
      signal: AbortSignal.timeout(5000), // 5s timeout — don't wait forever
    })

    if (response.ok) {
      const bundle: SiteBundle = await response.json()

      // Step 2: Save to KV cache (non-blocking)
      try {
        await env.SITE_CACHE.put(cacheKey, JSON.stringify(bundle), {
          expirationTtl: CACHE_TTL,
          metadata: { fetchedAt: Date.now() },
        })
      } catch {
        // KV write failure is non-fatal
      }

      return { bundle, fromCache: false }
    }

    // API returned an error status — fall through to cache
    console.error(`Payload API returned ${response.status} for domain: ${domain}`)
  } catch (err) {
    // Network error, timeout, etc. — fall through to cache
    console.error(`Payload API unreachable for domain: ${domain}`, err)
  }

  // Step 3: Fallback to KV cache
  try {
    const cached = await env.SITE_CACHE.get(cacheKey, 'text')
    if (cached) {
      const bundle: SiteBundle = JSON.parse(cached)
      return {
        bundle,
        fromCache: true,
        error: 'Served from cache — CMS may be unavailable',
      }
    }
  } catch {
    // KV read failure
  }

  // No live data AND no cache — this is the only scenario where we have nothing
  return {
    bundle: null,
    fromCache: false,
    error: 'Site not found and no cached data available',
  }
}

/**
 * Fetch a single page by slug with caching.
 * Uses the bundle's pages array, so this is just a convenience wrapper.
 */
export function findPageInBundle(
  bundle: SiteBundle,
  slug: string,
): import('./types').Page | undefined {
  if (!slug || slug === '/' || slug === '') {
    return bundle.pages.find((p) => p.isHomePage) ?? bundle.pages[0]
  }
  const normalizedSlug = slug.replace(/^\/+|\/+$/g, '')
  return bundle.pages.find((p) => p.slug === normalizedSlug)
}

/**
 * Invalidate cached data for a domain.
 * Called by the webhook endpoint when Payload notifies of changes.
 */
export async function invalidateCache(
  domain: string,
  env: Env,
): Promise<void> {
  await env.SITE_CACHE.delete(kvKey(domain))
}

/**
 * Pre-warm the cache for a domain.
 * Useful for new site setup or after deployment.
 */
export async function prewarmCache(
  domain: string,
  env: Env,
): Promise<boolean> {
  const { bundle, fromCache } = await fetchSiteBundle(domain, env)
  return bundle !== null && !fromCache
}

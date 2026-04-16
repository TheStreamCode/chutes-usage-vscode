import test from 'node:test'
import assert from 'node:assert/strict'

import { ChutesApiClient } from '../services/ChutesApiClient'

test('fetches quota usage through documented per-chute endpoints', async () => {
  const originalFetch = globalThis.fetch
  const requestedUrls: string[] = []

  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    requestedUrls.push(url)

    if (url.endsWith('/users/me/subscription_usage')) {
      return jsonResponse({ subscription: true, custom: false, monthly_price: 20 })
    }

    if (url.endsWith('/users/me/quotas')) {
      return jsonResponse({
        items: [
          { chute_id: '*', quota: 5000 },
          { chute_id: 'my-chute', quota: 250 }
        ]
      })
    }

    if (url.endsWith('/users/me/quota_usage/%2A')) {
      return jsonResponse({ used: 11, quota: 5000 })
    }

    if (url.endsWith('/users/me/quota_usage/my-chute')) {
      return jsonResponse({ used: 2, quota: 250 })
    }

    if (url.endsWith('/pricing')) {
      return jsonResponse([])
    }

    throw new Error(`Unexpected URL ${url}`)
  }) as typeof fetch

  try {
    const payload = await new ChutesApiClient('test-key').getDashboardPayload()

    assert.deepEqual(payload.quotaUsage, {
      '*': { used: 11, quota: 5000 },
      'my-chute': { used: 2, quota: 250 }
    })
    assert.ok(requestedUrls.some((url) => url.endsWith('/users/me/quota_usage/%2A')))
    assert.ok(requestedUrls.some((url) => url.endsWith('/users/me/quota_usage/my-chute')))
    assert.ok(!requestedUrls.some((url) => url.endsWith('/users/me/quota_usage/*')))
  } finally {
    globalThis.fetch = originalFetch
  }
})

// Build a minimal JSON response for fetch-based client tests.
function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

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

    if (url.endsWith('/users/me/quota_usage/me')) {
      return jsonResponse({ used: 13, quota: 5250 })
    }

    if (url.endsWith('/invocations/stats/llm')) {
      return jsonResponse([])
    }

    if (url.endsWith('/pricing')) {
      return jsonResponse([])
    }

    throw new Error(`Unexpected URL ${url}`)
  }) as typeof fetch

  try {
    const payload = await new ChutesApiClient('test-key').getDashboardPayload()

    assert.deepEqual(payload.quotaUsageFallback, {
      '*': { used: 11, quota: 5000 },
      'my-chute': { used: 2, quota: 250 }
    })
    assert.deepEqual(payload.quotaUsageMe, { used: 13, quota: 5250 })
    assert.ok(requestedUrls.some((url) => url.endsWith('/users/me/quota_usage/%2A')))
    assert.ok(requestedUrls.some((url) => url.endsWith('/users/me/quota_usage/my-chute')))
    assert.ok(requestedUrls.some((url) => url.endsWith('/users/me/quota_usage/me')))
    assert.ok(requestedUrls.some((url) => url.endsWith('/invocations/stats/llm')))
    assert.ok(!requestedUrls.some((url) => url.endsWith('/users/me/quota_usage/*')))
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('returns null fallback quota usage when quota rows have no chute ids', async () => {
  const originalFetch = globalThis.fetch

  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url

    if (url.endsWith('/users/me/subscription_usage')) {
      return jsonResponse({ subscription: true, custom: false, monthly_price: 20, daily_quota_usage: { used: 0, limit: 5000 } })
    }

    if (url.endsWith('/users/me/quotas')) {
      return jsonResponse({
        items: [
          { model: 'All Models', quota: 5000 }
        ]
      })
    }

    if (url.endsWith('/pricing')) {
      return jsonResponse([])
    }

    if (url.endsWith('/users/me/quota_usage/me')) {
      return jsonResponse({ used: 0, quota: 5000 })
    }

    if (url.endsWith('/invocations/stats/llm')) {
      return jsonResponse([])
    }

    throw new Error(`Unexpected URL ${url}`)
  }) as typeof fetch

  try {
    const payload = await new ChutesApiClient('test-key').getDashboardPayload()

    assert.equal(payload.quotaUsageFallback, null)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('prefers quota_usage me and llm stats in the dashboard payload', async () => {
  const originalFetch = globalThis.fetch
  const requestedUrls: string[] = []

  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    requestedUrls.push(url)

    if (url.endsWith('/users/me/subscription_usage')) {
      return jsonResponse({ subscription: true, custom: false, monthly_price: 20 })
    }

    if (url.endsWith('/users/me/quotas')) {
      return jsonResponse([{ chute_id: '*', quota: 2000 }])
    }

    if (url.endsWith('/users/me/quota_usage/me')) {
      return jsonResponse({ used: 380, quota: 2000 })
    }

    if (url.endsWith('/invocations/stats/llm')) {
      return jsonResponse([
        { chute_id: 'model-a', date: '2026-04-16', total_requests: 240 },
        { chute_id: 'model-b', date: '2026-04-16', total_requests: 140 }
      ])
    }

    if (url.endsWith('/pricing')) {
      return jsonResponse([])
    }

    throw new Error(`Unexpected URL ${url}`)
  }) as typeof fetch

  try {
    const payload = await new ChutesApiClient('test-key').getDashboardPayload()

    assert.deepEqual(payload.quotaUsageMe, { used: 380, quota: 2000 })
    assert.deepEqual(payload.invocationStatsLlm, [
      { chute_id: 'model-a', date: '2026-04-16', total_requests: 240 },
      { chute_id: 'model-b', date: '2026-04-16', total_requests: 140 }
    ])
    assert.ok(requestedUrls.some((url) => url.endsWith('/users/me/quota_usage/me')))
    assert.ok(requestedUrls.some((url) => url.endsWith('/invocations/stats/llm')))
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

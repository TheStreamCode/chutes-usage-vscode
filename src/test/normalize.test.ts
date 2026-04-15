import test from 'node:test'
import assert from 'node:assert/strict'

import { normalizeDashboardData, summarizeStatusBar } from '../services/normalize'
import type { JsonObject } from '../types'

test('normalizes known subscription usage and quotas for a pro account', () => {
  const subscriptionUsage: JsonObject = {
    billing_cycle_cap: {
      used: 55.339,
      limit: 100,
      remaining: 44.661,
      label: 'Billing Cycle Cap'
    },
    four_hour_window: {
      used: 0,
      limit: 8.3333,
      remaining: 8.3333,
      label: '4-Hour Window'
    },
    daily_quota_usage: {
      used: 0,
      limit: 5000,
      remaining: 5000,
      label: 'Quota Usage'
    },
    plan: {
      name: 'Pro',
      monthly_cap_usd: 100,
      four_hour_cap_usd: 8.3333,
      daily_request_limit: 5000,
      payg_discount_percent: 10
    }
  }

  const quotas: JsonObject = {
    items: [
      {
        model: 'All Models',
        quota: 5000,
        last_updated: '2026-04-09'
      }
    ]
  }

  const result = normalizeDashboardData(subscriptionUsage, quotas)

  assert.equal(result.plan?.planName, 'Pro')
  assert.equal(result.windows.length, 3)
  assert.equal(result.windows[0]?.kind, 'billing-cycle')
  assert.equal(result.windows[1]?.kind, 'rolling-4h')
  assert.equal(result.windows[2]?.kind, 'daily-requests')
  assert.equal(result.quotas[0]?.modelLabel, 'All Models')
  assert.equal(result.quotas[0]?.quota, 5000)
})

test('normalizes quotas when the API returns a top-level array', () => {
  const subscriptionUsage: JsonObject = {
    billing_cycle_cap: {
      used: 12.5,
      limit: 100,
      remaining: 87.5,
      label: 'Billing Cycle Cap'
    }
  }

  const quotas = [
    {
      model: 'All Models',
      quota: 5000,
      last_updated: '2026-04-09'
    },
    {
      model: 'DeepSeek R1',
      quota: 250,
      last_updated: '2026-04-10'
    }
  ]

  const result = normalizeDashboardData(subscriptionUsage, quotas)

  assert.equal(result.quotas.length, 2)
  assert.equal(result.quotas[0]?.modelLabel, 'All Models')
  assert.equal(result.quotas[1]?.modelLabel, 'DeepSeek R1')
  assert.equal(result.quotas[1]?.quota, 250)
})

test('normalizes subscription usage when the API returns flat top-level fields', () => {
  const subscriptionUsage: JsonObject = {
    billing_cycle_used: 55.339,
    billing_cycle_limit: 100,
    billing_cycle_remaining: 44.661,
    four_hour_used: 0,
    four_hour_limit: 8.3333,
    four_hour_remaining: 8.3333,
    daily_used: 0,
    daily_limit: 5000,
    daily_remaining: 5000,
    plan_name: 'Pro'
  }

  const result = normalizeDashboardData(subscriptionUsage, [])

  assert.equal(result.windows.length, 3)
  assert.equal(result.windows[0]?.kind, 'billing-cycle')
  assert.equal(result.windows[0]?.used, 55.339)
  assert.equal(result.windows[1]?.kind, 'rolling-4h')
  assert.equal(result.windows[1]?.limit, 8.3333)
  assert.equal(result.windows[2]?.kind, 'daily-requests')
  assert.equal(result.windows[2]?.limit, 5000)
  assert.equal(result.plan?.planName, 'Pro')
})

test('derives plan caps from nested usage windows when plan metadata is absent', () => {
  const subscriptionUsage: JsonObject = {
    billing_cycle_cap: {
      used: 55.339,
      limit: 100,
      remaining: 44.661,
      label: 'Billing Cycle Cap'
    },
    four_hour_window: {
      used: 0,
      limit: 8.3333,
      remaining: 8.3333,
      label: '4-Hour Window'
    },
    daily_quota_usage: {
      used: 120,
      limit: 5000,
      remaining: 4880,
      label: 'Daily Quota'
    }
  }

  const result = normalizeDashboardData(subscriptionUsage, [])

  assert.equal(result.plan?.monthlyCapUsd, 100)
  assert.equal(result.plan?.fourHourCapUsd, 8.3333)
  assert.equal(result.plan?.dailyRequestLimit, 5000)
})

test('normalizes subscription usage when the API wraps values under a nested data object', () => {
  const subscriptionUsage: JsonObject = {
    data: {
      billing_cycle_cap: {
        used: 55.339,
        limit: 100,
        remaining: 44.661,
        label: 'Billing Cycle Cap'
      },
      four_hour_window: {
        used: 1.25,
        limit: 8.3333,
        remaining: 7.0833,
        label: '4-Hour Window'
      },
      daily_quota_usage: {
        used: 320,
        limit: 5000,
        remaining: 4680,
        label: 'Daily Quota'
      },
      plan_name: 'Pro'
    }
  }

  const result = normalizeDashboardData(subscriptionUsage, [])

  assert.equal(result.plan?.planName, 'Pro')
  assert.equal(result.plan?.monthlyCapUsd, 100)
  assert.equal(result.plan?.fourHourCapUsd, 8.3333)
  assert.equal(result.plan?.dailyRequestLimit, 5000)
  assert.equal(result.windows.length, 3)
})

test('normalizes the live Chutes subscription usage shape with monthly and four_hour objects', () => {
  const subscriptionUsage: JsonObject = {
    subscription: true,
    custom: false,
    monthly_price: 20,
    anchor_date: '2026-04-09T12:40:29',
    effective_date: '2026-04-09T12:40:29',
    updated_at: '2026-04-09T12:41:04.480688',
    four_hour: {
      usage: 0,
      cap: 8.333333333333332,
      remaining: 8.333333333333332,
      reset_at: '2026-04-16T02:00:00+02:00'
    },
    monthly: {
      usage: 55.33878851910001,
      cap: 100,
      remaining: 44.66121148089999,
      reset_at: '2026-05-09T14:40:29+02:00'
    }
  }

  const quotas: JsonObject = {
    items: [
      {
        is_default: true,
        effective_date: '2026-04-09T12:40:29',
        chute_id: '*',
        quota: 5000,
        updated_at: '2026-04-09T12:41:04.480688'
      }
    ]
  }

  const result = normalizeDashboardData(subscriptionUsage, quotas)

  assert.equal(result.windows.length, 3)
  assert.equal(result.windows[0]?.kind, 'billing-cycle')
  assert.equal(result.windows[0]?.limit, 100)
  assert.equal(result.windows[1]?.kind, 'rolling-4h')
  assert.equal(result.windows[1]?.limit, 8.333333333333332)
  assert.equal(result.windows[2]?.kind, 'daily-requests')
  assert.equal(result.windows[2]?.limit, 5000)
  assert.equal(result.plan?.planName, 'Pro')
  assert.equal(result.plan?.monthlyPriceUsd, 20)
  assert.equal(result.plan?.monthlyCapUsd, 100)
  assert.equal(result.plan?.fourHourCapUsd, 8.333333333333332)
  assert.equal(result.plan?.dailyRequestLimit, 5000)
})

test('falls back to Free tier when the user is not on subscription', () => {
  const subscriptionUsage: JsonObject = {
    subscription: false,
    custom: false,
    monthly: {
      usage: 0,
      cap: 0,
      remaining: 0
    },
    four_hour: {
      usage: 0,
      cap: 0,
      remaining: 0
    }
  }

  const result = normalizeDashboardData(subscriptionUsage, [], null)

  assert.equal(result.plan?.planName, 'Free tier')
})

test('uses live quota usage data so the daily window shows 0 instead of unknown', () => {
  const subscriptionUsage: JsonObject = {
    subscription: true,
    custom: false,
    monthly_price: 20,
    four_hour: {
      usage: 0,
      cap: 8.333333333333332,
      remaining: 8.333333333333332
    },
    monthly: {
      usage: 55.33878851910001,
      cap: 100,
      remaining: 44.66121148089999
    }
  }

  const quotas = [
    {
      chute_id: '*',
      quota: 5000,
      updated_at: '2026-04-09T12:41:04.480688'
    }
  ]

  const quotaUsage: JsonObject = {
    '*': {
      quota: 5000,
      used: 0
    }
  }

  const result = normalizeDashboardData(subscriptionUsage, quotas, quotaUsage)
  const dailyWindow = result.windows.find((window) => window.kind === 'daily-requests')

  assert.equal(dailyWindow?.used, 0)
  assert.equal(dailyWindow?.limit, 5000)
  assert.equal(dailyWindow?.remaining, 5000)
})

test('defaults quota label to All Models when the API omits a model name', () => {
  const result = normalizeDashboardData({}, [
    {
      quota: 5000,
      last_updated: '2026-04-09T12:41:04.480688'
    }
  ])

  assert.equal(result.quotas.length, 1)
  assert.equal(result.quotas[0]?.modelLabel, 'All Models')
})

test('summarizes status bar text in a compact and user friendly format', () => {
  const summary = summarizeStatusBar({
    windows: [
      {
        id: 'billing',
        kind: 'billing-cycle',
        label: 'Billing Cycle Cap',
        unit: 'usd',
        used: 55.339,
        limit: 100,
        remaining: 44.661,
        percentUsed: 55.339,
        resetLabel: null
      },
      {
        id: '4h',
        kind: 'rolling-4h',
        label: '4-Hour Window',
        unit: 'usd',
        used: 0,
        limit: 8.3333,
        remaining: 8.3333,
        percentUsed: 0,
        resetLabel: null
      },
      {
        id: 'daily',
        kind: 'daily-requests',
        label: 'Daily Quota',
        unit: 'requests',
        used: 0,
        limit: 5000,
        remaining: 5000,
        percentUsed: 0,
        resetLabel: null
      }
    ],
    quotas: [],
    plan: {
      planName: 'Pro',
      monthlyPriceUsd: 20,
      monthlyCapUsd: 100,
      fourHourCapUsd: 8.3333,
      dailyRequestLimit: 5000,
      paygDiscountPercent: 10
    }
  })

  assert.equal(summary, 'Chutes $55.34/$100 | 4h $0.00/$8.33 | 0/5000')
})

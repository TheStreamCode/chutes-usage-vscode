import test from 'node:test'
import assert from 'node:assert/strict'

import { normalizeDashboardData, normalizePaygCredit, summarizeStatusBarCompact } from '../services/normalize'
import type { DashboardData, DashboardState, JsonObject, UsageWindow } from '../types'

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

test('extracts the PAYG credit balance from the /users/me payload', () => {
  const result = normalizeDashboardData({}, [], null, null, null, null, { balance: 12.34 })
  assert.equal(result.paygCreditUsd, 12.34)
})

test('returns null PAYG credit when the /users/me payload is missing or empty', () => {
  assert.equal(normalizeDashboardData({}, []).paygCreditUsd, null)
  assert.equal(normalizeDashboardData({}, [], null, null, null, null, {}).paygCreditUsd, null)
})

test('reads PAYG credit from documented fallback balance fields', () => {
  assert.equal(normalizePaygCredit({ balance: 12.34 }), 12.34)
  assert.equal(normalizePaygCredit({ effective_balance: 7 }), 7)
  assert.equal(normalizePaygCredit({ current_balance: { effective_balance: 9.5 } }), 9.5)
  assert.equal(normalizePaygCredit({ payment_balance: '3.20' }), 3.2)
  assert.equal(normalizePaygCredit(null), null)
})

test('normalizes plan limits from pricing payload when available', () => {
  const result = normalizeDashboardData({}, [], null, null, null, [
    {
      name: 'Base',
      monthly_price: 3,
      monthly_cap_usd: 15,
      daily_request_limit: 300,
      four_hour_cap_usd: 1.25,
      payg_discount_percent: 3
    },
    {
      name: 'Plus',
      monthly_price: 10,
      monthly_cap_usd: 50,
      daily_request_limit: 2000,
      four_hour_cap_usd: 4.17,
      payg_discount_percent: 6
    },
    {
      name: 'Pro',
      monthly_price: 20,
      monthly_cap_usd: 100,
      daily_request_limit: 5000,
      four_hour_cap_usd: 8.33,
      payg_discount_percent: 10
    }
  ])

  assert.deepEqual(result.planLimits, [
    {
      name: 'Plus',
      priceLabel: '$10/mo',
      monthlyCapLabel: '$50',
      dailyRequestLimitLabel: '2,000',
      fourHourCapLabel: '$4.17',
      paygDiscountLabel: '6%'
    },
    {
      name: 'Pro',
      priceLabel: '$20/mo',
      monthlyCapLabel: '$100',
      dailyRequestLimitLabel: '5,000',
      fourHourCapLabel: '$8.33',
      paygDiscountLabel: '10%'
    }
  ])
})

test('defaults plan limits to the current Plus and Pro subscription tiers', () => {
  const result = normalizeDashboardData({}, [])

  assert.deepEqual(result.planLimits.map((limit) => limit.name), ['Plus', 'Pro'])
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

test('does not derive the retired Base tier from the former three dollar subscription price', () => {
  const result = normalizeDashboardData({
    subscription: true,
    custom: false,
    monthly_price: 3
  }, [])

  assert.equal(result.plan?.planName, 'Paid tier')
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

test('prefers live quota usage over stale subscription daily usage', () => {
  const subscriptionUsage: JsonObject = {
    subscription: true,
    custom: false,
    monthly_price: 20,
    daily_quota_usage: {
      used: 0,
      limit: 5000,
      remaining: 5000,
      label: 'Daily Quota'
    },
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
      used: 11
    }
  }

  const result = normalizeDashboardData(subscriptionUsage, quotas, quotaUsage)
  const dailyWindow = result.windows.find((window) => window.kind === 'daily-requests')

  assert.equal(dailyWindow?.used, 11)
  assert.equal(dailyWindow?.limit, 5000)
  assert.equal(dailyWindow?.remaining, 4989)
})

test('aggregates multiple live quota usage entries into one daily window', () => {
  const subscriptionUsage: JsonObject = {
    subscription: true,
    custom: false,
    monthly_price: 20
  }

  const quotas = [
    {
      chute_id: '*',
      quota: 5000,
      updated_at: '2026-04-09T12:41:04.480688'
    },
    {
      chute_id: 'my-chute',
      quota: 250,
      updated_at: '2026-04-09T12:41:04.480688'
    }
  ]

  const quotaUsage: JsonObject = {
    '*': {
      quota: 5000,
      used: 11
    },
    'my-chute': {
      quota: 250,
      used: 2
    }
  }

  const result = normalizeDashboardData(subscriptionUsage, quotas, quotaUsage)
  const dailyWindow = result.windows.find((window) => window.kind === 'daily-requests')

  assert.equal(dailyWindow?.used, 13)
  assert.equal(dailyWindow?.limit, 5250)
  assert.equal(dailyWindow?.remaining, 5237)
})

test('does not show a stale zero daily usage when live quota usage is unavailable', () => {
  const subscriptionUsage: JsonObject = {
    subscription: true,
    custom: false,
    monthly_price: 20,
    daily_quota_usage: {
      used: 0,
      limit: 5000,
      remaining: 5000,
      label: 'Daily Quota'
    }
  }

  const quotas = [
    {
      chute_id: '*',
      quota: 5000,
      updated_at: '2026-04-09T12:41:04.480688'
    }
  ]

  const result = normalizeDashboardData(subscriptionUsage, quotas, null)
  const dailyWindow = result.windows.find((window) => window.kind === 'daily-requests')

  assert.equal(dailyWindow?.used, null)
  assert.equal(dailyWindow?.limit, 5000)
  assert.equal(dailyWindow?.remaining, null)
})

test('marks the daily quota as stale when quota usage me is zero but llm stats show activity', () => {
  const subscriptionUsage: JsonObject = {
    subscription: true,
    custom: false,
    monthly_price: 20
  }

  const quotas = [
    {
      chute_id: '*',
      quota: 2000,
      updated_at: '2026-04-16T10:00:00.000000'
    }
  ]

  const quotaUsageMe: JsonObject = {
    used: 0,
    quota: 2000
  }

  const invocationStats = [
    {
      chute_id: 'model-a',
      total_requests: 11
    }
  ]

  const result = normalizeDashboardData(subscriptionUsage, quotas, null, quotaUsageMe, invocationStats)
  const dailyWindow = result.windows.find((window) => window.kind === 'daily-requests')

  assert.equal(dailyWindow?.used, null)
  assert.equal(dailyWindow?.limit, 2000)
  assert.equal(dailyWindow?.remaining, null)
  assert.equal(dailyWindow?.resetLabel, 'Possible sync delay')
})

test('treats zero quota as unlimited for the daily window', () => {
  const result = normalizeDashboardData({}, [
    {
      chute_id: '*',
      quota: 0,
      updated_at: '2026-04-16T10:00:00.000000'
    }
  ], null, {
    used: 380,
    quota: 0
  }, [])
  const dailyWindow = result.windows.find((window) => window.kind === 'daily-requests')

  assert.equal(dailyWindow?.used, 380)
  assert.equal(dailyWindow?.limit, 0)
  assert.equal(dailyWindow?.remaining, null)
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

test('compact status bar renders daily request windows with used and limit counts', () => {
  const summary = summarizeStatusBarCompact(createCompactState({
    connectionState: 'ready',
    data: createCompactData([makeWindow('daily-requests', 'requests', 4800, 5000, 96)])
  }))

  assert.equal(summary.text, '$(warning) Chutes day 4800/5000')
  assert.equal(summary.severity, 'warning')
})

test('compact status bar never coerces unverified request usage to zero', () => {
  const summary = summarizeStatusBarCompact(createCompactState({
    connectionState: 'ready',
    data: createCompactData([makeWindow('daily-requests', 'requests', null, 5000, 92)])
  }))

  assert.equal(summary.text, '$(warning) Chutes day --/5000')
})

test('compact status bar renders an unlimited request quota instead of a zero limit', () => {
  const summary = summarizeStatusBarCompact(createCompactState({
    connectionState: 'ready',
    data: createCompactData([makeWindow('daily-requests', 'requests', null, 0, 92)])
  }))

  assert.equal(summary.text, '$(warning) Chutes day --/∞')
})

test('compact status bar reports info severity and key codicon when API key is missing', () => {
  const summary = summarizeStatusBarCompact(createCompactState({ connectionState: 'missing-key', data: null }))
  assert.equal(summary.text, '$(key) Chutes')
  assert.equal(summary.severity, 'info')
})

test('compact status bar reports loading codicon during refresh', () => {
  const summary = summarizeStatusBarCompact(createCompactState({ connectionState: 'loading', data: null }))
  assert.equal(summary.text, '$(loading~spin) Chutes')
  assert.equal(summary.severity, 'info')
})

test('compact status bar reports error severity when connection fails', () => {
  const summary = summarizeStatusBarCompact(createCompactState({ connectionState: 'error', data: null }))
  assert.equal(summary.text, '$(error) Chutes')
  assert.equal(summary.severity, 'error')
})

test('compact status bar shows only billing usage when nothing is critical', () => {
  const summary = summarizeStatusBarCompact(createCompactState({
    connectionState: 'ready',
    data: createCompactData([
      makeWindow('billing-cycle', 'usd', 6.6, 100, 6.6),
      makeWindow('rolling-4h', 'usd', 0, 8.33, 0),
      makeWindow('daily-requests', 'requests', 50, 5000, 1)
    ])
  }))

  assert.equal(summary.text, '$(graph) Chutes $6.60')
  assert.equal(summary.severity, 'info')
})

test('compact status bar surfaces the worst window with info graph icon at 75-89%', () => {
  const summary = summarizeStatusBarCompact(createCompactState({
    connectionState: 'ready',
    data: createCompactData([
      makeWindow('billing-cycle', 'usd', 60, 100, 60),
      makeWindow('rolling-4h', 'usd', 6.5, 8.33, 78)
    ])
  }))

  assert.equal(summary.text, '$(graph) Chutes 4h $6.50/$8')
  assert.equal(summary.severity, 'info')
})

test('compact status bar escalates to warning severity when any window crosses 90%', () => {
  const summary = summarizeStatusBarCompact(createCompactState({
    connectionState: 'ready',
    data: createCompactData([
      makeWindow('billing-cycle', 'usd', 60, 100, 60),
      makeWindow('rolling-4h', 'usd', 7.8, 8.33, 94)
    ])
  }))

  assert.equal(summary.text, '$(warning) Chutes 4h $7.80/$8')
  assert.equal(summary.severity, 'warning')
})

function createCompactState(overrides: Partial<DashboardState>): { connectionState: DashboardState['connectionState']; data: DashboardData | null } {
  const base: { connectionState: DashboardState['connectionState']; data: DashboardData | null } = {
    connectionState: 'missing-key',
    data: null
  }
  return { ...base, ...overrides }
}

function createCompactData(windows: UsageWindow[]): DashboardData {
  return { windows, quotas: [], plan: null, planLimits: [], paygCreditUsd: null }
}

function makeWindow(kind: UsageWindow['kind'], unit: 'usd' | 'requests', used: number | null, limit: number, percentUsed: number): UsageWindow {
  return {
    id: kind,
    kind,
    label: kind,
    unit,
    used,
    limit,
    remaining: used === null ? null : Math.max(0, limit - used),
    percentUsed,
    resetLabel: null
  }
}

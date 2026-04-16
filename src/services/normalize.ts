import type { DashboardData, JsonArray, JsonContainer, JsonObject, PlanInfo, QuotaEntry, QuotaUsageSummary, UsageUnit, UsageWindow, UsageWindowKind } from '../types'

export function normalizeDashboardData(subscriptionUsage: JsonObject, quotasPayload: JsonContainer, quotaUsagePayload: JsonContainer | null = null): DashboardData {
  const usageSource = unwrapUsagePayload(subscriptionUsage)
  const quotas = normalizeQuotas(quotasPayload)
  const quotaUsage = normalizeQuotaUsage(quotaUsagePayload)
  const windows = normalizeUsageWindows(usageSource, quotas, quotaUsage)

  return {
    windows,
    quotas,
    plan: normalizePlan(usageSource, windows)
  }
}

// Normalize subscription usage payloads into a small set of UI-friendly windows.
export function normalizeUsageWindows(payload: JsonObject, quotas: QuotaEntry[] = [], quotaUsage: QuotaUsageSummary | null = null): UsageWindow[] {
  const candidates: Array<{
    keys: string[]
    kind: UsageWindowKind
    unit: UsageUnit
    label: string
    usedKeys: string[]
    limitKeys: string[]
    remainingKeys: string[]
    resetKeys: string[]
    nestedUsedKeys?: string[]
    nestedLimitKeys?: string[]
    nestedRemainingKeys?: string[]
    nestedResetKeys?: string[]
  }> = [
    {
      keys: ['billing_cycle_cap', 'monthly_cap', 'monthly_window', 'billing_cycle', 'monthly'],
      kind: 'billing-cycle',
      unit: 'usd',
      label: 'Billing Cycle Cap',
      usedKeys: ['billing_cycle_used', 'monthly_used'],
      limitKeys: ['billing_cycle_limit', 'monthly_limit', 'monthly_cap_usd'],
      remainingKeys: ['billing_cycle_remaining', 'monthly_remaining'],
      resetKeys: ['billing_cycle_reset_label', 'monthly_reset_label'],
      nestedUsedKeys: ['usage', 'used'],
      nestedLimitKeys: ['cap', 'limit'],
      nestedRemainingKeys: ['remaining'],
      nestedResetKeys: ['reset_at', 'reset_label']
    },
    {
      keys: ['four_hour_window', 'rolling_4h_window', 'four_hour_cap', 'rolling_window', 'four_hour'],
      kind: 'rolling-4h',
      unit: 'usd',
      label: '4-Hour Window',
      usedKeys: ['four_hour_used', 'rolling_4h_used'],
      limitKeys: ['four_hour_limit', 'rolling_4h_limit', 'four_hour_cap_usd'],
      remainingKeys: ['four_hour_remaining', 'rolling_4h_remaining'],
      resetKeys: ['four_hour_reset_label', 'rolling_4h_reset_label'],
      nestedUsedKeys: ['usage', 'used'],
      nestedLimitKeys: ['cap', 'limit'],
      nestedRemainingKeys: ['remaining'],
      nestedResetKeys: ['reset_at', 'reset_label']
    },
    {
      keys: ['daily_quota_usage', 'daily_quota', 'daily_window', 'daily_requests'],
      kind: 'daily-requests',
      unit: 'requests',
      label: 'Daily Quota',
      usedKeys: ['daily_used', 'daily_quota_used'],
      limitKeys: ['daily_limit', 'daily_request_limit', 'daily_quota_limit'],
      remainingKeys: ['daily_remaining', 'daily_quota_remaining'],
      resetKeys: ['daily_reset_label', 'daily_quota_reset_label'],
      nestedUsedKeys: ['usage', 'used'],
      nestedLimitKeys: ['cap', 'limit', 'quota'],
      nestedRemainingKeys: ['remaining'],
      nestedResetKeys: ['reset_at', 'reset_label']
    },
    {
      keys: ['weekly_window', 'weekly_cap'],
      kind: 'weekly',
      unit: 'usd',
      label: 'Weekly Window',
      usedKeys: ['weekly_used'],
      limitKeys: ['weekly_limit'],
      remainingKeys: ['weekly_remaining'],
      resetKeys: ['weekly_reset_label']
    }
  ]

  const liveDailyQuotaWindow = buildDailyQuotaWindow(quotas, quotaUsage)

  return candidates
    .map((candidate) => {
      const rawMatch = pickObject(payload, candidate.keys)
      const raw = rawMatch?.value ?? null
      const used = pickNumber(raw, payload, candidate.usedKeys, candidate.nestedUsedKeys ?? ['used'])
      const limit = pickNumber(raw, payload, candidate.limitKeys, candidate.nestedLimitKeys ?? ['limit'])
      const remaining = pickNumber(raw, payload, candidate.remainingKeys, candidate.nestedRemainingKeys ?? ['remaining']) ?? computeRemaining(used, limit)
      const resetLabel = pickString(raw, payload, candidate.resetKeys, candidate.nestedResetKeys ?? ['reset_label'])
      const label = pickString(raw, payload, [], 'label') ?? candidate.label

      if (raw === null && used === null && limit === null && remaining === null) {
        return null
      }

      return {
        id: rawMatch?.key ?? candidate.keys[0],
        kind: candidate.kind,
        label,
        unit: candidate.unit,
        used,
        limit,
        remaining,
        percentUsed: computePercent(used, limit),
        resetLabel
      } satisfies UsageWindow
    })
    .filter((item): item is UsageWindow => item !== null)
    .filter((window) => !(window.kind === 'daily-requests' && liveDailyQuotaWindow.length > 0))
    .concat(liveDailyQuotaWindow)
    .filter((window, index, items) => items.findIndex((item) => item.kind === window.kind) === index)
}

// Normalize quota payloads from loose API responses into table rows.
export function normalizeQuotas(payload: JsonContainer): QuotaEntry[] {
  const items = getQuotaItems(payload)

  return items
    .map((item: unknown) => asObject(item))
    .filter((item: JsonObject | null): item is JsonObject => item !== null)
    .map((item: JsonObject) => ({
      modelLabel: asString(item.model) ?? asString(item.model_label) ?? asString(item.label) ?? asString(item.name) ?? 'All Models',
      quota: asNumber(item.quota) ?? asNumber(item.limit),
      lastUpdated: asString(item.last_updated) ?? asString(item.updated_at) ?? null
    }))
}

function getQuotaItems(payload: JsonContainer): JsonArray {
  if (Array.isArray(payload)) {
    return payload
  }

  if (Array.isArray(payload.items)) {
    return payload.items
  }

  if (Array.isArray(payload.quotas)) {
    return payload.quotas
  }

  return []
}

export function normalizeQuotaUsage(payload: JsonContainer | null): QuotaUsageSummary | null {
  if (payload === null) {
    return null
  }

  if (Array.isArray(payload)) {
    return null
  }

  const directUsed = asNumber(payload.used)
  const directQuota = asNumber(payload.quota)
  if (directUsed !== null || directQuota !== null) {
    return {
      used: directUsed,
      quota: directQuota,
      trusted: true
    }
  }

  let usedTotal: number | null = null
  let quotaTotal: number | null = null

  for (const value of Object.values(payload)) {
    const item = asObject(value)
    if (!item) {
      continue
    }

    const used = asNumber(item.used)
    const quota = asNumber(item.quota)
    if (used !== null) {
      usedTotal = (usedTotal ?? 0) + used
    }
    if (quota !== null) {
      quotaTotal = (quotaTotal ?? 0) + quota
    }
  }

  if (usedTotal !== null || quotaTotal !== null) {
    return {
      used: usedTotal,
      quota: quotaTotal,
      trusted: true
    }
  }

  return null
}

// Normalize plan metadata while allowing the API response to evolve over time.
export function normalizePlan(payload: JsonObject, windows: UsageWindow[] = []): PlanInfo | null {
  const plan = asObject(payload.plan)
  const source = plan ?? payload
  const billingWindow = windows.find((window) => window.kind === 'billing-cycle')
  const rollingWindow = windows.find((window) => window.kind === 'rolling-4h')
  const dailyWindow = windows.find((window) => window.kind === 'daily-requests')
  const billingCap = asObject(payload.billing_cycle_cap)
  const fourHourCap = asObject(payload.four_hour_window)
  const dailyQuota = asObject(payload.daily_quota_usage)

  const planName = asString(source.name)
    ?? asString(payload.plan_name)
    ?? derivePlanName(payload)
  const monthlyPriceUsd = asNumber(source.monthly_price) ?? asNumber(payload.monthly_price)
  const monthlyCapUsd = asNumber(source.monthly_cap_usd)
    ?? asNumber(payload.monthly_cap_usd)
    ?? asNumber(payload.billing_cycle_limit)
    ?? asNumber(asObject(payload.monthly)?.cap)
    ?? asNumber(billingCap?.limit)
    ?? billingWindow?.limit
  const fourHourCapUsd = asNumber(source.four_hour_cap_usd)
    ?? asNumber(payload.four_hour_cap_usd)
    ?? asNumber(payload.four_hour_limit)
    ?? asNumber(asObject(payload.four_hour)?.cap)
    ?? asNumber(fourHourCap?.limit)
    ?? rollingWindow?.limit
  const dailyRequestLimit = asNumber(source.daily_request_limit)
    ?? asNumber(payload.daily_request_limit)
    ?? asNumber(payload.daily_limit)
    ?? asNumber(dailyQuota?.limit)
    ?? dailyWindow?.limit
  const paygDiscountPercent = asNumber(source.payg_discount_percent) ?? asNumber(payload.payg_discount_percent)

  const normalizedMonthlyPriceUsd = monthlyPriceUsd ?? null
  const normalizedMonthlyCapUsd = monthlyCapUsd ?? null
  const normalizedFourHourCapUsd = fourHourCapUsd ?? null
  const normalizedDailyRequestLimit = dailyRequestLimit ?? null

  if (planName === null && normalizedMonthlyPriceUsd === null && normalizedMonthlyCapUsd === null && normalizedFourHourCapUsd === null && normalizedDailyRequestLimit === null && paygDiscountPercent === null) {
    return null
  }

  return {
    planName,
    monthlyPriceUsd: normalizedMonthlyPriceUsd,
    monthlyCapUsd: normalizedMonthlyCapUsd,
    fourHourCapUsd: normalizedFourHourCapUsd,
    dailyRequestLimit: normalizedDailyRequestLimit,
    paygDiscountPercent
  }
}

function buildDailyQuotaWindow(quotas: QuotaEntry[], quotaUsage: QuotaUsageSummary | null): UsageWindow[] {
  const totalQuota = quotas.reduce<number | null>((sum, entry) => {
    if (entry.quota === null) {
      return sum
    }

    return (sum ?? 0) + entry.quota
  }, null)

  if (totalQuota === null) {
    return []
  }

  const used = quotaUsage?.trusted ? quotaUsage.used : null
  const limit = quotaUsage?.quota ?? totalQuota
  const remaining = used !== null && limit !== null ? computeRemaining(used, limit) : null

  return [
    {
      id: 'quotas-daily',
      kind: 'daily-requests',
      label: 'Daily Quota',
      unit: 'requests',
      used,
      limit,
      remaining,
      percentUsed: computePercent(used, limit),
      resetLabel: null
    }
  ]
}

function derivePlanName(payload: JsonObject): string | null {
  const subscription = payload.subscription
  const custom = payload.custom
  const monthlyPrice = asNumber(payload.monthly_price)

  if (subscription === false) {
    return 'Free tier'
  }

  if (monthlyPrice !== null) {
    const knownPlanName = getPlanNameFromMonthlyPrice(monthlyPrice)
    if (knownPlanName !== null) {
      return knownPlanName
    }
  }

  if (subscription === true && custom === false) {
    return 'Paid tier'
  }

  if (custom === true) {
    return 'Custom'
  }

  return null
}

function getPlanNameFromMonthlyPrice(monthlyPrice: number): string | null {
  if (monthlyPrice === 3) {
    return 'Base'
  }

  if (monthlyPrice === 10) {
    return 'Plus'
  }

  if (monthlyPrice === 20) {
    return 'Pro'
  }

  return null
}

// Build a compact status bar summary that stays short and easy to scan.
export function summarizeStatusBar(data: DashboardData): string {
  const billing = data.windows.find((window) => window.kind === 'billing-cycle')
  const rolling = data.windows.find((window) => window.kind === 'rolling-4h')
  const daily = data.windows.find((window) => window.kind === 'daily-requests')

  const parts: string[] = []

  if (billing) {
    parts.push(`Chutes ${formatWindowSummary(billing, '$')}`)
  } else {
    parts.push('Chutes')
  }

  if (rolling) {
    parts.push(`4h ${formatWindowSummary(rolling, '$', false)}`)
  }

  if (daily) {
    parts.push(formatWindowSummary(daily, '', false))
  }

  return parts.join(' | ')
}

function formatWindowSummary(window: UsageWindow, prefix: string, includePrefix = true): string {
  const used = window.used
  const limit = window.limit

  if (window.unit === 'requests') {
    return `${used === null ? '--' : Math.round(used)}/${limit === null ? '--' : Math.round(limit)}`
  }

  const safeUsed = used ?? 0
  const safeLimit = limit ?? 0

  const formatted = `${prefix}${safeUsed.toFixed(2)}/${prefix}${safeLimit.toFixed(2).replace(/\.00$/, '')}`
  return includePrefix ? formatted : formatted
}

function asObject(value: unknown): JsonObject | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as JsonObject) : null
}

// Find the most likely subscription usage object inside wrapped API responses.
function unwrapUsagePayload(payload: JsonObject): JsonObject {
  return findBestUsageObject(payload)?.object ?? payload
}

// Score candidate objects by how many usage-related fields they contain.
function countUsageSignals(payload: JsonObject): number {
  return [
    'billing_cycle_cap',
    'monthly',
    'monthly_cap',
    'monthly_window',
    'billing_cycle',
    'four_hour',
    'four_hour_window',
    'rolling_4h_window',
    'four_hour_cap',
    'rolling_window',
    'daily_quota_usage',
    'daily_quota',
    'daily_window',
    'daily_requests',
    'billing_cycle_limit',
    'four_hour_limit',
    'daily_limit',
    'plan',
    'plan_name'
  ].reduce((score, key) => score + (payload[key] !== undefined ? 1 : 0), 0)
}

// Walk nested objects and pick the one that best matches the usage payload shape.
function findBestUsageObject(payload: JsonObject, seen = new Set<JsonObject>()): { object: JsonObject; score: number } | null {
  if (seen.has(payload)) {
    return null
  }

  seen.add(payload)

  let best: { object: JsonObject; score: number } | null = null
  const score = countUsageSignals(payload)

  if (score > 0) {
    best = { object: payload, score }
  }

  for (const value of Object.values(payload)) {
    const child = asObject(value)
    if (!child) {
      continue
    }

    const nestedBest = findBestUsageObject(child, seen)
    if (nestedBest && (best === null || nestedBest.score > best.score)) {
      best = nestedBest
    }
  }

  return best
}

// Pick the first nested object that exists under one of the supported aliases.
function pickObject(payload: JsonObject, aliases: string[]): { key: string; value: JsonObject } | null {
  for (const alias of aliases) {
    const value = asObject(payload[alias])
    if (value !== null) {
      return { key: alias, value }
    }
  }

  return null
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function computeRemaining(used: number | null, limit: number | null): number | null {
  if (used === null || limit === null) {
    return null
  }

  return Math.max(limit - used, 0)
}

function computePercent(used: number | null, limit: number | null): number | null {
  if (used === null || limit === null || limit === 0) {
    return null
  }

  return (used / limit) * 100
}

function pickNumber(raw: JsonObject | null, payload: JsonObject, aliases: string[], nestedKeys: string | string[]): number | null {
  if (raw) {
    const nestedKeyList = Array.isArray(nestedKeys) ? nestedKeys : [nestedKeys]
    for (const nestedKey of nestedKeyList) {
      const nested = asNumber(raw[nestedKey])
      if (nested !== null) {
        return nested
      }
    }
  }

  for (const alias of aliases) {
    const value = asNumber(payload[alias])
    if (value !== null) {
      return value
    }
  }

  return null
}

function pickString(raw: JsonObject | null, payload: JsonObject, aliases: string[], nestedKeys: string | string[]): string | null {
  if (raw) {
    const nestedKeyList = Array.isArray(nestedKeys) ? nestedKeys : [nestedKeys]
    for (const nestedKey of nestedKeyList) {
      const nested = asString(raw[nestedKey])
      if (nested !== null) {
        return nested
      }
    }
  }

  for (const alias of aliases) {
    const value = asString(payload[alias])
    if (value !== null) {
      return value
    }
  }

  return null
}

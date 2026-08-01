import type { CachedPayload, DashboardState, PlanInfo, PlanLimitEntry, StateMessage, UsageWindow } from './types.js'

const CONNECTION_STATES = new Set(['missing-key', 'loading', 'ready', 'error'])
const WINDOW_KINDS = new Set(['billing-cycle', 'rolling-4h', 'daily-requests', 'weekly', 'unknown'])
const WINDOW_UNITS = new Set(['usd', 'requests'])
const WINDOW_STATUSES = new Set(['trusted', 'stale', 'unknown'])
const DATA_SOURCES = new Set(['quota-usage-me', 'quota-usage-fallback', 'subscription-usage', 'quotas', 'unknown'])

export function isStateMessage(value: unknown): value is StateMessage {
  if (!isObject(value) || value.type !== 'state' || !isDashboardState(value.state)) {
    return false
  }

  return value.refreshIntervalMs === undefined || isPositiveFiniteNumber(value.refreshIntervalMs)
}

export function isCachedPayload(value: unknown): value is CachedPayload {
  return isObject(value)
    && Number.isInteger(value.version)
    && typeof value.planLimitsCollapsed === 'boolean'
    && isDashboardState(value.state)
}

function isDashboardState(value: unknown): value is DashboardState {
  if (!isObject(value)
    || typeof value.connectionState !== 'string'
    || !CONNECTION_STATES.has(value.connectionState)
    || typeof value.connected !== 'boolean'
    || !isNullableString(value.lastUpdatedAt)
    || !isNullableString(value.errorMessage)) {
    return false
  }

  if (value.data === null) {
    return true
  }

  return isObject(value.data)
    && Array.isArray(value.data.windows)
    && value.data.windows.every(isUsageWindow)
    && (value.data.plan === null || isPlanInfo(value.data.plan))
    && Array.isArray(value.data.planLimits)
    && value.data.planLimits.every(isPlanLimitEntry)
    && isNullableFiniteNumber(value.data.paygCreditUsd)
}

function isUsageWindow(value: unknown): value is UsageWindow {
  if (!isObject(value)
    || typeof value.id !== 'string'
    || typeof value.kind !== 'string'
    || !WINDOW_KINDS.has(value.kind)
    || typeof value.label !== 'string'
    || typeof value.unit !== 'string'
    || !WINDOW_UNITS.has(value.unit)
    || !isNullableFiniteNumber(value.used)
    || !isNullableFiniteNumber(value.limit)
    || !isNullableFiniteNumber(value.remaining)
    || !isNullableFiniteNumber(value.percentUsed)
    || !isNullableString(value.resetLabel)) {
    return false
  }

  if (value.status !== undefined && (typeof value.status !== 'string' || !WINDOW_STATUSES.has(value.status))) {
    return false
  }

  return value.dataSource === undefined
    || (typeof value.dataSource === 'string' && DATA_SOURCES.has(value.dataSource))
}

function isPlanInfo(value: unknown): value is PlanInfo {
  return isObject(value)
    && isNullableString(value.planName)
    && isNullableFiniteNumber(value.monthlyPriceUsd)
    && isNullableFiniteNumber(value.monthlyCapUsd)
    && isNullableFiniteNumber(value.fourHourCapUsd)
    && isNullableFiniteNumber(value.dailyRequestLimit)
    && isNullableFiniteNumber(value.paygDiscountPercent)
}

function isPlanLimitEntry(value: unknown): value is PlanLimitEntry {
  return isObject(value)
    && typeof value.name === 'string'
    && typeof value.priceLabel === 'string'
    && typeof value.monthlyCapLabel === 'string'
    && typeof value.dailyRequestLimitLabel === 'string'
    && typeof value.fourHourCapLabel === 'string'
    && typeof value.paygDiscountLabel === 'string'
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

function isNullableFiniteNumber(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isFinite(value))
}

function isPositiveFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

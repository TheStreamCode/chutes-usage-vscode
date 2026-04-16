import { API_BASE_URL } from '../constants'
import type { JsonContainer, JsonObject } from '../types'

type ClientOptions = {
  debug?: boolean
  log?: (message: string) => void
}

export class ChutesApiClient {
  public constructor(
    private readonly apiKey: string,
    private readonly options: ClientOptions = {}
  ) {}

  // Fetch all user-facing dashboard endpoints needed for the first extension version.
  public async getDashboardPayload(): Promise<{ subscriptionUsage: JsonObject; quotas: JsonContainer; quotaUsageMe: JsonContainer | null; quotaUsageFallback: JsonContainer | null; invocationStatsLlm: JsonContainer | null; pricing: JsonContainer | null }> {
    const [subscriptionUsage, quotas, pricing, quotaUsageMe, invocationStatsLlm] = await Promise.all([
      this.getJsonContainer('/users/me/subscription_usage'),
      this.getJsonContainer('/users/me/quotas'),
      this.getJsonContainer('/pricing').catch(() => null),
      this.getJsonContainer('/users/me/quota_usage/me').catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Unknown error'
        this.debugLog(`quota usage me fetch failed: ${message}`)
        return null
      }),
      this.getJsonContainer('/invocations/stats/llm').catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Unknown error'
        this.debugLog(`invocation stats llm fetch failed: ${message}`)
        return null
      })
    ])
    this.debugLog(`subscription usage shape: ${describeJsonContainer(subscriptionUsage)}`)
    this.debugLog(`quotas shape: ${describeJsonContainer(quotas)}`)
    this.debugLog(`quota usage me shape: ${describeJsonContainer(quotaUsageMe)}`)
    this.debugLog(`invocation stats llm shape: ${describeJsonContainer(invocationStatsLlm)}`)
    const quotaUsageFallback = await this.getQuotaUsagePayload(quotas)
    this.debugLog(`quota usage fallback shape: ${describeJsonContainer(quotaUsageFallback)}`)

    if (!isJsonObject(subscriptionUsage)) {
      throw new Error('Unexpected API response shape for /users/me/subscription_usage')
    }

    return { subscriptionUsage, quotas, quotaUsageMe, quotaUsageFallback, invocationStatsLlm, pricing }
  }

  // Execute one authenticated GET request and return a JSON object or array payload.
  private async getJsonContainer(path: string): Promise<JsonContainer> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'GET',
        headers: {
          Authorization: this.apiKey,
          Accept: 'application/json'
        },
        signal: controller.signal
      })

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }

      const json = (await response.json()) as unknown
      if (!isJsonContainer(json)) {
        throw new Error(`Unexpected API response shape for ${path}`)
      }

      return json
    } finally {
      clearTimeout(timeout)
    }
  }

  // Fetch per-chute quota usage because the documented API shape is /users/me/quota_usage/{chute_id}.
  private async getQuotaUsagePayload(quotas: JsonContainer): Promise<JsonContainer | null> {
    const chuteIds = getQuotaUsageChuteIds(quotas)
    if (chuteIds.length === 0) {
      this.debugLog('quota usage skipped: no chute ids found in quotas payload')
      return null
    }

    this.debugLog(`quota usage chute ids: ${chuteIds.join(', ')}`)

    const entries = await Promise.all(chuteIds.map(async (chuteId) => {
      const path = `/users/me/quota_usage/${encodePathSegment(chuteId)}`
      const payload = await this.getJsonContainer(path).catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Unknown error'
        this.debugLog(`quota usage fetch failed for ${chuteId}: ${message}`)
        return null
      })
      if (payload !== null) {
        this.debugLog(`quota usage fetch ok for ${chuteId}: ${describeJsonContainer(payload)}`)
      }
      return payload === null ? null : [chuteId, payload] as const
    }))

    const validEntries = entries.filter((entry): entry is readonly [string, JsonContainer] => entry !== null)
    if (validEntries.length === 0) {
      return null
    }

    return Object.fromEntries(validEntries)
  }

  private debugLog(message: string): void {
    if (!this.options.debug) {
      return
    }

    this.options.log?.(`[Chutes Usage] ${message}`)
  }
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isJsonContainer(value: unknown): value is JsonContainer {
  return isJsonObject(value) || Array.isArray(value)
}

// Collect chute ids from quota rows so quota usage can be fetched per documented path parameter.
function getQuotaUsageChuteIds(payload: JsonContainer): string[] {
  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.items)
      ? payload.items
      : Array.isArray(payload.quotas)
        ? payload.quotas
        : []

  const chuteIds = new Set<string>()
  for (const item of items) {
    const object = isJsonObject(item) ? item : null
    const chuteId = typeof object?.chute_id === 'string' && object.chute_id.length > 0 ? object.chute_id : null
    if (chuteId) {
      chuteIds.add(chuteId)
    }
  }

  return Array.from(chuteIds)
}

// Encode path segments strictly so wildcard chute ids like '*' are sent as '%2A'.
function encodePathSegment(value: string): string {
  return encodeURIComponent(value).replace(/\*/g, '%2A')
}

// Summarize JSON shapes for debug diagnostics without logging secrets or full payloads.
function describeJsonContainer(value: JsonContainer | null): string {
  if (value === null) {
    return 'null'
  }

  if (Array.isArray(value)) {
    return `array(length=${value.length})`
  }

  return `object(keys=${Object.keys(value).join(',') || 'none'})`
}

import { API_BASE_URL } from '../constants'
import type { JsonContainer, JsonObject } from '../types'

export class ChutesApiClient {
  public constructor(private readonly apiKey: string) {}

  // Fetch all user-facing dashboard endpoints needed for the first extension version.
  public async getDashboardPayload(): Promise<{ subscriptionUsage: JsonObject; quotas: JsonContainer; quotaUsage: JsonContainer | null; pricing: JsonContainer | null }> {
    const [subscriptionUsage, quotas, pricing] = await Promise.all([
      this.getJsonContainer('/users/me/subscription_usage'),
      this.getJsonContainer('/users/me/quotas'),
      this.getJsonContainer('/pricing').catch(() => null)
    ])
    const quotaUsage = await this.getQuotaUsagePayload(quotas)

    if (!isJsonObject(subscriptionUsage)) {
      throw new Error('Unexpected API response shape for /users/me/subscription_usage')
    }

    return { subscriptionUsage, quotas, quotaUsage, pricing }
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
      return null
    }

    const entries = await Promise.all(chuteIds.map(async (chuteId) => {
      const payload = await this.getJsonContainer(`/users/me/quota_usage/${encodePathSegment(chuteId)}`).catch(() => null)
      return payload === null ? null : [chuteId, payload] as const
    }))

    const validEntries = entries.filter((entry): entry is readonly [string, JsonContainer] => entry !== null)
    if (validEntries.length === 0) {
      return null
    }

    return Object.fromEntries(validEntries)
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

import { API_BASE_URL } from '../constants'
import type { JsonContainer, JsonObject } from '../types'

export class ChutesApiClient {
  public constructor(private readonly apiKey: string) {}

  // Fetch all user-facing dashboard endpoints needed for the first extension version.
  public async getDashboardPayload(): Promise<{ subscriptionUsage: JsonObject; quotas: JsonContainer; quotaUsage: JsonContainer | null; pricing: JsonContainer | null }> {
    const [subscriptionUsage, quotas, quotaUsage, pricing] = await Promise.all([
      this.getJsonContainer('/users/me/subscription_usage'),
      this.getJsonContainer('/users/me/quotas'),
      this.getJsonContainer('/users/me/quota_usage/*').catch(() => null),
      this.getJsonContainer('/pricing').catch(() => null)
    ])

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
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isJsonContainer(value: unknown): value is JsonContainer {
  return isJsonObject(value) || Array.isArray(value)
}

import { normalizeDashboardData } from '../services/normalize'
import { ChutesApiClient } from '../services/ChutesApiClient'
import { SecretStore } from '../services/SecretStore'
import type { DashboardState } from '../types'

export type DashboardListener = (state: DashboardState) => void

export class DashboardStore {
  private state: DashboardState = {
    connectionState: 'missing-key',
    connected: false,
    lastUpdatedAt: null,
    data: null,
    errorMessage: null
  }

  private readonly listeners = new Set<DashboardListener>()
  private refreshVersion = 0

  public constructor(private readonly secretStore: SecretStore) {}

  public getState(): DashboardState {
    return this.state
  }

  public subscribe(listener: DashboardListener): () => void {
    this.listeners.add(listener)
    listener(this.state)
    return () => this.listeners.delete(listener)
  }

  // Refresh dashboard data while preserving a simple user-facing state machine.
  public async refresh(): Promise<void> {
    const refreshVersion = ++this.refreshVersion
    const apiKey = await this.secretStore.getApiKey()
    if (!apiKey) {
      this.applyState(refreshVersion, {
        connectionState: 'missing-key',
        connected: false,
        lastUpdatedAt: null,
        data: null,
        errorMessage: null
      })
      return
    }

    this.applyState(refreshVersion, {
      ...this.state,
      connectionState: 'loading',
      errorMessage: null
    })

    try {
      const client = new ChutesApiClient(apiKey)
      const payload = await client.getDashboardPayload()
      const data = normalizeDashboardData(
        payload.subscriptionUsage,
        payload.quotas,
        payload.quotaUsageFallback,
        payload.quotaUsageMe,
        payload.invocationStatsLlm
      )

      const latestApiKey = await this.secretStore.getApiKey()
      if (latestApiKey !== apiKey) {
        this.applyMissingKeyState(refreshVersion)
        return
      }

      this.applyState(refreshVersion, {
        connectionState: 'ready',
        connected: true,
        lastUpdatedAt: new Date().toISOString(),
        data,
        errorMessage: null
      })
    } catch (error) {
      const latestApiKey = await this.secretStore.getApiKey()
      if (latestApiKey !== apiKey) {
        this.applyMissingKeyState(refreshVersion)
        return
      }

      this.applyState(refreshVersion, {
        connectionState: 'error',
        connected: false,
        lastUpdatedAt: this.state.lastUpdatedAt,
        data: this.state.data,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  private applyMissingKeyState(refreshVersion: number): void {
    this.applyState(refreshVersion, {
      connectionState: 'missing-key',
      connected: false,
      lastUpdatedAt: null,
      data: null,
      errorMessage: null
    })
  }

  private applyState(refreshVersion: number, state: DashboardState): void {
    if (refreshVersion !== this.refreshVersion) {
      return
    }

    this.setState(state)
  }

  private setState(state: DashboardState): void {
    this.state = state
    for (const listener of this.listeners) {
      listener(this.state)
    }
  }
}

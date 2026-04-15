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
    const apiKey = await this.secretStore.getApiKey()
    if (!apiKey) {
      this.setState({
        connectionState: 'missing-key',
        connected: false,
        lastUpdatedAt: null,
        data: null,
        errorMessage: null
      })
      return
    }

    this.setState({
      ...this.state,
      connectionState: 'loading',
      errorMessage: null
    })

    try {
      const client = new ChutesApiClient(apiKey)
      const payload = await client.getDashboardPayload()
      const data = normalizeDashboardData(payload.subscriptionUsage, payload.quotas, payload.quotaUsage)

      this.setState({
        connectionState: 'ready',
        connected: true,
        lastUpdatedAt: new Date().toISOString(),
        data,
        errorMessage: null
      })
    } catch (error) {
      this.setState({
        connectionState: 'error',
        connected: false,
        lastUpdatedAt: this.state.lastUpdatedAt,
        data: this.state.data,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  private setState(state: DashboardState): void {
    this.state = state
    for (const listener of this.listeners) {
      listener(this.state)
    }
  }
}

import * as vscode from 'vscode'

import { SECRET_KEY_API_TOKEN } from '../constants'

export class SecretStore {
  public constructor(private readonly secrets: vscode.SecretStorage) {}

  // Return the stored API key when available.
  public async getApiKey(): Promise<string | undefined> {
    return this.secrets.get(SECRET_KEY_API_TOKEN)
  }

  // Persist the API key securely in VS Code secret storage.
  public async setApiKey(value: string): Promise<void> {
    await this.secrets.store(SECRET_KEY_API_TOKEN, value)
  }

  // Remove the stored API key and reset authentication state.
  public async removeApiKey(): Promise<void> {
    await this.secrets.delete(SECRET_KEY_API_TOKEN)
  }

  // Remove every secret owned by the extension to avoid local retention.
  public async clearAll(): Promise<void> {
    const keys = await this.secrets.keys()
    await Promise.all(keys.map(async (key) => {
      await this.secrets.delete(key)
    }))
  }
}

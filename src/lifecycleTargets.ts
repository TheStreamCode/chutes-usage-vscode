import * as path from 'node:path'

type EnvMap = Partial<Record<'APPDATA' | 'HOME', string>>

// Build a best-effort list of global storage folders that may contain extension data.
export function getCleanupTargets(extensionId: string, env: EnvMap = process.env): string[] {
  const targets = new Set<string>()
  const appData = env.APPDATA
  const home = env.HOME

  if (appData) {
    targets.add(path.join(appData, 'Code', 'User', 'globalStorage', extensionId))
    targets.add(path.join(appData, 'Code - Insiders', 'User', 'globalStorage', extensionId))
  }

  if (home) {
    targets.add(path.join(home, '.config', 'Code', 'User', 'globalStorage', extensionId))
    targets.add(path.join(home, '.config', 'Code - Insiders', 'User', 'globalStorage', extensionId))
  }

  return Array.from(targets)
}

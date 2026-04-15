import * as fs from 'node:fs/promises'

import { EXTENSION_ID } from './constants'
import { getCleanupTargets } from './lifecycleTargets'

void cleanupOnUninstall()

// Remove best-effort local extension storage after uninstall.
async function cleanupOnUninstall(): Promise<void> {
  const targets = getCleanupTargets(EXTENSION_ID)

  await Promise.all(targets.map(async (target) => {
    try {
      await fs.rm(target, { recursive: true, force: true })
    } catch {
      // Ignore uninstall cleanup failures because the hook is best-effort only.
    }
  }))
}

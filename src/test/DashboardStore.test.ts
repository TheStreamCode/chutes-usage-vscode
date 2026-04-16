import test from 'node:test'
import assert from 'node:assert/strict'
import packageJson from '../../package.json'

import { DASHBOARD_VIEW_ID, VIEW_CONTAINER_ID } from '../constants'

test('registers commands used by the renamed extension shell', () => {
  const commands = packageJson.contributes.commands.map((entry) => entry.command)

  assert.ok(commands.includes('chutesUsageVscode.openDashboard'))
  assert.ok(commands.includes('chutesUsageVscode.refresh'))
  assert.ok(commands.includes('chutesUsageVscode.setApiKey'))
  assert.ok(commands.includes('chutesUsageVscode.removeApiKey'))
})

test('uses the correct built-in focus command for the custom activity bar container', () => {
  assert.equal(`workbench.view.extension.${VIEW_CONTAINER_ID}`, 'workbench.view.extension.chutesUsageVscode')
  assert.equal(DASHBOARD_VIEW_ID, 'chutesUsageVscode.dashboard')
})

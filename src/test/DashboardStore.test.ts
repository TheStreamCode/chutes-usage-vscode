import test from 'node:test'
import assert from 'node:assert/strict'
import packageJson from '../../package.json'

test('registers commands used by the renamed extension shell', () => {
  const commands = packageJson.contributes.commands.map((entry) => entry.command)

  assert.ok(commands.includes('chutesUsageVscode.openDashboard'))
  assert.ok(commands.includes('chutesUsageVscode.refresh'))
  assert.ok(commands.includes('chutesUsageVscode.setApiKey'))
  assert.ok(commands.includes('chutesUsageVscode.removeApiKey'))
})

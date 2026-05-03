import test from 'node:test'
import assert from 'node:assert/strict'

import { getAllowedExternalUri } from '../services/externalLinks'

test('allows only the public Chutes HTTPS origin for external links', () => {
  assert.equal(getAllowedExternalUri('https://chutes.ai')?.toString(), 'https://chutes.ai/')
  assert.equal(getAllowedExternalUri('https://chutes.ai/pricing')?.toString(), 'https://chutes.ai/pricing')

  assert.equal(getAllowedExternalUri('http://chutes.ai'), null)
  assert.equal(getAllowedExternalUri('https://evil.example'), null)
  assert.equal(getAllowedExternalUri('command:workbench.action.reloadWindow'), null)
  assert.equal(getAllowedExternalUri('file:///C:/Users/Mike/.ssh/id_rsa'), null)
})

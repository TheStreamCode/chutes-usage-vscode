import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

test('compiles the webview bootstrap as browser-safe JavaScript', () => {
  const mainJs = readFileSync(join(process.cwd(), 'out', 'webview', 'main.js'), 'utf8')

  assert.doesNotMatch(mainJs, /\brequire\(/)
  assert.doesNotMatch(mainJs, /\bexports\b/)
  assert.match(mainJs, /\.\/presentation\.js/)
})

test('loads the webview bootstrap as an ES module script', () => {
  const providerJs = readFileSync(join(process.cwd(), 'out', 'src', 'views', 'ChutesWebviewProvider.js'), 'utf8')

  assert.match(providerJs, /type="module"/)
})

test('renders the key action label from presentation state', () => {
  const mainJs = readFileSync(join(process.cwd(), 'out', 'webview', 'main.js'), 'utf8')

  assert.match(mainJs, /actionButton\(presentation\.keyActionLabel, ['"]setApiKey['"]/)
})

test('does not embed fixed subscription plan examples in the webview bundle', () => {
  const mainJs = readFileSync(join(process.cwd(), 'out', 'webview', 'main.js'), 'utf8')

  assert.doesNotMatch(mainJs, /\$3 plan gets/)
  assert.doesNotMatch(mainJs, /\$10 gets/)
  assert.doesNotMatch(mainJs, /\$20 gets/)
})

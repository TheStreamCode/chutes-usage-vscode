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

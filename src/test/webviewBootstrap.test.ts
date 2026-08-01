import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const mainJs = readFileSync(join(root, 'out', 'webview', 'main.js'), 'utf8')
const messagesJs = readFileSync(join(root, 'out', 'webview', 'messages.js'), 'utf8')
const domJs = readFileSync(join(root, 'out', 'webview', 'dom.js'), 'utf8')
const stylesCss = readFileSync(join(root, 'out', 'webview', 'styles.css'), 'utf8')
const providerJs = readFileSync(join(root, 'out', 'src', 'views', 'ChutesWebviewProvider.js'), 'utf8')

test('compiles the webview bootstrap as browser-safe JavaScript', () => {
  assert.doesNotMatch(mainJs, /\brequire\(/)
  assert.doesNotMatch(mainJs, /\bexports\b/)
  assert.match(mainJs, /\.\/presentation\.js/)
  assert.match(mainJs, /\.\/dom\.js/)
})

test('loads the webview bootstrap as an ES module script with a CSP nonce', () => {
  assert.match(providerJs, /type="module"/)
  assert.match(providerJs, /nonce-/)
  assert.match(providerJs, /strict-dynamic/)
  assert.match(providerJs, /base-uri 'none'/)
  assert.match(providerJs, /form-action 'none'/)
  assert.match(providerJs, /font-src/)
  assert.match(providerJs, /img-src/)
})

test('validates extension messages and cached state before rendering', () => {
  assert.match(mainJs, /isStateMessage\(event\.data\)/)
  assert.match(mainJs, /isCachedPayload\(raw\)/)
  assert.match(messagesJs, /Number\.isFinite/)
})

test('uses explicit DOM properties instead of a generic attribute sink', () => {
  assert.doesNotMatch(domJs, /setAttribute\(/)
  assert.doesNotMatch(domJs, /\.data\s*=/)
  assert.match(domJs, /ariaLabel/)
  assert.match(domJs, /dataset\.kind/)
  assert.match(domJs, /textContent/)
})

test('does not embed fixed subscription plan examples in the webview bundle', () => {
  assert.doesNotMatch(mainJs, /\$3 plan gets/)
  assert.doesNotMatch(mainJs, /\$10 gets/)
  assert.doesNotMatch(mainJs, /\$20 gets/)
})

test('renders the dashboard without ever wiping innerHTML on state updates', () => {
  // app.innerHTML = '' is the source of the flicker we removed; protect against regressions.
  assert.doesNotMatch(mainJs, /\bapp\.innerHTML\s*=\s*['"]/)
  // The replaceChildren call inside mount() runs only once at boot.
  const replaceChildrenCount = (mainJs.match(/parent\.replaceChildren\(/g) ?? []).length
  assert.equal(replaceChildrenCount, 1, 'mount() should call parent.replaceChildren exactly once')
})

test('persists state with vscode.setState/getState to avoid Loading flashes on reopen', () => {
  assert.match(mainJs, /vscode\.getState\(/)
  assert.match(mainJs, /vscode\.setState\(/)
  assert.match(mainJs, /SCHEMA_VERSION/)
})

test('exposes ARIA progressbar semantics on metric cards', () => {
  assert.match(mainJs, /progressbar/)
  assert.match(mainJs, /ariaValueMin/)
  assert.match(mainJs, /ariaValueMax/)
  assert.match(mainJs, /ariaValueNow/)
})

test('migrates styles to VS Code theme tokens with chutes accents', () => {
  assert.match(stylesCss, /var\(--vscode-/)
  assert.match(stylesCss, /--chutes-accent-mint/)
  assert.match(stylesCss, /--chutes-accent-violet/)
  assert.match(stylesCss, /--chutes-headline-violet/)
})

test('respects prefers-reduced-motion to avoid distracting motion in side panels', () => {
  assert.match(stylesCss, /prefers-reduced-motion:\s*reduce/)
})

test('forces [hidden] display:none so flex/grid/inline-flex classes do not leak', () => {
  // Without this rule, .banner/.loading-skeleton/.stale-badge etc. stay visible
  // even when hidden=true is set, because the browser default loses on cascade order.
  assert.match(stylesCss, /\[hidden\]\s*\{\s*display:\s*none\s*!important/)
})

test('uses --card-index for staggered animations instead of hard-coded nth-child', () => {
  assert.match(stylesCss, /--card-index/)
  assert.doesNotMatch(stylesCss, /nth-child\(1\)/)
  assert.doesNotMatch(stylesCss, /nth-child\(2\)/)
  assert.doesNotMatch(stylesCss, /nth-child\(3\)/)
})

test('drops the hardcoded twilight palette in favour of theme-aware tokens', () => {
  // The old #050505 background and infinite scan animation should be gone.
  assert.doesNotMatch(stylesCss, /#050505/)
  assert.doesNotMatch(stylesCss, /animation:\s*scan\s+\d/)
  assert.doesNotMatch(stylesCss, /animation:\s*pulse\s+\d/)
})

test('renders a current-tier highlight and per-card stale state', () => {
  assert.match(mainJs, /is-current/)
  assert.match(mainJs, /is-stale/)
})

test('packages Codicons assets alongside the webview bundle', () => {
  assert.ok(existsSync(join(root, 'out', 'webview', 'codicon.css')), 'codicon.css must be copied to out/webview/')
  assert.ok(existsSync(join(root, 'out', 'webview', 'codicon.ttf')), 'codicon.ttf must be copied to out/webview/')
})

test('uses natural-case copy aligned with chutes.ai instead of monospace prefixes', () => {
  // Old design used "// AWAITING API KEY" / "// REFRESHING" / "// CONNECTION ERROR".
  assert.doesNotMatch(mainJs, /\/\/\s+AWAITING API KEY/)
  assert.doesNotMatch(mainJs, /\/\/\s+REFRESHING/)
  assert.doesNotMatch(mainJs, /\/\/\s+SYNC FAILED/)
})

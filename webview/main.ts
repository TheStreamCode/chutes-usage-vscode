import { getHeaderPresentation } from './presentation.js'

type ConnectionState = 'missing-key' | 'loading' | 'ready' | 'error'

type UsageWindow = {
  id: string
  kind: string
  label: string
  unit: 'usd' | 'requests'
  used: number | null
  limit: number | null
  remaining: number | null
  percentUsed: number | null
  resetLabel: string | null
  status?: 'trusted' | 'stale' | 'unknown'
  dataSource?: 'quota-usage-me' | 'quota-usage-fallback' | 'subscription-usage' | 'quotas' | 'unknown'
}

type PlanInfo = {
  planName: string | null
  monthlyPriceUsd: number | null
  monthlyCapUsd: number | null
  fourHourCapUsd: number | null
  dailyRequestLimit: number | null
  paygDiscountPercent: number | null
}

type DashboardState = {
  connectionState: ConnectionState
  connected: boolean
  lastUpdatedAt: string | null
  data: {
    windows: UsageWindow[]
    plan: PlanInfo | null
  } | null
  errorMessage: string | null
}

type StateMessage = {
  type: 'state'
  state: DashboardState
}

declare function acquireVsCodeApi(): {
  postMessage: (message: unknown) => void
  setState: (state: unknown) => void
  getState: () => unknown
}

const vscode = acquireVsCodeApi()
const app = document.getElementById('app')

window.addEventListener('message', (event: MessageEvent<StateMessage>) => {
  if (event.data.type !== 'state') {
    return
  }
  render(event.data.state)
})

render({
  connectionState: 'loading',
  connected: false,
  lastUpdatedAt: null,
  data: null,
  errorMessage: null
})

function render(state: DashboardState): void {
  if (!app) return

  app.innerHTML = ''
  app.append(buildHeader(state))

  if (state.connectionState === 'missing-key') {
    app.append(buildMissingKey())
    app.append(buildFooter(state))
    return
  }

  if (state.connectionState === 'loading' && !state.data) {
    app.append(buildLoadingState())
    app.append(buildFooter(state))
    return
  }

  if (state.connectionState === 'error' && !state.data) {
    app.append(buildErrorState(state.errorMessage ?? 'Unable to load your Chutes usage.'))
    app.append(buildFooter(state))
    return
  }

  if (!state.data) {
    app.append(buildEmptyState('No usage data available yet.'))
    app.append(buildFooter(state))
    return
  }

  if (state.connectionState === 'error' && state.data) {
    app.append(buildStaleWarning(state.errorMessage ?? 'Last sync failed. Showing cached data.'))
  }

  app.append(buildPlanSummary(state.data.plan, state.data.windows))

  const metricsGrid = document.createElement('div')
  metricsGrid.className = 'metrics-grid'

  for (const win of state.data.windows) {
    metricsGrid.append(buildMetricCard(win))
  }

  app.append(metricsGrid)

  app.append(buildPlanLimits())

  app.append(buildFooter(state))
}

function buildHeader(state: DashboardState): HTMLElement {
  const header = document.createElement('header')
  header.className = 'header'
  const presentation = getHeaderPresentation(state)

  const brand = document.createElement('div')
  brand.className = 'header-brand'

  const title = document.createElement('h1')
  title.textContent = 'Chutes // Usage'

  const statusLine = document.createElement('div')
  statusLine.className = 'status-line'

  if (presentation.showDot) {
    const dot = document.createElement('span')
    dot.className = 'dot'
    statusLine.append(dot)
  }

  statusLine.append(document.createTextNode(presentation.statusText))

  brand.append(title, statusLine)

  const actions = document.createElement('div')
  actions.className = 'actions'

  actions.append(actionButton('Refresh', 'refresh'))

  if (state.connectionState === 'missing-key') {
    actions.append(actionButton('Set Key', 'setApiKey', 'primary'))
  } else {
    actions.append(actionButton('Key', 'setApiKey', 'default'))
    actions.append(actionButton('Remove', 'removeApiKey', presentation.removeDisabled ? 'disabled' : 'danger'))
  }

  header.append(brand, actions)
  return header
}

function buildMissingKey(): HTMLElement {
  const container = document.createElement('section')
  container.className = 'empty-state'

  const title = document.createElement('h2')
  title.textContent = '// Connect Your API Key'

  const text = document.createElement('p')
  text.textContent = 'Enter your Chutes API key to start monitoring usage and quotas in real time.'

  const button = actionButton('Set API Key', 'setApiKey', 'primary')
  button.style.fontSize = '11px'
  button.style.padding = '8px 18px'

  const hint = document.createElement('div')
  hint.className = 'empty-hint'
  hint.textContent = 'Your key is stored securely in VS Code SecretStorage'

  container.append(title, text, button, hint)
  return container
}

function buildLoadingState(): HTMLElement {
  const container = document.createElement('section')
  container.className = 'empty-state'

  const title = document.createElement('h2')
  title.className = 'text-mint'
  title.textContent = '// Loading Usage...'

  const text = document.createElement('p')
  text.textContent = 'Fetching your Chutes usage data.'

  container.append(title, text)
  return container
}

function buildErrorState(message: string): HTMLElement {
  const container = document.createElement('section')
  container.className = 'empty-state'

  const title = document.createElement('h2')
  title.textContent = '// Connection Error'

  const text = document.createElement('p')
  text.textContent = message

  const button = actionButton('Retry', 'refresh', 'primary')

  container.append(title, text, button)
  return container
}

function buildStaleWarning(message: string): HTMLElement {
  const banner = document.createElement('div')
  banner.className = 'status-banner stale'

  const icon = document.createElement('span')
  icon.className = 'banner-icon'
  icon.textContent = '\u26A0'

  const text = document.createElement('span')
  text.textContent = message

  banner.append(icon, text)
  return banner
}

function buildEmptyState(textValue: string): HTMLElement {
  const container = document.createElement('section')
  container.className = 'empty-state'

  const title = document.createElement('h2')
  title.textContent = '// No Data'

  const text = document.createElement('p')
  text.textContent = textValue

  container.append(title, text)
  return container
}

function buildMetricCard(win: UsageWindow): HTMLElement {
  const card = document.createElement('article')
  card.className = `metric-card ${win.kind === 'rolling-4h' ? 'violet' : ''}`

  const header = document.createElement('div')
  header.className = 'metric-header'

  const label = document.createElement('div')
  label.className = 'metric-label'
  label.textContent = win.label

  const unit = document.createElement('div')
  unit.className = 'metric-unit'
  unit.textContent = win.unit === 'usd' ? 'USD' : 'REQ'

  header.append(label, unit)

  const value = document.createElement('div')
  value.className = 'metric-value'
  value.textContent = formatValue(win.used, win.unit)

  const sub = document.createElement('div')
  sub.className = 'metric-sub'
  sub.textContent = buildWindowSubline(win)

  const progressContainer = document.createElement('div')
  progressContainer.className = 'progress-container'

  const track = document.createElement('div')
  track.className = 'progress-track'

  const fill = document.createElement('div')
  const pct = Math.max(0, Math.min(win.percentUsed ?? 0, 100))
  let fillClass = 'progress-fill'
  if (win.kind === 'rolling-4h') {
    fillClass += ' violet'
  } else if (pct >= 90) {
    fillClass += ' critical-usage'
  } else if (pct >= 75) {
    fillClass += ' high-usage'
  }
  fill.className = fillClass
  fill.style.width = `${pct}%`

  track.append(fill)
  progressContainer.append(track)

  card.append(header, value, sub, progressContainer)
  return card
}

function buildPlanSummary(plan: PlanInfo | null, windows: UsageWindow[]): HTMLElement {
  const billing = windows.find((window) => window.kind === 'billing-cycle')
  const rolling = windows.find((window) => window.kind === 'rolling-4h')
  const daily = windows.find((window) => window.kind === 'daily-requests')

  const panel = document.createElement('section')
  panel.className = 'plan-panel'

  const title = document.createElement('div')
  title.className = 'section-title'
  title.textContent = 'Plan Snapshot'

  const grid = document.createElement('div')
  grid.className = 'plan-grid'

  grid.append(
    buildPlanStat('Plan', plan?.planName ?? 'Unknown'),
    buildPlanStat('Monthly Price', formatValue(plan?.monthlyPriceUsd ?? null, 'usd')),
    buildPlanStat('Monthly Left', formatValue(billing?.remaining ?? null, 'usd')),
    buildPlanStat('4H Limit', formatValue(plan?.fourHourCapUsd ?? rolling?.limit ?? null, 'usd')),
    buildPlanStat('Daily Limit', formatRequestsLimitValue(plan?.dailyRequestLimit ?? daily?.limit ?? null))
  )

  grid.classList.add('plan-grid-wide')

  const monthlyPriceUsd = plan?.monthlyPriceUsd ?? null
  const monthlyCapUsd = plan?.monthlyCapUsd ?? null
  const paygDiscountPercent = plan?.paygDiscountPercent ?? null

  if (monthlyPriceUsd !== null || monthlyCapUsd !== null || paygDiscountPercent !== null) {
    const meta = document.createElement('p')
    meta.className = 'plan-meta muted'

    const parts: string[] = []
    if (monthlyPriceUsd !== null) {
      parts.push(`Subscription ${formatValue(monthlyPriceUsd, 'usd')}/mo`)
    }
    if (monthlyCapUsd !== null) {
      parts.push(`Monthly cap ${formatValue(monthlyCapUsd, 'usd')}`)
    }
    if (paygDiscountPercent !== null) {
      parts.push(`PAYG ${Math.round(paygDiscountPercent)}% off`)
    }

    meta.textContent = parts.join(' \u00B7 ')
    panel.append(title, grid, meta)
    return panel
  }

  panel.append(title, grid)
  return panel
}

function buildPlanStat(label: string, value: string): HTMLElement {
  const item = document.createElement('div')
  item.className = 'plan-stat'

  const statLabel = document.createElement('div')
  statLabel.className = 'plan-stat-label'
  statLabel.textContent = label

  const statValue = document.createElement('div')
  statValue.className = 'plan-stat-value'
  statValue.textContent = value

  item.append(statLabel, statValue)
  return item
}

function buildWindowSubline(window: UsageWindow): string {
  const parts = [`of ${window.unit === 'requests' ? formatRequestsLimitValue(window.limit) : formatValue(window.limit, window.unit)}`]

  if (window.remaining !== null) {
    parts.push(`${formatValue(window.remaining, window.unit)} left`)
  }

  if (window.resetLabel) {
    parts.push(`resets ${window.resetLabel.toLowerCase()}`)
  }

  return parts.join(' \u00B7 ')
}

function buildPlanLimits(): HTMLElement {
  const section = document.createElement('section')
  section.className = 'plan-limits-section'

  const title = document.createElement('div')
  title.className = 'section-title'
  title.textContent = 'Plan Limits'

  const intro = document.createElement('p')
  intro.className = 'plan-limits-intro'
  intro.textContent = 'All subscription usage is measured in pay-as-you-go equivalent dollars.'

  const fiveXNote = document.createElement('div')
  fiveXNote.className = 'plan-limits-five-x'
  fiveXNote.innerHTML = '5\u00D7 the value of pay-as-you-go'
  const fiveXDesc = document.createElement('p')
  fiveXDesc.className = 'plan-limits-five-x-desc'
  fiveXDesc.textContent = 'Every subscription includes up to 5 times the monthly price in equivalent pay-as-you-go usage. A $3 plan gets $15 of usage, $10 gets $50, and $20 gets $100.'

  const tiersGrid = document.createElement('div')
  tiersGrid.className = 'plan-limits-tiers'

  const baseData = { name: 'Base', price: '$3/mo', cap: '$15', daily: '300', burst: '$1.25', discount: '3%' }
  const plusData = { name: 'Plus', price: '$10/mo', cap: '$50', daily: '2,000', burst: '$4.17', discount: '6%' }
  const proData = { name: 'Pro', price: '$20/mo', cap: '$100', daily: '5,000', burst: '$8.33', discount: '10%' }

  tiersGrid.append(buildTierCard(baseData, 'base'))
  tiersGrid.append(buildTierCard(plusData, 'plus'))
  tiersGrid.append(buildTierCard(proData, 'pro'))

  const tiersWrap = document.createElement('div')
  tiersWrap.className = 'plan-limits-tiers-wrap'
  tiersWrap.append(tiersGrid)

  const footnotes = document.createElement('div')
  footnotes.className = 'plan-limits-footnotes'

  footnotes.append(buildFootnote('The max API requests per day limit does not guarantee full usage \u2014 the monthly cap and 4-hour burst limit may be reached first.'))
  footnotes.append(buildFootnote('4-hour burst limit prevents concentrated usage spikes. It resets on a rolling window (~180 windows per month).'))
  footnotes.append(buildFootnote('Beyond your limits? Requests fall back to pay-as-you-go billing automatically. Your PAYG discount still applies.'))

  section.append(title, intro, fiveXNote, fiveXDesc, tiersWrap, footnotes)
  return section
}

function buildTierCard(data: { name: string; price: string; cap: string; daily: string; burst: string; discount: string }, tier: string): HTMLElement {
  const card = document.createElement('div')
  card.className = `plan-limits-tier tier-${tier}`

  const nameEl = document.createElement('div')
  nameEl.className = 'tier-name'
  nameEl.textContent = data.name

  const priceEl = document.createElement('div')
  priceEl.className = 'tier-price'
  priceEl.textContent = data.price

  const divider = document.createElement('div')
  divider.className = 'tier-divider'

  const rows = document.createElement('div')
  rows.className = 'tier-rows'
  rows.append(
    buildTierRow('Monthly cap', data.cap, 'Max usage per cycle'),
    buildTierRow('Daily reqs', data.daily, 'Max API reqs/day'),
    buildTierRow('4H burst', data.burst, 'Rolling spend cap'),
    buildTierRow('PAYG off', data.discount, 'Pay-as-you-go')
  )

  card.append(nameEl, priceEl, divider, rows)
  return card
}

function buildTierRow(label: string, value: string, tooltip: string): HTMLElement {
  const row = document.createElement('div')
  row.className = 'tier-row'
  row.title = tooltip

  const labelEl = document.createElement('span')
  labelEl.className = 'tier-row-label'
  labelEl.textContent = label

  const valueEl = document.createElement('span')
  valueEl.className = 'tier-row-value'
  valueEl.textContent = value

  row.append(labelEl, valueEl)
  return row
}

function buildFootnote(text: string): HTMLElement {
  const note = document.createElement('p')
  note.className = 'plan-limits-footnote'
  note.textContent = text
  return note
}

function buildFooter(state: DashboardState): HTMLElement {
  const footer = document.createElement('div')
  footer.className = 'dashboard-footer'

  if (state.lastUpdatedAt) {
    const time = document.createElement('span')
    time.textContent = `Updated ${new Date(state.lastUpdatedAt).toLocaleTimeString()}`
    footer.append(time)
  } else {
    const spacer = document.createElement('span')
    spacer.textContent = ''
    footer.append(spacer)
  }

  const link = document.createElement('a')
  link.className = 'footer-link'
  link.textContent = 'Chutes \u2197'
  link.addEventListener('click', (e) => {
    e.preventDefault()
    vscode.postMessage({ type: 'openExternal', href: 'https://chutes.ai' })
  })
  footer.append(link)

  return footer
}

type ButtonVariant = 'primary' | 'default' | 'danger' | 'disabled'

function actionButton(label: string, type: 'refresh' | 'setApiKey' | 'removeApiKey', variant: ButtonVariant = 'default'): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = label

  if (variant === 'primary') {
    button.classList.add('primary')
  } else if (variant === 'danger') {
    button.classList.add('danger')
  } else if (variant === 'disabled') {
    button.disabled = true
  }

  button.addEventListener('click', () => {
    vscode.postMessage({ type })
  })
  return button
}

function formatValue(value: number | null, unit: 'usd' | 'requests'): string {
  if (value === null) return '\u2014'
  if (unit === 'requests') return `${Math.round(value).toLocaleString()}`
  return `$${value.toFixed(2)}`
}

function formatRequestsLimitValue(value: number | null): string {
  if (value === null) return '\u2014'
  if (value === 0) return 'Unlimited'
  return `${Math.round(value).toLocaleString()}`
}
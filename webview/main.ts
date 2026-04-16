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

type QuotaEntry = {
  modelLabel: string
  quota: number | null
  lastUpdated: string | null
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
    quotas: QuotaEntry[]
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
    return
  }

  if (state.connectionState === 'loading' && !state.data) {
    app.append(buildLoadingState())
    return
  }

  if (state.connectionState === 'error' && !state.data) {
    app.append(buildErrorState(state.errorMessage ?? 'Unable to load your Chutes usage.'))
    return
  }

  if (!state.data) {
    app.append(buildEmptyState('No usage data available yet.'))
    return
  }

  app.append(buildPlanSummary(state.data.plan, state.data.windows))

  const metricsGrid = document.createElement('div')
  metricsGrid.className = 'metrics-grid'

  for (const win of state.data.windows) {
    metricsGrid.append(buildMetricCard(win))
  }

  app.append(metricsGrid)
  app.append(buildQuotasSection(state.data.quotas))
}

function buildHeader(state: DashboardState): HTMLElement {
  const header = document.createElement('header')
  header.className = 'header'

  const brand = document.createElement('div')
  brand.className = 'header-brand'

  const title = document.createElement('h1')
  title.textContent = 'Chutes // Usage'

  const statusLine = document.createElement('div')
  statusLine.className = 'status-line'

  if (state.connected) {
    const planName = state.data?.plan?.planName
    const monthlyPrice = state.data?.plan?.monthlyPriceUsd
    const updated = state.lastUpdatedAt
      ? `SYNCED ${new Date(state.lastUpdatedAt).toLocaleTimeString()}`
      : 'CONNECTED'
    const prefix = planName ? `${planName.toUpperCase()} // ` : monthlyPrice !== null && monthlyPrice !== undefined ? `$${monthlyPrice.toFixed(0)}/MO // ` : ''
    statusLine.innerHTML = `<span class="dot"></span>${prefix}${updated}`
  } else {
    statusLine.textContent = '// AWAITING API KEY'
  }

  brand.append(title, statusLine)

  const actions = document.createElement('div')
  actions.className = 'actions'
  actions.append(
    actionButton('Refresh', 'refresh'),
    actionButton(state.connected ? 'Replace Key' : 'Set Key', 'setApiKey', true),
    actionButton('Remove', 'removeApiKey', !state.connected)
  )

  header.append(brand, actions)
  return header
}

function buildMissingKey(): HTMLElement {
  const container = document.createElement('section')
  container.className = 'empty-state'

  const title = document.createElement('h2')
  title.textContent = '// API Key Required'

  const text = document.createElement('p')
  text.textContent = 'Enter your Chutes API key to begin monitoring usage and quotas.'

  const button = actionButton('Set API Key', 'setApiKey', true)
  button.classList.add('primary')

  container.append(title, text, button)
  return container
}

function buildLoadingState(): HTMLElement {
  const container = document.createElement('section')
  container.className = 'empty-state'

  const title = document.createElement('h2')
  title.className = 'text-mint'
  title.textContent = '// Loading...'

  const text = document.createElement('p')
  text.textContent = 'Fetching your Chutes usage data.'

  container.append(title, text)
  return container
}

function buildErrorState(message: string): HTMLElement {
  const container = document.createElement('section')
  container.className = 'empty-state'

  const title = document.createElement('h2')
  title.textContent = '// Error'

  const text = document.createElement('p')
  text.textContent = message

  const button = actionButton('Retry', 'refresh')

  container.append(title, text, button)
  return container
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
  unit.className = 'metric-sub'
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
  fill.className = `progress-fill ${win.kind === 'rolling-4h' ? 'violet' : ''}`
  fill.style.width = `${Math.max(0, Math.min(win.percentUsed ?? 0, 100))}%`

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
      parts.push(`Subscription ${formatValue(monthlyPriceUsd, 'usd')} / month`)
    }
    if (monthlyCapUsd !== null) {
      parts.push(`Monthly cap ${formatValue(monthlyCapUsd, 'usd')}`)
    }
    if (paygDiscountPercent !== null) {
      parts.push(`PAYG discount ${Math.round(paygDiscountPercent)}%`)
    }

    meta.textContent = parts.join(' // ')
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
    parts.push(window.resetLabel)
  }

  return parts.join(' // ')
}

function buildQuotasSection(quotas: QuotaEntry[]): HTMLElement {
  const section = document.createElement('section')
  section.className = 'section'

  const title = document.createElement('div')
  title.className = 'section-title'
  title.textContent = 'Quotas'

  const container = document.createElement('div')
  container.className = 'quota-container'

  if (quotas.length === 0) {
    const empty = document.createElement('p')
    empty.className = 'muted'
    empty.style.padding = '16px'
    empty.style.textAlign = 'center'
    empty.textContent = 'No model quota rows were returned by the API.'
    container.append(empty)
    section.append(title, container)
    return section
  }

  const table = document.createElement('table')
  table.className = 'quota-table'

  const thead = document.createElement('thead')
  thead.innerHTML = '<tr><th>Model</th><th>Quota</th><th>Last Updated</th></tr>'

  const tbody = document.createElement('tbody')
  for (const quota of quotas) {
    const row = document.createElement('tr')

    const modelCell = document.createElement('td')
    modelCell.textContent = quota.modelLabel

    const quotaCell = document.createElement('td')
    quotaCell.className = 'quota-value'
    quotaCell.textContent = quota.quota !== null ? `${quota.quota}` : '-'

    const updatedCell = document.createElement('td')
    updatedCell.className = 'muted'
    updatedCell.textContent = quota.lastUpdated ?? '-'

    row.append(modelCell, quotaCell, updatedCell)
    tbody.append(row)
  }

  table.append(thead, tbody)
  container.append(table)
  section.append(title, container)
  return section
}

function actionButton(label: string, type: 'refresh' | 'setApiKey' | 'removeApiKey', isPrimary = false): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = label
  if (isPrimary) button.classList.add('primary')
  button.addEventListener('click', () => {
    vscode.postMessage({ type })
  })
  return button
}

function formatValue(value: number | null, unit: 'usd' | 'requests'): string {
  if (value === null) return '--'
  if (unit === 'requests') return `${Math.round(value).toLocaleString()}`
  return `$${value.toFixed(2)}`
}

function formatRequestsLimitValue(value: number | null): string {
  if (value === null) return '--'
  if (value === 0) return 'Unlimited'
  return `${Math.round(value).toLocaleString()}`
}

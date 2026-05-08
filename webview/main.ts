import { formatResetLabel, getHeaderPresentation, type HeaderPresentation } from './presentation.js'
import { ariaSet, cls, codicon, el, setStyleVar, setText, toggle, txt } from './dom.js'

// KEEP IN SYNC WITH src/types.ts — these types are duplicated for the
// webview bundle which compiles separately from the extension host.
type ConnectionState = 'missing-key' | 'loading' | 'ready' | 'error'
type UsageWindowKind = 'billing-cycle' | 'rolling-4h' | 'daily-requests' | 'weekly' | 'unknown'

type UsageWindow = {
  id: string
  kind: UsageWindowKind
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

type PlanLimitEntry = {
  name: string
  priceLabel: string
  monthlyCapLabel: string
  dailyRequestLimitLabel: string
  fourHourCapLabel: string
  paygDiscountLabel: string
}

type DashboardState = {
  connectionState: ConnectionState
  connected: boolean
  lastUpdatedAt: string | null
  data: {
    windows: UsageWindow[]
    plan: PlanInfo | null
    planLimits: PlanLimitEntry[]
  } | null
  errorMessage: string | null
}

type StateMessage = {
  type: 'state'
  state: DashboardState
  refreshIntervalMs?: number
}

type ActionType = 'refresh' | 'setApiKey' | 'removeApiKey' | 'openExternal'

type CachedPayload = {
  version: number
  state: DashboardState
  planLimitsCollapsed: boolean
}

declare function acquireVsCodeApi(): {
  postMessage: (message: { type: ActionType; href?: string }) => void
  setState: (state: unknown) => void
  getState: () => unknown
}

const SCHEMA_VERSION = 2
const DEFAULT_REFRESH_INTERVAL_MS = 60_000
const KNOWN_KINDS: UsageWindowKind[] = ['billing-cycle', 'rolling-4h', 'daily-requests', 'weekly']

const vscode = acquireVsCodeApi()
const app = document.getElementById('app')

interface ProgressRefs {
  container: HTMLDivElement
  fill: HTMLDivElement
}

interface MetricCardRefs {
  root: HTMLElement
  label: Text
  unitBadge: HTMLSpanElement
  unitText: Text
  staleBadge: HTMLSpanElement
  value: Text
  sub: Text
  progress: ProgressRefs
}

interface PlanStatRefs {
  root: HTMLElement
  label: Text
  value: Text
}

interface TierRefs {
  root: HTMLElement
  currentBadge: HTMLSpanElement
  name: Text
  price: Text
  monthlyCap: Text
  daily: Text
  fourH: Text
  payg: Text
}

interface DomRefs {
  app: HTMLElement
  body: HTMLElement
  header: {
    statusText: Text
    dot: HTMLSpanElement
    refreshBtn: HTMLButtonElement
    setKeyBtn: HTMLButtonElement
    removeBtn: HTMLButtonElement
    setKeyLabel: Text
  }
  staleBanner: { root: HTMLDivElement; text: Text }
  emptyStates: {
    missingKey: HTMLElement
    loading: HTMLElement
    error: HTMLElement
    errorMessage: Text
    noData: HTMLElement
  }
  planSummary: {
    root: HTMLElement
    plan: PlanStatRefs
    monthlyPrice: PlanStatRefs
    monthlyLeft: PlanStatRefs
    fourHLimit: PlanStatRefs
    dailyLimit: PlanStatRefs
    metaWrap: HTMLElement
    metaText: Text
  }
  metricsGrid: {
    root: HTMLElement
    cards: Map<UsageWindowKind, MetricCardRefs>
  }
  planLimits: {
    root: HTMLElement
    toggleBtn: HTMLButtonElement
    chevron: HTMLElement
    body: HTMLElement
    fiveXDesc: Text
    tiersWrap: HTMLElement
    tiers: TierRefs[]
    cachedTierCount: number
  }
  footer: {
    updatedText: Text
    nextRefreshText: Text
  }
}

let lastStateReceivedAt: number | null = null
let nextRefreshTimerId: ReturnType<typeof setInterval> | null = null
let planLimitsCollapsed = false
let refreshIntervalMs = DEFAULT_REFRESH_INTERVAL_MS

if (app) {
  const cached = readCached()
  if (cached) {
    planLimitsCollapsed = cached.planLimitsCollapsed
  }

  const refs = mount(app)

  if (cached) {
    update(refs, cached.state, { fromCache: true })
  } else {
    update(refs, initialState(), { fromCache: true })
  }

  window.addEventListener('message', (event: MessageEvent<StateMessage>) => {
    if (event.data?.type !== 'state') return
    if (typeof event.data.refreshIntervalMs === 'number' && event.data.refreshIntervalMs > 0) {
      refreshIntervalMs = event.data.refreshIntervalMs
    }
    const incoming = event.data.state
    update(refs, incoming, { fromCache: false })

    if (incoming.connectionState !== 'loading' || incoming.data !== null) {
      writeCached({ version: SCHEMA_VERSION, state: incoming, planLimitsCollapsed })
    }
  })

  // Pause the next-refresh ticker when the webview is hidden, clear it on unload.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopRefreshTicker()
    } else {
      startRefreshTicker(refs)
      refreshNextRefreshLabel(refs)
    }
  })
  window.addEventListener('pagehide', stopRefreshTicker)
}

function initialState(): DashboardState {
  return {
    connectionState: 'loading',
    connected: false,
    lastUpdatedAt: null,
    data: null,
    errorMessage: null
  }
}

function readCached(): CachedPayload | null {
  try {
    const raw = vscode.getState() as CachedPayload | null
    if (!raw || raw.version !== SCHEMA_VERSION) return null
    return raw
  } catch {
    return null
  }
}

function writeCached(payload: CachedPayload): void {
  try {
    vscode.setState(payload)
  } catch {
    // ignore quota errors
  }
}

function dispatchAction(type: ActionType, href?: string): void {
  vscode.postMessage(href ? { type, href } : { type })
}

function mount(parent: HTMLElement): DomRefs {
  parent.replaceChildren()
  const body = document.body

  // ---- Header ----
  const dot = el('span', { className: 'status-dot', attrs: { 'aria-hidden': 'true' } })
  const statusText = txt('Connecting…')
  const statusLine = el('div', { className: 'status-line' }, dot, statusText)

  const title = el('h1', { className: 'brand-title' }, 'Chutes ', el('span', { className: 'brand-divider' }, '/'), ' Usage')
  const brand = el('div', { className: 'header-brand' }, title, statusLine)

  const refreshBtn = el(
    'button',
    {
      className: 'btn btn-ghost btn-icon',
      type: 'button',
      title: 'Refresh',
      attrs: { 'aria-label': 'Refresh Chutes usage' }
    },
    codicon('refresh')
  )
  refreshBtn.addEventListener('click', () => dispatchAction('refresh'))

  const setKeyLabel = txt('Replace key')
  const setKeyBtn = el(
    'button',
    {
      className: 'btn btn-ghost',
      type: 'button',
      attrs: { 'aria-label': 'Set or replace API key' }
    },
    setKeyLabel
  )
  setKeyBtn.addEventListener('click', () => dispatchAction('setApiKey'))

  const removeBtn = el(
    'button',
    {
      className: 'btn btn-ghost btn-danger btn-icon',
      type: 'button',
      title: 'Remove key',
      attrs: { 'aria-label': 'Remove stored API key' }
    },
    codicon('trash')
  )
  removeBtn.addEventListener('click', () => dispatchAction('removeApiKey'))

  const actions = el('div', { className: 'actions' }, refreshBtn, setKeyBtn, removeBtn)
  const headerEl = el('header', { className: 'header' }, brand, actions)

  // ---- Stale banner ----
  const staleText = txt('')
  const staleBanner = el(
    'div',
    { className: 'banner banner-stale', hidden: true, attrs: { role: 'status', 'aria-live': 'polite' } },
    codicon('warning'),
    staleText
  ) as HTMLDivElement

  // ---- Empty states ----
  const missingKey = buildMissingKey()
  const loadingSkeleton = buildLoadingSkeleton()
  const errorMessage = txt('')
  const errorState = buildErrorState(errorMessage)
  const noData = buildNoDataState()

  // ---- Plan Snapshot ----
  const plan = createPlanStat('Plan', '—')
  const monthlyPrice = createPlanStat('Monthly', '—')
  const monthlyLeft = createPlanStat('Left', '—')
  const fourHLimit = createPlanStat('4h limit', '—')
  const dailyLimit = createPlanStat('Daily limit', '—')

  const planGrid = el(
    'div',
    { className: 'plan-grid' },
    plan.root,
    monthlyPrice.root,
    monthlyLeft.root,
    fourHLimit.root,
    dailyLimit.root
  )

  const metaText = txt('')
  const metaWrap = el('p', { className: 'plan-meta' }, metaText)
  metaWrap.hidden = true

  const planSummaryRoot = el(
    'section',
    { className: 'plan-panel' },
    el('div', { className: 'section-title' }, 'Plan snapshot'),
    planGrid,
    metaWrap
  )

  // ---- Metrics grid ----
  const metricsGridEl = el('div', { className: 'metrics-grid' })
  const metricCards = new Map<UsageWindowKind, MetricCardRefs>()
  for (const kind of KNOWN_KINDS) {
    const card = createMetricCard(kind)
    card.root.hidden = true
    metricCards.set(kind, card)
    metricsGridEl.append(card.root)
  }

  // ---- Plan Limits ----
  const fiveXDesc = txt('Subscriptions include 5× the monthly price in pay-as-you-go equivalent usage.')
  const tiersWrap = el('div', { className: 'plan-limits-tiers', id: 'plan-limits-tiers' })
  const chevron = codicon('chevron-down')
  cls(chevron, 'plan-limits-chevron', true)
  const toggleBtn = el(
    'button',
    {
      className: 'plan-limits-toggle',
      type: 'button',
      attrs: {
        'aria-expanded': planLimitsCollapsed ? 'false' : 'true',
        'aria-controls': 'plan-limits-tiers'
      }
    },
    el('span', { className: 'section-title-text' }, 'Plan limits'),
    chevron
  )
  toggleBtn.addEventListener('click', () => {
    planLimitsCollapsed = !planLimitsCollapsed
    applyCollapsedState(refs.planLimits.toggleBtn, refs.planLimits.body, refs.planLimits.chevron, planLimitsCollapsed)
    persistCollapsed()
  })

  const planLimitsBody = el(
    'div',
    { className: 'plan-limits-body' },
    el('p', { className: 'plan-limits-intro' }, fiveXDesc),
    tiersWrap,
    buildFootnotes()
  )

  const planLimitsRoot = el('section', { className: 'plan-limits-section' }, toggleBtn, planLimitsBody)

  // ---- Footer ----
  const updatedText = txt('')
  const nextRefreshText = txt('')
  const chutesLink = el(
    'a',
    { className: 'footer-link', href: 'https://chutes.ai', attrs: { rel: 'noopener noreferrer' } },
    'chutes.ai ',
    codicon('link-external')
  )
  chutesLink.addEventListener('click', (event) => {
    event.preventDefault()
    dispatchAction('openExternal', 'https://chutes.ai')
  })
  const footerLeft = el(
    'div',
    { className: 'footer-left' },
    el('span', { className: 'footer-updated' }, updatedText),
    el('span', { className: 'footer-next' }, nextRefreshText)
  )
  const footerEl = el('div', { className: 'dashboard-footer' }, footerLeft, chutesLink)

  parent.append(headerEl, staleBanner, missingKey, loadingSkeleton, errorState, noData, planSummaryRoot, metricsGridEl, planLimitsRoot, footerEl)

  const refs: DomRefs = {
    app: parent,
    body,
    header: {
      statusText,
      dot,
      refreshBtn,
      setKeyBtn,
      removeBtn,
      setKeyLabel
    },
    staleBanner: { root: staleBanner, text: staleText },
    emptyStates: {
      missingKey,
      loading: loadingSkeleton,
      error: errorState,
      errorMessage,
      noData
    },
    planSummary: {
      root: planSummaryRoot,
      plan,
      monthlyPrice,
      monthlyLeft,
      fourHLimit,
      dailyLimit,
      metaWrap,
      metaText
    },
    metricsGrid: { root: metricsGridEl, cards: metricCards },
    planLimits: {
      root: planLimitsRoot,
      toggleBtn,
      chevron,
      body: planLimitsBody,
      fiveXDesc,
      tiersWrap,
      tiers: [],
      cachedTierCount: 0
    },
    footer: { updatedText, nextRefreshText }
  }

  applyCollapsedState(refs.planLimits.toggleBtn, refs.planLimits.body, refs.planLimits.chevron, planLimitsCollapsed)
  startRefreshTicker(refs)

  return refs
}

function startRefreshTicker(refs: DomRefs): void {
  if (nextRefreshTimerId !== null) return
  nextRefreshTimerId = setInterval(() => {
    refreshNextRefreshLabel(refs)
  }, 1000)
}

function stopRefreshTicker(): void {
  if (nextRefreshTimerId === null) return
  clearInterval(nextRefreshTimerId)
  nextRefreshTimerId = null
}

function buildMissingKey(): HTMLElement {
  const container = el('section', { className: 'empty-state', hidden: true, attrs: { role: 'region', 'aria-label': 'API key required' } })
  const title = el('h2', { className: 'empty-title' }, 'Connect your API key')
  const text = el('p', { className: 'empty-text' }, 'Enter your Chutes API key to start monitoring usage and quotas in real time.')
  const button = el(
    'button',
    { className: 'btn btn-primary btn-pill', type: 'button' },
    codicon('key'),
    txt(' Set API key')
  )
  button.addEventListener('click', () => dispatchAction('setApiKey'))
  const hint = el('p', { className: 'empty-hint' }, 'Your key is stored securely in VS Code SecretStorage.')
  container.append(title, text, button, hint)
  return container
}

function buildLoadingSkeleton(): HTMLElement {
  const container = el('section', { className: 'loading-skeleton', hidden: true, attrs: { 'aria-label': 'Loading usage data' } })
  for (let i = 0; i < 3; i++) {
    const card = el('div', { className: 'skeleton-card' })
    setStyleVar(card, '--card-index', String(i))
    card.append(
      el('div', { className: 'skeleton-line skeleton-line-sm' }),
      el('div', { className: 'skeleton-line skeleton-line-lg' }),
      el('div', { className: 'skeleton-line skeleton-line-md' }),
      el('div', { className: 'skeleton-bar' })
    )
    container.append(card)
  }
  return container
}

function buildErrorState(errorMessage: Text): HTMLElement {
  const container = el(
    'section',
    { className: 'empty-state empty-state-error', hidden: true, attrs: { role: 'alert', 'aria-live': 'assertive' } }
  )
  const title = el('h2', { className: 'empty-title' }, 'Connection error')
  const text = el('p', { className: 'empty-text' }, errorMessage)
  const button = el(
    'button',
    { className: 'btn btn-primary btn-pill', type: 'button' },
    codicon('refresh'),
    txt(' Retry')
  )
  button.addEventListener('click', () => dispatchAction('refresh'))
  container.append(title, text, button)
  return container
}

function buildNoDataState(): HTMLElement {
  const container = el('section', { className: 'empty-state', hidden: true })
  const title = el('h2', { className: 'empty-title' }, 'No data')
  const text = el('p', { className: 'empty-text' }, 'No usage data available yet.')
  container.append(title, text)
  return container
}

function buildFootnotes(): HTMLElement {
  const list = el('ul', { className: 'plan-limits-footnotes' })
  const items = [
    'Daily request limit doesn’t guarantee full usage — monthly cap or 4-hour burst may hit first.',
    '4-hour burst limit prevents concentrated usage spikes. It resets on a rolling window (~180 windows per month).',
    'Beyond your limits? Requests fall back to pay-as-you-go billing automatically. Your PAYG discount still applies.'
  ]
  for (const item of items) {
    const li = el('li', { className: 'plan-limits-footnote' }, codicon('arrow-small-right'), txt(' '), txt(item))
    list.append(li)
  }
  return list
}

function createPlanStat(initialLabel: string, initialValue: string): PlanStatRefs {
  const labelNode = txt(initialLabel)
  const valueNode = txt(initialValue)
  const root = el(
    'div',
    { className: 'plan-stat' },
    el('div', { className: 'plan-stat-label' }, labelNode),
    el('div', { className: 'plan-stat-value' }, valueNode)
  )
  return { root, label: labelNode, value: valueNode }
}

function createMetricCard(kind: UsageWindowKind): MetricCardRefs {
  const labelNode = txt('')
  const unitText = txt('')
  const unitBadge = el('span', { className: 'unit-badge' }, unitText)
  const staleBadge = el(
    'span',
    { className: 'stale-badge', hidden: true, attrs: { title: 'Possible sync delay' } },
    codicon('warning'),
    txt(' stale')
  )

  const valueNode = txt('—')
  const subNode = txt('')

  const fill = el('div', { className: 'progress-fill' })
  const container = el(
    'div',
    {
      className: 'progress-track',
      attrs: {
        role: 'progressbar',
        'aria-valuemin': '0',
        'aria-valuemax': '100',
        'aria-valuenow': '0'
      }
    },
    fill
  ) as HTMLDivElement

  const root = el(
    'article',
    { className: `metric-card metric-${kind}`, attrs: { 'data-kind': kind } },
    el(
      'div',
      { className: 'metric-header' },
      el('div', { className: 'metric-label' }, labelNode),
      el('div', { className: 'metric-meta' }, unitBadge, staleBadge)
    ),
    el('div', { className: 'metric-value' }, valueNode),
    el('div', { className: 'metric-sub' }, subNode),
    el('div', { className: 'progress-container' }, container)
  )

  return {
    root,
    label: labelNode,
    unitBadge,
    unitText,
    staleBadge,
    value: valueNode,
    sub: subNode,
    progress: { container, fill: fill as HTMLDivElement }
  }
}

function ensureTiers(refs: DomRefs, count: number): void {
  if (refs.planLimits.cachedTierCount === count) return

  refs.planLimits.tiersWrap.replaceChildren()
  refs.planLimits.tiers = []

  for (let i = 0; i < count; i++) {
    const name = txt('—')
    const price = txt('—')
    const monthlyCap = txt('—')
    const daily = txt('—')
    const fourH = txt('—')
    const payg = txt('—')

    const currentBadge = el(
      'span',
      { className: 'tier-current-badge', hidden: true, attrs: { 'aria-label': 'Current plan' } },
      codicon('star-full'),
      txt(' current')
    )

    const root = el(
      'div',
      { className: 'plan-limits-tier' },
      el(
        'div',
        { className: 'tier-head' },
        el('div', { className: 'tier-name' }, name),
        currentBadge
      ),
      el('div', { className: 'tier-price' }, price),
      el(
        'div',
        { className: 'tier-rows' },
        buildTierRow('Monthly cap', monthlyCap, 'Max usage per cycle'),
        buildTierRow('Daily reqs', daily, 'Max API requests per day'),
        buildTierRow('4h burst', fourH, 'Rolling spend cap'),
        buildTierRow('PAYG off', payg, 'Pay-as-you-go discount')
      )
    )
    setStyleVar(root, '--card-index', String(i))

    refs.planLimits.tiers.push({ root, currentBadge, name, price, monthlyCap, daily, fourH, payg })
    refs.planLimits.tiersWrap.append(root)
  }

  refs.planLimits.cachedTierCount = count
}

function buildTierRow(label: string, valueNode: Text, tooltip: string): HTMLElement {
  return el(
    'div',
    { className: 'tier-row', title: tooltip },
    el('span', { className: 'tier-row-label' }, label),
    el('span', { className: 'tier-row-value' }, valueNode)
  )
}

function applyCollapsedState(button: HTMLButtonElement, body: HTMLElement, chevron: HTMLElement, collapsed: boolean): void {
  ariaSet(button, 'aria-expanded', collapsed ? 'false' : 'true')
  toggle(body, !collapsed)
  cls(chevron, 'is-collapsed', collapsed)
}

function persistCollapsed(): void {
  const cached = readCached()
  const base = cached ?? { version: SCHEMA_VERSION, state: initialState(), planLimitsCollapsed }
  writeCached({ ...base, planLimitsCollapsed })
}

function update(refs: DomRefs, state: DashboardState, options: { fromCache: boolean }): void {
  const presentation = getHeaderPresentation(state)
  applyHeader(refs, presentation, state, options.fromCache)
  applyMode(refs, state)

  if (state.data) {
    applyPlanSummary(refs, state.data.plan, state.data.windows)
    applyMetrics(refs, state.data.windows)
    applyPlanLimits(refs, state.data.planLimits, state.data.plan?.planName ?? null)
  }

  applyFooter(refs, state, options.fromCache)

  if (!options.fromCache && state.connectionState !== 'loading') {
    lastStateReceivedAt = Date.now()
  }
  refreshNextRefreshLabel(refs)
}

function applyHeader(refs: DomRefs, presentation: HeaderPresentation, state: DashboardState, fromCache: boolean): void {
  setText(refs.header.statusText, presentation.statusText)
  toggle(refs.header.dot, presentation.showDot)
  cls(refs.header.dot, 'tone-live', presentation.tone === 'live')
  cls(refs.header.dot, 'tone-warn', presentation.tone === 'warn')
  cls(refs.header.dot, 'tone-error', presentation.tone === 'error')
  cls(refs.header.dot, 'tone-idle', presentation.tone === 'idle')

  setText(refs.header.setKeyLabel, presentation.keyActionLabel === 'Set Key' ? 'Set key' : 'Replace key')
  refs.header.removeBtn.disabled = presentation.removeDisabled

  // When rendering from cache the previous state may have been "loading"; keep
  // the refresh button enabled so the user can retry without waiting for the
  // first fresh message from the extension host.
  const isLiveLoading = !fromCache && state.connectionState === 'loading'
  refs.header.refreshBtn.disabled = isLiveLoading
  cls(refs.header.refreshBtn, 'is-busy', isLiveLoading)
}

function applyMode(refs: DomRefs, state: DashboardState): void {
  const hasData = !!state.data
  const showMissingKey = state.connectionState === 'missing-key'
  const showErrorBlocking = state.connectionState === 'error' && !hasData
  const showLoadingBlocking = state.connectionState === 'loading' && !hasData
  const showNoData = !showMissingKey && !showErrorBlocking && !showLoadingBlocking && !hasData
  const showStaleBanner = state.connectionState === 'error' && hasData

  toggle(refs.emptyStates.missingKey, showMissingKey)
  toggle(refs.emptyStates.loading, showLoadingBlocking)
  toggle(refs.emptyStates.error, showErrorBlocking)
  toggle(refs.emptyStates.noData, showNoData)

  toggle(refs.staleBanner.root, showStaleBanner)
  if (showStaleBanner) {
    const message = state.errorMessage && state.errorMessage.length > 0
      ? state.errorMessage
      : 'Last sync failed. Showing cached data.'
    setText(refs.staleBanner.text, ` ${message}`)
  }

  if (showErrorBlocking) {
    setText(refs.emptyStates.errorMessage, state.errorMessage ?? 'Unable to load your Chutes usage.')
  }

  toggle(refs.planSummary.root, hasData)
  toggle(refs.metricsGrid.root, hasData)
  toggle(refs.planLimits.root, hasData)
}

function applyPlanSummary(refs: DomRefs, plan: PlanInfo | null, windows: UsageWindow[]): void {
  const billing = windows.find((w) => w.kind === 'billing-cycle')
  const rolling = windows.find((w) => w.kind === 'rolling-4h')
  const daily = windows.find((w) => w.kind === 'daily-requests')

  setText(refs.planSummary.plan.value, plan?.planName ?? 'Unknown')
  setText(refs.planSummary.monthlyPrice.value, formatValue(plan?.monthlyPriceUsd ?? null, 'usd'))
  setText(refs.planSummary.monthlyLeft.value, formatValue(billing?.remaining ?? null, 'usd'))
  setText(refs.planSummary.fourHLimit.value, formatValue(plan?.fourHourCapUsd ?? rolling?.limit ?? null, 'usd'))
  setText(refs.planSummary.dailyLimit.value, formatRequestsLimitValue(plan?.dailyRequestLimit ?? daily?.limit ?? null))

  const monthlyPrice = plan?.monthlyPriceUsd ?? null
  const monthlyCap = plan?.monthlyCapUsd ?? null
  const payg = plan?.paygDiscountPercent ?? null
  const parts: string[] = []
  if (monthlyPrice !== null) parts.push(`Subscription ${formatValue(monthlyPrice, 'usd')}/mo`)
  if (monthlyCap !== null) parts.push(`Monthly cap ${formatValue(monthlyCap, 'usd')}`)
  if (payg !== null) parts.push(`PAYG ${Math.round(payg)}% off`)

  if (parts.length > 0) {
    setText(refs.planSummary.metaText, parts.join(' · '))
    refs.planSummary.metaWrap.hidden = false
  } else {
    refs.planSummary.metaWrap.hidden = true
  }
}

function applyMetrics(refs: DomRefs, windows: UsageWindow[]): void {
  const present = new Set<UsageWindowKind>()
  let visibleIndex = 0
  for (const window of windows) {
    const card = refs.metricsGrid.cards.get(window.kind)
    if (!card) continue
    present.add(window.kind)

    setStyleVar(card.root, '--card-index', String(visibleIndex++))
    card.root.hidden = false

    setText(card.label, window.label)
    setText(card.unitText, window.unit === 'usd' ? 'USD' : 'REQ')
    setText(card.value, formatValue(window.used, window.unit))
    setText(card.sub, buildWindowSubline(window))

    const isStale = window.status === 'stale'
    cls(card.root, 'is-stale', isStale)
    toggle(card.staleBadge, isStale)

    const pct = Math.max(0, Math.min(window.percentUsed ?? 0, 100))
    setStyleVar(card.progress.fill, '--progress-w', `${pct}%`)
    ariaSet(card.progress.container, 'aria-valuenow', String(Math.round(pct)))
    ariaSet(card.progress.container, 'aria-label', `${window.label} usage`)

    cls(card.progress.fill, 'progress-violet', window.kind === 'rolling-4h')
    cls(card.progress.fill, 'progress-warn', window.kind !== 'rolling-4h' && pct >= 75 && pct < 90)
    cls(card.progress.fill, 'progress-crit', window.kind !== 'rolling-4h' && pct >= 90)
  }

  for (const [kind, card] of refs.metricsGrid.cards) {
    if (!present.has(kind)) {
      card.root.hidden = true
    }
  }
}

function applyPlanLimits(refs: DomRefs, planLimits: PlanLimitEntry[], currentPlanName: string | null): void {
  ensureTiers(refs, planLimits.length)

  const examples = planLimits.slice(0, 3).map((p) => `${p.name} gets ${p.monthlyCapLabel}`)
  if (examples.length > 0) {
    setText(refs.planLimits.fiveXDesc, `Subscriptions include 5× the monthly price in pay-as-you-go equivalent. Examples: ${examples.join(', ')}.`)
  } else {
    setText(refs.planLimits.fiveXDesc, 'Subscriptions include 5× the monthly price in pay-as-you-go equivalent usage.')
  }

  const lowerCurrent = currentPlanName?.toLowerCase() ?? null

  planLimits.forEach((entry, i) => {
    const tier = refs.planLimits.tiers[i]
    if (!tier) return
    setText(tier.name, entry.name)
    setText(tier.price, entry.priceLabel)
    setText(tier.monthlyCap, entry.monthlyCapLabel)
    setText(tier.daily, entry.dailyRequestLimitLabel)
    setText(tier.fourH, entry.fourHourCapLabel)
    setText(tier.payg, entry.paygDiscountLabel)

    const isCurrent = lowerCurrent !== null && entry.name.toLowerCase() === lowerCurrent
    cls(tier.root, 'is-current', isCurrent)
    toggle(tier.currentBadge, isCurrent)

    const isPro = entry.name.toLowerCase() === 'pro'
    cls(tier.root, 'tier-pro', isPro)
    cls(tier.root, 'tier-plus', entry.name.toLowerCase() === 'plus')
    cls(tier.root, 'tier-base', entry.name.toLowerCase() === 'base')
  })
}

function applyFooter(refs: DomRefs, state: DashboardState, fromCache: boolean): void {
  if (state.lastUpdatedAt) {
    const time = new Date(state.lastUpdatedAt).toLocaleTimeString()
    setText(refs.footer.updatedText, fromCache ? `Cached · ${time}` : `Updated ${time}`)
  } else {
    setText(refs.footer.updatedText, '')
  }
}

function refreshNextRefreshLabel(refs: DomRefs): void {
  if (lastStateReceivedAt === null) {
    setText(refs.footer.nextRefreshText, '')
    return
  }
  const elapsed = Date.now() - lastStateReceivedAt
  const remaining = Math.max(0, refreshIntervalMs - elapsed)
  if (remaining <= 0) {
    setText(refs.footer.nextRefreshText, '· refresh due')
    return
  }
  const seconds = Math.ceil(remaining / 1000)
  setText(refs.footer.nextRefreshText, `· refresh in ${seconds}s`)
}

function buildWindowSubline(window: UsageWindow): string {
  const parts = [`of ${window.unit === 'requests' ? formatRequestsLimitValue(window.limit) : formatValue(window.limit, window.unit)}`]
  if (window.remaining !== null) {
    parts.push(`${formatValue(window.remaining, window.unit)} left`)
  }
  if (window.resetLabel) {
    parts.push(formatResetLabel(window.resetLabel) ?? window.resetLabel)
  }
  return parts.join(' · ')
}

function formatValue(value: number | null, unit: 'usd' | 'requests'): string {
  if (value === null) return '—'
  if (unit === 'requests') return Math.round(value).toLocaleString()
  return `$${value.toFixed(2)}`
}

function formatRequestsLimitValue(value: number | null): string {
  if (value === null) return '—'
  if (value === 0) return 'Unlimited'
  return Math.round(value).toLocaleString()
}

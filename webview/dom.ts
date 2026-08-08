type ElProps<K extends keyof HTMLElementTagNameMap> = {
  className?: string
  textContent?: string
  title?: string
  type?: string
  hidden?: boolean
  role?: string
  ariaLabel?: string
  ariaHidden?: boolean
  ariaLive?: 'off' | 'polite' | 'assertive'
  ariaAtomic?: boolean
  ariaExpanded?: boolean
  ariaValueMin?: number
  ariaValueMax?: number
  ariaValueNow?: number
  ariaValueText?: string
  dataKind?: string
} & Partial<Pick<HTMLElementTagNameMap[K], 'id'>>

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: ElProps<K> = {},
  ...children: Array<Node | string | null | undefined>
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  if (props.className !== undefined) node.className = props.className
  if (props.textContent !== undefined) node.textContent = props.textContent
  if (props.title !== undefined) node.title = props.title
  if (props.id !== undefined) node.id = props.id
  if (props.hidden) node.hidden = true
  if (props.role !== undefined) node.role = props.role
  if (props.ariaLabel !== undefined) node.ariaLabel = props.ariaLabel
  if (props.ariaHidden !== undefined) node.ariaHidden = String(props.ariaHidden)
  if (props.ariaLive !== undefined) node.ariaLive = props.ariaLive
  if (props.ariaAtomic !== undefined) node.ariaAtomic = String(props.ariaAtomic)
  if (props.ariaExpanded !== undefined) node.ariaExpanded = String(props.ariaExpanded)
  if (props.ariaValueMin !== undefined) node.ariaValueMin = String(props.ariaValueMin)
  if (props.ariaValueMax !== undefined) node.ariaValueMax = String(props.ariaValueMax)
  if (props.ariaValueNow !== undefined) node.ariaValueNow = String(props.ariaValueNow)
  if (props.ariaValueText !== undefined) node.ariaValueText = props.ariaValueText
  if (props.dataKind !== undefined) node.dataset.kind = props.dataKind
  if (tag === 'button' && props.type !== undefined) {
    (node as HTMLButtonElement).type = props.type as 'button' | 'reset' | 'submit'
  }
  for (const child of children) {
    if (child === null || child === undefined) continue
    node.append(typeof child === 'string' ? document.createTextNode(child) : child)
  }
  return node
}

export function txt(value: string): Text {
  return document.createTextNode(value)
}

export function setText(node: Text, value: string): void {
  if (node.textContent !== value) node.textContent = value
}

export function toggle(element: HTMLElement, on: boolean): void {
  if (element.hidden === on) element.hidden = !on
}

export function cls(element: HTMLElement, name: string, on: boolean): void {
  element.classList.toggle(name, on)
}

export function setAriaLabel(element: HTMLElement, value: string): void {
  if (element.ariaLabel !== value) element.ariaLabel = value
}

export function setAriaExpanded(element: HTMLElement, value: boolean): void {
  const stringValue = String(value)
  if (element.ariaExpanded !== stringValue) element.ariaExpanded = stringValue
}

export function setAriaValueNow(element: HTMLElement, value: number | null): void {
  if (value === null) {
    if (element.ariaValueNow !== null) element.removeAttribute('aria-valuenow')
    return
  }

  const stringValue = String(value)
  if (element.ariaValueNow !== stringValue) element.ariaValueNow = stringValue
}

export function setAriaValueText(element: HTMLElement, value: string): void {
  if (element.ariaValueText !== value) element.ariaValueText = value
}

export function setStyleVar(element: HTMLElement, name: string, value: string): void {
  if (element.style.getPropertyValue(name) !== value) element.style.setProperty(name, value)
}

export function codicon(name: string): HTMLElement {
  return el('i', { className: `codicon codicon-${name}`, ariaHidden: true })
}

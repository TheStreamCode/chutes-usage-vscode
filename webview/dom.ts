type ElProps<K extends keyof HTMLElementTagNameMap> = {
  className?: string
  textContent?: string
  title?: string
  href?: string
  type?: string
  hidden?: boolean
  attrs?: Record<string, string>
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
  if (props.attrs) {
    for (const [key, value] of Object.entries(props.attrs)) {
      node.setAttribute(key, value)
    }
  }
  if (tag === 'a' && props.href !== undefined) {
    (node as HTMLAnchorElement).href = props.href
  }
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
  if (node.data !== value) node.data = value
}

export function toggle(element: HTMLElement, on: boolean): void {
  if (element.hidden === on) element.hidden = !on
}

export function cls(element: HTMLElement, name: string, on: boolean): void {
  element.classList.toggle(name, on)
}

export function ariaSet(element: HTMLElement, key: string, value: string | boolean): void {
  const stringValue = typeof value === 'boolean' ? String(value) : value
  if (element.getAttribute(key) !== stringValue) element.setAttribute(key, stringValue)
}

export function setStyleVar(element: HTMLElement, name: string, value: string): void {
  if (element.style.getPropertyValue(name) !== value) element.style.setProperty(name, value)
}

export function codicon(name: string): HTMLElement {
  return el('i', { className: `codicon codicon-${name}`, attrs: { 'aria-hidden': 'true' } })
}

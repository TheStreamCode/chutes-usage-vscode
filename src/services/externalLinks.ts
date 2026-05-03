const ALLOWED_EXTERNAL_ORIGINS = new Set([
  'https://chutes.ai'
])

export function getAllowedExternalUri(href: string): URL | null {
  let url: URL

  try {
    url = new URL(href)
  } catch {
    return null
  }

  if (url.protocol !== 'https:' || !ALLOWED_EXTERNAL_ORIGINS.has(url.origin)) {
    return null
  }

  if (url.username || url.password) {
    return null
  }

  return url
}

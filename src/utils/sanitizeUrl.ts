export function sanitizeImageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return undefined
    return parsed.href
  } catch {
    return undefined
  }
}

/**
 * Returns `path` if it is a same-origin relative path (e.g. `/dashboard`),
 * otherwise `fallback`. Blocks open redirects via `//host`, `\\host` or
 * absolute URLs (`https://...`) passed through query params like `?redirect=`.
 */
export function sanitizeRedirectPath(path: string | null | undefined, fallback: string): string {
  if (!path) return fallback
  if (!path.startsWith('/')) return fallback
  if (path.startsWith('//') || path.startsWith('/\\')) return fallback
  return path
}

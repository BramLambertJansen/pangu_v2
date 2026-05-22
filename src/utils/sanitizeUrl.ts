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

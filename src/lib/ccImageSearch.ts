export interface CCImageResult {
  url: string
  title: string
  author: string | null
  license: string
  sourceUrl: string
  provider: 'wikimedia' | 'openverse'
}

async function searchWikimedia(query: string): Promise<CCImageResult | null> {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: query,
    gsrnamespace: '6',
    gsrlimit: '15',
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|mediatype',
    iiurlwidth: '512',
    format: 'json',
    origin: '*',
  })

  const resp = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`)
  if (!resp.ok) return null

  const data = await resp.json() as {
    query?: { pages?: Record<string, {
      title?: string
      imageinfo?: { url?: string; thumburl?: string; mediatype?: string; extmetadata?: Record<string, { value: string }> }[]
    }> }
  }

  const pages = Object.values(data.query?.pages ?? {})
  for (const page of pages) {
    const info = page.imageinfo?.[0]
    if (!info) continue
    if (!['BITMAP', 'DRAWING'].includes(info.mediatype ?? '')) continue
    const url = info.thumburl ?? info.url
    if (!url) continue

    const meta = info.extmetadata ?? {}
    const license = meta['LicenseShortName']?.value ?? 'CC'
    const rawAuthor = meta['Artist']?.value ?? null
    const author = rawAuthor ? rawAuthor.replace(/<[^>]+>/g, '').trim() : null

    return {
      url,
      title: (page.title ?? 'Wikimedia afbeelding').replace(/^File:/, ''),
      author,
      license,
      sourceUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title ?? '')}`,
      provider: 'wikimedia',
    }
  }
  return null
}

async function searchOpenverse(query: string): Promise<CCImageResult | null> {
  const params = new URLSearchParams({
    q: query,
    license_type: 'commercial,modification',
    page_size: '5',
  })

  const resp = await fetch(`https://api.openverse.org/v1/images/?${params}`, {
    headers: { Accept: 'application/json' },
  })
  if (!resp.ok) return null

  const data = await resp.json() as {
    results?: {
      url?: string
      title?: string
      creator?: string
      license?: string
      license_version?: string
      foreign_landing_url?: string
    }[]
  }

  const first = data.results?.[0]
  if (!first?.url) return null

  const licenseLabel = [first.license?.toUpperCase(), first.license_version].filter(Boolean).join(' ')

  return {
    url: first.url,
    title: first.title ?? 'Openverse afbeelding',
    author: first.creator ?? null,
    license: licenseLabel || 'CC',
    sourceUrl: first.foreign_landing_url ?? first.url,
    provider: 'openverse',
  }
}

/** Cascade: Wikimedia Commons → Openverse. Returns first CC result or null. */
export async function searchCCImage(query: string): Promise<CCImageResult | null> {
  const wikimedia = await searchWikimedia(query)
  if (wikimedia) return wikimedia
  return searchOpenverse(query)
}

/** Build a search query from item name + type, stripping world-specific proper nouns. */
export function buildImageSearchQuery(name: string, itemType: string): string {
  const typeTerms: Record<string, string> = {
    weapon: 'weapon medieval',
    armor: 'armor medieval',
    potion: 'potion vial flask',
    ring: 'ring jewel gemstone',
    rod: 'rod wand scepter',
    scroll: 'scroll parchment ancient',
    staff: 'staff wizard',
    wand: 'wand magic',
    wondrous: 'magic artifact',
    misc: 'object artifact',
  }
  const type = typeTerms[itemType] ?? 'object'
  // Take first 3 words of the item name to keep query broad enough
  const nameWords = name.split(/\s+/).slice(0, 3).join(' ')
  return `${nameWords} ${type} fantasy illustration`
}

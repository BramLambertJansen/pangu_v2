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
  // Try with commercial+modification filter first, then relax to any CC
  for (const licenseType of ['commercial,modification', 'commercial', '']) {
    const params = new URLSearchParams({ q: query, page_size: '5' })
    if (licenseType) params.set('license_type', licenseType)

    const resp = await fetch(`https://api.openverse.org/v1/images/?${params}`, {
      headers: { Accept: 'application/json' },
    })
    if (!resp.ok) continue

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
    if (!first?.url) continue

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
  return null
}

/** Cascade: Wikimedia Commons → Openverse. Returns first CC result or null. */
export async function searchCCImage(query: string): Promise<CCImageResult | null> {
  const wikimedia = await searchWikimedia(query)
  if (wikimedia) return wikimedia
  return searchOpenverse(query)
}

/** Build a search query from item type. Fantasy-specific item names don't match CC image databases,
 *  so we search by generic type terms which have broad CC coverage. */
export function buildImageSearchQuery(name: string, itemType: string): string {
  const typeTerms: Record<string, string[]> = {
    weapon:   ['medieval weapon', 'sword dagger axe medieval', 'fantasy weapon illustration'],
    armor:    ['medieval armor', 'chainmail plate armor', 'fantasy armor illustration'],
    potion:   ['potion bottle', 'glass vial flask liquid', 'magic potion illustration'],
    ring:     ['ring jewel gemstone', 'gold ring gemstone', 'jewelry ring illustration'],
    rod:      ['scepter rod', 'magic wand scepter medieval', 'fantasy scepter illustration'],
    scroll:   ['parchment scroll', 'ancient scroll manuscript', 'parchment roll illustration'],
    staff:    ['wizard staff', 'wooden staff magic', 'fantasy staff illustration'],
    wand:     ['magic wand', 'wizard wand fantasy', 'fantasy wand illustration'],
    wondrous: ['magic artifact', 'fantasy relic artifact', 'magic item illustration'],
    misc:     ['medieval artifact', 'fantasy object item', 'ancient artifact illustration'],
  }
  const candidates = typeTerms[itemType] ?? ['fantasy object illustration']
  // Pick a candidate based on the name hash for variety across items of the same type
  const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return candidates[hash % candidates.length]
}

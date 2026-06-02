// Open5e API V2 client and mappers.
// In Open5e V2, the SRD 5.1 document key is 'srd-2014' and SRD 5.2 is 'srd-2024'.

import type { Open5eListResponse, Open5eMonster, Open5eMagicItem, Open5eSpell } from '@/types/open5e.types'
import type { BestiaryStatus } from '@/types/bestiary.types'
import type { ItemType, ItemRarity } from '@/types/item.types'
import type { SpellSchool } from '@/types/spell.types'

export type SrdEdition = '2014' | '2024'
export const SRD_SLUG_2014 = 'srd-2014'
export const SRD_SLUG_2024 = 'srd-2024'

function editionToSlug(edition: SrdEdition): string {
  return edition === '2024' ? SRD_SLUG_2024 : SRD_SLUG_2014
}

// Open5e v2 returns some fields as { slug, label } objects instead of plain strings.
function toStr(val: unknown): string {
  if (val == null) return ''
  if (typeof val === 'string') return val
  if (typeof val === 'object') {
    const o = val as Record<string, unknown>
    if (typeof o.slug === 'string') return o.slug
    if (typeof o.label === 'string') return o.label
    if (typeof o.name === 'string') return o.name
  }
  return ''
}

async function fetchOpen5e<T>(endpoint: string, query: string, edition: SrdEdition = '2014'): Promise<Open5eListResponse<T>> {
  const url = new URL(`https://api.open5e.com/v2${endpoint}`)
  url.searchParams.set('document__key', editionToSlug(edition))
  url.searchParams.set('limit', '20')
  url.searchParams.set('name__icontains', query)
  const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Open5e: ${res.status} ${res.statusText}`)
  return res.json() as Promise<Open5eListResponse<T>>
}

export async function searchMonsters(query: string, edition: SrdEdition = '2014'): Promise<Open5eMonster[]> {
  const data = await fetchOpen5e<Open5eMonster>('/creatures/', query, edition)
  return data.results
}

export async function fetchMonsterDetail(key: string): Promise<Open5eMonster> {
  const res = await fetch(`https://api.open5e.com/v2/creatures/${encodeURIComponent(key)}/`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`Open5e: ${res.status} ${res.statusText}`)
  return res.json() as Promise<Open5eMonster>
}

export async function searchMagicItems(query: string, edition: SrdEdition = '2014'): Promise<Open5eMagicItem[]> {
  const data = await fetchOpen5e<Open5eMagicItem>('/magicitems/', query, edition)
  return data.results
}

export async function searchSpells(query: string, edition: SrdEdition = '2014'): Promise<Open5eSpell[]> {
  const data = await fetchOpen5e<Open5eSpell>('/spells/', query, edition)
  return data.results
}

export async function fetchSpellDetail(slug: string): Promise<Open5eSpell> {
  const res = await fetch(`https://api.open5e.com/v2/spells/${encodeURIComponent(slug)}/`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`Open5e: ${res.status} ${res.statusText}`)
  return res.json() as Promise<Open5eSpell>
}

export async function fetchMagicItemDetail(slug: string): Promise<Open5eMagicItem> {
  const res = await fetch(`https://api.open5e.com/v2/magicitems/${encodeURIComponent(slug)}/`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`Open5e: ${res.status} ${res.statusText}`)
  return res.json() as Promise<Open5eMagicItem>
}

// CR string (e.g. "1/8", "10", "0") → "CR X" threat label
export function mapChallengeRating(cr: string | number | undefined | null): string | null {
  if (cr == null || cr === '') return null
  return `CR ${String(cr)}`
}

// Open5e speed object → walk speed in feet (integer)
export function mapSpeed(speed: Record<string, number | string> | undefined | null): number {
  if (!speed) return 30
  const walk = speed['walk'] ?? speed['Walk'] ?? 30
  return typeof walk === 'number' ? walk : (parseInt(String(walk), 10) || 30)
}

// Open5e magic item type string → Pangu ItemType
export function mapItemType(type: unknown): ItemType {
  const lower = toStr(type).toLowerCase()
  if (!lower) return 'misc'
  if (lower.includes('weapon')) return 'weapon'
  if (lower.includes('armor') || lower.includes('armour') || lower.includes('shield')) return 'armor'
  if (lower.includes('potion') || lower.includes('oil')) return 'potion'
  if (lower.includes('ring')) return 'ring'
  if (lower.includes('rod')) return 'rod'
  if (lower.includes('scroll')) return 'scroll'
  if (lower.includes('staff')) return 'staff'
  if (lower.includes('wand')) return 'wand'
  if (lower.includes('wondrous')) return 'wondrous'
  return 'misc'
}

// Open5e rarity string (any casing/spacing) → Pangu ItemRarity
export function mapItemRarity(rarity: unknown): ItemRarity {
  const key = toStr(rarity).toLowerCase().replace(/[\s-]+/g, '_')
  if (!key) return 'common'
  const mapping: Record<string, ItemRarity> = {
    common: 'common',
    uncommon: 'uncommon',
    rare: 'rare',
    very_rare: 'very_rare',
    legendary: 'legendary',
    artifact: 'artifact',
  }
  return mapping[key] ?? 'common'
}

export interface BestiaryInsert {
  world_id: string
  user_id: string
  name: string
  subtitle: string | null
  creature_type: string | null
  threat_level: string | null
  habitat: string | null
  description: string | null
  notes: string | null
  status: BestiaryStatus
  committed: boolean
  hp: number
  ac: number
  speed: number
  stat_str: number
  stat_dex: number
  stat_con: number
  stat_int: number
  stat_wis: number
  stat_cha: number
  source: string
  source_slug: string
}

function buildMonsterDescription(monster: Open5eMonster): string | null {
  const sections: string[] = []

  if (monster.desc) sections.push(monster.desc)

  const addSection = (title: string, entries: Array<{ name: string; desc: string }> | undefined) => {
    if (!entries?.length) return
    sections.push(`**${title}**`)
    entries.forEach(e => sections.push(`*${e.name}.* ${e.desc}`))
  }

  addSection('Speciale Eigenschappen', monster.special_abilities)
  addSection('Acties', monster.actions)
  addSection('Bonusacties', monster.bonus_actions)
  addSection('Reacties', monster.reactions)

  if (monster.legendary_desc || monster.legendary_actions?.length) {
    sections.push('**Legendarische Acties**')
    if (monster.legendary_desc) sections.push(monster.legendary_desc)
    monster.legendary_actions?.forEach(e => sections.push(`*${e.name}.* ${e.desc}`))
  }

  addSection('Hol Acties', monster.lair_actions)

  return sections.length ? sections.join('\n\n') : null
}

export function mapMonsterToBestiary(
  monster: Open5eMonster,
  worldId: string,
  userId: string,
  edition: SrdEdition = '2014',
): BestiaryInsert {
  const ab = monster.ability_scores
  return {
    world_id: worldId,
    user_id: userId,
    name: monster.name,
    subtitle: toStr(monster.subtype ?? monster.subcategory) || null,
    creature_type: toStr(monster.type) || null,
    threat_level: mapChallengeRating(monster.challenge_rating ?? monster.cr),
    habitat: null,
    description: buildMonsterDescription(monster),
    notes: null,
    status: 'active',
    committed: true,
    hp: monster.hit_points ?? 1,
    ac: monster.armor_class ?? 10,
    speed: mapSpeed(monster.speed),
    stat_str: monster.strength ?? ab?.strength ?? 10,
    stat_dex: monster.dexterity ?? ab?.dexterity ?? 10,
    stat_con: monster.constitution ?? ab?.constitution ?? 10,
    stat_int: monster.intelligence ?? ab?.intelligence ?? 10,
    stat_wis: monster.wisdom ?? ab?.wisdom ?? 10,
    stat_cha: monster.charisma ?? ab?.charisma ?? 10,
    source: edition === '2024' ? 'srd-2024' : 'srd',
    source_slug: monster.key ?? monster.slug ?? '',
  }
}

const VALID_SCHOOLS: SpellSchool[] = [
  'abjuration', 'conjuration', 'divination', 'enchantment',
  'evocation', 'illusion', 'necromancy', 'transmutation',
]

export function mapSpellSchool(school: unknown): SpellSchool {
  const normalized = toStr(school).toLowerCase().trim()
  return VALID_SCHOOLS.find(s => s === normalized) ?? 'evocation'
}

export interface SpellInsert {
  user_id: string
  name: string
  level: number
  school: SpellSchool
  casting_time: string
  range: string
  components: string
  duration: string
  concentration: boolean
  ritual: boolean
  description: string | null
  higher_level: string | null
  classes: string[]
  source: string
  source_slug: string
}

function resolveSpellClasses(spell: Open5eSpell): string[] {
  if (Array.isArray(spell.classes)) {
    return spell.classes.map(c => (typeof c === 'string' ? c : c.name)).filter(Boolean)
  }
  if (spell.dnd_class) {
    return spell.dnd_class.split(',').map(c => c.trim()).filter(Boolean)
  }
  return []
}

export function mapSpellToSpell(spell: Open5eSpell, userId: string, edition: SrdEdition = '2014'): SpellInsert {
  return {
    user_id: userId,
    name: spell.name,
    level: typeof spell.level === 'number' ? spell.level : (parseInt(String(spell.level), 10) || 0),
    school: mapSpellSchool(spell.school),
    casting_time: spell.casting_time || '1 action',
    range: spell.range || '',
    components: spell.components || '',
    duration: spell.duration || '',
    concentration: spell.concentration ?? false,
    ritual: spell.ritual ?? false,
    description: spell.desc || null,
    higher_level: spell.higher_level || null,
    classes: resolveSpellClasses(spell),
    source: edition === '2024' ? 'srd-2024' : 'srd',
    source_slug: spell.key ?? spell.slug ?? '',
  }
}

export interface ItemInsert {
  campaign_id: string
  character_id: null
  equipped_slot: null
  name: string
  description: string | null
  item_type: ItemType
  rarity: ItemRarity
  is_magical: boolean
  quantity: number
  weight: null
  properties: Record<string, never>
  committed: boolean
  source: string
  source_slug: string
}

export function mapMagicItemToItem(
  magicItem: Open5eMagicItem,
  campaignId: string,
  edition: SrdEdition = '2014',
): ItemInsert {
  return {
    campaign_id: campaignId,
    character_id: null,
    equipped_slot: null,
    name: magicItem.name,
    description: magicItem.desc || null,
    item_type: mapItemType(magicItem.type),
    rarity: mapItemRarity(magicItem.rarity),
    is_magical: true,
    quantity: 1,
    weight: null,
    properties: {} as Record<string, never>,
    committed: true,
    source: edition === '2024' ? 'srd-2024' : 'srd',
    source_slug: magicItem.key ?? magicItem.slug ?? '',
  }
}

// Raw types for the Open5e API V2.
// Base URL: https://api.open5e.com/v2/

export interface Open5eDocument {
  name: string
  key: string
  display_name: string
  permalink: string
}

export interface Open5eListResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// /v2/creatures/ (was /v2/monsters/ in v1)
// v2 restructured several fields: type is now a nested object,
// ability scores moved to ability_scores, slug renamed to key.
interface Open5eCreatureType {
  name: string
  key: string
}

interface Open5eAbilityScores {
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
}

export interface Open5eMonster {
  key: string                                     // v2 (was slug in v1)
  slug?: string                                   // v1 compat
  name: string
  document: Open5eDocument
  size: string | { name: string; key: string }
  type: string | Open5eCreatureType
  subcategory?: string | null                     // v2 (was subtype)
  subtype?: string | null                         // v1 compat
  alignment: string
  armor_class: number
  hit_points: number
  hit_dice: string
  speed: Record<string, number | string>
  ability_scores?: Open5eAbilityScores            // v2 nested
  strength?: number                               // v1 compat
  dexterity?: number
  constitution?: number
  intelligence?: number
  wisdom?: number
  charisma?: number
  challenge_rating: string | number
  cr?: number
  passive_perception: number
  senses: string
  languages: string
  desc?: string
}

// /v2/magicitems/
// Note: v2 may return type/rarity as { slug, label } objects instead of plain strings.
export interface Open5eMagicItem {
  key: string                                     // v2 identifier
  slug?: string                                   // v1 compat
  name: string
  document: Open5eDocument
  type: string | { slug: string; label: string }
  rarity: string | { slug: string; label: string }
  requires_attunement: string
  desc: string
}

// /v2/spells/
export interface Open5eSpell {
  key: string                                     // v2 identifier
  slug?: string                                   // v1 compat
  name: string
  document: Open5eDocument
  school: string | { slug: string; label: string }
  level: number
  casting_time: string
  range: string
  components: string
  duration: string
  concentration: boolean
  ritual: boolean
  desc: string
  higher_level: string
  dnd_class: string
}

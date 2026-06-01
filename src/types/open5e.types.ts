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

// /v2/monsters/
export interface Open5eMonster {
  slug: string
  name: string
  document: Open5eDocument
  size: string
  type: string
  subtype: string | null
  group: string | null
  alignment: string
  armor_class: number
  armor_desc: string | null
  hit_points: number
  hit_dice: string
  speed: Record<string, number | string>
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
  challenge_rating: string
  cr: number
  passive_perception: number
  senses: string
  languages: string
  desc: string
}

// /v2/magicitems/
export interface Open5eMagicItem {
  slug: string
  name: string
  document: Open5eDocument
  type: string
  rarity: string
  requires_attunement: string
  desc: string
}

// /v2/spells/
export interface Open5eSpell {
  slug: string
  name: string
  document: Open5eDocument
  school: string
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

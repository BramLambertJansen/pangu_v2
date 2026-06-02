export type ItemType =
  | 'weapon'
  | 'armor'
  | 'potion'
  | 'ring'
  | 'rod'
  | 'scroll'
  | 'staff'
  | 'wand'
  | 'wondrous'
  | 'misc'

export type ItemRarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'very_rare'
  | 'legendary'
  | 'artifact'

export type EquipmentSlot =
  | 'head'
  | 'neck'
  | 'chest'
  | 'cloak'
  | 'gloves'
  | 'ring1'
  | 'ring2'
  | 'boots'
  | 'main_hand'
  | 'off_hand'

export interface ItemStatBonuses {
  ac_bonus?: number
  str_bonus?: number
  dex_bonus?: number
  con_bonus?: number
  int_bonus?: number
  wis_bonus?: number
  cha_bonus?: number
  hp_bonus?: number
  speed_bonus?: number
  initiative_bonus?: number
  attack_bonus?: number
  damage_bonus?: number
  damage_dice?: string
  stealth_disadvantage?: boolean
  skill_bonuses?: Record<string, number>
}

export interface Item {
  id: string
  campaign_id: string
  character_id: string | null
  equipped_slot: EquipmentSlot | null
  name: string
  description: string | null
  item_type: ItemType
  rarity: ItemRarity
  is_magical: boolean
  quantity: number
  weight: number | null
  properties: ItemStatBonuses
  committed: boolean
  requires_attunement: boolean
  source: string | null
  source_slug: string | null
  image_url: string | null
  created_at: string
  updated_at: string
}

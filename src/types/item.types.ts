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

export interface Item {
  id: string
  campaign_id: string
  character_id: string | null
  name: string
  description: string | null
  item_type: ItemType
  rarity: ItemRarity
  is_magical: boolean
  quantity: number
  weight: number | null
  properties: Record<string, unknown>
  created_at: string
  updated_at: string
}

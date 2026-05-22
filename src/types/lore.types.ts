export type LoreStatus = 'draft' | 'active' | 'archived'

export interface Lore {
  id: string
  campaign_id: string
  user_id: string
  name: string
  subtitle: string | null
  description: string | null
  notes: string | null
  status: LoreStatus
  lore_category: string | null
  created_at: string
  updated_at: string
}

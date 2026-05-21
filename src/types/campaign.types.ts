export type CampaignStatus = 'draft' | 'active' | 'archived' | 'completed'

export interface Campaign {
  id: string
  world_id: string
  user_id: string
  name: string
  subtitle: string | null
  description: string | null
  status: CampaignStatus
  created_at: string
  updated_at: string
}

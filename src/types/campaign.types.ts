export type CampaignStatus = 'draft' | 'active' | 'archived' | 'completed'

export interface Campaign {
  id: string
  world_id: string
  user_id: string
  name: string
  subtitle: string | null
  description: string | null
  header_image: string | null
  header_image_position: string
  status: CampaignStatus
  notes: string | null
  created_at: string
  updated_at: string
}

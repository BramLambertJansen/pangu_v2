export type WorldStatus = 'draft' | 'active' | 'archived'

export interface World {
  id: string
  owner_id: string
  name: string
  subtitle: string | null
  quote: string | null
  description: string | null
  banner_url: string | null
  status: WorldStatus
  created_at: string
  updated_at: string
}

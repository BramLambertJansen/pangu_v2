export type WorldStatus = 'draft' | 'active' | 'archived'

export interface World {
  id: string
  user_id: string
  name: string
  subtitle: string | null
  quote: string | null
  description: string | null
  header_image: string | null
  header_image_position: string | null
  status: WorldStatus
  notes: string | null
  created_at: string
  updated_at: string
}

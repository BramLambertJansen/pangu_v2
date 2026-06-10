export type LocationStatus = 'draft' | 'active' | 'discovered' | 'archived'

export interface Location {
  id: string
  campaign_id: string
  user_id: string
  name: string
  subtitle: string | null
  description: string | null
  notes: string | null
  status: LocationStatus
  location_type: string | null
  map_x: number | null
  map_y: number | null
  region: string | null
  climate: string | null
  created_at: string
  updated_at: string
}

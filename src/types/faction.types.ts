export type FactionStatus = 'draft' | 'active' | 'archived'

export type FactionType =
  | 'guild'
  | 'noble_house'
  | 'religious'
  | 'criminal'
  | 'military'
  | 'merchant'
  | 'arcane'
  | 'tribal'
  | 'other'

export type FactionReputation =
  | 'hostile'
  | 'unfriendly'
  | 'neutral'
  | 'friendly'
  | 'allied'

export interface Faction {
  id: string
  campaign_id: string
  user_id: string
  name: string
  subtitle: string | null
  type: FactionType | null
  reputation: FactionReputation
  status: FactionStatus
  motto: string | null
  goals: string | null
  description: string | null
  notes: string | null
  committed: boolean
  created_at: string
  updated_at: string
}

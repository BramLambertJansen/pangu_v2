export type EncounterStatus = 'draft' | 'ready' | 'active' | 'completed' | 'archived'

export interface Encounter {
  id: string
  campaign_id: string
  user_id: string
  session_id: string | null
  name: string
  subtitle: string | null
  description: string | null
  notes: string | null
  status: EncounterStatus
  environment: string | null
  difficulty: string | null
  created_at: string
  updated_at: string
}

export interface EncounterMonster {
  id: string
  encounter_id: string
  bestiary_id: string
  user_id: string
  count: number
  created_at: string
}

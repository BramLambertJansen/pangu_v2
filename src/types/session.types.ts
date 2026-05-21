export type SessionStatus = 'planned' | 'active' | 'completed' | 'archived'

export interface Session {
  id: string
  campaign_id: string
  user_id: string
  name: string
  subtitle: string | null
  description: string | null
  notes: string | null
  status: SessionStatus
  session_date: string | null
  session_number: number | null
  created_at: string
  updated_at: string
}

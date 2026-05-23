export type QuestStatus = 'draft' | 'active' | 'completed' | 'failed' | 'archived'

export interface Quest {
  id: string
  campaign_id: string
  user_id: string
  name: string
  subtitle: string | null
  description: string | null
  notes: string | null
  status: QuestStatus
  quest_type: string | null
  difficulty: string | null
  reward: string | null
  created_at: string
  updated_at: string
}

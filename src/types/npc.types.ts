export type NpcStatus = 'draft' | 'active' | 'retired' | 'archived'

export interface Npc {
  id: string
  campaign_id: string
  user_id: string
  name: string
  subtitle: string | null
  description: string | null
  notes: string | null
  status: NpcStatus
  npc_role: string | null
  // faction_id is not yet in database.types.ts — migration 040 adds the column
  // but types are regenerated after the migration runs on the live database.
  faction_id?: string | null
  created_at: string
  updated_at: string
}

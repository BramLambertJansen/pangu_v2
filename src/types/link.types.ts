export type LinkableEntityType =
  | 'location'
  | 'npc'
  | 'lore'
  | 'quest'
  | 'session'
  | 'item'
  | 'encounter'
  | 'character'

export type LinkRelation =
  | 'related_to'
  | 'located_in'
  | 'member_of'
  | 'owns'
  | 'involved_in'
  | 'ally_of'
  | 'enemy_of'
  | 'mentions'

export interface EntityLink {
  id: string
  campaign_id: string
  from_type: LinkableEntityType
  from_id: string
  to_type: LinkableEntityType
  to_id: string
  relation: LinkRelation
  created_at: string
}

// Resolved form returned by useEntityLinks: always represents the "other side",
// with its name resolved and the direction flagged so the UI can pick the correct label.
export interface ResolvedLink {
  linkId: string
  relation: LinkRelation
  direction: 'outgoing' | 'incoming'
  entity: {
    id: string
    type: LinkableEntityType
    name: string
    status: string | null
  }
}

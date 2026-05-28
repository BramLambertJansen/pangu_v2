export interface PlayerNote {
  id: string
  session_id: string
  user_id: string
  character_id: string | null
  content: string
  updated_at: string
}

export interface PlayerNoteWithCharacter extends PlayerNote {
  character: { name: string; character_class: string | null } | null
}

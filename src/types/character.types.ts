export type CharacterStatus = 'active' | 'inactive' | 'retired' | 'archived'

export interface Character {
  id: string
  user_id: string
  name: string
  subtitle: string | null
  character_class: string | null
  character_subclass: string | null
  character_race: string | null
  level: number
  xp: number
  xp_next: number
  hp_current: number
  hp_max: number
  armor_class: number
  speed: number
  initiative: number
  proficiency_bonus: number
  stat_str: number
  stat_dex: number
  stat_con: number
  stat_int: number
  stat_wis: number
  stat_cha: number
  gold: number
  silver: number
  copper: number
  description: string | null
  notes: string | null
  status: CharacterStatus
  created_at: string
  updated_at: string
}

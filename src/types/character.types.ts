export type CharacterStatus = 'active' | 'inactive' | 'retired' | 'archived'
export type HitDie = 'd6' | 'd8' | 'd10' | 'd12'

export interface Character {
  id: string
  user_id: string
  campaign_id: string | null
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
  proficient_skills: string[]

  // D&D 5.5e additions
  saving_throw_proficiencies: string[]
  expertise_skills: string[]
  languages: string[]
  tool_proficiencies: string[]
  weapon_proficiencies: string[]
  armor_proficiencies: string[]
  inspiration: boolean
  hit_die: HitDie
  hit_dice_current: number
  death_save_successes: number
  death_save_failures: number
  exhaustion: number
  alignment: string | null
  personality_traits: string | null
  ideals: string | null
  bonds: string | null
  flaws: string | null

  created_at: string
  updated_at: string
}

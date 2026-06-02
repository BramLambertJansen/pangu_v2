export type BestiaryStatus = 'draft' | 'active' | 'archived'

export interface BestiaryAction {
  name: string
  desc: string
}

export interface Bestiary {
  id: string
  world_id: string
  user_id: string
  name: string
  subtitle: string | null
  creature_type: string | null
  threat_level: string | null
  habitat: string | null
  description: string | null
  notes: string | null
  status: BestiaryStatus
  committed: boolean
  hp: number
  ac: number
  speed: number
  stat_str: number
  stat_dex: number
  stat_con: number
  stat_int: number
  stat_wis: number
  stat_cha: number
  source: string | null
  source_slug: string | null
  alignment: string | null
  hit_dice: string | null
  proficiency_bonus: number | null
  senses: string | null
  languages: string | null
  saving_throws: string | null
  skills: string | null
  damage_immunities: string | null
  damage_resistances: string | null
  damage_vulnerabilities: string | null
  condition_immunities: string | null
  speed_details: string | null
  special_abilities: BestiaryAction[] | null
  actions: BestiaryAction[] | null
  bonus_actions: BestiaryAction[] | null
  reactions: BestiaryAction[] | null
  legendary_desc: string | null
  legendary_actions: BestiaryAction[] | null
  lair_actions: BestiaryAction[] | null
  created_at: string
  updated_at: string
}

export interface BestiaryWithWorld extends Bestiary {
  worlds: { id: string; name: string } | null
}

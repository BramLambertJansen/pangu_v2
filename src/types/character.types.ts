export type CharacterStatus = 'active' | 'inactive' | 'retired' | 'archived'
export type HitDie = 'd6' | 'd8' | 'd10' | 'd12'
export type SpellcastingAbility = 'int' | 'wis' | 'cha'

export interface SpellSlotLevel {
  current: number
  max: number
}
// Spell slots keyed by level '1'–'9'; only levels with max > 0 are stored
export type SpellSlots = Partial<Record<'1'|'2'|'3'|'4'|'5'|'6'|'7'|'8'|'9', SpellSlotLevel>>

export interface ClassResource {
  current: number
  max: number
}
// Flexible map of resource name → current/max, e.g. {"Ki-punten": {current:3, max:5}}
export type ClassResources = Record<string, ClassResource>

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
  temp_hp: number
  armor_class: number
  speed: number
  fly_speed: number
  swim_speed: number
  climb_speed: number
  burrow_speed: number
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
  platinum: number
  electrum: number
  description: string | null
  notes: string | null
  status: CharacterStatus
  proficient_skills: string[]

  // D&D 5.5e — proficiencies & combat state
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

  // D&D 5.5e — spellcasting
  spellcasting_ability: SpellcastingAbility | null
  spell_slots: SpellSlots
  concentrating: boolean
  concentration_spell: string | null

  // D&D 5.5e — feats & class resources
  feats: string[]
  weapon_masteries: string[]
  active_conditions: string[]
  class_resources: ClassResources

  // D&D 5.5e — senses
  darkvision: number
  special_senses: string | null

  // D&D 5.5e — physical appearance
  age: string | null
  height: string | null
  weight: string | null
  appearance: string | null

  // D&D 5.5e — roleplay traits
  personality_traits: string | null
  ideals: string | null
  bonds: string | null
  flaws: string | null

  portrait_url: string | null
  committed: boolean
  created_at: string
  updated_at: string
}

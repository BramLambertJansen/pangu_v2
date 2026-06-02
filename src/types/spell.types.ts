export type SpellSchool =
  | 'abjuration'
  | 'conjuration'
  | 'divination'
  | 'enchantment'
  | 'evocation'
  | 'illusion'
  | 'necromancy'
  | 'transmutation'

export interface Spell {
  id: string
  user_id: string
  name: string
  level: number
  school: SpellSchool
  casting_time: string
  range: string
  components: string
  duration: string
  concentration: boolean
  ritual: boolean
  description: string | null
  higher_level: string | null
  classes: string[]
  source: string | null
  source_slug: string | null
  created_at: string
}

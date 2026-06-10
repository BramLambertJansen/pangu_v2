import type { AbilityKey } from '@/utils/dnd5e'
import type { HitDie, SpellcastingAbility } from '@/types/character.types'

export type CasterType = 'none' | 'full' | 'half' | 'pact'

export interface SrdRace {
  id: string
  name: string
  glyph: string
  tagline: string
  /** Korte omschrijving van het kenmerkende rastrait (NL). */
  trait: string
  bonuses: Partial<Record<AbilityKey, number>>
  /** Aantal vrij toewijsbare +1 bonussen bovenop `bonuses` (half-elf). */
  flexBonusCount: number
  speed: number
  darkvision: number
  languages: string[]
  /** Vaardigheden die het ras automatisch verleent (NL namen uit D5E_SKILLS). */
  skillProficiencies: string[]
}

export interface SrdSubclass {
  id: string
  name: string
  description: string
}

export interface SrdClass {
  id: string
  name: string
  glyph: string
  tagline: string
  hitDie: HitDie
  primaryAbility: AbilityKey
  casterType: CasterType
  spellcastingAbility: SpellcastingAbility | null
  savingThrows: AbilityKey[]
  numSkills: number
  /** Klasse-skillpool (NL namen uit D5E_SKILLS); 'any' = alle 18 vaardigheden. */
  skillPool: string[] | 'any'
  armorProficiencies: string[]
  weaponProficiencies: string[]
  /** Unarmored Defense: extra modifier bovenop 10 + DEX (barbarian CON, monk WIS). */
  unarmoredDefense: 'stat_con' | 'stat_wis' | null
  cantripsKnown: number
  spellPicksL1: number
  spellSlotsL1: number
  /** Hint bij de spreukkeuze (bv. voorbereide casters) (NL). */
  spellNote?: string
  subclasses: SrdSubclass[]
}

export interface SrdBackground {
  id: string
  name: string
  description: string
  /** Vaardigheden die de achtergrond verleent (NL namen uit D5E_SKILLS). */
  skills: string[]
  feature: string
  featureDescription: string
  toolProficiencies: string[]
  /** Niet-geautomatiseerde extra's, getoond als hint (bv. 'Twee extra talen naar keuze'). */
  languagesNote?: string
}

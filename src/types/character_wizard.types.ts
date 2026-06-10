import type { AbilityKey } from '@/utils/dnd5e'

export type AbilityMethod = 'pointbuy' | 'array' | 'manual'

export type WizardStepId =
  | 'basis'
  | 'ras'
  | 'klasse'
  | 'eigenschappen'
  | 'vaardigheden'
  | 'achtergrond'
  | 'spreuken'
  | 'overzicht'

export interface WizardDraft {
  name: string
  subtitle: string
  portraitUrl: string
  campaignId: string | null
  raceId: string | null
  classId: string | null
  subclassId: string | null
  abilityMethod: AbilityMethod
  /** Basisscores zonder rasbonus (pointbuy/manual). */
  scores: Record<AbilityKey, number>
  /** Standard array: toegewezen waarde per eigenschap. */
  arrayAssigned: Partial<Record<AbilityKey, number>>
  /** Vrij toewijsbare +1 rasbonussen (half-elf). */
  flexBonusPicks: AbilityKey[]
  /** Gekozen klasse-vaardigheden (NL namen uit D5E_SKILLS). */
  skillProficiencies: string[]
  backgroundId: string | null
  alignment: string | null
  personality: string
  ideal: string
  bond: string
  flaw: string
  /** Spreuk-ids uit de eigen bibliotheek (level 0 resp. level 1). */
  cantripIds: string[]
  spellIds: string[]
  /** Speler kiest spreuken later via de detailpagina. */
  spellsDeferred: boolean
}

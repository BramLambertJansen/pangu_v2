export type AbilityKey = 'stat_str' | 'stat_dex' | 'stat_con' | 'stat_int' | 'stat_wis' | 'stat_cha'

export interface AbilityScore {
  key: AbilityKey
  abbr: string
  label: string
  englishLabel: string
}

export const ABILITY_SCORES: AbilityScore[] = [
  { key: 'stat_str', abbr: 'STR', label: 'Sterkte',       englishLabel: 'Strength'     },
  { key: 'stat_dex', abbr: 'DEX', label: 'Behendigheid',  englishLabel: 'Dexterity'    },
  { key: 'stat_con', abbr: 'CON', label: 'Constitutie',   englishLabel: 'Constitution' },
  { key: 'stat_int', abbr: 'INT', label: 'Intelligentie', englishLabel: 'Intelligence' },
  { key: 'stat_wis', abbr: 'WIS', label: 'Wijsheid',      englishLabel: 'Wisdom'       },
  { key: 'stat_cha', abbr: 'CHA', label: 'Charisma',      englishLabel: 'Charisma'     },
]

export interface Skill {
  name: string
  ability: AbilityKey
  abbr: string
}

export const D5E_SKILLS: Skill[] = [
  { name: 'Atletiek',         ability: 'stat_str', abbr: 'STR' },
  { name: 'Acrobatiek',       ability: 'stat_dex', abbr: 'DEX' },
  { name: 'Vingervlugheid',   ability: 'stat_dex', abbr: 'DEX' },
  { name: 'Sluipen',          ability: 'stat_dex', abbr: 'DEX' },
  { name: 'Magie',            ability: 'stat_int', abbr: 'INT' },
  { name: 'Geschiedenis',     ability: 'stat_int', abbr: 'INT' },
  { name: 'Onderzoek',        ability: 'stat_int', abbr: 'INT' },
  { name: 'Natuur',           ability: 'stat_int', abbr: 'INT' },
  { name: 'Religie',          ability: 'stat_int', abbr: 'INT' },
  { name: 'Dierenverzorging', ability: 'stat_wis', abbr: 'WIS' },
  { name: 'Inzicht',          ability: 'stat_wis', abbr: 'WIS' },
  { name: 'Geneeskunde',      ability: 'stat_wis', abbr: 'WIS' },
  { name: 'Waarneming',       ability: 'stat_wis', abbr: 'WIS' },
  { name: 'Overleven',        ability: 'stat_wis', abbr: 'WIS' },
  { name: 'Bedrog',           ability: 'stat_cha', abbr: 'CHA' },
  { name: 'Intimidatie',      ability: 'stat_cha', abbr: 'CHA' },
  { name: 'Optreden',         ability: 'stat_cha', abbr: 'CHA' },
  { name: 'Overtuigen',       ability: 'stat_cha', abbr: 'CHA' },
]

export interface SavingThrow {
  label: string
  abbr: string
  statKey: AbilityKey
}

export const D5E_SAVING_THROWS: SavingThrow[] = [
  { label: 'Sterkte',       abbr: 'STR', statKey: 'stat_str' },
  { label: 'Behendigheid',  abbr: 'DEX', statKey: 'stat_dex' },
  { label: 'Constitutie',   abbr: 'CON', statKey: 'stat_con' },
  { label: 'Intelligentie', abbr: 'INT', statKey: 'stat_int' },
  { label: 'Wijsheid',      abbr: 'WIS', statKey: 'stat_wis' },
  { label: 'Charisma',      abbr: 'CHA', statKey: 'stat_cha' },
]

export const D5E_CONDITIONS = [
  'Verblind', 'Betoverd', 'Daas', 'Doof', 'Gevallen', 'Beangstigd',
  'Gegrepen', 'Buiten gevecht', 'Onzichtbaar', 'Verlamd', 'Versteend',
  'Vergiftigd', 'Beperkt', 'Zwijgen', 'Vertraagd', 'Bedwelmd', 'Bewusteloos',
]

export const SPELLCASTING_ABILITY_LABELS: Record<string, string> = {
  int: 'Intelligentie',
  wis: 'Wijsheid',
  cha: 'Charisma',
}

export const SPELL_LEVELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const

export const SPELL_LEVEL_LABELS = ['1e', '2e', '3e', '4e', '5e', '6e', '7e', '8e', '9e'] as const

export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

export function formatModifier(score: number): string {
  const mod = abilityModifier(score)
  return mod >= 0 ? `+${mod}` : String(mod)
}

export function formatSign(n: number): string {
  return n >= 0 ? `+${n}` : String(n)
}

/** Converts a character's coinage to its total value in gold pieces (pp=10gp, ep=0.5gp, sp=0.1gp, cp=0.01gp). */
export function goldEquivalent(coins: {
  platinum?: number | null
  gold?: number | null
  electrum?: number | null
  silver?: number | null
  copper?: number | null
}): number {
  const total =
    (coins.platinum ?? 0) * 10 +
    (coins.gold ?? 0) +
    (coins.electrum ?? 0) * 0.5 +
    (coins.silver ?? 0) * 0.1 +
    (coins.copper ?? 0) * 0.01
  return Math.round(total * 100) / 100
}

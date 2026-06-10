import { ABILITY_SCORES, D5E_SAVING_THROWS, abilityModifier } from '@/utils/dnd5e'
import type { AbilityKey } from '@/utils/dnd5e'
import { sanitizeImageUrl } from '@/utils/sanitizeUrl'
import {
  getRace,
  getClass,
  getBackground,
  POINT_BUY_BUDGET,
  POINT_BUY_COSTS,
} from '@/data/dnd5e'
import type { SrdClass } from '@/types/srd5e.types'
import type { WizardDraft, WizardStepId } from '@/types/character_wizard.types'
import type { SpellSlots } from '@/types/character.types'

export const WIZARD_STEPS: { id: WizardStepId; label: string }[] = [
  { id: 'basis', label: 'Basis' },
  { id: 'ras', label: 'Ras' },
  { id: 'klasse', label: 'Klasse' },
  { id: 'eigenschappen', label: 'Eigenschappen' },
  { id: 'vaardigheden', label: 'Vaardigheden' },
  { id: 'achtergrond', label: 'Achtergrond' },
  { id: 'spreuken', label: 'Spreuken' },
  { id: 'overzicht', label: 'Overzicht' },
]

export function createEmptyDraft(campaignId: string | null = null): WizardDraft {
  return {
    name: '',
    subtitle: '',
    portraitUrl: '',
    campaignId,
    raceId: null,
    classId: null,
    subclassId: null,
    abilityMethod: 'pointbuy',
    scores: { stat_str: 8, stat_dex: 8, stat_con: 8, stat_int: 8, stat_wis: 8, stat_cha: 8 },
    arrayAssigned: {},
    flexBonusPicks: [],
    skillProficiencies: [],
    backgroundId: null,
    alignment: null,
    personality: '',
    ideal: '',
    bond: '',
    flaw: '',
    cantripIds: [],
    spellIds: [],
    spellsDeferred: false,
  }
}

/* ── Ability scores ─────────────────────────────────────────── */

export function pointBuySpent(scores: Record<AbilityKey, number>): number {
  return ABILITY_SCORES.reduce((sum, a) => sum + (POINT_BUY_COSTS[scores[a.key]] ?? 0), 0)
}

export function pointBuyRemaining(draft: WizardDraft): number {
  return POINT_BUY_BUDGET - pointBuySpent(draft.scores)
}

/** Basisscore zonder rasbonus; null = nog niet toegewezen (standard array). */
export function baseScore(draft: WizardDraft, key: AbilityKey): number | null {
  if (draft.abilityMethod === 'array') return draft.arrayAssigned[key] ?? null
  return draft.scores[key]
}

export function racialBonus(draft: WizardDraft, key: AbilityKey): number {
  const race = getRace(draft.raceId)
  if (!race) return 0
  const fixed = race.bonuses[key] ?? 0
  const flex = draft.flexBonusPicks.filter((k) => k === key).length
  return fixed + flex
}

/** Eindscore per eigenschap (basis + rasbonus); null zolang de basis ontbreekt. */
export function finalScores(draft: WizardDraft): Record<AbilityKey, number | null> {
  const result = {} as Record<AbilityKey, number | null>
  for (const a of ABILITY_SCORES) {
    const base = baseScore(draft, a.key)
    result[a.key] = base === null ? null : base + racialBonus(draft, a.key)
  }
  return result
}

/* ── Spreuken ───────────────────────────────────────────────── */

/** Heeft deze klasse op level 1 al spreuken te kiezen? (half-casters niet) */
export function isCasterAtLevel1(cls: SrdClass | undefined): boolean {
  if (!cls) return false
  return cls.casterType !== 'none' && (cls.cantripsKnown > 0 || cls.spellPicksL1 > 0)
}

/* ── Validatie per stap ─────────────────────────────────────── */

export interface StepValidation {
  ok: boolean
  /** NL-melding voor de navigatiebalk wanneer de stap nog niet compleet is. */
  reason?: string
}

export function validateStep(stepId: WizardStepId, draft: WizardDraft): StepValidation {
  switch (stepId) {
    case 'basis':
      return draft.name.trim().length > 0
        ? { ok: true }
        : { ok: false, reason: 'Geef je karakter een naam' }

    case 'ras': {
      if (!getRace(draft.raceId)) return { ok: false, reason: 'Kies een ras' }
      return { ok: true }
    }

    case 'klasse':
      return getClass(draft.classId) ? { ok: true } : { ok: false, reason: 'Kies een klasse' }

    case 'eigenschappen': {
      if (draft.abilityMethod === 'pointbuy' && pointBuyRemaining(draft) < 0) {
        return { ok: false, reason: 'Puntenbudget overschreden' }
      }
      if (draft.abilityMethod === 'array') {
        const assigned = ABILITY_SCORES.filter((a) => draft.arrayAssigned[a.key] !== undefined)
        if (assigned.length < ABILITY_SCORES.length) {
          return { ok: false, reason: 'Wijs alle zes waarden toe' }
        }
      }
      const race = getRace(draft.raceId)
      if (race && race.flexBonusCount > 0 && draft.flexBonusPicks.length < race.flexBonusCount) {
        return { ok: false, reason: 'Wijs je vrije rasbonussen (+1) toe' }
      }
      return { ok: true }
    }

    case 'vaardigheden': {
      const cls = getClass(draft.classId)
      if (!cls) return { ok: false, reason: 'Kies eerst een klasse' }
      const remaining = cls.numSkills - draft.skillProficiencies.length
      if (remaining > 0) {
        return {
          ok: false,
          reason: `Kies nog ${remaining} vaardigheid${remaining === 1 ? '' : 'heden'}`,
        }
      }
      return { ok: true }
    }

    case 'achtergrond':
      return getBackground(draft.backgroundId)
        ? { ok: true }
        : { ok: false, reason: 'Kies een achtergrond' }

    case 'spreuken': {
      const cls = getClass(draft.classId)
      if (!isCasterAtLevel1(cls) || draft.spellsDeferred) return { ok: true }
      const cantripsLeft = cls!.cantripsKnown - draft.cantripIds.length
      const spellsLeft = cls!.spellPicksL1 - draft.spellIds.length
      if (cantripsLeft > 0 || spellsLeft > 0) {
        const parts: string[] = []
        if (cantripsLeft > 0) parts.push(`${cantripsLeft} tovertruc${cantripsLeft === 1 ? '' : 's'}`)
        if (spellsLeft > 0) parts.push(`${spellsLeft} spreuk${spellsLeft === 1 ? '' : 'en'}`)
        return { ok: false, reason: `Kies nog ${parts.join(' en ')} — of stel de keuze uit` }
      }
      return { ok: true }
    }

    case 'overzicht':
      return { ok: true }
  }
}

/** Index van de eerste niet-valide stap; alles dáárvoor is bereikbaar. */
export function firstInvalidStepIndex(draft: WizardDraft): number {
  for (let i = 0; i < WIZARD_STEPS.length; i++) {
    if (!validateStep(WIZARD_STEPS[i].id, draft).ok) return i
  }
  return WIZARD_STEPS.length
}

/* ── Afgeleide level 1-stats + insert ───────────────────────── */

const HIT_DIE_MAX: Record<string, number> = { d6: 6, d8: 8, d10: 10, d12: 12 }

export interface DerivedStats {
  hpMax: number
  armorClass: number
  initiative: number
  speed: number
  darkvision: number
  proficiencyBonus: number
  spellSlots: SpellSlots
}

export function deriveLevel1Stats(draft: WizardDraft): DerivedStats {
  const race = getRace(draft.raceId)
  const cls = getClass(draft.classId)
  const scores = finalScores(draft)
  const score = (key: AbilityKey) => scores[key] ?? 10

  const conMod = abilityModifier(score('stat_con'))
  const dexMod = abilityModifier(score('stat_dex'))

  let armorClass = 10 + dexMod
  if (cls?.unarmoredDefense) armorClass += abilityModifier(score(cls.unarmoredDefense))

  const spellSlots: SpellSlots =
    cls && cls.spellSlotsL1 > 0 ? { '1': { current: cls.spellSlotsL1, max: cls.spellSlotsL1 } } : {}

  return {
    hpMax: Math.max(1, (HIT_DIE_MAX[cls?.hitDie ?? 'd8'] ?? 8) + conMod),
    armorClass,
    initiative: dexMod,
    speed: race?.speed ?? 30,
    darkvision: race?.darkvision ?? 0,
    proficiencyBonus: 2,
    spellSlots,
  }
}

function dedupe(values: string[]): string[] {
  return [...new Set(values)]
}

/** Volledige characters-insert voor een afgeronde wizard-draft (committed). */
export function buildCharacterInsert(draft: WizardDraft, userId: string) {
  const race = getRace(draft.raceId)
  const cls = getClass(draft.classId)
  const background = getBackground(draft.backgroundId)
  const subclass = cls?.subclasses.find((s) => s.id === draft.subclassId)
  const derived = deriveLevel1Stats(draft)
  const scores = finalScores(draft)
  const score = (key: AbilityKey) => scores[key] ?? 10

  const savingThrowLabels = (cls?.savingThrows ?? [])
    .map((key) => D5E_SAVING_THROWS.find((s) => s.statKey === key)?.label)
    .filter((label): label is string => !!label)

  return {
    user_id: userId,
    campaign_id: draft.campaignId,
    name: draft.name.trim(),
    subtitle: draft.subtitle.trim() || null,
    portrait_url: sanitizeImageUrl(draft.portraitUrl) ?? null,
    character_race: race?.name ?? null,
    character_class: cls?.name ?? null,
    character_subclass: subclass?.name ?? null,
    background: background?.name ?? null,
    alignment: draft.alignment,
    level: 1,
    xp: 0,
    xp_next: 300,
    status: 'active',
    stat_str: score('stat_str'),
    stat_dex: score('stat_dex'),
    stat_con: score('stat_con'),
    stat_int: score('stat_int'),
    stat_wis: score('stat_wis'),
    stat_cha: score('stat_cha'),
    hp_max: derived.hpMax,
    hp_current: derived.hpMax,
    armor_class: derived.armorClass,
    initiative: derived.initiative,
    speed: derived.speed,
    darkvision: derived.darkvision,
    proficiency_bonus: derived.proficiencyBonus,
    hit_die: cls?.hitDie ?? 'd8',
    hit_dice_current: 1,
    proficient_skills: dedupe([
      ...draft.skillProficiencies,
      ...(race?.skillProficiencies ?? []),
      ...(background?.skills ?? []),
    ]),
    saving_throw_proficiencies: savingThrowLabels,
    languages: dedupe(race?.languages ?? []),
    armor_proficiencies: cls?.armorProficiencies ?? [],
    weapon_proficiencies: cls?.weaponProficiencies ?? [],
    tool_proficiencies: background?.toolProficiencies ?? [],
    spellcasting_ability: cls?.spellcastingAbility ?? null,
    spell_slots: derived.spellSlots as Record<string, unknown>,
    personality_traits: draft.personality.trim() || null,
    ideals: draft.ideal.trim() || null,
    bonds: draft.bond.trim() || null,
    flaws: draft.flaw.trim() || null,
    committed: true,
  }
}

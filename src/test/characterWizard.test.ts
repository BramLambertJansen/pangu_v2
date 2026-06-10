import { describe, it, expect } from 'vitest'
import {
  createEmptyDraft,
  pointBuySpent,
  pointBuyRemaining,
  finalScores,
  isCasterAtLevel1,
  validateStep,
  firstInvalidStepIndex,
  deriveLevel1Stats,
  buildCharacterInsert,
  WIZARD_STEPS,
} from '@/utils/characterWizard'
import { getClass } from '@/data/dnd5e'
import type { WizardDraft } from '@/types/character_wizard.types'

function completeDraft(): WizardDraft {
  return {
    ...createEmptyDraft(),
    name: 'Lyria Moonweaver',
    raceId: 'high-elf',
    classId: 'wizard',
    subclassId: 'evocation',
    abilityMethod: 'pointbuy',
    // legale point buy: 0+7+7+9+2+2 = 27
    scores: { stat_str: 8, stat_dex: 14, stat_con: 14, stat_int: 15, stat_wis: 10, stat_cha: 10 },
    skillProficiencies: ['Magie', 'Onderzoek'],
    backgroundId: 'sage',
    alignment: 'Neutraal Goed',
    cantripIds: ['c1', 'c2', 'c3'],
    spellIds: ['s1', 's2', 's3', 's4', 's5', 's6'],
  }
}

describe('point buy', () => {
  it('costs 0 for an all-8 draft', () => {
    expect(pointBuySpent(createEmptyDraft().scores)).toBe(0)
    expect(pointBuyRemaining(createEmptyDraft())).toBe(27)
  })

  it('computes the full SRD cost curve', () => {
    expect(pointBuySpent({ stat_str: 15, stat_dex: 15, stat_con: 15, stat_int: 8, stat_wis: 8, stat_cha: 8 })).toBe(27)
    expect(pointBuySpent({ stat_str: 13, stat_dex: 13, stat_con: 13, stat_int: 12, stat_wis: 12, stat_cha: 12 })).toBe(27)
  })
})

describe('finalScores', () => {
  it('adds fixed racial bonuses', () => {
    const draft = completeDraft() // high-elf: +2 DEX +1 INT
    const scores = finalScores(draft)
    expect(scores.stat_dex).toBe(16)
    expect(scores.stat_int).toBe(16)
    expect(scores.stat_str).toBe(8)
  })

  it('adds flexible bonuses for half-elf', () => {
    const draft = { ...completeDraft(), raceId: 'half-elf', flexBonusPicks: ['stat_dex', 'stat_con'] as never }
    const scores = finalScores(draft)
    expect(scores.stat_cha).toBe(12) // 10 + 2 vast
    expect(scores.stat_dex).toBe(15) // 14 + 1 flex
    expect(scores.stat_con).toBe(15)
  })

  it('returns null for unassigned standard array slots', () => {
    const draft: WizardDraft = { ...completeDraft(), abilityMethod: 'array', arrayAssigned: { stat_str: 15 } }
    const scores = finalScores(draft)
    expect(scores.stat_str).toBe(15)
    expect(scores.stat_dex).toBeNull()
  })
})

describe('validateStep', () => {
  it('requires a name in step basis', () => {
    expect(validateStep('basis', createEmptyDraft()).ok).toBe(false)
    expect(validateStep('basis', { ...createEmptyDraft(), name: 'Test' }).ok).toBe(true)
  })

  it('requires race, class and background selections', () => {
    const draft = createEmptyDraft()
    expect(validateStep('ras', draft).ok).toBe(false)
    expect(validateStep('klasse', draft).ok).toBe(false)
    expect(validateStep('achtergrond', draft).ok).toBe(false)
    expect(validateStep('ras', { ...draft, raceId: 'human' }).ok).toBe(true)
  })

  it('requires all six standard array slots assigned', () => {
    const draft: WizardDraft = { ...completeDraft(), abilityMethod: 'array', arrayAssigned: { stat_str: 15 } }
    expect(validateStep('eigenschappen', draft).ok).toBe(false)
    const full: WizardDraft = {
      ...draft,
      arrayAssigned: { stat_str: 15, stat_dex: 14, stat_con: 13, stat_int: 12, stat_wis: 10, stat_cha: 8 },
    }
    expect(validateStep('eigenschappen', full).ok).toBe(true)
  })

  it('requires flexible racial bonus picks for half-elf', () => {
    const draft = { ...completeDraft(), raceId: 'half-elf' }
    expect(validateStep('eigenschappen', draft).ok).toBe(false)
    expect(validateStep('eigenschappen', { ...draft, flexBonusPicks: ['stat_dex', 'stat_con'] as never }).ok).toBe(true)
  })

  it('requires exactly numSkills class skills', () => {
    const draft = { ...completeDraft(), skillProficiencies: ['Magie'] }
    const result = validateStep('vaardigheden', draft)
    expect(result.ok).toBe(false)
    expect(result.reason).toContain('1')
    expect(validateStep('vaardigheden', completeDraft()).ok).toBe(true)
  })

  it('requires full spell picks for casters unless deferred', () => {
    const draft = { ...completeDraft(), cantripIds: [], spellIds: [] }
    expect(validateStep('spreuken', draft).ok).toBe(false)
    expect(validateStep('spreuken', { ...draft, spellsDeferred: true }).ok).toBe(true)
    expect(validateStep('spreuken', completeDraft()).ok).toBe(true)
  })

  it('passes the spell step for non-casters and level 1 half-casters', () => {
    expect(validateStep('spreuken', { ...completeDraft(), classId: 'fighter' }).ok).toBe(true)
    expect(validateStep('spreuken', { ...completeDraft(), classId: 'paladin' }).ok).toBe(true)
  })

  it('firstInvalidStepIndex walks the full wizard', () => {
    expect(firstInvalidStepIndex(createEmptyDraft())).toBe(0)
    expect(firstInvalidStepIndex(completeDraft())).toBe(WIZARD_STEPS.length)
  })
})

describe('isCasterAtLevel1', () => {
  it('is true for full and pact casters, false for half and none', () => {
    expect(isCasterAtLevel1(getClass('wizard'))).toBe(true)
    expect(isCasterAtLevel1(getClass('warlock'))).toBe(true)
    expect(isCasterAtLevel1(getClass('paladin'))).toBe(false)
    expect(isCasterAtLevel1(getClass('rogue'))).toBe(false)
  })
})

describe('deriveLevel1Stats', () => {
  it('derives HP, AC and initiative from class and scores', () => {
    const derived = deriveLevel1Stats(completeDraft())
    // wizard d6 + CON-mod(14→+2) = 8; AC 10 + DEX-mod(16→+3) = 13
    expect(derived.hpMax).toBe(8)
    expect(derived.armorClass).toBe(13)
    expect(derived.initiative).toBe(3)
    expect(derived.proficiencyBonus).toBe(2)
    expect(derived.spellSlots).toEqual({ '1': { current: 2, max: 2 } })
  })

  it('applies unarmored defense for barbarian and monk', () => {
    const barb: WizardDraft = {
      ...completeDraft(),
      classId: 'barbarian',
      scores: { stat_str: 15, stat_dex: 14, stat_con: 14, stat_int: 8, stat_wis: 10, stat_cha: 8 },
    }
    // AC 10 + DEX-mod + CON-mod; high-elf rasbonus maakt DEX 16 (+3), CON blijft 14 (+2)
    expect(deriveLevel1Stats(barb).armorClass).toBe(15)
    // d12 + CON-mod = 14
    expect(deriveLevel1Stats(barb).hpMax).toBe(14)
    expect(deriveLevel1Stats(barb).spellSlots).toEqual({})
  })

  it('takes speed and darkvision from the race', () => {
    const woodElf = { ...completeDraft(), raceId: 'wood-elf' }
    expect(deriveLevel1Stats(woodElf).speed).toBe(35)
    expect(deriveLevel1Stats(woodElf).darkvision).toBe(60)
  })
})

describe('buildCharacterInsert', () => {
  it('builds a complete committed insert', () => {
    const insert = buildCharacterInsert(completeDraft(), 'user-1')
    expect(insert.user_id).toBe('user-1')
    expect(insert.name).toBe('Lyria Moonweaver')
    expect(insert.character_race).toBe('High Elf')
    expect(insert.character_class).toBe('Wizard')
    expect(insert.character_subclass).toBe('School van Evocatie')
    expect(insert.background).toBe('Sage')
    expect(insert.alignment).toBe('Neutraal Goed')
    expect(insert.level).toBe(1)
    expect(insert.xp_next).toBe(300)
    expect(insert.hit_die).toBe('d6')
    expect(insert.committed).toBe(true)
    expect(insert.spellcasting_ability).toBe('int')
  })

  it('merges class picks, race skills and background skills without duplicates', () => {
    // sage geeft Magie + Geschiedenis; klasse-picks bevatten ook Magie; high-elf geeft Waarneming
    const insert = buildCharacterInsert(completeDraft(), 'user-1')
    expect(insert.proficient_skills).toEqual(
      expect.arrayContaining(['Magie', 'Onderzoek', 'Geschiedenis', 'Waarneming']),
    )
    expect(new Set(insert.proficient_skills).size).toBe((insert.proficient_skills as string[]).length)
  })

  it('maps saving throws to Dutch labels', () => {
    const insert = buildCharacterInsert(completeDraft(), 'user-1')
    expect(insert.saving_throw_proficiencies).toEqual(['Intelligentie', 'Wijsheid'])
  })

  it('drops invalid portrait urls and keeps https ones', () => {
    const bad = buildCharacterInsert({ ...completeDraft(), portraitUrl: 'javascript:alert(1)' }, 'u')
    expect(bad.portrait_url).toBeNull()
    const good = buildCharacterInsert({ ...completeDraft(), portraitUrl: 'https://img.test/p.png' }, 'u')
    expect(good.portrait_url).toBe('https://img.test/p.png')
  })
})

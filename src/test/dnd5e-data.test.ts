import { describe, it, expect } from 'vitest'
import { SRD_RACES, SRD_CLASSES, SRD_BACKGROUNDS, POINT_BUY_COSTS, POINT_BUY_MIN, POINT_BUY_MAX, STANDARD_ARRAY, ALIGNMENTS } from '@/data/dnd5e'
import { D5E_SKILLS, ABILITY_SCORES } from '@/utils/dnd5e'

const SKILL_NAMES = new Set(D5E_SKILLS.map((s) => s.name))
const ABILITY_KEYS = new Set(ABILITY_SCORES.map((a) => a.key))

describe('SRD races', () => {
  it('has 10 races with unique ids', () => {
    expect(SRD_RACES).toHaveLength(10)
    expect(new Set(SRD_RACES.map((r) => r.id)).size).toBe(10)
  })

  it('grants only skills that exist in D5E_SKILLS', () => {
    for (const race of SRD_RACES) {
      for (const skill of race.skillProficiencies) {
        expect(SKILL_NAMES.has(skill), `${race.id}: ${skill}`).toBe(true)
      }
    }
  })

  it('uses only valid ability keys in bonuses', () => {
    for (const race of SRD_RACES) {
      for (const key of Object.keys(race.bonuses)) {
        expect(ABILITY_KEYS.has(key as never), `${race.id}: ${key}`).toBe(true)
      }
    }
  })

  it('has sensible speed and darkvision values', () => {
    for (const race of SRD_RACES) {
      expect(race.speed).toBeGreaterThanOrEqual(25)
      expect(race.speed).toBeLessThanOrEqual(35)
      expect([0, 60]).toContain(race.darkvision)
      expect(race.languages.length).toBeGreaterThan(0)
    }
  })

  it('only half-elf has flexible bonuses', () => {
    for (const race of SRD_RACES) {
      expect(race.flexBonusCount).toBe(race.id === 'half-elf' ? 2 : 0)
    }
  })
})

describe('SRD classes', () => {
  it('has 12 classes with unique ids', () => {
    expect(SRD_CLASSES).toHaveLength(12)
    expect(new Set(SRD_CLASSES.map((c) => c.id)).size).toBe(12)
  })

  it('uses only skills that exist in D5E_SKILLS in skill pools', () => {
    for (const cls of SRD_CLASSES) {
      if (cls.skillPool === 'any') continue
      for (const skill of cls.skillPool) {
        expect(SKILL_NAMES.has(skill), `${cls.id}: ${skill}`).toBe(true)
      }
    }
  })

  it('has a pool at least as large as the number of picks', () => {
    for (const cls of SRD_CLASSES) {
      const poolSize = cls.skillPool === 'any' ? D5E_SKILLS.length : cls.skillPool.length
      expect(poolSize, cls.id).toBeGreaterThanOrEqual(cls.numSkills)
    }
  })

  it('has exactly two saving throw proficiencies per class', () => {
    for (const cls of SRD_CLASSES) {
      expect(cls.savingThrows, cls.id).toHaveLength(2)
      for (const key of cls.savingThrows) expect(ABILITY_KEYS.has(key)).toBe(true)
    }
  })

  it('gives every caster a spellcasting ability and every non-caster none', () => {
    for (const cls of SRD_CLASSES) {
      if (cls.casterType === 'none') {
        expect(cls.spellcastingAbility, cls.id).toBeNull()
        expect(cls.cantripsKnown, cls.id).toBe(0)
        expect(cls.spellSlotsL1, cls.id).toBe(0)
      } else {
        expect(cls.spellcastingAbility, cls.id).not.toBeNull()
      }
    }
  })

  it('half-casters have no spells at level 1, full casters do', () => {
    for (const cls of SRD_CLASSES) {
      if (cls.casterType === 'half') {
        expect(cls.spellSlotsL1, cls.id).toBe(0)
        expect(cls.spellNote, cls.id).toBeTruthy()
      }
      if (cls.casterType === 'full') {
        expect(cls.spellSlotsL1, cls.id).toBe(2)
        expect(cls.cantripsKnown, cls.id).toBeGreaterThan(0)
        expect(cls.spellPicksL1, cls.id).toBeGreaterThan(0)
      }
    }
  })

  it('has at least one subclass per class', () => {
    for (const cls of SRD_CLASSES) {
      expect(cls.subclasses.length, cls.id).toBeGreaterThan(0)
    }
  })
})

describe('SRD backgrounds', () => {
  it('has 8 backgrounds, each granting exactly two valid skills', () => {
    expect(SRD_BACKGROUNDS).toHaveLength(8)
    for (const bg of SRD_BACKGROUNDS) {
      expect(bg.skills, bg.id).toHaveLength(2)
      for (const skill of bg.skills) {
        expect(SKILL_NAMES.has(skill), `${bg.id}: ${skill}`).toBe(true)
      }
      expect(bg.feature).toBeTruthy()
      expect(bg.featureDescription).toBeTruthy()
    }
  })
})

describe('ability methods', () => {
  it('point buy cost table covers exactly scores 8 through 15', () => {
    for (let s = POINT_BUY_MIN; s <= POINT_BUY_MAX; s++) {
      expect(POINT_BUY_COSTS[s]).toBeDefined()
    }
    expect(POINT_BUY_COSTS[POINT_BUY_MIN]).toBe(0)
    expect(POINT_BUY_COSTS[POINT_BUY_MAX]).toBe(9)
  })

  it('standard array is the SRD set', () => {
    expect([...STANDARD_ARRAY]).toEqual([15, 14, 13, 12, 10, 8])
  })

  it('alignment grid is 3×3 with unique entries', () => {
    expect(ALIGNMENTS).toHaveLength(3)
    const flat = ALIGNMENTS.flat()
    expect(flat).toHaveLength(9)
    expect(new Set(flat).size).toBe(9)
  })
})

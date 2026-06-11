import { describe, it, expect } from 'vitest'
import {
  isEquippable,
  getEquippedItemsBySlot,
  calculateEffectiveStats,
  formatItemBonuses,
} from '@/utils/equipmentUtils'
import type { Character } from '@/types/character.types'
import type { EquipmentSlot, Item, ItemStatBonuses } from '@/types/item.types'

function makeCharacter(overrides: Partial<Character> = {}): Character {
  return {
    armor_class: 12,
    stat_str: 14, stat_dex: 12, stat_con: 13,
    stat_int: 10, stat_wis: 8, stat_cha: 15,
    hp_max: 20, speed: 30, initiative: 1,
    ...overrides,
  } as unknown as Character
}

function makeItem(properties: ItemStatBonuses, equipped_slot: EquipmentSlot | null = null): Item {
  return { properties, equipped_slot } as unknown as Item
}

describe('isEquippable', () => {
  it('is false for consumables (potions, scrolls)', () => {
    expect(isEquippable('potion')).toBe(false)
    expect(isEquippable('scroll')).toBe(false)
  })

  it('is true for gear (weapon, armor, wondrous, ring, misc)', () => {
    for (const t of ['weapon', 'armor', 'wondrous', 'ring', 'misc'] as const) {
      expect(isEquippable(t)).toBe(true)
    }
  })
})

describe('getEquippedItemsBySlot', () => {
  it('maps items by their equipped slot and ignores unequipped items', () => {
    const head = makeItem({}, 'head')
    const boots = makeItem({}, 'boots')
    const loose = makeItem({}, null)
    const map = getEquippedItemsBySlot([head, boots, loose])
    expect(map.head).toBe(head)
    expect(map.boots).toBe(boots)
    expect(Object.keys(map)).toHaveLength(2)
  })

  it('keeps the last item when two share a slot', () => {
    const ring1 = makeItem({ str_bonus: 1 }, 'ring1')
    const ring2 = makeItem({ str_bonus: 2 }, 'ring1')
    const map = getEquippedItemsBySlot([ring1, ring2])
    expect(map.ring1).toBe(ring2)
  })
})

describe('calculateEffectiveStats', () => {
  it('returns the character base when nothing is equipped', () => {
    const stats = calculateEffectiveStats(makeCharacter(), [])
    expect(stats.ac).toBe(12)
    expect(stats.str).toBe(14)
    expect(stats.hp_max).toBe(20)
    expect(stats.speed).toBe(30)
    expect(stats.stealthDisadvantage).toBe(false)
    expect(stats.skillBonuses).toEqual({})
  })

  it('sums numeric bonuses across all equipped items', () => {
    const items = [
      makeItem({ ac_bonus: 2, str_bonus: 1, hp_bonus: 5 }),
      makeItem({ ac_bonus: 1, speed_bonus: 10, initiative_bonus: 2 }),
    ]
    const stats = calculateEffectiveStats(makeCharacter(), items)
    expect(stats.ac).toBe(15)        // 12 + 2 + 1
    expect(stats.str).toBe(15)       // 14 + 1
    expect(stats.hp_max).toBe(25)    // 20 + 5
    expect(stats.speed).toBe(40)     // 30 + 10
    expect(stats.initiative).toBe(3) // 1 + 2
  })

  it('OR-combines stealth disadvantage and accumulates skill bonuses', () => {
    const items = [
      makeItem({ stealth_disadvantage: false, skill_bonuses: { Sluipen: 2 } }),
      makeItem({ stealth_disadvantage: true, skill_bonuses: { Sluipen: 2, Waarneming: 1 } }),
    ]
    const stats = calculateEffectiveStats(makeCharacter(), items)
    expect(stats.stealthDisadvantage).toBe(true)
    expect(stats.skillBonuses).toEqual({ Sluipen: 4, Waarneming: 1 })
  })
})

describe('formatItemBonuses', () => {
  it('returns an empty list for no bonuses', () => {
    expect(formatItemBonuses({})).toEqual([])
  })

  it('prefixes positive values with + and skips zeroes', () => {
    const lines = formatItemBonuses({ ac_bonus: 2, dex_bonus: 0, str_bonus: -1 })
    expect(lines).toContain('+2 AC')
    expect(lines).toContain('-1 STR')
    expect(lines.some(l => l.includes('DEX'))).toBe(false)
  })

  it('includes damage dice, stealth disadvantage and skill bonuses', () => {
    const lines = formatItemBonuses({
      damage_dice: '2d6',
      stealth_disadvantage: true,
      skill_bonuses: { Atletiek: 3 },
    })
    expect(lines).toContain('2d6')
    expect(lines).toContain('Sluipen nadeel')
    expect(lines).toContain('+3 Atletiek')
  })
})

import type { EquipmentSlot, Item, ItemStatBonuses, ItemType } from '@/types/item.types'
import type { Character } from '@/types/character.types'

export const EQUIPMENT_SLOT_LABELS: Record<EquipmentSlot, string> = {
  head:      'Hoofd',
  neck:      'Hals',
  chest:     'Torso',
  cloak:     'Mantel',
  gloves:    'Handschoenen',
  ring1:     'Ring (links)',
  ring2:     'Ring (rechts)',
  boots:     'Laarzen',
  main_hand: 'Hoofdhand',
  off_hand:  'Vrije hand',
}

export const EQUIPMENT_SLOT_ICONS: Record<EquipmentSlot, string> = {
  head:      '⛑️',
  neck:      '📿',
  chest:     '🛡',
  cloak:     '🧥',
  gloves:    '🧤',
  ring1:     '💍',
  ring2:     '💍',
  boots:     '🥾',
  main_hand: '⚔️',
  off_hand:  '🗡️',
}

// Defines which slots are valid for each item type.
// Potions and scrolls are consumables — not equippable.
export const ALLOWED_SLOTS_BY_TYPE: Record<ItemType, EquipmentSlot[]> = {
  weapon:   ['main_hand', 'off_hand'],
  armor:    ['chest', 'off_hand'],    // off_hand covers shields
  potion:   [],
  ring:     ['ring1', 'ring2'],
  rod:      ['main_hand'],
  scroll:   [],
  staff:    ['main_hand'],
  wand:     ['main_hand'],
  wondrous: ['head', 'neck', 'chest', 'cloak', 'gloves', 'ring1', 'ring2', 'boots'],
  misc:     ['head', 'neck', 'chest', 'cloak', 'gloves', 'ring1', 'ring2', 'boots', 'main_hand', 'off_hand'],
}

export function isEquippable(itemType: ItemType): boolean {
  return ALLOWED_SLOTS_BY_TYPE[itemType].length > 0
}

export interface EffectiveStats {
  ac: number
  str: number
  dex: number
  con: number
  int: number
  wis: number
  cha: number
  hp_max: number
  speed: number
  initiative: number
  skillBonuses: Record<string, number>
  // Whether any equipped item has stealth disadvantage
  stealthDisadvantage: boolean
}

/** Sums all stat bonuses from currently equipped items. */
export function calculateEffectiveStats(
  character: Character,
  equippedItems: Item[]
): EffectiveStats {
  let ac_bonus = 0
  let str_bonus = 0
  let dex_bonus = 0
  let con_bonus = 0
  let int_bonus = 0
  let wis_bonus = 0
  let cha_bonus = 0
  let hp_bonus = 0
  let speed_bonus = 0
  let initiative_bonus = 0
  let stealthDisadvantage = false
  const skillBonuses: Record<string, number> = {}

  for (const item of equippedItems) {
    const p = item.properties
    if (!p) continue
    ac_bonus         += p.ac_bonus         ?? 0
    str_bonus        += p.str_bonus        ?? 0
    dex_bonus        += p.dex_bonus        ?? 0
    con_bonus        += p.con_bonus        ?? 0
    int_bonus        += p.int_bonus        ?? 0
    wis_bonus        += p.wis_bonus        ?? 0
    cha_bonus        += p.cha_bonus        ?? 0
    hp_bonus         += p.hp_bonus         ?? 0
    speed_bonus      += p.speed_bonus      ?? 0
    initiative_bonus += p.initiative_bonus ?? 0
    if (p.stealth_disadvantage) stealthDisadvantage = true
    if (p.skill_bonuses) {
      for (const [skill, bonus] of Object.entries(p.skill_bonuses)) {
        skillBonuses[skill] = (skillBonuses[skill] ?? 0) + bonus
      }
    }
  }

  return {
    ac:                (character.armor_class  ?? 0) + ac_bonus,
    str:               (character.stat_str     ?? 10) + str_bonus,
    dex:               (character.stat_dex     ?? 10) + dex_bonus,
    con:               (character.stat_con     ?? 10) + con_bonus,
    int:               (character.stat_int     ?? 10) + int_bonus,
    wis:               (character.stat_wis     ?? 10) + wis_bonus,
    cha:               (character.stat_cha     ?? 10) + cha_bonus,
    hp_max:            (character.hp_max       ?? 0)  + hp_bonus,
    speed:             (character.speed        ?? 30) + speed_bonus,
    initiative:        (character.initiative   ?? 0)  + initiative_bonus,
    skillBonuses,
    stealthDisadvantage,
  }
}

/** Returns a map of slot → equipped item for quick slot lookup. */
export function getEquippedItemsBySlot(items: Item[]): Partial<Record<EquipmentSlot, Item>> {
  const result: Partial<Record<EquipmentSlot, Item>> = {}
  for (const item of items) {
    if (item.equipped_slot) {
      result[item.equipped_slot] = item
    }
  }
  return result
}

/** Formats the non-zero bonuses of an item as human-readable strings. */
export function formatItemBonuses(props: ItemStatBonuses): string[] {
  const lines: string[] = []
  const add = (label: string, val: number | undefined) => {
    if (val && val !== 0) lines.push(`${val > 0 ? '+' : ''}${val} ${label}`)
  }
  add('AC',            props.ac_bonus)
  add('STR',           props.str_bonus)
  add('DEX',           props.dex_bonus)
  add('CON',           props.con_bonus)
  add('INT',           props.int_bonus)
  add('WIS',           props.wis_bonus)
  add('CHA',           props.cha_bonus)
  add('Max HP',        props.hp_bonus)
  add('Snelheid',      props.speed_bonus)
  add('Initiatief',    props.initiative_bonus)
  add('Aanval',        props.attack_bonus)
  add('Schade',        props.damage_bonus)
  if (props.damage_dice) lines.push(props.damage_dice)
  if (props.stealth_disadvantage) lines.push('Sluipen nadeel')
  if (props.skill_bonuses) {
    for (const [skill, bonus] of Object.entries(props.skill_bonuses)) {
      if (bonus !== 0) lines.push(`${bonus > 0 ? '+' : ''}${bonus} ${skill}`)
    }
  }
  return lines
}

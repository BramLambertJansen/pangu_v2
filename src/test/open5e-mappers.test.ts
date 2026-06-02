import { describe, it, expect } from 'vitest'
import {
  mapMonsterToBestiary,
  mapMagicItemToItem,
  mapSpellToSpell,
  mapChallengeRating,
  mapSpeed,
  mapItemType,
  mapItemRarity,
  mapSpellSchool,
} from '@/lib/open5e'
import type { Open5eMonster, Open5eMagicItem, Open5eSpell } from '@/types/open5e.types'

const mockDoc = { name: 'SRD', key: 'srd', display_name: 'SRD', permalink: '' }

const owlbear: Open5eMonster = {
  slug: 'owlbear',
  name: 'Owlbear',
  document: mockDoc,
  size: 'large',
  type: 'monstrosity',
  subtype: null,
  group: null,
  alignment: 'unaligned',
  armor_class: 13,
  armor_desc: 'natural armor',
  hit_points: 59,
  hit_dice: '7d10+21',
  speed: { walk: 40 },
  strength: 20,
  dexterity: 12,
  constitution: 17,
  intelligence: 3,
  wisdom: 12,
  charisma: 7,
  challenge_rating: '3',
  cr: 3,
  passive_perception: 13,
  senses: 'darkvision 60 ft.',
  languages: '',
  desc: 'A hulking creature with the body of a bear and the head of an owl.',
}

const bagOfHolding: Open5eMagicItem = {
  slug: 'bag-of-holding',
  name: 'Bag of Holding',
  document: mockDoc,
  type: 'Wondrous Item',
  rarity: 'Uncommon',
  requires_attunement: '',
  desc: 'This bag has an interior space considerably larger than its outside dimensions.',
}

describe('mapChallengeRating', () => {
  it('wraps a numeric CR', () => {
    expect(mapChallengeRating('3')).toBe('CR 3')
  })
  it('wraps fractional CR', () => {
    expect(mapChallengeRating('1/8')).toBe('CR 1/8')
  })
  it('handles CR 0', () => {
    expect(mapChallengeRating('0')).toBe('CR 0')
  })
  it('handles numeric input', () => {
    expect(mapChallengeRating(10)).toBe('CR 10')
  })
  it('returns null for nullish input', () => {
    expect(mapChallengeRating(null)).toBeNull()
    expect(mapChallengeRating(undefined)).toBeNull()
    expect(mapChallengeRating('')).toBeNull()
  })
})

describe('mapSpeed', () => {
  it('extracts walk speed', () => {
    expect(mapSpeed({ walk: 30 })).toBe(30)
  })
  it('falls back to 30 when empty', () => {
    expect(mapSpeed(null)).toBe(30)
    expect(mapSpeed({})).toBe(30)
  })
  it('parses string speed', () => {
    expect(mapSpeed({ walk: '40 ft.' })).toBe(40)
  })
})

describe('mapItemType', () => {
  it('maps wondrous item', () => {
    expect(mapItemType('Wondrous Item')).toBe('wondrous')
  })
  it('maps weapon', () => {
    expect(mapItemType('Weapon (longsword)')).toBe('weapon')
  })
  it('maps armor', () => {
    expect(mapItemType('Armor (plate)')).toBe('armor')
  })
  it('maps potion', () => {
    expect(mapItemType('Potion')).toBe('potion')
  })
  it('maps ring', () => {
    expect(mapItemType('Ring')).toBe('ring')
  })
  it('maps rod', () => {
    expect(mapItemType('Rod')).toBe('rod')
  })
  it('maps scroll', () => {
    expect(mapItemType('Scroll')).toBe('scroll')
  })
  it('maps staff', () => {
    expect(mapItemType('Staff')).toBe('staff')
  })
  it('maps wand', () => {
    expect(mapItemType('Wand')).toBe('wand')
  })
  it('falls back to misc for unknown type', () => {
    expect(mapItemType('Something Else')).toBe('misc')
    expect(mapItemType(null)).toBe('misc')
  })
})

describe('mapItemRarity', () => {
  it('maps each rarity case-insensitively', () => {
    expect(mapItemRarity('Common')).toBe('common')
    expect(mapItemRarity('Uncommon')).toBe('uncommon')
    expect(mapItemRarity('Rare')).toBe('rare')
    expect(mapItemRarity('Very Rare')).toBe('very_rare')
    expect(mapItemRarity('Legendary')).toBe('legendary')
    expect(mapItemRarity('Artifact')).toBe('artifact')
  })
  it('handles lowercase very_rare', () => {
    expect(mapItemRarity('very rare')).toBe('very_rare')
  })
  it('falls back to common for unknown', () => {
    expect(mapItemRarity('Exotic')).toBe('common')
    expect(mapItemRarity(null)).toBe('common')
  })
})

describe('mapMonsterToBestiary', () => {
  it('maps core fields correctly', () => {
    const result = mapMonsterToBestiary(owlbear, 'world-1', 'user-1')
    expect(result.name).toBe('Owlbear')
    expect(result.world_id).toBe('world-1')
    expect(result.user_id).toBe('user-1')
    expect(result.hp).toBe(59)
    expect(result.ac).toBe(13)
    expect(result.speed).toBe(40)
    expect(result.creature_type).toBe('monstrosity')
    expect(result.threat_level).toBe('CR 3')
    expect(result.source).toBe('srd')
    expect(result.source_slug).toBe('owlbear')
    expect(result.committed).toBe(true)
    expect(result.status).toBe('active')
    expect(result.subtitle).toBeNull()
  })

  it('maps all ability scores', () => {
    const result = mapMonsterToBestiary(owlbear, 'w', 'u')
    expect(result.stat_str).toBe(20)
    expect(result.stat_dex).toBe(12)
    expect(result.stat_con).toBe(17)
    expect(result.stat_int).toBe(3)
    expect(result.stat_wis).toBe(12)
    expect(result.stat_cha).toBe(7)
  })

  it('maps subtype as subtitle', () => {
    const result = mapMonsterToBestiary({ ...owlbear, subtype: 'devil' }, 'w', 'u')
    expect(result.subtitle).toBe('devil')
  })

  it('maps description', () => {
    const result = mapMonsterToBestiary(owlbear, 'w', 'u')
    expect(result.description).toContain('bear')
  })

  it('handles fractional CR', () => {
    const result = mapMonsterToBestiary({ ...owlbear, challenge_rating: '1/2' }, 'w', 'u')
    expect(result.threat_level).toBe('CR 1/2')
  })
})

const fireball: Open5eSpell = {
  slug: 'fireball',
  name: 'Fireball',
  document: mockDoc,
  school: 'evocation',
  level: 3,
  casting_time: '1 action',
  range: '150 feet',
  components: 'V, S, M (a tiny ball of bat guano and sulfur)',
  duration: 'Instantaneous',
  concentration: false,
  ritual: false,
  desc: 'A bright streak flashes from your pointing finger...',
  higher_level: 'When you cast this spell using a slot of 4th level or higher...',
  dnd_class: 'Sorcerer, Wizard',
}

describe('mapSpellSchool', () => {
  it('maps each school case-insensitively', () => {
    expect(mapSpellSchool('evocation')).toBe('evocation')
    expect(mapSpellSchool('Evocation')).toBe('evocation')
    expect(mapSpellSchool('NECROMANCY')).toBe('necromancy')
    expect(mapSpellSchool('transmutation')).toBe('transmutation')
  })
  it('falls back to evocation for unknown school', () => {
    expect(mapSpellSchool('unknown')).toBe('evocation')
    expect(mapSpellSchool(null)).toBe('evocation')
  })
  it('maps all 8 schools', () => {
    const schools = ['abjuration', 'conjuration', 'divination', 'enchantment', 'evocation', 'illusion', 'necromancy', 'transmutation']
    for (const school of schools) {
      expect(mapSpellSchool(school)).toBe(school)
    }
  })
})

describe('mapSpellToSpell', () => {
  it('maps core fields correctly', () => {
    const result = mapSpellToSpell(fireball, 'user-1')
    expect(result.name).toBe('Fireball')
    expect(result.user_id).toBe('user-1')
    expect(result.level).toBe(3)
    expect(result.school).toBe('evocation')
    expect(result.casting_time).toBe('1 action')
    expect(result.range).toBe('150 feet')
    expect(result.duration).toBe('Instantaneous')
    expect(result.concentration).toBe(false)
    expect(result.ritual).toBe(false)
    expect(result.source).toBe('srd')
    expect(result.source_slug).toBe('fireball')
  })

  it('maps classes from comma-separated string', () => {
    const result = mapSpellToSpell(fireball, 'u')
    expect(result.classes).toEqual(['Sorcerer', 'Wizard'])
  })

  it('maps description and higher_level', () => {
    const result = mapSpellToSpell(fireball, 'u')
    expect(result.description).toContain('bright streak')
    expect(result.higher_level).toContain('4th level')
  })

  it('handles cantrip (level 0)', () => {
    const result = mapSpellToSpell({ ...fireball, level: 0 }, 'u')
    expect(result.level).toBe(0)
  })

  it('handles concentration spell', () => {
    const result = mapSpellToSpell({ ...fireball, concentration: true }, 'u')
    expect(result.concentration).toBe(true)
  })

  it('handles ritual spell', () => {
    const result = mapSpellToSpell({ ...fireball, ritual: true }, 'u')
    expect(result.ritual).toBe(true)
  })

  it('handles empty dnd_class', () => {
    const result = mapSpellToSpell({ ...fireball, dnd_class: '' }, 'u')
    expect(result.classes).toEqual([])
  })
})

describe('mapMagicItemToItem', () => {
  it('maps core fields correctly', () => {
    const result = mapMagicItemToItem(bagOfHolding, 'campaign-1')
    expect(result.name).toBe('Bag of Holding')
    expect(result.campaign_id).toBe('campaign-1')
    expect(result.item_type).toBe('wondrous')
    expect(result.rarity).toBe('uncommon')
    expect(result.is_magical).toBe(true)
    expect(result.source).toBe('srd')
    expect(result.source_slug).toBe('bag-of-holding')
    expect(result.committed).toBe(true)
    expect(result.character_id).toBeNull()
    expect(result.equipped_slot).toBeNull()
    expect(result.quantity).toBe(1)
  })

  it('maps description', () => {
    const result = mapMagicItemToItem(bagOfHolding, 'c')
    expect(result.description).toContain('interior space')
  })

  it('maps very rare rarity', () => {
    const result = mapMagicItemToItem({ ...bagOfHolding, rarity: 'Very Rare' }, 'c')
    expect(result.rarity).toBe('very_rare')
  })

  it('maps weapon type', () => {
    const result = mapMagicItemToItem({ ...bagOfHolding, type: 'Weapon (any sword)' }, 'c')
    expect(result.item_type).toBe('weapon')
  })
})

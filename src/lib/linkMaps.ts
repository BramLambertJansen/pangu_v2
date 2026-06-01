import type { LinkRelation, LinkableEntityType } from '@/types/link.types'

export const relationLabel: Record<LinkRelation, string> = {
  related_to:  'gerelateerd aan',
  located_in:  'woont in / bevindt zich in',
  member_of:   'lid van',
  owns:        'eigenaar van',
  involved_in: 'betrokken bij',
  ally_of:     'bondgenoot van',
  enemy_of:    'vijand van',
  mentions:    'vermeldt',
}

// Symmetric relations have the same label in both directions.
export const relationInverseLabel: Record<LinkRelation, string> = {
  related_to:  'gerelateerd aan',
  located_in:  'inwoners / bezoekers',
  member_of:   'leden',
  owns:        'eigendom van',
  involved_in: 'betrokken partijen',
  ally_of:     'bondgenoot van',
  enemy_of:    'vijand van',
  mentions:    'vermeldt',
}

export const linkableTypeLabel: Record<LinkableEntityType, string> = {
  location:  'Locatie',
  npc:       'NPC',
  lore:      'Lore',
  quest:     'Quest',
  session:   'Sessie',
  item:      'Item',
  encounter: 'Gevecht',
  character: 'Karakter',
}

export const linkableTypeRoute: Record<LinkableEntityType, string> = {
  location:  '/locations',
  npc:       '/npcs',
  lore:      '/lore',
  quest:     '/quests',
  session:   '/sessions',
  item:      '/items',
  encounter: '/encounters',
  character: '/characters',
}

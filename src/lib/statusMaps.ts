import type { WorldStatus } from '@/types/world.types'
import type { CampaignStatus } from '@/types/campaign.types'
import type { SessionStatus } from '@/types/session.types'
import type { LocationStatus } from '@/types/location.types'
import type { LoreStatus } from '@/types/lore.types'
import type { NpcStatus } from '@/types/npc.types'

export const worldStatusLabel: Record<WorldStatus, string> = {
  draft:    'Concept',
  active:   'Actief',
  archived: 'Gearchiveerd',
}

export const worldStatusColor: Record<WorldStatus, string> = {
  draft:    'var(--gold)',
  active:   'var(--violet)',
  archived: 'var(--muted)',
}

export const campaignStatusLabel: Record<CampaignStatus, string> = {
  draft:     'Concept',
  active:    'Actief',
  archived:  'Gearchiveerd',
  completed: 'Voltooid',
}

export const campaignStatusColor: Record<CampaignStatus, string> = {
  draft:     'var(--gold)',
  active:    'var(--violet)',
  archived:  'var(--muted)',
  completed: 'var(--teal)',
}

export const sessionStatusLabel: Record<SessionStatus, string> = {
  planned:   'Gepland',
  active:    'Actief',
  completed: 'Voltooid',
  archived:  'Gearchiveerd',
}

export const sessionStatusColor: Record<SessionStatus, string> = {
  planned:   'var(--gold)',
  active:    'var(--violet)',
  completed: 'var(--teal)',
  archived:  'var(--muted)',
}

export const locationStatusLabel: Record<LocationStatus, string> = {
  draft:      'Concept',
  active:     'Actief',
  discovered: 'Ontdekt',
  archived:   'Gearchiveerd',
}

export const locationStatusColor: Record<LocationStatus, string> = {
  draft:      'var(--gold)',
  active:     'var(--violet)',
  discovered: 'var(--teal)',
  archived:   'var(--muted)',
}

export const loreStatusLabel: Record<LoreStatus, string> = {
  draft:    'Concept',
  active:   'Actief',
  archived: 'Gearchiveerd',
}

export const loreStatusColor: Record<LoreStatus, string> = {
  draft:    'var(--gold)',
  active:   'var(--violet)',
  archived: 'var(--muted)',
}

export const npcStatusLabel: Record<NpcStatus, string> = {
  draft:    'Concept',
  active:   'Actief',
  retired:  'Teruggetrokken',
  archived: 'Gearchiveerd',
}

export const npcStatusColor: Record<NpcStatus, string> = {
  draft:    'var(--gold)',
  active:   'var(--violet)',
  retired:  'var(--muted)',
  archived: 'var(--muted)',
}

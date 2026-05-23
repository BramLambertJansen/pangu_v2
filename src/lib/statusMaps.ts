import type { WorldStatus } from '@/types/world.types'
import type { CampaignStatus } from '@/types/campaign.types'
import type { SessionStatus } from '@/types/session.types'
import type { LocationStatus } from '@/types/location.types'
import type { LoreStatus } from '@/types/lore.types'
import type { NpcStatus } from '@/types/npc.types'
import type { CharacterStatus } from '@/types/character.types'
import type { BestiaryStatus } from '@/types/bestiary.types'
import type { QuestStatus } from '@/types/quest.types'
import type { EncounterStatus } from '@/types/encounter.types'

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

export const characterStatusLabel: Record<CharacterStatus, string> = {
  active:   'Actief',
  inactive: 'Inactief',
  retired:  'Teruggetrokken',
  archived: 'Gearchiveerd',
}

export const characterStatusColor: Record<CharacterStatus, string> = {
  active:   'var(--azure)',
  inactive: 'var(--gold)',
  retired:  'var(--muted)',
  archived: 'var(--muted)',
}

export const bestiaryStatusLabel: Record<BestiaryStatus, string> = {
  draft:    'Concept',
  active:   'Actief',
  archived: 'Gearchiveerd',
}

export const bestiaryStatusColor: Record<BestiaryStatus, string> = {
  draft:    'var(--gold)',
  active:   'var(--teal)',
  archived: 'var(--muted)',
}

export const questStatusLabel: Record<QuestStatus, string> = {
  draft:     'Concept',
  active:    'Actief',
  completed: 'Voltooid',
  failed:    'Mislukt',
  archived:  'Gearchiveerd',
}

export const questStatusColor: Record<QuestStatus, string> = {
  draft:     'var(--gold)',
  active:    'var(--violet)',
  completed: 'var(--teal)',
  failed:    'var(--crimson)',
  archived:  'var(--muted)',
}

export const encounterStatusLabel: Record<EncounterStatus, string> = {
  draft:     'Concept',
  ready:     'Klaar',
  active:    'Actief',
  completed: 'Voltooid',
  archived:  'Gearchiveerd',
}

export const encounterStatusColor: Record<EncounterStatus, string> = {
  draft:     'var(--gold)',
  ready:     'var(--azure)',
  active:    'var(--violet)',
  completed: 'var(--teal)',
  archived:  'var(--muted)',
}

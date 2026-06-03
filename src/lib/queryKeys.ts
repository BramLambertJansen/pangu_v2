export const queryKeys = {
  campaigns: {
    all: ['campaigns'] as const,
    active: ['campaigns', 'active'] as const,
    activeForWorlds: ['campaigns', 'active-for-worlds'] as const,
    detail: (id: string) => ['campaigns', id] as const,
    // Separate key for the variant that joins worlds — avoids cache shape collision with detail()
    detailWithWorld: (id: string) => ['campaigns', id, 'with-world'] as const,
    byWorld: (worldId: string) => ['campaigns', 'world', worldId] as const,
    locations: (id: string) => ['campaigns', id, 'locations'] as const,
    npcs: (id: string) => ['campaigns', id, 'npcs'] as const,
    lore: (id: string) => ['campaigns', id, 'lore'] as const,
    sessions: (campaignId: string) => ['campaigns', campaignId, 'sessions'] as const,
    quests: (id: string) => ['campaigns', id, 'quests'] as const,
    encounters: (id: string) => ['campaigns', id, 'encounters'] as const,
    invite: (id: string) => ['campaigns', id, 'invite'] as const,
    members: (id: string) => ['campaigns', id, 'members'] as const,
    factions: (id: string) => ['campaigns', id, 'factions'] as const,
  },
  invites: {
    byCode: (code: string) => ['invites', 'code', code] as const,
  },
  characters: {
    all: ['characters'] as const,
    detail: (id: string) => ['characters', id] as const,
    byCampaign: (campaignId: string) => ['characters', 'campaign', campaignId] as const,
    items: (characterId: string) => ['characters', characterId, 'items'] as const,
    spells: (characterId: string) => ['characters', characterId, 'spells'] as const,
  },
  items: {
    byCampaign: (campaignId: string) => ['items', 'campaign', campaignId] as const,
    detail: (id: string) => ['items', id] as const,
  },
  worlds: {
    all: ['worlds'] as const,
    detail: (id: string) => ['worlds', id] as const,
    bestiaries: (worldId: string) => ['worlds', worldId, 'bestiaries'] as const,
  },
  sessions: {
    planned: ['sessions', 'planned'] as const,
    detail: (id: string) => ['sessions', id] as const,
    detailFull: (id: string) => ['sessions', id, 'full'] as const,
    myNote: (sessionId: string) => ['sessions', sessionId, 'my-note'] as const,
    playerNotes: (sessionId: string) => ['sessions', sessionId, 'player-notes'] as const,
  },
  npcs: {
    detail: (id: string) => ['npcs', id] as const,
    detailFull: (id: string) => ['npcs', id, 'full'] as const,
  },
  locations: {
    detail: (id: string) => ['locations', id] as const,
    detailFull: (id: string) => ['locations', id, 'full'] as const,
  },
  lore: {
    detail: (id: string) => ['lore', id] as const,
    detailFull: (id: string) => ['lore', id, 'full'] as const,
  },
  quests: {
    detail: (id: string) => ['quests', id] as const,
    detailFull: (id: string) => ['quests', id, 'full'] as const,
  },
  encounters: {
    detail: (id: string) => ['encounters', id] as const,
    detailFull: (id: string) => ['encounters', id, 'full'] as const,
    monsters: (id: string) => ['encounters', id, 'monsters'] as const,
    monstersFull: (id: string) => ['encounters', id, 'monsters-full'] as const,
  },
  factions: {
    detail: (id: string) => ['factions', id] as const,
    detailFull: (id: string) => ['factions', id, 'full'] as const,
    members: (id: string) => ['factions', id, 'members'] as const,
  },
  bestiaries: {
    detail: (id: string) => ['bestiaries', id] as const,
    detailFull: (id: string) => ['bestiaries', id, 'full'] as const,
  },
  admin: {
    users: ['admin', 'users'] as const,
  },
  userAiSettings: (userId: string) => ['user_ai_settings', userId] as const,
  notifications: {
    list: (userId: string) => ['notifications', 'list', userId] as const,
  },
  entityLinks: (type: string, id: string) => ['entity-links', type, id] as const,
  srd: {
    monsters: (query: string, edition: string = '2014') => ['srd', 'monsters', edition, query] as const,
    items: (query: string, edition: string = '2014') => ['srd', 'items', edition, query] as const,
    spells: (query: string, edition: string = '2014') => ['srd', 'spells', edition, query] as const,
  },
  spells: {
    all: ['spells'] as const,
    detail: (id: string) => ['spells', id] as const,
  },
}

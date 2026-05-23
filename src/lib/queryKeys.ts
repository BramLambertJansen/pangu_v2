export const queryKeys = {
  campaigns: {
    all: ['campaigns'] as const,
    active: ['campaigns', 'active'] as const,
    detail: (id: string) => ['campaigns', id] as const,
    // Separate key for the variant that joins worlds — avoids cache shape collision with detail()
    detailWithWorld: (id: string) => ['campaigns', id, 'with-world'] as const,
    byWorld: (worldId: string) => ['campaigns', 'world', worldId] as const,
    locations: (id: string) => ['campaigns', id, 'locations'] as const,
    locationDetail: (locationId: string) => ['locations', locationId] as const,
    // Separate key for the variant that joins campaigns+worlds (used by LocationDetailPage)
    locationDetailFull: (locationId: string) => ['locations', locationId, 'full'] as const,
    npcs: (id: string) => ['campaigns', id, 'npcs'] as const,
    npcDetail: (npcId: string) => ['npcs', npcId] as const,
    // Separate key for the variant that joins campaigns+worlds (used by NpcDetailPage)
    npcDetailFull: (npcId: string) => ['npcs', npcId, 'full'] as const,
    lore: (id: string) => ['campaigns', id, 'lore'] as const,
    loreDetail: (loreId: string) => ['lore', loreId] as const,
    // Separate key for the variant that joins campaigns+worlds (used by LoreDetailPage)
    loreDetailFull: (loreId: string) => ['lore', loreId, 'full'] as const,
    sessions: (campaignId: string) => ['campaigns', campaignId, 'sessions'] as const,
    sessionDetail: (sessionId: string) => ['sessions', sessionId] as const,
  },
  characters: {
    all: ['characters'] as const,
    detail: (id: string) => ['characters', id] as const,
  },
  worlds: {
    all: ['worlds'] as const,
    detail: (id: string) => ['worlds', id] as const,
    bestiaries: (worldId: string) => ['worlds', worldId, 'bestiaries'] as const,
    bestiaryDetail: (id: string) => ['bestiaries', id] as const,
    // Separate key for the variant that joins worlds (used by BestiaryDetailPage)
    bestiaryDetailFull: (id: string) => ['bestiaries', id, 'full'] as const,
  },
  sessions: {
    planned: ['sessions', 'planned'] as const,
  },
  admin: {
    users: ['admin', 'users'] as const,
  },
}

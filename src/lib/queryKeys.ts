export const queryKeys = {
  campaigns: {
    all: ['campaigns'] as const,
    detail: (id: string) => ['campaigns', id] as const,
    byWorld: (worldId: string) => ['campaigns', 'world', worldId] as const,
    locations: (id: string) => ['campaigns', id, 'locations'] as const,
    npcs: (id: string) => ['campaigns', id, 'npcs'] as const,
    lore: (id: string) => ['campaigns', id, 'lore'] as const,
    sessions: (id: string) => ['campaigns', id, 'sessions'] as const,
  },
  characters: {
    all: ['characters'] as const,
    detail: (id: string) => ['characters', id] as const,
  },
  worlds: {
    all: ['worlds'] as const,
    detail: (id: string) => ['worlds', id] as const,
  },
  admin: {
    users: ['admin', 'users'] as const,
  },
}

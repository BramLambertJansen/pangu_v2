import { describe, it, expect, vi, beforeEach } from 'vitest'

// Test the merge and name-resolution logic in isolation from the Supabase client.
// We verify:
// 1. from-side links get direction='outgoing', to-side links get direction='incoming'
// 2. merged array contains both directions
// 3. name resolution groups by type and queries the right table

type MockLink = {
  id: string
  campaign_id: string
  from_type: string
  from_id: string
  to_type: string
  to_id: string
  relation: string
  created_at: string
}

type ResolvedEntity = { id: string; type: string; name: string; status: string | null }
type ResolvedLink = {
  linkId: string
  relation: string
  direction: 'outgoing' | 'incoming'
  entity: ResolvedEntity
}

// Replicate the core logic from useEntityLinks without Supabase dependency
const typeToTable: Record<string, string> = {
  location: 'locations', npc: 'npcs', lore: 'lore',
  quest: 'quests', session: 'sessions', item: 'items',
  encounter: 'encounters', character: 'characters',
}

async function resolveNames(
  others: Array<{ id: string; type: string }>,
  queryFn: (table: string, ids: string[], cols: string) => Promise<Array<{ id: string; name: string; status?: string }>>,
): Promise<Map<string, { name: string; status: string | null }>> {
  const grouped = new Map<string, string[]>()
  for (const o of others) {
    const ids = grouped.get(o.type) ?? []
    ids.push(o.id)
    grouped.set(o.type, ids)
  }

  const result = new Map<string, { name: string; status: string | null }>()

  for (const [type, ids] of grouped.entries()) {
    const cols = type === 'item' ? 'id, name' : 'id, name, status'
    const rows = await queryFn(typeToTable[type], ids, cols)
    for (const row of rows) {
      result.set(row.id, { name: row.name, status: row.status ?? null })
    }
  }

  return result
}

function buildResolved(fromLinks: MockLink[], toLinks: MockLink[], nameMap: Map<string, { name: string; status: string | null }>): ResolvedLink[] {
  return [
    ...fromLinks.map(l => ({
      linkId: l.id,
      relation: l.relation,
      direction: 'outgoing' as const,
      entity: {
        id: l.to_id,
        type: l.to_type,
        name: nameMap.get(l.to_id)?.name ?? l.to_id,
        status: nameMap.get(l.to_id)?.status ?? null,
      },
    })),
    ...toLinks.map(l => ({
      linkId: l.id,
      relation: l.relation,
      direction: 'incoming' as const,
      entity: {
        id: l.from_id,
        type: l.from_type,
        name: nameMap.get(l.from_id)?.name ?? l.from_id,
        status: nameMap.get(l.from_id)?.status ?? null,
      },
    })),
  ]
}

const fromLink: MockLink = {
  id: 'link-1', campaign_id: 'camp-1',
  from_type: 'npc', from_id: 'npc-1',
  to_type: 'location', to_id: 'loc-1',
  relation: 'located_in', created_at: '2024-01-01',
}

const toLink: MockLink = {
  id: 'link-2', campaign_id: 'camp-1',
  from_type: 'quest', from_id: 'quest-1',
  to_type: 'npc', to_id: 'npc-1',
  relation: 'involved_in', created_at: '2024-01-02',
}

describe('useEntityLinks merge logic', () => {
  it('merges from-side and to-side links into a single array', async () => {
    const nameMap = new Map([
      ['loc-1', { name: 'De Scheve Toren', status: 'active' }],
      ['quest-1', { name: 'De Verloren Kroon', status: 'active' }],
    ])
    const result = buildResolved([fromLink], [toLink], nameMap)
    expect(result).toHaveLength(2)
  })

  it('assigns direction=outgoing for from-side links', async () => {
    const nameMap = new Map([['loc-1', { name: 'Toren', status: 'active' }]])
    const result = buildResolved([fromLink], [], nameMap)
    expect(result[0].direction).toBe('outgoing')
  })

  it('assigns direction=incoming for to-side links', async () => {
    const nameMap = new Map([['quest-1', { name: 'Quest', status: 'active' }]])
    const result = buildResolved([], [toLink], nameMap)
    expect(result[0].direction).toBe('incoming')
  })

  it('resolves entity name from nameMap', async () => {
    const nameMap = new Map([['loc-1', { name: 'De Scheve Toren', status: 'active' }]])
    const result = buildResolved([fromLink], [], nameMap)
    expect(result[0].entity.name).toBe('De Scheve Toren')
  })

  it('falls back to entity id if name is not resolved', async () => {
    const result = buildResolved([fromLink], [], new Map())
    expect(result[0].entity.name).toBe('loc-1')
  })
})

describe('resolveNames', () => {
  it('queries the correct table for each entity type', async () => {
    const queryFn = vi.fn().mockResolvedValue([{ id: 'loc-1', name: 'Toren', status: 'active' }])
    const others = [{ id: 'loc-1', type: 'location' }]
    await resolveNames(others, queryFn)
    expect(queryFn).toHaveBeenCalledWith('locations', ['loc-1'], 'id, name, status')
  })

  it('queries lore table (singular) for lore type', async () => {
    const queryFn = vi.fn().mockResolvedValue([{ id: 'lore-1', name: 'Lore item', status: 'active' }])
    const others = [{ id: 'lore-1', type: 'lore' }]
    await resolveNames(others, queryFn)
    expect(queryFn).toHaveBeenCalledWith('lore', ['lore-1'], 'id, name, status')
  })

  it('selects only id and name for items (no status column)', async () => {
    const queryFn = vi.fn().mockResolvedValue([{ id: 'item-1', name: 'Zwaard' }])
    const others = [{ id: 'item-1', type: 'item' }]
    await resolveNames(others, queryFn)
    expect(queryFn).toHaveBeenCalledWith('items', ['item-1'], 'id, name')
  })

  it('sets status=null for items', async () => {
    const queryFn = vi.fn().mockResolvedValue([{ id: 'item-1', name: 'Zwaard' }])
    const others = [{ id: 'item-1', type: 'item' }]
    const result = await resolveNames(others, queryFn)
    expect(result.get('item-1')?.status).toBeNull()
  })

  it('groups multiple entities of the same type into one query', async () => {
    const queryFn = vi.fn().mockResolvedValue([
      { id: 'npc-1', name: 'Karak', status: 'active' },
      { id: 'npc-2', name: 'Mira', status: 'active' },
    ])
    const others = [{ id: 'npc-1', type: 'npc' }, { id: 'npc-2', type: 'npc' }]
    await resolveNames(others, queryFn)
    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(queryFn).toHaveBeenCalledWith('npcs', ['npc-1', 'npc-2'], 'id, name, status')
  })
})

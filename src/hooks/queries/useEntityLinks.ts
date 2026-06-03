import { STALE } from '@/lib/queryClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import type { LinkableEntityType, LinkRelation, EntityLink, ResolvedLink } from '@/types/link.types'

// DEV_MODE has no .or() support in the LocalQueryBuilder, so we fetch
// from both directions separately and merge in JS. This applies in both
// DEV_MODE and production to keep the code consistent.
//
// PostgREST has no polymorphic joins, so entity names are resolved after
// fetching by grouping the "other side" IDs per type and issuing one
// .in('id', ids) per type against the correct table.

const typeToTable: Record<LinkableEntityType, string> = {
  location:  'locations',
  npc:       'npcs',
  lore:      'lore',   // singular — matches the actual Supabase table name
  quest:     'quests',
  session:   'sessions',
  item:      'items',
  encounter: 'encounters',
  character: 'characters',
  faction:   'factions',
}

async function resolveNames(
  others: Array<{ id: string; type: LinkableEntityType }>,
): Promise<Map<string, { name: string; status: string | null }>> {
  const grouped = new Map<LinkableEntityType, string[]>()
  for (const o of others) {
    const ids = grouped.get(o.type) ?? []
    ids.push(o.id)
    grouped.set(o.type, ids)
  }

  const result = new Map<string, { name: string; status: string | null }>()

  for (const [type, ids] of grouped.entries()) {
    // Items have no status column — select only id and name to avoid a column error
    const cols = type === 'item' ? 'id, name' : 'id, name, status'
    const { data } = await supabase
      .from(typeToTable[type])
      .select(cols)
      .in('id', ids)
    if (data) {
      for (const row of (data as unknown) as Array<{ id: string; name: string; status?: string }>) {
        result.set(row.id, { name: row.name, status: row.status ?? null })
      }
    }
  }

  return result
}

export function useEntityLinks(type: LinkableEntityType, id: string) {
  return useQuery<ResolvedLink[]>({
    queryKey: queryKeys.entityLinks(type, id),
    queryFn: async () => {
      const [fromResult, toResult] = await Promise.all([
        supabase.from('entity_links').select('*').eq('from_type', type).eq('from_id', id),
        supabase.from('entity_links').select('*').eq('to_type', type).eq('to_id', id),
      ])

      if (fromResult.error) throw fromResult.error
      if (toResult.error) throw toResult.error

      const fromLinks = (fromResult.data ?? []) as EntityLink[]
      const toLinks = (toResult.data ?? []) as EntityLink[]

      const others: Array<{ id: string; type: LinkableEntityType }> = [
        ...fromLinks.map(l => ({ id: l.to_id, type: l.to_type })),
        ...toLinks.map(l => ({ id: l.from_id, type: l.from_type })),
      ]

      const nameMap = await resolveNames(others)

      // Filter out links whose target entity was deleted (name not found in DB).
      // entity_links uses polymorphic IDs so there is no FK cascade; deleted entities
      // leave stale rows that resolve to an empty nameMap entry.
      const resolved: ResolvedLink[] = [
        ...fromLinks
          .filter(l => nameMap.has(l.to_id))
          .map(l => ({
            linkId: l.id,
            relation: l.relation,
            direction: 'outgoing' as const,
            entity: {
              id: l.to_id,
              type: l.to_type,
              name: nameMap.get(l.to_id)!.name,
              status: nameMap.get(l.to_id)!.status,
            },
          })),
        ...toLinks
          .filter(l => nameMap.has(l.from_id))
          .map(l => ({
            linkId: l.id,
            relation: l.relation,
            direction: 'incoming' as const,
            entity: {
              id: l.from_id,
              type: l.from_type,
              name: nameMap.get(l.from_id)!.name,
              status: nameMap.get(l.from_id)!.status,
            },
          })),
      ]

      return resolved
    },
    enabled: !!id,
    staleTime: STALE.list,
  })
}

interface CreateLinkVars {
  campaign_id: string
  from_type: LinkableEntityType
  from_id: string
  to_type: LinkableEntityType
  to_id: string
  relation: LinkRelation
}

export function useCreateLink() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (vars: CreateLinkVars) => {
      const { error } = await supabase.from('entity_links').insert(vars)
      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.entityLinks(vars.from_type, vars.from_id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.entityLinks(vars.to_type, vars.to_id) })
      toast.success('Verbinding gelegd')
    },
    onError: () => {
      toast.error('Verbinden mislukt')
    },
  })
}

interface DeleteLinkVars {
  linkId: string
  fromType: LinkableEntityType
  fromId: string
  toType: LinkableEntityType
  toId: string
}

export function useDeleteLink() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ linkId }: DeleteLinkVars) => {
      const { error } = await supabase.from('entity_links').delete().eq('id', linkId)
      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.entityLinks(vars.fromType, vars.fromId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.entityLinks(vars.toType, vars.toId) })
      toast.success('Verbinding verwijderd')
    },
    onError: () => {
      toast.error('Verwijderen mislukt')
    },
  })
}

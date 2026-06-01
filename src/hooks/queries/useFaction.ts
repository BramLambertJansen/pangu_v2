import { useQuery } from '@tanstack/react-query'
import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import type { Faction } from '@/types/faction.types'

// factions is not yet in database.types.ts — migration 039 adds the table but types are
// regenerated after the migration runs on the live database.
const db = supabase as unknown as SupabaseClient

export function useFaction(id: string | undefined) {
  return useQuery<Faction>({
    queryKey: queryKeys.campaigns.factionDetail(id!),
    queryFn: async () => {
      const { data, error } = await db
        .from('factions')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as Faction
    },
    enabled: !!id,
    staleTime: 1000 * 60,
  })
}

export type FactionWithCampaign = Faction & {
  campaigns: {
    id: string
    name: string
    world_id: string
    worlds: { id: string; name: string } | null
  } | null
}

export function useFactionFull(id: string | undefined) {
  return useQuery<FactionWithCampaign>({
    queryKey: queryKeys.campaigns.factionDetailFull(id!),
    queryFn: async () => {
      const { data, error } = await db
        .from('factions')
        .select('*, campaigns(id, name, world_id, worlds(id, name))')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as FactionWithCampaign
    },
    enabled: !!id,
    staleTime: 1000 * 60,
  })
}

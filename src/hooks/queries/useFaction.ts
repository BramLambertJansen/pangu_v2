import { STALE } from '@/lib/queryClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import type { Faction } from '@/types/faction.types'
import type { Npc } from '@/types/npc.types'

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
    staleTime: STALE.detail,
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
    staleTime: STALE.detail,
  })
}

export function useFactionMembers(factionId: string | undefined) {
  return useQuery<Pick<Npc, 'id' | 'name' | 'npc_role' | 'status'>[]>({
    queryKey: queryKeys.campaigns.factionMembers(factionId!),
    queryFn: async () => {
      const { data, error } = await db
        .from('npcs')
        .select('id, name, npc_role, status')
        .eq('faction_id', factionId!)
        .eq('committed', true)
        .order('name', { ascending: true })
      if (error) throw error
      return data as Pick<Npc, 'id' | 'name' | 'npc_role' | 'status'>[]
    },
    enabled: !!factionId,
    staleTime: STALE.list,
  })
}

export function useSaveFaction(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (form: Partial<Faction>) => {
      const { error } = await db
        .from('factions')
        .update({
          name: form.name,
          subtitle: form.subtitle ?? null,
          type: form.type ?? null,
          reputation: form.reputation ?? 'neutral',
          status: form.status,
          motto: form.motto ?? null,
          goals: form.goals ?? null,
          description: form.description ?? null,
          notes: form.notes ?? null,
          committed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
      if (error) throw error
      return form
    },
    onSuccess: (form) => {
      if (form.campaign_id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.factions(form.campaign_id) })
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.factionDetail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.factionDetailFull(id) })
    },
    onError: () => toast.error('Opslaan mislukt'),
  })
}

export function useDeleteFaction(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (_vars: { campaignId?: string }) => {
      const { error } = await db.from('factions').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, { campaignId }) => {
      queryClient.removeQueries({ queryKey: queryKeys.campaigns.factionDetail(id) })
      queryClient.removeQueries({ queryKey: queryKeys.campaigns.factionDetailFull(id) })
      if (campaignId) queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.factions(campaignId) })
    },
    onError: () => toast.error('Verwijderen mislukt'),
  })
}

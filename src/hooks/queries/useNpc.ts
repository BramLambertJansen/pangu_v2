import { STALE } from '@/lib/queryClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import type { Npc } from '@/types/npc.types'

// faction_id column on npcs is not yet in database.types.ts — migration 040 adds it but
// types are regenerated after the migration runs on the live database.
const db = supabase as unknown as SupabaseClient

type NpcWithCampaign = Npc & {
  campaigns: { id: string; name: string; world_id: string; worlds: { id: string; name: string } | null } | null
  factions: { id: string; name: string } | null
}

export function useNpc(id: string | undefined) {
  return useQuery<Npc>({
    queryKey: queryKeys.campaigns.npcDetail(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('npcs')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as Npc
    },
    enabled: !!id,
    staleTime: STALE.detail,
  })
}

export function useNpcFull(id: string | undefined) {
  return useQuery<NpcWithCampaign>({
    queryKey: queryKeys.campaigns.npcDetailFull(id!),
    queryFn: async () => {
      const { data, error } = await db
        .from('npcs')
        .select('*, campaigns(id, name, world_id, worlds(id, name)), factions(id, name)')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as NpcWithCampaign
    },
    enabled: !!id,
    staleTime: STALE.detail,
  })
}

export function useSaveNpc(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (form: Partial<Npc> & { oldFactionId?: string | null }) => {
      const { error } = await db
        .from('npcs')
        .update({
          name: form.name,
          subtitle: form.subtitle,
          description: form.description,
          notes: form.notes,
          status: form.status,
          npc_role: form.npc_role ?? null,
          faction_id: form.faction_id ?? null,
          committed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
      if (error) throw error
      return form
    },
    onSuccess: (form) => {
      if (form.campaign_id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.npcs(form.campaign_id) })
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.npcDetail(id) })
      const oldFactionId = form.oldFactionId
      const newFactionId = form.faction_id
      if (oldFactionId) queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.factionMembers(oldFactionId) })
      if (newFactionId && newFactionId !== oldFactionId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.factionMembers(newFactionId) })
      }
    },
    onError: () => toast.error('Opslaan mislukt'),
  })
}

export function useDeleteNpc(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (_vars: { campaignId?: string; factionId?: string | null }) => {
      const { error } = await supabase.from('npcs').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, { campaignId, factionId }) => {
      queryClient.removeQueries({ queryKey: queryKeys.campaigns.npcDetail(id) })
      if (factionId) queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.factionMembers(factionId) })
      if (campaignId) queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.npcs(campaignId) })
    },
    onError: () => toast.error('Verwijderen mislukt'),
  })
}

import { STALE } from '@/lib/queryClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import type { Npc } from '@/types/npc.types'

type NpcWithCampaign = Npc & {
  campaigns: { id: string; name: string; world_id: string; worlds: { id: string; name: string } | null } | null
  factions: { id: string; name: string } | null
}

export function useNpc(id: string | undefined) {
  return useQuery<Npc>({
    queryKey: queryKeys.npcs.detail(id!),
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
    queryKey: queryKeys.npcs.detailFull(id!),
    queryFn: async () => {
      const { data, error } = await supabase
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
      const { error } = await supabase
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
        queryClient.invalidateQueries({ queryKey: queryKeys.npcs.byCampaign(form.campaign_id) })
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.npcs.detail(id) })
      const oldFactionId = form.oldFactionId
      const newFactionId = form.faction_id
      if (oldFactionId) queryClient.invalidateQueries({ queryKey: queryKeys.factions.members(oldFactionId) })
      if (newFactionId && newFactionId !== oldFactionId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.factions.members(newFactionId) })
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
      queryClient.removeQueries({ queryKey: queryKeys.npcs.detail(id) })
      if (factionId) queryClient.invalidateQueries({ queryKey: queryKeys.factions.members(factionId) })
      if (campaignId) queryClient.invalidateQueries({ queryKey: queryKeys.npcs.byCampaign(campaignId) })
    },
    onError: () => toast.error('Verwijderen mislukt'),
  })
}

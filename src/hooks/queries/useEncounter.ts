import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import type { Encounter } from '@/types/encounter.types'
import type { Bestiary } from '@/types/bestiary.types'

type EncounterWithCampaignId = Encounter & {
  campaigns: { id: string; name: string; world_id: string } | null
}

type EncounterWithCampaignFull = Encounter & {
  campaigns: { id: string; name: string; world_id: string; worlds: { id: string; name: string } | null } | null
}

export type EncounterMonsterEdit = {
  id: string
  encounter_id: string
  bestiary_id: string
  count: number
  bestiaries: Pick<Bestiary, 'id' | 'name' | 'creature_type' | 'threat_level'> | null
}

export type MonsterInput = {
  bestiary_id: string
  count: number
}

export function useEncounterWithCampaign(id: string | undefined) {
  return useQuery<EncounterWithCampaignId>({
    queryKey: queryKeys.campaigns.encounterDetail(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('encounters')
        .select('*, campaigns(id, name, world_id)')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as EncounterWithCampaignId
    },
    enabled: !!id,
    staleTime: 1000 * 60,
  })
}

export function useEncounterFull(id: string | undefined) {
  return useQuery<EncounterWithCampaignFull>({
    queryKey: queryKeys.campaigns.encounterDetailFull(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('encounters')
        .select('*, campaigns(id, name, world_id, worlds(id, name))')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as EncounterWithCampaignFull
    },
    enabled: !!id,
    staleTime: 1000 * 60,
  })
}

export function useEncounterMonstersEdit(id: string | undefined) {
  return useQuery<EncounterMonsterEdit[]>({
    queryKey: queryKeys.campaigns.encounterMonsters(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('encounter_monsters')
        .select('*, bestiaries(id, name, creature_type, threat_level)')
        .eq('encounter_id', id!)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as EncounterMonsterEdit[]
    },
    enabled: !!id,
    staleTime: 1000 * 60,
  })
}

export function useSaveEncounter(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      form,
      monsters,
      userId,
    }: {
      form: Partial<Encounter>
      monsters: MonsterInput[]
      userId: string
    }) => {
      const { error: updateError } = await supabase
        .from('encounters')
        .update({
          name: form.name,
          subtitle: form.subtitle ?? null,
          description: form.description ?? null,
          notes: form.notes ?? null,
          status: form.status,
          environment: form.environment ?? null,
          difficulty: form.difficulty ?? null,
          session_id: form.session_id ?? null,
          committed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
      if (updateError) throw updateError

      const { error: deleteError } = await supabase
        .from('encounter_monsters')
        .delete()
        .eq('encounter_id', id)
      if (deleteError) throw deleteError

      if (monsters.length > 0) {
        const rows = monsters.map((m) => ({
          encounter_id: id,
          bestiary_id: m.bestiary_id,
          user_id: userId,
          count: m.count,
        }))
        const { error: insertError } = await supabase
          .from('encounter_monsters')
          .insert(rows)
        if (insertError) throw insertError
      }

      return form
    },
    onSuccess: (form) => {
      if (form.campaign_id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.encounters(form.campaign_id) })
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.encounterDetail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.encounterMonsters(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.encounterMonstersFull(id) })
    },
    onError: () => toast.error('Opslaan mislukt'),
  })
}

export function useDeleteEncounter(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (_vars: { campaignId?: string }) => {
      const { error } = await supabase.from('encounters').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, { campaignId }) => {
      queryClient.removeQueries({ queryKey: queryKeys.campaigns.encounterDetail(id) })
      queryClient.removeQueries({ queryKey: queryKeys.campaigns.encounterMonsters(id) })
      if (campaignId) queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.encounters(campaignId) })
    },
    onError: () => toast.error('Verwijderen mislukt'),
  })
}

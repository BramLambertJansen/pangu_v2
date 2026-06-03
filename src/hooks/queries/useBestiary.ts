import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import type { Bestiary, BestiaryWithWorld } from '@/types/bestiary.types'

export function useBestiary(id: string | undefined) {
  return useQuery<Bestiary>({
    queryKey: queryKeys.worlds.bestiaryDetail(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bestiaries')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as Bestiary
    },
    enabled: !!id,
    staleTime: 1000 * 60,
  })
}

export function useBestiaryFull(id: string | undefined) {
  return useQuery<BestiaryWithWorld>({
    queryKey: queryKeys.worlds.bestiaryDetailFull(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bestiaries')
        .select('*, worlds(id, name)')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as BestiaryWithWorld
    },
    enabled: !!id,
    staleTime: 1000 * 60,
  })
}

export function useSaveBestiary(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (form: Partial<Bestiary>) => {
      const { error } = await supabase
        .from('bestiaries')
        .update({
          name: form.name,
          subtitle: form.subtitle ?? null,
          creature_type: form.creature_type ?? null,
          threat_level: form.threat_level ?? null,
          habitat: form.habitat ?? null,
          description: form.description ?? null,
          notes: form.notes ?? null,
          status: form.status,
          hp: form.hp,
          ac: form.ac,
          speed: form.speed,
          stat_str: form.stat_str,
          stat_dex: form.stat_dex,
          stat_con: form.stat_con,
          stat_int: form.stat_int,
          stat_wis: form.stat_wis,
          stat_cha: form.stat_cha,
          image_url: form.image_url ?? null,
          committed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
      if (error) throw error
      return form
    },
    onSuccess: (form) => {
      if (form.world_id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.worlds.bestiaries(form.world_id) })
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.worlds.bestiaryDetail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.worlds.bestiaryDetailFull(id) })
    },
    onError: () => toast.error('Opslaan mislukt'),
  })
}

export function useDeleteBestiary(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (_vars: { worldId?: string }) => {
      const { error } = await supabase.from('bestiaries').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, { worldId }) => {
      queryClient.removeQueries({ queryKey: queryKeys.worlds.bestiaryDetail(id) })
      queryClient.removeQueries({ queryKey: queryKeys.worlds.bestiaryDetailFull(id) })
      if (worldId) queryClient.invalidateQueries({ queryKey: queryKeys.worlds.bestiaries(worldId) })
    },
    onError: () => toast.error('Verwijderen mislukt'),
  })
}

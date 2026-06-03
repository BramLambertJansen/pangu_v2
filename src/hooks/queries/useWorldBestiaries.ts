import { STALE } from '@/lib/queryClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { useAuthStore } from '@/stores/auth.store'
import type { Bestiary } from '@/types/bestiary.types'

export function useWorldBestiaries(worldId: string | undefined) {
  return useQuery<Bestiary[]>({
    queryKey: queryKeys.worlds.bestiaries(worldId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bestiaries')
        .select('*')
        .eq('world_id', worldId!)
        .eq('committed', true)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Bestiary[]
    },
    enabled: !!worldId,
    staleTime: STALE.list,
  })
}

export function useCreateBestiary(worldId: string) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore(s => s.user)

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Niet ingelogd')
      const { data, error } = await supabase
        .from('bestiaries')
        .insert({
          world_id: worldId,
          user_id: user.id,
          name: 'Nieuw wezen',
          status: 'draft',
          hp: 10,
          ac: 10,
          speed: 30,
          stat_str: 10,
          stat_dex: 10,
          stat_con: 10,
          stat_int: 10,
          stat_wis: 10,
          stat_cha: 10,
        })
        .select()
        .single()
      if (error) throw error
      return data as Bestiary
    },
    onSuccess: (newBestiary) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.worlds.bestiaries(worldId) })
      navigate(`/bestiary/${newBestiary.id}/edit`, { state: { isNew: true, worldId } })
    },
    onError: () => toast.error('Wezen aanmaken mislukt'),
  })
}

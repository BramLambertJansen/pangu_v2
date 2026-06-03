import { STALE } from '@/lib/queryClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { useAuthStore } from '@/stores/auth.store'
import type { World } from '@/types/world.types'
import type { Campaign } from '@/types/campaign.types'

export function useSaveWorld(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (form: Partial<World>) => {
      const { error } = await supabase
        .from('worlds')
        .update({
          name: form.name,
          subtitle: form.subtitle,
          quote: form.quote,
          description: form.description,
          header_image: form.header_image,
          header_image_position: form.header_image_position ?? 'center',
          status: form.status,
          notes: form.notes ?? null,
          committed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.worlds.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.worlds.detail(id) })
    },
    onError: () => toast.error('Opslaan mislukt'),
  })
}

export function useDeleteWorld(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('worlds').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: queryKeys.worlds.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.worlds.all })
    },
    onError: () => toast.error('Verwijderen mislukt'),
  })
}

export function useWorlds() {
  return useQuery<World[]>({
    queryKey: queryKeys.worlds.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('worlds')
        .select('*')
        .eq('committed', true)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as World[]
    },
    staleTime: STALE.detail,
  })
}

export function useActiveCampaignsForWorlds() {
  return useQuery<Pick<Campaign, 'id' | 'name' | 'world_id'>[]>({
    queryKey: queryKeys.campaigns.activeForWorlds,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, name, world_id')
        .eq('committed', true)
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
      if (error) throw error
      return data as Pick<Campaign, 'id' | 'name' | 'world_id'>[]
    },
    staleTime: STALE.detail,
  })
}

export function useWorld(id: string | undefined) {
  return useQuery<World>({
    queryKey: queryKeys.worlds.detail(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('worlds')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as World
    },
    enabled: !!id,
    staleTime: STALE.detail,
  })
}

export function useCreateWorld() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore(s => s.user)

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Niet ingelogd')
      const { data, error } = await supabase
        .from('worlds')
        .insert({ user_id: user.id })
        .select('id')
        .single()
      if (error) throw error
      return data.id as string
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.worlds.all })
      navigate(`/worlds/${id}/edit`, { state: { isNew: true } })
    },
    onError: () => toast.error('Wereld aanmaken mislukt'),
  })
}

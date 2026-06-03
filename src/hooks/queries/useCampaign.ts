import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { useAuthStore } from '@/stores/auth.store'
import type { Campaign } from '@/types/campaign.types'

export type CampaignWithWorldIds = Campaign & { worlds: { id: string; name: string } | null }

export function useAllCampaignsWithWorlds() {
  return useQuery<CampaignWithWorldIds[]>({
    queryKey: queryKeys.campaigns.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*, worlds(id, name)')
        .eq('committed', true)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as CampaignWithWorldIds[]
    },
    staleTime: 1000 * 60,
  })
}

export function useActiveCampaigns() {
  return useQuery<Campaign[]>({
    queryKey: queryKeys.campaigns.active,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('committed', true)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(4)
      if (error) throw error
      return data as Campaign[]
    },
    staleTime: 1000 * 60,
  })
}

export function useCreateCampaign() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore(s => s.user)

  return useMutation({
    mutationFn: async (worldId: string) => {
      if (!user) throw new Error('Niet ingelogd')
      const { data, error } = await supabase
        .from('campaigns')
        .insert({ world_id: worldId, user_id: user.id })
        .select('id')
        .single()
      if (error) throw error
      return { id: data.id as string, worldId }
    },
    onSuccess: ({ id, worldId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.byWorld(worldId) })
      navigate(`/campaigns/${id}/edit`, { state: { isNew: true, worldId } })
    },
    onError: () => toast.error('Kroniek aanmaken mislukt'),
  })
}

export function useCampaignsByWorld(worldId: string | undefined) {
  return useQuery<Campaign[]>({
    queryKey: queryKeys.campaigns.byWorld(worldId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('world_id', worldId!)
        .eq('committed', true)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Campaign[]
    },
    enabled: !!worldId,
    staleTime: 1000 * 60,
  })
}

export function useUserCampaignsWithWorld() {
  const user = useAuthStore(s => s.user)
  return useQuery<CampaignWithWorld[]>({
    queryKey: [...queryKeys.campaigns.all, 'my-with-world'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*, worlds(name)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as CampaignWithWorld[]
    },
    enabled: !!user,
    staleTime: 1000 * 60,
  })
}

export function useSaveCampaign(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (form: Partial<Campaign> & { worldId?: string }) => {
      const { error } = await supabase
        .from('campaigns')
        .update({
          name: form.name,
          subtitle: form.subtitle,
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
      return form
    },
    onSuccess: (form) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.detailWithWorld(id) })
      if (form.worldId) queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.byWorld(form.worldId) })
    },
    onError: () => toast.error('Opslaan mislukt'),
  })
}

export function useDeleteCampaign(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (_vars: { worldId?: string }) => {
      const { error } = await supabase.from('campaigns').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, { worldId }) => {
      queryClient.removeQueries({ queryKey: queryKeys.campaigns.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all })
      if (worldId) queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.byWorld(worldId) })
    },
    onError: () => toast.error('Verwijderen mislukt'),
  })
}

export function useUserCampaignNames(userId: string | undefined) {
  return useQuery<Pick<Campaign, 'id' | 'name'>[]>({
    queryKey: [...queryKeys.campaigns.all, 'names'],
    queryFn: async () => {
      const [ownedRes, memberRes] = await Promise.all([
        supabase.from('campaigns').select('id, name').eq('user_id', userId!),
        supabase.from('campaign_members').select('campaigns!inner(id, name)').eq('user_id', userId!),
      ])
      if (ownedRes.error) throw ownedRes.error
      if (memberRes.error) throw memberRes.error

      const memberCampaigns = (memberRes.data ?? []).map(
        (row) => (row as unknown as { campaigns: Pick<Campaign, 'id' | 'name'> }).campaigns
      )
      const seen = new Set<string>()
      return [...(ownedRes.data ?? []), ...memberCampaigns]
        .filter((c) => { if (seen.has(c.id)) return false; seen.add(c.id); return true })
        .sort((a, b) => a.name.localeCompare(b.name)) as Pick<Campaign, 'id' | 'name'>[]
    },
    enabled: !!userId,
    staleTime: 1000 * 60,
  })
}

export type CampaignWithWorld = Campaign & { worlds: { name: string } | null }

export function useCampaign(id: string | undefined) {
  return useQuery<Campaign>({
    queryKey: queryKeys.campaigns.detail(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as Campaign
    },
    enabled: !!id,
    staleTime: 1000 * 60,
  })
}

export function useCampaignWithWorld(id: string | undefined) {
  return useQuery<CampaignWithWorld>({
    queryKey: queryKeys.campaigns.detailWithWorld(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*, worlds(name)')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as CampaignWithWorld
    },
    enabled: !!id,
    staleTime: 1000 * 60,
  })
}

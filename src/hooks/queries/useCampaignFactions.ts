import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { useAuthStore } from '@/stores/auth.store'
import type { Faction } from '@/types/faction.types'

// factions is not yet in database.types.ts — migration 039 adds the table but types are
// regenerated after the migration runs on the live database.
const db = supabase as unknown as SupabaseClient

export function useCampaignFactions(campaignId: string | undefined) {
  return useQuery<Faction[]>({
    queryKey: queryKeys.campaigns.factions(campaignId!),
    queryFn: async () => {
      const { data, error } = await db
        .from('factions')
        .select('*')
        .eq('campaign_id', campaignId!)
        .eq('committed', true)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Faction[]
    },
    enabled: !!campaignId,
    staleTime: 1000 * 30,
  })
}

export function useCreateCampaignFaction(campaignId: string) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore(s => s.user)

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Niet ingelogd')
      const { data, error } = await db
        .from('factions')
        .insert({
          campaign_id: campaignId,
          user_id: user.id,
          name: 'Nieuwe factie',
          status: 'draft',
          reputation: 'neutral',
        })
        .select()
        .single()
      if (error) throw error
      return data as Faction
    },
    onSuccess: (newFaction) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.factions(campaignId) })
      navigate(`/factions/${newFaction.id}/edit`, { state: { isNew: true, campaignId } })
    },
    onError: () => {
      toast.error('Factie aanmaken mislukt')
    },
  })
}

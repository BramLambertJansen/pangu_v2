import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { useAuthStore } from '@/stores/auth.store'
import type { Session } from '@/types/session.types'

export function useCampaignSessions(campaignId: string | undefined) {
  return useQuery<Session[]>({
    queryKey: queryKeys.campaigns.sessions(campaignId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('campaign_id', campaignId!)
        .eq('committed', true)
        .order('session_number', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Session[]
    },
    enabled: !!campaignId,
    staleTime: 1000 * 30,
  })
}

export function useCreateCampaignSession(campaignId: string) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore(s => s.user)

  return useMutation({
    mutationFn: async ({ sessionNumber }: { sessionNumber?: number } = {}) => {
      if (!user) throw new Error('Niet ingelogd')
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          campaign_id: campaignId,
          user_id: user.id,
          name: 'Nieuwe sessie',
          status: 'planned',
          ...(sessionNumber != null ? { session_number: sessionNumber } : {}),
        })
        .select()
        .single()
      if (error) throw error
      return data as Session
    },
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.sessions(campaignId) })
      navigate(`/sessions/${newSession.id}/edit`, { state: { isNew: true, campaignId } })
    },
    onError: () => toast.error('Sessie aanmaken mislukt'),
  })
}

import { STALE } from '@/lib/queryClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import type { Session } from '@/types/session.types'

export function usePlannedSessions() {
  return useQuery<Session[]>({
    queryKey: queryKeys.sessions.planned,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('committed', true)
        .eq('status', 'planned')
        .order('session_date', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(6)
      if (error) throw error
      return data as Session[]
    },
    staleTime: STALE.list,
  })
}

type SessionWithCampaign = Session & {
  campaigns: { id: string; name: string; world_id: string; worlds: { id: string; name: string } | null } | null
}

export function useSession(id: string | undefined) {
  return useQuery<Session>({
    queryKey: queryKeys.sessions.detail(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as Session
    },
    enabled: !!id,
    staleTime: STALE.detail,
  })
}

export function useSessionFull(id: string | undefined) {
  return useQuery<SessionWithCampaign>({
    queryKey: queryKeys.sessions.detailFull(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select('*, campaigns(id, name, world_id, worlds(id, name))')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as SessionWithCampaign
    },
    enabled: !!id,
    staleTime: STALE.detail,
  })
}

export function useSaveSession(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (form: Partial<Session>) => {
      const { error } = await supabase
        .from('sessions')
        .update({
          name: form.name,
          subtitle: form.subtitle,
          description: form.description,
          notes: form.notes,
          status: form.status,
          session_date: form.session_date ?? null,
          session_number: form.session_number ?? null,
          committed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
      if (error) throw error
      return form
    },
    onSuccess: (form) => {
      if (form.campaign_id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.sessions.byCampaign(form.campaign_id) })
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.detailFull(id) })
    },
    onError: () => toast.error('Opslaan mislukt'),
  })
}

export function useDeleteSession(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (_vars: { campaignId?: string }) => {
      const { error } = await supabase.from('sessions').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, { campaignId }) => {
      queryClient.removeQueries({ queryKey: queryKeys.sessions.detail(id) })
      queryClient.removeQueries({ queryKey: queryKeys.sessions.detailFull(id) })
      if (campaignId) queryClient.invalidateQueries({ queryKey: queryKeys.sessions.byCampaign(campaignId) })
    },
    onError: () => toast.error('Verwijderen mislukt'),
  })
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { generateInviteCode } from '@/utils/inviteCode'
import type { CampaignMemberWithProfile } from '@/types/campaign_member.types'
import type { Character } from '@/types/character.types'

export function useCampaignInvite(campaignId: string | undefined) {
  return useQuery<string | null>({
    queryKey: queryKeys.campaigns.invite(campaignId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('invite_code')
        .eq('id', campaignId!)
        .single()
      if (error) throw error
      return data.invite_code
    },
    enabled: !!campaignId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useSetInviteCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ campaignId, code }: { campaignId: string; code: string | null }) => {
      const { error } = await supabase
        .from('campaigns')
        .update({ invite_code: code })
        .eq('id', campaignId)
      if (error) {
        if (error.code === '23505' && code !== null) {
          // Unique constraint: retry once with a new code
          const retryCode = generateInviteCode()
          const { error: retryError } = await supabase
            .from('campaigns')
            .update({ invite_code: retryCode })
            .eq('id', campaignId)
          if (retryError) throw retryError
          return retryCode
        }
        throw error
      }
      return code
    },
    onSuccess: (_data, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.invite(campaignId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.detail(campaignId) })
    },
    onError: () => {
      toast.error('Kon uitnodigingscode niet opslaan.')
    },
  })
}

export function useCampaignByInviteCode(code: string | undefined) {
  return useQuery<{ id: string; name: string; subtitle: string | null; status: string } | null>({
    queryKey: queryKeys.invites.byCode(code!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, name, subtitle, status')
        .eq('invite_code', code!)
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!code,
    staleTime: 1000 * 60 * 2,
  })
}

export function useJoinCampaign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ campaignId, userId }: { campaignId: string; userId: string }) => {
      const { error } = await supabase
        .from('campaign_members')
        .insert({ campaign_id: campaignId, user_id: userId })
      if (error) throw error
    },
    onSuccess: (_data, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.members(campaignId) })
    },
  })
}

export function useJoinWithCharacter() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ campaignId, userId, characterId }: { campaignId: string; userId: string; characterId: string }) => {
      const { error: memberError } = await supabase
        .from('campaign_members')
        .insert({ campaign_id: campaignId, user_id: userId })
      if (memberError) throw memberError

      const { error: charError } = await supabase
        .from('characters')
        .update({ campaign_id: campaignId })
        .eq('id', characterId)
      if (charError) throw charError
    },
    onSuccess: (_data, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.members(campaignId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.all })
    },
  })
}

export function useJoinAndCreateCharacter() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ campaignId, userId }: { campaignId: string; userId: string }) => {
      const { error: memberError } = await supabase
        .from('campaign_members')
        .insert({ campaign_id: campaignId, user_id: userId })
      if (memberError) throw memberError

      const { data, error: charError } = await supabase
        .from('characters')
        .insert({ user_id: userId, campaign_id: campaignId, name: 'Nieuw karakter', status: 'active' })
        .select()
        .single()
      if (charError) throw charError
      return data as unknown as Character
    },
    onSuccess: (_data, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.members(campaignId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.all })
    },
  })
}

export function useCampaignMembers(campaignId: string | undefined) {
  return useQuery<CampaignMemberWithProfile[]>({
    queryKey: queryKeys.campaigns.members(campaignId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_members')
        .select('*, profiles(display_name, email)')
        .eq('campaign_id', campaignId!)
        .order('joined_at', { ascending: true })
      if (error) throw error
      return data as CampaignMemberWithProfile[]
    },
    enabled: !!campaignId,
    staleTime: 1000 * 60,
  })
}

import { STALE } from '@/lib/queryClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { useAuthStore } from '@/stores/auth.store'
import type { PlayerNote, PlayerNoteWithCharacter } from '@/types/player_note.types'

export function useMySessionNote(sessionId: string | undefined) {
  const { user } = useAuthStore()
  return useQuery<PlayerNote | null>({
    queryKey: queryKeys.sessions.myNote(sessionId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('player_notes')
        .select('*')
        .eq('session_id', sessionId!)
        .eq('user_id', user!.id)
        .maybeSingle()
      if (error) throw error
      return data as PlayerNote | null
    },
    enabled: !!sessionId && !!user,
    staleTime: STALE.list,
  })
}

export function useSessionPlayerNotes(sessionId: string | undefined) {
  return useQuery<PlayerNoteWithCharacter[]>({
    queryKey: queryKeys.sessions.playerNotes(sessionId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('player_notes')
        .select('*, character:characters(name, character_class)')
        .eq('session_id', sessionId!)
        .order('updated_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as PlayerNoteWithCharacter[]
    },
    enabled: !!sessionId,
    staleTime: STALE.list,
  })
}

interface SaveNoteVars {
  sessionId: string
  userId: string
  characterId: string | null
  content: string
}

export function useSavePlayerNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ sessionId, userId, characterId, content }: SaveNoteVars) => {
      const { data: existing, error: selectError } = await supabase
        .from('player_notes')
        .select('id')
        .eq('session_id', sessionId)
        .eq('user_id', userId)
        .maybeSingle()
      if (selectError) throw selectError

      const now = new Date().toISOString()
      if (existing) {
        const { error } = await supabase
          .from('player_notes')
          .update({ content, updated_at: now })
          .eq('id', (existing as { id: string }).id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('player_notes')
          .insert({ session_id: sessionId, user_id: userId, character_id: characterId, content, updated_at: now })
        if (error) throw error
      }
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.myNote(vars.sessionId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.playerNotes(vars.sessionId) })
    },
  })
}

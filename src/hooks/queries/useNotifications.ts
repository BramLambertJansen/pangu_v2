import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import type { Notification } from '@/types/notification.types'

export function useNotifications(userId: string | undefined) {
  return useQuery<Notification[]>({
    queryKey: queryKeys.notifications.list(userId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return data as Notification[]
    },
    enabled: !!userId,
    staleTime: 1000 * 30,
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
      if (error) throw error
      return { id, userId }
    },
    onSuccess: ({ userId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list(userId) })
    },
  })
}

export function useMarkAllNotificationsRead(userId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      if (!userId) return
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false)
      if (error) throw error
    },
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list(userId) })
      }
    },
  })
}

export function useDeleteNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)
      if (error) throw error
      return { id, userId }
    },
    onSuccess: ({ userId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list(userId) })
    },
  })
}

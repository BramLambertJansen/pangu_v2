export type NotificationType =
  | 'campaign_member_joined'
  | 'session_scheduled'
  | 'session_updated'
  | 'ai_complete'
  | 'system_alert'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  metadata: Record<string, unknown> | null
  created_at: string
}

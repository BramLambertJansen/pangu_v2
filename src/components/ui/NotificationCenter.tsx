import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useUIStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from '@/hooks/queries/useNotifications'
import { useNotificationRealtime } from '@/hooks/useNotificationRealtime'
import { Skeleton } from '@/components/ui/Skeleton'
import { IconButton } from '@/components/ui/IconButton'
import { cn } from '@/utils/cn'
import type { CSSProperties } from 'react'
import type { Notification, NotificationType } from '@/types/notification.types'

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'zojuist'
  if (mins < 60) return `${mins}m geleden`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}u geleden`
  return `${Math.floor(hours / 24)}d geleden`
}

function TypeIcon({ type }: { type: NotificationType }) {
  if (type === 'campaign_member_joined') {
    return (
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <line x1="19" y1="8" x2="19" y2="14" />
        <line x1="22" y1="11" x2="16" y2="11" />
      </svg>
    )
  }
  if (type === 'session_scheduled' || type === 'session_updated') {
    return (
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    )
  }
  if (type === 'ai_complete') {
    return (
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    )
  }
  return (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

const iconColorByType: Record<NotificationType, string> = {
  campaign_member_joined: 'var(--gold)',
  session_scheduled: 'var(--teal)',
  session_updated: 'var(--violet)',
  ai_complete: 'var(--gold)',
  system_alert: 'var(--azure)',
}

function NotificationItem({ notification, userId }: { notification: Notification; userId: string }) {
  const markRead = useMarkNotificationRead()
  const deleteNotif = useDeleteNotification()

  return (
    <div className={cn('notif-item', !notification.read && 'notif-item--unread')}>
      <button
        type="button"
        className="notif-item-main"
        disabled={notification.read}
        onClick={() => markRead.mutate({ id: notification.id, userId })}
      >
        <span className="notif-icon" style={{ color: iconColorByType[notification.type] }}>
          <TypeIcon type={notification.type} />
        </span>
        <span className="notif-body">
          <span className="notif-title">{notification.title}</span>
          <span className="notif-msg">{notification.message}</span>
          <span className="notif-time">{formatRelativeTime(notification.created_at)}</span>
        </span>
      </button>
      <IconButton
        size="sm"
        className="notif-delete"
        aria-label="Melding verwijderen"
        onClick={() => deleteNotif.mutate({ id: notification.id, userId })}
      >
        <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </IconButton>
    </div>
  )
}

interface PanelPosition {
  top: number
  left: number
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const [panelPos, setPanelPos] = useState<PanelPosition>({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed)
  const user = useAuthStore((s) => s.user)

  const { data: notifications = [], isLoading } = useNotifications(user?.id)
  const markAll = useMarkAllNotificationsRead(user?.id)
  useNotificationRealtime(user?.id)

  const unreadCount = notifications.filter((n) => !n.read).length

  const PANEL_MAX_HEIGHT = 480

  const updatePanelPos = useCallback(() => {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const spaceAbove = rect.top
    const spaceBelow = window.innerHeight - rect.bottom
    const top =
      spaceAbove >= Math.min(PANEL_MAX_HEIGHT, 200) || spaceAbove > spaceBelow
        ? rect.top - 8
        : rect.bottom + 8
    setPanelPos({ top, left: rect.left })
  }, [])

  function handleOpen() {
    updatePanelPos()
    setOpen((v) => !v)
  }

  useEffect(() => {
    if (!open) return
    window.addEventListener('scroll', updatePanelPos, true)
    window.addEventListener('resize', updatePanelPos)
    return () => {
      window.removeEventListener('scroll', updatePanelPos, true)
      window.removeEventListener('resize', updatePanelPos)
    }
  }, [open, updatePanelPos])

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const panel = open ? (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Meldingencentrum"
      className="notif-panel"
      style={{ top: panelPos.top, left: panelPos.left } as CSSProperties}
    >
      <div className="notif-panel-head">
        <span className="notif-panel-title">Meldingen</span>
        {unreadCount > 0 && (
          <button className="notif-mark-all" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
            Alles gelezen
          </button>
        )}
      </div>

      <div className="notif-list">
        <p className="sr-only" role="status">
          {unreadCount > 0 ? `${unreadCount} ongelezen meldingen` : 'Geen ongelezen meldingen'}
        </p>
        {isLoading ? (
          <div className="notif-loading">
            <Skeleton style={{ height: 52, borderRadius: 'var(--r-xs)' }} />
            <Skeleton style={{ height: 52, borderRadius: 'var(--r-xs)' }} />
            <Skeleton style={{ height: 52, borderRadius: 'var(--r-xs)' }} />
          </div>
        ) : notifications.length === 0 ? (
          <div className="notif-empty">
            <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span>Geen meldingen</span>
          </div>
        ) : (
          notifications.map((n) => <NotificationItem key={n.id} notification={n} userId={user!.id} />)
        )}
      </div>
    </div>
  ) : null

  return (
    <div>
      <button
        ref={buttonRef}
        onClick={handleOpen}
        className={sidebarCollapsed ? 'nav-item nav-item--icon-only' : 'nav-item'}
        aria-label={`Meldingen${unreadCount > 0 ? `, ${unreadCount} ongelezen` : ''}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        title={sidebarCollapsed ? `Meldingen${unreadCount > 0 ? ` (${unreadCount})` : ''}` : undefined}
      >
        <span className="notif-bell">
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unreadCount > 0 && (
            <span aria-hidden="true" className="notif-badge">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </span>
        {!sidebarCollapsed && <span>Meldingen</span>}
      </button>

      {createPortal(panel, document.body)}
    </div>
  )
}

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

function NotificationItem({
  notification,
  userId,
}: {
  notification: Notification
  userId: string
}) {
  const markRead = useMarkNotificationRead()
  const deleteNotif = useDeleteNotification()

  function handleClick() {
    if (!notification.read) {
      markRead.mutate({ id: notification.id, userId })
    }
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    deleteNotif.mutate({ id: notification.id, userId })
  }

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--sp-2)',
        padding: 'var(--sp-3)',
        borderRadius: 'var(--r-xs)',
        background: notification.read ? 'transparent' : 'rgb(var(--violet-rgb) / 0.06)',
        cursor: notification.read ? 'default' : 'pointer',
        position: 'relative',
        transition: `background var(--t-fast) var(--ease-out)`,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-hover)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = notification.read ? 'transparent' : 'rgb(var(--violet-rgb) / 0.06)' }}
    >
      {!notification.read && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 'var(--sp-3)',
            right: 'var(--sp-3)',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--violet)',
            flexShrink: 0,
          }}
        />
      )}

      <div
        style={{
          flexShrink: 0,
          width: 28,
          height: 28,
          borderRadius: 'var(--r-xs)',
          background: 'var(--surface-3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: iconColorByType[notification.type],
          marginTop: 1,
        }}
      >
        <TypeIcon type={notification.type} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: notification.read ? 400 : 600,
            color: notification.read ? 'var(--ink-soft)' : 'var(--ink)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            paddingRight: 'var(--sp-4)',
          }}
        >
          {notification.title}
        </div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--muted)',
            marginTop: 2,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {notification.message}
        </div>
        <div style={{ fontSize: 11, color: 'var(--subtle)', marginTop: 4 }}>
          {formatRelativeTime(notification.created_at)}
        </div>
      </div>

      <button
        onClick={handleDelete}
        aria-label="Melding verwijderen"
        style={{
          flexShrink: 0,
          width: 20,
          height: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          background: 'transparent',
          color: 'var(--subtle)',
          cursor: 'pointer',
          borderRadius: 'var(--r-xs)',
          padding: 0,
          opacity: 0.6,
          marginTop: 2,
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.6' }}
      >
        <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
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
  const sidebarCollapsed = useUIStore(s => s.sidebarCollapsed)
  const user = useAuthStore(s => s.user)

  const { data: notifications = [], isLoading } = useNotifications(user?.id)
  const markAll = useMarkAllNotificationsRead(user?.id)
  useNotificationRealtime(user?.id)

  const unreadCount = notifications.filter(n => !n.read).length

  const PANEL_WIDTH = 340
  const PANEL_MAX_HEIGHT = 480

  const updatePanelPos = useCallback(() => {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const spaceAbove = rect.top
    const spaceBelow = viewportHeight - rect.bottom

    let top: number
    if (spaceAbove >= Math.min(PANEL_MAX_HEIGHT, 200) || spaceAbove > spaceBelow) {
      // Open upward: panel bottom aligns with button top
      top = rect.top - 8
    } else {
      // Open downward: panel top aligns with button bottom
      top = rect.bottom + 8
    }

    setPanelPos({ top, left: rect.left })
  }, [])

  function handleOpen() {
    updatePanelPos()
    setOpen(v => !v)
  }

  // Recompute on scroll/resize
  useEffect(() => {
    if (!open) return
    window.addEventListener('scroll', updatePanelPos, true)
    window.addEventListener('resize', updatePanelPos)
    return () => {
      window.removeEventListener('scroll', updatePanelPos, true)
      window.removeEventListener('resize', updatePanelPos)
    }
  }, [open, updatePanelPos])

  // Close on outside pointer-down
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

  // Close on Escape
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

  const iconOnly = `nav-item nav-item--icon-only`

  const panel = open ? (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Meldingencentrum"
      style={{
        position: 'fixed',
        top: panelPos.top,
        left: panelPos.left,
        width: PANEL_WIDTH,
        maxHeight: PANEL_MAX_HEIGHT,
        transform: 'translateY(-100%)',
        background: 'var(--surface-2)',
        border: '1px solid var(--hairline)',
        borderRadius: 'var(--r-xl)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--sp-3) var(--sp-4)',
          borderBottom: '1px solid var(--hairline)',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Meldingen</span>
        {unreadCount > 0 && (
          <button
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
            style={{
              fontSize: 11,
              color: 'var(--violet)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '2px 6px',
              borderRadius: 'var(--r-xs)',
              fontWeight: 500,
            }}
          >
            Alles gelezen
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ overflowY: 'auto', flex: 1, padding: 'var(--sp-1)' }}>
        {isLoading ? (
          <div style={{ padding: 'var(--sp-3)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
            <Skeleton style={{ height: 52, borderRadius: 'var(--r-xs)' }} />
            <Skeleton style={{ height: 52, borderRadius: 'var(--r-xs)' }} />
            <Skeleton style={{ height: 52, borderRadius: 'var(--r-xs)' }} />
          </div>
        ) : notifications.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--sp-2)',
              padding: 'var(--sp-8) var(--sp-4)',
              color: 'var(--subtle)',
            }}
          >
            <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span style={{ fontSize: 13 }}>Geen meldingen</span>
          </div>
        ) : (
          notifications.map(n => (
            <NotificationItem
              key={n.id}
              notification={n}
              userId={user!.id}
            />
          ))
        )}
      </div>
    </div>
  ) : null

  return (
    <div>
      <button
        ref={buttonRef}
        onClick={handleOpen}
        className={sidebarCollapsed ? iconOnly : 'nav-item'}
        aria-label={`Meldingen${unreadCount > 0 ? `, ${unreadCount} ongelezen` : ''}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        title={sidebarCollapsed ? `Meldingen${unreadCount > 0 ? ` (${unreadCount})` : ''}` : undefined}
        style={{ position: 'relative' }}
      >
        <span style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unreadCount > 0 && (
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: -4,
                right: -5,
                minWidth: 14,
                height: 14,
                borderRadius: 'var(--r-full)',
                background: 'var(--gold)',
                color: 'var(--void)',
                fontSize: 9,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 3px',
                lineHeight: 1,
              }}
            >
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

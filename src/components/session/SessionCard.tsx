import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Session } from '@/types/session.types'
import { EntityCard } from '@/components/ui/EntityCard'
import { ForgeCard } from '@/components/ui/ForgeCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { pickGradient, sessionGradients } from '@/utils/pickGradient'
import { sessionStatusLabel, sessionStatusColor } from '@/lib/statusMaps'
import { formatDate } from '@/utils/format'

interface Props {
  session: Session
}

export const SessionCard = memo(function SessionCard({ session }: Props) {
  const navigate = useNavigate()
  const gradient = pickGradient(session.id, sessionGradients)

  return (
    <EntityCard
      variant="compact"
      ariaLabel={`Sessie: ${session.name}`}
      onClick={() => navigate(`/sessions/${session.id}`)}
    >
      {/* Gradient accent */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0,
          background: gradient,
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            {session.session_number != null && (
              <span style={{
                flexShrink: 0,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 28, height: 28,
                borderRadius: 'var(--r-full)',
                background: 'rgb(var(--violet-rgb) / 0.15)',
                border: '1px solid rgb(var(--violet-rgb) / 0.3)',
                fontFamily: 'var(--font-body)',
                fontSize: 11, fontWeight: 700,
                letterSpacing: '0.06em',
                color: 'var(--violet)',
              }}>
                {session.session_number}
              </span>
            )}
            <div style={{ minWidth: 0 }}>
              {session.subtitle && (
                <p style={{
                  fontFamily: 'var(--font-quote)',
                  fontStyle: 'italic',
                  fontSize: 11, letterSpacing: '0.03em',
                  color: 'var(--gold)', margin: '0 0 2px',
                }}>
                  {session.subtitle}
                </p>
              )}
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(18px, 3vw, 22px)',
                fontWeight: 600, lineHeight: 1,
                letterSpacing: '0.04em', textTransform: 'uppercase',
                color: 'var(--ink)', margin: 0,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {session.name}
              </h2>
            </div>
          </div>

          <StatusBadge
            label={sessionStatusLabel[session.status]}
            color={sessionStatusColor[session.status]}
            className="mt-0.5"
          />
        </div>

        {session.description && (
          <p style={{
            fontSize: 13, lineHeight: 1.65,
            color: 'var(--muted)', margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {session.description}
          </p>
        )}

        {session.session_date && (
          <p style={{
            fontSize: 11, fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: 'var(--muted)', margin: 0,
            fontFamily: 'var(--font-body)',
          }}>
            {formatDate(session.session_date)}
          </p>
        )}

        {!session.description && !session.subtitle && !session.session_date && (
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, fontStyle: 'italic' }}>
            Een nieuwe sessie wacht op zijn verhaal.
          </p>
        )}
      </div>
    </EntityCard>
  )
})

interface ForgeProps {
  onClick: () => void
  loading?: boolean
}

export const ForgeSessionCard = memo(function ForgeSessionCard({ onClick, loading }: ForgeProps) {
  return (
    <ForgeCard
      variant="compact"
      accent="violet"
      onClick={onClick}
      loading={loading}
      ariaLabel="Nieuwe sessie aanmaken"
      title="+ Nieuwe sessie"
      subtitle="Start een nieuwe spelsessie"
      icon={
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 22, color: 'var(--violet)', opacity: 0.6,
          lineHeight: 1, userSelect: 'none',
        }} aria-hidden="true">
          ▶
        </span>
      }
    />
  )
})

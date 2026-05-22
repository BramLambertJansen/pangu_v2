import { useNavigate } from 'react-router-dom'
import type { Session } from '@/types/session.types'
import { pickGradient, sessionGradients } from '@/utils/pickGradient'
import { sessionStatusLabel, sessionStatusColor } from '@/lib/statusMaps'

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null
  // Parse YYYY-MM-DD as local calendar date to avoid UTC-midnight timezone shift
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) {
    const d = new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]))
    return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
  }
  return dateStr
}

interface Props {
  session: Session
}

export function SessionCard({ session }: Props) {
  const navigate = useNavigate()
  const gradient = pickGradient(session.id, sessionGradients)

  function handleActivate() {
    navigate(`/sessions/${session.id}/edit`)
  }

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Sessie: ${session.name}`}
      onClick={handleActivate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleActivate() }
      }}
      style={{
        position: 'relative',
        borderRadius: 'var(--r-xl)',
        border: '1px solid var(--hairline)',
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 24px 18px',
        minHeight: 120,
        transition: 'border-color var(--t-base) var(--ease-out), box-shadow var(--t-base) var(--ease-out), transform var(--t-base) var(--ease-out)',
        outline: 'none',
        background: 'var(--void-2)',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget
        el.style.borderColor = 'var(--hairline-strong)'
        el.style.boxShadow = '0 6px 24px rgba(0,0,0,0.35), 0 0 0 1px var(--hairline-strong)'
        el.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget
        el.style.borderColor = 'var(--hairline)'
        el.style.boxShadow = 'none'
        el.style.transform = 'translateY(0)'
      }}
      onFocus={(e) => { e.currentTarget.style.outline = '2px solid var(--violet)'; e.currentTarget.style.outlineOffset = '2px' }}
      onBlur={(e) => { e.currentTarget.style.outline = 'none' }}
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
                background: 'rgba(155,138,255,0.15)',
                border: '1px solid rgba(155,138,255,0.3)',
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
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
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

          <span style={{
            display: 'inline-flex', alignItems: 'center', flexShrink: 0,
            padding: '3px 10px',
            background: sessionStatusColor[session.status],
            borderRadius: 'var(--r-full)',
            fontFamily: 'var(--font-body)',
            fontSize: 9, fontWeight: 700,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            color: 'var(--void)',
            marginTop: 2,
          }}>
            {sessionStatusLabel[session.status]}
          </span>
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
    </article>
  )
}

interface ForgeProps {
  onClick: () => void
  loading?: boolean
}

export function ForgeSessionCard({ onClick, loading }: ForgeProps) {
  return (
    <article
      role="button"
      tabIndex={0}
      aria-label="Nieuwe sessie aanmaken"
      onClick={() => { if (!loading) onClick() }}
      onKeyDown={(e) => {
        if (loading) return
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() }
      }}
      style={{
        position: 'relative',
        borderRadius: 'var(--r-xl)',
        border: '1px dashed var(--hairline-strong)',
        overflow: 'hidden',
        cursor: loading ? 'wait' : 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 24px',
        minHeight: 120,
        gap: 8,
        transition: 'border-color var(--t-base) var(--ease-out), background var(--t-base) var(--ease-out)',
        outline: 'none',
        background: 'transparent',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--violet)'
        e.currentTarget.style.background = 'rgba(155,138,255,0.04)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--hairline-strong)'
        e.currentTarget.style.background = 'transparent'
      }}
      onFocus={(e) => { e.currentTarget.style.outline = '2px solid var(--violet)'; e.currentTarget.style.outlineOffset = '2px' }}
      onBlur={(e) => { e.currentTarget.style.outline = 'none' }}
    >
      <span style={{
        fontFamily: 'var(--font-display)',
        fontSize: 22, color: 'var(--violet)', opacity: 0.6,
        lineHeight: 1, userSelect: 'none',
      }} aria-hidden="true">
        ▶
      </span>
      <div style={{ textAlign: 'center' }}>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 12, fontWeight: 700,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          color: 'var(--violet)', margin: '0 0 4px',
        }}>
          {loading ? 'Aanmaken...' : '+ Nieuwe sessie'}
        </p>
        <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
          Start een nieuwe spelsessie
        </p>
      </div>
    </article>
  )
}

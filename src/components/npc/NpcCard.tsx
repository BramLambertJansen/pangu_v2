import { useNavigate } from 'react-router-dom'
import type { Npc, NpcStatus } from '@/types/npc.types'

const statusLabel: Record<NpcStatus, string> = {
  draft:    'Concept',
  active:   'Actief',
  retired:  'Teruggetrokken',
  archived: 'Gearchiveerd',
}

const statusColor: Record<NpcStatus, string> = {
  draft:    'var(--gold)',
  active:   'var(--violet)',
  retired:  'var(--muted)',
  archived: 'var(--muted)',
}

const cardGradients = [
  'radial-gradient(ellipse 70% 55% at 30% 40%, rgba(220,90,80,0.18) 0%, rgba(180,50,80,0.10) 55%, transparent 80%)',
  'radial-gradient(ellipse 65% 52% at 28% 42%, rgba(220,90,80,0.14) 0%, rgba(155,138,255,0.12) 55%, transparent 80%)',
  'radial-gradient(ellipse 65% 52% at 30% 42%, rgba(245,150,50,0.16) 0%, rgba(220,90,80,0.12) 55%, transparent 80%)',
  'radial-gradient(ellipse 65% 50% at 25% 40%, rgba(155,138,255,0.14) 0%, rgba(220,90,80,0.14) 55%, transparent 80%)',
]

function pickGradient(id: string): string {
  const code = (id.charCodeAt(0) ?? 0) + (id.charCodeAt(id.length - 1) ?? 0)
  return cardGradients[code % cardGradients.length]
}

interface Props {
  npc: Npc
}

export function NpcCard({ npc }: Props) {
  const navigate = useNavigate()
  const gradient = pickGradient(npc.id)

  function handleActivate() {
    navigate(`/npcs/${npc.id}`)
  }

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`NPC: ${npc.name}`}
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
          <div style={{ minWidth: 0 }}>
            {npc.subtitle && (
              <p style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontStyle: 'italic',
                fontSize: 11, letterSpacing: '0.03em',
                color: 'var(--gold)', margin: '0 0 2px',
              }}>
                {npc.subtitle}
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
              {npc.name}
            </h2>
          </div>

          <span style={{
            display: 'inline-flex', alignItems: 'center', flexShrink: 0,
            padding: '3px 10px',
            background: statusColor[npc.status],
            borderRadius: 'var(--r-full)',
            fontFamily: 'var(--font-body)',
            fontSize: 9, fontWeight: 700,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            color: 'var(--void)',
            marginTop: 2,
          }}>
            {statusLabel[npc.status]}
          </span>
        </div>

        {npc.npc_role && (
          <p style={{
            fontSize: 11, fontWeight: 700,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'var(--crimson, #dc5a50)', margin: 0,
            fontFamily: 'var(--font-body)',
          }}>
            {npc.npc_role}
          </p>
        )}

        {npc.description && (
          <p style={{
            fontSize: 13, lineHeight: 1.65,
            color: 'var(--muted)', margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {npc.description}
          </p>
        )}

        {!npc.description && !npc.subtitle && !npc.npc_role && (
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, fontStyle: 'italic' }}>
            Een nieuw personage wacht op zijn verhaal.
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

export function ForgeNpcCard({ onClick, loading }: ForgeProps) {
  return (
    <article
      role="button"
      tabIndex={0}
      aria-label="Nieuwe NPC aanmaken"
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
        e.currentTarget.style.borderColor = 'var(--crimson, #dc5a50)'
        e.currentTarget.style.background = 'rgba(220,90,80,0.04)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--hairline-strong)'
        e.currentTarget.style.background = 'transparent'
      }}
      onFocus={(e) => { e.currentTarget.style.outline = '2px solid var(--violet)'; e.currentTarget.style.outlineOffset = '2px' }}
      onBlur={(e) => { e.currentTarget.style.outline = 'none' }}
    >
      {/* Person icon */}
      <svg
        aria-hidden="true"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--crimson, #dc5a50)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ opacity: 0.7 }}
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
      <div style={{ textAlign: 'center' }}>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 12, fontWeight: 700,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          color: 'var(--crimson, #dc5a50)', margin: '0 0 4px',
        }}>
          {loading ? 'Aanmaken...' : '+ NPC toevoegen'}
        </p>
        <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
          Voeg een nieuw personage toe
        </p>
      </div>
    </article>
  )
}

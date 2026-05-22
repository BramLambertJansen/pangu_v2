import { useNavigate } from 'react-router-dom'
import type { Lore } from '@/types/lore.types'
import { pickGradient, loreGradients } from '@/utils/pickGradient'
import { loreStatusLabel, loreStatusColor } from '@/lib/statusMaps'

interface Props {
  lore: Lore
}

export function LoreCard({ lore }: Props) {
  const navigate = useNavigate()
  const gradient = pickGradient(lore.id, loreGradients)

  function handleActivate() {
    navigate(`/lore/${lore.id}`)
  }

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Lore: ${lore.name}`}
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
            {lore.subtitle && (
              <p style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontStyle: 'italic',
                fontSize: 11, letterSpacing: '0.03em',
                color: 'var(--gold)', margin: '0 0 2px',
              }}>
                {lore.subtitle}
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
              {lore.name}
            </h2>
          </div>

          <span style={{
            display: 'inline-flex', alignItems: 'center', flexShrink: 0,
            padding: '3px 10px',
            background: loreStatusColor[lore.status],
            borderRadius: 'var(--r-full)',
            fontFamily: 'var(--font-body)',
            fontSize: 9, fontWeight: 700,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            color: 'var(--void)',
            marginTop: 2,
          }}>
            {loreStatusLabel[lore.status]}
          </span>
        </div>

        {lore.lore_category && (
          <p style={{
            fontSize: 11, fontWeight: 700,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'var(--violet)', margin: 0,
            fontFamily: 'var(--font-body)',
          }}>
            {lore.lore_category}
          </p>
        )}

        {lore.description && (
          <p style={{
            fontSize: 13, lineHeight: 1.65,
            color: 'var(--muted)', margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {lore.description}
          </p>
        )}

        {!lore.description && !lore.subtitle && !lore.lore_category && (
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, fontStyle: 'italic' }}>
            Een nieuw verhaal wacht om verteld te worden.
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

export function ForgeLoreCard({ onClick, loading }: ForgeProps) {
  return (
    <article
      role="button"
      tabIndex={0}
      aria-label="Nieuwe lore aanmaken"
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
        e.currentTarget.style.borderColor = 'var(--teal, #3ecfb2)'
        e.currentTarget.style.background = 'rgba(62,207,178,0.04)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--hairline-strong)'
        e.currentTarget.style.background = 'transparent'
      }}
      onFocus={(e) => { e.currentTarget.style.outline = '2px solid var(--violet)'; e.currentTarget.style.outlineOffset = '2px' }}
      onBlur={(e) => { e.currentTarget.style.outline = 'none' }}
    >
      <svg
        aria-hidden="true"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--teal, #3ecfb2)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ opacity: 0.7 }}
      >
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
      <div style={{ textAlign: 'center' }}>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 12, fontWeight: 700,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          color: 'var(--teal, #3ecfb2)', margin: '0 0 4px',
        }}>
          {loading ? 'Aanmaken...' : '+ Lore toevoegen'}
        </p>
        <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
          Voeg een nieuw lore-item toe
        </p>
      </div>
    </article>
  )
}

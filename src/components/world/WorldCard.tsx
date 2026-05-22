import { useNavigate } from 'react-router-dom'
import type { World } from '@/types/world.types'
import { CompassRose } from '@/components/world/CompassRose'

// Deterministic gradient per world based on id
const cardGradients = [
  'radial-gradient(ellipse 70% 55% at 50% 32%, rgba(155,138,255,0.55) 0%, rgba(80,50,200,0.28) 45%, var(--void) 78%)',
  'radial-gradient(ellipse 65% 52% at 50% 35%, rgba(220,90,80,0.4) 0%, rgba(155,138,255,0.22) 50%, var(--void) 78%)',
  'radial-gradient(ellipse 65% 52% at 50% 35%, rgba(62,207,178,0.32) 0%, rgba(60,80,200,0.28) 50%, var(--void) 78%)',
  'radial-gradient(ellipse 65% 50% at 45% 35%, rgba(245,180,50,0.28) 0%, rgba(155,138,255,0.32) 50%, var(--void) 78%)',
]

function pickGradient(id: string): string {
  const code = (id.charCodeAt(0) ?? 0) + (id.charCodeAt(id.length - 1) ?? 0)
  return cardGradients[code % cardGradients.length]
}

interface Props {
  world: World
}

export function WorldCard({ world }: Props) {
  const navigate = useNavigate()
  const initial = world.name.trim()[0]?.toUpperCase() ?? '?'
  const gradient = world.header_image ? undefined : pickGradient(world.id)

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Wereld: ${world.name}`}
      onClick={() => navigate(`/worlds/${world.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/worlds/${world.id}`) }
      }}
      style={{
        position: 'relative',
        height: 520,
        borderRadius: 'var(--r-xl)',
        border: '1px solid var(--hairline)',
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color var(--t-base) var(--ease-out), box-shadow var(--t-base) var(--ease-out), transform var(--t-base) var(--ease-out)',
        outline: 'none',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget
        el.style.borderColor = 'var(--hairline-strong)'
        el.style.boxShadow = '0 12px 48px rgba(0,0,0,0.5), 0 0 0 1px var(--hairline-strong)'
        el.style.transform = 'translateY(-3px)'
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
      {/* Background */}
      {world.header_image ? (
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${world.header_image})`,
          backgroundSize: 'cover',
          backgroundPosition: world.header_image_position ?? 'center',
        }} />
      ) : (
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0,
          background: `${gradient}, var(--void)`,
        }} />
      )}

      {/* Watermark initial letter */}
      <div aria-hidden="true" style={{
        position: 'absolute',
        top: '8%',
        left: 0, right: 0,
        textAlign: 'center',
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(120px, 22vw, 160px)',
        fontWeight: 600,
        color: 'var(--ink)',
        opacity: 0.06,
        lineHeight: 1,
        userSelect: 'none',
        pointerEvents: 'none',
      }}>
        {initial}
      </div>

      {/* Bottom gradient overlay */}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(10,10,20,0.98) 0%, rgba(10,10,20,0.92) 30%, rgba(10,10,20,0.6) 55%, transparent 80%)',
      }} />

      {/* Content */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        padding: '28px 24px 28px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
      }}>
        {/* Era / subtitle */}
        {world.subtitle && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontFamily: 'var(--font-body)',
            fontSize: 10, fontWeight: 700,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: 'var(--gold)',
          }}>
            <span style={{ display: 'block', width: 20, height: 1, background: 'var(--gold)', opacity: 0.7, flexShrink: 0 }} aria-hidden="true" />
            {world.subtitle}
            <span style={{ display: 'block', width: 20, height: 1, background: 'var(--gold)', opacity: 0.7, flexShrink: 0 }} aria-hidden="true" />
          </div>
        )}

        {/* World name */}
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(22px, 3.5vw, 30px)',
          fontWeight: 600,
          letterSpacing: '0.08em',
          color: 'var(--ink)',
          margin: 0,
          lineHeight: 1.15,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {world.name.toUpperCase()}
        </h2>

        {/* Quote */}
        {world.quote && (
          <p style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontStyle: 'italic',
            fontSize: 14,
            lineHeight: 1.5,
            color: 'var(--ink-soft)',
            margin: 0,
          }}>
            "{world.quote}"
          </p>
        )}

        {/* Description */}
        {world.description && (
          <p style={{
            fontSize: 13,
            lineHeight: 1.65,
            color: 'var(--muted)',
            margin: 0,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
          }}>
            {world.description}
          </p>
        )}

        {/* Empty state hint */}
        {!world.quote && !world.description && (
          <p style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontStyle: 'italic',
            fontSize: 13,
            color: 'var(--subtle)',
            margin: 0,
          }}>
            Een leeg kosmos wacht.
          </p>
        )}
      </div>
    </article>
  )
}

// ── Forge a World placeholder card ──────────────────────────

interface ForgeCardProps {
  onClick: () => void
  loading?: boolean
}

export function ForgeWorldCard({ onClick, loading }: ForgeCardProps) {
  return (
    <article
      role="button"
      tabIndex={0}
      aria-label="Creëer een nieuwe wereld"
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
      style={{
        position: 'relative',
        height: 520,
        borderRadius: 'var(--r-xl)',
        border: '1px dashed var(--hairline-strong)',
        overflow: 'hidden',
        cursor: loading ? 'wait' : 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        background: 'transparent',
        transition: 'border-color var(--t-base) var(--ease-out), background var(--t-base) var(--ease-out)',
        outline: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--gold)'
        e.currentTarget.style.background = 'rgba(245,200,66,0.03)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--hairline-strong)'
        e.currentTarget.style.background = 'transparent'
      }}
      onFocus={(e) => { e.currentTarget.style.outline = '2px solid var(--violet)'; e.currentTarget.style.outlineOffset = '2px' }}
      onBlur={(e) => { e.currentTarget.style.outline = 'none' }}
    >
      <CompassRose size={80} opacity={0.65} />
      <div style={{ textAlign: 'center' }}>
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: 15,
          fontWeight: 600,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--gold)',
          margin: '0 0 6px',
        }}>
          {loading ? 'Aanmaken...' : 'Nieuwe wereld'}
        </p>
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
          Een leeg kosmos wacht.
        </p>
      </div>
    </article>
  )
}

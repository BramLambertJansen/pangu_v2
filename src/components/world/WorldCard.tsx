import { useNavigate } from 'react-router-dom'
import type { World } from '@/types/world.types'

interface Props {
  world: World
}

const statusStyle: Record<string, { color: string; border: string; bg: string; label: string }> = {
  draft:    { color: 'var(--muted)',   border: 'var(--hairline)',                      bg: 'rgba(80,76,100,0.18)',  label: 'Concept'       },
  active:   { color: 'var(--teal)',    border: 'rgba(62,207,178,0.3)',                 bg: 'rgba(62,207,178,0.08)', label: 'Actief'        },
  archived: { color: 'var(--gold)',    border: 'rgba(245,200,66,0.3)',                 bg: 'rgba(245,200,66,0.08)', label: 'Gearchiveerd'  },
}

export function WorldCard({ world }: Props) {
  const navigate = useNavigate()
  const st = statusStyle[world.status] ?? statusStyle.draft

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Wereld: ${world.name}`}
      onClick={() => navigate(`/worlds/${world.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          navigate(`/worlds/${world.id}`)
        }
      }}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 'var(--r-lg)',
        border: '1px solid var(--hairline)',
        minHeight: '200px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        transition: 'border-color var(--t-base) var(--ease-out), box-shadow var(--t-base) var(--ease-out), transform var(--t-base) var(--ease-out)',
        outline: 'none',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget
        el.style.borderColor = 'var(--hairline-strong)'
        el.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px var(--hairline-strong)'
        el.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget
        el.style.borderColor = 'var(--hairline)'
        el.style.boxShadow = 'none'
        el.style.transform = 'translateY(0)'
      }}
      onFocus={(e) => {
        e.currentTarget.style.outline = '2px solid var(--violet)'
        e.currentTarget.style.outlineOffset = '2px'
      }}
      onBlur={(e) => {
        e.currentTarget.style.outline = 'none'
      }}
    >
      {/* Background */}
      {world.header_image ? (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${world.header_image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      ) : (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, var(--surface-2) 0%, var(--surface) 100%)',
          }}
        />
      )}

      {/* Decorative violet glow top-right */}
      {!world.header_image && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', top: -20, right: -20,
            width: 120, height: 120,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(155,138,255,0.12), transparent 70%)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Dark overlay */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0,
          background: world.header_image
            ? 'linear-gradient(to top, rgba(10,10,20,0.95) 0%, rgba(10,10,20,0.5) 55%, rgba(10,10,20,0.15) 100%)'
            : 'linear-gradient(to top, rgba(10,10,20,0.7) 0%, transparent 60%)',
        }}
      />

      {/* Content */}
      <div style={{ position: 'relative', padding: '20px 20px 18px' }}>
        {/* Status badge */}
        <div style={{ marginBottom: 8 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '2px 10px',
            borderRadius: 'var(--r-full)',
            border: `1px solid ${st.border}`,
            background: st.bg,
            color: st.color,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            fontFamily: 'var(--font-body)',
          }}>
            {st.label}
          </span>
        </div>

        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 17,
          fontWeight: 600,
          letterSpacing: '0.06em',
          color: 'var(--ink)',
          margin: 0,
          lineHeight: 1.25,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}>
          {world.name}
        </h2>

        {world.subtitle && (
          <p style={{
            marginTop: 4,
            fontSize: 13,
            color: 'var(--muted)',
            lineHeight: 1.4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {world.subtitle}
          </p>
        )}
      </div>
    </article>
  )
}

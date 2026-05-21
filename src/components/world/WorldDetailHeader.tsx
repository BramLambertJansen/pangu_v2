import type { World, WorldStatus } from '@/types/world.types'

const cardGradients = [
  'radial-gradient(ellipse 70% 55% at 30% 40%, rgba(155,138,255,0.55) 0%, rgba(80,50,200,0.28) 45%, var(--void) 78%)',
  'radial-gradient(ellipse 65% 52% at 28% 42%, rgba(220,90,80,0.4) 0%, rgba(155,138,255,0.22) 50%, var(--void) 78%)',
  'radial-gradient(ellipse 65% 52% at 30% 42%, rgba(62,207,178,0.32) 0%, rgba(60,80,200,0.28) 50%, var(--void) 78%)',
  'radial-gradient(ellipse 65% 50% at 25% 40%, rgba(245,180,50,0.28) 0%, rgba(155,138,255,0.32) 50%, var(--void) 78%)',
]

function pickGradient(id: string): string {
  const code = (id.charCodeAt(0) ?? 0) + (id.charCodeAt(id.length - 1) ?? 0)
  return cardGradients[code % cardGradients.length]
}

const statusLabel: Record<WorldStatus, string> = {
  draft: 'Concept',
  active: 'Actief',
  archived: 'Gearchiveerd',
}

function formatLastVisited(iso: string): string {
  const date = new Date(iso)
  const today = new Date()
  if (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  ) {
    return 'Vandaag'
  }
  return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface Props {
  world: World
}

export function WorldDetailHeader({ world }: Props) {
  const initial = world.name.trim()[0]?.toUpperCase() ?? '?'
  const gradient = world.header_image ? undefined : pickGradient(world.id)

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 'var(--r-xl)',
        border: '1px solid var(--hairline)',
        overflow: 'hidden',
        minHeight: 520,
        display: 'flex',
        alignItems: 'stretch',
      }}
    >
      {/* Full-bleed background */}
      {world.header_image ? (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${world.header_image})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
          }}
        />
      ) : (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0,
            background: `${gradient}, var(--void)`,
          }}
        />
      )}

      {/* Watermark initial — anchored left */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '50%', left: '3%',
          transform: 'translateY(-50%)',
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(140px, 22vw, 220px)',
          fontWeight: 600,
          color: 'var(--ink)',
          opacity: 0.06,
          lineHeight: 1,
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        {initial}
      </div>

      {/* Scrim: transparent left → dark right */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, transparent 15%, rgba(10,10,20,0.72) 48%, rgba(10,10,20,0.97) 72%)',
        }}
      />
      {/* Scrim: subtle bottom vignette */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(10,10,20,0.55) 0%, transparent 40%)',
        }}
      />

      {/* Content — right side, full height */}
      <div style={{
        position: 'relative',
        marginLeft: 'auto',
        width: '62%',
        padding: 'clamp(32px, 4vw, 52px) clamp(28px, 4vw, 52px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 0,
      }}>
        {/* Subtitle + status badge */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
          {world.subtitle ? (
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 10, fontWeight: 700,
              letterSpacing: '0.28em', textTransform: 'uppercase',
              color: 'var(--gold)',
              margin: 0,
            }}>
              {world.subtitle}
            </p>
          ) : <span />}
          <span style={{
            flexShrink: 0,
            display: 'inline-flex', alignItems: 'center',
            padding: '4px 10px',
            background: 'rgba(245,200,66,0.12)',
            border: '1px solid rgba(245,200,66,0.3)',
            borderRadius: 'var(--r-full)',
            fontFamily: 'var(--font-body)',
            fontSize: 10, fontWeight: 700,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: 'var(--gold)',
          }}>
            {statusLabel[world.status]}
          </span>
        </div>

        {/* World name */}
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(40px, 6vw, 82px)',
          fontWeight: 600,
          lineHeight: 0.95,
          letterSpacing: '0.04em',
          color: 'var(--ink)',
          margin: '0 0 20px',
          textTransform: 'uppercase',
        }}>
          {world.name}
        </h1>

        {/* Quote */}
        {world.quote && (
          <p style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontStyle: 'italic',
            fontSize: 18,
            lineHeight: 1.55,
            color: 'var(--gold)',
            margin: '0 0 16px',
          }}>
            "{world.quote}"
          </p>
        )}

        {/* Description */}
        {world.description && (
          <p style={{
            fontSize: 14,
            lineHeight: 1.7,
            color: 'var(--ink-soft)',
            margin: '0 0 28px',
          }}>
            {world.description}
          </p>
        )}

        {/* Stats */}
        <div style={{
          display: 'flex',
          gap: 'clamp(16px, 3vw, 32px)',
          flexWrap: 'wrap',
          marginBottom: 32,
          paddingBottom: 28,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          {[
            { label: 'Kronieken', value: 0 },
            { label: 'Locaties', value: 0 },
            { label: 'Personages', value: 0 },
            { label: 'Bijgewerkt', value: formatLastVisited(world.updated_at) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: 9, fontWeight: 700,
                letterSpacing: '0.24em', textTransform: 'uppercase',
                color: 'var(--muted)',
                margin: '0 0 4px',
              }}>
                {label}
              </p>
              <p style={{
                fontFamily: 'var(--font-display)',
                fontSize: typeof value === 'number' ? 28 : 15,
                fontWeight: 600,
                color: typeof value === 'string' ? 'var(--gold)' : 'var(--ink)',
                margin: 0,
                letterSpacing: typeof value === 'number' ? '0.02em' : '0.06em',
              }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="pangu-btn pangu-btn-primary"
            aria-label={`Nieuwe kroniek aanmaken in ${world.name}`}
          >
            + Nieuwe kroniek
          </button>
          <button
            type="button"
            className="pangu-btn pangu-btn-gold"
            aria-label="Lore Forge — AI lore genereren"
          >
            ✦ Lore Forge
          </button>
        </div>
      </div>
    </div>
  )
}

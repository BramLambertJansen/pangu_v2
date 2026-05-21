import type { World, WorldStatus } from '@/types/world.types'

const cardGradients = [
  'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(155,138,255,0.5) 0%, rgba(80,50,200,0.25) 50%, transparent 80%)',
  'radial-gradient(ellipse 75% 60% at 50% 40%, rgba(220,90,80,0.38) 0%, rgba(155,138,255,0.2) 55%, transparent 80%)',
  'radial-gradient(ellipse 75% 60% at 50% 40%, rgba(62,207,178,0.3) 0%, rgba(60,80,200,0.25) 55%, transparent 80%)',
  'radial-gradient(ellipse 75% 58% at 50% 40%, rgba(245,180,50,0.26) 0%, rgba(155,138,255,0.3) 55%, transparent 80%)',
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
        minHeight: 560,
        display: 'flex',
        flexDirection: 'column',
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

      {/* Watermark initial — centered */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(160px, 26vw, 260px)',
          fontWeight: 600,
          color: 'var(--ink)',
          opacity: 0.05,
          lineHeight: 1,
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        {initial}
      </div>

      {/* Scrim top — dark zone for badge readability */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(10,10,20,0.72) 0%, rgba(10,10,20,0.18) 28%, transparent 45%)',
        }}
      />

      {/* Scrim bottom — dark zone for content readability */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(10,10,20,0.97) 0%, rgba(10,10,20,0.82) 28%, rgba(10,10,20,0.3) 52%, transparent 68%)',
        }}
      />

      {/* Content */}
      <div style={{
        position: 'relative',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: 'clamp(24px, 3.5vw, 40px) clamp(28px, 4vw, 52px)',
      }}>

        {/* TOP: subtitle + badge, centered + hairline */}
        <div style={{
          textAlign: 'center',
          paddingBottom: 20,
          marginBottom: 24,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          {world.subtitle && (
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 10, fontWeight: 700,
              letterSpacing: '0.3em', textTransform: 'uppercase',
              color: 'var(--gold)',
              margin: '0 0 10px',
            }}>
              {world.subtitle}
            </p>
          )}
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '4px 12px',
            background: 'rgba(245,200,66,0.12)',
            border: '1px solid rgba(245,200,66,0.3)',
            borderRadius: 'var(--r-full)',
            fontFamily: 'var(--font-body)',
            fontSize: 10, fontWeight: 700,
            letterSpacing: '0.2em', textTransform: 'uppercase',
            color: 'var(--gold)',
          }}>
            {statusLabel[world.status]}
          </span>
        </div>

        {/* MIDDLE: title + quote + description — grows to fill space */}
        <div style={{ flex: 1 }}>
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

          {world.quote && (
            <p style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic',
              fontSize: 18,
              lineHeight: 1.55,
              color: 'var(--gold)',
              margin: '0 0 14px',
            }}>
              "{world.quote}"
            </p>
          )}

          {world.description && (
            <p style={{
              fontSize: 14,
              lineHeight: 1.7,
              color: 'var(--ink-soft)',
              margin: 0,
              maxWidth: 620,
            }}>
              {world.description}
            </p>
          )}
        </div>

        {/* BOTTOM: stats + hairline + buttons */}
        <div style={{ marginTop: 32 }}>
          {/* Stats */}
          <div style={{
            display: 'flex',
            gap: 'clamp(16px, 3vw, 36px)',
            flexWrap: 'wrap',
            marginBottom: 20,
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
                  fontSize: typeof value === 'number' ? 26 : 14,
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

          {/* Hairline */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 20 }} aria-hidden="true" />

          {/* Buttons */}
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
    </div>
  )
}

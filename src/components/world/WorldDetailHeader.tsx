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

      {/* Mobile scrim — cinematic fade, solid at bottom for text legibility */}
      <div
        aria-hidden="true"
        className="md:hidden"
        style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: 'linear-gradient(to top, var(--void) 0%, rgba(10,10,22,0.97) 20%, rgba(10,10,22,0.72) 40%, rgba(10,10,22,0.18) 62%, transparent 82%)',
        }}
      />

      {/* ── MOBILE LAYOUT ── */}
      <div
        className="md:hidden"
        style={{
          position: 'relative', zIndex: 2,
          minHeight: 520,
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Watermark — centered in upper half */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '8%', left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(120px, 38vw, 180px)',
            fontWeight: 600,
            color: 'var(--ink)', opacity: 0.09,
            lineHeight: 1, userSelect: 'none', pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {initial}
        </div>

        {/* Status badge — top right */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 20px 0' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '4px 12px',
            background: 'var(--gold)',
            borderRadius: 'var(--r-full)',
            fontFamily: 'var(--font-body)',
            fontSize: 10, fontWeight: 700,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            color: 'var(--void)',
          }}>
            {statusLabel[world.status]}
          </span>
        </div>

        {/* Spacer — pushes content to bottom */}
        <div style={{ flex: 1 }} />

        {/* Content floats on the scrim — no hard panel edge */}
        <div style={{ padding: '0 24px 28px' }}>
          {world.subtitle && (
            <p style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic',
              fontSize: 13, letterSpacing: '0.03em',
              color: 'var(--gold)',
              margin: '0 0 10px',
            }}>
              {world.subtitle}
            </p>
          )}

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(40px, 12vw, 56px)',
            fontWeight: 600, lineHeight: 0.92,
            letterSpacing: '0.04em', textTransform: 'uppercase',
            color: 'var(--ink)',
            margin: '0 0 14px',
          }}>
            {world.name}
          </h1>

          {world.quote && (
            <p style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic',
              fontSize: 15, lineHeight: 1.55,
              color: 'var(--ink-soft)',
              margin: '0 0 18px',
            }}>
              "{world.quote}"
            </p>
          )}

          {/* Buttons — stacked full-width, no overflow risk */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              type="button"
              className="pangu-btn pangu-btn-primary"
              style={{ width: '100%' }}
              aria-label={`Nieuwe kroniek aanmaken in ${world.name}`}
            >
              + Nieuwe kroniek
            </button>
            <button
              type="button"
              className="pangu-btn pangu-btn-gold"
              style={{ width: '100%' }}
              aria-label="Lore Forge — AI lore genereren"
            >
              ✦ Lore Forge
            </button>
          </div>
        </div>
      </div>

      {/* ── DESKTOP LAYOUT ── */}
      <div
        className="hidden md:flex md:items-stretch"
        style={{ padding: 16, minHeight: 420 }}
      >
        {/* Watermark — left side, positioned relative to outer container */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '50%', left: '2%',
            transform: 'translateY(-55%)',
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(140px, 22vw, 220px)',
            fontWeight: 600,
            color: 'var(--ink)', opacity: 0.07,
            lineHeight: 1, userSelect: 'none', pointerEvents: 'none',
          }}
        >
          {initial}
        </div>

        {/* Left spacer — image shows through freely */}
        <div style={{ flex: '0 0 38%' }} aria-hidden="true" />

        {/* Glass card — right side, full height */}
        <div
          style={{
            position: 'relative', flex: 1,
            background: 'rgba(10, 10, 22, 0.14)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 'var(--r-lg)',
            padding: 'clamp(20px, 3vw, 32px)',
            display: 'flex', flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          {/* Top: subtitle · hairline · badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
            {world.subtitle ? (
              <p style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontStyle: 'italic',
                fontSize: 14, letterSpacing: '0.03em',
                color: 'var(--gold)',
                margin: 0, whiteSpace: 'nowrap',
              }}>
                {world.subtitle}
              </p>
            ) : null}
            <div style={{ flex: 1, height: 1, background: 'var(--hairline-strong)' }} aria-hidden="true" />
            <span style={{
              flexShrink: 0,
              display: 'inline-flex', alignItems: 'center',
              padding: '4px 12px',
              background: 'var(--gold)',
              borderRadius: 'var(--r-full)',
              fontFamily: 'var(--font-body)',
              fontSize: 10, fontWeight: 700,
              letterSpacing: '0.16em', textTransform: 'uppercase',
              color: 'var(--void)',
            }}>
              {statusLabel[world.status]}
            </span>
          </div>

          {/* Middle: title + quote + description */}
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(44px, 6.5vw, 88px)',
              fontWeight: 600, lineHeight: 0.92,
              letterSpacing: '0.04em', textTransform: 'uppercase',
              color: 'var(--ink)',
              margin: '0 0 16px',
            }}>
              {world.name}
            </h1>

            {world.quote && (
              <p style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontStyle: 'italic',
                fontSize: 17, lineHeight: 1.55,
                color: 'var(--ink-soft)',
                margin: '0 0 10px',
              }}>
                "{world.quote}"
              </p>
            )}

            {world.description && (
              <p style={{
                fontSize: 13, lineHeight: 1.7,
                color: 'var(--muted)',
                margin: 0,
              }}>
                {world.description}
              </p>
            )}
          </div>

          {/* Bottom: buttons right-aligned */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: 24 }}>
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

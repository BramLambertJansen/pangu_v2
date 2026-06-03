import type { World, WorldStatus } from '@/types/world.types'
import { sanitizeImageUrl } from '@/utils/sanitizeUrl'
import { Button } from '@/components/ui/Button'

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

const scrimGradient =
  'linear-gradient(to top, var(--void) 0%, rgba(10,10,22,0.97) 20%, rgba(10,10,22,0.72) 40%, rgba(10,10,22,0.18) 62%, transparent 82%)'

interface Props {
  world: World
  onCreateCampaign?: () => void
  isCreatingCampaign?: boolean
  onLoreForge?: () => void
}

export function WorldDetailHeader({ world, onCreateCampaign, isCreatingCampaign, onLoreForge }: Props) {
  const initial = world.name.trim()[0]?.toUpperCase() ?? '?'
  const gradient = world.header_image ? undefined : pickGradient(world.id)

  const badge = (
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
  )

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
      {sanitizeImageUrl(world.header_image) ? (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${sanitizeImageUrl(world.header_image)})`,
            backgroundSize: 'cover',
            backgroundPosition: world.header_image_position ?? 'center',
          }}
        />
      ) : (
        <div
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, background: `${gradient}, var(--void)` }}
        />
      )}

      {/* Shared scrim — bottom-to-top on both mobile and desktop */}
      <div
        aria-hidden="true"
        className="wdh-scrim"
        style={{ background: scrimGradient }}
      />

      {/* ── MOBILE LAYOUT ── */}
      <div className="wdh-mobile">
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

        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 20px 0' }}>
          {badge}
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ padding: '0 24px 28px' }}>
          {world.subtitle && (
            <p style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic',
              fontSize: 13, letterSpacing: '0.03em',
              color: 'var(--gold)', margin: '0 0 10px',
            }}>
              {world.subtitle}
            </p>
          )}
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(24px, 6.5vw, 34px)',
            fontWeight: 600, lineHeight: 0.92,
            letterSpacing: '0.04em', textTransform: 'uppercase',
            color: 'var(--ink)', margin: '0 0 14px',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            maxWidth: '100%',
          }}>
            {world.name}
          </h1>
          {world.quote && (
            <p style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic',
              fontSize: 15, lineHeight: 1.55,
              color: 'var(--ink-soft)', margin: '0 0 10px',
            }}>
              "{world.quote}"
            </p>
          )}
          {world.description && (
            <p style={{
              fontSize: 13, lineHeight: 1.7,
              color: 'var(--muted)', margin: '0 0 18px',
            }}>
              {world.description}
            </p>
          )}
          <div className="wdh-btns">
            <Button variant="primary" aria-label={`Nieuwe kroniek aanmaken in ${world.name}`} onClick={onCreateCampaign} disabled={isCreatingCampaign}>
              {isCreatingCampaign ? 'Aanmaken...' : '+ Nieuwe kroniek'}
            </Button>
            <Button variant="gold" aria-label="Lore Forge — AI lore genereren" onClick={onLoreForge}>
              ✦ Lore Forge
            </Button>
          </div>
        </div>
      </div>

      {/* ── DESKTOP LAYOUT — same bottom-anchor approach, wider proportions ── */}
      <div className="wdh-desktop">
        {/* Watermark — centered */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '8%', left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(180px, 26vw, 320px)',
            fontWeight: 600,
            color: 'var(--ink)', opacity: 0.09,
            lineHeight: 1, userSelect: 'none', pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {initial}
        </div>

        {/* Status badge — top right */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '20px 28px 0' }}>
          {badge}
        </div>

        <div style={{ flex: 1 }} />

        {/* Content at bottom */}
        <div style={{ padding: '0 clamp(28px, 4vw, 52px) 40px' }}>
          {world.subtitle && (
            <p style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic',
              fontSize: 15, letterSpacing: '0.03em',
              color: 'var(--gold)', margin: '0 0 12px',
            }}>
              {world.subtitle}
            </p>
          )}

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(44px, 5.5vw, 80px)',
            fontWeight: 600, lineHeight: 0.92,
            letterSpacing: '0.04em', textTransform: 'uppercase',
            color: 'var(--ink)', margin: '0 0 18px',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {world.name}
          </h1>

          {/* Quote + description left, buttons right */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 32 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {world.quote && (
                <p style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontStyle: 'italic',
                  fontSize: 18, lineHeight: 1.55,
                  color: 'var(--ink-soft)', margin: '0 0 10px',
                }}>
                  "{world.quote}"
                </p>
              )}
              {world.description && (
                <p style={{
                  fontSize: 13, lineHeight: 1.7,
                  color: 'var(--muted)', margin: 0,
                }}>
                  {world.description}
                </p>
              )}
            </div>
            <div style={{ flexShrink: 0, display: 'flex', gap: 10 }}>
              <Button variant="primary" aria-label={`Nieuwe kroniek aanmaken in ${world.name}`} onClick={onCreateCampaign} disabled={isCreatingCampaign}>
                {isCreatingCampaign ? 'Aanmaken...' : '+ Nieuwe kroniek'}
              </Button>
              <Button variant="gold" aria-label="Lore Forge — AI lore genereren" onClick={onLoreForge}>
                ✦ Lore Forge
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

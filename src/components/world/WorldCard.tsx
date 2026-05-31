import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { World } from '@/types/world.types'
import type { Campaign } from '@/types/campaign.types'
import { CompassRose } from '@/components/world/CompassRose'
import { EntityCard } from '@/components/ui/EntityCard'
import { ForgeCard } from '@/components/ui/ForgeCard'
import { pickGradient, coverGradients } from '@/utils/pickGradient'
import { sanitizeImageUrl } from '@/utils/sanitizeUrl'

interface Props {
  world: World
  campaigns?: Pick<Campaign, 'id' | 'name'>[]
}

export const WorldCard = memo(function WorldCard({ world, campaigns }: Props) {
  const navigate = useNavigate()
  const initial = world.name.trim()[0]?.toUpperCase() ?? '?'
  const gradient = world.header_image ? undefined : pickGradient(world.id, coverGradients)

  return (
    <EntityCard
      variant="hero"
      ariaLabel={`Wereld: ${world.name}`}
      onClick={() => navigate(`/worlds/${world.id}`)}
    >
      {/* Background */}
      {sanitizeImageUrl(world.header_image) ? (
        <img
          src={sanitizeImageUrl(world.header_image)}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            objectPosition: world.header_image_position ?? 'center',
            display: 'block',
          }}
        />
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

        {world.quote && (
          <p style={{
            fontFamily: 'var(--font-quote)',
            fontStyle: 'italic',
            fontSize: 14,
            lineHeight: 1.5,
            color: 'var(--ink-soft)',
            margin: 0,
          }}>
            "{world.quote}"
          </p>
        )}

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

        {!world.quote && !world.description && (
          <p style={{
            fontFamily: 'var(--font-quote)',
            fontStyle: 'italic',
            fontSize: 13,
            color: 'var(--subtle)',
            margin: 0,
          }}>
            Een leeg kosmos wacht.
          </p>
        )}

        {/* Active chronicles section */}
        <div style={{
          width: '100%',
          marginTop: 4,
          paddingTop: 14,
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            marginBottom: 10,
            textAlign: 'center',
          }}>
            Actieve kronieken
          </div>

          {campaigns && campaigns.length > 0 ? (
            <>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {campaigns.slice(0, 3).map(c => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); navigate(`/campaigns/${c.id}`) }}
                    onKeyDown={e => e.stopPropagation()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      width: '100%',
                      background: 'none',
                      border: 'none',
                      padding: '4px 6px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background var(--t-fast)',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none' }}
                    aria-label={`Naar kroniek: ${c.name}`}
                  >
                    <span aria-hidden="true" style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: 'var(--violet)',
                      flexShrink: 0,
                      boxShadow: '0 0 6px var(--violet)',
                    }} />
                    <span style={{
                      flex: 1,
                      fontSize: 12,
                      color: 'var(--ink-soft)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {c.name}
                    </span>
                    <span aria-hidden="true" style={{ fontSize: 11, color: 'var(--muted)', flexShrink: 0 }}>›</span>
                  </button>
                </li>
              ))}
            </ul>
            {campaigns.length > 3 && (
              <p style={{ fontSize: 11, color: 'var(--muted)', margin: '6px 0 0', textAlign: 'center' }}>
                +{campaigns.length - 3} meer
              </p>
            )}
            </>
          ) : (
            <p style={{
              fontFamily: 'var(--font-quote)',
              fontStyle: 'italic',
              fontSize: 12,
              color: 'var(--subtle)',
              margin: 0,
              textAlign: 'center',
            }}>
              Leeg. Begin waar je wil.
            </p>
          )}
        </div>
      </div>
    </EntityCard>
  )
})

interface ForgeCardProps {
  onClick: () => void
  loading?: boolean
}

export const ForgeWorldCard = memo(function ForgeWorldCard({ onClick, loading }: ForgeCardProps) {
  return (
    <ForgeCard
      variant="hero"
      accent="gold"
      onClick={onClick}
      loading={loading}
      ariaLabel="Creëer een nieuwe wereld"
      title="Nieuwe wereld"
      subtitle="Een leeg kosmos wacht."
      icon={<CompassRose size={80} opacity={0.65} />}
    />
  )
})

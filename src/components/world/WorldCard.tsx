import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { World } from '@/types/world.types'
import { CompassRose } from '@/components/world/CompassRose'
import { EntityCard } from '@/components/ui/EntityCard'
import { ForgeCard } from '@/components/ui/ForgeCard'
import { pickGradient, coverGradients } from '@/utils/pickGradient'
import { sanitizeImageUrl } from '@/utils/sanitizeUrl'

interface Props {
  world: World
}

export const WorldCard = memo(function WorldCard({ world }: Props) {
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

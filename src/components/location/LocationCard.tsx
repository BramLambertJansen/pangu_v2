import { useNavigate } from 'react-router-dom'
import type { Location } from '@/types/location.types'
import { EntityCard } from '@/components/ui/EntityCard'
import { ForgeCard } from '@/components/ui/ForgeCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { pickGradient, locationGradients } from '@/utils/pickGradient'
import { locationStatusLabel, locationStatusColor } from '@/lib/statusMaps'

interface Props {
  location: Location
}

export function LocationCard({ location }: Props) {
  const navigate = useNavigate()
  const gradient = pickGradient(location.id, locationGradients)

  return (
    <EntityCard
      variant="compact"
      ariaLabel={`Locatie: ${location.name}`}
      onClick={() => navigate(`/locations/${location.id}`)}
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
            {location.subtitle && (
              <p style={{
                fontFamily: 'var(--font-quote)',
                fontStyle: 'italic',
                fontSize: 11, letterSpacing: '0.03em',
                color: 'var(--gold)', margin: '0 0 2px',
              }}>
                {location.subtitle}
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
              {location.name}
            </h2>
          </div>

          <StatusBadge
            label={locationStatusLabel[location.status]}
            color={locationStatusColor[location.status]}
            className="mt-0.5"
          />
        </div>

        {location.location_type && (
          <p style={{
            fontSize: 11, fontWeight: 700,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'var(--teal)', margin: 0,
            fontFamily: 'var(--font-body)',
          }}>
            {location.location_type}
          </p>
        )}

        {location.description && (
          <p style={{
            fontSize: 13, lineHeight: 1.65,
            color: 'var(--muted)', margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {location.description}
          </p>
        )}

        {!location.description && !location.subtitle && !location.location_type && (
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, fontStyle: 'italic' }}>
            Een nieuwe locatie wacht op ontdekking.
          </p>
        )}
      </div>
    </EntityCard>
  )
}

interface ForgeProps {
  onClick: () => void
  loading?: boolean
}

export function ForgeLocationCard({ onClick, loading }: ForgeProps) {
  return (
    <ForgeCard
      variant="compact"
      accent="teal"
      onClick={onClick}
      loading={loading}
      ariaLabel="Nieuwe locatie aanmaken"
      title="+ Locatie toevoegen"
      subtitle="Voeg een nieuwe locatie toe"
      icon={
        <svg
          aria-hidden="true"
          width="20" height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--teal)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ opacity: 0.7 }}
        >
          <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      }
    />
  )
}

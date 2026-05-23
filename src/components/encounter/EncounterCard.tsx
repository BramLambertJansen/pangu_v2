import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Encounter } from '@/types/encounter.types'
import { EntityCard } from '@/components/ui/EntityCard'
import { ForgeCard } from '@/components/ui/ForgeCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { pickGradient, encounterGradients } from '@/utils/pickGradient'
import { encounterStatusLabel, encounterStatusColor } from '@/lib/statusMaps'

interface Props {
  encounter: Encounter
}

export const EncounterCard = memo(function EncounterCard({ encounter }: Props) {
  const navigate = useNavigate()
  const gradient = pickGradient(encounter.id, encounterGradients)

  return (
    <EntityCard
      variant="compact"
      ariaLabel={`Gevecht: ${encounter.name}`}
      onClick={() => navigate(`/encounters/${encounter.id}`)}
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
            {encounter.subtitle && (
              <p style={{
                fontFamily: 'var(--font-quote)',
                fontStyle: 'italic',
                fontSize: 11, letterSpacing: '0.03em',
                color: 'var(--crimson)', margin: '0 0 2px',
              }}>
                {encounter.subtitle}
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
              {encounter.name}
            </h2>
          </div>

          <StatusBadge
            label={encounterStatusLabel[encounter.status]}
            color={encounterStatusColor[encounter.status]}
            className="mt-0.5"
          />
        </div>

        {(encounter.difficulty || encounter.environment) && (
          <p style={{
            fontSize: 11, fontWeight: 700,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'var(--crimson)', margin: 0,
            fontFamily: 'var(--font-body)',
          }}>
            {[encounter.difficulty, encounter.environment].filter(Boolean).join(' · ')}
          </p>
        )}

        {encounter.description && (
          <p style={{
            fontSize: 13, lineHeight: 1.65,
            color: 'var(--muted)', margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {encounter.description}
          </p>
        )}

        {!encounter.description && !encounter.subtitle && !encounter.difficulty && !encounter.environment && (
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, fontStyle: 'italic' }}>
            Een confrontatie wacht zijn moment.
          </p>
        )}
      </div>
    </EntityCard>
  )
})

interface ForgeProps {
  onClick: () => void
  loading?: boolean
}

export const ForgeEncounterCard = memo(function ForgeEncounterCard({ onClick, loading }: ForgeProps) {
  return (
    <ForgeCard
      variant="compact"
      accent="crimson"
      onClick={onClick}
      loading={loading}
      ariaLabel="Nieuw gevecht aanmaken"
      title="+ Gevecht toevoegen"
      subtitle="Plan een nieuw gevecht"
      icon={
        <svg
          aria-hidden="true"
          width="20" height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--crimson)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ opacity: 0.7 }}
        >
          <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
          <path d="M13 19l6-6" />
          <path d="M16 16l4 4" />
          <path d="M19 21l2-2" />
          <path d="M3 21l3.5-3.5" />
          <path d="M6.5 21L7 20" />
          <path d="M10 14L3.5 20.5" />
        </svg>
      }
    />
  )
})

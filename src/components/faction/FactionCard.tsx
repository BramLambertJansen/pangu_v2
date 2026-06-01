import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Faction } from '@/types/faction.types'
import { EntityCard } from '@/components/ui/EntityCard'
import { ForgeCard } from '@/components/ui/ForgeCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { pickGradient, factionGradients } from '@/utils/pickGradient'
import { factionStatusLabel, factionStatusColor, factionTypeLabel, factionReputationLabel, factionReputationColor } from '@/lib/statusMaps'

interface Props {
  faction: Faction
}

export const FactionCard = memo(function FactionCard({ faction }: Props) {
  const navigate = useNavigate()
  const gradient = pickGradient(faction.id, factionGradients)

  return (
    <EntityCard
      variant="compact"
      ariaLabel={`Factie: ${faction.name}`}
      onClick={() => navigate(`/factions/${faction.id}`)}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0,
          background: gradient,
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            {faction.subtitle && (
              <p style={{
                fontFamily: 'var(--font-quote)',
                fontStyle: 'italic',
                fontSize: 11, letterSpacing: '0.03em',
                color: 'var(--gold)', margin: '0 0 2px',
              }}>
                {faction.subtitle}
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
              {faction.name}
            </h2>
          </div>

          <StatusBadge
            label={factionStatusLabel[faction.status]}
            color={factionStatusColor[faction.status]}
            className="mt-0.5"
          />
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {faction.type && (
            <span style={{
              fontSize: 10, fontWeight: 700,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'var(--crimson)',
              fontFamily: 'var(--font-body)',
            }}>
              {factionTypeLabel[faction.type]}
            </span>
          )}
          <span style={{
            fontSize: 10, fontWeight: 700,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: factionReputationColor[faction.reputation],
            fontFamily: 'var(--font-body)',
          }}>
            {factionReputationLabel[faction.reputation]}
          </span>
        </div>

        {faction.motto && (
          <p style={{
            fontFamily: 'var(--font-quote)',
            fontStyle: 'italic',
            fontSize: 12, lineHeight: 1.5,
            color: 'var(--ink-soft)', margin: 0,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
            &ldquo;{faction.motto}&rdquo;
          </p>
        )}

        {!faction.motto && faction.description && (
          <p style={{
            fontSize: 13, lineHeight: 1.65,
            color: 'var(--muted)', margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {faction.description}
          </p>
        )}

        {!faction.motto && !faction.description && (
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, fontStyle: 'italic' }}>
            Een organisatie wacht op haar verhaal.
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

export const ForgeFactionCard = memo(function ForgeFactionCard({ onClick, loading }: ForgeProps) {
  return (
    <ForgeCard
      variant="compact"
      accent="crimson"
      onClick={onClick}
      loading={loading}
      ariaLabel="Nieuwe factie aanmaken"
      title="+ Factie toevoegen"
      subtitle="Voeg een nieuwe organisatie toe"
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
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      }
    />
  )
})

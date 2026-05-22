import { useNavigate } from 'react-router-dom'
import type { Lore } from '@/types/lore.types'
import { EntityCard } from '@/components/ui/EntityCard'
import { ForgeCard } from '@/components/ui/ForgeCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { pickGradient, loreGradients } from '@/utils/pickGradient'
import { loreStatusLabel, loreStatusColor } from '@/lib/statusMaps'

interface Props {
  lore: Lore
}

export function LoreCard({ lore }: Props) {
  const navigate = useNavigate()
  const gradient = pickGradient(lore.id, loreGradients)

  return (
    <EntityCard
      variant="compact"
      ariaLabel={`Lore: ${lore.name}`}
      onClick={() => navigate(`/lore/${lore.id}`)}
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
            {lore.subtitle && (
              <p style={{
                fontFamily: 'var(--font-quote)',
                fontStyle: 'italic',
                fontSize: 11, letterSpacing: '0.03em',
                color: 'var(--gold)', margin: '0 0 2px',
              }}>
                {lore.subtitle}
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
              {lore.name}
            </h2>
          </div>

          <StatusBadge
            label={loreStatusLabel[lore.status]}
            color={loreStatusColor[lore.status]}
            className="mt-0.5"
          />
        </div>

        {lore.lore_category && (
          <p style={{
            fontSize: 11, fontWeight: 700,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'var(--violet)', margin: 0,
            fontFamily: 'var(--font-body)',
          }}>
            {lore.lore_category}
          </p>
        )}

        {lore.description && (
          <p style={{
            fontSize: 13, lineHeight: 1.65,
            color: 'var(--muted)', margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {lore.description}
          </p>
        )}

        {!lore.description && !lore.subtitle && !lore.lore_category && (
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, fontStyle: 'italic' }}>
            Een nieuw verhaal wacht om verteld te worden.
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

export function ForgeLoreCard({ onClick, loading }: ForgeProps) {
  return (
    <ForgeCard
      variant="compact"
      accent="teal"
      onClick={onClick}
      loading={loading}
      ariaLabel="Nieuwe lore aanmaken"
      title="+ Lore toevoegen"
      subtitle="Voeg een nieuw lore-item toe"
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
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      }
    />
  )
}

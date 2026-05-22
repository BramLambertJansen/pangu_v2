import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Npc } from '@/types/npc.types'
import { EntityCard } from '@/components/ui/EntityCard'
import { ForgeCard } from '@/components/ui/ForgeCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { pickGradient, npcGradients } from '@/utils/pickGradient'
import { npcStatusLabel, npcStatusColor } from '@/lib/statusMaps'

interface Props {
  npc: Npc
}

export const NpcCard = memo(function NpcCard({ npc }: Props) {
  const navigate = useNavigate()
  const gradient = pickGradient(npc.id, npcGradients)

  return (
    <EntityCard
      variant="compact"
      ariaLabel={`NPC: ${npc.name}`}
      onClick={() => navigate(`/npcs/${npc.id}`)}
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
            {npc.subtitle && (
              <p style={{
                fontFamily: 'var(--font-quote)',
                fontStyle: 'italic',
                fontSize: 11, letterSpacing: '0.03em',
                color: 'var(--gold)', margin: '0 0 2px',
              }}>
                {npc.subtitle}
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
              {npc.name}
            </h2>
          </div>

          <StatusBadge
            label={npcStatusLabel[npc.status]}
            color={npcStatusColor[npc.status]}
            className="mt-0.5"
          />
        </div>

        {npc.npc_role && (
          <p style={{
            fontSize: 11, fontWeight: 700,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'var(--crimson)', margin: 0,
            fontFamily: 'var(--font-body)',
          }}>
            {npc.npc_role}
          </p>
        )}

        {npc.description && (
          <p style={{
            fontSize: 13, lineHeight: 1.65,
            color: 'var(--muted)', margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {npc.description}
          </p>
        )}

        {!npc.description && !npc.subtitle && !npc.npc_role && (
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, fontStyle: 'italic' }}>
            Een nieuw personage wacht op zijn verhaal.
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

export const ForgeNpcCard = memo(function ForgeNpcCard({ onClick, loading }: ForgeProps) {
  return (
    <ForgeCard
      variant="compact"
      accent="crimson"
      onClick={onClick}
      loading={loading}
      ariaLabel="Nieuwe NPC aanmaken"
      title="+ NPC toevoegen"
      subtitle="Voeg een nieuw personage toe"
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
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      }
    />
  )
})

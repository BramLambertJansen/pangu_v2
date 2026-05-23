import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Quest } from '@/types/quest.types'
import { EntityCard } from '@/components/ui/EntityCard'
import { ForgeCard } from '@/components/ui/ForgeCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { pickGradient, questGradients } from '@/utils/pickGradient'
import { questStatusLabel, questStatusColor } from '@/lib/statusMaps'

interface Props {
  quest: Quest
}

export const QuestCard = memo(function QuestCard({ quest }: Props) {
  const navigate = useNavigate()
  const gradient = pickGradient(quest.id, questGradients)

  return (
    <EntityCard
      variant="compact"
      ariaLabel={`Quest: ${quest.name}`}
      onClick={() => navigate(`/quests/${quest.id}`)}
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
            {quest.subtitle && (
              <p style={{
                fontFamily: 'var(--font-quote)',
                fontStyle: 'italic',
                fontSize: 11, letterSpacing: '0.03em',
                color: 'var(--gold)', margin: '0 0 2px',
              }}>
                {quest.subtitle}
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
              {quest.name}
            </h2>
          </div>

          <StatusBadge
            label={questStatusLabel[quest.status]}
            color={questStatusColor[quest.status]}
            className="mt-0.5"
          />
        </div>

        {quest.quest_type && (
          <p style={{
            fontSize: 11, fontWeight: 700,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'var(--gold)', margin: 0,
            fontFamily: 'var(--font-body)',
          }}>
            {quest.quest_type}
          </p>
        )}

        {quest.description && (
          <p style={{
            fontSize: 13, lineHeight: 1.65,
            color: 'var(--muted)', margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {quest.description}
          </p>
        )}

        {!quest.description && !quest.subtitle && !quest.quest_type && (
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, fontStyle: 'italic' }}>
            Een nieuwe questreeks wacht op avonturiers.
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

export const ForgeQuestCard = memo(function ForgeQuestCard({ onClick, loading }: ForgeProps) {
  return (
    <ForgeCard
      variant="compact"
      accent="gold"
      onClick={onClick}
      loading={loading}
      ariaLabel="Nieuwe quest aanmaken"
      title="+ Quest toevoegen"
      subtitle="Voeg een nieuwe quest toe"
      icon={
        <svg
          aria-hidden="true"
          width="20" height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--gold)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ opacity: 0.7 }}
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14,2 14,8 20,8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <line x1="10" y1="9" x2="8" y2="9" />
        </svg>
      }
    />
  )
})

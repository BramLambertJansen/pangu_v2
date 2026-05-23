import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Character } from '@/types/character.types'
import { EntityCard } from '@/components/ui/EntityCard'
import { ForgeCard } from '@/components/ui/ForgeCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { pickGradient, characterGradients } from '@/utils/pickGradient'
import { characterStatusLabel, characterStatusColor } from '@/lib/statusMaps'

interface Props {
  character: Character
}

export const CharacterCard = memo(function CharacterCard({ character }: Props) {
  const navigate = useNavigate()
  const gradient = pickGradient(character.id, characterGradients)

  const classLabel = [character.character_class, character.character_subclass]
    .filter(Boolean)
    .join(' · ')

  return (
    <EntityCard
      variant="compact"
      ariaLabel={`Karakter: ${character.name}`}
      onClick={() => navigate(`/characters/${character.id}`)}
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
            {character.subtitle && (
              <p style={{
                fontFamily: 'var(--font-quote)',
                fontStyle: 'italic',
                fontSize: 11, letterSpacing: '0.03em',
                color: 'var(--gold)', margin: '0 0 2px',
              }}>
                {character.subtitle}
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
              {character.name}
            </h2>
          </div>

          <StatusBadge
            label={characterStatusLabel[character.status]}
            color={characterStatusColor[character.status]}
            className="mt-0.5"
          />
        </div>

        {/* Class + Race row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {classLabel && (
            <p style={{
              fontSize: 11, fontWeight: 700,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'var(--azure)', margin: 0,
              fontFamily: 'var(--font-body)',
            }}>
              {classLabel}
            </p>
          )}
          {character.character_race && (
            <p style={{
              fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--muted)', margin: 0,
              fontFamily: 'var(--font-body)',
            }}>
              {character.character_race}
            </p>
          )}
        </div>

        {/* Level + HP row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 2 }}>
          <span style={{
            fontSize: 11, fontWeight: 700,
            letterSpacing: '0.1em',
            color: 'var(--ink-soft)',
            fontFamily: 'var(--font-body)',
          }}>
            LVL {character.level}
          </span>
          <span style={{
            fontSize: 11,
            color: character.hp_current < character.hp_max * 0.3 ? 'var(--crimson)' : 'var(--ink-soft)',
            fontFamily: 'var(--font-body)',
          }}>
            {character.hp_current}/{character.hp_max} HP
          </span>
          <span style={{
            fontSize: 11,
            color: 'var(--muted)',
            fontFamily: 'var(--font-body)',
          }}>
            AC {character.armor_class}
          </span>
        </div>

        {!classLabel && !character.character_race && !character.subtitle && (
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, fontStyle: 'italic' }}>
            Een nieuw held wacht op zijn verhaal.
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

export const ForgeCharacterCard = memo(function ForgeCharacterCard({ onClick, loading }: ForgeProps) {
  return (
    <ForgeCard
      variant="compact"
      accent="azure"
      onClick={onClick}
      loading={loading}
      ariaLabel="Nieuw karakter aanmaken"
      title="+ Karakter toevoegen"
      subtitle="Maak een nieuw personage aan"
      icon={
        <svg
          aria-hidden="true"
          width="20" height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--azure)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ opacity: 0.7 }}
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      }
    />
  )
})

import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Character } from '@/types/character.types'
import { EntityCard } from '@/components/ui/EntityCard'
import { ForgeCard } from '@/components/ui/ForgeCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { pickGradient, pickCharacterAccent, characterGradients } from '@/utils/pickGradient'
import { characterStatusLabel, characterStatusColor } from '@/lib/statusMaps'

// Returns a class-themed SVG icon path for PartyMemberRow avatars.
function ClassIcon({ cls, accent }: { cls: string; accent: string }) {
  const c = cls.toLowerCase()
  if (c === 'wizard' || c === 'sorcerer' || c === 'warlock') {
    // 4-point sparkle / diamond star
    return (
      <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill={accent} opacity="0.85">
        <path d="M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z" />
      </svg>
    )
  }
  if (c === 'fighter' || c === 'paladin' || c === 'barbarian') {
    // Crossed axes / hammers
    return (
      <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" opacity="0.85">
        <line x1="5" y1="5" x2="19" y2="19" />
        <line x1="19" y1="5" x2="5" y2="19" />
        <circle cx="5" cy="5" r="2.5" fill={accent} stroke="none" />
        <circle cx="19" cy="5" r="2.5" fill={accent} stroke="none" />
        <circle cx="5" cy="19" r="2.5" fill={accent} stroke="none" />
        <circle cx="19" cy="19" r="2.5" fill={accent} stroke="none" />
      </svg>
    )
  }
  if (c === 'ranger' || c === 'druid') {
    // Leaf / teardrop
    return (
      <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill={accent} opacity="0.85">
        <path d="M12 3 C5 3 3 10 3 14 C3 18 7 21 12 21 C17 21 21 18 21 14 C21 7 16 3 12 3 Z" />
        <line x1="12" y1="21" x2="12" y2="12" stroke="rgba(0,0,0,0.25)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  }
  if (c === 'rogue' || c === 'monk' || c === 'bard') {
    // Crescent moon
    return (
      <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill={accent} opacity="0.85">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    )
  }
  if (c === 'cleric') {
    // Sun / radiant burst
    return (
      <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.8" strokeLinecap="round" opacity="0.85">
        <circle cx="12" cy="12" r="4" fill={accent} stroke="none" />
        <line x1="12" y1="2" x2="12" y2="5" />
        <line x1="12" y1="19" x2="12" y2="22" />
        <line x1="2" y1="12" x2="5" y2="12" />
        <line x1="19" y1="12" x2="22" y2="12" />
        <line x1="4.93" y1="4.93" x2="7.05" y2="7.05" />
        <line x1="16.95" y1="16.95" x2="19.07" y2="19.07" />
        <line x1="4.93" y1="19.07" x2="7.05" y2="16.95" />
        <line x1="16.95" y1="7.05" x2="19.07" y2="4.93" />
      </svg>
    )
  }
  // Default: shield
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.85">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

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

// ── PartyMemberRow ────────────────────────────────────────────────────────────
// Horizontal character card used in campaign / session "The Party" sections.
export const PartyMemberRow = memo(function PartyMemberRow({ character }: Props) {
  const navigate = useNavigate()
  const accent = pickCharacterAccent(character.id)
  const hpPct = character.hp_max > 0 ? Math.min(100, Math.round((character.hp_current / character.hp_max) * 100)) : 0
  const hpLow = character.hp_current < character.hp_max * 0.3

  const levelRaceClass = [
    `LV ${character.level}`,
    character.character_race,
    character.character_class,
  ].filter(Boolean).join(' · ')

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Karakter: ${character.name}`}
      onClick={() => navigate(`/characters/${character.id}`)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/characters/${character.id}`) } }}
      className="pangu-surface"
      style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '18px 20px 0',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'border-color var(--t-fast)',
        userSelect: 'none',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = accent }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '' }}
    >
      {/* Row: avatar + info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
        {/* Circular avatar */}
        <div
          aria-hidden="true"
          style={{
            width: 56, height: 56,
            borderRadius: '50%',
            border: `2px solid ${accent}`,
            background: `color-mix(in srgb, ${accent} 12%, transparent)`,
            flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ClassIcon cls={character.character_class ?? ''} accent={accent} />
        </div>

        {/* Text info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(15px, 3vw, 19px)',
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: 'var(--ink)',
            margin: '0 0 4px',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {character.name}
          </h3>

          {levelRaceClass && (
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              margin: '0 0 6px',
            }}>
              {levelRaceClass}
            </p>
          )}

          {/* HP + AC inline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 12, fontWeight: 600,
              color: hpLow ? 'var(--crimson)' : accent,
              fontFamily: 'var(--font-body)',
            }}>
              <span aria-hidden="true" style={{ fontSize: 14 }}>♡</span>
              {character.hp_current}/{character.hp_max}
            </span>
            <span style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 12, fontWeight: 600,
              color: 'var(--muted)',
              fontFamily: 'var(--font-body)',
            }}>
              <span aria-hidden="true" style={{ fontSize: 13 }}>◯</span>
              {character.armor_class}
            </span>
          </div>
        </div>
      </div>

      {/* HP progress bar — flush bottom strip */}
      <div
        role="progressbar"
        aria-valuenow={character.hp_current}
        aria-valuemin={0}
        aria-valuemax={character.hp_max}
        aria-label={`${character.hp_current} van ${character.hp_max} levenspunten`}
        style={{
          height: 4,
          margin: '0 -20px',
          background: 'var(--hairline)',
          overflow: 'hidden',
        }}
      >
        <div style={{
          height: '100%',
          width: `${hpPct}%`,
          background: hpLow ? 'var(--crimson)' : accent,
          transition: 'width 0.3s var(--ease-out)',
        }} />
      </div>
    </article>
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

import { memo, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Character } from '@/types/character.types'
import { pickCharacterAccent, characterGradients, pickGradient } from '@/utils/pickGradient'
import { sanitizeImageUrl } from '@/utils/sanitizeUrl'
import { characterStatusLabel, characterStatusColor } from '@/lib/statusMaps'

interface Props {
  character: Character
  selected?: boolean
  onSelect?: () => void
}

// ── CharacterCard ─────────────────────────────────────────────────────────────
// Full-bleed portrait card for the player's own character overview.
export const CharacterCard = memo(function CharacterCard({ character }: Props) {
  const navigate = useNavigate()
  const accent = pickCharacterAccent(character.id)
  const fallbackGradient = pickGradient(character.id, characterGradients)
  const portraitUrl = sanitizeImageUrl(character.portrait_url)
  const hpPct = character.hp_max > 0 ? Math.min(100, Math.round((character.hp_current / character.hp_max) * 100)) : 0
  const hpLow = character.hp_current < character.hp_max * 0.3

  const raceClass = [character.character_race, character.character_class].filter(Boolean).join(' · ')

  function handleKeyDown(e: KeyboardEvent<HTMLElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      navigate(`/characters/${character.id}`)
    }
  }

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Karakter: ${character.name}`}
      onClick={() => navigate(`/characters/${character.id}`)}
      onKeyDown={handleKeyDown}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        height: 380,
        borderRadius: 'var(--r-xl)',
        border: '1px solid var(--hairline)',
        cursor: 'pointer',
        outline: 'none',
        overflow: 'hidden',
        background: portraitUrl
          ? 'var(--void)'
          : 'linear-gradient(175deg, #141b3a 0%, #0d1228 60%, #0a0e20 100%)',
        transition: 'border-color var(--t-base) var(--ease-out), box-shadow var(--t-base) var(--ease-out), transform var(--t-base) var(--ease-out)',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget
        el.style.borderColor = accent
        el.style.transform = 'translateY(-3px)'
        el.style.boxShadow = `0 10px 36px rgba(0,0,0,0.55)`
      }}
      onMouseLeave={e => {
        const el = e.currentTarget
        el.style.borderColor = 'var(--hairline)'
        el.style.transform = ''
        el.style.boxShadow = ''
      }}
    >
      {/* Portrait or fallback gradient background */}
      {portraitUrl ? (
        <img
          src={portraitUrl}
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: character.portrait_position ?? 'center',
          }}
        />
      ) : (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: fallbackGradient,
            opacity: 0.7,
          }}
        />
      )}

      {/* Dark gradient overlay — bottom fade for text legibility */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(6,7,18,0.92) 0%, rgba(6,7,18,0.55) 45%, rgba(6,7,18,0.10) 80%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Level badge — top-right pill */}
      <div
        aria-label={`Level ${character.level}`}
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '5px 10px',
          borderRadius: 'var(--r-full)',
          border: '1.5px solid var(--gold)',
          background: 'rgba(10,10,20,0.80)',
          backdropFilter: 'blur(6px)',
          boxShadow: '0 0 12px rgba(245,180,50,0.25)',
        }}
      >
        {/* Sparkle icon */}
        <svg aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="var(--gold)">
          <path d="M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z" />
        </svg>
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.10em',
          color: 'var(--gold)',
          fontFamily: 'var(--font-body)',
          textTransform: 'uppercase',
        }}>
          LV {character.level}
        </span>
      </div>

      {/* Status badge for non-active characters */}
      {character.status !== 'active' && (
        <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 3 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '4px 9px', borderRadius: 'var(--r-full)',
            fontSize: 9, fontWeight: 700,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: characterStatusColor[character.status],
            border: `1px solid ${characterStatusColor[character.status]}55`,
            background: 'rgba(10,10,20,0.80)',
            backdropFilter: 'blur(6px)',
          }}>
            {characterStatusLabel[character.status]}
          </span>
        </div>
      )}

      {/* Bottom info overlay */}
      <div style={{ position: 'relative', zIndex: 2, padding: '0 16px 14px' }}>
        {/* Race · Class */}
        {raceClass && (
          <p style={{
            margin: '0 0 4px',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.55)',
            fontFamily: 'var(--font-body)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {raceClass}
          </p>
        )}

        {/* Name */}
        <h2 style={{
          margin: '0 0 10px',
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(18px, 2.8vw, 24px)',
          fontWeight: 700,
          lineHeight: 1.05,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.95)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {character.name}
        </h2>

        {/* HP + AC badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            aria-label={`${character.hp_current} van ${character.hp_max} HP`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 10px',
              borderRadius: 'var(--r-full)',
              background: 'rgba(10,10,20,0.72)',
              border: `1px solid ${hpLow ? 'rgba(220,90,80,0.45)' : 'rgba(62,207,178,0.35)'}`,
              backdropFilter: 'blur(6px)',
              fontSize: 12,
              fontWeight: 700,
              color: hpLow ? 'var(--crimson)' : 'var(--teal)',
              fontFamily: 'var(--font-body)',
            }}
          >
            <svg aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            {character.hp_current}/{character.hp_max}
          </span>

          <span
            aria-label={`Wapenrusting klasse ${character.armor_class}`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 10px',
              borderRadius: 'var(--r-full)',
              background: 'rgba(10,10,20,0.72)',
              border: '1px solid rgba(255,255,255,0.15)',
              backdropFilter: 'blur(6px)',
              fontSize: 12,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.75)',
              fontFamily: 'var(--font-body)',
            }}
          >
            <svg aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
            </svg>
            {character.armor_class}
          </span>
        </div>
      </div>

      {/* HP progress bar — flush bottom */}
      <div
        role="progressbar"
        aria-valuenow={character.hp_current}
        aria-valuemin={0}
        aria-valuemax={character.hp_max}
        aria-label={`${character.hp_current} van ${character.hp_max} HP`}
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 3,
          background: 'rgba(255,255,255,0.10)',
          overflow: 'hidden',
          zIndex: 3,
        }}
      >
        <div style={{
          height: '100%',
          width: `${hpPct}%`,
          background: hpLow ? 'var(--crimson)' : 'var(--teal)',
          transition: 'width 0.3s var(--ease-out)',
        }} />
      </div>
    </article>
  )
})

// ── PartyMemberRow ────────────────────────────────────────────────────────────
// Horizontal character card used in campaign / session "The Party" sections.
// When onSelect is provided, clicking selects the character instead of navigating.
export const PartyMemberRow = memo(function PartyMemberRow({ character, selected, onSelect }: Props) {
  const navigate = useNavigate()
  const accent = pickCharacterAccent(character.id)
  const portraitUrl = sanitizeImageUrl(character.portrait_url)
  const hpPct = character.hp_max > 0 ? Math.min(100, Math.round((character.hp_current / character.hp_max) * 100)) : 0
  const xpPct = character.xp_next > 0 ? Math.min(100, Math.round((character.xp / character.xp_next) * 100)) : 0
  const hpLow = character.hp_current < character.hp_max * 0.3

  const raceClass = [character.character_race, character.character_class].filter(Boolean).join(' · ')

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Karakter: ${character.name}`}
      onClick={() => onSelect ? onSelect() : navigate(`/characters/${character.id}`)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect ? onSelect() : navigate(`/characters/${character.id}`) } }}
      style={{
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'stretch',
        borderRadius: 'var(--r-xl)',
        border: `1px solid ${selected ? accent : 'var(--hairline)'}`,
        background: selected ? `color-mix(in srgb, ${accent} 6%, var(--surface))` : 'var(--surface)',
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'border-color var(--t-fast), box-shadow var(--t-fast), background var(--t-fast)',
        minHeight: 100,
        boxShadow: selected ? `0 0 0 1px ${accent}33, 0 4px 20px rgba(0,0,0,0.25)` : undefined,
      }}
      onMouseEnter={(e) => {
        if (selected) return
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = accent
        el.style.boxShadow = `0 4px 20px rgba(0,0,0,0.35)`
      }}
      onMouseLeave={(e) => {
        if (selected) return
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = 'var(--hairline)'
        el.style.boxShadow = ''
      }}
    >
      {/* Portrait thumbnail */}
      <div
        aria-hidden="true"
        style={{
          width: 96,
          flexShrink: 0,
          background: portraitUrl
            ? 'var(--void)'
            : `color-mix(in srgb, ${accent} 12%, var(--surface-2))`,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {portraitUrl ? (
          <img
            src={portraitUrl}
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: character.portrait_position ?? 'center top',
            }}
          />
        ) : (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg aria-hidden="true" width="32" height="32" viewBox="0 0 24 24" fill={accent} opacity="0.5">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
            </svg>
          </div>
        )}
        {/* Subtle right-edge fade to blend with the content area */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0, right: 0, bottom: 0,
            width: 28,
            background: 'linear-gradient(to right, transparent, var(--surface))',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, padding: '14px 52px 14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
        {/* Name */}
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(15px, 2.5vw, 18px)',
          fontWeight: 600,
          letterSpacing: '0.04em',
          color: 'var(--ink)',
          margin: 0,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {character.name}
        </h3>

        {/* Race · Class */}
        {raceClass && (
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            margin: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {raceClass}
          </p>
        )}

        {/* HP pill badge */}
        <div>
          <span
            aria-label={`${character.hp_current} van ${character.hp_max} HP`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 10px',
              borderRadius: 'var(--r-full)',
              background: hpLow ? 'rgba(220,90,80,0.12)' : 'rgba(62,207,178,0.12)',
              border: `1px solid ${hpLow ? 'rgba(220,90,80,0.35)' : 'rgba(62,207,178,0.35)'}`,
              fontSize: 12,
              fontWeight: 700,
              color: hpLow ? 'var(--crimson)' : 'var(--teal)',
              fontFamily: 'var(--font-body)',
            }}
          >
            <svg aria-hidden="true" width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            {character.hp_current}/{character.hp_max}
          </span>
        </div>

        {/* HP bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
            color: 'var(--muted)', fontFamily: 'var(--font-body)', width: 18, flexShrink: 0,
          }}>HP</span>
          <div
            role="progressbar"
            aria-valuenow={character.hp_current}
            aria-valuemin={0}
            aria-valuemax={character.hp_max}
            style={{ flex: 1, height: 5, borderRadius: 3, background: 'var(--hairline)', overflow: 'hidden' }}
          >
            <div style={{
              height: '100%',
              width: `${hpPct}%`,
              borderRadius: 3,
              background: hpLow ? 'var(--crimson)' : 'var(--teal)',
              transition: 'width 0.3s var(--ease-out)',
            }} />
          </div>
        </div>

        {/* XP bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
            color: 'var(--muted)', fontFamily: 'var(--font-body)', width: 18, flexShrink: 0,
          }}>XP</span>
          <div
            role="progressbar"
            aria-valuenow={character.xp}
            aria-valuemin={0}
            aria-valuemax={character.xp_next}
            aria-label={`${character.xp} van ${character.xp_next} XP`}
            style={{ flex: 1, height: 5, borderRadius: 3, background: 'var(--hairline)', overflow: 'hidden' }}
          >
            <div style={{
              height: '100%',
              width: `${xpPct}%`,
              borderRadius: 3,
              background: 'var(--gold)',
              transition: 'width 0.3s var(--ease-out)',
            }} />
          </div>
        </div>
      </div>

      {/* Level badge — top-right pill */}
      <div
        aria-label={`Level ${character.level}`}
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '4px 9px',
          borderRadius: 'var(--r-full)',
          border: '1.5px solid var(--gold)',
          background: 'rgba(10,10,20,0.85)',
          backdropFilter: 'blur(4px)',
          boxShadow: '0 0 10px rgba(245,180,50,0.20)',
        }}
      >
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: 'var(--gold)',
          fontFamily: 'var(--font-body)',
          textTransform: 'uppercase',
        }}>
          LV {character.level}
        </span>
      </div>
    </article>
  )
})

interface ForgeProps {
  onClick: () => void
  loading?: boolean
}

export const ForgeCharacterCard = memo(function ForgeCharacterCard({ onClick, loading }: ForgeProps) {
  function handleKeyDown(e: KeyboardEvent<HTMLElement>) {
    if (loading) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label="Nieuw karakter aanmaken"
      onClick={() => { if (!loading) onClick() }}
      onKeyDown={handleKeyDown}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        height: 480,
        borderRadius: 'var(--r-xl)',
        border: '1px dashed rgba(107,167,255,0.35)',
        background: 'rgba(107,167,255,0.03)',
        cursor: loading ? 'wait' : 'pointer',
        outline: 'none',
        transition: 'border-color var(--t-base) var(--ease-out), background var(--t-base) var(--ease-out)',
      }}
      onMouseEnter={e => {
        if (loading) return
        const el = e.currentTarget
        el.style.borderColor = 'rgba(107,167,255,0.6)'
        el.style.background = 'rgba(107,167,255,0.06)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget
        el.style.borderColor = 'rgba(107,167,255,0.35)'
        el.style.background = 'rgba(107,167,255,0.03)'
      }}
    >
      {/* Dashed circle with + */}
      <div style={{
        width: 64,
        height: 64,
        borderRadius: '50%',
        border: '1.5px dashed rgba(107,167,255,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{
          fontSize: 30,
          lineHeight: 1,
          fontWeight: 300,
          color: 'var(--azure)',
          marginTop: -2,
        }}>
          +
        </span>
      </div>

      {/* Label */}
      <p style={{
        margin: 0,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.20em',
        textTransform: 'uppercase',
        color: 'var(--azure)',
        fontFamily: 'var(--font-body)',
      }}>
        {loading ? 'Aanmaken...' : 'Nieuw Held'}
      </p>
    </article>
  )
})

import { memo, useMemo, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Character } from '@/types/character.types'
import { pickGradient, pickCharacterAccent, characterGradients } from '@/utils/pickGradient'
import { sanitizeImageUrl } from '@/utils/sanitizeUrl'

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

  // Deterministic star positions from character ID — stable between renders
  const stars = useMemo(() => {
    const hash = character.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
    return Array.from({ length: 9 }, (_, i) => ({
      x: ((hash * (i + 1) * 13 + i * 37) % 80) + 8,
      y: ((hash * (i + 1) * 7 + i * 23) % 80) + 80,
      size: i % 3 === 0 ? 2 : 1.5,
      opacity: 0.25 + (i % 4) * 0.15,
    }))
  }, [character.id])

  const raceClassParts = [
    character.character_race,
    [character.character_class, character.character_subclass].filter(Boolean).join(' · '),
  ].filter(Boolean)

  const hpLow = character.hp_current < character.hp_max * 0.3

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
        height: 480,
        borderRadius: 'var(--r-xl)',
        border: '1px solid var(--hairline)',
        cursor: 'pointer',
        outline: 'none',
        overflow: 'hidden',
        transition: 'border-color var(--t-base) var(--ease-out), box-shadow var(--t-base) var(--ease-out), transform var(--t-base) var(--ease-out)',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget
        el.style.borderColor = 'var(--hairline-strong)'
        el.style.transform = 'translateY(-2px)'
        el.style.boxShadow = '0 8px 32px rgba(0,0,0,0.45)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget
        el.style.borderColor = 'var(--hairline)'
        el.style.transform = ''
        el.style.boxShadow = ''
      }}
    >
      {/* Level badge — top-right, floats above the night sky */}
      <div
        aria-label={`Level ${character.level}`}
        style={{
          position: 'absolute',
          top: 14,
          right: 14,
          zIndex: 3,
          width: 52,
          height: 52,
          borderRadius: '50%',
          border: '2px solid var(--gold)',
          background: 'rgba(10,10,20,0.85)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 14px rgba(245,180,50,0.3)',
          backdropFilter: 'blur(4px)',
        }}
      >
        <span style={{
          fontSize: 20,
          fontWeight: 700,
          color: 'var(--gold)',
          lineHeight: 1,
          fontFamily: 'var(--font-display)',
        }}>
          {character.level}
        </span>
        <span style={{
          fontSize: 8,
          letterSpacing: '0.14em',
          color: 'var(--muted)',
          textTransform: 'uppercase',
          fontFamily: 'var(--font-body)',
          marginTop: 2,
        }}>
          LV
        </span>
      </div>

      {/* ── Night sky visual section ── */}
      <div style={{
        position: 'relative',
        height: '57%',
        flexShrink: 0,
        background: 'linear-gradient(175deg, #141b3a 0%, #0d1228 60%, #0a0e20 100%)',
        overflow: 'hidden',
      }}>
        {/* Portrait image when available */}
        {sanitizeImageUrl(character.portrait_url) && (
          <img
            src={sanitizeImageUrl(character.portrait_url)}
            alt=""
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center top',
            }}
          />
        )}

        {/* Atmospheric glow — deterministic per character */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: gradient,
            opacity: sanitizeImageUrl(character.portrait_url) ? 0.35 : 0.65,
            pointerEvents: 'none',
          }}
        />

        {/* Star dots */}
        {stars.map((star, i) => (
          <div
            key={i}
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: `${star.x}%`,
              top: `${star.y - 75}%`,
              width: star.size,
              height: star.size,
              borderRadius: '50%',
              background: 'white',
              opacity: star.opacity,
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* Crescent moon */}
        <svg
          aria-hidden="true"
          width="38"
          height="38"
          viewBox="0 0 24 24"
          fill="none"
          style={{
            position: 'absolute',
            left: '28%',
            top: '30%',
            opacity: 0.5,
            pointerEvents: 'none',
          }}
        >
          <path
            d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
            stroke="rgba(107,167,255,0.9)"
            strokeWidth="1.2"
            fill="none"
          />
        </svg>

        {/* Large decorative circle — cosmic body */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: '-8%',
            top: '10%',
            width: 170,
            height: 170,
            borderRadius: '50%',
            border: '1px solid rgba(245,180,50,0.22)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* ── Character info section ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '14px 20px 18px',
        background: 'var(--surface)',
      }}>
        <div>
          {/* Race · Class */}
          {raceClassParts.length > 0 && (
            <p style={{
              margin: '0 0 5px',
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              fontFamily: 'var(--font-body)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {raceClassParts.join(' · ')}
            </p>
          )}

          {/* Name */}
          <h2 style={{
            margin: '0 0 5px',
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(20px, 3vw, 26px)',
            fontWeight: 600,
            lineHeight: 1.1,
            color: 'var(--ink)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {character.name}
          </h2>

          {/* Subtitle / campaign name */}
          {character.subtitle && (
            <p style={{
              margin: 0,
              fontSize: 13,
              color: 'var(--muted)',
              fontFamily: 'var(--font-body)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {character.subtitle}
            </p>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--hairline)', margin: '12px 0' }} />

        {/* Stats row: HP · AC · SPD */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          textAlign: 'center',
        }}>
          <div>
            <p style={{
              margin: '0 0 4px',
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              fontFamily: 'var(--font-body)',
            }}>
              HP
            </p>
            <p style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: hpLow ? 'var(--crimson)' : 'var(--ink)',
              fontFamily: 'var(--font-display)',
              lineHeight: 1,
            }}>
              {character.hp_current}/{character.hp_max}
            </p>
          </div>

          <div style={{ width: 1, height: 32, background: 'var(--hairline)', flexShrink: 0 }} />

          <div>
            <p style={{
              margin: '0 0 4px',
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              fontFamily: 'var(--font-body)',
            }}>
              AC
            </p>
            <p style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--ink)',
              fontFamily: 'var(--font-display)',
              lineHeight: 1,
            }}>
              {character.armor_class}
            </p>
          </div>

          <div style={{ width: 1, height: 32, background: 'var(--hairline)', flexShrink: 0 }} />

          <div>
            <p style={{
              margin: '0 0 4px',
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              fontFamily: 'var(--font-body)',
            }}>
              SPD
            </p>
            <p style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--ink)',
              fontFamily: 'var(--font-display)',
              lineHeight: 1,
            }}>
              {character.speed}
            </p>
          </div>
        </div>
      </div>
    </article>
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

import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Bestiary } from '@/types/bestiary.types'
import { bestiaryStatusLabel, bestiaryStatusColor } from '@/lib/statusMaps'
import { pickGradient, bestiaryGradients } from '@/utils/pickGradient'

interface Props {
  bestiary: Bestiary
}

const ABILITY_SCORES = [
  { key: 'stat_str', abbr: 'STR' },
  { key: 'stat_dex', abbr: 'DEX' },
  { key: 'stat_con', abbr: 'CON' },
  { key: 'stat_int', abbr: 'INT' },
  { key: 'stat_wis', abbr: 'WIS' },
  { key: 'stat_cha', abbr: 'CHA' },
] as const

function mod(score: number): string {
  const m = Math.floor((score - 10) / 2)
  return m >= 0 ? `+${m}` : `${m}`
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      margin: '0 0 8px',
      fontSize: 9, fontWeight: 700,
      letterSpacing: '0.18em', textTransform: 'uppercase',
      color: 'var(--muted)', fontFamily: 'var(--font-body)',
    }}>
      {children}
    </p>
  )
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--hairline)', margin: '14px 0' }} />
}

export const DmBestiaryPanel = memo(function DmBestiaryPanel({ bestiary }: Props) {
  const navigate = useNavigate()
  const gradient = pickGradient(bestiary.id, bestiaryGradients)
  const initial = bestiary.name.trim()[0]?.toUpperCase() ?? '?'

  return (
    <div
      role="region"
      aria-label={`Statblok: ${bestiary.name}`}
      style={{
        background: 'var(--surface)',
        borderRadius: 'var(--r-xl)',
        border: '1px solid rgba(62,207,178,0.30)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Header */}
      <div style={{
        position: 'relative',
        minHeight: 100,
        background: `${gradient}, var(--surface-2)`,
        borderBottom: '1px solid var(--hairline)',
        overflow: 'hidden',
        padding: '14px 50px 14px 18px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        gap: 4,
      }}>
        {/* Watermark */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', right: 12, top: '50%',
            transform: 'translateY(-50%)',
            fontFamily: 'var(--font-display)',
            fontSize: 96, fontWeight: 700,
            color: 'var(--ink)', opacity: 0.06,
            lineHeight: 1, userSelect: 'none', pointerEvents: 'none',
          }}
        >
          {initial}
        </div>

        {bestiary.creature_type && (
          <p style={{
            margin: 0, fontSize: 9, fontWeight: 700,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: 'var(--teal)', fontFamily: 'var(--font-body)',
          }}>
            {bestiary.creature_type}
            {bestiary.threat_level && (
              <span style={{ color: 'var(--gold)', marginLeft: 8 }}>
                GV {bestiary.threat_level}
              </span>
            )}
          </p>
        )}

        {bestiary.subtitle && (
          <p style={{
            margin: 0, fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontStyle: 'italic', fontSize: 11, color: 'var(--gold)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {bestiary.subtitle}
          </p>
        )}

        <h2 style={{
          margin: 0,
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(18px, 2.6vw, 22px)',
          fontWeight: 700, color: 'var(--ink)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {bestiary.name}
        </h2>

        {/* Status badge */}
        <div style={{ position: 'absolute', top: 10, right: 10 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '3px 9px', borderRadius: 'var(--r-full)',
            fontSize: 9, fontWeight: 700,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: bestiaryStatusColor[bestiary.status],
            border: `1px solid ${bestiaryStatusColor[bestiary.status]}55`,
            background: `${bestiaryStatusColor[bestiary.status]}11`,
          }}>
            {bestiaryStatusLabel[bestiary.status]}
          </span>
        </div>

        {/* Link to full detail */}
        <button
          type="button"
          aria-label={`Volledig statblok van ${bestiary.name}`}
          onClick={() => navigate(`/bestiary/${bestiary.id}`)}
          style={{
            position: 'absolute', bottom: 10, right: 10,
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 8px', borderRadius: 'var(--r-full)',
            border: '1px solid var(--hairline)',
            background: 'transparent', cursor: 'pointer',
            fontSize: 9, fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: 'var(--muted)', fontFamily: 'var(--font-body)',
            transition: 'color var(--t-fast), border-color var(--t-fast)',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--ink)'; e.currentTarget.style.borderColor = 'var(--hairline-strong)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--hairline)' }}
        >
          Volledig statblok
          <svg aria-hidden="true" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </button>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 20px' }}>

        {/* Combat stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 6,
          marginBottom: 14,
        }}>
          {[
            { label: 'HP', value: bestiary.hp },
            { label: 'AC', value: bestiary.ac },
            { label: 'Snelheid', value: `${bestiary.speed} ft` },
          ].map(stat => (
            <div key={stat.label} style={{
              background: 'var(--surface-2)',
              borderRadius: 8, padding: '8px 6px',
              textAlign: 'center',
              border: '1px solid var(--hairline)',
            }}>
              <p style={{ margin: '0 0 2px', fontSize: 8, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
                {stat.label}
              </p>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <Divider />

        {/* Ability scores */}
        <SectionHeading>Eigenschappen</SectionHeading>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: 5,
          marginBottom: 14,
        }}>
          {ABILITY_SCORES.map(({ key, abbr }) => {
            const score = bestiary[key]
            return (
              <div key={key} style={{
                background: 'var(--surface-2)',
                borderRadius: 8, padding: '7px 4px',
                textAlign: 'center',
                border: '1px solid var(--hairline)',
              }}>
                <p style={{ margin: '0 0 2px', fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
                  {abbr}
                </p>
                <p style={{ margin: '0 0 1px', fontSize: 15, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                  {score}
                </p>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: 'var(--teal)', fontFamily: 'var(--font-body)' }}>
                  {mod(score)}
                </p>
              </div>
            )
          })}
        </div>

        {bestiary.habitat && (
          <>
            <Divider />
            <SectionHeading>Leefgebied</SectionHeading>
            <p style={{ margin: '0 0 0', fontSize: 12, color: 'var(--ink-soft)', fontStyle: 'italic', fontFamily: 'var(--font-body)' }}>
              {bestiary.habitat}
            </p>
          </>
        )}

        {bestiary.description && (
          <>
            <Divider />
            <SectionHeading>Beschrijving</SectionHeading>
            <p style={{
              margin: 0, fontSize: 13, lineHeight: 1.7,
              color: 'var(--ink-soft)', fontFamily: 'var(--font-body)',
              whiteSpace: 'pre-wrap',
            }}>
              {bestiary.description}
            </p>
          </>
        )}

        {bestiary.notes && (
          <>
            <Divider />
            <SectionHeading>✦ DM-notities</SectionHeading>
            <p style={{
              margin: 0, fontSize: 12, lineHeight: 1.65,
              color: 'var(--ink-soft)', fontFamily: 'var(--font-body)',
              whiteSpace: 'pre-wrap',
            }}>
              {bestiary.notes}
            </p>
          </>
        )}
      </div>
    </div>
  )
})

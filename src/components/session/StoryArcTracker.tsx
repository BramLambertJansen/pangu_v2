import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Session } from '@/types/session.types'
import { Spinner } from '@/components/ui/Spinner'

function toRoman(num: number): string {
  const val = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1]
  const syms = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I']
  let result = ''
  for (let i = 0; i < val.length; i++) {
    while (num >= val[i]) {
      result += syms[i]
      num -= val[i]
    }
  }
  return result
}

function formatShortDate(dateStr: string | null): string | null {
  if (!dateStr) return null
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  const d = new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]))
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }).toUpperCase()
}

interface Props {
  sessions: Session[]
  onForge: () => void
  forgeLoading?: boolean
}

export const StoryArcTracker = memo(function StoryArcTracker({ sessions, onForge, forgeLoading }: Props) {
  const navigate = useNavigate()
  const sorted = [...sessions].sort((a, b) => (a.session_number ?? 0) - (b.session_number ?? 0))

  return (
    <div>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 32 }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(22px, 4vw, 30px)',
          fontWeight: 600,
          letterSpacing: '0.06em',
          fontVariant: 'small-caps',
          color: 'var(--ink)',
          margin: 0,
        }}>
          De Verhaalboog
        </h2>
        {sorted.length > 0 && (
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: 11, fontWeight: 700,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            color: 'var(--muted)',
          }}>
            {sorted.length} {sorted.length === 1 ? 'Sessie' : 'Sessies'}
          </span>
        )}
      </div>

      {/* Timeline */}
      <div style={{ position: 'relative' }}>
        {/* Vertical connecting line */}
        {sorted.length > 0 && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: 23,
              top: 48,
              bottom: 40,
              width: 1,
              background: 'linear-gradient(to bottom, var(--hairline-strong) 0%, var(--hairline) 100%)',
              pointerEvents: 'none',
            }}
          />
        )}

        {sorted.map((session, i) => {
          const isActive = session.status === 'active'
          const roman = session.session_number != null ? toRoman(session.session_number) : String(i + 1)
          const dateLabel = formatShortDate(session.session_date)
          const chapterLabel = `Sessie ${session.session_number ?? i + 1}${dateLabel ? ` · ${dateLabel}` : ''}`

          return (
            <div
              key={session.id}
              style={{ display: 'flex', gap: 24, marginBottom: 48, position: 'relative' }}
            >
              {/* Roman numeral circle */}
              <div style={{ flexShrink: 0, position: 'relative', zIndex: 1 }}>
                <div
                  aria-hidden="true"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 48, height: 48,
                    borderRadius: 'var(--r-full)',
                    background: isActive
                      ? 'var(--gold)'
                      : 'var(--surface-2)',
                    border: `2px solid ${isActive ? 'rgba(245,200,66,0.5)' : 'var(--hairline-strong)'}`,
                    boxShadow: isActive ? '0 0 20px rgba(245,200,66,0.28)' : 'none',
                    fontFamily: 'var(--font-display)',
                    fontSize: roman.length > 4 ? 9 : roman.length > 2 ? 11 : 14,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    color: isActive ? 'var(--void)' : 'var(--violet-soft)',
                    userSelect: 'none',
                    transition: 'all var(--t-base) var(--ease-out)',
                  }}
                >
                  {roman}
                </div>
              </div>

              {/* Session content */}
              <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
                <button
                  type="button"
                  onClick={() => navigate(`/sessions/${session.id}`)}
                  aria-label={`${session.name} openen`}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: isActive ? '16px 20px' : '0',
                    background: isActive ? 'rgba(245,200,66,0.05)' : 'transparent',
                    border: isActive ? '1px solid rgba(245,200,66,0.18)' : 'none',
                    borderRadius: 'var(--r-lg)',
                    cursor: 'pointer',
                    transition: 'background var(--t-base) var(--ease-out)',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(155,138,255,0.04)'
                  }}
                  onMouseLeave={e => {
                    if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                  }}
                >
                  {/* Meta row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 10, fontWeight: 700,
                      letterSpacing: '0.18em', textTransform: 'uppercase',
                      color: isActive ? 'var(--gold)' : 'var(--muted)',
                    }}>
                      {chapterLabel}
                    </span>
                    {isActive && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center',
                        padding: '2px 8px',
                        background: 'var(--gold)',
                        borderRadius: 'var(--r-full)',
                        fontFamily: 'var(--font-body)',
                        fontSize: 9, fontWeight: 800,
                        letterSpacing: '0.2em', textTransform: 'uppercase',
                        color: 'var(--void)',
                      }}>
                        NU
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(17px, 3vw, 22px)',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    fontVariant: 'small-caps',
                    color: 'var(--ink)',
                    margin: '0 0 8px',
                    lineHeight: 1.15,
                  }}>
                    {session.name}
                  </h3>

                  {/* Description */}
                  {session.description ? (
                    <p style={{
                      fontSize: 13, lineHeight: 1.65,
                      color: 'var(--ink-soft)', margin: 0,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {session.description}
                    </p>
                  ) : (
                    <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, fontStyle: 'italic' }}>
                      Nog geen samenvatting.
                    </p>
                  )}
                </button>
              </div>
            </div>
          )
        })}

        {/* Forge row */}
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <div style={{ flexShrink: 0, position: 'relative', zIndex: 1 }}>
            <button
              type="button"
              onClick={onForge}
              disabled={forgeLoading}
              aria-label="Nieuwe sessie aanmaken"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 48, height: 48,
                borderRadius: 'var(--r-full)',
                background: 'transparent',
                border: '2px dashed var(--hairline-strong)',
                cursor: forgeLoading ? 'default' : 'pointer',
                fontSize: 18, color: 'var(--subtle)',
                transition: 'all var(--t-base) var(--ease-out)',
                opacity: forgeLoading ? 0.6 : 1,
              }}
              onMouseEnter={e => {
                if (!forgeLoading) {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.borderColor = 'var(--violet)'
                  el.style.color = 'var(--violet)'
                }
              }}
              onMouseLeave={e => {
                if (!forgeLoading) {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.borderColor = 'var(--hairline-strong)'
                  el.style.color = 'var(--subtle)'
                }
              }}
            >
              {forgeLoading ? <Spinner size="sm" /> : '+'}
            </button>
          </div>
          <button
            type="button"
            onClick={onForge}
            disabled={forgeLoading}
            style={{
              background: 'none', border: 'none', padding: 0,
              fontFamily: 'var(--font-body)',
              fontSize: 13, fontWeight: 600,
              letterSpacing: '0.04em',
              color: 'var(--subtle)',
              cursor: forgeLoading ? 'default' : 'pointer',
              transition: 'color var(--t-fast) var(--ease-out)',
            }}
            onMouseEnter={e => {
              if (!forgeLoading) (e.currentTarget as HTMLButtonElement).style.color = 'var(--violet)'
            }}
            onMouseLeave={e => {
              if (!forgeLoading) (e.currentTarget as HTMLButtonElement).style.color = 'var(--subtle)'
            }}
          >
            {forgeLoading ? 'Aanmaken...' : 'Nieuwe sessie toevoegen'}
          </button>
        </div>
      </div>
    </div>
  )
})

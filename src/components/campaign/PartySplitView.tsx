import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sanitizeImageUrl } from '@/utils/sanitizeUrl'
import { OrnateDivider } from '@/components/ui/OrnateDivider'
import type { Character } from '@/types/character.types'

const ACCENT_COLORS = [
  'var(--violet)', 'var(--teal)', 'var(--gold)', 'var(--crimson)', 'var(--azure)',
]

function getAccent(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return ACCENT_COLORS[h % ACCENT_COLORS.length]
}

function mod(v: number): string {
  const m = Math.floor((v - 10) / 2)
  return m >= 0 ? `+${m}` : `${m}`
}

function hpColor(current: number, max: number): string {
  const pct = max > 0 ? current / max : 1
  if (pct < 0.3) return 'var(--crimson)'
  if (pct < 0.62) return 'var(--gold)'
  return 'var(--teal)'
}

const STAT_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const
type StatKey = typeof STAT_KEYS[number]
const STAT_LABEL: Record<StatKey, string> = { str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA' }

function getStats(c: Character): Record<StatKey, number> {
  return { str: c.stat_str, dex: c.stat_dex, con: c.stat_con, int: c.stat_int, wis: c.stat_wis, cha: c.stat_cha }
}

interface Props {
  characters: Character[]
}

export function PartySplitView({ characters }: Props) {
  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState<string>(characters[0]?.id ?? '')
  const selected = characters.find(c => c.id === selectedId) ?? characters[0] ?? null

  if (characters.length === 0) return null

  return (
    <div className="party-split" role="region" aria-label="Karakteroverzicht">
      {/* LEFT — list */}
      <ul
        className="party-split-list"
        role="listbox"
        aria-label="Karakters"
        aria-orientation="vertical"
      >
        {characters.map((c) => {
          const accent = getAccent(c.id)
          const hpPct = c.hp_max > 0 ? c.hp_current / c.hp_max : 1
          const xpPct = c.xp_next > 0 ? c.xp / c.xp_next : 0
          const isSel = c.id === selectedId

          return (
            <li
              key={c.id}
              role="option"
              aria-selected={isSel}
            >
              <button
                className={`party-split-row${isSel ? ' is-selected' : ''}`}
                style={{ '--accent': accent } as React.CSSProperties}
                onClick={() => setSelectedId(c.id)}
                aria-label={`${c.name}, level ${c.level} ${c.character_class ?? ''}`}
              >
                <div className="party-split-row-stripe" aria-hidden="true" />
                <div className="party-split-row-av" aria-hidden="true">
                  {c.portrait_url ? (
                    <img
                      src={sanitizeImageUrl(c.portrait_url) ?? ''}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: c.portrait_position ?? 'center' }}
                    />
                  ) : (
                    <span style={{ color: accent }}>{c.name[0]?.toUpperCase()}</span>
                  )}
                </div>
                <div className="party-split-row-body">
                  <div className="party-split-row-top">
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                    <span className="party-split-lv">LV {c.level}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 2 }}>
                    {[c.character_race, c.character_class].filter(Boolean).join(' · ')}
                  </div>
                  <div className="party-split-bars">
                    <div className="party-split-bar-wrap">
                      <span className="party-split-bar-lbl" aria-hidden="true">HP</span>
                      <div className="party-split-bar" role="presentation">
                        <div className="party-split-bar-fill" style={{ width: `${hpPct * 100}%`, background: hpColor(c.hp_current, c.hp_max) }} />
                      </div>
                      <span className="party-split-bar-val" style={{ color: hpColor(c.hp_current, c.hp_max) }}>
                        {c.hp_current}/{c.hp_max}
                      </span>
                    </div>
                    <div className="party-split-bar-wrap">
                      <span className="party-split-bar-lbl" aria-hidden="true">XP</span>
                      <div className="party-split-bar" role="presentation">
                        <div className="party-split-bar-fill" style={{ width: `${xpPct * 100}%`, background: accent }} />
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            </li>
          )
        })}
      </ul>

      {/* RIGHT — detail */}
      {selected && (
        <div className="party-split-detail fade-in" key={selected.id}>
          {/* Portrait */}
          <div
            className="party-split-portrait"
            style={{ '--accent': getAccent(selected.id) } as React.CSSProperties}
            aria-hidden="true"
          >
            {selected.portrait_url ? (
              <img
                src={sanitizeImageUrl(selected.portrait_url) ?? ''}
                alt=""
                style={{
                  position: 'absolute', inset: 0, width: '100%', height: '100%',
                  objectFit: 'cover', objectPosition: selected.portrait_position ?? 'center',
                }}
              />
            ) : (
              <div style={{
                position: 'absolute', inset: 0,
                background: `linear-gradient(135deg, color-mix(in oklab, ${getAccent(selected.id)} 18%, var(--void-2)) 0%, var(--void-2) 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontSize: 80, fontWeight: 700,
                color: getAccent(selected.id), opacity: 0.35,
              }}>
                {selected.name[0]?.toUpperCase()}
              </div>
            )}
            <div className="party-split-portrait-scrim" />
            <button
              className="char-portal-btn"
              onClick={() => navigate(`/characters/${selected.id}`)}
              aria-label={`Volledige karakterpagina van ${selected.name} openen`}
            >
              <span className="char-portal-btn-label">Toon karakter</span>
              <span className="char-portal-btn-icon" aria-hidden="true">→</span>
            </button>
            <div className="party-split-portrait-badge">
              <span className="badge badge-solid-gold">LV {selected.level}</span>
              {selected.character_class && (
                <span className="badge badge-outline" style={{ borderColor: getAccent(selected.id), color: getAccent(selected.id) }}>
                  {selected.character_class}
                </span>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="party-split-detail-body">
            {selected.character_race && (
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>
                {[selected.character_race, selected.character_subclass].filter(Boolean).join(' · ')}
              </div>
            )}
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink)', margin: 0 }}>
              {selected.name}
            </h3>

            {/* XP bar */}
            {selected.xp_next > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted)', flexShrink: 0 }}>
                  {selected.xp.toLocaleString('nl-NL')}<span style={{ color: 'var(--subtle)' }}> / {selected.xp_next.toLocaleString('nl-NL')} XP</span>
                </span>
                <div style={{ flex: 1, height: 3, background: 'var(--void-2)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 2,
                    width: `${Math.min(100, (selected.xp / selected.xp_next) * 100)}%`,
                    background: getAccent(selected.id),
                    transition: 'width 600ms',
                  }} />
                </div>
              </div>
            )}

            {/* Vitals */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 16 }}>
              {[
                { label: 'HP', value: `${selected.hp_current}/${selected.hp_max}`, color: hpColor(selected.hp_current, selected.hp_max) },
                { label: 'AC', value: selected.armor_class },
                { label: 'Init', value: selected.initiative >= 0 ? `+${selected.initiative}` : `${selected.initiative}`, color: 'var(--gold)' },
                { label: 'Speed', value: `${selected.speed}ft` },
              ].map((v) => (
                <div key={v.label} style={{
                  padding: '10px 6px', textAlign: 'center',
                  background: 'var(--void-2)', borderRadius: 'var(--r-sm)',
                  border: '1px solid var(--hairline)',
                }}>
                  <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', color: 'var(--muted)', textTransform: 'uppercase' }}>{v.label}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: v.color ?? 'var(--ink)', marginTop: 3, lineHeight: 1 }}>{v.value}</div>
                </div>
              ))}
            </div>

            {/* Ability scores */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 5, marginTop: 12 }}>
              {STAT_KEYS.map((k) => {
                const v = getStats(selected)[k]
                const isSaveProficient = selected.saving_throw_proficiencies?.includes(k)
                return (
                  <div key={k} style={{
                    textAlign: 'center', padding: '8px 4px',
                    background: 'var(--void-2)', borderRadius: 'var(--r-sm)',
                    border: '1px solid var(--hairline)',
                  }}>
                    <div style={{ fontSize: 8, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', color: 'var(--muted)', textTransform: 'uppercase' }}>{STAT_LABEL[k]}</div>
                    <div style={{
                      fontSize: 14, fontFamily: 'var(--font-display)', fontWeight: 700,
                      color: isSaveProficient ? 'var(--gold)' : 'var(--ink)', marginTop: 2,
                    }}>
                      {mod(v)}
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{v}</div>
                  </div>
                )
              })}
            </div>
            {selected.saving_throw_proficiencies?.length > 0 && (
              <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--muted)', marginTop: 4 }}>
                <span style={{ color: 'var(--gold)' }}>★</span> = reddingsgooi
              </div>
            )}

            {/* Description */}
            {selected.description && (
              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--ink-soft)', margin: 0, borderLeft: `2px solid ${getAccent(selected.id)}`, paddingLeft: 12 }}>
                  {selected.description}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function PartyVitalsGrid({ characters }: { characters: Character[] }) {
  if (characters.length === 0) return null
  const avgLevel = Math.round(characters.reduce((s, c) => s + c.level, 0) / characters.length)
  const totalHp = characters.reduce((s, c) => s + c.hp_current, 0)
  const totalHpMax = characters.reduce((s, c) => s + c.hp_max, 0)
  const treasury = characters.reduce((s, c) => s + (c.gold ?? 0), 0)

  return (
    <>
      <OrnateDivider label="Conditie van het Gezelschap" glyph="❤" />
      <div className="vitals-grid" role="region" aria-label="Groepsvitaliteit">
        <div className="surface" style={{ padding: 20, borderRadius: 'var(--r-xl)', border: '1px solid var(--hairline)' }}>
          <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>Gem. level</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 700, color: 'var(--gold)', lineHeight: 1 }}>{avgLevel}</div>
        </div>
        <div className="surface" style={{ padding: 20, borderRadius: 'var(--r-xl)', border: '1px solid var(--hairline)' }}>
          <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>Totaal HP</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 700, color: 'var(--teal)', lineHeight: 1 }}>
            {totalHp}<span style={{ fontSize: 20, color: 'var(--muted)' }}>/{totalHpMax}</span>
          </div>
        </div>
        <div className="surface" style={{ padding: 20, borderRadius: 'var(--r-xl)', border: '1px solid var(--hairline)' }}>
          <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>Schatkist</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 700, color: 'var(--gold)', lineHeight: 1 }}>
            {treasury}<span style={{ fontSize: 18, color: 'var(--muted)' }}>gp</span>
          </div>
        </div>
      </div>
    </>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Faction, FactionReputation } from '@/types/faction.types'
import type { Npc } from '@/types/npc.types'
import { factionReputationLabel, factionReputationColor } from '@/lib/statusMaps'
import { entityAccentColor } from '@/utils/pickGradient'

const REPUTATION_ORDER: FactionReputation[] = ['hostile', 'unfriendly', 'neutral', 'friendly', 'allied']

function reputationIndex(rep: FactionReputation): number {
  return REPUTATION_ORDER.indexOf(rep) + 1
}

function pipColor(faction: Faction, i: number): string {
  const color = factionReputationColor[faction.reputation]
  const idx = reputationIndex(faction.reputation)
  if (i < idx) return color
  if (i === idx) return `rgb(from ${color} r g b / 0.42)`
  return 'var(--surface-3)'
}

interface Props {
  factions: Faction[]
  npcs?: Npc[]
}

export function FactionSplitView({ factions, npcs = [] }: Props) {
  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState<string>(factions[0]?.id ?? '')
  const selected = factions.find(f => f.id === selectedId) ?? factions[0] ?? null

  if (factions.length === 0) return null

  const accent = selected ? entityAccentColor(selected.id) : 'var(--violet)'
  const repColor = selected ? factionReputationColor[selected.reputation] : 'var(--muted)'
  const members = selected ? npcs.filter(n => n.faction_id === selected.id) : []

  return (
    <div className="party-split" role="region" aria-label="Factie-overzicht">
      {/* LEFT — list */}
      <ul
        className="party-split-list"
        role="listbox"
        aria-label="Facties"
        aria-orientation="vertical"
      >
        {factions.map((f) => {
          const acc = entityAccentColor(f.id)
          const isSel = f.id === selectedId
          const stColor = factionReputationColor[f.reputation]
          return (
            <li
              key={f.id}
              role="option"
              aria-selected={isSel}
            >
              <button
                className={`party-split-row${isSel ? ' is-selected' : ''}`}
                style={{ '--accent': acc } as React.CSSProperties}
                onClick={() => setSelectedId(f.id)}
                aria-label={`${f.name}, ${factionReputationLabel[f.reputation]}`}
              >
                <div className="party-split-row-stripe" aria-hidden="true" />
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: acc,
                  background: `rgb(from ${acc} r g b / 0.12)`,
                  border: `1px solid rgb(from ${acc} r g b / 0.28)`,
                }} aria-hidden="true">
                  {f.name[0]?.toUpperCase()}
                </div>
                <div className="party-split-row-body">
                  <div className="party-split-row-top">
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{f.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 3, marginTop: 6 }}>
                    {[1,2,3,4,5].map((i) => (
                      <div key={i} style={{ width: 16, height: 4, borderRadius: 2, background: pipColor(f, i), transition: 'background 300ms' }} aria-hidden="true" />
                    ))}
                  </div>
                  <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', color: stColor, marginTop: 3 }}>
                    {factionReputationLabel[f.reputation]}
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
          {/* Header — not aria-hidden; contains the navigation button */}
          <div
            className="party-split-portrait"
            style={{ '--accent': accent } as React.CSSProperties}
          >
            <div aria-hidden="true" style={{
              position: 'absolute', inset: 0,
              background: `linear-gradient(135deg, rgb(from ${accent} r g b / 0.18) 0%, var(--void) 100%)`,
            }} />
            <div className="party-split-portrait-scrim" aria-hidden="true" />
            <div aria-hidden="true" style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -60%)',
              fontFamily: 'var(--font-display)', fontSize: 110, fontWeight: 700,
              color: accent, opacity: 0.1, pointerEvents: 'none', lineHeight: 1, userSelect: 'none',
            }}>
              {selected.name[0]?.toUpperCase()}
            </div>
            <button
              className="char-portal-btn"
              onClick={() => navigate(`/factions/${selected.id}`)}
              aria-label={`Volledige factie-pagina van ${selected.name} openen`}
            >
              <span className="char-portal-btn-label" aria-hidden="true">Toon factie</span>
              <span className="char-portal-btn-icon" aria-hidden="true">→</span>
            </button>
            <div className="party-split-portrait-badge" aria-hidden="true">
              <span style={{
                fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.12em',
                padding: '3px 9px', borderRadius: 'var(--r-full)',
                background: `rgb(from ${accent} r g b / 0.18)`,
                border: `1px solid rgb(from ${accent} r g b / 0.4)`,
                color: accent, textTransform: 'uppercase',
              }}>
                {factionReputationLabel[selected.reputation]}
              </span>
            </div>
          </div>

          <div className="party-split-detail-body">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink)', margin: 0 }}>
              {selected.name}
            </h3>
            {selected.motto && (
              <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                "{selected.motto}"
              </div>
            )}

            {/* Standing track */}
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)' }}>Houding</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: repColor }}>
                  {factionReputationLabel[selected.reputation]}
                </span>
              </div>
              <div className="faction-standing-track" aria-label={`Reputatie: ${factionReputationLabel[selected.reputation]}`}>
                {[1,2,3,4,5].map((i) => (
                  <div key={i} className="faction-standing-pip" style={{ background: pipColor(selected, i) }} aria-hidden="true" />
                ))}
              </div>
              <div className="faction-standing-labels" aria-hidden="true">
                {['Vijandig', '', 'Neutraal', '', 'Trouw'].map((t, i) => (
                  <span key={i} style={{ fontSize: 8, color: 'var(--subtle)', fontFamily: 'var(--font-mono)' }}>{t}</span>
                ))}
              </div>
            </div>

            {/* Body: description + members — stacks on narrow, side-by-side on wide */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 20, marginTop: 20 }}
              className="faction-detail-body-grid">
              <div>
                {selected.description && (
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>
                      Beschrijving
                    </div>
                    <p style={{
                      fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic',
                      fontSize: 14, lineHeight: 1.75, color: 'var(--ink-soft)',
                      borderLeft: `2px solid ${accent}`, paddingLeft: 14, margin: 0,
                    }}>
                      "{selected.description}"
                    </p>
                  </div>
                )}
                {selected.goals && (
                  <div style={{ marginTop: selected.description ? 16 : 0 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>
                      Doelen
                    </div>
                    <p style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--ink-soft)', margin: 0 }}>
                      {selected.goals}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>
                  Leden · {members.length}
                </div>
                {members.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {members.slice(0, 8).map((m) => (
                      <button
                        key={m.id}
                        onClick={() => navigate(`/npcs/${m.id}`)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '7px 10px', background: 'var(--void-2)',
                          borderRadius: 'var(--r-sm)', border: '1px solid var(--hairline)',
                          cursor: 'pointer', width: '100%', textAlign: 'left',
                          transition: 'border-color 150ms',
                        }}
                        aria-label={`Open NPC ${m.name}`}
                      >
                        <div style={{
                          width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'var(--font-display)', fontSize: 10, color: accent,
                          background: `rgb(from ${accent} r g b / 0.12)`,
                          border: `1px solid rgb(from ${accent} r g b / 0.26)`,
                        }} aria-hidden="true">
                          {m.name[0]?.toUpperCase()}
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {m.name.split(' ')[0]}
                        </div>
                      </button>
                    ))}
                    {members.length > 8 && (
                      <div style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'center', paddingTop: 4 }}>
                        +{members.length - 8} meer
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: 'var(--subtle)', fontStyle: 'italic' }}>Geen bekende leden</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

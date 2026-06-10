import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Npc } from '@/types/npc.types'
import type { Faction } from '@/types/faction.types'

type Mood = 'ally' | 'neutral' | 'uncertain' | 'hostile' | 'dangerous'

interface MoodMeta { color: string; label: string; glyph: string }

const MOOD_META: Record<Mood, MoodMeta> = {
  ally:      { color: 'var(--teal)',    label: 'Bondgenoot', glyph: '✓' },
  neutral:   { color: 'var(--muted)',   label: 'Neutraal',   glyph: '·' },
  uncertain: { color: 'var(--gold)',    label: 'Onzeker',    glyph: '?' },
  hostile:   { color: 'var(--crimson)', label: 'Vijand',     glyph: '✗' },
  dangerous: { color: 'var(--crimson)', label: 'Gevaarlijk', glyph: '☠' },
}

function statusToMood(status: Npc['status']): Mood {
  switch (status) {
    case 'active':   return 'ally'
    case 'retired':  return 'uncertain'
    case 'archived': return 'hostile'
    default:         return 'neutral'
  }
}

interface Props {
  npcs: Npc[]
  factions?: Faction[]
}

export function NpcSplitView({ npcs, factions = [] }: Props) {
  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState<string>(npcs[0]?.id ?? '')
  const selected = npcs.find(n => n.id === selectedId) ?? npcs[0] ?? null

  if (npcs.length === 0) return null

  return (
    <div className="party-split" role="region" aria-label="NPC-overzicht">
      {/* LEFT — list */}
      <ul
        className="party-split-list"
        role="listbox"
        aria-label="NPC's"
        aria-orientation="vertical"
      >
        {npcs.map((n) => {
          const mood = MOOD_META[statusToMood(n.status)]
          const isSel = n.id === selectedId
          const faction = n.faction_id ? factions.find(f => f.id === n.faction_id) : null
          return (
            <li
              key={n.id}
              role="option"
              aria-selected={isSel}
            >
              <button
                className={`npc-split-row${isSel ? ' is-selected' : ''}`}
                style={{ '--mood-color': mood.color } as React.CSSProperties}
                onClick={() => setSelectedId(n.id)}
                aria-label={`${n.name}${n.npc_role ? `, ${n.npc_role}` : ''}`}
              >
                <div className="npc-split-mood-bar" aria-hidden="true" />
                <div className="npc-split-av" aria-hidden="true">
                  <div className="npc-split-av-img">
                    <span style={{ color: mood.color }}>{n.name[0]?.toUpperCase()}</span>
                  </div>
                  <div className="npc-mood-dot" aria-hidden="true">{mood.glyph}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{n.name}</div>
                  {n.npc_role && (
                    <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{n.npc_role}</div>
                  )}
                  {faction && (
                    <div style={{ marginTop: 2, fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', color: 'var(--violet)' }}>
                      ◆ {faction.name}
                    </div>
                  )}
                </div>
              </button>
            </li>
          )
        })}
      </ul>

      {/* RIGHT — detail */}
      {selected && (() => {
        const mood = MOOD_META[statusToMood(selected.status)]
        const faction = selected.faction_id ? factions.find(f => f.id === selected.faction_id) : null
        return (
          <div className="party-split-detail fade-in" key={selected.id}>
            <div
              className="party-split-portrait"
              style={{ '--mood-color': mood.color } as React.CSSProperties}
              aria-hidden="true"
            >
              <div style={{
                position: 'absolute', inset: 0,
                background: `linear-gradient(135deg, color-mix(in oklab, ${mood.color} 14%, var(--void-2)) 0%, var(--void-2) 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontSize: 80, fontWeight: 700,
                color: mood.color, opacity: 0.25,
              }}>
                {selected.name[0]?.toUpperCase()}
              </div>
              <div className="party-split-portrait-scrim" />
              <button
                className="char-portal-btn"
                onClick={() => navigate(`/npcs/${selected.id}`)}
                aria-label={`Volledige NPC-pagina van ${selected.name} openen`}
              >
                <span className="char-portal-btn-label">Toon NPC</span>
                <span className="char-portal-btn-icon" aria-hidden="true">→</span>
              </button>
              <div className="party-split-portrait-badge">
                <span style={{
                  fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.12em',
                  padding: '3px 9px', borderRadius: 'var(--r-full)',
                  background: `color-mix(in oklab, ${mood.color} 18%, transparent)`,
                  border: `1px solid color-mix(in oklab, ${mood.color} 40%, transparent)`,
                  color: mood.color, textTransform: 'uppercase',
                }}>
                  {mood.label}
                </span>
              </div>
            </div>

            <div className="party-split-detail-body">
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink)', margin: 0 }}>
                {selected.name}
              </h3>
              {selected.npc_role && (
                <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 4 }}>{selected.npc_role}</div>
              )}

              {selected.description && (
                <p style={{
                  fontSize: 14, lineHeight: 1.7, color: 'var(--ink-soft)',
                  borderLeft: `2px solid ${mood.color}`, paddingLeft: 14,
                  margin: '16px 0 0',
                  fontStyle: 'italic',
                }}>
                  "{selected.description}"
                </p>
              )}

              {faction && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', marginTop: 14,
                  background: 'var(--void-2)', borderRadius: 'var(--r-sm)',
                  border: '1px solid var(--hairline)',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--violet)',
                    background: 'rgb(var(--violet-rgb) / 0.14)',
                    border: '1px solid rgb(var(--violet-rgb) / 0.28)',
                  }}>
                    {faction.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Factie</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--violet)', marginTop: 2 }}>{faction.name}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })()}
    </div>
  )
}

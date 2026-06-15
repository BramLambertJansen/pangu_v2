import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Character } from '@/types/character.types'
import type { Item } from '@/types/item.types'
import { pickCharacterAccent } from '@/utils/pickGradient'
import { sanitizeImageUrl } from '@/utils/sanitizeUrl'
import { EQUIPMENT_SLOT_LABELS } from '@/utils/equipmentUtils'
import type { EquipmentSlot } from '@/types/item.types'
import { ABILITY_SCORES, SPELL_LEVELS, formatModifier } from '@/utils/dnd5e'

interface Props {
  character: Character
  items: Item[]
}

const SAVING_THROW_KEYS: Record<string, string> = Object.fromEntries(
  ABILITY_SCORES.map(a => [a.key, a.abbr])
)


function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      margin: '0 0 8px',
      fontSize: 9,
      fontWeight: 700,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: 'var(--muted)',
      fontFamily: 'var(--font-body)',
    }}>
      {children}
    </p>
  )
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--hairline)', margin: '14px 0' }} />
}

export const DmCharacterPanel = memo(function DmCharacterPanel({ character, items }: Props) {
  const navigate = useNavigate()
  const accent = pickCharacterAccent(character.id)
  const portraitUrl = sanitizeImageUrl(character.portrait_url)

  const hpPct = character.hp_max > 0 ? Math.min(100, Math.round((character.hp_current / character.hp_max) * 100)) : 0
  const hpLow = character.hp_current < character.hp_max * 0.3

  const raceClass = [character.character_race, character.character_class, character.character_subclass]
    .filter(Boolean).join(' · ')

  const saveProficiencies = (character.saving_throw_proficiencies ?? [])
    .map(k => SAVING_THROW_KEYS[k])
    .filter(Boolean)

  const hasSpells = SPELL_LEVELS.some(l => (character.spell_slots?.[l]?.max ?? 0) > 0)
  const hasResources = Object.keys(character.class_resources ?? {}).length > 0
  const hasConditions = (character.active_conditions ?? []).length > 0

  const equippedItems = items.filter(i => i.equipped_slot)
  const unequippedItems = items.filter(i => !i.equipped_slot)

  const hasCoin = character.gold > 0 || character.silver > 0 || character.copper > 0
    || character.platinum > 0 || character.electrum > 0

  return (
    <div
      role="region"
      aria-label={`DM-overzicht: ${character.name}`}
      style={{
        background: 'var(--surface)',
        borderRadius: 'var(--r-xl)',
        border: `1px solid ${accent}55`,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* ── Header ── */}
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'stretch',
        gap: 0,
        minHeight: 110,
        background: 'var(--surface-2)',
        borderBottom: '1px solid var(--hairline)',
      }}>
        {/* Portrait */}
        <div style={{
          width: 110,
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden',
          background: portraitUrl
            ? 'var(--void)'
            : `linear-gradient(rgb(from ${accent} r g b / 0.15), rgb(from ${accent} r g b / 0.15)), var(--surface-2)`,
        }}>
          {portraitUrl && (
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
                objectPosition: character.portrait_position ?? 'center top',
              }}
            />
          )}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 0, right: 0, bottom: 0,
              width: 32,
              background: 'linear-gradient(to right, transparent, var(--surface-2))',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0, padding: '14px 50px 14px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
          {raceClass && (
            <p style={{
              margin: 0,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              fontFamily: 'var(--font-body)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {raceClass}
            </p>
          )}

          <h2 style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(16px, 2.4vw, 20px)',
            fontWeight: 700,
            color: 'var(--ink)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {character.name}
          </h2>

          {/* HP + AC + speed inline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 12, fontWeight: 700,
              color: hpLow ? 'var(--crimson)' : accent,
              fontFamily: 'var(--font-body)',
            }}>
              <svg aria-hidden="true" width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              {character.hp_current}/{character.hp_max}
              {character.temp_hp > 0 && (
                <span style={{ fontSize: 10, color: 'var(--azure)', fontWeight: 600 }}>
                  +{character.temp_hp}t
                </span>
              )}
            </span>

            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 12, fontWeight: 700, color: 'var(--muted)',
              fontFamily: 'var(--font-body)',
            }}>
              <svg aria-hidden="true" width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
              </svg>
              {character.armor_class}
            </span>

            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
              {character.speed}m
            </span>

            {character.inspiration && (
              <span style={{
                fontSize: 10, fontWeight: 700, color: 'var(--gold)',
                border: '1px solid rgb(var(--gold-rgb) / 0.4)',
                padding: '1px 7px', borderRadius: 'var(--r-full)',
                fontFamily: 'var(--font-body)',
              }}>
                Inspiratie
              </span>
            )}
          </div>
        </div>

        {/* Level badge */}
        <div
          aria-label={`Level ${character.level}`}
          style={{
            position: 'absolute',
            top: 10, right: 10,
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 9px',
            borderRadius: 'var(--r-full)',
            border: '1.5px solid var(--gold)',
            background: 'rgb(var(--void-rgb) / 0.85)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <svg aria-hidden="true" width="9" height="9" viewBox="0 0 24 24" fill="var(--gold)">
            <path d="M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z" />
          </svg>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gold)', fontFamily: 'var(--font-body)' }}>
            LV {character.level}
          </span>
        </div>

        {/* Link to full character sheet */}
        <button
          type="button"
          aria-label={`Volledig karakterblad van ${character.name}`}
          onClick={() => navigate(`/characters/${character.id}`)}
          style={{
            position: 'absolute',
            bottom: 10, right: 10,
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 8px',
            borderRadius: 'var(--r-full)',
            border: '1px solid var(--hairline)',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            fontFamily: 'var(--font-body)',
            transition: 'color var(--t-fast), border-color var(--t-fast)',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget
            el.style.color = 'var(--ink)'
            el.style.borderColor = 'var(--hairline-strong)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget
            el.style.color = 'var(--muted)'
            el.style.borderColor = 'var(--hairline)'
          }}
        >
          Volledig blad
          <svg aria-hidden="true" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </button>
      </div>

      {/* ── Scrollable content ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 20px' }}>

        {/* HP bar */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
            <SectionHeading>Levenspunten</SectionHeading>
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: hpLow ? 'var(--crimson)' : 'var(--ink)',
              fontFamily: 'var(--font-body)',
            }}>
              {character.hp_current} / {character.hp_max}
              {character.temp_hp > 0 && ` (+${character.temp_hp})`}
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={character.hp_current}
            aria-valuemin={0}
            aria-valuemax={character.hp_max}
            style={{ height: 7, borderRadius: 4, background: 'var(--hairline)', overflow: 'hidden' }}
          >
            <div style={{
              height: '100%',
              width: `${hpPct}%`,
              borderRadius: 4,
              background: hpLow
                ? 'var(--crimson)'
                : hpPct < 60
                  ? 'var(--gold)'
                  : 'var(--teal)',
              transition: 'width 0.4s var(--ease-out)',
            }} />
          </div>

          {/* Death saves (only show if HP = 0 or very low) */}
          {character.hp_current === 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--teal)', fontFamily: 'var(--font-body)' }}>Slagen</span>
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: i < character.death_save_successes ? 'var(--teal)' : 'var(--hairline)',
                    border: '1px solid var(--hairline-strong)',
                  }} />
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--crimson)', fontFamily: 'var(--font-body)' }}>Mislukt</span>
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: i < character.death_save_failures ? 'var(--crimson)' : 'var(--hairline)',
                    border: '1px solid var(--hairline-strong)',
                  }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Key stats row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 6,
          marginBottom: 14,
        }}>
          {[
            { label: 'AC', value: character.armor_class },
            { label: 'Snelheid', value: `${character.speed}m` },
            { label: 'Initiatief', value: character.initiative >= 0 ? `+${character.initiative}` : `${character.initiative}` },
            { label: 'Prof. bonus', value: `+${character.proficiency_bonus}` },
          ].map(stat => (
            <div key={stat.label} style={{
              background: 'var(--surface-2)',
              borderRadius: 8,
              padding: '7px 6px',
              textAlign: 'center',
              border: '1px solid var(--hairline)',
            }}>
              <p style={{ margin: '0 0 2px', fontSize: 8, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
                {stat.label}
              </p>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
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
            const score = character[key]
            const hasSave = character.saving_throw_proficiencies?.includes(key)
            return (
              <div key={key} style={{
                background: 'var(--surface-2)',
                borderRadius: 8,
                padding: '7px 4px',
                textAlign: 'center',
                border: `1px solid ${hasSave ? `${accent}55` : 'var(--hairline)'}`,
                position: 'relative',
              }}>
                {hasSave && (
                  <div aria-hidden="true" style={{
                    position: 'absolute', top: 3, right: 4,
                    width: 5, height: 5, borderRadius: '50%',
                    background: accent,
                  }} />
                )}
                <p style={{ margin: '0 0 2px', fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
                  {abbr}
                </p>
                <p style={{ margin: '0 0 1px', fontSize: 16, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                  {score}
                </p>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: accent, fontFamily: 'var(--font-body)' }}>
                  {formatModifier(score)}
                </p>
              </div>
            )
          })}
        </div>

        {/* Saving throws summary */}
        {saveProficiencies.length > 0 && (
          <p style={{ margin: '0 0 14px', fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
            <span style={{ fontWeight: 700, color: 'var(--ink)' }}>Reddingsgooien: </span>
            {saveProficiencies.join(', ')}
          </p>
        )}

        {/* Concentration */}
        {character.concentrating && character.concentration_spell && (
          <>
            <Divider />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 'var(--r-full)',
                border: '1px solid rgb(var(--violet-rgb) / 0.4)',
                background: 'rgb(var(--violet-rgb) / 0.08)',
                fontSize: 11, fontWeight: 700, color: 'var(--violet)',
                fontFamily: 'var(--font-body)',
              }}>
                <svg aria-hidden="true" width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z" />
                </svg>
                Concentratie: {character.concentration_spell}
              </span>
            </div>
          </>
        )}

        {/* Active conditions */}
        {hasConditions && (
          <>
            <Divider />
            <SectionHeading>Condities</SectionHeading>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
              {character.active_conditions.map(c => (
                <span key={c} style={{
                  padding: '3px 9px', borderRadius: 'var(--r-full)',
                  border: '1px solid rgb(var(--crimson-rgb) / 0.4)',
                  background: 'rgb(var(--crimson-rgb) / 0.10)',
                  fontSize: 10, fontWeight: 700, color: 'var(--crimson)',
                  fontFamily: 'var(--font-body)',
                  textTransform: 'capitalize',
                }}>
                  {c}
                </span>
              ))}
            </div>
          </>
        )}

        {/* Spell slots */}
        {hasSpells && (
          <>
            <Divider />
            <SectionHeading>Spreukslots</SectionHeading>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              {SPELL_LEVELS.map(level => {
                const slot = character.spell_slots?.[level]
                if (!slot || slot.max === 0) return null
                return (
                  <div key={level} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{
                      fontSize: 9, fontWeight: 700, color: 'var(--muted)',
                      fontFamily: 'var(--font-body)', width: 12,
                    }}>
                      {level}
                    </span>
                    <div style={{ display: 'flex', gap: 3 }}>
                      {Array.from({ length: slot.max }, (_, i) => (
                        <div key={i} style={{
                          width: 9, height: 9, borderRadius: '50%',
                          background: i < slot.current ? 'var(--violet)' : 'transparent',
                          border: `1.5px solid ${i < slot.current ? 'var(--violet)' : 'var(--hairline-strong)'}`,
                        }} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Class resources */}
        {hasResources && (
          <>
            <Divider />
            <SectionHeading>Klasseresources</SectionHeading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
              {Object.entries(character.class_resources).map(([name, res]) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 600, color: 'var(--ink)',
                    fontFamily: 'var(--font-body)', minWidth: 90,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {name}
                  </span>
                  <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    {Array.from({ length: Math.min(res.max, 20) }, (_, i) => (
                      <div key={i} style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: i < res.current ? accent : 'transparent',
                        border: `1.5px solid ${i < res.current ? accent : 'var(--hairline-strong)'}`,
                      }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-body)', marginLeft: 'auto' }}>
                    {res.current}/{res.max}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Equipment */}
        {items.length > 0 && (
          <>
            <Divider />
            <SectionHeading>Uitrusting & Inventaris</SectionHeading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
              {equippedItems.map(item => (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '5px 9px', borderRadius: 8,
                  background: `linear-gradient(rgb(from ${accent} r g b / 0.06), rgb(from ${accent} r g b / 0.06)), var(--surface-2)`,
                  border: `1px solid ${accent}33`,
                }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-body)' }}>
                    {item.name}
                  </span>
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
                    {EQUIPMENT_SLOT_LABELS[item.equipped_slot as EquipmentSlot] ?? item.equipped_slot}
                  </span>
                </div>
              ))}
              {unequippedItems.map(item => (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '4px 9px', borderRadius: 8,
                  background: 'var(--surface-2)',
                  border: '1px solid var(--hairline)',
                }}>
                  <span style={{ fontSize: 11, color: 'var(--ink-soft)', fontFamily: 'var(--font-body)' }}>
                    {item.name}
                  </span>
                  {item.quantity > 1 && (
                    <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
                      ×{item.quantity}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Coins */}
        {hasCoin && (
          <>
            {items.length === 0 && <Divider />}
            <SectionHeading>Beurs</SectionHeading>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              {character.platinum > 0 && (
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--azure)', fontFamily: 'var(--font-body)' }}>
                  {character.platinum}<span style={{ fontSize: 9, color: 'var(--muted)' }}> pt</span>
                </span>
              )}
              {character.gold > 0 && (
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', fontFamily: 'var(--font-body)' }}>
                  {character.gold}<span style={{ fontSize: 9, color: 'var(--muted)' }}> gs</span>
                </span>
              )}
              {character.electrum > 0 && (
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--teal)', fontFamily: 'var(--font-body)' }}>
                  {character.electrum}<span style={{ fontSize: 9, color: 'var(--muted)' }}> el</span>
                </span>
              )}
              {character.silver > 0 && (
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-soft)', fontFamily: 'var(--font-body)' }}>
                  {character.silver}<span style={{ fontSize: 9, color: 'var(--muted)' }}> zs</span>
                </span>
              )}
              {character.copper > 0 && (
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
                  {character.copper}<span style={{ fontSize: 9, color: 'var(--subtle)' }}> ks</span>
                </span>
              )}
            </div>
          </>
        )}

        {/* Private notes */}
        {character.notes && (
          <>
            <Divider />
            <SectionHeading>Notities</SectionHeading>
            <p style={{
              margin: 0,
              fontSize: 12,
              color: 'var(--ink-soft)',
              fontFamily: 'var(--font-body)',
              lineHeight: 1.6,
              fontStyle: 'italic',
              whiteSpace: 'pre-wrap',
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {character.notes}
            </p>
          </>
        )}
      </div>
    </div>
  )
})

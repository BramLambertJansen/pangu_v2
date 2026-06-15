import {
  useToggleCharacterInspiration,
  useUpdateCharacterDeathSaves,
  useToggleCharacterCondition,
  useUpdateCharacterClassResource,
} from '@/hooks/queries/useCharacter'
import {
  ABILITY_SCORES, D5E_SAVING_THROWS as SAVING_THROWS,
  D5E_CONDITIONS as CONDITIONS, formatModifier,
} from '@/utils/dnd5e'
import type { EffectiveStats } from '@/utils/equipmentUtils'
import type { Character, ClassResources } from '@/types/character.types'

interface Props {
  character: Character
  eff: EffectiveStats
}

export function CharacterStatsTab({ character, eff }: Props) {
  const profBonus      = character.proficiency_bonus ?? 2
  const isInspired     = character.inspiration ?? false
  const exhaustion     = character.exhaustion ?? 0
  const hitDie         = character.hit_die ?? 'd8'
  const hitDiceCurrent = character.hit_dice_current ?? 1
  const deathSuccesses = character.death_save_successes ?? 0
  const deathFailures  = character.death_save_failures ?? 0
  const hpCurrent      = character.hp_current ?? 0
  const activeConditions = character.active_conditions ?? []
  const classResources   = (character.class_resources ?? {}) as ClassResources

  const wisMod = Math.floor((eff.wis - 10) / 2)
  const intMod = Math.floor((eff.int - 10) / 2)
  const passivePerception    = 10 + wisMod + ((character.proficient_skills ?? []).includes('Waarneming') ? profBonus : 0) + (eff.skillBonuses['Waarneming'] ?? 0)
  const passiveInvestigation = 10 + intMod + ((character.proficient_skills ?? []).includes('Onderzoek')  ? profBonus : 0) + (eff.skillBonuses['Onderzoek']  ?? 0)
  const passiveInsight       = 10 + wisMod + ((character.proficient_skills ?? []).includes('Inzicht')    ? profBonus : 0) + (eff.skillBonuses['Inzicht']    ?? 0)

  const toggleInspiration  = useToggleCharacterInspiration(character.id)
  const updateDeathSaves   = useUpdateCharacterDeathSaves(character.id)
  const toggleCondition    = useToggleCharacterCondition(character.id)
  const updateClassResource = useUpdateCharacterClassResource(character.id)

  return (
    <div id="tabpanel-stats" role="tabpanel" aria-labelledby="tab-stats">

      {/* Ability scores */}
      <div className="char-ability-grid">
        {ABILITY_SCORES.map(({ key, abbr, label }) => {
          const baseScore = character[key] as number
          const effKey = key.replace('stat_', '') as 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
          const effectiveScore = eff[effKey]
          const bonus = effectiveScore - baseScore
          const mod = formatModifier(effectiveScore)
          const isSaveProficient = (character.saving_throw_proficiencies ?? []).includes(label)
          return (
            <div
              key={key}
              title={label}
              style={{
                background: 'var(--surface)',
                borderRadius: 14,
                border: `1px solid ${isSaveProficient ? 'rgb(var(--gold-rgb) / 0.35)' : 'var(--hairline)'}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                paddingTop: 16, paddingBottom: 14,
                position: 'relative', overflow: 'hidden',
                textAlign: 'center',
              }}
            >
              <div aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: isSaveProficient ? 'var(--gold)' : 'var(--violet)' }} />
              <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                {abbr}
              </p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 700, color: 'var(--gold)', margin: '0 0 8px', lineHeight: 1 }}>
                {mod}
              </p>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: isSaveProficient || bonus !== 0 ? 6 : 0 }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700, color: 'var(--ink-soft)' }}>{effectiveScore}</span>
              </div>
              {bonus !== 0 && (
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--teal)', marginBottom: isSaveProficient ? 4 : 0 }}>
                  {bonus > 0 ? `+${bonus}` : bonus}
                </span>
              )}
              {isSaveProficient && (
                <p style={{ margin: 0, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)' }}>
                  SAVE PROF
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Inspiratie / Trefferdobbelstenen / Uitputting */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
        <button
          type="button"
          aria-pressed={isInspired}
          aria-label={isInspired ? 'Inspiratie actief — klik om te verwijderen' : 'Geen inspiratie — klik om toe te voegen'}
          onClick={() => toggleInspiration.mutate(!isInspired)}
          disabled={toggleInspiration.isPending}
          className="surface"
          style={{
            padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: 12,
            cursor: 'pointer', textAlign: 'left',
            background: isInspired ? 'rgb(var(--gold-rgb) / 0.08)' : undefined,
            borderColor: isInspired ? 'rgb(var(--gold-rgb) / 0.35)' : undefined,
            transition: 'background var(--t-fast), border-color var(--t-fast)',
            border: `1px solid ${isInspired ? 'rgb(var(--gold-rgb) / 0.35)' : 'var(--hairline)'}`,
          }}
        >
          <span aria-hidden="true" style={{ fontSize: 22, color: isInspired ? 'var(--gold)' : 'var(--muted)' }}>
            {isInspired ? '✦' : '✧'}
          </span>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: isInspired ? 'var(--gold)' : 'var(--muted)', margin: '0 0 3px' }}>Inspiratie</p>
            <p style={{ fontSize: 14, fontWeight: isInspired ? 700 : 400, color: isInspired ? 'var(--gold)' : 'var(--ink-soft)', margin: 0 }}>
              {isInspired ? 'Geïnspireerd' : 'Geen'}
            </p>
          </div>
        </button>

        <div className="surface" style={{ padding: '16px 20px' }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 8px' }}>
            Trefferdobbelstenen
          </p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--ink)', margin: '0 0 4px', lineHeight: 1 }}>
            {hitDiceCurrent}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--muted)' }}>/{character.level} {hitDie}</span>
          </p>
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 4 }}>
            {Array.from({ length: Math.min(character.level, 20) }, (_, i) => (
              <div
                key={i}
                aria-hidden="true"
                style={{
                  width: character.level > 12 ? 6 : 8,
                  height: character.level > 12 ? 6 : 8,
                  borderRadius: 2,
                  background: i < hitDiceCurrent ? 'var(--teal)' : 'var(--hairline)',
                }}
              />
            ))}
          </div>
        </div>

        {exhaustion > 0 && (
          <div className="surface" style={{ padding: '16px 20px', borderColor: exhaustion >= 5 ? 'rgb(var(--crimson-rgb) / 0.3)' : 'rgb(var(--gold-rgb) / 0.25)', background: exhaustion >= 5 ? 'rgb(var(--crimson-rgb) / 0.04)' : 'rgb(var(--gold-rgb) / 0.04)' }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: exhaustion >= 5 ? 'var(--crimson)' : 'var(--gold)', margin: '0 0 4px' }}>Uitputting</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, color: exhaustion >= 5 ? 'var(--crimson)' : 'var(--gold)', margin: '0 0 4px', lineHeight: 1 }}>
              {exhaustion}<span style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 400 }}>/10</span>
            </p>
            <p style={{ fontSize: 11, color: exhaustion >= 5 ? 'var(--crimson)' : 'var(--gold)', margin: 0 }}>
              {exhaustion === 10 ? 'Dood' : `−${exhaustion * 2} op d20-gooien`}
            </p>
          </div>
        )}
      </div>

      {/* Stervensgooien (bij 0 HP) */}
      {hpCurrent === 0 && (
        <div className="surface" style={{ padding: 20, marginBottom: 16, borderColor: 'rgb(var(--crimson-rgb) / 0.3)', background: 'rgb(var(--crimson-rgb) / 0.04)' }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--crimson)', margin: '0 0 14px' }}>
            Stervensgooien
          </p>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: 11, color: 'var(--teal)', fontWeight: 600, margin: '0 0 8px' }}>Successen</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 3].map(n => {
                  const filled = deathSuccesses >= n
                  return (
                    <button
                      key={n}
                      type="button"
                      aria-label={`Succes ${n}: ${filled ? 'geslaagd' : 'leeg'}`}
                      onClick={() => updateDeathSaves.mutate({ successes: filled ? n - 1 : n, failures: deathFailures })}
                      disabled={updateDeathSaves.isPending}
                      style={{
                        width: 36, height: 36, borderRadius: 8,
                        border: filled ? '2px solid rgb(var(--teal-rgb) / 0.6)' : '2px solid var(--hairline-strong)',
                        background: filled ? 'rgb(var(--teal-rgb) / 0.15)' : 'var(--surface)',
                        cursor: 'pointer', fontSize: 16,
                        color: filled ? 'var(--teal)' : 'var(--muted)',
                        transition: 'all var(--t-fast)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {filled ? '✓' : '○'}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <p style={{ fontSize: 11, color: 'var(--crimson)', fontWeight: 600, margin: '0 0 8px' }}>Mislukkingen</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 3].map(n => {
                  const filled = deathFailures >= n
                  return (
                    <button
                      key={n}
                      type="button"
                      aria-label={`Mislukking ${n}: ${filled ? 'mislukt' : 'leeg'}`}
                      onClick={() => updateDeathSaves.mutate({ successes: deathSuccesses, failures: filled ? n - 1 : n })}
                      disabled={updateDeathSaves.isPending}
                      style={{
                        width: 36, height: 36, borderRadius: 8,
                        border: filled ? '2px solid rgb(var(--crimson-rgb) / 0.5)' : '2px solid var(--hairline-strong)',
                        background: filled ? 'rgb(var(--crimson-rgb) / 0.12)' : 'var(--surface)',
                        cursor: 'pointer', fontSize: 16,
                        color: filled ? 'var(--crimson)' : 'var(--muted)',
                        transition: 'all var(--t-fast)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {filled ? '✕' : '○'}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Passieve stats */}
      <div className="surface" style={{ padding: '14px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Passieve Waarneming',   value: passivePerception    },
            { label: 'Passieve Onderzoek',    value: passiveInvestigation },
            { label: 'Passief Inzicht',       value: passiveInsight       },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, letterSpacing: '0.08em' }}>{label}</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>{value}</span>
            </div>
          ))}
          {(character.darkvision ?? 0) > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, letterSpacing: '0.08em' }}>Duisterzicht</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>{character.darkvision} ft</span>
            </div>
          )}
        </div>
        {character.special_senses && (
          <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 8, marginBottom: 0 }}>
            {character.special_senses}
          </p>
        )}
      </div>

      {/* Condities */}
      <div className="surface" style={{ padding: '16px 20px', marginBottom: 16 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 10px' }}>Condities</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {CONDITIONS.map(cond => {
            const active = activeConditions.includes(cond)
            return (
              <button
                key={cond}
                type="button"
                aria-pressed={active}
                onClick={() => toggleCondition.mutate({ condition: cond, currentConditions: character.active_conditions ?? [] })}
                disabled={toggleCondition.isPending}
                style={{
                  fontSize: 11, padding: '4px 10px', borderRadius: 999, cursor: 'pointer',
                  border: active ? '1px solid rgb(var(--crimson-rgb) / 0.5)' : '1px solid var(--hairline)',
                  background: active ? 'rgb(var(--crimson-rgb) / 0.12)' : 'var(--surface)',
                  color: active ? 'var(--crimson)' : 'var(--muted)',
                  fontWeight: active ? 700 : 400,
                  transition: 'all var(--t-fast)',
                }}
              >
                {cond}
              </button>
            )
          })}
        </div>
      </div>

      {/* Klasseresources */}
      {Object.keys(classResources).length > 0 && (
        <div className="surface" style={{ padding: '16px 20px', marginBottom: 16 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 12px' }}>Klasseresources</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {Object.entries(classResources).map(([name, res]) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--hairline)' }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 2px' }}>{name}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button type="button" aria-label={`${name} verlagen`} onClick={() => updateClassResource.mutate({ name, current: res.current - 1, currentResources: character.class_resources ?? {} as ClassResources })} disabled={updateClassResource.isPending || res.current <= 0} style={{ width: 20, height: 20, borderRadius: '50%', border: '1px solid var(--hairline)', background: 'none', color: 'var(--muted)', cursor: res.current <= 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, opacity: res.current <= 0 ? 0.4 : 1 }}>−</button>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--teal)', minWidth: 28, textAlign: 'center' }}>{res.current}</span>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>/{res.max}</span>
                    <button type="button" aria-label={`${name} verhogen`} onClick={() => updateClassResource.mutate({ name, current: res.current + 1, currentResources: character.class_resources ?? {} as ClassResources })} disabled={updateClassResource.isPending || res.current >= res.max} style={{ width: 20, height: 20, borderRadius: '50%', border: '1px solid var(--hairline)', background: 'none', color: 'var(--muted)', cursor: res.current >= res.max ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, opacity: res.current >= res.max ? 0.4 : 1 }}>+</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reddingsgooien */}
      <div className="surface" style={{ padding: 24, marginBottom: 16 }}>
        <p className="pg-section-title" style={{ marginBottom: 16 }}>Reddingsgooien</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {SAVING_THROWS.map(({ label, abbr, statKey }) => {
            const score = eff[statKey.replace('stat_', '') as 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha']
            const mod = Math.floor((score - 10) / 2)
            const isProficient = (character.saving_throw_proficiencies ?? []).includes(label)
            const total = mod + (isProficient ? profBonus : 0)
            const totalLabel = total >= 0 ? `+${total}` : `${total}`
            return (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 12px', borderRadius: 8,
                background: isProficient ? 'rgb(var(--violet-rgb) / 0.08)' : 'var(--surface)',
                border: isProficient ? '1px solid rgb(var(--violet-rgb) / 0.25)' : '1px solid var(--hairline)',
              }}>
                <span aria-label={isProficient ? `${label}: vaardig` : `${label}: niet vaardig`} style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: isProficient ? 'var(--violet)' : 'transparent',
                  border: `2px solid ${isProficient ? 'var(--violet)' : 'var(--hairline-strong)'}`,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 11, color: 'var(--muted)', display: 'block', fontWeight: 700, letterSpacing: '0.08em' }}>{abbr}</span>
                  <span style={{ fontSize: 10, color: 'var(--subtle)' }}>{label}</span>
                </div>
                <span style={{
                  fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700,
                  color: isProficient ? 'var(--violet)' : 'var(--ink-soft)',
                }}>
                  {totalLabel}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Traits */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0 16px' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--hairline)' }} />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span aria-hidden="true" style={{ color: 'var(--gold)', fontSize: 12 }}>✦</span>Traits<span aria-hidden="true" style={{ color: 'var(--gold)', fontSize: 12 }}>✦</span>
          </span>
          <div style={{ flex: 1, height: 1, background: 'var(--hairline)' }} />
        </div>
        <div className="surface" style={{ padding: '18px 20px' }}>
          {character.description
            ? <p style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--ink-soft)', margin: 0, whiteSpace: 'pre-wrap' }}>{character.description}</p>
            : <p style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>Kenmerken worden hier weergegeven wanneer ze zijn toegevoegd.</p>
          }
        </div>
      </div>

      {/* Currency */}
      {(character.platinum > 0 || character.gold > 0 || character.electrum > 0 || character.silver > 0 || character.copper > 0) && (
        <div className="surface" style={{ padding: 24 }}>
          <p className="pg-section-title" style={{ marginBottom: 16 }}>Schatkist</p>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {[
              { label: 'Platina', value: character.platinum ?? 0, color: '#e5e7eb', suffix: 'pp' },
              { label: 'Goud',    value: character.gold,          color: 'var(--gold)', suffix: 'gp' },
              { label: 'Elektrum',value: character.electrum ?? 0, color: '#c0a060',  suffix: 'ep' },
              { label: 'Zilver',  value: character.silver,        color: 'var(--ink-soft)', suffix: 'sp' },
              { label: 'Koper',   value: character.copper,        color: '#b87333',  suffix: 'cp' },
            ].filter(c => c.value > 0).map(({ label, value, color, suffix }) => (
              <div key={label} style={{ textAlign: 'center', minWidth: 64 }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 4px' }}>{label}</p>
                <p style={{ fontSize: 22, fontWeight: 700, color, margin: 0, fontFamily: 'var(--font-display)' }}>
                  {value}<span style={{ fontSize: 11, opacity: 0.6, marginLeft: 2 }}>{suffix}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

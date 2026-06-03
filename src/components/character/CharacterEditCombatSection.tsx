import { useId } from 'react'
import { NumericField } from '@/components/character/CharacterEditHelpers'
import type { Character } from '@/types/character.types'

interface Props {
  form: Character
  set: (key: keyof Character, value: unknown) => void
}

export function CharacterEditCombatSection({ form, set }: Props) {
  const specialSensesId = useId()
  const isInspired = form.inspiration ?? false

  return (
    <>
      {/* ── Gevechtsstats ── */}
      <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
        <p className="pangu-section-title" style={{ marginBottom: 16 }}>Gevechtsstats</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NumericField
            id="char-hp-current"
            label="Huidige HP"
            value={form.hp_current ?? 10}
            onChange={(v) => set('hp_current', Math.max(0, v))}
          />
          <NumericField
            id="char-hp-max"
            label="Max HP"
            value={form.hp_max ?? 10}
            onChange={(v) => set('hp_max', Math.max(1, v))}
            min={1}
          />
          <NumericField
            id="char-ac"
            label="Wapenrusting (AC)"
            value={form.armor_class ?? 10}
            onChange={(v) => set('armor_class', Math.max(1, v))}
            min={1}
          />
          <NumericField
            id="char-speed"
            label="Snelheid (ft)"
            value={form.speed ?? 30}
            onChange={(v) => set('speed', Math.max(0, v))}
          />
          <NumericField
            id="char-initiative"
            label="Initiatief"
            value={form.initiative ?? 0}
            onChange={(v) => set('initiative', v)}
            min={-10}
            max={20}
          />
          <NumericField
            id="char-proficiency"
            label="Vaardigheidsbonus"
            value={form.proficiency_bonus ?? 2}
            onChange={(v) => set('proficiency_bonus', Math.max(0, v))}
          />
          <NumericField
            id="char-temp-hp"
            label="Tijdelijke HP"
            value={form.temp_hp ?? 0}
            onChange={(v) => set('temp_hp', Math.max(0, v))}
          />
        </div>
      </div>

      {/* ── Zintuigen & Alternatieve snelheden ── */}
      <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
        <p className="pangu-section-title" style={{ marginBottom: 4 }}>Zintuigen &amp; Alternatieve snelheden</p>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 20 }}>
          Vlieg-, zwem- en klimsnelheid worden apart bijgehouden; 0 = niet van toepassing.
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <NumericField id="char-darkvision"    label="Duisterzicht (ft)"  value={form.darkvision ?? 0}    onChange={(v) => set('darkvision',    Math.max(0, v))} />
          <NumericField id="char-fly-speed"     label="Vliegsnelheid (ft)" value={form.fly_speed ?? 0}     onChange={(v) => set('fly_speed',     Math.max(0, v))} />
          <NumericField id="char-swim-speed"    label="Zwemsnelheid (ft)"  value={form.swim_speed ?? 0}    onChange={(v) => set('swim_speed',    Math.max(0, v))} />
          <NumericField id="char-climb-speed"   label="Klimsnelheid (ft)"  value={form.climb_speed ?? 0}   onChange={(v) => set('climb_speed',   Math.max(0, v))} />
          <NumericField id="char-burrow-speed"  label="Graafsnelheid (ft)" value={form.burrow_speed ?? 0}  onChange={(v) => set('burrow_speed',  Math.max(0, v))} />
        </div>
        <div style={{ marginTop: 16 }}>
          <label className="pangu-label" htmlFor={specialSensesId}>Speciale zintuigen</label>
          <input
            id={specialSensesId}
            className="pangu-input"
            value={form.special_senses ?? ''}
            onChange={(e) => set('special_senses', e.target.value || null)}
            placeholder="Bijv. Waarzicht 30 ft, Trillingszin 10 ft..."
          />
        </div>
      </div>

      {/* ── Gevechtstoestand ── */}
      <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
        <p className="pangu-section-title" style={{ marginBottom: 4 }}>Gevechtstoestand</p>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 20 }}>
          Huidige toestand in het gevecht: inspiratie, uitputting, trefferdobbelstenen en stervensgooien.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Inspiratie toggle */}
          <div>
            <p className="pangu-label" style={{ marginBottom: 8 }}>Inspiratie</p>
            <button
              type="button"
              aria-pressed={isInspired}
              onClick={() => set('inspiration', !isInspired)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                cursor: 'pointer',
                textAlign: 'left',
                background: isInspired ? 'rgba(234,179,8,0.1)' : 'var(--surface)',
                border: isInspired ? '1px solid rgba(234,179,8,0.4)' : '1px solid var(--hairline)',
                transition: 'background var(--t-fast), border-color var(--t-fast)',
              }}
            >
              <span aria-hidden="true" style={{ fontSize: 18 }}>
                {isInspired ? '✦' : '✧'}
              </span>
              <span style={{
                fontSize: 14,
                fontWeight: isInspired ? 600 : 400,
                color: isInspired ? 'var(--gold)' : 'var(--ink-soft)',
              }}>
                {isInspired ? 'Geïnspireerd' : 'Geen inspiratie'}
              </span>
            </button>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
              Voordeel op één d20 Test
            </p>
          </div>

          {/* Uitputting */}
          <NumericField
            id="char-exhaustion"
            label="Uitputting (0–10)"
            value={form.exhaustion ?? 0}
            onChange={(v) => set('exhaustion', Math.min(10, Math.max(0, v)))}
            min={0}
            max={10}
          />

          {/* Huidige trefferdobbelstenen */}
          <NumericField
            id="char-hit-dice-current"
            label="Huidige trefferdobbelstenen"
            value={form.hit_dice_current ?? 1}
            onChange={(v) => set('hit_dice_current', Math.min(form.level ?? 1, Math.max(0, v)))}
            min={0}
            max={form.level ?? 1}
          />

          {/* Doodssprongen — successen */}
          <div>
            <p className="pangu-label" style={{ marginBottom: 8 }}>Stervensgooien — successen</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {[1, 2, 3].map(n => {
                const filled = (form.death_save_successes ?? 0) >= n
                return (
                  <button
                    key={n}
                    type="button"
                    aria-label={`Succes ${n}: ${filled ? 'geslaagd' : 'mislukt'}`}
                    onClick={() => set('death_save_successes', filled ? n - 1 : n)}
                    style={{
                      width: 32, height: 32,
                      borderRadius: 8,
                      border: filled ? '2px solid rgba(62,207,178,0.6)' : '2px solid var(--hairline-strong)',
                      background: filled ? 'rgba(62,207,178,0.15)' : 'var(--surface)',
                      cursor: 'pointer',
                      fontSize: 14,
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

          {/* Doodssprongen — mislukkingen */}
          <div>
            <p className="pangu-label" style={{ marginBottom: 8 }}>Stervensgooien — mislukkingen</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {[1, 2, 3].map(n => {
                const filled = (form.death_save_failures ?? 0) >= n
                return (
                  <button
                    key={n}
                    type="button"
                    aria-label={`Mislukking ${n}: ${filled ? 'mislukt' : 'leeg'}`}
                    onClick={() => set('death_save_failures', filled ? n - 1 : n)}
                    style={{
                      width: 32, height: 32,
                      borderRadius: 8,
                      border: filled ? '2px solid rgba(220,38,38,0.5)' : '2px solid var(--hairline-strong)',
                      background: filled ? 'rgba(220,38,38,0.12)' : 'var(--surface)',
                      cursor: 'pointer',
                      fontSize: 14,
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
    </>
  )
}

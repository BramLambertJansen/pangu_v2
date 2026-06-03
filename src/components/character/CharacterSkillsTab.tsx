import { D5E_SKILLS as SKILLS } from '@/utils/dnd5e'
import type { EffectiveStats } from '@/utils/equipmentUtils'
import type { Character } from '@/types/character.types'

interface Props {
  character: Character
  eff: EffectiveStats
}

export function CharacterSkillsTab({ character, eff }: Props) {
  const languages  = character.languages ?? []
  const toolProf   = character.tool_proficiencies ?? []
  const weaponProf = character.weapon_proficiencies ?? []
  const armorProf  = character.armor_proficiencies ?? []
  const hasAny     = languages.length > 0 || toolProf.length > 0 || weaponProf.length > 0 || armorProf.length > 0

  return (
    <div id="tabpanel-vaardigheden" role="tabpanel" aria-labelledby="tab-vaardigheden">
      {eff.stealthDisadvantage && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 10, background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.25)', marginBottom: 16 }}>
          <span aria-hidden="true">⚠️</span>
          <p style={{ fontSize: 13, color: 'var(--crimson)', margin: 0, fontWeight: 500 }}>
            Nadeel op Sluipen door uitgerust zwaar pantser.
          </p>
        </div>
      )}

      <div className="pangu-surface" style={{ padding: 24 }}>
        <p className="pangu-section-title" style={{ marginBottom: 4 }}>Vaardigheden</p>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 0, marginBottom: 20 }}>
          <span style={{ color: 'var(--violet)', fontWeight: 600 }}>●</span> vaardig (+{character.proficiency_bonus ?? 0}) &nbsp;·&nbsp;
          <span style={{ color: 'var(--teal)', fontWeight: 600 }}>◎</span> expertise (×2 bonus)
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
          {SKILLS.map((skill) => {
            const isProficient = (character.proficient_skills ?? []).includes(skill.name)
            const isExpert     = (character.expertise_skills  ?? []).includes(skill.name)
            const baseScore    = (character[skill.ability] as number | null) ?? 10
            const baseMod      = Math.floor((baseScore - 10) / 2)
            const skillBonus   = isExpert ? (character.proficiency_bonus ?? 0) * 2 : isProficient ? (character.proficiency_bonus ?? 0) : 0
            const itemBonus    = eff.skillBonuses[skill.name] ?? 0
            const totalMod     = baseMod + skillBonus + itemBonus
            const modLabel     = totalMod >= 0 ? `+${totalMod}` : `${totalMod}`
            const state        = isExpert ? 'expertise' : isProficient ? 'vaardig' : 'geen'
            return (
              <div key={skill.name} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', borderRadius: 8,
                background: isExpert ? 'rgba(62,207,178,0.08)' : isProficient ? 'rgba(139,92,246,0.08)' : 'var(--surface)',
                border: isExpert ? '1px solid rgba(62,207,178,0.3)' : isProficient ? '1px solid rgba(139,92,246,0.3)' : '1px solid var(--hairline)',
                transition: 'background var(--t-fast), border-color var(--t-fast)',
              }}>
                <span
                  aria-label={`${skill.name}: ${state}`}
                  style={{
                    width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                    background: isExpert ? 'var(--teal)' : isProficient ? 'var(--violet)' : 'transparent',
                    border: `2px solid ${isExpert ? 'var(--teal)' : isProficient ? 'var(--violet)' : 'var(--hairline-strong)'}`,
                    boxShadow: isExpert ? '0 0 0 2px rgba(62,207,178,0.3)' : 'none',
                  }}
                />
                <span style={{ flex: 1, fontSize: 13, color: isExpert ? 'var(--teal)' : isProficient ? 'var(--ink)' : 'var(--ink-soft)', fontWeight: (isProficient || isExpert) ? 600 : 400 }}>
                  {skill.name}
                  <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 5, fontWeight: 400 }}>{skill.abbr}</span>
                  {isExpert && <span style={{ fontSize: 9, color: 'var(--teal)', marginLeft: 5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>EXP</span>}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {itemBonus !== 0 && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--teal)' }}>{itemBonus > 0 ? `+${itemBonus}` : itemBonus}</span>
                  )}
                  <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-display)', color: isExpert ? 'var(--teal)' : isProficient ? 'var(--violet)' : 'var(--ink-soft)', minWidth: 28, textAlign: 'right' }}>
                    {modLabel}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {hasAny && (
        <div className="pangu-surface" style={{ padding: 24, marginTop: 12 }}>
          <p className="pangu-section-title" style={{ marginBottom: 16 }}>Bekwaamheden &amp; Talen</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Talen',                    items: languages  },
              { label: 'Wapenbekwaamheden',          items: weaponProf },
              { label: 'Wapenrustingbekwaamheden',   items: armorProf  },
              { label: 'Gereedschapsbekwaamheden',   items: toolProf   },
            ].filter(g => g.items.length > 0).map(({ label, items }) => (
              <div key={label}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 8px' }}>{label}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {items.map(item => (
                    <span key={item} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 999, background: 'var(--surface)', border: '1px solid var(--hairline)', color: 'var(--ink-soft)' }}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

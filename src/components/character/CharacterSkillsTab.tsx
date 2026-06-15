import { SkillsPanel } from '@/components/character/SkillsPanel'
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 10, background: 'rgb(var(--crimson-rgb) / 0.08)', border: '1px solid rgb(var(--crimson-rgb) / 0.25)', marginBottom: 16 }}>
          <span aria-hidden="true">⚠️</span>
          <p style={{ fontSize: 13, color: 'var(--crimson)', margin: 0, fontWeight: 500 }}>
            Nadeel op Sluipen door uitgerust zwaar pantser.
          </p>
        </div>
      )}

      <div className="surface" style={{ padding: 24 }}>
        <p className="pg-section-title" style={{ marginBottom: 4 }}>Vaardigheden</p>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 0, marginBottom: 20 }}>
          <span style={{ color: 'var(--violet)', fontWeight: 600 }}>●</span> vaardig (+{character.proficiency_bonus ?? 0}) &nbsp;·&nbsp;
          <span style={{ color: 'var(--teal)', fontWeight: 600 }}>◎</span> expertise (×2 bonus)
        </p>
        <SkillsPanel
          proficientSkills={character.proficient_skills ?? []}
          expertiseSkills={character.expertise_skills ?? []}
          abilityScores={{
            str: character.stat_str,
            dex: character.stat_dex,
            con: character.stat_con,
            int: character.stat_int,
            wis: character.stat_wis,
            cha: character.stat_cha,
          }}
          proficiencyBonus={character.proficiency_bonus ?? 2}
          skillBonuses={eff.skillBonuses}
        />
      </div>

      {hasAny && (
        <div className="surface" style={{ padding: 24, marginTop: 12 }}>
          <p className="pg-section-title" style={{ marginBottom: 16 }}>Bekwaamheden &amp; Talen</p>
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

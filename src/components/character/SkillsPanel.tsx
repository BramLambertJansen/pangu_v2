import { D5E_SKILLS, ABILITY_SCORES, abilityModifier } from '@/utils/dnd5e'
import { cn } from '@/utils/cn'

export interface SkillsPanelProps {
  proficientSkills?: string[]
  expertiseSkills?: string[]
  abilityScores?: Partial<Record<'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha', number>>
  proficiencyBonus?: number
  /** Optional per-skill item bonuses */
  skillBonuses?: Record<string, number>
  className?: string
}

const ABILITY_KEY_MAP: Record<string, 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'> = {
  stat_str: 'str',
  stat_dex: 'dex',
  stat_con: 'con',
  stat_int: 'int',
  stat_wis: 'wis',
  stat_cha: 'cha',
}

/** D&D 5e skill list grouped by ability score with proficiency/expertise dot-states. */
export function SkillsPanel({
  proficientSkills = [],
  expertiseSkills = [],
  abilityScores = {},
  proficiencyBonus = 2,
  skillBonuses = {},
  className,
}: SkillsPanelProps) {
  return (
    <div className={cn('skills-panel', className)}>
      {ABILITY_SCORES.map((ability) => {
        const shortKey = ABILITY_KEY_MAP[ability.key]
        const score = abilityScores[shortKey] ?? 10
        const mod = abilityModifier(score)
        const modLabel = mod >= 0 ? `+${mod}` : String(mod)
        const skills = D5E_SKILLS.filter((s) => s.ability === ability.key)

        return (
          <div key={ability.key}>
            <div className="skill-ability-head">
              <span className="skill-ability-abbr">{ability.abbr}</span>
              <span className="skill-ability-mod">{modLabel}</span>
              <span className="skill-ability-label">
                {ability.label} ({score})
              </span>
            </div>

            {skills.length === 0 ? (
              <p className="skill-empty">Geen vaardigheden</p>
            ) : (
              <div className="skill-list">
                {skills.map((skill) => {
                  const isProficient = proficientSkills.includes(skill.name)
                  const isExpert = expertiseSkills.includes(skill.name)
                  const prof = isExpert ? 'expert' : isProficient ? 'proficient' : 'none'
                  const skillBonus = isExpert ? proficiencyBonus * 2 : isProficient ? proficiencyBonus : 0
                  const itemBonus = skillBonuses[skill.name] ?? 0
                  const totalMod = mod + skillBonus + itemBonus
                  const totalLabel = totalMod >= 0 ? `+${totalMod}` : String(totalMod)

                  return (
                    <div key={skill.name} className="skill-row" data-prof={prof}>
                      <span
                        className="skill-dot"
                        aria-label={
                          isExpert
                            ? `${skill.name}: expertise`
                            : isProficient
                            ? `${skill.name}: vaardig`
                            : `${skill.name}: geen`
                        }
                      />
                      <span className="skill-name">
                        {skill.name}
                        {isExpert && (
                          <span aria-hidden="true" className="skill-exp">
                            EXP
                          </span>
                        )}
                      </span>
                      {itemBonus !== 0 && (
                        <span
                          className="skill-item-bonus"
                          aria-label={`Item bonus ${itemBonus > 0 ? `+${itemBonus}` : itemBonus}`}
                        >
                          {itemBonus > 0 ? `+${itemBonus}` : itemBonus}
                        </span>
                      )}
                      <span className="skill-mod">{totalLabel}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

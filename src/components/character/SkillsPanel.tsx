import { D5E_SKILLS, ABILITY_SCORES, abilityModifier } from '@/utils/dnd5e'

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
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {ABILITY_SCORES.map((ability) => {
        const shortKey = ABILITY_KEY_MAP[ability.key]
        const score = abilityScores[shortKey] ?? 10
        const mod = abilityModifier(score)
        const modLabel = mod >= 0 ? `+${mod}` : String(mod)
        const skills = D5E_SKILLS.filter((s) => s.ability === ability.key)

        return (
          <div key={ability.key}>
            {/* Ability group header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 8,
                paddingBottom: 6,
                borderBottom: '1px solid var(--hairline)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                  minWidth: 28,
                }}
              >
                {ability.abbr}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 18,
                  fontWeight: 700,
                  color: 'var(--gold)',
                  lineHeight: 1,
                  minWidth: 28,
                }}
              >
                {modLabel}
              </span>
              <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 400 }}>
                {ability.label} ({score})
              </span>
            </div>

            {/* Skills */}
            {skills.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--subtle)', fontStyle: 'italic', margin: '4px 0 0 38px' }}>
                Geen vaardigheden
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {skills.map((skill) => {
                  const isProficient = proficientSkills.includes(skill.name)
                  const isExpert = expertiseSkills.includes(skill.name)
                  const skillBonus = isExpert
                    ? proficiencyBonus * 2
                    : isProficient
                    ? proficiencyBonus
                    : 0
                  const itemBonus = skillBonuses[skill.name] ?? 0
                  const totalMod = mod + skillBonus + itemBonus
                  const totalLabel = totalMod >= 0 ? `+${totalMod}` : String(totalMod)

                  return (
                    <div
                      key={skill.name}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '7px 10px 7px 38px',
                        borderRadius: 8,
                        background: isExpert
                          ? 'rgb(var(--teal-rgb) / 0.08)'
                          : isProficient
                          ? 'rgb(var(--violet-rgb) / 0.07)'
                          : 'transparent',
                        border: isExpert
                          ? '1px solid rgb(var(--teal-rgb) / 0.28)'
                          : isProficient
                          ? '1px solid rgb(var(--violet-rgb) / 0.28)'
                          : '1px solid transparent',
                        transition: 'background var(--t-fast), border-color var(--t-fast)',
                      }}
                    >
                      {/* Proficiency dot */}
                      <span
                        aria-label={
                          isExpert
                            ? `${skill.name}: expertise`
                            : isProficient
                            ? `${skill.name}: vaardig`
                            : `${skill.name}: geen`
                        }
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          flexShrink: 0,
                          background: isExpert
                            ? 'var(--teal)'
                            : isProficient
                            ? 'var(--violet)'
                            : 'transparent',
                          border: `2px solid ${
                            isExpert
                              ? 'var(--teal)'
                              : isProficient
                              ? 'var(--violet)'
                              : 'var(--hairline-strong)'
                          }`,
                          boxShadow: isExpert
                            ? '0 0 0 2px rgb(var(--teal-rgb) / 0.28)'
                            : 'none',
                          position: 'relative',
                          left: -28,
                          marginRight: -18,
                        }}
                      />

                      {/* Skill name */}
                      <span
                        style={{
                          flex: 1,
                          fontSize: 13,
                          color: isExpert
                            ? 'var(--teal)'
                            : isProficient
                            ? 'var(--ink)'
                            : 'var(--ink-soft)',
                          fontWeight: isProficient || isExpert ? 600 : 400,
                        }}
                      >
                        {skill.name}
                        {isExpert && (
                          <span
                            aria-hidden="true"
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              letterSpacing: '0.08em',
                              textTransform: 'uppercase',
                              color: 'var(--teal)',
                              marginLeft: 6,
                            }}
                          >
                            EXP
                          </span>
                        )}
                      </span>

                      {/* Item bonus */}
                      {itemBonus !== 0 && (
                        <span
                          aria-label={`Item bonus ${itemBonus > 0 ? `+${itemBonus}` : itemBonus}`}
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: 'var(--teal)',
                          }}
                        >
                          {itemBonus > 0 ? `+${itemBonus}` : itemBonus}
                        </span>
                      )}

                      {/* Total modifier */}
                      <span
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 15,
                          fontWeight: 700,
                          color: isExpert
                            ? 'var(--teal)'
                            : isProficient
                            ? 'var(--violet)'
                            : 'var(--ink-soft)',
                          minWidth: 30,
                          textAlign: 'right',
                        }}
                      >
                        {totalLabel}
                      </span>
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

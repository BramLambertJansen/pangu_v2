import { StubPanel } from '@/components/ui/StubPanel'

export interface SkillsPanelProps {
  /** D&D 5e skill proficiencies, grouped by ability score when rendered. */
  proficientSkills?: string[]
  expertiseSkills?: string[]
  abilityScores?: Partial<Record<'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha', number>>
  proficiencyBonus?: number
}

/** STUB — D&D 5e skills grouped by ability with proficiency/expertise dot-states. */
export function SkillsPanel(_props: SkillsPanelProps) {
  return (
    <StubPanel
      title="Vaardigheden"
      description="D&D 5e vaardigheden gegroepeerd per kenmerk, met proficiency- en expertise-indicatoren en berekende modifiers."
    />
  )
}

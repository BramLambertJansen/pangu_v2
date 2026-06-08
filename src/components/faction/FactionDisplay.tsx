import { StubPanel } from '@/components/ui/StubPanel'

export interface FactionDisplayProps {
  campaignId: string
  /** Faction ids to visualise relationships/reputation between. */
  factionIds?: string[]
}

/** STUB — faction relationship/alignment visualiser (reputation graph or timeline). */
export function FactionDisplay(_props: FactionDisplayProps) {
  return (
    <StubPanel
      title="Factie-overzicht"
      description="Visuele weergave van factierelaties en reputatie/uitlijning tussen organisaties."
    />
  )
}

import { StubPanel } from '@/components/ui/StubPanel'

export interface Chapter {
  id: string
  title: string
  number: number
  completed?: boolean
}

export interface StoryArcSpineProps {
  campaignId: string
  chapters?: Chapter[]
  selectedId?: string
  onSelect?: (id: string) => void
}

/** STUB — vertical chapter spine/timeline with a selected-chapter detail panel. */
export function StoryArcSpine(_props: StoryArcSpineProps) {
  return (
    <StubPanel
      title="Verhaallijn-ruggengraat"
      description="Verticale tijdlijn van hoofdstukken met voortgangsstatus en een detailpaneel voor het geselecteerde hoofdstuk."
    />
  )
}

import { StubPanel } from '@/components/ui/StubPanel'

export interface Place {
  id: string
  name: string
  type?: string
  npcCount?: number
}

export interface PlaceAccordionProps {
  locationId: string
  places?: Place[]
}

/** STUB — expandable sub-locations (tavernes, gilden, tempels) with NPC-presence indicators. */
export function PlaceAccordion(_props: PlaceAccordionProps) {
  return (
    <StubPanel
      title="Plaatsen"
      description="Uitklapbare sublocaties binnen een locatie met aanwezigheids-indicatoren voor NPCs."
    />
  )
}

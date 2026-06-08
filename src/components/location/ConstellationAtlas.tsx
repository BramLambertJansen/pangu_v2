import { StubPanel } from '@/components/ui/StubPanel'

export interface AtlasMarker {
  id: string
  name: string
  x: number
  y: number
}

export interface ConstellationAtlasProps {
  campaignId: string
  markers?: AtlasMarker[]
  selectedId?: string
  onSelect?: (id: string) => void
}

/** STUB — zoom/pan star-chart map of locations with clickable markers + detail panel. */
export function ConstellationAtlas(_props: ConstellationAtlasProps) {
  return (
    <StubPanel
      title="Constellatie-atlas"
      description="Zoom-/pan-bare sterrenkaart van locaties met klikbare markers, tooltips en een detailpaneel."
    />
  )
}

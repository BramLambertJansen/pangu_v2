import { StubPanel } from '@/components/ui/StubPanel'

export interface ReisgezelschapBannerProps {
  campaignId: string
  currentLocation?: string
  destination?: string
  /** Aggregated party vitals (avg level, total HP, treasury). */
  partyVitals?: { avgLevel?: number; totalHp?: number; treasury?: number }
  onArrived?: () => void
  onClearDestination?: () => void
}

/** STUB — party travel banner: current location → destination with status dots + party vitals. */
export function ReisgezelschapBanner(_props: ReisgezelschapBannerProps) {
  return (
    <StubPanel
      title="Reisgezelschap"
      description="Contextbanner met huidige locatie en reisbestemming, statusstippen, snelle acties en geaggregeerde groepsvitaliteit."
    />
  )
}

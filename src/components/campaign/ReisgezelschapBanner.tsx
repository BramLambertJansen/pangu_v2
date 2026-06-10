import type { CSSProperties } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { StatPill } from '@/components/ui/StatPill'
import { cn } from '@/utils/cn'

export interface ReisgezelschapBannerProps {
  campaignId: string
  currentLocation?: string
  destination?: string
  /** Aggregated party vitals (avg level, total HP, treasury in gp). */
  partyVitals?: { avgLevel?: number; totalHp?: number; treasury?: number }
  /** Party member display names for avatars */
  partyMembers?: { id: string; name: string }[]
  onArrived?: () => void
  onClearDestination?: () => void
  className?: string
}

/** Party travel and status banner: current location → destination, vitals, member avatars. */
export function ReisgezelschapBanner({
  currentLocation,
  destination,
  partyVitals,
  partyMembers = [],
  onArrived,
  onClearDestination,
  className,
}: ReisgezelschapBannerProps) {
  const hasVitals =
    partyVitals &&
    (partyVitals.avgLevel !== undefined ||
      partyVitals.totalHp !== undefined ||
      partyVitals.treasury !== undefined)

  return (
    <div className={cn('party-banner', className)}>
      <div className="party-banner-main">
        <p className="party-banner-kicker">Reisgezelschap</p>

        <div className="party-banner-route">
          <span className="party-loc" data-known={!!currentLocation}>
            <span aria-hidden="true" className="party-loc-icon">
              📍
            </span>
            {currentLocation ?? 'Locatie onbekend'}
          </span>

          {destination && (
            <>
              <span aria-hidden="true" className="party-route-arrow">
                →
              </span>
              <span className="party-dest">
                <span aria-hidden="true" className="party-loc-icon">
                  🏴
                </span>
                {destination}
              </span>
            </>
          )}
        </div>

        {(onArrived || onClearDestination) && destination && (
          <div className="party-banner-actions">
            {onArrived && (
              <button type="button" onClick={onArrived} aria-label="Gearriveerd op bestemming" className="party-action party-action--arrived">
                ✓ Gearriveerd
              </button>
            )}
            {onClearDestination && (
              <button type="button" onClick={onClearDestination} aria-label="Bestemming wissen" className="party-action party-action--clear">
                ✕ Wissen
              </button>
            )}
          </div>
        )}
      </div>

      {hasVitals && (
        <div className="party-vitals" aria-label="Groepsvitaliteit">
          {partyVitals!.avgLevel !== undefined && <StatPill icon="⚔️" value={`${partyVitals!.avgLevel}`} label="Gem. level" />}
          {partyVitals!.totalHp !== undefined && <StatPill icon="❤️" value={`${partyVitals!.totalHp}`} label="Totaal HP" />}
          {partyVitals!.treasury !== undefined && <StatPill icon="💰" value={`${partyVitals!.treasury} gp`} label="Goud" />}
        </div>
      )}

      {partyMembers.length > 0 && (
        <div className="party-avatars" aria-label={`${partyMembers.length} groepsleden`}>
          {partyMembers.slice(0, 6).map((member, i) => (
            <div
              key={member.id}
              className="party-avatar"
              title={member.name}
              style={{ zIndex: partyMembers.length - i } as CSSProperties}
            >
              <Avatar fallback={member.name.charAt(0).toUpperCase()} alt={member.name} size="sm" />
            </div>
          ))}
          {partyMembers.length > 6 && (
            <div className="party-avatar-more" aria-label={`en ${partyMembers.length - 6} meer`}>
              +{partyMembers.length - 6}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

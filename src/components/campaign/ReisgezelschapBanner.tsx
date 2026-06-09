import { Avatar } from '@/components/ui/Avatar'
import { StatPill } from '@/components/ui/StatPill'

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
    <div
      className={className}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 20,
        padding: '16px 20px',
        borderRadius: 'var(--r-xl)',
        border: '1px solid var(--hairline)',
        background:
          'linear-gradient(135deg, rgb(var(--teal-rgb) / 0.06) 0%, var(--surface) 60%)',
      }}
    >
      {/* Location display */}
      <div style={{ flex: '1 1 200px', minWidth: 0 }}>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            margin: '0 0 6px',
          }}
        >
          Reisgezelschap
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Current location */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 14,
              fontWeight: 600,
              color: currentLocation ? 'var(--teal)' : 'var(--muted)',
              fontStyle: currentLocation ? 'normal' : 'italic',
            }}
          >
            <span aria-hidden="true" style={{ fontSize: 10 }}>📍</span>
            {currentLocation ?? 'Locatie onbekend'}
          </span>

          {/* Arrow + destination */}
          {destination && (
            <>
              <span aria-hidden="true" style={{ fontSize: 10, color: 'var(--muted)' }}>→</span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--gold)',
                }}
              >
                <span aria-hidden="true" style={{ fontSize: 10 }}>🏴</span>
                {destination}
              </span>
            </>
          )}
        </div>

        {/* Action buttons */}
        {(onArrived || onClearDestination) && destination && (
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            {onArrived && (
              <button
                type="button"
                onClick={onArrived}
                aria-label="Gearriveerd op bestemming"
                style={{
                  padding: '4px 12px',
                  borderRadius: 'var(--r-full)',
                  border: '1px solid rgb(var(--teal-rgb) / 0.4)',
                  background: 'rgb(var(--teal-rgb) / 0.1)',
                  color: 'var(--teal)',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  transition: 'all var(--t-fast)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgb(var(--teal-rgb) / 0.18)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgb(var(--teal-rgb) / 0.1)' }}
              >
                ✓ Gearriveerd
              </button>
            )}
            {onClearDestination && (
              <button
                type="button"
                onClick={onClearDestination}
                aria-label="Bestemming wissen"
                style={{
                  padding: '4px 12px',
                  borderRadius: 'var(--r-full)',
                  border: '1px solid var(--hairline)',
                  background: 'transparent',
                  color: 'var(--muted)',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  transition: 'all var(--t-fast)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ink-soft)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--muted)' }}
              >
                ✕ Wissen
              </button>
            )}
          </div>
        )}
      </div>

      {/* Party vitals */}
      {hasVitals && (
        <div
          style={{
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
            flexShrink: 0,
          }}
          aria-label="Groepsvitaliteit"
        >
          {partyVitals!.avgLevel !== undefined && (
            <StatPill icon="⚔️" value={`${partyVitals!.avgLevel}`} label="Gem. level" />
          )}
          {partyVitals!.totalHp !== undefined && (
            <StatPill icon="❤️" value={`${partyVitals!.totalHp}`} label="Totaal HP" />
          )}
          {partyVitals!.treasury !== undefined && (
            <StatPill icon="💰" value={`${partyVitals!.treasury} gp`} label="Goud" />
          )}
        </div>
      )}

      {/* Member avatars */}
      {partyMembers.length > 0 && (
        <div
          style={{ display: 'flex', gap: -4, flexShrink: 0 }}
          aria-label={`${partyMembers.length} groepsleden`}
        >
          {partyMembers.slice(0, 6).map((member, i) => (
            <div
              key={member.id}
              title={member.name}
              style={{
                marginLeft: i === 0 ? 0 : -8,
                border: '2px solid var(--void)',
                borderRadius: '50%',
                zIndex: partyMembers.length - i,
                position: 'relative',
              }}
            >
              <Avatar name={member.name} size="sm" />
            </div>
          ))}
          {partyMembers.length > 6 && (
            <div
              style={{
                marginLeft: -8,
                width: 28,
                height: 28,
                borderRadius: '50%',
                border: '2px solid var(--void)',
                background: 'var(--surface-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 9,
                fontWeight: 700,
                color: 'var(--muted)',
                position: 'relative',
              }}
              aria-label={`en ${partyMembers.length - 6} meer`}
            >
              +{partyMembers.length - 6}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

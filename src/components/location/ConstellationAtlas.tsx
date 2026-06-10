import { useRef } from 'react'
import type { CSSProperties, MouseEvent } from 'react'
import { CompassRose } from '@/components/world/CompassRose'

export interface AtlasMarker {
  id: string
  name: string
  x: number
  y: number
  location_type?: string | null
}

export interface ConstellationAtlasProps {
  campaignId: string
  mapImageUrl?: string | null
  markers?: AtlasMarker[]
  selectedId?: string
  onSelect?: (id: string) => void
  /** When true: clicking the map sets a pin position instead of selecting */
  pinMode?: boolean
  onPlacePin?: (x: number, y: number) => void
  height?: number
  className?: string
}

function pinColor(type: string | null | undefined): string {
  const map: Record<string, string> = {
    Stad: 'var(--gold)',
    City: 'var(--gold)',
    Dorp: 'var(--gold)',
    Town: 'var(--gold)',
    Grot: 'var(--azure)',
    Cave: 'var(--azure)',
    Ruïne: 'var(--crimson)',
    Ruin: 'var(--crimson)',
    Kerker: 'var(--violet)',
    Dungeon: 'var(--violet)',
    Woud: 'var(--teal)',
    Forest: 'var(--teal)',
    Kasteel: 'var(--gold)',
    Castle: 'var(--gold)',
    Tempel: 'var(--teal)',
    Temple: 'var(--teal)',
    Herberg: 'var(--gold)',
    Tavern: 'var(--gold)',
  }
  return type ? (map[type] ?? 'var(--violet)') : 'var(--violet)'
}

export function ConstellationAtlas({
  campaignId: _campaignId,
  mapImageUrl,
  markers = [],
  selectedId,
  onSelect,
  pinMode = false,
  onPlacePin,
  height = 480,
  className,
}: ConstellationAtlasProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  function handleContainerClick(e: { clientX: number; clientY: number; target: EventTarget | null }) {
    if (!pinMode || !onPlacePin) return
    if ((e.target as HTMLElement).closest?.('.atlas-pin')) return
    const rect = containerRef.current!.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    onPlacePin(
      Math.max(0, Math.min(100, x)),
      Math.max(0, Math.min(100, y)),
    )
  }

  function handleContainerTouch(e: { changedTouches: TouchList; target: EventTarget | null }) {
    if (!pinMode || !onPlacePin) return
    if ((e.target as HTMLElement).closest?.('.atlas-pin')) return
    const touch = e.changedTouches[0]
    const rect = containerRef.current!.getBoundingClientRect()
    const x = ((touch.clientX - rect.left) / rect.width) * 100
    const y = ((touch.clientY - rect.top) / rect.height) * 100
    onPlacePin(
      Math.max(0, Math.min(100, x)),
      Math.max(0, Math.min(100, y)),
    )
  }

  return (
    <div
      ref={containerRef}
      className={`atlas-map${className ? ` ${className}` : ''}`}
      style={{ height }}
      data-pin-mode={pinMode ? 'true' : undefined}
      onClick={handleContainerClick}
      onTouchEnd={handleContainerTouch}
      role={pinMode ? 'button' : undefined}
      aria-label={pinMode ? 'Klik om pin te plaatsen' : 'Locatiekaart'}
    >
      {mapImageUrl ? (
        <img
          src={mapImageUrl}
          alt="Kaartafbeelding"
          className="atlas-map-img"
          draggable={false}
          style={{ height: '100%' }}
        />
      ) : (
        <div className="atlas-empty">
          <svg aria-hidden="true" width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <p style={{ fontSize: 13, maxWidth: 220 }}>
            {pinMode
              ? 'Nog geen kaartafbeelding. Upload er een via Kroniek bewerken.'
              : 'Geen kaartafbeelding — upload er een via kroniek-instellingen.'}
          </p>
        </div>
      )}

      {/* Location pins */}
      {markers.map((marker) => {
        const isSel = marker.id === selectedId
        const color = pinColor(marker.location_type)
        return (
          <button
            key={marker.id}
            className="atlas-pin"
            style={{
              left: `${marker.x}%`,
              top: `${marker.y}%`,
              '--atlas-pin-color': color,
            } as CSSProperties}
            data-selected={isSel ? 'true' : undefined}
            onClick={(e: MouseEvent) => {
              e.stopPropagation()
              onSelect?.(marker.id)
            }}
            aria-label={marker.name}
            aria-pressed={isSel}
          >
            {isSel && <span className="atlas-pin-ring" aria-hidden="true" />}
            {isSel && <span className="atlas-pin-ring atlas-pin-ring-2" aria-hidden="true" />}
            <span className="atlas-pin-label">{marker.name}</span>
            <span className="atlas-pin-icon" aria-hidden="true">
              <span className="atlas-pin-dot" />
            </span>
          </button>
        )
      })}

      {/* Compass rose */}
      <div className="atlas-compass" aria-hidden="true">
        <CompassRose size={44} opacity={0.55} />
      </div>
    </div>
  )
}

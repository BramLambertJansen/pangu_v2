import { useState } from 'react'
import { Chip } from '@/components/ui/Chip'
import { cn } from '@/utils/cn'

export interface Place {
  id: string
  name: string
  type?: string
  npcCount?: number
}

export interface PlaceAccordionProps {
  locationId: string
  places?: Place[]
  onAdd?: () => void
  className?: string
}

/** Expandable sub-location list with type chip and NPC-presence indicator. */
export function PlaceAccordion({ places = [], onAdd, className }: PlaceAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null)

  if (places.length === 0 && !onAdd) {
    return <p className={cn('place-accordion-empty', className)}>Geen sublocaties.</p>
  }

  return (
    <div className={cn('place-accordion', className)}>
      {places.map((place) => {
        const isOpen = openId === place.id
        const npcCount = place.npcCount ?? 0
        return (
          <div key={place.id} className="place-item" data-open={isOpen}>
            <button
              type="button"
              id={`place-header-${place.id}`}
              aria-expanded={isOpen}
              aria-controls={`place-panel-${place.id}`}
              onClick={() => setOpenId(isOpen ? null : place.id)}
              className="place-header"
            >
              <svg
                aria-hidden="true"
                className="place-chevron"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>

              <span className="place-name">{place.name}</span>

              {place.type && <Chip>{place.type}</Chip>}

              {npcCount > 0 && (
                <span
                  className="place-npc"
                  aria-label={`${npcCount} NPC${npcCount !== 1 ? "'s" : ''} aanwezig`}
                  title={`${npcCount} NPC${npcCount !== 1 ? "'s" : ''}`}
                >
                  <span aria-hidden="true" className="place-npc-dot" />
                  {npcCount}
                </span>
              )}
            </button>

            {isOpen && (
              <div id={`place-panel-${place.id}`} role="region" aria-labelledby={`place-header-${place.id}`} className="place-panel">
                <p>Meer details komen wanneer het datamodel voor sublocaties beschikbaar is.</p>
              </div>
            )}
          </div>
        )
      })}

      {onAdd && (
        <button type="button" onClick={onAdd} aria-label="Sublocatie toevoegen" className="place-add">
          <span aria-hidden="true" className="place-add-plus">
            +
          </span>
          Sublocatie toevoegen
        </button>
      )}
    </div>
  )
}

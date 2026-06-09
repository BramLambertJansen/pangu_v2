import { useState } from 'react'
import { Chip } from '@/components/ui/Chip'

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
export function PlaceAccordion({
  places = [],
  onAdd,
  className,
}: PlaceAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null)

  if (places.length === 0 && !onAdd) {
    return (
      <p
        className={className}
        style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}
      >
        Geen sublocaties.
      </p>
    )
  }

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {places.map((place) => {
        const isOpen = openId === place.id
        return (
          <div
            key={place.id}
            style={{
              borderRadius: 10,
              border: isOpen
                ? '1px solid rgb(var(--teal-rgb) / 0.4)'
                : '1px solid var(--hairline)',
              overflow: 'hidden',
              transition: 'border-color var(--t-fast)',
            }}
          >
            {/* Accordion header */}
            <button
              type="button"
              id={`place-header-${place.id}`}
              aria-expanded={isOpen}
              aria-controls={`place-panel-${place.id}`}
              onClick={() => setOpenId(isOpen ? null : place.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '12px 14px',
                background: isOpen ? 'rgb(var(--teal-rgb) / 0.06)' : 'var(--surface)',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background var(--t-fast)',
              }}
              onMouseEnter={(e) => {
                if (!isOpen) e.currentTarget.style.background = 'var(--surface-hover, var(--surface-2))'
              }}
              onMouseLeave={(e) => {
                if (!isOpen) e.currentTarget.style.background = 'var(--surface)'
              }}
            >
              {/* Chevron */}
              <svg
                aria-hidden="true"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  color: isOpen ? 'var(--teal)' : 'var(--muted)',
                  transform: isOpen ? 'rotate(90deg)' : 'none',
                  transition: 'transform var(--t-fast), color var(--t-fast)',
                  flexShrink: 0,
                }}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>

              {/* Name */}
              <span
                style={{
                  flex: 1,
                  fontSize: 14,
                  fontWeight: isOpen ? 700 : 500,
                  color: isOpen ? 'var(--ink)' : 'var(--ink-soft)',
                  transition: 'color var(--t-fast)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {place.name}
              </span>

              {/* Type chip */}
              {place.type && (
                <Chip>
                  {place.type}
                </Chip>
              )}

              {/* NPC dot */}
              {(place.npcCount ?? 0) > 0 && (
                <span
                  aria-label={`${place.npcCount} NPC${(place.npcCount ?? 0) !== 1 ? "'s" : ''} aanwezig`}
                  title={`${place.npcCount} NPC${(place.npcCount ?? 0) !== 1 ? "'s" : ''}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 8px',
                    borderRadius: 'var(--r-full)',
                    fontSize: 10,
                    fontWeight: 700,
                    color: 'var(--violet)',
                    background: 'rgb(var(--violet-rgb) / 0.1)',
                    border: '1px solid rgb(var(--violet-rgb) / 0.25)',
                    letterSpacing: '0.06em',
                    flexShrink: 0,
                  }}
                >
                  <span aria-hidden="true" style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--violet)', display: 'inline-block' }} />
                  {place.npcCount}
                </span>
              )}
            </button>

            {/* Accordion body */}
            {isOpen && (
              <div
                id={`place-panel-${place.id}`}
                role="region"
                aria-labelledby={`place-header-${place.id}`}
                style={{
                  padding: '12px 14px 14px 38px',
                  borderTop: '1px solid var(--hairline)',
                  background: 'rgb(var(--teal-rgb) / 0.03)',
                }}
              >
                <p style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>
                  Meer details komen wanneer het datamodel voor sublocaties beschikbaar is.
                </p>
              </div>
            )}
          </div>
        )
      })}

      {/* Add button */}
      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          aria-label="Sublocatie toevoegen"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px dashed var(--hairline-strong)',
            background: 'transparent',
            color: 'var(--muted)',
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all var(--t-fast)',
            width: '100%',
            textAlign: 'left',
            fontFamily: 'var(--font-body)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--teal)'
            e.currentTarget.style.color = 'var(--teal)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--hairline-strong)'
            e.currentTarget.style.color = 'var(--muted)'
          }}
        >
          <span aria-hidden="true" style={{ fontSize: 16 }}>+</span>
          Sublocatie toevoegen
        </button>
      )}
    </div>
  )
}

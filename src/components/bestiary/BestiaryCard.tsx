import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Bestiary } from '@/types/bestiary.types'
import { EntityCard } from '@/components/ui/EntityCard'
import { ForgeCard } from '@/components/ui/ForgeCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { pickGradient, bestiaryGradients } from '@/utils/pickGradient'
import { bestiaryStatusLabel, bestiaryStatusColor } from '@/lib/statusMaps'

interface Props {
  bestiary: Bestiary
}

export const BestiaryCard = memo(function BestiaryCard({ bestiary }: Props) {
  const navigate = useNavigate()
  const gradient = pickGradient(bestiary.id, bestiaryGradients)

  return (
    <EntityCard
      variant="compact"
      ariaLabel={`Wezen: ${bestiary.name}`}
      onClick={() => navigate(`/bestiary/${bestiary.id}`)}
    >
      {/* Gradient accent */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0,
          background: gradient,
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
      <div style={{ position: 'relative', display: 'flex', gap: 12, flex: 1 }}>
        {bestiary.image_url && (
          <img
            src={bestiary.image_url}
            alt=""
            aria-hidden="true"
            style={{
              width: 64, height: 64, objectFit: 'cover',
              borderRadius: 8, flexShrink: 0,
              border: '1px solid var(--hairline)',
              alignSelf: 'flex-start',
            }}
          />
        )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            {bestiary.subtitle && (
              <p style={{
                fontFamily: 'var(--font-quote)',
                fontStyle: 'italic',
                fontSize: 11, letterSpacing: '0.03em',
                color: 'var(--gold)', margin: '0 0 2px',
              }}>
                {bestiary.subtitle}
              </p>
            )}
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(18px, 3vw, 22px)',
              fontWeight: 600, lineHeight: 1,
              letterSpacing: '0.04em', textTransform: 'uppercase',
              color: 'var(--ink)', margin: 0,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {bestiary.name}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {bestiary.source?.startsWith('srd') && (
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--azure)', border: '1px solid rgb(var(--azure-rgb) / 0.3)', borderRadius: 4, padding: '1px 5px' }}>
                {bestiary.source === 'srd-2024' ? 'SRD 2024' : 'SRD'}
              </span>
            )}
            <StatusBadge
              label={bestiaryStatusLabel[bestiary.status]}
              color={bestiaryStatusColor[bestiary.status]}
              className="mt-0.5"
            />
          </div>
        </div>

        {bestiary.creature_type && (
          <p style={{
            fontSize: 11, fontWeight: 700,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'var(--teal)', margin: 0,
            fontFamily: 'var(--font-body)',
          }}>
            {bestiary.creature_type}
            {bestiary.threat_level && (
              <span style={{ color: 'var(--muted)', fontWeight: 400, letterSpacing: '0.06em', textTransform: 'none' }}>
                {' · '}{bestiary.threat_level}
              </span>
            )}
          </p>
        )}

        {bestiary.description && (
          <p style={{
            fontSize: 13, lineHeight: 1.65,
            color: 'var(--muted)', margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {bestiary.description}
          </p>
        )}

        {!bestiary.description && !bestiary.subtitle && !bestiary.creature_type && (
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, fontStyle: 'italic' }}>
            Een onbekend wezen wacht op zijn beschrijving.
          </p>
        )}
      </div>
      </div>
    </EntityCard>
  )
})

interface RowProps {
  bestiary: Bestiary
  selected?: boolean
  onSelect: () => void
}

export const BestiaryRow = memo(function BestiaryRow({ bestiary, selected = false, onSelect }: RowProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`Selecteer wezen: ${bestiary.name}`}
      onClick={onSelect}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        borderRadius: 10,
        border: `1px solid ${selected ? 'rgb(var(--teal-rgb) / 0.35)' : 'var(--hairline)'}`,
        background: selected ? 'rgb(var(--teal-rgb) / 0.08)' : 'var(--surface)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background var(--t-fast), border-color var(--t-fast)',
      }}
    >
      {/* Avatar */}
      <div
        aria-hidden="true"
        style={{
          width: 38, height: 38, borderRadius: 8, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: selected ? 'rgb(var(--teal-rgb) / 0.15)' : 'var(--surface-2)',
          border: `1px solid ${selected ? 'rgb(var(--teal-rgb) / 0.3)' : 'var(--hairline)'}`,
          fontFamily: 'var(--font-display)',
          fontSize: 18, fontWeight: 700,
          color: selected ? 'var(--teal)' : 'var(--muted)',
          transition: 'background var(--t-fast), color var(--t-fast)',
        }}
      >
        {bestiary.name.trim()[0]?.toUpperCase() ?? '?'}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <p style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontSize: 14, fontWeight: 600,
            letterSpacing: '0.03em',
            color: 'var(--ink)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            flex: 1, minWidth: 0,
          }}>
            {bestiary.name}
          </p>
          {bestiary.source?.startsWith('srd') && (
            <span aria-label="Geïmporteerd uit de SRD" style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--azure)', border: '1px solid rgb(var(--azure-rgb) / 0.25)', borderRadius: 3, padding: '1px 4px', flexShrink: 0 }}>
              {bestiary.source === 'srd-2024' ? 'SRD 2024' : 'SRD'}
            </span>
          )}
        </div>
        {bestiary.creature_type && (
          <p style={{
            margin: '2px 0 0',
            fontSize: 9, fontWeight: 700,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'var(--teal)', fontFamily: 'var(--font-body)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {bestiary.creature_type}
            {bestiary.threat_level && (
              <span style={{ color: 'var(--muted)', fontWeight: 400, letterSpacing: '0.06em', textTransform: 'none' }}>
                {' · '}{bestiary.threat_level}
              </span>
            )}
          </p>
        )}
      </div>

      {/* HP / AC badges */}
      <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
        <span style={{
          fontSize: 10, fontWeight: 700,
          color: selected ? 'var(--teal)' : 'var(--muted)',
          fontFamily: 'var(--font-body)',
        }}>
          {bestiary.hp}<span style={{ fontSize: 8, fontWeight: 400, color: 'var(--subtle)' }}> hp</span>
        </span>
        <span style={{ fontSize: 10, color: 'var(--subtle)', fontFamily: 'var(--font-body)' }}>·</span>
        <span style={{
          fontSize: 10, fontWeight: 700,
          color: 'var(--muted)', fontFamily: 'var(--font-body)',
        }}>
          {bestiary.ac}<span style={{ fontSize: 8, fontWeight: 400, color: 'var(--subtle)' }}> ac</span>
        </span>
      </div>
    </button>
  )
})

interface ForgeProps {
  onClick: () => void
  loading?: boolean
}

export const ForgeBestiaryCard = memo(function ForgeBestiaryCard({ onClick, loading }: ForgeProps) {
  return (
    <ForgeCard
      variant="compact"
      accent="teal"
      onClick={onClick}
      loading={loading}
      ariaLabel="Nieuw wezen aanmaken"
      title="+ Wezen toevoegen"
      subtitle="Voeg een nieuw wezen toe aan het bestiarium"
      icon={
        <svg
          aria-hidden="true"
          width="20" height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--teal)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ opacity: 0.7 }}
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
          <path d="M8 12s1.5 2 4 2 4-2 4-2" />
          <path d="M9 9h.01M15 9h.01" />
        </svg>
      }
    />
  )
})

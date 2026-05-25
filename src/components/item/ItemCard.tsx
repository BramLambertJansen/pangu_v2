import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Item } from '@/types/item.types'
import { EntityCard } from '@/components/ui/EntityCard'
import { ForgeCard } from '@/components/ui/ForgeCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { pickGradient, itemGradients } from '@/utils/pickGradient'
import { itemRarityLabel, itemRarityColor, itemTypeLabel } from '@/lib/statusMaps'

interface Props {
  item: Item
}

export const ItemCard = memo(function ItemCard({ item }: Props) {
  const navigate = useNavigate()
  const gradient = pickGradient(item.id, itemGradients)

  return (
    <EntityCard
      variant="compact"
      ariaLabel={`Item: ${item.name}`}
      onClick={() => navigate(`/items/${item.id}/edit`)}
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
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(18px, 3vw, 22px)',
              fontWeight: 600, lineHeight: 1,
              letterSpacing: '0.04em', textTransform: 'uppercase',
              color: 'var(--ink)', margin: 0,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {item.is_magical && (
                <span style={{ color: 'var(--gold)', marginRight: 6 }} aria-hidden="true">✦</span>
              )}
              {item.name}
            </h2>
          </div>

          <StatusBadge
            label={itemRarityLabel[item.rarity]}
            color={itemRarityColor[item.rarity]}
            className="mt-0.5"
          />
        </div>

        {/* Type + quantity row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <p style={{
            fontSize: 11, fontWeight: 700,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'var(--muted)', margin: 0,
            fontFamily: 'var(--font-body)',
          }}>
            {itemTypeLabel[item.item_type]}
          </p>
          {item.quantity > 1 && (
            <p style={{
              fontSize: 11, letterSpacing: '0.1em',
              color: 'var(--ink-soft)', margin: 0,
              fontFamily: 'var(--font-body)',
            }}>
              ×{item.quantity}
            </p>
          )}
        </div>

        {item.description && (
          <p style={{
            fontSize: 13, lineHeight: 1.65,
            color: 'var(--muted)', margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {item.description}
          </p>
        )}

        {!item.description && (
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, fontStyle: 'italic' }}>
            Een mysterieus voorwerp wacht op zijn bestemming.
          </p>
        )}
      </div>
    </EntityCard>
  )
})

interface ForgeProps {
  onClick: () => void
  loading?: boolean
}

export const ForgeItemCard = memo(function ForgeItemCard({ onClick, loading }: ForgeProps) {
  return (
    <ForgeCard
      variant="compact"
      accent="gold"
      onClick={onClick}
      loading={loading}
      ariaLabel="Nieuw item aanmaken"
      title="+ Item toevoegen"
      subtitle="Voeg een nieuw item toe aan de schatkist"
      icon={
        <svg
          aria-hidden="true"
          width="20" height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--gold)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ opacity: 0.7 }}
        >
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      }
    />
  )
})

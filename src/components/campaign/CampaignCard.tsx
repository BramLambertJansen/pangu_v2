import { useNavigate } from 'react-router-dom'
import type { Campaign } from '@/types/campaign.types'
import { EntityCard } from '@/components/ui/EntityCard'
import { ForgeCard } from '@/components/ui/ForgeCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { pickGradient, accentGradients } from '@/utils/pickGradient'
import { campaignStatusLabel, campaignStatusColor } from '@/lib/statusMaps'

interface Props {
  campaign: Campaign
}

export function CampaignCard({ campaign }: Props) {
  const navigate = useNavigate()
  const gradient = pickGradient(campaign.id, accentGradients)

  return (
    <EntityCard
      variant="compact"
      ariaLabel={`Kroniek: ${campaign.name}`}
      onClick={() => navigate(`/campaigns/${campaign.id}`)}
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
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            {campaign.subtitle && (
              <p style={{
                fontFamily: 'var(--font-quote)',
                fontStyle: 'italic',
                fontSize: 12, letterSpacing: '0.03em',
                color: 'var(--gold)', margin: '0 0 4px',
              }}>
                {campaign.subtitle}
              </p>
            )}
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(22px, 4vw, 28px)',
              fontWeight: 600, lineHeight: 1,
              letterSpacing: '0.04em', textTransform: 'uppercase',
              color: 'var(--ink)', margin: 0,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {campaign.name}
            </h2>
          </div>
          <StatusBadge
            label={campaignStatusLabel[campaign.status]}
            color={campaignStatusColor[campaign.status]}
            className="mt-0.5"
          />
        </div>

        {campaign.description && (
          <p style={{
            fontSize: 13, lineHeight: 1.65,
            color: 'var(--muted)', margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {campaign.description}
          </p>
        )}

        {!campaign.description && !campaign.subtitle && (
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, fontStyle: 'italic' }}>
            Een nieuwe kroniek wacht op zijn verhaal.
          </p>
        )}
      </div>
    </EntityCard>
  )
}

interface ForgeProps {
  onClick: () => void
  loading?: boolean
}

export function ForgeCampaignCard({ onClick, loading }: ForgeProps) {
  return (
    <ForgeCard
      variant="compact"
      accent="gold"
      onClick={onClick}
      loading={loading}
      ariaLabel="Nieuwe kroniek aanmaken"
      title="+ Nieuwe kroniek"
      subtitle="Voeg een kroniek toe aan deze wereld"
      icon={
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 28, color: 'var(--gold)', opacity: 0.6,
          lineHeight: 1, userSelect: 'none',
        }} aria-hidden="true">
          ✦
        </span>
      }
    />
  )
}

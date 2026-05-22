import { useNavigate } from 'react-router-dom'
import type { Campaign } from '@/types/campaign.types'
import { pickGradient, accentGradients } from '@/utils/pickGradient'
import { campaignStatusLabel, campaignStatusColor } from '@/lib/statusMaps'

interface Props {
  campaign: Campaign
}

export function CampaignCard({ campaign }: Props) {
  const navigate = useNavigate()
  const gradient = pickGradient(campaign.id, accentGradients)

  function handleActivate() {
    navigate(`/campaigns/${campaign.id}`)
  }

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Kroniek: ${campaign.name}`}
      onClick={handleActivate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleActivate() }
      }}
      style={{
        position: 'relative',
        borderRadius: 'var(--r-xl)',
        border: '1px solid var(--hairline)',
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 24px 20px',
        minHeight: 160,
        transition: 'border-color var(--t-base) var(--ease-out), box-shadow var(--t-base) var(--ease-out), transform var(--t-base) var(--ease-out)',
        outline: 'none',
        background: 'var(--void-2)',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget
        el.style.borderColor = 'var(--hairline-strong)'
        el.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px var(--hairline-strong)'
        el.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget
        el.style.borderColor = 'var(--hairline)'
        el.style.boxShadow = 'none'
        el.style.transform = 'translateY(0)'
      }}
      onFocus={(e) => { e.currentTarget.style.outline = '2px solid var(--violet)'; e.currentTarget.style.outlineOffset = '2px' }}
      onBlur={(e) => { e.currentTarget.style.outline = 'none' }}
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
                fontFamily: "'Cormorant Garamond', Georgia, serif",
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
          <span style={{
            display: 'inline-flex', alignItems: 'center', flexShrink: 0,
            padding: '3px 10px',
            background: campaignStatusColor[campaign.status],
            borderRadius: 'var(--r-full)',
            fontFamily: 'var(--font-body)',
            fontSize: 9, fontWeight: 700,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            color: 'var(--void)',
            marginTop: 2,
          }}>
            {campaignStatusLabel[campaign.status]}
          </span>
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
    </article>
  )
}

interface ForgeProps {
  onClick: () => void
  loading?: boolean
}

export function ForgeCampaignCard({ onClick, loading }: ForgeProps) {
  return (
    <article
      role="button"
      tabIndex={0}
      aria-label="Nieuwe kroniek aanmaken"
      onClick={() => { if (!loading) onClick() }}
      onKeyDown={(e) => {
        if (loading) return
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() }
      }}
      style={{
        position: 'relative',
        borderRadius: 'var(--r-xl)',
        border: '1px dashed var(--hairline-strong)',
        overflow: 'hidden',
        cursor: loading ? 'wait' : 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        minHeight: 160,
        gap: 10,
        transition: 'border-color var(--t-base) var(--ease-out), background var(--t-base) var(--ease-out)',
        outline: 'none',
        background: 'transparent',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--gold)'
        e.currentTarget.style.background = 'rgba(245,180,50,0.04)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--hairline-strong)'
        e.currentTarget.style.background = 'transparent'
      }}
      onFocus={(e) => { e.currentTarget.style.outline = '2px solid var(--violet)'; e.currentTarget.style.outlineOffset = '2px' }}
      onBlur={(e) => { e.currentTarget.style.outline = 'none' }}
    >
      <span style={{
        fontFamily: 'var(--font-display)',
        fontSize: 28, color: 'var(--gold)', opacity: 0.6,
        lineHeight: 1, userSelect: 'none',
      }} aria-hidden="true">
        ✦
      </span>
      <div style={{ textAlign: 'center' }}>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 12, fontWeight: 700,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          color: 'var(--gold)', margin: '0 0 4px',
        }}>
          {loading ? 'Aanmaken...' : '+ Nieuwe kroniek'}
        </p>
        <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
          Voeg een kroniek toe aan deze wereld
        </p>
      </div>
    </article>
  )
}

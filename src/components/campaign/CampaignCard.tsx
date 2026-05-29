import { memo, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Campaign } from '@/types/campaign.types'
import { ForgeCard } from '@/components/ui/ForgeCard'
import { pickGradient, coverGradients } from '@/utils/pickGradient'
import { campaignStatusLabel, campaignStatusColor } from '@/lib/statusMaps'

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']

function toRomanChapter(id: string): string {
  const code = (id.charCodeAt(0) || 0) + (id.charCodeAt(id.length - 1) || 0)
  return ROMAN[code % ROMAN.length]
}

// Solid badge background per status — dark-readable
const STATUS_BG: Record<string, string> = {
  'var(--violet)': 'rgba(155,138,255,1)',
  'var(--gold)':   'rgba(245,180,50,1)',
  'var(--teal)':   'rgba(62,207,178,1)',
  'var(--muted)':  'rgba(120,120,150,1)',
}

interface Props {
  campaign: Campaign
}

export const CampaignCard = memo(function CampaignCard({ campaign }: Props) {
  const navigate = useNavigate()
  const gradient = pickGradient(campaign.id, coverGradients)
  const chapter = toRomanChapter(campaign.id)
  const statusLabel = campaignStatusLabel[campaign.status]
  const statusColor = campaignStatusColor[campaign.status]
  const badgeBg = STATUS_BG[statusColor] ?? statusColor

  function handleKeyDown(e: KeyboardEvent<HTMLElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      navigate(`/campaigns/${campaign.id}`)
    }
  }

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Kroniek: ${campaign.name}`}
      onClick={() => navigate(`/campaigns/${campaign.id}`)}
      onKeyDown={handleKeyDown}
      style={{
        background: 'var(--surface)',
        borderRadius: 'var(--r-xl)',
        border: '1px solid rgba(245,180,50,0.28)',
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        outline: 'none',
        transition: 'border-color 0.22s var(--ease-out), box-shadow 0.22s var(--ease-out), transform 0.22s var(--ease-out)',
      }}
      className="campaign-card"
    >
      {/* ── Image section ── */}
      <div style={{ position: 'relative', aspectRatio: '16 / 9', overflow: 'hidden', flexShrink: 0 }}>
        {campaign.header_image ? (
          <img
            src={campaign.header_image}
            alt=""
            aria-hidden="true"
            style={{
              width: '100%', height: '100%',
              objectFit: 'cover',
              objectPosition: campaign.header_image_position || 'center',
              display: 'block',
            }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: gradient }} />
        )}

        {/* Violet tint — always-visible purple atmospheric layer */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, rgba(155,138,255,0.22) 0%, rgba(80,50,200,0.10) 50%, transparent 75%)',
            pointerEvents: 'none',
          }}
        />

        {/* Bottom vignette */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: '65%',
            background: 'linear-gradient(to top, rgba(8,6,20,0.92) 0%, rgba(8,6,20,0.4) 55%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Status badge — top right */}
        <div
          style={{
            position: 'absolute', top: 12, right: 12,
            background: badgeBg,
            color: 'var(--void)',
            fontFamily: 'var(--font-body)',
            fontSize: 10, fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            padding: '4px 10px',
            borderRadius: 'var(--r-full)',
            lineHeight: 1.4,
            userSelect: 'none',
          }}
        >
          {statusLabel}
        </div>

        {/* Chapter overlay — bottom left */}
        <div
          style={{
            position: 'absolute', bottom: 12, left: 16,
            display: 'flex', alignItems: 'center', gap: 7,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 38, fontWeight: 700, lineHeight: 1,
              color: 'var(--gold)',
              letterSpacing: '0.04em',
              textShadow: '0 2px 12px rgba(0,0,0,0.6)',
            }}
          >
            {chapter}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 9, fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.55)',
              lineHeight: 1,
            }}
          >
            HOOFDSTUK
          </span>
        </div>
      </div>

      {/* ── Content section ── */}
      <div
        style={{
          padding: '14px 18px 16px',
          display: 'flex', flexDirection: 'column', gap: 6, flex: 1,
        }}
      >
        {/* Tags / subtitle row */}
        {campaign.subtitle ? (
          <p
            style={{
              margin: 0,
              fontSize: 10, fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
          >
            {campaign.subtitle}
          </p>
        ) : null}

        {/* Campaign name */}
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(17px, 2.8vw, 22px)',
            fontWeight: 600, lineHeight: 1.2,
            letterSpacing: '0.03em',
            color: 'var(--ink)',
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {campaign.name}
        </h2>

        {/* Quote / description */}
        {campaign.description ? (
          <p
            style={{
              fontFamily: 'var(--font-quote)',
              fontStyle: 'italic',
              fontSize: 13, lineHeight: 1.55,
              color: 'var(--ink-soft)',
              margin: 0,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            &ldquo;{campaign.description}&rdquo;
          </p>
        ) : (
          !campaign.subtitle && (
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, fontStyle: 'italic' }}>
              Een nieuwe kroniek wacht op zijn verhaal.
            </p>
          )
        )}
      </div>
    </article>
  )
})

interface ForgeProps {
  onClick: () => void
  loading?: boolean
}

export const ForgeCampaignCard = memo(function ForgeCampaignCard({ onClick, loading }: ForgeProps) {
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
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 28, color: 'var(--gold)', opacity: 0.6,
            lineHeight: 1, userSelect: 'none',
          }}
          aria-hidden="true"
        >
          ✦
        </span>
      }
    />
  )
})

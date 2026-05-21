import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { Spinner } from '@/components/ui/Spinner'
import { WorldDetailDivider } from '@/components/world/WorldDetailDivider'
import type { Campaign, CampaignStatus } from '@/types/campaign.types'

const statusLabel: Record<CampaignStatus, string> = {
  draft: 'Concept',
  active: 'Actief',
  archived: 'Gearchiveerd',
  completed: 'Voltooid',
}

const cardGradients = [
  'radial-gradient(ellipse 70% 55% at 30% 40%, rgba(155,138,255,0.55) 0%, rgba(80,50,200,0.28) 45%, var(--void) 78%)',
  'radial-gradient(ellipse 65% 52% at 28% 42%, rgba(220,90,80,0.4) 0%, rgba(155,138,255,0.22) 50%, var(--void) 78%)',
  'radial-gradient(ellipse 65% 52% at 30% 42%, rgba(62,207,178,0.32) 0%, rgba(60,80,200,0.28) 50%, var(--void) 78%)',
  'radial-gradient(ellipse 65% 50% at 25% 40%, rgba(245,180,50,0.28) 0%, rgba(155,138,255,0.32) 50%, var(--void) 78%)',
]

function pickGradient(id: string): string {
  const code = (id.charCodeAt(0) ?? 0) + (id.charCodeAt(id.length - 1) ?? 0)
  return cardGradients[code % cardGradients.length]
}

const scrimGradient =
  'linear-gradient(to top, var(--void) 0%, rgba(10,10,22,0.97) 20%, rgba(10,10,22,0.72) 40%, rgba(10,10,22,0.18) 62%, transparent 82%)'

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: campaign, isLoading } = useQuery<Campaign>({
    queryKey: queryKeys.campaigns.detail(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as Campaign
    },
    enabled: !!id,
    staleTime: 1000 * 60,
  })

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }} aria-live="polite" aria-label="Kroniek laden...">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!campaign) {
    return (
      <div>
        <p style={{ color: 'var(--muted)' }}>Kroniek niet gevonden.</p>
        <button type="button" className="pangu-btn pangu-btn-ghost" onClick={() => navigate('/dashboard')} style={{ marginTop: 16 }}>
          ← Terug naar dashboard
        </button>
      </div>
    )
  }

  const initial = campaign.name.trim()[0]?.toUpperCase() ?? '?'
  const gradient = campaign.header_image ? undefined : pickGradient(campaign.id)

  return (
    <div>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <button
          type="button"
          onClick={() => navigate(`/worlds/${campaign.world_id}`)}
          aria-label="Terug naar wereld"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--muted)', fontSize: 12, fontWeight: 700,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            fontFamily: 'var(--font-body)', padding: 0,
            transition: 'color var(--t-fast)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink-soft)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
        >
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
          </svg>
          Terug naar wereld
        </button>

        <Link
          to={`/campaigns/${id}/edit`}
          aria-label={`${campaign.name} bewerken`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            color: 'var(--muted)', fontSize: 12, fontWeight: 700,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            fontFamily: 'var(--font-body)',
            textDecoration: 'none',
            transition: 'color var(--t-fast)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink-soft)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
        >
          <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
          </svg>
          Bewerken
        </Link>
      </div>

      {/* Campaign header — full-bleed like WorldDetailHeader */}
      <div
        style={{
          position: 'relative',
          borderRadius: 'var(--r-xl)',
          border: '1px solid var(--hairline)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 320,
        }}
      >
        {/* Background */}
        {campaign.header_image ? (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${campaign.header_image})`,
              backgroundSize: 'cover',
              backgroundPosition: campaign.header_image_position ?? 'center',
            }}
          />
        ) : (
          <div
            aria-hidden="true"
            style={{ position: 'absolute', inset: 0, background: `${gradient}, var(--void)` }}
          />
        )}

        {/* Scrim */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0,
            background: scrimGradient,
          }}
        />

        {/* Watermark */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '8%', left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(120px, 26vw, 260px)',
            fontWeight: 600,
            color: 'var(--ink)', opacity: 0.09,
            lineHeight: 1, userSelect: 'none', pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {initial}
        </div>

        {/* Status badge */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '20px 28px 0', position: 'relative' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '4px 12px',
            background: 'var(--gold)',
            borderRadius: 'var(--r-full)',
            fontFamily: 'var(--font-body)',
            fontSize: 10, fontWeight: 700,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            color: 'var(--void)',
          }}>
            {statusLabel[campaign.status]}
          </span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Content at bottom */}
        <div style={{ position: 'relative', padding: '0 clamp(28px, 4vw, 48px) 36px' }}>
          {campaign.subtitle && (
            <p style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic',
              fontSize: 14, letterSpacing: '0.03em',
              color: 'var(--gold)', margin: '0 0 10px',
            }}>
              {campaign.subtitle}
            </p>
          )}
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(40px, 6vw, 80px)',
            fontWeight: 600, lineHeight: 0.92,
            letterSpacing: '0.04em', textTransform: 'uppercase',
            color: 'var(--ink)', margin: '0 0 16px',
          }}>
            {campaign.name}
          </h1>
          {campaign.description && (
            <p style={{
              fontSize: 14, lineHeight: 1.7,
              color: 'var(--ink-soft)', margin: 0,
              maxWidth: 560,
            }}>
              {campaign.description}
            </p>
          )}
        </div>
      </div>

      <WorldDetailDivider label="Sessies in deze kroniek" />
    </div>
  )
}

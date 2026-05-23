import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { Spinner } from '@/components/ui/Spinner'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { WorldDetailDivider } from '@/components/world/WorldDetailDivider'
import type { Quest, QuestStatus } from '@/types/quest.types'

type QuestWithCampaign = Quest & {
  campaigns: { id: string; name: string; world_id: string; worlds: { id: string; name: string } | null } | null
}

const statusLabel: Record<QuestStatus, string> = {
  draft:     'Concept',
  active:    'Actief',
  completed: 'Voltooid',
  failed:    'Mislukt',
  archived:  'Gearchiveerd',
}

const statusColor: Record<QuestStatus, string> = {
  draft:     'var(--gold)',
  active:    'var(--violet)',
  completed: 'var(--teal)',
  failed:    'var(--crimson)',
  archived:  'var(--muted)',
}

const cardGradients = [
  'radial-gradient(ellipse 60% 80% at 25% 35%, rgba(245,180,50,0.30) 0%, rgba(200,120,30,0.16) 45%, var(--void) 78%)',
  'radial-gradient(ellipse 60% 80% at 28% 38%, rgba(245,180,50,0.26) 0%, rgba(155,138,255,0.16) 50%, var(--void) 78%)',
  'radial-gradient(ellipse 60% 80% at 30% 40%, rgba(155,138,255,0.26) 0%, rgba(245,180,50,0.18) 50%, var(--void) 78%)',
  'radial-gradient(ellipse 60% 80% at 25% 38%, rgba(245,180,50,0.24) 0%, rgba(62,207,178,0.18) 50%, var(--void) 78%)',
]

function pickGradient(id: string): string {
  const code = (id.charCodeAt(0) || 0) + (id.charCodeAt(id.length - 1) || 0)
  return cardGradients[code % cardGradients.length]
}

export default function QuestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: quest, isLoading } = useQuery<QuestWithCampaign>({
    queryKey: queryKeys.campaigns.questDetailFull(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quests')
        .select('*, campaigns(id, name, world_id, worlds(id, name))')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as QuestWithCampaign
    },
    enabled: !!id,
    staleTime: 1000 * 60,
  })

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }} aria-live="polite" aria-label="Quest laden...">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!quest) {
    return (
      <div>
        <p style={{ color: 'var(--muted)' }}>Quest niet gevonden.</p>
        <button type="button" className="pangu-btn pangu-btn-ghost" onClick={() => navigate('/dashboard')} style={{ marginTop: 16 }}>
          ← Terug naar dashboard
        </button>
      </div>
    )
  }

  const campaign = quest.campaigns
  const world = campaign?.worlds ?? null
  const gradient = pickGradient(quest.id)
  const initial = quest.name.trim()[0]?.toUpperCase() ?? '?'

  return (
    <div>
      <Breadcrumb
        items={[
          ...(world ? [{ label: world.name, onClick: () => navigate(`/worlds/${world.id}`) }] : []),
          ...(campaign ? [
            { label: campaign.name, onClick: () => navigate(`/campaigns/${campaign.id}`) },
            { label: 'Quests', onClick: () => navigate(`/campaigns/${campaign.id}/quests`) },
          ] : []),
          { label: 'Quest' },
        ]}
        actions={
          <Link
            to={`/quests/${id}/edit`}
            aria-label={`${quest.name} bewerken`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              color: 'var(--muted)', fontSize: 12, fontWeight: 700,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              fontFamily: 'var(--font-body)',
              textDecoration: 'none',
              transition: 'color var(--t-fast)',
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = 'var(--ink-soft)')}
            onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = 'var(--muted)')}
          >
            <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
            </svg>
            Bewerken
          </Link>
        }
      />

      {/* Header card */}
      <div
        style={{
          position: 'relative',
          borderRadius: 'var(--r-xl)',
          border: '1px solid var(--hairline)',
          overflow: 'hidden',
          minHeight: 260,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Gradient background */}
        <div
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, background: `${gradient}, var(--void)` }}
        />

        {/* Watermark */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '8%', left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(140px, 22vw, 280px)',
            fontWeight: 600,
            color: 'var(--ink)', opacity: 0.08,
            lineHeight: 1, userSelect: 'none', pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {initial}
        </div>

        {/* Type + status badges */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '20px 28px 0', flexWrap: 'wrap' }}>
          {quest.quest_type && (
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '4px 12px',
              border: '1px solid var(--gold)',
              borderRadius: 'var(--r-full)',
              fontFamily: 'var(--font-body)',
              fontSize: 10, fontWeight: 700,
              letterSpacing: '0.16em', textTransform: 'uppercase',
              color: 'var(--gold)',
              background: 'rgba(245,180,50,0.08)',
            }}>
              {quest.quest_type}
            </span>
          )}
          {quest.difficulty && (
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '4px 12px',
              border: '1px solid var(--hairline-strong)',
              borderRadius: 'var(--r-full)',
              fontFamily: 'var(--font-body)',
              fontSize: 10, fontWeight: 700,
              letterSpacing: '0.16em', textTransform: 'uppercase',
              color: 'var(--ink-soft)',
              background: 'rgba(255,255,255,0.04)',
            }}>
              {quest.difficulty}
            </span>
          )}
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '4px 12px',
            background: statusColor[quest.status],
            borderRadius: 'var(--r-full)',
            fontFamily: 'var(--font-body)',
            fontSize: 10, fontWeight: 700,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            color: 'var(--void)',
          }}>
            {statusLabel[quest.status]}
          </span>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ position: 'relative', padding: '0 clamp(24px, 4vw, 48px) 32px' }}>
          {quest.subtitle && (
            <p style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic',
              fontSize: 'clamp(14px, 1.6vw, 17px)', letterSpacing: '0.03em',
              color: 'var(--gold)', margin: '0 0 12px',
            }}>
              {quest.subtitle}
            </p>
          )}
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(40px, 6.5vw, 80px)',
            fontWeight: 600, lineHeight: 0.95,
            letterSpacing: '0.04em', textTransform: 'uppercase',
            color: 'var(--ink)', margin: 0,
            overflowWrap: 'break-word',
          }}>
            {quest.name}
          </h1>
        </div>
      </div>

      {/* Description */}
      <WorldDetailDivider label="Beschrijving" />
      {quest.description ? (
        <div className="pangu-surface" style={{ padding: 28 }}>
          <p style={{
            fontSize: 15, lineHeight: 1.75,
            color: 'var(--ink-soft)', margin: 0,
            whiteSpace: 'pre-wrap',
          }}>
            {quest.description}
          </p>
        </div>
      ) : (
        <p style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>
          Nog geen beschrijving toegevoegd.
        </p>
      )}

      {/* Reward */}
      {quest.reward && (
        <>
          <WorldDetailDivider label="Beloning" />
          <div
            className="pangu-surface"
            style={{
              padding: 28,
              borderColor: 'rgba(245,180,50,0.22)',
              background: 'linear-gradient(180deg, rgba(245,180,50,0.04), transparent)',
            }}
          >
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 10, fontWeight: 700,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              color: 'var(--gold)', margin: '0 0 12px',
            }}>
              ✦ Beloning
            </p>
            <p style={{
              fontSize: 14, lineHeight: 1.75,
              color: 'var(--ink-soft)', margin: 0,
              whiteSpace: 'pre-wrap',
            }}>
              {quest.reward}
            </p>
          </div>
        </>
      )}

      {/* DM notes */}
      <WorldDetailDivider label="DM-notities" />
      {quest.notes ? (
        <div
          className="pangu-surface"
          style={{
            padding: 28,
            borderColor: 'rgba(245,180,50,0.22)',
            background: 'linear-gradient(180deg, rgba(245,180,50,0.04), transparent)',
          }}
        >
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 10, fontWeight: 700,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: 'var(--gold)', margin: '0 0 12px',
          }}>
            ✦ Alleen zichtbaar voor de DM
          </p>
          <p style={{
            fontSize: 14, lineHeight: 1.75,
            color: 'var(--ink-soft)', margin: 0,
            whiteSpace: 'pre-wrap',
          }}>
            {quest.notes}
          </p>
        </div>
      ) : (
        <p style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>
          Nog geen DM-notities.
        </p>
      )}
    </div>
  )
}

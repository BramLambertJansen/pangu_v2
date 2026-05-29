import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useAuthStore } from '@/stores/auth.store'
import { useCampaignByInviteCode, useJoinCampaign } from '@/hooks/queries/useCampaignInvite'

export default function JoinPage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const { data: campaign, isLoading } = useCampaignByInviteCode(code)
  const join = useJoinCampaign()

  async function handleJoin() {
    if (!campaign || !user) return

    try {
      await join.mutateAsync({ campaignId: campaign.id, userId: user.id })
      toast.success(`Je hebt '${campaign.name}' betreden!`)
      navigate('/dashboard')
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code
      if (code === '23505') {
        toast.error('Je bent al lid van deze kroniek.')
      } else {
        toast.error('Deelnemen mislukt. Probeer het opnieuw.')
      }
    }
  }

  function handleLoginRedirect() {
    navigate(`/login?redirect=/join/${code}`)
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--void)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      {/* Logo */}
      <div style={{ marginBottom: 48, textAlign: 'center' }}>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--ink)',
          }}
        >
          PANGU
        </span>
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'var(--surface)',
          border: '1px solid var(--hairline)',
          borderRadius: 16,
          padding: '36px 32px',
          textAlign: 'center',
        }}
      >
        {isLoading ? (
          <div style={{ padding: '24px 0' }}>
            <Spinner size="md" />
          </div>
        ) : !campaign ? (
          <>
            <div style={{ fontSize: 40, marginBottom: 16 }} aria-hidden="true">⚔️</div>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22, fontWeight: 700,
                letterSpacing: '0.06em',
                color: 'var(--ink)',
                margin: '0 0 12px',
              }}
            >
              Ongeldige code
            </h1>
            <p style={{ fontSize: 14, color: 'var(--muted)', margin: '0 0 24px', lineHeight: 1.6 }}>
              Deze uitnodigingscode bestaat niet of is verlopen.
              Vraag de Dungeon Master om een nieuwe link.
            </p>
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              Naar dashboard
            </Button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 40, marginBottom: 16 }} aria-hidden="true">🗺️</div>
            <p style={{
              fontSize: 10, fontWeight: 700,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              color: 'var(--violet)', margin: '0 0 8px',
            }}>
              Uitnodiging voor een kroniek
            </p>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(20px, 5vw, 28px)',
                fontWeight: 700,
                letterSpacing: '0.06em',
                color: 'var(--ink)',
                margin: '0 0 8px',
              }}
            >
              {campaign.name}
            </h1>
            {campaign.subtitle && (
              <p style={{ fontSize: 14, color: 'var(--muted)', margin: '0 0 24px', fontStyle: 'italic' }}>
                {campaign.subtitle}
              </p>
            )}

            <div style={{ marginTop: campaign.subtitle ? 0 : 24 }}>
              {!user ? (
                <>
                  <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '0 0 16px', lineHeight: 1.6 }}>
                    Log in om deel te nemen aan deze kroniek.
                  </p>
                  <Button onClick={handleLoginRedirect} className="w-full">
                    Inloggen om deel te nemen
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleJoin}
                  loading={join.isPending}
                  className="w-full"
                >
                  Deelnemen aan {campaign.name}
                </Button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Code display */}
      {code && (
        <p style={{ marginTop: 24, fontSize: 12, color: 'var(--subtle)', letterSpacing: '0.08em' }}>
          Code: <span style={{ fontFamily: 'monospace', color: 'var(--muted)' }}>{code}</span>
        </p>
      )}
    </div>
  )
}

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Spinner } from '@/components/ui/Spinner'
import { generateInviteCode } from '@/utils/inviteCode'
import {
  useCampaignInvite,
  useSetInviteCode,
  useCampaignMembers,
} from '@/hooks/queries/useCampaignInvite'

interface InvitePanelProps {
  campaignId: string
  campaignName: string
}

export function InvitePanel({ campaignId, campaignName }: InvitePanelProps) {
  const [revokeOpen, setRevokeOpen] = useState(false)
  const { data: inviteCode, isLoading } = useCampaignInvite(campaignId)
  const { data: members, isLoading: isLoadingMembers } = useCampaignMembers(campaignId)
  const setCode = useSetInviteCode()

  const joinUrl = inviteCode ? `${window.location.origin}/join/${inviteCode}` : ''

  function handleGenerate() {
    const code = generateInviteCode()
    toast.promise(setCode.mutateAsync({ campaignId, code }), {
      loading: 'Code genereren...',
      success: 'Uitnodigingscode aangemaakt',
      error: 'Kon code niet aanmaken',
    })
  }

  function handleRegenerate() {
    const code = generateInviteCode()
    toast.promise(setCode.mutateAsync({ campaignId, code }), {
      loading: 'Nieuwe code genereren...',
      success: 'Uitnodigingscode vernieuwd',
      error: 'Kon code niet vernieuwen',
    })
  }

  function handleRevoke() {
    toast.promise(
      setCode.mutateAsync({ campaignId, code: null }).then(() => setRevokeOpen(false)),
      {
        loading: 'Code verwijderen...',
        success: 'Uitnodigingscode verwijderd',
        error: 'Kon code niet verwijderen',
      },
    )
  }

  function handleCopyCode() {
    if (!inviteCode) return
    navigator.clipboard.writeText(inviteCode).then(() => {
      toast.success('Code gekopieerd')
    }).catch(() => {
      toast.success(`Code: ${inviteCode}`)
    })
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(joinUrl).then(() => {
      toast.success('Link gekopieerd')
    }).catch(() => {
      toast.success(`Link: ${joinUrl}`)
    })
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
        <Spinner size="md" />
      </div>
    )
  }

  return (
    <section aria-labelledby="invite-heading">
      <h2
        id="invite-heading"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(22px, 4vw, 30px)',
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--ink)',
          margin: '0 0 24px',
        }}
      >
        Uitnodigingen
      </h2>

      {/* Invite code card */}
      <div
        className="surface"
        style={{
          padding: 28,
          borderColor: 'rgb(var(--violet-rgb) / 0.22)',
          background: 'linear-gradient(180deg, rgb(var(--violet-rgb) / 0.04), transparent)',
          marginBottom: 32,
        }}
      >
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 10, fontWeight: 700,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          color: 'var(--violet)', margin: '0 0 16px',
        }}>
          ✦ Uitnodigingscode
        </p>

        {!inviteCode ? (
          <>
            <p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: '0 0 20px', lineHeight: 1.6 }}>
              Genereer een code zodat spelers kunnen deelnemen aan <strong style={{ color: 'var(--ink)' }}>{campaignName}</strong>.
              Deel de code of stuur de link — ze hoeven alleen maar op de link te klikken.
            </p>
            <Button
              onClick={handleGenerate}
              loading={setCode.isPending}
            >
              Code genereren
            </Button>
          </>
        ) : (
          <>
            {/* Code display */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'clamp(16px, 5vw, 28px)', fontWeight: 700,
                letterSpacing: '0.12em',
                color: 'var(--ink)',
                background: 'rgb(var(--violet-rgb) / 0.08)',
                border: '1px solid rgb(var(--violet-rgb) / 0.2)',
                borderRadius: 8,
                padding: '10px 20px',
                wordBreak: 'break-word',
                maxWidth: '100%',
              }}>
                {inviteCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                aria-label="Code kopiëren"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--muted)', padding: 8, borderRadius: 6,
                  transition: 'color var(--t-fast)',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--ink)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
            </div>

            {/* Join URL */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgb(var(--ink-rgb) / 0.03)',
              border: '1px solid var(--hairline)',
              borderRadius: 6, padding: '8px 12px',
              marginBottom: 20,
            }}>
              <span style={{
                fontSize: 12, color: 'var(--muted)',
                fontFamily: 'monospace',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                flex: 1,
              }}>
                {joinUrl}
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                aria-label="Link kopiëren"
                style={{
                  flexShrink: 0,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--muted)', padding: 4, borderRadius: 4,
                  transition: 'color var(--t-fast)',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--ink)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRegenerate}
                loading={setCode.isPending}
              >
                Nieuwe code
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setRevokeOpen(true)}
                disabled={setCode.isPending}
              >
                Code verwijderen
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Member list */}
      <div>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 10, fontWeight: 700,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          color: 'var(--muted)', margin: '0 0 16px',
        }}>
          Deelnemers
        </p>

        {isLoadingMembers ? (
          <Spinner size="sm" />
        ) : !members || members.length === 0 ? (
          <p style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>
            Nog geen spelers betreden de kroniek.
          </p>
        ) : (
          <>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 12px' }}>
              {members.length} {members.length === 1 ? 'speler' : 'spelers'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {members.map(member => (
                <div
                  key={member.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px',
                    background: 'rgb(var(--ink-rgb) / 0.03)',
                    border: '1px solid var(--hairline)',
                    borderRadius: 8,
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'rgb(var(--violet-rgb) / 0.15)',
                    border: '1px solid rgb(var(--violet-rgb) / 0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: 'var(--violet)',
                    flexShrink: 0,
                  }}>
                    {(member.profiles?.display_name ?? member.profiles?.email ?? '?')[0].toUpperCase()}
                  </div>
                  <span style={{ fontSize: 14, color: 'var(--ink)' }}>
                    {member.profiles?.display_name ?? member.profiles?.email ?? member.user_id}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--subtle)', marginLeft: 'auto' }}>
                    Deelgenomen {new Date(member.joined_at).toLocaleDateString('nl-NL')}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={revokeOpen}
        onClose={() => setRevokeOpen(false)}
        onConfirm={handleRevoke}
        title="Code verwijderen?"
        confirmLabel="Verwijderen"
        loading={setCode.isPending}
      >
        De huidige uitnodigingscode wordt ongeldig. Spelers die de link al hebben kunnen dan niet meer deelnemen.
        Bestaande leden blijven toegevoegd.
      </ConfirmDialog>
    </section>
  )
}

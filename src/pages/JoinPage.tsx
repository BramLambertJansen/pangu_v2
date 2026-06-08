import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { PartyMemberRow } from '@/components/character/CharacterCard'
import { useAuthStore } from '@/stores/auth.store'
import { useCampaignByInviteCode, useJoinWithCharacter, useJoinAndCreateCharacter } from '@/hooks/queries/useCampaignInvite'
import { useUnassignedCharacters } from '@/hooks/queries/useCharacters'
import type { Character } from '@/types/character.types'

type Step = 'invite' | 'select-character'

export default function JoinPage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const { data: campaign, isLoading } = useCampaignByInviteCode(code)
  const { data: unassignedCharacters, isLoading: isLoadingCharacters } = useUnassignedCharacters()
  const joinWithCharacter = useJoinWithCharacter()
  const joinAndCreate = useJoinAndCreateCharacter()
  const [step, setStep] = useState<Step>('invite')
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)

  function handleLoginRedirect() {
    navigate(`/login?redirect=/join/${code}`)
  }

  async function handleConfirm() {
    if (!campaign || !user) return

    try {
      if (selectedCharacter) {
        await joinWithCharacter.mutateAsync({ campaignId: campaign.id, userId: user.id, characterId: selectedCharacter.id })
        toast.success(`Je hebt '${campaign.name}' betreden!`)
        navigate('/dashboard')
      } else {
        const newChar = await joinAndCreate.mutateAsync({ campaignId: campaign.id, userId: user.id })
        toast.success(`Je hebt '${campaign.name}' betreden!`)
        navigate(`/characters/${newChar.id}/edit`, { state: { isNew: true, joinCampaignId: campaign.id } })
      }
    } catch (err: unknown) {
      const errCode = (err as { code?: string })?.code
      if (errCode === '23505') {
        toast.error('Je bent al lid van deze kroniek.')
        setStep('invite')
      } else {
        toast.error('Deelnemen mislukt. Probeer het opnieuw.')
      }
    }
  }

  const isPending = joinWithCharacter.isPending || joinAndCreate.isPending

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

      {step === 'invite' ? (
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
                    onClick={() => setStep('select-character')}
                    className="w-full"
                  >
                    Deelnemen aan {campaign.name}
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        <div
          style={{
            width: '100%',
            maxWidth: 560,
            background: 'var(--surface)',
            border: '1px solid var(--hairline)',
            borderRadius: 16,
            padding: '36px 32px',
          }}
        >
          {/* Back button */}
          <button
            type="button"
            onClick={() => { setStep('invite'); setSelectedCharacter(null) }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--muted)',
              fontSize: 13,
              fontFamily: 'var(--font-body)',
              padding: '0 0 20px',
              marginBottom: 0,
            }}
            aria-label="Terug naar uitnodiging"
          >
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
            Terug
          </button>

          <p style={{
            fontSize: 10, fontWeight: 700,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: 'var(--violet)', margin: '0 0 6px',
          }}>
            Kies je karakter
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(18px, 4vw, 24px)',
              fontWeight: 700,
              letterSpacing: '0.06em',
              color: 'var(--ink)',
              margin: '0 0 24px',
            }}
          >
            {campaign?.name}
          </h2>

          {isLoadingCharacters ? (
            <div style={{ padding: '24px 0', display: 'flex', justifyContent: 'center' }}>
              <Spinner size="md" />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(unassignedCharacters ?? []).map(character => (
                <PartyMemberRow
                  key={character.id}
                  character={character}
                  selected={selectedCharacter?.id === character.id}
                  onSelect={() => setSelectedCharacter(prev => prev?.id === character.id ? null : character)}
                />
              ))}

              {/* Nieuw karakter maken option */}
              <button
                type="button"
                onClick={() => setSelectedCharacter(null)}
                aria-label="Nieuw karakter aanmaken voor deze kroniek"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '16px 20px',
                  borderRadius: 'var(--r-xl)',
                  border: `1px ${selectedCharacter === null ? 'solid' : 'dashed'} ${selectedCharacter === null ? 'rgb(var(--azure-rgb) / 0.6)' : 'rgb(var(--azure-rgb) / 0.35)'}`,
                  background: selectedCharacter === null ? 'rgb(var(--azure-rgb) / 0.06)' : 'rgb(var(--azure-rgb) / 0.03)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color var(--t-fast), background var(--t-fast)',
                  boxShadow: selectedCharacter === null ? '0 0 0 1px rgb(var(--azure-rgb) / 0.2)' : undefined,
                }}
                onMouseEnter={e => {
                  if (selectedCharacter !== null) {
                    const el = e.currentTarget
                    el.style.borderColor = 'rgb(var(--azure-rgb) / 0.6)'
                    el.style.background = 'rgb(var(--azure-rgb) / 0.06)'
                  }
                }}
                onMouseLeave={e => {
                  if (selectedCharacter !== null) {
                    const el = e.currentTarget
                    el.style.borderColor = 'rgb(var(--azure-rgb) / 0.35)'
                    el.style.background = 'rgb(var(--azure-rgb) / 0.03)'
                  }
                }}
              >
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  border: '1.5px dashed rgb(var(--azure-rgb) / 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  background: 'rgb(var(--azure-rgb) / 0.06)',
                }}>
                  <span style={{ fontSize: 22, lineHeight: 1, fontWeight: 300, color: 'var(--azure)', marginTop: -2 }}>+</span>
                </div>
                <div>
                  <p style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    color: 'var(--azure)',
                    fontFamily: 'var(--font-body)',
                  }}>
                    Nieuw karakter aanmaken
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
                    Je wordt doorgestuurd naar de karaktermaker
                  </p>
                </div>
              </button>
            </div>
          )}

          {/* Confirm button */}
          <div style={{ marginTop: 24 }}>
            <Button
              onClick={handleConfirm}
              loading={isPending}
              disabled={isLoadingCharacters}
              className="w-full"
            >
              {selectedCharacter
                ? `Deelnemen met ${selectedCharacter.name}`
                : 'Deelnemen en nieuw karakter maken'}
            </Button>
          </div>
        </div>
      )}

      {/* Code display */}
      {code && (
        <p style={{ marginTop: 24, fontSize: 12, color: 'var(--subtle)', letterSpacing: '0.08em' }}>
          Code: <span style={{ fontFamily: 'monospace', color: 'var(--muted)' }}>{code}</span>
        </p>
      )}
    </div>
  )
}

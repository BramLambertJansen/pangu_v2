import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { UserTable } from '@/components/admin/UserTable'
import { CreateUserModal } from '@/components/admin/CreateUserModal'
import { useAI } from '@/hooks/useAI'
import { useSyncStore, getQueryCacheKey } from '@/stores/sync.store'
import { queryClient } from '@/lib/queryClient'
import type { Provider } from '@/types/ai'

const PROVIDER_LABELS: Record<Provider, string> = {
  groq:      'Groq',
  gemini:    'Gemini',
  anthropic: 'Anthropic',
  openai:    'OpenAI',
}

const PROVIDER_COLORS: Record<Provider, string> = {
  groq:      'var(--teal)',
  gemini:    'var(--azure)',
  anthropic: 'var(--violet)',
  openai:    'var(--gold)',
}

interface AITestResult {
  reply: string
  provider: Provider
  model: string
  windowRemaining: number | null
}

export default function AdminPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [testResult, setTestResult] = useState<AITestResult | null>(null)

  const { ask, loading, lastProvider, lastModel, windowRemaining } = useAI()
  const syncEnabled = useSyncStore(s => s.syncEnabled)
  const setSyncEnabled = useSyncStore(s => s.setSyncEnabled)
  const devModeActive = !syncEnabled

  function handleEnableDevMode() {
    setSyncEnabled(false)
    toast.success('Dev modus ingeschakeld — schrijfacties worden geblokkeerd')
  }

  function handleDisableDevMode() {
    setSyncEnabled(true)
    localStorage.removeItem(getQueryCacheKey())
    queryClient.clear()
    toast.success('Dev modus uitgeschakeld — cache gewist, data wordt opgehaald uit de database')
  }

  async function handleTestAI() {
    setTestResult(null)
    try {
      const reply = await ask([
        {
          role: 'user',
          content:
            'Reageer in het Nederlands. Zeg in één zin welke AI-provider en model je bent, en geef een kort D&D-gezegde.',
        },
      ])
      if (lastProvider && lastModel) {
        setTestResult({
          reply,
          provider: lastProvider,
          model: lastModel,
          windowRemaining,
        })
      }
      toast.success('AI-test geslaagd')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'AI-test mislukt')
    }
  }

  return (
    <section aria-labelledby="admin-heading">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1
            id="admin-heading"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '22px',
              fontWeight: 600,
              letterSpacing: '0.1em',
              color: 'var(--ink)',
              margin: 0,
            }}
          >
            ACCOUNTBEHEER
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
            Overzicht en beheer van alle accounts
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          Nieuw account
        </Button>
      </div>

      <UserTable />

      {/* AI Integration test */}
      <div
        className="mt-10 rounded-xl p-6"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--hairline)',
        }}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '14px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                color: 'var(--ink-soft)',
                margin: 0,
              }}
            >
              AI-INTEGRATIE
            </h2>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--muted)' }}>
              Test de cascaderende AI-providers (Groq → Gemini)
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            loading={loading}
            onClick={handleTestAI}
            aria-label="Test AI-verbinding"
          >
            {loading ? 'Bezig…' : 'Test Gemini / Groq'}
          </Button>
        </div>

        {testResult && (
          <div
            className="mt-4 rounded-lg p-4 space-y-3"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--hairline)' }}
            role="status"
            aria-live="polite"
          >
            {/* Provider badge + model */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                style={{
                  background: `color-mix(in srgb, ${PROVIDER_COLORS[testResult.provider]} 15%, transparent)`,
                  color: PROVIDER_COLORS[testResult.provider],
                  border: `1px solid color-mix(in srgb, ${PROVIDER_COLORS[testResult.provider]} 35%, transparent)`,
                }}
              >
                {PROVIDER_LABELS[testResult.provider]}
              </span>
              <span className="text-xs" style={{ color: 'var(--muted)' }}>
                {testResult.model}
              </span>
              {testResult.windowRemaining !== null && testResult.windowRemaining >= 0 && (
                <span className="ml-auto text-xs" style={{ color: 'var(--subtle)' }}>
                  {testResult.windowRemaining} verzoek{testResult.windowRemaining !== 1 ? 'en' : ''} resterend
                </span>
              )}
            </div>

            {/* Reply */}
            <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
              {testResult.reply}
            </p>
          </div>
        )}
      </div>

      {/* Dev mode */}
      <div
        className="mt-10 rounded-xl p-6"
        style={{
          background: 'var(--surface)',
          border: `1px solid ${devModeActive ? 'color-mix(in srgb, var(--gold) 40%, transparent)' : 'var(--hairline)'}`,
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '14px',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  color: 'var(--ink-soft)',
                  margin: 0,
                }}
              >
                DEV MODUS
              </h2>
              <span
                className="rounded-full px-2 py-0.5 text-xs font-semibold"
                style={
                  devModeActive
                    ? {
                        background: 'color-mix(in srgb, var(--gold) 15%, transparent)',
                        color: 'var(--gold)',
                        border: '1px solid color-mix(in srgb, var(--gold) 35%, transparent)',
                      }
                    : {
                        background: 'color-mix(in srgb, var(--muted) 12%, transparent)',
                        color: 'var(--muted)',
                        border: '1px solid var(--hairline)',
                      }
                }
                aria-live="polite"
              >
                {devModeActive ? 'Actief' : 'Inactief'}
              </span>
            </div>
            <p className="text-xs max-w-sm" style={{ color: 'var(--muted)' }}>
              {devModeActive
                ? 'Alle schrijfacties zijn geblokkeerd. Data wordt gelezen uit de lokale cache.'
                : 'Schakel in om lokaal te testen zonder de database te wijzigen. Bij uitschakelen wordt de cache gewist en herlaadt de app.'}
            </p>
          </div>
          <Button
            variant={devModeActive ? 'danger' : 'secondary'}
            size="sm"
            onClick={devModeActive ? handleDisableDevMode : handleEnableDevMode}
            aria-pressed={devModeActive}
          >
            {devModeActive ? 'Uitschakelen' : 'Inschakelen'}
          </Button>
        </div>
      </div>

      <CreateUserModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </section>
  )
}

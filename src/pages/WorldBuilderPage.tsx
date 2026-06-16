import { useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAI } from '@/hooks/useAI'
import { Button } from '@/components/ui/Button'
import { useWorld } from '@/hooks/queries/useWorld'
import { Spinner } from '@/components/ui/Spinner'
import { CompassRose } from '@/components/world/CompassRose'

interface Shortcut {
  id: string
  label: string
  icon: React.ReactNode
  buildPrompt: (worldName: string) => string
}

const shortcuts: Shortcut[] = [
  {
    id: 'location',
    label: 'Locatie',
    icon: (
      <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
        <circle cx="12" cy="9" r="2.5" />
      </svg>
    ),
    buildPrompt: (name) =>
      `Creëer een rijke, sfeervolle locatie voor de wereld "${name}". Geef het een aansprekende naam, beschrijf de fysieke omgeving, unieke kenmerken, en waarom avonturiers hierheen getrokken zouden worden. Voeg een gevoel van mysterie of gevaar toe. Schrijf 2-3 paragrafen.`,
  },
  {
    id: 'npc',
    label: 'NPC',
    icon: (
      <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="7" r="3" />
        <circle cx="15" cy="7" r="3" />
        <path d="M3 21v-2a6 6 0 0 1 6-6h6a6 6 0 0 1 6 6v2" />
      </svg>
    ),
    buildPrompt: (name) =>
      `Creëer een gedenkwaardige NPC voor de wereld "${name}". Geef ze een naam, een rol of beroep, een opvallend fysiek kenmerk, een sterke motivatie, en een geheim of verborgen agenda. Maak ze levensecht en driedimensionaal. Schrijf 2-3 paragrafen.`,
  },
  {
    id: 'quest',
    label: 'Quest',
    icon: (
      <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <line x1="8" y1="7" x2="16" y2="7" />
        <line x1="8" y1="11" x2="16" y2="11" />
        <line x1="8" y1="15" x2="12" y2="15" />
      </svg>
    ),
    buildPrompt: (name) =>
      `Ontwerp een meeslepende questhaak voor de wereld "${name}". Bedenk een questnaam, een spannend openingsscenario dat spelers meteen grijpt, het hoofddoel, een of twee complicaties, en een betekenisvolle beloning. Schrijf 2-3 paragrafen.`,
  },
  {
    id: 'twist',
    label: 'Wending',
    icon: (
      <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
      </svg>
    ),
    buildPrompt: (name) =>
      `Verzin een verrassende plotwending voor een avontuur in de wereld "${name}". De wending moet iets dat de spelers dachten te begrijpen in een ander daglicht plaatsen, de inzet verhogen, en nieuwe verhaalmogelijkheden openen. Schrijf 1-2 paragrafen.`,
  },
  {
    id: 'rumour',
    label: 'Gerucht',
    icon: (
      <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19l-7-7 7-7" />
        <path d="M19 12H5" />
        <path d="M17 5c0 4.4-2.7 8-6 10" />
      </svg>
    ),
    buildPrompt: (name) =>
      `Schrijf een intrigerend kroeggerucht dat avonturiers zouden kunnen opvangen in de wereld "${name}". Het moet hinten naar een groter mysterie, lokaal gevaar, of een kans — maar laat genoeg twijfel of het waar of onwaar is. Schrijf 1 korte paragraaf, in de stem van de wereld.`,
  },
  {
    id: 'loot',
    label: 'Buit',
    icon: (
      <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6l9-4 9 4v6c0 5-4 9-9 10C7 21 3 17 3 12V6z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
    buildPrompt: (name) =>
      `Beschrijf een uniek magisch voorwerp gevonden in de wereld "${name}". Geef het een naam, een sprekend uiterlijk, een ontstaansverhaal, en een of twee interessante eigenschappen of krachten. Laat het voelen alsof het specifiek bij deze wereld hoort. Schrijf 1-2 paragrafen.`,
  },
]

export default function WorldBuilderPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { ask, loading: aiLoading, lastProvider, lastModel } = useAI()
  const { ask: checkAsk, loading: checkLoading } = useAI()

  const [prompt, setPrompt] = useState('')
  const [response, setResponse] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [consistencyResult, setConsistencyResult] = useState<string | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const forgeCardRef = useRef<HTMLDivElement>(null)

  const { data: world, isLoading } = useWorld(id)

  const handleShortcut = useCallback((shortcut: Shortcut) => {
    if (!world) return
    const filled = shortcut.buildPrompt(world.name)
    setPrompt(filled)
    // Scroll forge card into view and focus textarea
    setTimeout(() => {
      forgeCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      textareaRef.current?.focus()
    }, 50)
  }, [world])

  async function handleGenerate() {
    if (!prompt.trim()) {
      toast.error('Beschrijf eerst wat je wil genereren')
      return
    }
    try {
      const worldCtx = world
        ? `World: "${world.name}". ${world.description ? world.description.trim() : ''}`
        : ''
      const fullPrompt = worldCtx
        ? `${worldCtx}\n\n${prompt.trim()}`
        : prompt.trim()

      const reply = await ask([{ role: 'user', content: fullPrompt }], 'Wereldbouwer inhoud gegenereerd')
      setResponse(reply)
      setConsistencyResult(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Genereren mislukt')
    }
  }

  async function handleCopy() {
    if (!response) return
    try {
      await navigator.clipboard.writeText(response)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Kopiëren mislukt')
    }
  }

  async function handleConsistencyCheck() {
    if (!response || !world) return
    try {
      const worldCtx = `World: "${world.name}". ${world.description ? world.description.trim() : ''}`
      const checkPrompt = `${worldCtx}\n\nReview the following generated content for consistency with this world's established context. Point out any contradictions, tone mismatches, or elements that feel out of place. If everything fits well, confirm it briefly.\n\nGenerated content:\n"${response}"`
      const result = await checkAsk([{ role: 'user', content: checkPrompt }])
      setConsistencyResult(result)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Consistentiecheck mislukt')
    }
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }} aria-live="polite" aria-label="Laden...">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!world) {
    return (
      <div>
        <p style={{ color: 'var(--muted)' }}>Wereld niet gevonden.</p>
        <Button variant="ghost" onClick={() => navigate('/worlds')} style={{ marginTop: 16 }}>
          ← Terug naar werelden
        </Button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', paddingBottom: 80 }}>

      {/* Back navigation */}
      <button
        type="button"
        onClick={() => navigate(`/worlds/${id}`)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 32px',
          fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          color: 'var(--muted)',
          transition: 'color var(--t-fast)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink-soft)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
        aria-label={`Terug naar ${world.name}`}
      >
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        Terug naar {world.name}
      </button>

      {/* Hero header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 40 }}>
        <div style={{ flexShrink: 0, marginTop: 6, opacity: 0.7 }}>
          <CompassRose size={52} />
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.2em', textTransform: 'uppercase',
            color: 'var(--violet)', margin: '0 0 8px',
          }}>
            Lore Forge · {world.name}
          </p>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(36px, 8vw, 56px)',
            fontWeight: 600, lineHeight: 0.9,
            letterSpacing: '0.04em', textTransform: 'uppercase',
            color: 'var(--ink)', margin: '0 0 16px',
          }}>
            De Wereldbouwer
          </h1>
          <p style={{
            fontSize: 15, lineHeight: 1.65,
            color: 'var(--ink-soft)', margin: 0,
          }}>
            Raadpleeg de kosmos. Vraag wat je verhaal nodig heeft. Voeg het toe aan je wereld.
          </p>
        </div>
      </div>

      {/* Forge input card */}
      <div
        ref={forgeCardRef}
        className="surface"
        style={{ padding: 28, marginBottom: 32 }}
      >
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
          letterSpacing: '0.2em', textTransform: 'uppercase',
          color: 'var(--violet)', margin: '0 0 10px',
        }}>
          Smeed Nieuwe Lore
        </p>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(22px, 5vw, 30px)',
          fontWeight: 600, lineHeight: 1,
          letterSpacing: '0.04em', textTransform: 'uppercase',
          color: 'var(--ink)', margin: '0 0 20px',
        }}>
          Vraag, en de sterren antwoorden.
        </h2>

        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="bijv. 'Een kerker gebouwd in de ribbenkas van een dode god'"
          disabled={aiLoading}
          aria-label="Beschrijf wat je wil genereren"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              handleGenerate()
            }
          }}
          style={{
            width: '100%', boxSizing: 'border-box',
            minHeight: 120,
            padding: '14px 16px',
            background: 'var(--void)',
            border: '1px solid var(--hairline)',
            borderRadius: 12,
            color: 'var(--ink)',
            fontSize: 15, lineHeight: 1.6,
            fontFamily: 'var(--font-body)',
            resize: 'vertical',
            outline: 'none',
            transition: 'border-color var(--t-fast)',
            opacity: aiLoading ? 0.6 : 1,
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'rgb(var(--violet-rgb) / 0.45)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--hairline)')}
        />

        <button
          type="button"
          onClick={handleGenerate}
          disabled={aiLoading}
          aria-label="Genereer content"
          style={{
            marginTop: 14,
            width: '100%',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '14px 24px',
            background: aiLoading
              ? 'rgb(var(--violet-rgb) / 0.15)'
              : 'linear-gradient(135deg, rgb(var(--violet-rgb) / 0.25) 0%, rgb(var(--violet-rgb) / 0.12) 100%)',
            border: '1px solid rgb(var(--violet-rgb) / 0.35)',
            borderRadius: 'var(--r-full)',
            color: 'var(--violet)',
            fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            cursor: aiLoading ? 'not-allowed' : 'pointer',
            transition: 'background var(--t-fast), border-color var(--t-fast)',
          }}
          onMouseEnter={(e) => {
            if (!aiLoading) {
              e.currentTarget.style.background = 'rgb(var(--violet-rgb) / 0.22)'
              e.currentTarget.style.borderColor = 'rgb(var(--violet-rgb) / 0.55)'
            }
          }}
          onMouseLeave={(e) => {
            if (!aiLoading) {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgb(var(--violet-rgb) / 0.25) 0%, rgb(var(--violet-rgb) / 0.12) 100%)'
              e.currentTarget.style.borderColor = 'rgb(var(--violet-rgb) / 0.35)'
            }
          }}
        >
          {aiLoading ? (
            <>
              <Spinner size="sm" />
              Genereren...
            </>
          ) : (
            <>
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
              </svg>
              Genereer
            </>
          )}
        </button>
      </div>

      {/* Shortcuts */}
      <p style={{
        fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
        letterSpacing: '0.2em', textTransform: 'uppercase',
        color: 'var(--muted)', margin: '0 0 14px',
      }}>
        Snelkoppelingen
      </p>
      <div
        role="group"
        aria-label="Snelkoppelingen voor contentgeneratie"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          marginBottom: 32,
        }}
      >
        {shortcuts.map((sc) => (
          <button
            key={sc.id}
            type="button"
            onClick={() => handleShortcut(sc)}
            disabled={aiLoading}
            aria-label={`Snelkoppeling: ${sc.label}`}
            style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '22px 16px',
              background: 'var(--surface)',
              border: '1px solid var(--hairline)',
              borderRadius: 14,
              color: 'var(--muted)',
              fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              cursor: aiLoading ? 'not-allowed' : 'pointer',
              transition: 'background var(--t-fast), border-color var(--t-fast), color var(--t-fast)',
              opacity: aiLoading ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!aiLoading) {
                e.currentTarget.style.background = 'var(--surface-2)'
                e.currentTarget.style.borderColor = 'rgb(var(--violet-rgb) / 0.3)'
                e.currentTarget.style.color = 'var(--ink-soft)'
              }
            }}
            onMouseLeave={(e) => {
              if (!aiLoading) {
                e.currentTarget.style.background = 'var(--surface)'
                e.currentTarget.style.borderColor = 'var(--hairline)'
                e.currentTarget.style.color = 'var(--muted)'
              }
            }}
          >
            {sc.icon}
            {sc.label}
          </button>
        ))}
      </div>

      {/* Response area */}
      {response ? (
        <div
          className="surface"
          style={{
            padding: 28,
            background: 'linear-gradient(rgb(from var(--violet) r g b / 0.06), rgb(from var(--violet) r g b / 0.06)), var(--surface)',
            borderColor: 'rgb(var(--violet-rgb) / 0.2)',
          }}
        >
          {/* Response header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
              letterSpacing: '0.2em', textTransform: 'uppercase',
              color: 'var(--violet)', margin: 0,
            }}>
              ✦ De kosmos spreekt
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {lastProvider && (
                <span style={{
                  fontFamily: 'var(--font-body)', fontSize: 9, fontWeight: 700,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: 'var(--subtle)',
                  padding: '3px 8px',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--hairline)',
                  borderRadius: 'var(--r-full)',
                }}>
                  {lastProvider}{lastModel ? ` · ${lastModel}` : ''}
                </span>
              )}
              <button
                type="button"
                onClick={handleCopy}
                aria-label="Kopieer naar klembord"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '5px 12px',
                  background: copied ? 'rgb(var(--teal-rgb) / 0.12)' : 'var(--surface-2)',
                  border: `1px solid ${copied ? 'rgb(var(--teal-rgb) / 0.35)' : 'var(--hairline)'}`,
                  borderRadius: 'var(--r-full)',
                  color: copied ? 'var(--teal)' : 'var(--muted)',
                  fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'all var(--t-fast)',
                }}
              >
                {copied ? (
                  <>
                    <svg aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    Gekopieerd
                  </>
                ) : (
                  <>
                    <svg aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    Kopieer
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Response text */}
          <p style={{
            fontSize: 15, lineHeight: 1.8,
            color: 'var(--ink-soft)',
            margin: 0,
            whiteSpace: 'pre-wrap',
          }}>
            {response}
          </p>

          {/* Generate again + consistency check */}
          <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={aiLoading || checkLoading}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'none', border: 'none',
                color: 'var(--violet)', cursor: (aiLoading || checkLoading) ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
                letterSpacing: '0.16em', textTransform: 'uppercase',
                padding: 0, opacity: (aiLoading || checkLoading) ? 0.5 : 1,
                transition: 'opacity var(--t-fast)',
              }}
              aria-label="Opnieuw genereren"
            >
              <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 4v6h-6M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              Opnieuw genereren
            </button>

            <button
              type="button"
              onClick={handleConsistencyCheck}
              disabled={aiLoading || checkLoading}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'none', border: 'none',
                color: checkLoading ? 'var(--muted)' : 'var(--teal)',
                cursor: (aiLoading || checkLoading) ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
                letterSpacing: '0.16em', textTransform: 'uppercase',
                padding: 0, opacity: (aiLoading || checkLoading) ? 0.5 : 1,
                transition: 'opacity var(--t-fast)',
              }}
              aria-label="Controleer consistentie van de gegenereerde content"
            >
              {checkLoading ? (
                <>
                  <Spinner size="sm" />
                  Controleren...
                </>
              ) : (
                <>
                  <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                  Consistentiecheck
                </>
              )}
            </button>
          </div>

          {/* Consistency check result */}
          {consistencyResult && (
            <div style={{
              marginTop: 20,
              padding: '16px 18px',
              background: 'linear-gradient(rgb(from var(--teal) r g b / 0.07), rgb(from var(--teal) r g b / 0.07)), var(--surface)',
              border: '1px solid rgb(var(--teal-rgb) / 0.2)',
              borderRadius: 12,
            }}>
              <p style={{
                fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
                letterSpacing: '0.18em', textTransform: 'uppercase',
                color: 'var(--teal)', margin: '0 0 10px',
              }}>
                ✦ Consistentieanalyse
              </p>
              <p style={{
                fontSize: 14, lineHeight: 1.75,
                color: 'var(--ink-soft)',
                margin: 0,
                whiteSpace: 'pre-wrap',
              }}>
                {consistencyResult}
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Empty / awaiting state */
        <div
          style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '52px 24px',
            border: '1.5px dashed var(--hairline)',
            borderRadius: 'var(--r-xl)',
            textAlign: 'center',
          }}
        >
          <div style={{ opacity: 0.18, marginBottom: 20 }}>
            <CompassRose size={80} />
          </div>
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(20px, 4vw, 26px)',
            fontWeight: 600, lineHeight: 1,
            letterSpacing: '0.05em', textTransform: 'uppercase',
            color: 'var(--ink-soft)', margin: '0 0 10px',
          }}>
            De Kosmos Wacht
          </h3>
          <p style={{
            fontSize: 14, lineHeight: 1.6,
            color: 'var(--muted)', margin: 0, maxWidth: 280,
          }}>
            Kies een snelkoppeling, of beschrijf wat je nodig hebt. De sterren hebben geduld.
          </p>
        </div>
      )}
    </div>
  )
}

import { useEffect, useRef, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth.store'
import { usePreferencesStore } from '@/stores/preferences.store'
import { useCampaignCharacters } from '@/hooks/queries/useCampaignCharacters'
import { useMySessionNote, useSavePlayerNote } from '@/hooks/queries/usePlayerNotes'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'

interface Props {
  sessionId: string
  campaignId: string
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function PlayerNotepad({ sessionId, campaignId }: Props) {
  const { user } = useAuthStore()
  const autosave = usePreferencesStore((s) => s.autosaveNotes)

  const { data: existingNote, isLoading } = useMySessionNote(sessionId)
  const { data: characters } = useCampaignCharacters(campaignId)
  const { mutateAsync: saveNote } = useSavePlayerNote()

  const myCharacter = characters?.find((c) => c.user_id === user?.id) ?? null

  const [content, setContent] = useState('')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialised = useRef(false)

  useEffect(() => {
    initialised.current = false
    setContent('')
    setLastSaved(null)
  }, [sessionId])

  useEffect(() => {
    if (!isLoading && !initialised.current) {
      setContent(existingNote?.content ?? '')
      if (existingNote?.updated_at) setLastSaved(new Date(existingNote.updated_at))
      initialised.current = true
    }
  }, [isLoading, existingNote])

  const save = useCallback(async (text: string) => {
    if (!user) return
    setSaveStatus('saving')
    try {
      await saveNote({
        sessionId,
        userId: user.id,
        characterId: myCharacter?.id ?? null,
        content: text,
      })
      setSaveStatus('saved')
      setLastSaved(new Date())
    } catch {
      setSaveStatus('error')
      toast.error('Notitie opslaan mislukt')
    }
  }, [user, sessionId, myCharacter, saveNote])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    setContent(text)
    if (!autosave) return
    setSaveStatus('idle')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => save(text), 800)
  }

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })

  return (
    <div
      className="pangu-surface"
      style={{
        padding: 24,
        borderColor: 'rgb(var(--violet-rgb) / 0.22)',
        background: 'linear-gradient(180deg, rgb(var(--violet-rgb) / 0.04), transparent)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 8, flexWrap: 'wrap' }}>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 10, fontWeight: 700,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          color: 'var(--violet)', margin: 0,
        }}>
          ✦ {myCharacter ? myCharacter.name : 'Mijn notities'}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {saveStatus === 'saving' && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)' }}>
              <Spinner size="sm" />
              Opslaan...
            </span>
          )}
          {saveStatus === 'saved' && lastSaved && (
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>
              Opgeslagen om {formatTime(lastSaved)}
            </span>
          )}
          {saveStatus === 'idle' && lastSaved && (
            <span style={{ fontSize: 11, color: 'var(--subtle)' }}>
              Opgeslagen om {formatTime(lastSaved)}
            </span>
          )}
          {!autosave && (
            <Button variant="secondary" size="sm"
              onClick={() => save(content)}
              disabled={saveStatus === 'saving'}
              aria-label="Notitie opslaan"
            >
              Opslaan
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }} aria-live="polite" aria-label="Notities laden...">
          <Spinner size="md" />
        </div>
      ) : (
        <textarea
          value={content}
          onChange={handleChange}
          placeholder="Schrijf hier je aantekeningen voor deze sessie..."
          aria-label="Spelernotitie"
          style={{
            width: '100%',
            minHeight: 180,
            background: 'rgb(var(--ink-rgb) / 0.03)',
            border: '1px solid var(--hairline)',
            borderRadius: 8,
            padding: '12px 14px',
            color: 'var(--ink-soft)',
            fontSize: 14,
            lineHeight: 1.7,
            fontFamily: 'var(--font-body)',
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color var(--t-fast)',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'rgb(var(--violet-rgb) / 0.5)')}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--hairline)'
            if (!autosave) return
            if (debounceRef.current) {
              clearTimeout(debounceRef.current)
              debounceRef.current = null
              save(content)
            }
          }}
        />
      )}
    </div>
  )
}

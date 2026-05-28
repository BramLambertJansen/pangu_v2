import { useState } from 'react'
import { toast } from 'sonner'
import { useSessionPlayerNotes } from '@/hooks/queries/usePlayerNotes'
import { Spinner } from '@/components/ui/Spinner'
import type { PlayerNoteWithCharacter } from '@/types/player_note.types'

interface Props {
  sessionId: string
}

function formatUpdated(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function NoteCard({ note }: { note: PlayerNoteWithCharacter }) {
  const [open, setOpen] = useState(true)
  const label = note.character?.name ?? 'Speler'

  return (
    <div
      style={{
        border: '1px solid var(--hairline)',
        borderRadius: 10,
        overflow: 'hidden',
        background: 'var(--surface)',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          gap: 8,
        }}
      >
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize: 11, fontWeight: 700,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'var(--violet)',
        }}>
          {label}
          {note.character?.character_class && (
            <span style={{ color: 'var(--muted)', fontWeight: 400, marginLeft: 8, textTransform: 'none', letterSpacing: 0 }}>
              · {note.character.character_class}
            </span>
          )}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, color: 'var(--subtle)' }}>
            {formatUpdated(note.updated_at)}
          </span>
          <svg
            aria-hidden="true"
            width="12" height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              color: 'var(--muted)',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform var(--t-fast)',
              flexShrink: 0,
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>
      {open && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--hairline)' }}>
          {note.content ? (
            <p style={{
              fontSize: 14, lineHeight: 1.75,
              color: 'var(--ink-soft)', margin: '12px 0 0',
              whiteSpace: 'pre-wrap',
            }}>
              {note.content}
            </p>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'italic', margin: '12px 0 0' }}>
              Geen inhoud.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export function DmPlayerNotesPanel({ sessionId }: Props) {
  const { data: notes, isLoading } = useSessionPlayerNotes(sessionId)

  const handleCopyAll = async () => {
    if (!notes?.length) return
    const text = notes
      .map((n) => {
        const header = n.character?.name ?? 'Speler'
        return `${header}:\n${n.content || '(leeg)'}`
      })
      .join('\n\n---\n\n')
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Alle notities gekopieerd')
    } catch {
      toast.error('Kopiëren mislukt')
    }
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }} aria-live="polite" aria-label="Notities laden...">
        <Spinner size="md" />
      </div>
    )
  }

  if (!notes?.length) {
    return (
      <p style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>
        Nog geen spelernotities voor deze sessie.
      </p>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button
          type="button"
          className="pangu-btn pangu-btn-ghost pangu-btn-sm"
          onClick={handleCopyAll}
          aria-label="Alle spelernotities kopiëren naar klembord"
        >
          <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 5 }}>
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          Alles kopiëren
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {notes.map((note) => (
          <NoteCard key={note.id} note={note} />
        ))}
      </div>
    </div>
  )
}

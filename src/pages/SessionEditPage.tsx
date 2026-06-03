import { useId } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useEntityEdit } from '@/hooks/useEntityEdit'
import { useSession, useSaveSession, useDeleteSession } from '@/hooks/queries/useSession'
import type { SessionStatus } from '@/types/session.types'

const statusOptions: { value: SessionStatus; label: string }[] = [
  { value: 'planned',   label: 'Gepland'       },
  { value: 'active',    label: 'Actief'        },
  { value: 'completed', label: 'Voltooid'      },
  { value: 'archived',  label: 'Gearchiveerd'  },
]

export default function SessionEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  const descriptionId = useId()
  const notesId = useId()
  const statusId = useId()
  const sessionNumberId = useId()
  const sessionDateId = useId()

  const locationState = location.state as { isNew?: boolean; campaignId?: string } | null
  const isNew = locationState?.isNew ?? false
  const campaignIdFromState = locationState?.campaignId

  const { data: session, isLoading } = useSession(id)
  const saveSession = useSaveSession(id!)
  const deleteSession = useDeleteSession(id!)

  const {
    form, set, dirty, setDirty,
    committed, setCommitted,
    deleteOpen, setDeleteOpen,
    resetForm, guard,
  } = useEntityEdit({ entity: session, isNew })

  const campaignId = session?.campaign_id ?? campaignIdFromState

  async function handleDiscardConfirm() {
    if (guard.isDraftDiscard) {
      try {
        await deleteSession.mutateAsync({ campaignId })
      } catch {
        return
      }
    }
    const handled = guard.confirmLeave()
    if (!handled) {
      if (campaignId) navigate(`/campaigns/${campaignId}/sessions`)
      else navigate('/dashboard')
    }
  }

  function handleCancel() {
    if (!committed) {
      guard.requestDiscard()
    } else {
      resetForm()
      if (campaignId) navigate(`/campaigns/${campaignId}/sessions`)
      else navigate('/dashboard')
    }
  }

  function handleBack() {
    if (!committed) {
      guard.requestDiscard()
    } else {
      if (campaignId) navigate(`/campaigns/${campaignId}/sessions`)
      else navigate('/dashboard')
    }
  }

  function handleSave() {
    toast.promise(
      saveSession.mutateAsync({ ...form }).then(() => {
        setCommitted(true)
        setDirty(false)
      }),
      { loading: 'Opslaan...', success: 'Sessie opgeslagen', error: 'Opslaan mislukt' },
    )
  }

  function handleDelete() {
    toast.promise(
      deleteSession.mutateAsync({ campaignId }).then(() => {
        if (campaignId) navigate(`/campaigns/${campaignId}/sessions`)
        else navigate('/dashboard')
      }),
      { loading: 'Verwijderen...', success: 'Sessie verwijderd', error: 'Verwijderen mislukt' },
    )
    setDeleteOpen(false)
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }} aria-live="polite" aria-label="Sessie laden...">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!session) {
    return (
      <div>
        <p style={{ color: 'var(--muted)' }}>Sessie niet gevonden.</p>
        <Button variant="ghost" onClick={() => navigate('/dashboard')} style={{ marginTop: 16 }}>
          ← Terug naar dashboard
        </Button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <div style={{ maxWidth: 820, width: '100%' }}>

        {/* Back link */}
        <button
          type="button"
          onClick={handleBack}
          aria-label="Terug naar sessies"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--muted)', fontSize: 12, fontWeight: 700,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            fontFamily: 'var(--font-body)',
            marginBottom: 24, padding: 0,
            transition: 'color var(--t-fast)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink-soft)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
        >
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
          </svg>
          Terug naar sessies
        </Button>

        {/* Page header */}
        <header style={{ marginBottom: 40 }}>
          <p className="pangu-eyebrow">Sessie bewerken</p>
          <h1 className="pangu-display-xl">{session.name}</h1>
          <p style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-soft)' }}>
            Pas de details van deze sessie aan.
          </p>
        </header>

        {/* Form */}
        <div className="pangu-surface" style={{ padding: 28 }}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <div>
              <label className="pangu-label" htmlFor="session-name">Naam</label>
              <input
                id="session-name"
                className="pangu-input"
                value={form.name ?? ''}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Naam van de sessie"
              />
            </div>

            <div>
              <label className="pangu-label" htmlFor="session-subtitle">Subtitel</label>
              <input
                id="session-subtitle"
                className="pangu-input"
                value={form.subtitle ?? ''}
                onChange={(e) => set('subtitle', e.target.value || null)}
                placeholder="Korte beschrijving of tagline"
              />
            </div>

            <div>
              <label className="pangu-label" htmlFor={sessionNumberId}>Sessienummer</label>
              <input
                id={sessionNumberId}
                className="pangu-input"
                type="number"
                min={1}
                value={form.session_number ?? ''}
                onChange={(e) => set('session_number', e.target.value ? parseInt(e.target.value, 10) : null)}
                placeholder="1"
              />
            </div>

            <div>
              <label className="pangu-label" htmlFor={sessionDateId}>Datum</label>
              <input
                id={sessionDateId}
                className="pangu-input"
                type="date"
                value={form.session_date ?? ''}
                onChange={(e) => set('session_date', e.target.value || null)}
              />
            </div>

            <div>
              <label className="pangu-label" htmlFor={statusId}>Status</label>
              <select
                id={statusId}
                className="pangu-select"
                value={form.status ?? 'planned'}
                onChange={(e) => set('status', e.target.value as SessionStatus)}
              >
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="pangu-label" htmlFor={descriptionId}>Beschrijving</label>
              <textarea
                id={descriptionId}
                className="pangu-textarea"
                value={form.description ?? ''}
                onChange={(e) => set('description', e.target.value || null)}
                placeholder="Beschrijf de sessie, haar sfeer en achtergrond..."
                rows={4}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="pangu-label" htmlFor={notesId}>DM notities</label>
              <textarea
                id={notesId}
                className="pangu-textarea"
                value={form.notes ?? ''}
                onChange={(e) => set('notes', e.target.value || null)}
                placeholder="Aantekeningen voor de DM: hooks, NPC-namen, verhaalpunten..."
                rows={8}
              />
            </div>

          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end" style={{ marginTop: 24 }}>
            <Button variant="ghost"
              onClick={handleCancel}
              disabled={committed && !dirty}
            >
              Annuleren
            </Button>
            <Button variant="primary"
              onClick={handleSave}
              disabled={!dirty || saveSession.isPending}
            >
              {saveSession.isPending ? 'Opslaan...' : 'Opslaan'}
            </Button>
          </div>
        </div>

        {/* Danger zone */}
        <div
          className="pangu-surface"
          style={{ marginTop: 24, padding: 28, borderColor: 'rgba(255,107,107,0.18)' }}
        >
          <p className="pangu-section-title" style={{ marginBottom: 4 }}>Gevarenzone</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, paddingTop: 16, borderTop: '1px solid var(--hairline)' }}>
            <div>
              <p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: 0 }}>Sessie verwijderen</p>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: '2px 0 0' }}>
                Dit verwijdert de sessie permanent en kan niet ongedaan worden gemaakt.
              </p>
            </div>
            <Button variant="danger" size="sm"
              onClick={() => setDeleteOpen(true)}
            >
              Verwijder sessie
            </Button>
          </div>
        </div>

      </div>

      {/* Delete modal */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Sessie verwijderen"
      >
        <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 24 }}>
          Weet je zeker dat je <strong style={{ color: 'var(--ink)' }}>{session.name}</strong> wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
            Annuleren
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleteSession.isPending}>
            {deleteSession.isPending ? 'Verwijderen...' : 'Verwijder sessie'}
          </Button>
        </div>
      </Modal>

      {/* Discard dialog */}
      <ConfirmDialog
        open={guard.discardOpen}
        onClose={guard.cancelLeave}
        onConfirm={handleDiscardConfirm}
        title={guard.isDraftDiscard ? 'Sessie weggooien?' : 'Niet-opgeslagen wijzigingen'}
        confirmLabel={guard.isDraftDiscard ? 'Weggooien' : 'Verlaten'}
        cancelLabel={guard.isDraftDiscard ? 'Annuleren' : 'Blijven'}
        confirmVariant="crimson"
      >
        {guard.isDraftDiscard
          ? 'Dit item is nog niet opgeslagen en wordt permanent verwijderd. Doorgaan?'
          : 'Je hebt niet-opgeslagen wijzigingen. Weet je zeker dat je de pagina wilt verlaten?'
        }
      </ConfirmDialog>
    </div>
  )
}

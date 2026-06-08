import { useId } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useEntityEdit } from '@/hooks/useEntityEdit'
import { useQuest, useSaveQuest, useDeleteQuest } from '@/hooks/queries/useQuest'
import type { QuestStatus } from '@/types/quest.types'

const statusOptions: { value: QuestStatus; label: string }[] = [
  { value: 'draft',     label: 'Concept'      },
  { value: 'active',    label: 'Actief'       },
  { value: 'completed', label: 'Voltooid'     },
  { value: 'failed',    label: 'Mislukt'      },
  { value: 'archived',  label: 'Gearchiveerd' },
]

export default function QuestEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  const descriptionId = useId()
  const notesId = useId()
  const statusId = useId()
  const questTypeId = useId()
  const difficultyId = useId()
  const rewardId = useId()

  const locationState = location.state as { isNew?: boolean; campaignId?: string } | null
  const isNew = locationState?.isNew ?? false
  const campaignIdFromState = locationState?.campaignId

  const { data: questData, isLoading } = useQuest(id)
  const saveQuest = useSaveQuest(id!)
  const deleteQuest = useDeleteQuest(id!)

  const {
    form, set, dirty, setDirty,
    committed, setCommitted,
    deleteOpen, setDeleteOpen,
    resetForm, guard,
  } = useEntityEdit({ entity: questData, isNew })

  const campaignId = questData?.campaign_id ?? campaignIdFromState

  async function handleDiscardConfirm() {
    if (guard.isDraftDiscard) {
      try {
        await deleteQuest.mutateAsync({ campaignId })
      } catch {
        return
      }
    }
    const handled = guard.confirmLeave()
    if (!handled) {
      if (campaignId) navigate(`/campaigns/${campaignId}/quests`)
      else navigate('/dashboard')
    }
  }

  function handleCancel() {
    if (!committed) {
      guard.requestDiscard()
    } else {
      resetForm()
      if (campaignId) navigate(`/campaigns/${campaignId}/quests`)
      else navigate('/dashboard')
    }
  }

  function handleBack() {
    if (!committed) {
      guard.requestDiscard()
    } else {
      if (campaignId) navigate(`/campaigns/${campaignId}/quests`)
      else navigate('/dashboard')
    }
  }

  function handleSave() {
    toast.promise(
      saveQuest.mutateAsync({ ...form }).then(() => {
        setCommitted(true)
        setDirty(false)
      }),
      { loading: 'Opslaan...', success: 'Quest opgeslagen', error: 'Opslaan mislukt' },
    )
  }

  function handleDelete() {
    toast.promise(
      deleteQuest.mutateAsync({ campaignId }).then(() => {
        if (campaignId) navigate(`/campaigns/${campaignId}/quests`)
        else navigate('/dashboard')
      }),
      { loading: 'Verwijderen...', success: 'Quest verwijderd', error: 'Verwijderen mislukt' },
    )
    setDeleteOpen(false)
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }} aria-live="polite" aria-label="Quest laden...">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!questData) {
    return (
      <div>
        <p style={{ color: 'var(--muted)' }}>Quest niet gevonden.</p>
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
          aria-label="Terug naar quests"
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
          Terug naar quests
        </button>

        {/* Page header */}
        <header style={{ marginBottom: 40 }}>
          <p className="pangu-eyebrow">Quest bewerken</p>
          <h1 className="pangu-display-xl">{questData.name}</h1>
          <p style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-soft)' }}>
            Pas de details van deze quest aan.
          </p>
        </header>

        {/* Form */}
        <div className="pangu-surface" style={{ padding: 28 }}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <div>
              <label className="pangu-label" htmlFor="quest-name">Naam</label>
              <input
                id="quest-name"
                className="pangu-input"
                value={form.name ?? ''}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Naam van de quest"
              />
            </div>

            <div>
              <label className="pangu-label" htmlFor="quest-subtitle">Subtitel</label>
              <input
                id="quest-subtitle"
                className="pangu-input"
                value={form.subtitle ?? ''}
                onChange={(e) => set('subtitle', e.target.value || null)}
                placeholder="Korte omschrijving of tagline"
              />
            </div>

            <div>
              <label className="pangu-label" htmlFor={questTypeId}>Type</label>
              <input
                id={questTypeId}
                className="pangu-input"
                value={form.quest_type ?? ''}
                onChange={(e) => set('quest_type', e.target.value || null)}
                placeholder="Bijv. Hoofdquest, Zijquest, Achtergrond..."
              />
            </div>

            <div>
              <label className="pangu-label" htmlFor={difficultyId}>Moeilijkheidsgraad</label>
              <input
                id={difficultyId}
                className="pangu-input"
                value={form.difficulty ?? ''}
                onChange={(e) => set('difficulty', e.target.value || null)}
                placeholder="Bijv. Gemakkelijk, Normaal, Moeilijk, Dodelijk..."
              />
            </div>

            <div>
              <label className="pangu-label" htmlFor={statusId}>Status</label>
              <select
                id={statusId}
                className="pangu-select"
                value={form.status ?? 'draft'}
                onChange={(e) => set('status', e.target.value as QuestStatus)}
              >
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="pangu-label" htmlFor={rewardId}>Beloning</label>
              <input
                id={rewardId}
                className="pangu-input"
                value={form.reward ?? ''}
                onChange={(e) => set('reward', e.target.value || null)}
                placeholder="Bijv. 500 goud, magisch zwaard, gunst van een edelman..."
              />
            </div>

            <div className="sm:col-span-2">
              <label className="pangu-label" htmlFor={descriptionId}>Beschrijving</label>
              <textarea
                id={descriptionId}
                className="pangu-textarea"
                value={form.description ?? ''}
                onChange={(e) => set('description', e.target.value || null)}
                placeholder="Beschrijf de quest, haar doel en achtergrond..."
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
                placeholder="Aantekeningen voor de DM: geheimen, verrassingen, verborgen beloning..."
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
              disabled={!dirty || saveQuest.isPending}
            >
              {saveQuest.isPending ? 'Opslaan...' : 'Opslaan'}
            </Button>
          </div>
        </div>

        {/* Danger zone */}
        <div
          className="pangu-surface"
          style={{ marginTop: 24, padding: 28, borderColor: 'rgb(var(--crimson-rgb) / 0.18)' }}
        >
          <p className="pangu-section-title" style={{ marginBottom: 4 }}>Gevarenzone</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, paddingTop: 16, borderTop: '1px solid var(--hairline)' }}>
            <div>
              <p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: 0 }}>Quest verwijderen</p>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: '2px 0 0' }}>
                Dit verwijdert de quest permanent en kan niet ongedaan worden gemaakt.
              </p>
            </div>
            <Button variant="danger" size="sm"
              onClick={() => setDeleteOpen(true)}
            >
              Verwijder quest
            </Button>
          </div>
        </div>

      </div>

      {/* Delete modal */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Quest verwijderen"
      >
        <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 24 }}>
          Weet je zeker dat je <strong style={{ color: 'var(--ink)' }}>{questData.name}</strong> wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
            Annuleren
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleteQuest.isPending}>
            {deleteQuest.isPending ? 'Verwijderen...' : 'Verwijder quest'}
          </Button>
        </div>
      </Modal>

      {/* Discard dialog */}
      <ConfirmDialog
        open={guard.discardOpen}
        onClose={guard.cancelLeave}
        onConfirm={handleDiscardConfirm}
        title={guard.isDraftDiscard ? 'Quest weggooien?' : 'Niet-opgeslagen wijzigingen'}
        confirmLabel={guard.isDraftDiscard ? 'Weggooien' : 'Verlaten'}
        cancelLabel={guard.isDraftDiscard ? 'Annuleren' : 'Blijven'}
        confirmVariant="crimson"
      >
        {guard.isDraftDiscard
          ? 'Deze quest is nog niet opgeslagen en wordt permanent verwijderd. Doorgaan?'
          : 'Je hebt niet-opgeslagen wijzigingen. Weet je zeker dat je de pagina wilt verlaten?'
        }
      </ConfirmDialog>
    </div>
  )
}

import { useId, useState } from 'react'
import { useParams, useNavigate, useLocation as useRouterLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Spinner } from '@/components/ui/Spinner'
import { useEntityEdit } from '@/hooks/useEntityEdit'
import { useAI } from '@/hooks/useAI'
import { useLocation as useLocationQuery, useSaveLocation, useDeleteLocation } from '@/hooks/queries/useLocation'
import type { LocationStatus } from '@/types/location.types'

const statusOptions: { value: LocationStatus; label: string }[] = [
  { value: 'draft',      label: 'Concept'      },
  { value: 'active',     label: 'Actief'       },
  { value: 'discovered', label: 'Ontdekt'      },
  { value: 'archived',   label: 'Gearchiveerd' },
]

export default function LocationEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useRouterLocation()

  const descriptionId = useId()
  const notesId = useId()
  const statusId = useId()
  const locationTypeId = useId()

  const { ask, loading: aiLoading } = useAI()
  const [aiPreview, setAiPreview] = useState<string | null>(null)

  const locationState = location.state as { isNew?: boolean; campaignId?: string } | null
  const isNew = locationState?.isNew ?? false
  const campaignIdFromState = locationState?.campaignId

  const { data: locationData, isLoading } = useLocationQuery(id)
  const saveLocation = useSaveLocation(id!)
  const deleteLocation = useDeleteLocation(id!)

  const {
    form, set, dirty, setDirty,
    committed, setCommitted,
    deleteOpen, setDeleteOpen,
    resetForm, guard,
  } = useEntityEdit({ entity: locationData, isNew })

  const campaignId = locationData?.campaign_id ?? campaignIdFromState

  async function handleDiscardConfirm() {
    if (guard.isDraftDiscard) {
      try {
        await deleteLocation.mutateAsync({ campaignId })
      } catch {
        return
      }
    }
    const handled = guard.confirmLeave()
    if (!handled) {
      if (campaignId) navigate(`/campaigns/${campaignId}/locations`)
      else navigate('/dashboard')
    }
  }

  function handleCancel() {
    if (!committed) {
      guard.requestDiscard()
    } else {
      resetForm()
      navigate(`/locations/${id}`)
    }
  }

  function handleBack() {
    if (!committed) {
      guard.requestDiscard()
    } else {
      navigate(`/locations/${id}`)
    }
  }

  async function handleGenerateDescription() {
    const name = form.name?.trim()
    if (!name) {
      toast.error('Vul eerst een naam in voordat je genereert')
      return
    }
    const typeHint = form.location_type ? ` (${form.location_type})` : ''
    const subtitleHint = form.subtitle ? ` — ${form.subtitle}` : ''
    const existingHint = form.description?.trim()
      ? ` De huidige beschrijving luidt: "${form.description.trim()}". Verbeter of breid deze uit.`
      : ''
    try {
      const reply = await ask([
        {
          role: 'user',
          content:
            `Je bent een creatieve schrijver voor een tabletop RPG-campagne (D&D-stijl). ` +
            `Schrijf een atmosferische, levendige beschrijving (3–5 zinnen in het Nederlands) voor de locatie ` +
            `"${name}"${typeHint}${subtitleHint}. ` +
            `Beschrijf sfeer, zintuiglijke details en wat spelers hier zouden ervaren.` +
            existingHint +
            ` Geef alleen de beschrijvingstekst terug, zonder koptekst of uitleg.`,
        },
      ])
      setAiPreview(reply.trim())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Genereren mislukt')
    }
  }

  function handleAcceptGenerated() {
    if (aiPreview !== null) {
      set('description', aiPreview || null)
      setAiPreview(null)
      toast.success('Beschrijving overgenomen')
    }
  }

  function handleSave() {
    toast.promise(
      saveLocation.mutateAsync({ ...form }).then(() => {
        setCommitted(true)
        setDirty(false)
      }),
      { loading: 'Opslaan...', success: 'Locatie opgeslagen', error: 'Opslaan mislukt' },
    )
  }

  function handleDelete() {
    toast.promise(
      deleteLocation.mutateAsync({ campaignId }).then(() => {
        if (campaignId) navigate(`/campaigns/${campaignId}/locations`)
        else navigate('/dashboard')
      }),
      { loading: 'Verwijderen...', success: 'Locatie verwijderd', error: 'Verwijderen mislukt' },
    )
    setDeleteOpen(false)
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }} aria-live="polite" aria-label="Locatie laden...">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!locationData) {
    return (
      <div>
        <p style={{ color: 'var(--muted)' }}>Locatie niet gevonden.</p>
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
          aria-label="Terug naar locatie"
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
          Terug naar locatie
        </button>

        {/* Page header */}
        <header style={{ marginBottom: 40 }}>
          <p className="pangu-eyebrow">Locatie bewerken</p>
          <h1 className="pangu-display-xl">{locationData.name}</h1>
          <p style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-soft)' }}>
            Pas de details van deze locatie aan.
          </p>
        </header>

        {/* Form */}
        <div className="pangu-surface" style={{ padding: 28 }}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <div>
              <label className="pangu-label" htmlFor="location-name">Naam</label>
              <input
                id="location-name"
                className="pangu-input"
                value={form.name ?? ''}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Naam van de locatie"
              />
            </div>

            <div>
              <label className="pangu-label" htmlFor="location-subtitle">Subtitel</label>
              <input
                id="location-subtitle"
                className="pangu-input"
                value={form.subtitle ?? ''}
                onChange={(e) => set('subtitle', e.target.value || null)}
                placeholder="Korte omschrijving of tagline"
              />
            </div>

            <div>
              <label className="pangu-label" htmlFor={locationTypeId}>Type locatie</label>
              <input
                id={locationTypeId}
                className="pangu-input"
                value={form.location_type ?? ''}
                onChange={(e) => set('location_type', e.target.value || null)}
                placeholder="Bijv. Stad, Kerker, Herberg, Woud..."
              />
            </div>

            <div>
              <label className="pangu-label" htmlFor={statusId}>Status</label>
              <select
                id={statusId}
                className="pangu-select"
                value={form.status ?? 'draft'}
                onChange={(e) => set('status', e.target.value as LocationStatus)}
              >
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <label className="pangu-label" htmlFor={descriptionId} style={{ margin: 0 }}>Beschrijving</label>
                <button
                  type="button"
                  onClick={handleGenerateDescription}
                  disabled={aiLoading}
                  aria-label="Genereer beschrijving met AI"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    background: 'none', border: '1px solid var(--hairline)',
                    borderRadius: 6, cursor: aiLoading ? 'not-allowed' : 'pointer',
                    color: aiLoading ? 'var(--subtle)' : 'var(--violet)',
                    fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
                    padding: '3px 8px', fontFamily: 'var(--font-body)',
                    transition: 'color var(--t-fast), border-color var(--t-fast)',
                    opacity: aiLoading ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => { if (!aiLoading) e.currentTarget.style.borderColor = 'var(--violet)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--hairline)' }}
                >
                  {aiLoading
                    ? <><Spinner size="sm" /> Genereren...</>
                    : <>✦ Genereer</>
                  }
                </button>
              </div>
              <textarea
                id={descriptionId}
                className="pangu-textarea"
                value={form.description ?? ''}
                onChange={(e) => { set('description', e.target.value || null); setAiPreview(null) }}
                placeholder="Beschrijf de locatie, haar sfeer en bijzonderheden..."
                rows={4}
              />
              {aiPreview !== null && (
                <div
                  role="status"
                  aria-live="polite"
                  style={{
                    marginTop: 8, padding: '12px 14px',
                    background: 'color-mix(in srgb, var(--violet) 8%, var(--surface-2))',
                    border: '1px solid color-mix(in srgb, var(--violet) 25%, transparent)',
                    borderRadius: 8,
                  }}
                >
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--violet)', marginBottom: 6, textTransform: 'uppercase' }}>
                    AI-suggestie
                  </p>
                  <p style={{ fontSize: 14, color: 'var(--ink-soft)', whiteSpace: 'pre-wrap', lineHeight: 1.6, margin: 0 }}>
                    {aiPreview}
                  </p>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <Button variant="secondary" size="sm" onClick={handleAcceptGenerated}>
                      Overnemen
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setAiPreview(null)}>
                      Negeren
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="pangu-label" htmlFor={notesId}>DM notities</label>
              <textarea
                id={notesId}
                className="pangu-textarea"
                value={form.notes ?? ''}
                onChange={(e) => set('notes', e.target.value || null)}
                placeholder="Aantekeningen voor de DM: geheimen, NPCs, verborgen items..."
                rows={8}
              />
            </div>

          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end" style={{ marginTop: 24 }}>
            <Button
              variant="ghost"
              onClick={handleCancel}
              disabled={committed && !dirty}
            >
              Annuleren
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={!dirty}
              loading={saveLocation.isPending}
            >
              Opslaan
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
              <p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: 0 }}>Locatie verwijderen</p>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: '2px 0 0' }}>
                Dit verwijdert de locatie permanent en kan niet ongedaan worden gemaakt.
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setDeleteOpen(true)}
            >
              Verwijder locatie
            </Button>
          </div>
        </div>

      </div>

      {/* Delete modal */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Locatie verwijderen"
      >
        <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 24 }}>
          Weet je zeker dat je <strong style={{ color: 'var(--ink)' }}>{locationData.name}</strong> wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
            Annuleren
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={deleteLocation.isPending}>
            Verwijder locatie
          </Button>
        </div>
      </Modal>

      {/* Discard dialog */}
      <ConfirmDialog
        open={guard.discardOpen}
        onClose={guard.cancelLeave}
        onConfirm={handleDiscardConfirm}
        title={guard.isDraftDiscard ? 'Locatie weggooien?' : 'Niet-opgeslagen wijzigingen'}
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

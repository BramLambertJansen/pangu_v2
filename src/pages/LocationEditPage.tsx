import { useState } from 'react'
import { useParams, useNavigate, useLocation as useRouterLocation } from 'react-router-dom'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
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
        <p className="text-muted">Locatie niet gevonden.</p>
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mt-4">
          ← Terug naar dashboard
        </Button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <div style={{ maxWidth: 820, width: '100%' }}>
        <Breadcrumbs
          showBack
          onBack={handleBack}
          items={[{ label: locationData.name, to: `/locations/${id}` }]}
          current="Bewerken"
        />

        {/* Page header */}
        <header style={{ marginBottom: 40 }}>
          <p className="pg-eyebrow">Locatie bewerken</p>
          <h1 className="pg-display-xl">{locationData.name}</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Pas de details van deze locatie aan.
          </p>
        </header>

        {/* Form */}
        <div className="surface" style={{ padding: 28 }}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <Input
              label="Naam"
              value={form.name ?? ''}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Naam van de locatie"
            />

            <Input
              label="Subtitel"
              value={form.subtitle ?? ''}
              onChange={(e) => set('subtitle', e.target.value || null)}
              placeholder="Korte omschrijving of tagline"
            />

            <Input
              label="Type locatie"
              value={form.location_type ?? ''}
              onChange={(e) => set('location_type', e.target.value || null)}
              placeholder="Bijv. Stad, Kerker, Herberg, Woud..."
            />

            <Select
              label="Status"
              value={form.status ?? 'draft'}
              onChange={(e) => set('status', e.target.value as LocationStatus)}
              options={statusOptions}
            />

            <div className="sm:col-span-2">
              <Textarea
                label="Beschrijving"
                value={form.description ?? ''}
                onChange={(e) => { set('description', e.target.value || null); setAiPreview(null) }}
                placeholder="Beschrijf de locatie, haar sfeer en bijzonderheden..."
                rows={4}
                labelAction={
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleGenerateDescription}
                    loading={aiLoading}
                    aria-label="Genereer beschrijving met AI"
                  >
                    ✦ Genereer
                  </Button>
                }
              />
              {aiPreview !== null && (
                <div role="status" aria-live="polite" className="ai-suggestion">
                  <p className="ai-suggestion-label">AI-suggestie</p>
                  <p className="ai-suggestion-text">{aiPreview}</p>
                  <div className="ai-suggestion-actions">
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

            <Textarea
              fieldClassName="sm:col-span-2"
              label="DM notities"
              value={form.notes ?? ''}
              onChange={(e) => set('notes', e.target.value || null)}
              placeholder="Aantekeningen voor de DM: geheimen, NPCs, verborgen items..."
              rows={8}
            />

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
          className="surface"
          style={{ marginTop: 24, padding: 28, borderColor: 'rgb(var(--crimson-rgb) / 0.18)' }}
        >
          <p className="pg-section-title" style={{ marginBottom: 4 }}>Gevarenzone</p>
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
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Locatie verwijderen"
        confirmLabel="Verwijder locatie"
        loading={deleteLocation.isPending}
      >
        Weet je zeker dat je <strong className="text-ink">{locationData.name}</strong> wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
      </ConfirmDialog>

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

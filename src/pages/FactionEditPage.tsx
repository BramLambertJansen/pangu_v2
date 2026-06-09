import { useId } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Spinner } from '@/components/ui/Spinner'
import { useEntityEdit } from '@/hooks/useEntityEdit'
import { useFaction, useSaveFaction, useDeleteFaction } from '@/hooks/queries/useFaction'
import type { FactionStatus, FactionType, FactionReputation } from '@/types/faction.types'

const statusOptions: { value: FactionStatus; label: string }[] = [
  { value: 'draft',    label: 'Concept'      },
  { value: 'active',   label: 'Actief'       },
  { value: 'archived', label: 'Gearchiveerd' },
]

const typeOptions: { value: FactionType; label: string }[] = [
  { value: 'guild',       label: 'Gilde'                  },
  { value: 'noble_house', label: 'Adellijk huis'          },
  { value: 'religious',   label: 'Religieuze orde'        },
  { value: 'criminal',    label: 'Criminele organisatie'  },
  { value: 'military',    label: 'Militaire orde'         },
  { value: 'merchant',    label: 'Handelsgilde'           },
  { value: 'arcane',      label: 'Arcane genootschap'     },
  { value: 'tribal',      label: 'Stam'                   },
  { value: 'other',       label: 'Overig'                 },
]

const reputationOptions: { value: FactionReputation; label: string }[] = [
  { value: 'hostile',    label: 'Vijandig'    },
  { value: 'unfriendly', label: 'Wantrouwend' },
  { value: 'neutral',    label: 'Neutraal'    },
  { value: 'friendly',   label: 'Vriendelijk' },
  { value: 'allied',     label: 'Bondgenoot'  },
]

export default function FactionEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  const nameId = useId()
  const subtitleId = useId()
  const typeId = useId()
  const reputationId = useId()
  const statusId = useId()
  const mottoId = useId()
  const goalsId = useId()
  const descriptionId = useId()
  const notesId = useId()

  const locationState = location.state as { isNew?: boolean; campaignId?: string } | null
  const isNew = locationState?.isNew ?? false
  const campaignIdFromState = locationState?.campaignId

  const { data: factionData, isLoading } = useFaction(id)
  const saveFaction = useSaveFaction(id!)
  const deleteFaction = useDeleteFaction(id!)

  const {
    form, set, dirty, setDirty,
    committed, setCommitted,
    deleteOpen, setDeleteOpen,
    resetForm, guard,
  } = useEntityEdit({ entity: factionData, isNew })

  const campaignId = factionData?.campaign_id ?? campaignIdFromState

  async function handleDiscardConfirm() {
    if (guard.isDraftDiscard) {
      try { await deleteFaction.mutateAsync({ campaignId }) } catch { return }
    }
    const handled = guard.confirmLeave()
    if (!handled) {
      if (campaignId) navigate(`/campaigns/${campaignId}/factions`)
      else navigate('/dashboard')
    }
  }

  function handleCancel() {
    if (!committed) {
      guard.requestDiscard()
    } else {
      resetForm()
      if (campaignId) navigate(`/campaigns/${campaignId}/factions`)
      else navigate('/dashboard')
    }
  }

  function handleBack() {
    if (!committed) {
      guard.requestDiscard()
    } else {
      if (campaignId) navigate(`/campaigns/${campaignId}/factions`)
      else navigate('/dashboard')
    }
  }

  function handleSave() {
    toast.promise(
      saveFaction.mutateAsync(form).then(() => {
        setCommitted(true)
        setDirty(false)
      }),
      { loading: 'Opslaan...', success: 'Factie opgeslagen', error: 'Opslaan mislukt' },
    )
  }

  function handleDelete() {
    toast.promise(
      deleteFaction.mutateAsync({ campaignId }).then(() => {
        if (campaignId) navigate(`/campaigns/${campaignId}/factions`)
        else navigate('/dashboard')
      }),
      { loading: 'Verwijderen...', success: 'Factie verwijderd', error: 'Verwijderen mislukt' },
    )
    setDeleteOpen(false)
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }} aria-live="polite" aria-label="Factie laden...">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!factionData) {
    return (
      <div>
        <p style={{ color: 'var(--muted)' }}>Factie niet gevonden.</p>
        <Button variant="ghost" onClick={() => navigate('/dashboard')} style={{ marginTop: 16 }}>
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
          items={[{ label: factionData.name, to: `/factions/${id}` }]}
          current="Bewerken"
        />

        <header style={{ marginBottom: 40 }}>
          <p className="pangu-eyebrow">Factie bewerken</p>
          <h1 className="pangu-display-xl">{factionData.name}</h1>
          <p style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-soft)' }}>
            Pas de details van deze organisatie aan.
          </p>
        </header>

        <div className="pangu-surface" style={{ padding: 28 }}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <div>
              <label className="pangu-label" htmlFor={nameId}>Naam</label>
              <input
                id={nameId}
                className="pangu-input"
                value={form.name ?? ''}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Naam van de organisatie"
              />
            </div>

            <div>
              <label className="pangu-label" htmlFor={subtitleId}>Subtitel</label>
              <input
                id={subtitleId}
                className="pangu-input"
                value={form.subtitle ?? ''}
                onChange={(e) => set('subtitle', e.target.value || null)}
                placeholder="Bijnaam of tagline"
              />
            </div>

            <div>
              <label className="pangu-label" htmlFor={typeId}>Type</label>
              <select
                id={typeId}
                className="pangu-select"
                value={form.type ?? ''}
                onChange={(e) => set('type', (e.target.value as FactionType) || null)}
              >
                <option value="">— Kies een type —</option>
                {typeOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="pangu-label" htmlFor={reputationId}>Houding tegenover de party</label>
              <select
                id={reputationId}
                className="pangu-select"
                value={form.reputation ?? 'neutral'}
                onChange={(e) => set('reputation', e.target.value as FactionReputation)}
              >
                {reputationOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="pangu-label" htmlFor={statusId}>Status</label>
              <select
                id={statusId}
                className="pangu-select"
                value={form.status ?? 'draft'}
                onChange={(e) => set('status', e.target.value as FactionStatus)}
              >
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="pangu-label" htmlFor={mottoId}>Motto</label>
              <input
                id={mottoId}
                className="pangu-input"
                value={form.motto ?? ''}
                onChange={(e) => set('motto', e.target.value || null)}
                placeholder="Het motto of de spreuk van de organisatie"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="pangu-label" htmlFor={goalsId}>Doelen</label>
              <textarea
                id={goalsId}
                className="pangu-textarea"
                value={form.goals ?? ''}
                onChange={(e) => set('goals', e.target.value || null)}
                placeholder="Wat wil deze organisatie bereiken? Machtsovername, bescherming, winst..."
                rows={3}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="pangu-label" htmlFor={descriptionId}>Beschrijving</label>
              <textarea
                id={descriptionId}
                className="pangu-textarea"
                value={form.description ?? ''}
                onChange={(e) => set('description', e.target.value || null)}
                placeholder="Geschiedenis, structuur, bekende leden en reputatie..."
                rows={4}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="pangu-label" htmlFor={notesId}>DM-notities</label>
              <textarea
                id={notesId}
                className="pangu-textarea"
                value={form.notes ?? ''}
                onChange={(e) => set('notes', e.target.value || null)}
                placeholder="Verborgen agenda's, geheime leden, toekomstige plannen..."
                rows={6}
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
              loading={saveFaction.isPending}
            >
              Opslaan
            </Button>
          </div>
        </div>

        <div
          className="pangu-surface"
          style={{ marginTop: 24, padding: 28, borderColor: 'rgb(var(--crimson-rgb) / 0.18)' }}
        >
          <p className="pangu-section-title" style={{ marginBottom: 4 }}>Gevarenzone</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, paddingTop: 16, borderTop: '1px solid var(--hairline)' }}>
            <div>
              <p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: 0 }}>Factie verwijderen</p>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: '2px 0 0' }}>
                Dit verwijdert de organisatie permanent. NPC-koppelingen worden verwijderd.
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setDeleteOpen(true)}
            >
              Verwijder factie
            </Button>
          </div>
        </div>

      </div>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Factie verwijderen"
      >
        <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 24 }}>
          Weet je zeker dat je <strong style={{ color: 'var(--ink)' }}>{factionData.name}</strong> wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
            Annuleren
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={deleteFaction.isPending}>
            Verwijder factie
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={guard.discardOpen}
        onClose={guard.cancelLeave}
        onConfirm={handleDiscardConfirm}
        title={guard.isDraftDiscard ? 'Factie weggooien?' : 'Niet-opgeslagen wijzigingen'}
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

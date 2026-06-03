import { useId, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { Spinner } from '@/components/ui/Spinner'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useCampaign, useSaveCampaign, useDeleteCampaign } from '@/hooks/queries/useCampaign'
import { useEntityEdit } from '@/hooks/useEntityEdit'
import { useImagePositioning } from '@/hooks/useImagePositioning'
import type { Campaign, CampaignStatus } from '@/types/campaign.types'

const statusOptions: { value: CampaignStatus; label: string }[] = [
  { value: 'draft',     label: 'Concept'      },
  { value: 'active',    label: 'Actief'       },
  { value: 'archived',  label: 'Gearchiveerd' },
  { value: 'completed', label: 'Voltooid'     },
]

export default function CampaignEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const descriptionId = useId()
  const notesId = useId()
  const statusId = useId()
  const headerImageId = useId()

  const locationState = location.state as { isNew?: boolean; worldId?: string } | null
  const isNew = locationState?.isNew ?? false
  const worldIdFromState = locationState?.worldId

  const { data: campaign, isLoading } = useCampaign(id)
  const saveCampaign = useSaveCampaign(id!)
  const deleteCampaign = useDeleteCampaign(id!)

  const {
    form, set, dirty, committed, setCommitted, setDirty,
    deleteOpen, setDeleteOpen, resetForm, guard,
  } = useEntityEdit<Campaign>({ entity: campaign, isNew })

  const handlePositionChange = useCallback((posString: string) => {
    set('header_image_position', posString)
  }, [set])

  const { containerRef, posString: imagePosString, isDragging, resetPosition, handlers: imagePosHandlers } = useImagePositioning(
    campaign?.header_image_position,
    handlePositionChange,
  )

  function handleCancel() {
    if (!committed) {
      guard.requestDiscard()
    } else {
      resetForm()
      resetPosition(campaign!.header_image_position)
      navigate(`/campaigns/${id}`)
    }
  }

  function handleBack() {
    if (!committed) {
      guard.requestDiscard()
    } else {
      navigate(`/campaigns/${id}`)
    }
  }

  async function handleDiscardConfirm() {
    const worldId = campaign?.world_id ?? worldIdFromState
    if (guard.isDraftDiscard) {
      try { await deleteCampaign.mutateAsync({ worldId }) } catch { return }
    }
    const blockerHandled = guard.confirmLeave()
    if (!blockerHandled) navigate(worldId ? `/worlds/${worldId}` : '/dashboard')
  }

  function handleSave() {
    const worldId = campaign?.world_id ?? worldIdFromState
    toast.promise(
      saveCampaign.mutateAsync({ ...form, worldId }).then(() => {
        setCommitted(true)
        setDirty(false)
      }),
      { loading: 'Opslaan...', success: 'Kroniek opgeslagen', error: 'Opslaan mislukt' },
    )
  }

  function handleDelete() {
    const worldId = campaign?.world_id ?? worldIdFromState
    toast.promise(
      deleteCampaign.mutateAsync({ worldId }).then(() => {
        navigate(worldId ? `/worlds/${worldId}` : '/dashboard')
      }),
      { loading: 'Verwijderen...', success: 'Kroniek verwijderd', error: 'Verwijderen mislukt' },
    )
    setDeleteOpen(false)
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }} aria-live="polite" aria-label="Kroniek laden...">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!campaign) {
    return (
      <div>
        <p style={{ color: 'var(--muted)' }}>Kroniek niet gevonden.</p>
        <button type="button" className="pangu-btn pangu-btn-ghost" onClick={() => navigate('/dashboard')} style={{ marginTop: 16 }}>
          ← Terug naar dashboard
        </button>
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
          aria-label="Terug naar kroniek"
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
          Terug naar kroniek
        </button>

        {/* Page header */}
        <header style={{ marginBottom: 40 }}>
          <p className="pangu-eyebrow">Kroniek bewerken</p>
          <h1 className="pangu-display-xl">{campaign.name}</h1>
          <p style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-soft)' }}>
            Pas de details van deze kroniek aan.
          </p>
        </header>

        {/* Header image — draggable preview */}
        {form.header_image && (
          <div style={{ marginBottom: 32 }}>
            <p style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: 'var(--muted)',
              marginBottom: 8, userSelect: 'none',
            }}>
              Sleep om uitsnede aan te passen
            </p>
            <div
              ref={containerRef}
              role="img"
              aria-label={`Afbeeldingsuitsnede: positie ${imagePosString}. Gebruik pijltjestoetsen om bij te stellen.`}
              tabIndex={0}
              onMouseDown={imagePosHandlers.onMouseDown}
              onTouchStart={imagePosHandlers.onTouchStart}
              onKeyDown={imagePosHandlers.onKeyDown}
              style={{
                position: 'relative',
                cursor: isDragging ? 'grabbing' : 'grab',
                borderRadius: 'var(--r-lg)',
                overflow: 'hidden',
                height: 220,
                border: '1px solid var(--hairline)',
                userSelect: 'none',
                touchAction: 'none',
                outline: 'none',
              }}
              onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 2px var(--violet)' }}
              onBlur={(e) => { e.currentTarget.style.boxShadow = 'none' }}
            >
              <img
                src={form.header_image}
                alt=""
                draggable={false}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: imagePosString,
                  pointerEvents: 'none',
                  display: 'block',
                }}
              />
            </div>
          </div>
        )}

        {/* Form */}
        <div className="pangu-surface" style={{ padding: 28 }}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="pangu-label" htmlFor="campaign-name">Naam</label>
              <input
                id="campaign-name"
                className="pangu-input"
                value={form.name ?? ''}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Naam van de kroniek"
              />
            </div>

            <div>
              <label className="pangu-label" htmlFor="campaign-subtitle">Subtitel</label>
              <input
                id="campaign-subtitle"
                className="pangu-input"
                value={form.subtitle ?? ''}
                onChange={(e) => set('subtitle', e.target.value || null as unknown as string)}
                placeholder="Korte beschrijving of tagline"
              />
            </div>

            <div>
              <label className="pangu-label" htmlFor={statusId}>Status</label>
              <select
                id={statusId}
                className="pangu-select"
                value={form.status ?? 'draft'}
                onChange={(e) => set('status', e.target.value as CampaignStatus)}
              >
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="pangu-label" htmlFor={headerImageId}>Header afbeelding (URL)</label>
              <input
                id={headerImageId}
                className="pangu-input"
                type="url"
                value={form.header_image ?? ''}
                onChange={(e) => set('header_image', e.target.value || null as unknown as string)}
                placeholder="https://..."
              />
            </div>

            <div className="sm:col-span-2">
              <label className="pangu-label" htmlFor={descriptionId}>Beschrijving</label>
              <textarea
                id={descriptionId}
                className="pangu-textarea"
                value={form.description ?? ''}
                onChange={(e) => set('description', e.target.value || null as unknown as string)}
                placeholder="Beschrijf de kroniek, haar sfeer en achtergrond..."
                rows={5}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="pangu-label" htmlFor={notesId}>DM-notities</label>
              <textarea
                id={notesId}
                className="pangu-textarea"
                value={form.notes ?? ''}
                onChange={(e) => set('notes', e.target.value || null as unknown as string)}
                placeholder="Geheimen, hints, campagne-aantekeningen..."
                rows={6}
              />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end" style={{ marginTop: 24 }}>
            <button
              type="button"
              className="pangu-btn pangu-btn-ghost"
              onClick={handleCancel}
              disabled={committed && !dirty}
            >
              Annuleren
            </button>
            <button
              type="button"
              className="pangu-btn pangu-btn-primary"
              onClick={handleSave}
              disabled={!dirty || saveCampaign.isPending}
            >
              {saveCampaign.isPending ? 'Opslaan...' : 'Opslaan'}
            </button>
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
              <p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: 0 }}>Kroniek verwijderen</p>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: '2px 0 0' }}>
                Dit verwijdert de kroniek permanent en kan niet ongedaan worden gemaakt.
              </p>
            </div>
            <button
              type="button"
              className="pangu-btn pangu-btn-crimson pangu-btn-sm"
              onClick={() => setDeleteOpen(true)}
            >
              Verwijder kroniek
            </button>
          </div>
        </div>

      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Kroniek verwijderen"
        confirmLabel="Verwijder kroniek"
        loading={deleteCampaign.isPending}
      >
        Weet je zeker dat je <strong style={{ color: 'var(--ink)' }}>{campaign.name}</strong> wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
      </ConfirmDialog>

      <ConfirmDialog
        open={guard.discardOpen}
        onClose={guard.cancelLeave}
        onConfirm={handleDiscardConfirm}
        title={guard.isDraftDiscard ? 'Item weggooien?' : 'Niet-opgeslagen wijzigingen'}
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

import { useId, useCallback, useRef, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { toast } from 'sonner'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'
import { useCampaign, useSaveCampaign, useDeleteCampaign } from '@/hooks/queries/useCampaign'
import { useEntityEdit } from '@/hooks/useEntityEdit'
import { useImagePositioning } from '@/hooks/useImagePositioning'
import { sanitizeImageUrl } from '@/utils/sanitizeUrl'
import type { Campaign, CampaignStatus } from '@/types/campaign.types'
import { campaignStatusLabel, optionsFromLabels } from '@/lib/statusMaps'

const MAX_MAP_IMAGE_BYTES = 10 * 1024 * 1024

const statusOptions = optionsFromLabels(campaignStatusLabel)

export default function CampaignEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const mapImageInputRef = useRef<HTMLInputElement>(null)
  const [mapImageUploading, setMapImageUploading] = useState(false)
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

  const safeMapPreviewUrl = sanitizeImageUrl(form.map_image_url as string | null | undefined)

  const { containerRef, posString: imagePosString, isDragging, resetPosition, handlers: imagePosHandlers } = useImagePositioning(
    campaign?.header_image_position,
    handlePositionChange,
  )

  function extractStoragePath(url: string): string | null {
    const marker = '/entity-images/'
    const idx = url.indexOf(marker)
    return idx !== -1 ? url.slice(idx + marker.length) : null
  }

  async function handleMapImageUpload(file: File) {
    if (!user || !id) return
    if (!file.type.startsWith('image/')) {
      toast.error('Alleen afbeeldingen zijn toegestaan')
      return
    }
    if (file.size > MAX_MAP_IMAGE_BYTES) {
      toast.error('Afbeelding mag maximaal 10 MB zijn')
      return
    }
    setMapImageUploading(true)
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `campaign-maps/${user.id}/${id}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('entity-images')
        .upload(path, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data: urlData } = supabase.storage.from('entity-images').getPublicUrl(path)
      set('map_image_url', urlData.publicUrl)
      // The previous file is removed only after the campaign is saved (see
      // handleSave), so a cancel/discard never points the DB at a deleted file.
      toast.success('Kaartafbeelding geüpload — klik "Sla kaart op" om te bewaren.')
    } catch {
      toast.error('Uploaden mislukt')
    } finally {
      setMapImageUploading(false)
    }
  }

  // Clear the field like any other pending edit; the storage object is removed
  // post-save so discarding the form leaves the persisted map intact.
  function handleRemoveMapImage() {
    set('map_image_url', null)
  }

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
    const previousMapUrl = campaign?.map_image_url ?? null
    const nextMapUrl = (form.map_image_url as string | null | undefined) ?? null
    if (nextMapUrl && !sanitizeImageUrl(nextMapUrl)) {
      toast.error('Ongeldige kaart-URL: gebruik een HTTPS-link naar een afbeelding.')
      return
    }
    toast.promise(
      saveCampaign.mutateAsync({ ...form, worldId }).then(async () => {
        setCommitted(true)
        setDirty(false)
        // Now that the new map reference is persisted, drop the orphaned old file.
        if (previousMapUrl && previousMapUrl !== nextMapUrl) {
          const oldPath = extractStoragePath(previousMapUrl)
          if (oldPath) await supabase.storage.from('entity-images').remove([oldPath])
        }
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
          items={[{ label: campaign.name, to: `/campaigns/${id}` }]}
          current="Bewerken"
        />

        {/* Page header */}
        <header style={{ marginBottom: 40 }}>
          <p className="pg-eyebrow">Kroniek bewerken</p>
          <h1 className="pg-display-xl">{campaign.name}</h1>
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
        <div className="surface" style={{ padding: 28 }}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="campaign-name">Naam</label>
              <input
                id="campaign-name"
                className="input"
                value={form.name ?? ''}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Naam van de kroniek"
              />
            </div>

            <div>
              <label className="label" htmlFor="campaign-subtitle">Subtitel</label>
              <input
                id="campaign-subtitle"
                className="input"
                value={form.subtitle ?? ''}
                onChange={(e) => set('subtitle', e.target.value || null as unknown as string)}
                placeholder="Korte beschrijving of tagline"
              />
            </div>

            <div>
              <label className="label" htmlFor={statusId}>Status</label>
              <select
                id={statusId}
                className="select-trigger"
                value={form.status ?? 'draft'}
                onChange={(e) => set('status', e.target.value as CampaignStatus)}
              >
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label" htmlFor={headerImageId}>Header afbeelding (URL)</label>
              <input
                id={headerImageId}
                className="input"
                type="url"
                value={form.header_image ?? ''}
                onChange={(e) => set('header_image', e.target.value || null as unknown as string)}
                placeholder="https://..."
              />
            </div>

            <div className="sm:col-span-2">
              <label className="label" htmlFor={descriptionId}>Beschrijving</label>
              <textarea
                id={descriptionId}
                className="textarea"
                value={form.description ?? ''}
                onChange={(e) => set('description', e.target.value || null as unknown as string)}
                placeholder="Beschrijf de kroniek, haar sfeer en achtergrond..."
                rows={5}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="label" htmlFor={notesId}>DM-notities</label>
              <textarea
                id={notesId}
                className="textarea"
                value={form.notes ?? ''}
                onChange={(e) => set('notes', e.target.value || null as unknown as string)}
                placeholder="Geheimen, hints, campagne-aantekeningen..."
                rows={6}
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
              disabled={!dirty || saveCampaign.isPending}
            >
              {saveCampaign.isPending ? 'Opslaan...' : 'Opslaan'}
            </Button>
          </div>
        </div>

        {/* Map image section */}
        <div className="surface" style={{ padding: 28, marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
            <div>
              <p className="pg-section-title" style={{ marginBottom: 2 }}>Kaartafbeelding</p>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
                Upload een kaartafbeelding of voer een URL in. Je kunt er daarna locatie-pins op plaatsen via de Atlas.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {form.map_image_url && (
                <Button variant="ghost" size="sm" onClick={handleRemoveMapImage}>
                  Verwijder kaart
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                loading={mapImageUploading}
                onClick={() => mapImageInputRef.current?.click()}
              >
                {form.map_image_url ? 'Vervang afbeelding' : 'Afbeelding uploaden'}
              </Button>
              <input
                ref={mapImageInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                aria-label="Kaartafbeelding uploaden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleMapImageUpload(file)
                  e.target.value = ''
                }}
              />
              {(form.map_image_url ?? null) !== (campaign?.map_image_url ?? null) && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSave}
                  loading={saveCampaign.isPending}
                >
                  Sla kaart op
                </Button>
              )}
            </div>
          </div>

          {/* URL input */}
          <div style={{ marginBottom: 16 }}>
            <label
              className="label"
              htmlFor="map-image-url"
              style={{ display: 'block', marginBottom: 6 }}
            >
              Kaart-URL (optioneel)
            </label>
            <input
              id="map-image-url"
              className="input"
              type="url"
              value={(form.map_image_url as string | null) ?? ''}
              onChange={(e) => set('map_image_url', e.target.value || null)}
              placeholder="https://... (externe kaartafbeelding)"
            />
          </div>

          {form.map_image_url ? (
            safeMapPreviewUrl ? (
              <div style={{ position: 'relative', borderRadius: 'var(--r-md)', overflow: 'hidden', border: '1px solid var(--hairline)', aspectRatio: '16/9', maxHeight: 320 }}>
                <img
                  src={safeMapPreviewUrl}
                  alt="Kaartafbeelding"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                />
              </div>
            ) : (
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 140, border: '2px dashed var(--hairline)', borderRadius: 'var(--r-md)', color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: 16 }}
              >
                Alleen https-afbeeldings-URL's worden getoond.
              </div>
            )
          ) : (
            <div
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 140, border: '2px dashed var(--hairline)', borderRadius: 'var(--r-md)', color: 'var(--muted)', fontSize: 13 }}
            >
              Nog geen kaartafbeelding
            </div>
          )}
        </div>

        {/* Danger zone */}
        <div
          className="surface"
          style={{ marginTop: 24, padding: 28, borderColor: 'rgb(var(--crimson-rgb) / 0.18)' }}
        >
          <p className="pg-section-title" style={{ marginBottom: 4 }}>Gevarenzone</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, paddingTop: 16, borderTop: '1px solid var(--hairline)' }}>
            <div>
              <p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: 0 }}>Kroniek verwijderen</p>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: '2px 0 0' }}>
                Dit verwijdert de kroniek permanent en kan niet ongedaan worden gemaakt.
              </p>
            </div>
            <Button variant="danger" size="sm"
              onClick={() => setDeleteOpen(true)}
            >
              Verwijder kroniek
            </Button>
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

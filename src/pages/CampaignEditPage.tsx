import { useState, useEffect, useId, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { useCampaign } from '@/hooks/queries/useCampaign'
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
  const queryClient = useQueryClient()
  const descriptionId = useId()
  const statusId = useId()
  const headerImageId = useId()

  const locationState = location.state as { isNew?: boolean; worldId?: string } | null
  const isNew = locationState?.isNew ?? false
  const worldIdFromState = locationState?.worldId

  const [committed, setCommitted] = useState(!isNew)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [form, setForm] = useState<Partial<Campaign>>({})
  const [dirty, setDirty] = useState(false)

  const handlePositionChange = useCallback((posString: string) => {
    setForm((prev) => ({ ...prev, header_image_position: posString }))
    setDirty(true)
  }, [])

  const { data: campaign, isLoading } = useCampaign(id)

  const { containerRef, posString: imagePosString, isDragging, handlers: imagePosHandlers } = useImagePositioning(
    campaign?.header_image_position,
    handlePositionChange,
  )

  useEffect(() => {
    if (campaign) {
      setForm(campaign)
      setDirty(false)
    }
  }, [campaign])

  const saveCampaign = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('campaigns')
        .update({
          name: form.name,
          subtitle: form.subtitle,
          description: form.description,
          header_image: form.header_image,
          header_image_position: form.header_image_position ?? 'center',
          status: form.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id!)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.detail(id!) })
      const worldId = campaign?.world_id ?? worldIdFromState
      if (worldId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.byWorld(worldId) })
      }
      setCommitted(true)
      setDirty(false)
    },
    onError: () => {
      toast.error('Opslaan mislukt')
    },
  })

  const deleteCampaign = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('campaigns').delete().eq('id', id!)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all })
      const worldId = campaign?.world_id ?? worldIdFromState
      if (worldId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.byWorld(worldId) })
        navigate(`/worlds/${worldId}`)
      } else {
        navigate('/dashboard')
      }
    },
    onError: () => {
      toast.error('Verwijderen mislukt')
    },
  })

  function set<K extends keyof Campaign>(key: K, value: Campaign[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setDirty(true)
  }

  function handleCancel() {
    if (!committed) {
      if (worldIdFromState) {
        navigate(`/worlds/${worldIdFromState}`)
      } else {
        navigate('/dashboard')
      }
    } else {
      setForm(campaign!)
      setDirty(false)
      navigate(`/campaigns/${id}`)
    }
  }

  function handleBack() {
    if (!committed) {
      if (worldIdFromState) {
        navigate(`/worlds/${worldIdFromState}`)
      } else {
        navigate('/dashboard')
      }
    } else {
      navigate(`/campaigns/${id}`)
    }
  }

  function handleSave() {
    toast.promise(saveCampaign.mutateAsync(), {
      loading: 'Opslaan...',
      success: 'Kroniek opgeslagen',
      error: 'Opslaan mislukt',
    })
  }

  function handleDelete() {
    toast.promise(deleteCampaign.mutateAsync(), {
      loading: 'Verwijderen...',
      success: 'Kroniek verwijderd',
      error: 'Verwijderen mislukt',
    })
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

      {/* Delete modal */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Kroniek verwijderen"
      >
        <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 24 }}>
          Weet je zeker dat je <strong style={{ color: 'var(--ink)' }}>{campaign.name}</strong> wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="pangu-btn pangu-btn-ghost" onClick={() => setDeleteOpen(false)}>
            Annuleren
          </button>
          <button type="button" className="pangu-btn pangu-btn-crimson" onClick={handleDelete} disabled={deleteCampaign.isPending}>
            {deleteCampaign.isPending ? 'Verwijderen...' : 'Verwijder kroniek'}
          </button>
        </div>
      </Modal>
    </div>
  )
}

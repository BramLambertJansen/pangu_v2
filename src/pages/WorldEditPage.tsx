import { useState, useEffect, useId, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import type { World, WorldStatus } from '@/types/world.types'

const statusOptions: { value: WorldStatus; label: string }[] = [
  { value: 'draft',    label: 'Concept'      },
  { value: 'active',   label: 'Actief'       },
  { value: 'archived', label: 'Gearchiveerd' },
]

export default function WorldEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const descriptionId = useId()
  const quoteId = useId()
  const statusId = useId()
  const headerImageId = useId()

  const isNew = (location.state as { isNew?: boolean } | null)?.isNew ?? false
  const [committed, setCommitted] = useState(!isNew)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [form, setForm] = useState<Partial<World>>({})
  const [dirty, setDirty] = useState(false)

  const [imagePos, setImagePos] = useState<{ x: number; y: number }>({ x: 50, y: 50 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; posX: number; posY: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  function parsePosition(pos: string | null | undefined): { x: number; y: number } {
    if (!pos) return { x: 50, y: 50 }
    const m = pos.match(/^([\d.]+)%\s+([\d.]+)%$/)
    return m ? { x: parseFloat(m[1]), y: parseFloat(m[2]) } : { x: 50, y: 50 }
  }

  function serializePosition(pos: { x: number; y: number }): string {
    return `${pos.x.toFixed(1)}% ${pos.y.toFixed(1)}%`
  }

  function handleImageMouseDown(e: React.MouseEvent) {
    e.preventDefault()
    dragStartRef.current = { mouseX: e.clientX, mouseY: e.clientY, posX: imagePos.x, posY: imagePos.y }
    setIsDragging(true)
  }

  function handleImageTouchStart(e: React.TouchEvent) {
    const t = e.touches[0]
    dragStartRef.current = { mouseX: t.clientX, mouseY: t.clientY, posX: imagePos.x, posY: imagePos.y }
    setIsDragging(true)
  }

  useEffect(() => {
    if (!isDragging) return

    function onMove(e: MouseEvent | TouchEvent) {
      if (!dragStartRef.current || !containerRef.current) return
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      const rect = containerRef.current.getBoundingClientRect()
      const dx = clientX - dragStartRef.current.mouseX
      const dy = clientY - dragStartRef.current.mouseY
      const newX = Math.max(0, Math.min(100, dragStartRef.current.posX - (dx / rect.width) * 100))
      const newY = Math.max(0, Math.min(100, dragStartRef.current.posY - (dy / rect.height) * 100))
      const newPos = { x: newX, y: newY }
      setImagePos(newPos)
      setForm((prev) => ({ ...prev, header_image_position: serializePosition(newPos) }))
      setDirty(true)
    }

    function onUp() {
      setIsDragging(false)
      dragStartRef.current = null
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    document.addEventListener('touchmove', onMove, { passive: true })
    document.addEventListener('touchend', onUp)
    document.addEventListener('touchcancel', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onUp)
      document.removeEventListener('touchcancel', onUp)
    }
  }, [isDragging])

  const { data: world, isLoading } = useQuery<World>({
    queryKey: queryKeys.worlds.detail(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('worlds')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as World
    },
    enabled: !!id,
    staleTime: 1000 * 60,
  })

  useEffect(() => {
    if (world) {
      setForm(world)
      setImagePos(parsePosition(world.header_image_position))
      setDirty(false)
    }
  }, [world])

  const saveWorld = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('worlds')
        .update({
          name: form.name,
          subtitle: form.subtitle,
          quote: form.quote,
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
      queryClient.invalidateQueries({ queryKey: queryKeys.worlds.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.worlds.detail(id!) })
      setCommitted(true)
      setDirty(false)
    },
    onError: () => {
      toast.error('Opslaan mislukt')
    },
  })

  const deleteWorld = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('worlds').delete().eq('id', id!)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.worlds.all })
      navigate('/worlds')
    },
    onError: () => {
      toast.error('Verwijderen mislukt')
    },
  })

  function set<K extends keyof World>(key: K, value: World[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setDirty(true)
  }

  function handleCancel() {
    if (!committed) {
      navigate('/worlds')
    } else {
      if (world) setForm(world)
      setDirty(false)
      navigate(`/worlds/${id}`)
    }
  }

  function handleBack() {
    if (!committed) {
      navigate('/worlds')
    } else {
      navigate(`/worlds/${id}`)
    }
  }

  function handleSave() {
    toast.promise(saveWorld.mutateAsync(), {
      loading: 'Opslaan...',
      success: 'Wereld opgeslagen',
      error: 'Opslaan mislukt',
    })
  }

  function handleDelete() {
    toast.promise(deleteWorld.mutateAsync(), {
      loading: 'Verwijderen...',
      success: 'Wereld verwijderd',
      error: 'Verwijderen mislukt',
    })
    setDeleteOpen(false)
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }} aria-live="polite" aria-label="Wereld laden...">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!world) {
    return (
      <div>
        <p style={{ color: 'var(--muted)' }}>Wereld niet gevonden.</p>
        <button type="button" className="pangu-btn pangu-btn-ghost" onClick={() => navigate('/worlds')} style={{ marginTop: 16 }}>
          ← Terug naar werelden
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
          aria-label="Terug naar wereld"
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
          Terug naar wereld
        </button>

        {/* Page header */}
        <header style={{ marginBottom: 40 }}>
          <p className="pangu-eyebrow">Wereld bewerken</p>
          <h1 className="pangu-display-xl">{world.name}</h1>
          <p style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-soft)' }}>
            Pas de details van deze wereld aan.
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
              aria-label={`Afbeeldingsuitsnede: positie ${Math.round(imagePos.x)}% horizontaal, ${Math.round(imagePos.y)}% verticaal. Gebruik pijltjestoetsen om bij te stellen.`}
              tabIndex={0}
              onMouseDown={handleImageMouseDown}
              onTouchStart={handleImageTouchStart}
              onKeyDown={(e) => {
                const step = 5
                const dirs: Record<string, { dx: number; dy: number }> = {
                  ArrowLeft:  { dx: -step, dy: 0 },
                  ArrowRight: { dx:  step, dy: 0 },
                  ArrowUp:    { dx: 0, dy: -step },
                  ArrowDown:  { dx: 0, dy:  step },
                }
                const delta = dirs[e.key]
                if (!delta) return
                e.preventDefault()
                setImagePos((prev) => {
                  const newPos = {
                    x: Math.max(0, Math.min(100, prev.x + delta.dx)),
                    y: Math.max(0, Math.min(100, prev.y + delta.dy)),
                  }
                  setForm((f) => ({ ...f, header_image_position: serializePosition(newPos) }))
                  setDirty(true)
                  return newPos
                })
              }}
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
                  objectPosition: `${imagePos.x}% ${imagePos.y}%`,
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
              <label className="pangu-label" htmlFor="world-name">Naam</label>
              <input
                id="world-name"
                className="pangu-input"
                value={form.name ?? ''}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Naam van de wereld"
              />
            </div>

            <div>
              <label className="pangu-label" htmlFor="world-subtitle">Subtitel</label>
              <input
                id="world-subtitle"
                className="pangu-input"
                value={form.subtitle ?? ''}
                onChange={(e) => set('subtitle', e.target.value || null)}
                placeholder="Korte beschrijving of tagline"
              />
            </div>

            <div>
              <label className="pangu-label" htmlFor={statusId}>Status</label>
              <select
                id={statusId}
                className="pangu-select"
                value={form.status ?? 'draft'}
                onChange={(e) => set('status', e.target.value as WorldStatus)}
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
                onChange={(e) => set('header_image', e.target.value || null)}
                placeholder="https://..."
              />
            </div>

            <div className="sm:col-span-2">
              <label className="pangu-label" htmlFor={quoteId}>Quote</label>
              <textarea
                id={quoteId}
                className="pangu-textarea"
                value={form.quote ?? ''}
                onChange={(e) => set('quote', e.target.value || null)}
                placeholder="Een passende quote voor deze wereld..."
                rows={2}
                style={{ minHeight: 'auto' }}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="pangu-label" htmlFor={descriptionId}>Beschrijving</label>
              <textarea
                id={descriptionId}
                className="pangu-textarea"
                value={form.description ?? ''}
                onChange={(e) => set('description', e.target.value || null)}
                placeholder="Beschrijf de wereld, haar sfeer en achtergrond..."
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
              disabled={!dirty || saveWorld.isPending}
            >
              {saveWorld.isPending ? 'Opslaan...' : 'Opslaan'}
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
              <p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: 0 }}>Wereld verwijderen</p>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: '2px 0 0' }}>
                Dit verwijdert de wereld permanent en kan niet ongedaan worden gemaakt.
              </p>
            </div>
            <button
              type="button"
              className="pangu-btn pangu-btn-crimson pangu-btn-sm"
              onClick={() => setDeleteOpen(true)}
            >
              Verwijder wereld
            </button>
          </div>
        </div>

      </div>

      {/* Delete modal */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Wereld verwijderen"
      >
        <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 24 }}>
          Weet je zeker dat je <strong style={{ color: 'var(--ink)' }}>{world.name}</strong> wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="pangu-btn pangu-btn-ghost" onClick={() => setDeleteOpen(false)}>
            Annuleren
          </button>
          <button type="button" className="pangu-btn pangu-btn-crimson" onClick={handleDelete} disabled={deleteWorld.isPending}>
            {deleteWorld.isPending ? 'Verwijderen...' : 'Verwijder wereld'}
          </button>
        </div>
      </Modal>
    </div>
  )
}

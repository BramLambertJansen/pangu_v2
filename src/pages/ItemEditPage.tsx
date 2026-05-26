import { useId } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Spinner } from '@/components/ui/Spinner'
import { useEntityEdit } from '@/hooks/useEntityEdit'
import type { Item, ItemType, ItemRarity } from '@/types/item.types'
import type { Character } from '@/types/character.types'

const rarityOptions: { value: ItemRarity; label: string }[] = [
  { value: 'common',    label: 'Gewoon'          },
  { value: 'uncommon',  label: 'Ongewoon'        },
  { value: 'rare',      label: 'Zeldzaam'        },
  { value: 'very_rare', label: 'Zeer zeldzaam'   },
  { value: 'legendary', label: 'Legendarisch'    },
  { value: 'artifact',  label: 'Artefact'        },
]

const typeOptions: { value: ItemType; label: string }[] = [
  { value: 'weapon',   label: 'Wapen'     },
  { value: 'armor',    label: 'Pantser'   },
  { value: 'potion',   label: 'Drankje'   },
  { value: 'ring',     label: 'Ring'      },
  { value: 'rod',      label: 'Staf'      },
  { value: 'scroll',   label: 'Perkament' },
  { value: 'staff',    label: 'Stok'      },
  { value: 'wand',     label: 'Toverstok' },
  { value: 'wondrous', label: 'Wonderlijk'},
  { value: 'misc',     label: 'Overig'    },
]

export default function ItemEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()

  const descriptionId = useId()
  const rarityId = useId()
  const typeId = useId()
  const quantityId = useId()
  const weightId = useId()
  const assignId = useId()

  const locationState = location.state as { isNew?: boolean; campaignId?: string } | null
  const isNew = locationState?.isNew ?? false
  const campaignIdFromState = locationState?.campaignId

  const { data: itemData, isLoading } = useQuery<Item>({
    queryKey: queryKeys.items.detail(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as Item
    },
    enabled: !!id,
    staleTime: 1000 * 60,
  })

  const {
    form, set, dirty, setDirty,
    committed, setCommitted,
    deleteOpen, setDeleteOpen,
    resetForm, guard,
  } = useEntityEdit({ entity: itemData, isNew })

  const campaignId = itemData?.campaign_id ?? campaignIdFromState

  // Load characters in this campaign for the assignment dropdown
  const { data: campaignCharacters } = useQuery<Character[]>({
    queryKey: queryKeys.characters.byCampaign(campaignId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('characters')
        .select('id, name, character_class, user_id, campaign_id, subtitle, character_subclass, character_race, level, xp, xp_next, hp_current, hp_max, armor_class, speed, initiative, proficiency_bonus, stat_str, stat_dex, stat_con, stat_int, stat_wis, stat_cha, gold, silver, copper, description, notes, status, created_at, updated_at')
        .eq('campaign_id', campaignId!)
        .order('name', { ascending: true })
      if (error) throw error
      return data as Character[]
    },
    enabled: !!campaignId,
    staleTime: 1000 * 30,
  })

  const saveItem = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('items')
        .update({
          name: form.name,
          description: form.description ?? null,
          item_type: form.item_type,
          rarity: form.rarity,
          is_magical: form.is_magical ?? false,
          quantity: form.quantity ?? 1,
          weight: form.weight ?? null,
          character_id: form.character_id ?? null,
          committed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id!)
      if (error) throw error
    },
    onSuccess: () => {
      if (campaignId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.items.byCampaign(campaignId) })
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.items.detail(id!) })
      // Invalidate all character item queries since assignment may have changed
      queryClient.invalidateQueries({ queryKey: ['characters'] })
      setCommitted(true)
      setDirty(false)
    },
    onError: () => {
      toast.error('Opslaan mislukt')
    },
  })

  const deleteItem = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('items').delete().eq('id', id!)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: queryKeys.items.detail(id!) })
      if (campaignId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.items.byCampaign(campaignId) })
        queryClient.invalidateQueries({ queryKey: ['characters'] })
        navigate(`/campaigns/${campaignId}/items`)
      } else {
        navigate('/dashboard')
      }
    },
    onError: () => {
      toast.error('Verwijderen mislukt')
    },
  })

  async function handleDiscardConfirm() {
    const { error } = await supabase.from('items').delete().eq('id', id!)
    if (!error) {
      queryClient.removeQueries({ queryKey: queryKeys.items.detail(id!) })
      if (campaignId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.items.byCampaign(campaignId) })
      }
    }
    const handled = guard.confirmLeave()
    if (!handled) {
      if (campaignId) navigate(`/campaigns/${campaignId}/items`)
      else navigate('/dashboard')
    }
  }

  function handleBack() {
    if (!committed) {
      guard.requestDiscard()
    } else {
      if (campaignId) navigate(`/campaigns/${campaignId}/items`)
      else navigate('/dashboard')
    }
  }

  function handleCancel() {
    if (!committed) {
      guard.requestDiscard()
    } else {
      resetForm()
    }
  }

  function handleSave() {
    toast.promise(saveItem.mutateAsync(), {
      loading: 'Opslaan...',
      success: 'Item opgeslagen',
      error: 'Opslaan mislukt',
    })
  }

  function handleDelete() {
    toast.promise(deleteItem.mutateAsync(), {
      loading: 'Verwijderen...',
      success: 'Item verwijderd',
      error: 'Verwijderen mislukt',
    })
    setDeleteOpen(false)
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }} aria-live="polite" aria-label="Item laden...">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!itemData) {
    return (
      <div>
        <p style={{ color: 'var(--muted)' }}>Item niet gevonden.</p>
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
          aria-label="Terug naar items"
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
          Terug naar items
        </button>

        {/* Page header */}
        <header style={{ marginBottom: 40 }}>
          <p className="pangu-eyebrow">Item bewerken</p>
          <h1 className="pangu-display-xl">
            {itemData.is_magical && <span style={{ color: 'var(--gold)', marginRight: 8 }}>✦</span>}
            {itemData.name}
          </h1>
          <p style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-soft)' }}>
            Pas de details van dit item aan en wijs het toe aan een karakter.
          </p>
        </header>

        {/* Main form */}
        <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
          <p className="pangu-section-title" style={{ marginBottom: 20 }}>Basisgegevens</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <div>
              <label className="pangu-label" htmlFor="item-name">Naam</label>
              <input
                id="item-name"
                className="pangu-input"
                value={form.name ?? ''}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Naam van het item"
              />
            </div>

            <div>
              <label className="pangu-label" htmlFor={typeId}>Type</label>
              <select
                id={typeId}
                className="pangu-select"
                value={form.item_type ?? 'misc'}
                onChange={(e) => set('item_type', e.target.value as ItemType)}
              >
                {typeOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="pangu-label" htmlFor={rarityId}>Zeldzaamheid</label>
              <select
                id={rarityId}
                className="pangu-select"
                value={form.rarity ?? 'common'}
                onChange={(e) => set('rarity', e.target.value as ItemRarity)}
              >
                {rarityOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="pangu-label" htmlFor={quantityId}>Aantal</label>
              <input
                id={quantityId}
                type="number"
                className="pangu-input"
                value={form.quantity ?? 1}
                min={1}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10)
                  if (!isNaN(n) && n >= 1) set('quantity', n)
                }}
              />
            </div>

            <div>
              <label className="pangu-label" htmlFor={weightId}>Gewicht (pond)</label>
              <input
                id={weightId}
                type="number"
                className="pangu-input"
                value={form.weight ?? ''}
                min={0}
                step={0.1}
                placeholder="Optioneel"
                onChange={(e) => {
                  const n = parseFloat(e.target.value)
                  set('weight', isNaN(n) ? null : n)
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                id="item-magical"
                type="checkbox"
                checked={form.is_magical ?? false}
                onChange={(e) => set('is_magical', e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--gold)', cursor: 'pointer' }}
              />
              <label
                htmlFor="item-magical"
                className="pangu-label"
                style={{ marginBottom: 0, cursor: 'pointer' }}
              >
                ✦ Magisch item
              </label>
            </div>

            <div className="sm:col-span-2">
              <label className="pangu-label" htmlFor={descriptionId}>Beschrijving</label>
              <textarea
                id={descriptionId}
                className="pangu-textarea"
                value={form.description ?? ''}
                onChange={(e) => set('description', e.target.value || null)}
                placeholder="Beschrijf het item: uiterlijk, werking, geschiedenis..."
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
              disabled={!dirty || saveItem.isPending}
            >
              {saveItem.isPending ? 'Opslaan...' : 'Opslaan'}
            </button>
          </div>
        </div>

        {/* Assignment section */}
        <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
          <p className="pangu-section-title" style={{ marginBottom: 4 }}>Toewijzen aan karakter</p>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20, marginTop: 0 }}>
            Geef dit item aan een karakter in deze kroniek. Laat leeg om het in de DM-schatkist te houden.
          </p>

          <div style={{ maxWidth: 360 }}>
            <label className="pangu-label" htmlFor={assignId}>Karakter</label>
            <select
              id={assignId}
              className="pangu-select"
              value={form.character_id ?? ''}
              onChange={(e) => {
                set('character_id', e.target.value || null)
              }}
            >
              <option value="">In DM-schatkist</option>
              {campaignCharacters?.map((char) => (
                <option key={char.id} value={char.id}>
                  {char.name}{char.character_class ? ` (${char.character_class})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: 16 }}>
            <button
              type="button"
              className="pangu-btn pangu-btn-primary pangu-btn-sm"
              onClick={handleSave}
              disabled={!dirty || saveItem.isPending}
            >
              {saveItem.isPending ? 'Opslaan...' : 'Toewijzing opslaan'}
            </button>
          </div>
        </div>

        {/* Danger zone */}
        <div
          className="pangu-surface"
          style={{ marginTop: 8, padding: 28, borderColor: 'rgba(255,107,107,0.18)' }}
        >
          <p className="pangu-section-title" style={{ marginBottom: 4 }}>Gevarenzone</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, paddingTop: 16, borderTop: '1px solid var(--hairline)' }}>
            <div>
              <p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: 0 }}>Item verwijderen</p>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: '2px 0 0' }}>
                Dit verwijdert het item permanent en kan niet ongedaan worden gemaakt.
              </p>
            </div>
            <button
              type="button"
              className="pangu-btn pangu-btn-crimson pangu-btn-sm"
              onClick={() => setDeleteOpen(true)}
            >
              Verwijder item
            </button>
          </div>
        </div>

      </div>

      {/* Delete modal */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Item verwijderen"
      >
        <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 24 }}>
          Weet je zeker dat je <strong style={{ color: 'var(--ink)' }}>{itemData.name}</strong> wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="pangu-btn pangu-btn-ghost" onClick={() => setDeleteOpen(false)}>
            Annuleren
          </button>
          <button type="button" className="pangu-btn pangu-btn-crimson" onClick={handleDelete} disabled={deleteItem.isPending}>
            {deleteItem.isPending ? 'Verwijderen...' : 'Verwijder item'}
          </button>
        </div>
      </Modal>

      {/* Discard dialog */}
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

import { useId, useRef, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RelatedEntities } from '@/components/link/RelatedEntities'
import { Spinner } from '@/components/ui/Spinner'
import { useEntityEdit } from '@/hooks/useEntityEdit'
import { useItem, useSaveItem, useDeleteItem } from '@/hooks/queries/useItem'
import { useCampaignCharacters } from '@/hooks/queries/useCampaignCharacters'
import { useAuthStore } from '@/stores/auth.store'
import { useUserAISettings } from '@/hooks/queries/useUserAISettings'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024

function pollinationsUrl(prompt: string): string {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true&model=flux&seed=${Math.floor(Math.random() * 99999)}`
}
import type { ItemType, ItemRarity, ItemStatBonuses } from '@/types/item.types'
import { D5E_SKILLS } from '@/utils/dnd5e'

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

const SKILLS = D5E_SKILLS.map(s => s.name)

const WEAPON_TYPES: ItemType[] = ['weapon', 'staff', 'rod', 'wand']

function BonusInput({
  label,
  value,
  onChange,
  id,
}: {
  label: string
  value: number | undefined
  onChange: (val: number) => void
  id: string
}) {
  const displayVal = value ?? 0
  return (
    <div>
      <label className="pangu-label" htmlFor={id} style={{ fontSize: 11 }}>{label}</label>
      <input
        id={id}
        type="number"
        className="pangu-input"
        value={displayVal}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10)
          onChange(isNaN(n) ? 0 : n)
        }}
        style={{ textAlign: 'center' }}
      />
    </div>
  )
}

export default function ItemEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  const descriptionId = useId()
  const rarityId = useId()
  const typeId = useId()
  const quantityId = useId()
  const weightId = useId()
  const assignId = useId()
  const damageDiceId = useId()

  const user = useAuthStore((s) => s.user)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [imageUploading, setImageUploading] = useState(false)
  const [imageGenerating, setImageGenerating] = useState(false)
  const [imagePromptExtra, setImagePromptExtra] = useState('')

  const { data: aiSettings } = useUserAISettings(user?.id)
  const hasOpenAIKey = !!(aiSettings?.byok_keys?.['openai'])

  async function handleGenerateImage() {
    const name = form.name ?? itemData?.name ?? 'item'
    const itemType = (form.item_type ?? itemData?.item_type ?? 'misc') as string
    const extra = imagePromptExtra.trim()
    const basePrompt = `A detailed fantasy illustration of: ${name}${extra ? `. ${extra}` : ''}. Style: medieval fantasy RPG item art, high quality`
    const prompt = basePrompt
    if (hasOpenAIKey) {
      setImageGenerating(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) { toast.error('Niet ingelogd'); return }
        const resp = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ prompt }),
        })
        const json = await resp.json() as { url?: string; error?: string }
        if (!resp.ok || !json.url) { toast.error(json.error ?? 'Genereren mislukt'); return }
        set('image_url', json.url)
        toast.success('Afbeelding gegenereerd')
      } catch {
        toast.error('Genereren mislukt')
      } finally {
        setImageGenerating(false)
      }
    } else {
      const url = pollinationsUrl(`${name}${extra ? ` ${extra}` : ` ${itemType}`} fantasy RPG item illustration`)
      set('image_url', url)
      toast.success('Afbeelding gegenereerd via Pollinations')
    }
  }


  const locationState = location.state as { isNew?: boolean; campaignId?: string } | null
  const isNew = locationState?.isNew ?? false
  const campaignIdFromState = locationState?.campaignId

  const { data: itemData, isLoading } = useItem(id)

  const {
    form, set, dirty, setDirty,
    committed, setCommitted,
    deleteOpen, setDeleteOpen,
    resetForm, guard,
  } = useEntityEdit({ entity: itemData, isNew })

  const campaignId = itemData?.campaign_id ?? campaignIdFromState

  const { data: campaignCharacters } = useCampaignCharacters(campaignId)

  const saveItem = useSaveItem(id!)
  const deleteItem = useDeleteItem(id!)

  async function handleDiscardConfirm() {
    if (guard.isDraftDiscard) {
      try {
        await deleteItem.mutateAsync({ campaignId })
      } catch {
        return
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

  function extractStoragePath(url: string): string | null {
    const marker = '/entity-images/'
    const idx = url.indexOf(marker)
    return idx !== -1 ? url.slice(idx + marker.length) : null
  }

  async function deleteStorageObject(url: string) {
    const path = extractStoragePath(url)
    if (path) await supabase.storage.from('entity-images').remove([path])
  }

  async function handleImageUpload(file: File) {
    if (!user || !id) return
    if (!file.type.startsWith('image/')) {
      toast.error('Alleen afbeeldingen zijn toegestaan')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error('Afbeelding mag maximaal 5 MB zijn')
      return
    }
    setImageUploading(true)
    try {
      const oldUrl = form.image_url as string | null | undefined
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `items/${user.id}/${id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('entity-images')
        .upload(path, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data: urlData } = supabase.storage.from('entity-images').getPublicUrl(path)
      const imageUrl = urlData.publicUrl
      const { error: updateError } = await supabase
        .from('items')
        .update({ image_url: imageUrl })
        .eq('id', id)
      if (updateError) throw updateError
      if (oldUrl) await deleteStorageObject(oldUrl)
      set('image_url', imageUrl)
      toast.success('Afbeelding opgeslagen')
    } catch {
      toast.error('Uploaden mislukt')
    } finally {
      setImageUploading(false)
    }
  }

  async function handleImageRemove() {
    if (!id) return
    const oldUrl = form.image_url as string | null | undefined
    const { error } = await supabase
      .from('items')
      .update({ image_url: null })
      .eq('id', id)
    if (error) { toast.error('Verwijderen mislukt'); return }
    if (oldUrl) await deleteStorageObject(oldUrl)
    set('image_url', null)
    toast.success('Afbeelding verwijderd')
  }

  function handleSave() {
    if (!form.name?.trim()) {
      toast.error('Naam is verplicht')
      return
    }
    if (!form.item_type) {
      toast.error('Type is verplicht')
      return
    }
    if (!form.rarity) {
      toast.error('Zeldzaamheid is verplicht')
      return
    }
    toast.promise(
      saveItem.mutateAsync({ form, originalCharacterId: itemData?.character_id }).then(() => {
        setCommitted(true)
        setDirty(false)
      }),
      { loading: 'Opslaan...', success: 'Item opgeslagen', error: 'Opslaan mislukt' },
    )
  }

  function handleDelete() {
    toast.promise(
      deleteItem.mutateAsync({ campaignId }).then(() => {
        if (campaignId) navigate(`/campaigns/${campaignId}/items`)
        else navigate('/dashboard')
      }),
      { loading: 'Verwijderen...', success: 'Item verwijderd', error: 'Verwijderen mislukt' },
    )
    setDeleteOpen(false)
  }

  // Helpers to update a single property bonus field.
  function setBonus<K extends keyof ItemStatBonuses>(key: K, value: ItemStatBonuses[K]) {
    const current = (form.properties ?? {}) as ItemStatBonuses
    set('properties', { ...current, [key]: value })
  }

  function setSkillBonus(skill: string, bonus: number) {
    const current = (form.properties ?? {}) as ItemStatBonuses
    const existing = current.skill_bonuses ?? {}
    set('properties', { ...current, skill_bonuses: { ...existing, [skill]: bonus } })
  }

  function removeSkillBonus(skill: string) {
    const current = (form.properties ?? {}) as ItemStatBonuses
    const existing = { ...(current.skill_bonuses ?? {}) }
    delete existing[skill]
    set('properties', { ...current, skill_bonuses: Object.keys(existing).length > 0 ? existing : undefined })
  }

  function addSkillBonus() {
    const current = (form.properties ?? {}) as ItemStatBonuses
    const existing = current.skill_bonuses ?? {}
    const usedSkills = new Set(Object.keys(existing))
    const nextSkill = SKILLS.find((s) => !usedSkills.has(s))
    if (nextSkill) {
      set('properties', { ...current, skill_bonuses: { ...existing, [nextSkill]: 1 } })
    }
  }

  const props = (form.properties ?? {}) as ItemStatBonuses
  const currentType = (form.item_type ?? 'misc') as ItemType
  const isWeaponType = WEAPON_TYPES.includes(currentType)
  const isArmorType = currentType === 'armor'
  const skillBonusEntries = Object.entries(props.skill_bonuses ?? {})
  const usedSkills = new Set(Object.keys(props.skill_bonuses ?? {}))
  const hasAnyBonus =
    (props.ac_bonus ?? 0) !== 0 ||
    (props.str_bonus ?? 0) !== 0 ||
    (props.dex_bonus ?? 0) !== 0 ||
    (props.con_bonus ?? 0) !== 0 ||
    (props.int_bonus ?? 0) !== 0 ||
    (props.wis_bonus ?? 0) !== 0 ||
    (props.cha_bonus ?? 0) !== 0 ||
    (props.hp_bonus ?? 0) !== 0 ||
    (props.speed_bonus ?? 0) !== 0 ||
    (props.initiative_bonus ?? 0) !== 0 ||
    (props.attack_bonus ?? 0) !== 0 ||
    (props.damage_bonus ?? 0) !== 0 ||
    !!props.damage_dice ||
    !!props.stealth_disadvantage ||
    skillBonusEntries.length > 0

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

        {/* ── Afbeelding ── */}
        <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
          <p className="pangu-section-title" style={{ marginBottom: 4 }}>Afbeelding</p>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20, marginTop: 0 }}>
            Voeg een illustratie toe van dit item. Maximaal 5 MB.
          </p>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            aria-hidden="true"
            tabIndex={-1}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleImageUpload(file)
              e.target.value = ''
            }}
          />
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {form.image_url ? (
                <img
                  src={form.image_url}
                  alt={`Afbeelding van ${form.name ?? 'item'}`}
                  style={{
                    width: 140, height: 140, objectFit: 'cover',
                    borderRadius: 12,
                    border: '1px solid var(--hairline)',
                    display: 'block',
                  }}
                />
              ) : (
                <div
                  aria-hidden="true"
                  style={{
                    width: 140, height: 140, borderRadius: 12,
                    border: '1px dashed var(--hairline)',
                    background: 'var(--surface-2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexDirection: 'column', gap: 6,
                  }}
                >
                  <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span style={{ fontSize: 11, color: 'var(--subtle)', fontFamily: 'var(--font-body)' }}>Geen afbeelding</span>
                </div>
              )}
              {imageUploading && (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.5)', borderRadius: 12 }}
                  aria-live="polite"
                  aria-label="Afbeelding wordt geüpload"
                >
                  <Spinner size="sm" />
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <label className="pangu-label" htmlFor="image-prompt-extra" style={{ fontSize: 11 }}>
                  Verfijn prompt <span style={{ color: 'var(--subtle)', fontWeight: 400 }}>(optioneel)</span>
                </label>
                <input
                  id="image-prompt-extra"
                  className="pangu-input"
                  style={{ fontSize: 13 }}
                  value={imagePromptExtra}
                  onChange={(e) => setImagePromptExtra(e.target.value)}
                  placeholder="bijv. glowing blue runes, wooden handle"
                />
              </div>
              <button
                type="button"
                className="pangu-btn pangu-btn-secondary pangu-btn-sm"
                disabled={imageUploading || imageGenerating}
                onClick={() => imageInputRef.current?.click()}
              >
                {imageUploading ? 'Uploaden...' : form.image_url ? 'Afbeelding wijzigen' : 'Afbeelding uploaden'}
              </button>
              <button
                type="button"
                className="pangu-btn pangu-btn-sm"
                disabled={imageUploading || imageGenerating}
                onClick={handleGenerateImage}
                style={{ background: 'rgba(212,175,55,0.15)', color: 'var(--gold)', border: '1px solid rgba(212,175,55,0.3)' }}
                title={hasOpenAIKey ? 'Genereer via DALL-E 3' : 'Genereer via Pollinations (gratis)'}
              >
                {imageGenerating ? 'Genereren...' : hasOpenAIKey ? '✦ DALL-E' : '✦ Genereer'}
              </button>
              {form.image_url && (
                <button
                  type="button"
                  className="pangu-btn pangu-btn-ghost pangu-btn-sm"
                  disabled={imageUploading || imageGenerating}
                  onClick={handleImageRemove}
                  style={{ color: 'var(--crimson)' }}
                >
                  Afbeelding verwijderen
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Basisgegevens ── */}
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

        {/* ── Eigenschappen & bonussen ── */}
        <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
            <p className="pangu-section-title" style={{ margin: 0 }}>Eigenschappen & bonussen</p>
            {hasAnyBonus && (
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
                color: 'var(--gold)', padding: '2px 8px',
                border: '1px solid rgba(212,175,55,0.35)',
                borderRadius: 'var(--r-full)',
                background: 'rgba(212,175,55,0.08)',
              }}>
                Actief
              </span>
            )}
          </div>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20, marginTop: 4 }}>
            Stel in welke stats dit item beïnvloedt wanneer het uitgerust is.
          </p>

          {/* Combat bonuses */}
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 }}>
            Gevechts­bonussen
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" style={{ marginBottom: 20 }}>
            <BonusInput id="bonus-ac"         label="AC bonus"         value={props.ac_bonus}         onChange={(v) => setBonus('ac_bonus', v || undefined)} />
            <BonusInput id="bonus-hp"         label="Max HP bonus"     value={props.hp_bonus}         onChange={(v) => setBonus('hp_bonus', v || undefined)} />
            <BonusInput id="bonus-speed"      label="Snelheids bonus"  value={props.speed_bonus}      onChange={(v) => setBonus('speed_bonus', v || undefined)} />
            <BonusInput id="bonus-initiative" label="Initiatief bonus" value={props.initiative_bonus} onChange={(v) => setBonus('initiative_bonus', v || undefined)} />
          </div>

          {/* Ability score bonuses */}
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 }}>
            Eigenschappen­bonussen
          </p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6" style={{ marginBottom: 20 }}>
            <BonusInput id="bonus-str" label="STR" value={props.str_bonus} onChange={(v) => setBonus('str_bonus', v || undefined)} />
            <BonusInput id="bonus-dex" label="DEX" value={props.dex_bonus} onChange={(v) => setBonus('dex_bonus', v || undefined)} />
            <BonusInput id="bonus-con" label="CON" value={props.con_bonus} onChange={(v) => setBonus('con_bonus', v || undefined)} />
            <BonusInput id="bonus-int" label="INT" value={props.int_bonus} onChange={(v) => setBonus('int_bonus', v || undefined)} />
            <BonusInput id="bonus-wis" label="WIS" value={props.wis_bonus} onChange={(v) => setBonus('wis_bonus', v || undefined)} />
            <BonusInput id="bonus-cha" label="CHA" value={props.cha_bonus} onChange={(v) => setBonus('cha_bonus', v || undefined)} />
          </div>

          {/* Weapon-specific bonuses */}
          {isWeaponType && (
            <>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 }}>
                Wapen­bonussen
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" style={{ marginBottom: 20 }}>
                <BonusInput id="bonus-attack" label="Aanvalsbonus" value={props.attack_bonus} onChange={(v) => setBonus('attack_bonus', v || undefined)} />
                <BonusInput id="bonus-damage" label="Schadesbonus" value={props.damage_bonus} onChange={(v) => setBonus('damage_bonus', v || undefined)} />
                <div>
                  <label className="pangu-label" htmlFor={damageDiceId} style={{ fontSize: 11 }}>Schadevorm</label>
                  <input
                    id={damageDiceId}
                    type="text"
                    className="pangu-input"
                    value={props.damage_dice ?? ''}
                    onChange={(e) => setBonus('damage_dice', e.target.value || undefined)}
                    placeholder="bijv. 1d8"
                  />
                </div>
              </div>
            </>
          )}

          {/* Armor-specific: stealth disadvantage */}
          {isArmorType && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 }}>
                Pantser­eigenschappen
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  id="bonus-stealth-disadvantage"
                  type="checkbox"
                  checked={props.stealth_disadvantage ?? false}
                  onChange={(e) => setBonus('stealth_disadvantage', e.target.checked || undefined)}
                  style={{ width: 16, height: 16, accentColor: 'var(--crimson)', cursor: 'pointer' }}
                />
                <label htmlFor="bonus-stealth-disadvantage" className="pangu-label" style={{ marginBottom: 0, cursor: 'pointer' }}>
                  Sluipen nadeel (zwaar pantser)
                </label>
              </div>
            </div>
          )}

          {/* Skill bonuses */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)', margin: 0 }}>
                Vaardigheids­bonussen
              </p>
              <button
                type="button"
                className="pangu-btn pangu-btn-ghost pangu-btn-sm"
                onClick={addSkillBonus}
                disabled={usedSkills.size >= SKILLS.length}
                style={{ fontSize: 12 }}
              >
                + Vaardigheid toevoegen
              </button>
            </div>

            {skillBonusEntries.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {skillBonusEntries.map(([skill, bonus]) => (
                  <div key={skill} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <select
                      className="pangu-select"
                      style={{ flex: 1 }}
                      value={skill}
                      onChange={(e) => {
                        const newSkill = e.target.value
                        if (newSkill !== skill) {
                          removeSkillBonus(skill)
                          setSkillBonus(newSkill, bonus)
                        }
                      }}
                    >
                      {SKILLS.filter((s) => s === skill || !usedSkills.has(s)).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      className="pangu-input"
                      style={{ width: 80, textAlign: 'center' }}
                      value={bonus}
                      onChange={(e) => {
                        const n = parseInt(e.target.value, 10)
                        setSkillBonus(skill, isNaN(n) ? 0 : n)
                      }}
                    />
                    <button
                      type="button"
                      aria-label={`${skill} bonus verwijderen`}
                      onClick={() => removeSkillBonus(skill)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--muted)', fontSize: 16, lineHeight: 1, padding: 4,
                        flexShrink: 0, transition: 'color var(--t-fast)',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--crimson)' }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--muted)' }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--subtle)', fontStyle: 'italic' }}>
                Geen vaardigheidsbonussen. Klik "+ Vaardigheid toevoegen" om er een toe te voegen.
              </p>
            )}
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

        {/* ── Toewijzen aan karakter ── */}
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

        {/* ── Gevarenzone ── */}
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

      {itemData.committed && itemData.campaign_id && (
        <RelatedEntities type="item" id={itemData.id} campaignId={itemData.campaign_id} />
      )}

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

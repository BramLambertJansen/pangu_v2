import { useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAI } from '@/hooks/useAI'
import { Button } from '@/components/ui/Button'
import { useCampaignWithWorld } from '@/hooks/queries/useCampaign'
import { useCreateCampaignItem } from '@/hooks/queries/useCampaignItems'
import { useUserAISettings } from '@/hooks/queries/useUserAISettings'
import { useAuthStore } from '@/stores/auth.store'
import { supabase } from '@/lib/supabase'
import { Spinner } from '@/components/ui/Spinner'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { itemTypeLabel, itemRarityLabel, itemRarityColor } from '@/lib/statusMaps'
import type { ItemType, ItemRarity, ItemStatBonuses } from '@/types/item.types'
import { formatItemBonuses } from '@/utils/equipmentUtils'

// Builds a Pollinations.ai URL from a text prompt — no API key required
function pollinationsUrl(prompt: string): string {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true&model=flux&seed=${Math.floor(Math.random() * 99999)}`
}

interface GeneratedItem {
  _key: string
  name: string
  description: string | null
  item_type: ItemType
  rarity: ItemRarity
  is_magical: boolean
  weight: number | null
  properties: ItemStatBonuses
  image_url: string | null
}

const ITEM_TYPES: ItemType[] = ['weapon', 'armor', 'potion', 'ring', 'rod', 'scroll', 'staff', 'wand', 'wondrous', 'misc']
const ITEM_RARITIES: ItemRarity[] = ['common', 'uncommon', 'rare', 'very_rare', 'legendary', 'artifact']

const SHORTCUTS = [
  { label: 'Kerkerbuit', context: 'Gevonden in een donkere kerker tussen de resten van verslagen vijanden' },
  { label: 'Quest beloning', context: 'Beloning voor het voltooien van een gevaarlijke en heroïsche queeste' },
  { label: 'Bandietenleider', context: 'Buitgemaakt op een verslagen bandietenleider en zijn bende' },
  { label: 'Toverdrankjes', context: 'Drankjes en perkamenten van een mysterieuze reizende koopman' },
  { label: 'Oud artefact', context: 'Oud en krachtig relikwie uit een vergeten beschaving' },
]

const NUMERIC_BONUS_KEYS: (keyof ItemStatBonuses)[] = [
  'ac_bonus', 'str_bonus', 'dex_bonus', 'con_bonus', 'int_bonus',
  'wis_bonus', 'cha_bonus', 'hp_bonus', 'speed_bonus', 'initiative_bonus',
  'attack_bonus', 'damage_bonus',
]

function sanitizeStatBonuses(raw: unknown): ItemStatBonuses {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const obj = raw as Record<string, unknown>
  const result: ItemStatBonuses = {}
  for (const key of NUMERIC_BONUS_KEYS) {
    const val = obj[key]
    if (val === undefined || val === null) continue
    const n = Number(val)
    if (Number.isFinite(n) && n !== 0) (result as Record<string, unknown>)[key] = Math.round(n)
  }
  if (typeof obj['damage_dice'] === 'string' && /^\d+d\d+$/.test(obj['damage_dice'])) {
    result.damage_dice = obj['damage_dice']
  }
  if (typeof obj['stealth_disadvantage'] === 'boolean') {
    result.stealth_disadvantage = obj['stealth_disadvantage']
  }
  return result
}

function parseAIResponse(raw: string): GeneratedItem[] {
  let cleaned = raw.trim()
  // Strip markdown code blocks
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '')
  // Extract JSON array if wrapped in other text
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/)
  if (arrayMatch) cleaned = arrayMatch[0]
  const parsed: unknown[] = JSON.parse(cleaned)
  if (!Array.isArray(parsed)) throw new Error('Expected JSON array')
  return parsed.map((item, i) => {
    const obj = item as Record<string, unknown>
    return {
      _key: `item-${i}-${Date.now()}`,
      name: String(obj['name'] ?? 'Naamloos item'),
      description: obj['description'] ? String(obj['description']) : null,
      item_type: ITEM_TYPES.includes(obj['item_type'] as ItemType) ? (obj['item_type'] as ItemType) : 'misc',
      rarity: ITEM_RARITIES.includes(obj['rarity'] as ItemRarity) ? (obj['rarity'] as ItemRarity) : 'common',
      is_magical: Boolean(obj['is_magical']),
      weight: obj['weight'] != null ? Number(obj['weight']) : null,
      properties: sanitizeStatBonuses(obj['properties']),
      image_url: null,
      image_attribution: null,
    }
  })
}

export default function LootGeneratorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { ask, loading: aiLoading, lastProvider, lastModel } = useAI()
  const createItem = useCreateCampaignItem(id!)
  const user = useAuthStore(s => s.user)
  const { data: aiSettings } = useUserAISettings(user?.id)
  const hasOpenAIKey = Boolean(aiSettings?.byok_keys?.['openai'])

  const { data: campaign, isLoading: isLoadingCampaign } = useCampaignWithWorld(id)

  const [count, setCount] = useState<number>(3)
  const [itemType, setItemType] = useState<ItemType | 'random'>('random')
  const [rarity, setRarity] = useState<ItemRarity | 'random'>('random')
  const [context, setContext] = useState('')
  const [results, setResults] = useState<GeneratedItem[]>([])
  const [rawFallback, setRawFallback] = useState<string | null>(null)
  const [parseError, setParseError] = useState(false)
  const [addedKeys, setAddedKeys] = useState<string[]>([])
  const [pendingKeys, setPendingKeys] = useState<string[]>([])
  // per-item image generation state: key → loading bool
  const [imageLoadingKeys, setImageLoadingKeys] = useState<string[]>([])

  const buildPrompt = useCallback((): string => {
    if (!campaign) return ''
    const worldName = campaign.worlds?.name ?? 'onbekende wereld'
    const typeClause = itemType !== 'random' ? `, of type "${itemTypeLabel[itemType]}"` : ''
    const rarityClause = rarity !== 'random' ? `, of rarity "${itemRarityLabel[rarity]}"` : ''
    const contextClause = context.trim() ? `\nContext: ${context.trim()}` : ''
    return `Generate loot for the campaign "${campaign.name}" set in the world "${worldName}".${contextClause}

Produce exactly ${count} item${count > 1 ? 's' : ''}${typeClause}${rarityClause}. Make each item atmospheric and specific to this world.
Most items should have an empty "properties" object. Only rare, very_rare, legendary or artifact items may occasionally carry a stat bonus — and even then only if it fits the item's nature. Keep bonuses modest (typically +1, at most +2 for legendary/artifact). Use only the relevant keys: ac_bonus, str_bonus, dex_bonus, con_bonus, int_bonus, wis_bonus, cha_bonus, hp_bonus, speed_bonus, initiative_bonus, attack_bonus, damage_bonus (integers), damage_dice (string e.g. "1d6"), stealth_disadvantage (boolean).
Return ONLY a raw JSON array — no markdown, no explanation, just the array:
[{"name":"Item Name","description":"1-2 evocative sentences describing the item.","item_type":"misc","rarity":"common","is_magical":false,"weight":null,"properties":{}}]`
  }, [campaign, count, itemType, rarity, context])

  async function handleGenerate() {
    if (!campaign) return
    const prompt = buildPrompt()
    setResults([])
    setRawFallback(null)
    setParseError(false)
    setAddedKeys([])
    setPendingKeys([])
    try {
      const reply = await ask([{ role: 'user', content: prompt }], 'Buitgenerator items gegenereerd')
      try {
        setResults(parseAIResponse(reply))
      } catch {
        setParseError(true)
        setRawFallback(reply)
        toast.error('Kon de AI-respons niet verwerken — de tekst wordt als terugval weergegeven')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Genereren mislukt')
    }
  }

  async function generateImage(item: GeneratedItem) {
    setImageLoadingKeys(prev => [...prev, item._key])
    try {
      let url: string
      if (hasOpenAIKey) {
        const { data: { session } } = await supabase.auth.getSession()
        const resp = await fetch('/api/generate-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token ?? ''}`,
          },
          body: JSON.stringify({
            prompt: `Fantasy RPG item artwork, detailed, painterly style: ${item.name}. ${item.description ?? ''}`.trim(),
          }),
        })
        const json = await resp.json() as { url?: string; error?: string }
        if (!resp.ok || !json.url) throw new Error(json.error ?? 'DALL-E mislukt')
        url = json.url
      } else {
        const prompt = `Fantasy RPG item artwork: ${item.name}. ${item.description ?? ''}`.trim()
        url = pollinationsUrl(prompt)
      }
      setResults(prev => prev.map(r => r._key === item._key ? { ...r, image_url: url } : r))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Afbeelding genereren mislukt')
    } finally {
      setImageLoadingKeys(prev => prev.filter(k => k !== item._key))
    }
  }

  function setItemImageUrl(key: string, url: string) {
    setResults(prev => prev.map(r => r._key === key ? { ...r, image_url: url || null } : r))
  }

  async function addItem(item: GeneratedItem) {
    if (addedKeys.includes(item._key)) return
    if (imageLoadingKeys.includes(item._key)) return
    setPendingKeys(prev => [...prev, item._key])
    try {
      await createItem.mutateAsync({
        name: item.name,
        description: item.description,
        item_type: item.item_type,
        rarity: item.rarity,
        is_magical: item.is_magical,
        weight: item.weight,
        properties: item.properties,
        image_url: item.image_url,
      })
      setAddedKeys(prev => [...prev, item._key])
      toast.success(`"${item.name}" toegevoegd aan schatkist`)
    } catch {
      toast.error('Toevoegen mislukt')
    } finally {
      setPendingKeys(prev => prev.filter(k => k !== item._key))
    }
  }

  async function addAll() {
    const pending = results.filter(r => !addedKeys.includes(r._key))
    await Promise.all(pending.map(addItem))
  }

  if (isLoadingCampaign) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }} aria-live="polite">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!campaign) {
    return (
      <div>
        <p style={{ color: 'var(--muted)' }}>Kroniek niet gevonden.</p>
        <Button variant="ghost" onClick={() => navigate('/campaigns')} style={{ marginTop: 16 }}>
          ← Terug naar kronieken
        </Button>
      </div>
    )
  }

  const unadded = results.filter(r => !addedKeys.includes(r._key))
  const hasResults = results.length > 0 || parseError

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', paddingBottom: 80 }}>
      <Breadcrumb items={[
        { label: campaign.worlds?.name ?? 'Wereld', onClick: () => navigate(`/worlds/${campaign.world_id}`) },
        { label: campaign.name, onClick: () => navigate(`/campaigns/${id}`) },
        { label: 'Items', onClick: () => navigate(`/campaigns/${id}/items`) },
        { label: 'AI Buitgenerator' },
      ]} />

      {/* Hero header */}
      <div style={{ marginBottom: 36 }}>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
          letterSpacing: '0.2em', textTransform: 'uppercase',
          color: 'var(--gold)', margin: '0 0 10px',
        }}>
          AI Buitgenerator · {campaign.name}
        </p>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(32px, 7vw, 48px)',
          fontWeight: 600, lineHeight: 0.95,
          letterSpacing: '0.04em', textTransform: 'uppercase',
          color: 'var(--ink)', margin: '0 0 14px',
        }}>
          Buit Smeden
        </h1>
        <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--ink-soft)', margin: 0 }}>
          Laat de AI magische items genereren voor je kroniek. Pas de instellingen aan en voeg items direct toe aan de schatkist.
        </p>
      </div>

      {/* Controls panel */}
      <div className="pangu-surface" style={{ padding: 28, marginBottom: 28 }}>

        {/* Shortcut chips */}
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          color: 'var(--muted)', margin: '0 0 10px',
        }}>
          Snel invullen
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
          {SHORTCUTS.map(sc => (
            <button
              key={sc.label}
              type="button"
              onClick={() => setContext(sc.context)}
              disabled={aiLoading}
              style={{
                padding: '6px 14px',
                background: context === sc.context ? 'rgba(212,170,87,0.15)' : 'var(--surface-2)',
                border: `1px solid ${context === sc.context ? 'rgba(212,170,87,0.4)' : 'var(--hairline)'}`,
                borderRadius: 'var(--r-full)',
                color: context === sc.context ? 'var(--gold)' : 'var(--muted)',
                fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600,
                letterSpacing: '0.08em',
                cursor: aiLoading ? 'not-allowed' : 'pointer',
                transition: 'all var(--t-fast)',
              }}
            >
              {sc.label}
            </button>
          ))}
        </div>

        {/* Count selector */}
        <div style={{ marginBottom: 20 }}>
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: 'var(--muted)', margin: '0 0 10px',
          }}>
            Aantal items
          </p>
          <div style={{ display: 'flex', gap: 8 }} role="group" aria-label="Aantal items selecteren">
            {[1, 2, 3, 5].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setCount(n)}
                disabled={aiLoading}
                aria-pressed={count === n}
                style={{
                  width: 44, height: 44,
                  background: count === n ? 'rgba(212,170,87,0.15)' : 'var(--surface-2)',
                  border: `1px solid ${count === n ? 'rgba(212,170,87,0.4)' : 'var(--hairline)'}`,
                  borderRadius: 10,
                  color: count === n ? 'var(--gold)' : 'var(--ink-soft)',
                  fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700,
                  cursor: aiLoading ? 'not-allowed' : 'pointer',
                  transition: 'all var(--t-fast)',
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Type + Rarity selectors */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div>
            <label
              htmlFor="loot-type"
              style={{
                display: 'block',
                fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
                letterSpacing: '0.18em', textTransform: 'uppercase',
                color: 'var(--muted)', marginBottom: 8,
              }}
            >
              Soort item
            </label>
            <select
              id="loot-type"
              value={itemType}
              onChange={e => setItemType(e.target.value as ItemType | 'random')}
              disabled={aiLoading}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--void)',
                border: '1px solid var(--hairline)',
                borderRadius: 10,
                color: 'var(--ink)',
                fontFamily: 'var(--font-body)', fontSize: 13,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="random">Willekeurig</option>
              {ITEM_TYPES.map(t => (
                <option key={t} value={t}>{itemTypeLabel[t]}</option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="loot-rarity"
              style={{
                display: 'block',
                fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
                letterSpacing: '0.18em', textTransform: 'uppercase',
                color: 'var(--muted)', marginBottom: 8,
              }}
            >
              Zeldzaamheid
            </label>
            <select
              id="loot-rarity"
              value={rarity}
              onChange={e => setRarity(e.target.value as ItemRarity | 'random')}
              disabled={aiLoading}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--void)',
                border: '1px solid var(--hairline)',
                borderRadius: 10,
                color: 'var(--ink)',
                fontFamily: 'var(--font-body)', fontSize: 13,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="random">Willekeurig</option>
              {ITEM_RARITIES.map(r => (
                <option key={r} value={r}>{itemRarityLabel[r]}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Context input */}
        <div style={{ marginBottom: 20 }}>
          <label
            htmlFor="loot-context"
            style={{
              display: 'block',
              fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              color: 'var(--muted)', marginBottom: 8,
            }}
          >
            Context <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optioneel)</span>
          </label>
          <textarea
            id="loot-context"
            value={context}
            onChange={e => setContext(e.target.value)}
            placeholder="bv. gevonden in een oude kerker, beloning van een edelman"
            disabled={aiLoading}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                void handleGenerate()
              }
            }}
            style={{
              width: '100%', boxSizing: 'border-box',
              minHeight: 72,
              padding: '10px 14px',
              background: 'var(--void)',
              border: '1px solid var(--hairline)',
              borderRadius: 10,
              color: 'var(--ink)',
              fontSize: 14, lineHeight: 1.5,
              fontFamily: 'var(--font-body)',
              resize: 'vertical',
              outline: 'none',
              transition: 'border-color var(--t-fast)',
              opacity: aiLoading ? 0.6 : 1,
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(212,170,87,0.45)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--hairline)')}
            aria-describedby="loot-context-hint"
          />
          <p id="loot-context-hint" style={{ fontSize: 11, color: 'var(--subtle)', margin: '6px 0 0', textAlign: 'right' }}>
            Ctrl+Enter om te genereren
          </p>
        </div>

        {/* Generate button */}
        <button
          type="button"
          onClick={() => void handleGenerate()}
          disabled={aiLoading}
          aria-label={`Genereer ${count} item${count > 1 ? 's' : ''}`}
          style={{
            width: '100%',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '14px 24px',
            background: aiLoading
              ? 'rgba(212,170,87,0.1)'
              : 'linear-gradient(135deg, rgba(212,170,87,0.22) 0%, rgba(212,170,87,0.1) 100%)',
            border: '1px solid rgba(212,170,87,0.35)',
            borderRadius: 'var(--r-full)',
            color: 'var(--gold)',
            fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            cursor: aiLoading ? 'not-allowed' : 'pointer',
            transition: 'background var(--t-fast), border-color var(--t-fast)',
          }}
          onMouseEnter={e => {
            if (!aiLoading) {
              e.currentTarget.style.background = 'rgba(212,170,87,0.2)'
              e.currentTarget.style.borderColor = 'rgba(212,170,87,0.55)'
            }
          }}
          onMouseLeave={e => {
            if (!aiLoading) {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(212,170,87,0.22) 0%, rgba(212,170,87,0.1) 100%)'
              e.currentTarget.style.borderColor = 'rgba(212,170,87,0.35)'
            }
          }}
        >
          {aiLoading ? (
            <>
              <Spinner size="sm" />
              Items genereren...
            </>
          ) : (
            <>
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
              </svg>
              Genereer {count} item{count > 1 ? 's' : ''}
            </>
          )}
        </button>
      </div>

      {/* Empty / awaiting state */}
      {!hasResults && !aiLoading && (
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '52px 24px',
          border: '1.5px dashed var(--hairline)',
          borderRadius: 'var(--r-xl)',
          textAlign: 'center',
        }}>
          <div style={{ opacity: 0.18, marginBottom: 20, lineHeight: 0 }}>
            <svg aria-hidden="true" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 8h20v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8z" />
              <rect x="2" y="5" width="20" height="5" rx="1" />
              <path d="M12 8v5" />
              <circle cx="12" cy="15" r="1.5" />
            </svg>
          </div>
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(20px, 4vw, 26px)',
            fontWeight: 600, lineHeight: 1,
            letterSpacing: '0.05em', textTransform: 'uppercase',
            color: 'var(--ink-soft)', margin: '0 0 10px',
          }}>
            Schatkist leeg
          </h3>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--muted)', margin: 0, maxWidth: 280 }}>
            Kies je instellingen en klik op Genereer om magische items te smeden.
          </p>
        </div>
      )}

      {/* Parse error fallback */}
      {parseError && rawFallback && (
        <div
          className="pangu-surface"
          style={{ padding: 24, marginBottom: 24, borderColor: 'rgba(220,80,80,0.3)' }}
        >
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: 'var(--crimson)', margin: '0 0 12px',
          }}>
            Kon resultaat niet verwerken — ruwe AI-respons:
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--ink-soft)', whiteSpace: 'pre-wrap', margin: 0 }}>
            {rawFallback}
          </p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <>
          {/* Results header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <p style={{
                fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
                letterSpacing: '0.18em', textTransform: 'uppercase',
                color: 'var(--gold)', margin: 0,
              }}>
                ✦ {results.length} item{results.length > 1 ? 's' : ''} gegenereerd
              </p>
              {lastProvider && (
                <span style={{
                  fontFamily: 'var(--font-body)', fontSize: 9, fontWeight: 700,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: 'var(--subtle)',
                  padding: '3px 8px',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--hairline)',
                  borderRadius: 'var(--r-full)',
                }}>
                  {lastProvider}{lastModel ? ` · ${lastModel}` : ''}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {unadded.length >= 2 && (
                <button
                  type="button"
                  onClick={() => void addAll()}
                  disabled={pendingKeys.length > 0}
                  style={{
                    padding: '7px 16px',
                    background: 'rgba(212,170,87,0.12)',
                    border: '1px solid rgba(212,170,87,0.3)',
                    borderRadius: 'var(--r-full)',
                    color: 'var(--gold)',
                    fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
                    letterSpacing: '0.14em', textTransform: 'uppercase',
                    cursor: pendingKeys.length > 0 ? 'not-allowed' : 'pointer',
                    transition: 'all var(--t-fast)',
                    opacity: pendingKeys.length > 0 ? 0.5 : 1,
                  }}
                >
                  Voeg alles toe ({unadded.length})
                </button>
              )}
              <button
                type="button"
                onClick={() => void handleGenerate()}
                disabled={aiLoading}
                aria-label="Opnieuw genereren"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: 'none', border: 'none',
                  color: 'var(--muted)', cursor: aiLoading ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  padding: 0, opacity: aiLoading ? 0.5 : 1,
                  transition: 'color var(--t-fast)',
                }}
                onMouseEnter={e => { if (!aiLoading) e.currentTarget.style.color = 'var(--ink-soft)' }}
                onMouseLeave={e => { if (!aiLoading) e.currentTarget.style.color = 'var(--muted)' }}
              >
                <svg aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 4v6h-6M1 20v-6h6" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                Opnieuw
              </button>
            </div>
          </div>

          {/* Item cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} role="list" aria-label="Gegenereerde items">
            {results.map(item => {
              const isAdded = addedKeys.includes(item._key)
              const isPending = pendingKeys.includes(item._key)
              const isImagePending = imageLoadingKeys.includes(item._key)
              const rarityColor = itemRarityColor[item.rarity]
              return (
                <div
                  key={item._key}
                  role="listitem"
                  className="pangu-surface"
                  style={{
                    padding: '20px 24px',
                    display: 'flex', alignItems: 'flex-start', gap: 20,
                    opacity: isAdded ? 0.55 : 1,
                    transition: 'opacity var(--t-base)',
                    borderLeft: `3px solid ${rarityColor}`,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                      <h2 style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 'clamp(16px, 3vw, 20px)',
                        fontWeight: 600, lineHeight: 1,
                        letterSpacing: '0.04em', textTransform: 'uppercase',
                        color: 'var(--ink)', margin: 0,
                      }}>
                        {item.name}
                      </h2>
                      {item.is_magical && (
                        <span style={{ color: 'var(--gold)', fontSize: 14, lineHeight: 1 }} aria-label="Magisch item">✦</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
                      <span style={{
                        fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
                        letterSpacing: '0.14em', textTransform: 'uppercase',
                        color: rarityColor,
                        padding: '3px 8px',
                        background: `color-mix(in srgb, ${rarityColor} 12%, var(--surface-2))`,
                        border: `1px solid color-mix(in srgb, ${rarityColor} 25%, transparent)`,
                        borderRadius: 'var(--r-full)',
                      }}>
                        {itemRarityLabel[item.rarity]}
                      </span>
                      <span style={{
                        fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600,
                        letterSpacing: '0.1em', textTransform: 'uppercase',
                        color: 'var(--muted)',
                      }}>
                        {itemTypeLabel[item.item_type]}
                      </span>
                    </div>
                    {item.description && (
                      <p style={{
                        fontSize: 14, lineHeight: 1.65,
                        color: 'var(--ink-soft)',
                        margin: 0,
                        fontStyle: 'italic',
                      }}>
                        {item.description}
                      </p>
                    )}
                    {item.properties && Object.keys(item.properties).length > 0 && (() => {
                      const bonusLines = formatItemBonuses(item.properties)
                      if (bonusLines.length === 0) return null
                      return (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                          {bonusLines.map(bonus => (
                            <span
                              key={bonus}
                              style={{
                                fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
                                letterSpacing: '0.1em', textTransform: 'uppercase',
                                color: 'var(--teal)',
                                padding: '3px 8px',
                                background: 'rgba(62,207,178,0.08)',
                                border: '1px solid rgba(62,207,178,0.2)',
                                borderRadius: 'var(--r-full)',
                              }}
                            >
                              {bonus}
                            </span>
                          ))}
                        </div>
                      )
                    })()}

                    {/* Image section */}
                    {!isAdded && (() => {
                      const isImgLoading = imageLoadingKeys.includes(item._key)
                      return (
                        <div style={{ marginTop: 14 }}>
                          {item.image_url && (
                            <div style={{ marginBottom: 8, borderRadius: 8, overflow: 'hidden', maxWidth: 200, border: '1px solid var(--hairline)' }}>
                              <img
                                src={item.image_url}
                                alt={`Afbeelding van ${item.name}`}
                                style={{ width: '100%', height: 'auto', display: 'block' }}
                              />
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <input
                              type="url"
                              placeholder="Afbeeldings-URL plakken…"
                              value={item.image_url ?? ''}
                              onChange={e => setItemImageUrl(item._key, e.target.value)}
                              aria-label={`Afbeeldings-URL voor ${item.name}`}
                              style={{
                                flex: 1, minWidth: 140,
                                padding: '6px 10px',
                                background: 'var(--surface-2)',
                                border: '1px solid var(--hairline)',
                                borderRadius: 8,
                                color: 'var(--ink-soft)',
                                fontSize: 12,
                                fontFamily: 'var(--font-body)',
                                outline: 'none',
                              }}
                              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(212,170,87,0.45)')}
                              onBlur={e => (e.currentTarget.style.borderColor = 'var(--hairline)')}
                            />
                            {/* Generate button: DALL-E or Pollinations */}
                            <button
                              type="button"
                              onClick={() => void generateImage(item)}
                              disabled={isImgLoading}
                              title={hasOpenAIKey ? 'Genereer via DALL-E 3 (OpenAI BYOK)' : 'Genereer via Pollinations.ai'}
                              aria-label={`Genereer afbeelding voor ${item.name}`}
                              style={{
                                flexShrink: 0,
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                padding: '6px 12px',
                                background: 'var(--surface-2)',
                                border: '1px solid var(--hairline)',
                                borderRadius: 8,
                                color: 'var(--muted)',
                                fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
                                letterSpacing: '0.1em', textTransform: 'uppercase',
                                cursor: isImgLoading ? 'not-allowed' : 'pointer',
                                whiteSpace: 'nowrap',
                                transition: 'all var(--t-fast)',
                                opacity: isImgLoading ? 0.6 : 1,
                              }}
                              onMouseEnter={e => { if (!isImgLoading) { e.currentTarget.style.borderColor = 'rgba(212,170,87,0.4)'; e.currentTarget.style.color = 'var(--gold)' } }}
                              onMouseLeave={e => { if (!isImgLoading) { e.currentTarget.style.borderColor = 'var(--hairline)'; e.currentTarget.style.color = 'var(--muted)' } }}
                            >
                              {isImgLoading ? (
                                <><Spinner size="sm" /> Genereren…</>
                              ) : (
                                <>
                                  <svg aria-hidden="true" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                    <path d="M21 15l-5-5L5 21" />
                                  </svg>
                                  {hasOpenAIKey ? 'DALL-E' : 'Genereer'}
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )
                    })()}
                  </div>

                  <button
                    type="button"
                    onClick={() => void addItem(item)}
                    disabled={isAdded || isPending || isImagePending}
                    aria-label={isAdded ? `${item.name} is al toegevoegd` : isImagePending ? `Wacht op afbeelding voor ${item.name}` : `Voeg ${item.name} toe aan schatkist`}
                    style={{
                      flexShrink: 0,
                      padding: '8px 16px',
                      background: isAdded ? 'rgba(62,207,178,0.1)' : 'var(--surface-2)',
                      border: `1px solid ${isAdded ? 'rgba(62,207,178,0.3)' : 'var(--hairline)'}`,
                      borderRadius: 'var(--r-full)',
                      color: isAdded ? 'var(--teal)' : 'var(--ink-soft)',
                      fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
                      letterSpacing: '0.14em', textTransform: 'uppercase',
                      cursor: isAdded || isPending || isImagePending ? 'default' : 'pointer',
                      transition: 'all var(--t-fast)',
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      whiteSpace: 'nowrap',
                      minWidth: 100, justifyContent: 'center',
                    }}
                  >
                    {isPending ? (
                      <Spinner size="sm" />
                    ) : isAdded ? (
                      <>
                        <svg aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                        Toegevoegd
                      </>
                    ) : (
                      <>
                        <svg aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Voeg toe
                      </>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

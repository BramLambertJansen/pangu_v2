import { useState, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAI } from '@/hooks/useAI'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ItemCard, ForgeItemCard } from '@/components/item/ItemCard'
import { CompendiumBrowser } from '@/components/compendium/CompendiumBrowser'
import { useCampaignWithWorld } from '@/hooks/queries/useCampaign'
import { useCampaignItems, useForgeCampaignItem, useCreateCampaignItem } from '@/hooks/queries/useCampaignItems'
import { useCampaignCharacters } from '@/hooks/queries/useCampaignCharacters'
import { useImportMagicItem } from '@/hooks/queries/useSrdSearch'
import { useDraftGC } from '@/hooks/useDraftGC'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Tabs } from '@/components/ui/Tabs'
import type { ItemType, ItemRarity } from '@/types/item.types'
import type { Open5eMagicItem } from '@/types/open5e.types'

const ITEM_TYPES: ItemType[] = ['weapon', 'armor', 'potion', 'ring', 'rod', 'scroll', 'staff', 'wand', 'wondrous', 'misc']
const ITEM_RARITIES: ItemRarity[] = ['common', 'uncommon', 'rare', 'very_rare', 'legendary', 'artifact']

type FilterTab = 'all' | 'unassigned' | string  // string = character id

export default function CampaignItemsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [srdOpen, setSrdOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [aiContext, setAiContext] = useState('')
  const aiContextRef = useRef<HTMLTextAreaElement>(null)
  const { ask, loading: aiLoading } = useAI()

  const { data: campaign, isLoading: isLoadingCampaign } = useCampaignWithWorld(id)
  const { data: items, isLoading: isLoadingItems } = useCampaignItems(id)
  const { data: characters, isLoading: isLoadingCharacters } = useCampaignCharacters(id)
  const createItem = useForgeCampaignItem(id!)
  const createAIItem = useCreateCampaignItem(id!)
  const importItem = useImportMagicItem(id ?? '')
  const importedSlugs = useMemo(
    () => (items ?? []).map(it => it.source_slug).filter((s): s is string => s !== null),
    [items],
  )

  useDraftGC('items', 'campaign_id', id)

  async function handleAIGenerate() {
    if (!campaign) return
    const worldName = campaign.worlds?.name ?? 'onbekende wereld'
    const contextClause = aiContext.trim() ? `\nContext: ${aiContext.trim()}` : ''
    const prompt = `Generate exactly 1 item for the campaign "${campaign.name}" set in the world "${worldName}".${contextClause}
Make it atmospheric and specific to this world. Most items should have empty properties. Only rare+ items may carry a modest stat bonus (+1, max +2 for legendary).
Return ONLY a raw JSON array with one item — no markdown, no explanation:
[{"name":"Item Name","description":"1-2 evocative sentences.","item_type":"misc","rarity":"common","is_magical":false,"weight":null,"properties":{}}]`

    try {
      const reply = await ask([{ role: 'user', content: prompt }])
      let cleaned = reply.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '')
      const arrayMatch = cleaned.match(/\[[\s\S]*\]/)
      if (arrayMatch) cleaned = arrayMatch[0]
      const parsed = JSON.parse(cleaned) as Record<string, unknown>[]
      const obj = Array.isArray(parsed) ? parsed[0] : null
      if (!obj) throw new Error('Geen item in respons')

      const itemType = ITEM_TYPES.includes(obj['item_type'] as ItemType) ? (obj['item_type'] as ItemType) : 'misc'
      const rarity = ITEM_RARITIES.includes(obj['rarity'] as ItemRarity) ? (obj['rarity'] as ItemRarity) : 'common'

      const newItem = await createAIItem.mutateAsync({
        name: String(obj['name'] ?? 'Gegenereerd item'),
        description: obj['description'] ? String(obj['description']) : null,
        item_type: itemType,
        rarity,
        is_magical: Boolean(obj['is_magical']),
        weight: obj['weight'] != null ? Number(obj['weight']) : null,
        properties: (obj['properties'] && typeof obj['properties'] === 'object' ? obj['properties'] : {}) as Record<string, unknown>,
      })

      setAiOpen(false)
      setAiContext('')
      navigate(`/items/${newItem.id}/edit`, { state: { isNew: true, campaignId: id } })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Genereren mislukt')
    }
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
        <Button variant="ghost" onClick={() => navigate('/dashboard')} style={{ marginTop: 16 }}>
          ← Terug naar dashboard
        </Button>
      </div>
    )
  }

  const filteredItems = (() => {
    if (!items) return []
    if (activeTab === 'all') return items
    if (activeTab === 'unassigned') return items.filter(i => !i.character_id)
    return items.filter(i => i.character_id === activeTab)
  })()

  const unassignedCount = items?.filter(i => !i.character_id).length ?? 0

  return (
    <div>
      <Breadcrumb items={[
        { label: campaign.worlds?.name ?? 'Wereld', onClick: () => navigate(`/worlds/${campaign.world_id}`) },
        { label: campaign.name, onClick: () => navigate(`/campaigns/${id}`) },
        { label: 'Items' },
      ]} />

      {/* Page header */}
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p className="pangu-eyebrow">Kroniek schatkist</p>
          <h1 className="pangu-display-xl">{campaign.name} — Items</h1>
          <p style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-soft)' }}>
            Beheer alle magische items in deze kroniek. Maak items aan en wijs ze toe aan karakters.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => { setAiOpen(true); setTimeout(() => aiContextRef.current?.focus(), 50) }}
            style={{
              flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 16px',
              background: 'rgb(var(--gold-rgb) / 0.1)',
              border: '1px solid rgb(var(--gold-rgb) / 0.3)',
              borderRadius: 'var(--r-full)',
              color: 'var(--gold)',
              fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              cursor: 'pointer', transition: 'all var(--t-fast)', whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgb(var(--gold-rgb) / 0.18)'; e.currentTarget.style.borderColor = 'rgb(var(--gold-rgb) / 0.5)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgb(var(--gold-rgb) / 0.1)'; e.currentTarget.style.borderColor = 'rgb(var(--gold-rgb) / 0.3)' }}
            aria-label="Genereer een item met AI"
          >
            <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
            </svg>
            Genereer item
          </button>
          <button
            type="button"
            onClick={() => setSrdOpen(true)}
            style={{
              flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 16px',
              background: 'rgb(var(--azure-rgb) / 0.08)',
              border: '1px solid rgb(var(--azure-rgb) / 0.3)',
              borderRadius: 'var(--r-full)',
              color: 'var(--azure)',
              fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              cursor: 'pointer', transition: 'all var(--t-fast)', whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgb(var(--azure-rgb) / 0.15)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgb(var(--azure-rgb) / 0.08)' }}
            aria-label="Magische items importeren uit de SRD via Open5e"
          >
            <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Importeer uit SRD
          </button>
          <button
            type="button"
            onClick={() => navigate(`/campaigns/${id}/loot-generator`)}
            style={{
              flexShrink: 0,
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 16px',
              background: 'rgb(var(--gold-rgb) / 0.1)',
              border: '1px solid rgb(var(--gold-rgb) / 0.3)',
              borderRadius: 'var(--r-full)',
              color: 'var(--gold)',
              fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all var(--t-fast)',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgb(var(--gold-rgb) / 0.18)'
              e.currentTarget.style.borderColor = 'rgb(var(--gold-rgb) / 0.5)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgb(var(--gold-rgb) / 0.1)'
              e.currentTarget.style.borderColor = 'rgb(var(--gold-rgb) / 0.3)'
            }}
            aria-label="Open AI Buitgenerator"
          >
            <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
            </svg>
            AI Buitgenerator
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      {!isLoadingItems && !isLoadingCharacters && (
        <div style={{ marginBottom: 24 }}>
          <Tabs
            label="Items filteren"
            value={activeTab}
            onValueChange={(id) => setActiveTab(id as FilterTab)}
            items={[
              { id: 'all', label: `Alles (${items?.length ?? 0})` },
              { id: 'unassigned', label: `Schatkist (${unassignedCount})` },
              ...(characters ?? []).map(char => ({
                id: char.id,
                label: `${char.name}${items ? ` (${items.filter(i => i.character_id === char.id).length})` : ''}`,
              })),
            ]}
          />
        </div>
      )}

      {/* Items grid */}
      {isLoadingItems ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }} aria-live="polite" aria-busy="true">
          <Spinner size="md" />
        </div>
      ) : (
        <ul
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 'var(--sp-5)',
            listStyle: 'none',
            padding: 0,
            margin: 0,
          }}
          role="list"
          aria-label="Items in deze kroniek"
        >
          {filteredItems.map((item) => (
            <li key={item.id}>
              <ItemCard item={item} />
            </li>
          ))}
          {/* Only show ForgeCard on "all" and "unassigned" tabs */}
          {(activeTab === 'all' || activeTab === 'unassigned') && (
            <li>
              <ForgeItemCard onClick={() => createItem.mutate()} loading={createItem.isPending} />
            </li>
          )}
        </ul>
      )}

      {filteredItems.length === 0 && !isLoadingItems && activeTab !== 'all' && activeTab !== 'unassigned' && (
        <p style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic', textAlign: 'center', padding: '32px 0' }}>
          Geen items toegewezen aan dit karakter.
        </p>
      )}

      {/* AI generate single item modal */}
      <Modal
        open={aiOpen}
        onClose={() => { if (!aiLoading) { setAiOpen(false); setAiContext('') } }}
        title="Genereer een item met AI"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: 0, lineHeight: 1.6 }}>
            Beschrijf het item dat je wilt genereren, of laat het veld leeg voor een willekeurig item passend bij de kroniek.
          </p>
          <div>
            <label
              htmlFor="ai-item-context"
              style={{
                display: 'block', fontSize: 10, fontWeight: 700,
                letterSpacing: '0.18em', textTransform: 'uppercase',
                color: 'var(--muted)', marginBottom: 8,
                fontFamily: 'var(--font-body)',
              }}
            >
              Context (optioneel)
            </label>
            <textarea
              id="ai-item-context"
              ref={aiContextRef}
              value={aiContext}
              onChange={e => setAiContext(e.target.value)}
              disabled={aiLoading}
              placeholder="Bijv. een vervloekt zwaard gevonden in een verlaten tempel, of een drankje van een reizende heks..."
              rows={3}
              onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') void handleAIGenerate() }}
              style={{
                width: '100%', padding: '10px 12px',
                background: 'var(--surface-2)',
                border: '1px solid var(--hairline)',
                borderRadius: 10,
                color: 'var(--ink)', fontSize: 14, lineHeight: 1.5,
                fontFamily: 'var(--font-body)',
                resize: 'vertical', outline: 'none',
                opacity: aiLoading ? 0.6 : 1,
                boxSizing: 'border-box',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgb(var(--gold-rgb) / 0.45)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--hairline)')}
              aria-describedby="ai-item-hint"
            />
            <p id="ai-item-hint" style={{ fontSize: 11, color: 'var(--subtle)', margin: '6px 0 0', textAlign: 'right' }}>
              Ctrl+Enter om te genereren
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => { setAiOpen(false); setAiContext('') }}
              disabled={aiLoading}
              style={{
                padding: '8px 18px',
                background: 'none', border: '1px solid var(--hairline)',
                borderRadius: 'var(--r-full)', color: 'var(--muted)',
                fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                cursor: aiLoading ? 'not-allowed' : 'pointer',
                opacity: aiLoading ? 0.5 : 1,
              }}
            >
              Annuleren
            </button>
            <button
              type="button"
              onClick={() => void handleAIGenerate()}
              disabled={aiLoading}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '8px 20px',
                background: aiLoading ? 'rgb(var(--gold-rgb) / 0.1)' : 'linear-gradient(135deg, rgb(var(--gold-rgb) / 0.22), rgb(var(--gold-rgb) / 0.1))',
                border: '1px solid rgb(var(--gold-rgb) / 0.35)',
                borderRadius: 'var(--r-full)', color: 'var(--gold)',
                fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                cursor: aiLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {aiLoading ? <><Spinner size="sm" /> Genereren...</> : <>
                <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
                </svg>
                Genereer &amp; open
              </>}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={srdOpen} onClose={() => setSrdOpen(false)} title="Magische items importeren uit de SRD" className="max-w-xl">
        <CompendiumBrowser
          kind="item"
          onImport={(data, edition) => importItem.mutate({ magicItem: data as Open5eMagicItem, edition })}
          importedSlugs={importedSlugs}
          isPending={importItem.isPending}
        />
      </Modal>
    </div>
  )
}

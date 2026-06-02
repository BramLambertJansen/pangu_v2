import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { useAuthStore } from '@/stores/auth.store'
import { Spinner } from '@/components/ui/Spinner'
import { Modal } from '@/components/ui/Modal'
import { ItemCard, ForgeItemCard } from '@/components/item/ItemCard'
import { CompendiumBrowser } from '@/components/compendium/CompendiumBrowser'
import { useCampaignWithWorld } from '@/hooks/queries/useCampaign'
import { useCampaignItems } from '@/hooks/queries/useCampaignItems'
import { useCampaignCharacters } from '@/hooks/queries/useCampaignCharacters'
import { useImportMagicItem } from '@/hooks/queries/useSrdSearch'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import type { Item } from '@/types/item.types'
import type { Open5eMagicItem } from '@/types/open5e.types'

type FilterTab = 'all' | 'unassigned' | string  // string = character id

export default function CampaignItemsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore(s => s.user)

  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [srdOpen, setSrdOpen] = useState(false)

  const { data: campaign, isLoading: isLoadingCampaign } = useCampaignWithWorld(id)
  const { data: items, isLoading: isLoadingItems } = useCampaignItems(id)
  const { data: characters, isLoading: isLoadingCharacters } = useCampaignCharacters(id)
  const importItem = useImportMagicItem(id ?? '')
  const importedSlugs = useMemo(
    () => (items ?? []).map(it => it.source_slug).filter((s): s is string => s !== null),
    [items],
  )

  // Garbage-collect uncommitted drafts older than 30 minutes
  useEffect(() => {
    if (!id) return
    const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    void (async () => {
      try {
      const { data } = await supabase
        .from('items')
        .select('id')
        .eq('campaign_id', id)
        .eq('committed', false)
        .lt('created_at', cutoff)
      if (data?.length) {
        await supabase.from('items').delete().in('id', data.map((r) => r.id))
      }
      } catch (err) {
        console.warn("[GC] draft cleanup failed:", err)
      }
    })()
  }, [id])

  const createItem = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Niet ingelogd')
      const { data, error } = await supabase
        .from('items')
        .insert({ campaign_id: id!, name: 'Nieuw item', item_type: 'misc', rarity: 'common', is_magical: false, quantity: 1 })
        .select()
        .single()
      if (error) throw error
      return data as Item
    },
    onSuccess: (newItem) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items.byCampaign(id!) })
      navigate(`/items/${newItem.id}/edit`, { state: { isNew: true, campaignId: id } })
    },
    onError: () => {
      toast.error('Item aanmaken mislukt')
    },
  })

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
        <button type="button" className="pangu-btn pangu-btn-ghost" onClick={() => navigate('/dashboard')} style={{ marginTop: 16 }}>
          ← Terug naar dashboard
        </button>
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
            onClick={() => setSrdOpen(true)}
            style={{
              flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 16px',
              background: 'rgba(56,152,255,0.08)',
              border: '1px solid rgba(56,152,255,0.3)',
              borderRadius: 'var(--r-full)',
              color: 'var(--azure)',
              fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              cursor: 'pointer', transition: 'all var(--t-fast)', whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(56,152,255,0.15)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(56,152,255,0.08)' }}
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
              background: 'rgba(212,170,87,0.1)',
              border: '1px solid rgba(212,170,87,0.3)',
              borderRadius: 'var(--r-full)',
              color: 'var(--gold)',
              fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all var(--t-fast)',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(212,170,87,0.18)'
              e.currentTarget.style.borderColor = 'rgba(212,170,87,0.5)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(212,170,87,0.1)'
              e.currentTarget.style.borderColor = 'rgba(212,170,87,0.3)'
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
        <div
          role="tablist"
          aria-label="Items filteren"
          className="pangu-tab-bar--line"
          style={{ marginBottom: 24 }}
        >
          {(
            [
              { key: 'all', label: `Alles (${items?.length ?? 0})` },
              { key: 'unassigned', label: `Schatkist (${unassignedCount})` },
              ...(characters ?? []).map(char => ({
                key: char.id,
                label: `${char.name}${items ? ` (${items.filter(i => i.character_id === char.id).length})` : ''}`,
              })),
            ] as { key: FilterTab; label: string }[]
          ).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={activeTab === key}
              onClick={() => setActiveTab(key)}
              className="pangu-tab--line"
            >
              {label}
            </button>
          ))}
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

      <Modal open={srdOpen} onClose={() => setSrdOpen(false)} title="Magische items importeren uit de SRD" className="max-w-xl">
        <CompendiumBrowser
          kind="item"
          onImport={data => importItem.mutate(data as Open5eMagicItem)}
          importedSlugs={importedSlugs}
          isPending={importItem.isPending}
        />
      </Modal>
    </div>
  )
}

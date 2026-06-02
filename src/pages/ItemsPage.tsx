import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { CompendiumBrowser } from '@/components/compendium/CompendiumBrowser'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { useImportMagicItem } from '@/hooks/queries/useSrdSearch'
import { useAuthStore } from '@/stores/auth.store'
import type { Open5eMagicItem } from '@/types/open5e.types'
import type { CampaignWithWorld } from '@/hooks/queries/useCampaign'
import { itemRarityLabel, itemRarityColor, itemTypeLabel } from '@/lib/statusMaps'
import type { Item } from '@/types/item.types'

export default function ItemsPage() {
  const user = useAuthStore(s => s.user)
  const [srdOpen, setSrdOpen] = useState(false)
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
  const [detailItem, setDetailItem] = useState<Item | null>(null)

  // All user campaigns (across all worlds)
  const { data: campaigns, isLoading: campaignsLoading } = useQuery<CampaignWithWorld[]>({
    queryKey: [...queryKeys.campaigns.all, 'my-with-world'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*, worlds(name)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as CampaignWithWorld[]
    },
    enabled: !!user,
    staleTime: 1000 * 60,
  })

  const activeCampaignId = selectedCampaignId ?? campaigns?.[0]?.id ?? null

  // Items for the selected campaign
  const { data: items, isLoading: itemsLoading } = useQuery<Item[]>({
    queryKey: queryKeys.items.byCampaign(activeCampaignId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('campaign_id', activeCampaignId!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Item[]
    },
    enabled: !!activeCampaignId,
    staleTime: 1000 * 30,
  })

  const importMutation = useImportMagicItem(activeCampaignId ?? '')

  const importedSlugs = useMemo(
    () => (items ?? []).map(i => i.source_slug).filter((s): s is string => s !== null),
    [items],
  )

  const isLoading = campaignsLoading || itemsLoading

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p className="pangu-eyebrow">SRD Compendium</p>
          <h1 className="pangu-display-xl">Items</h1>
          <p style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-soft)' }}>
            Importeer magische items uit de SRD naar een kroniek.
          </p>
        </div>
        <button
          type="button"
          className="pangu-btn pangu-btn-secondary"
          disabled={!activeCampaignId}
          onClick={() => setSrdOpen(true)}
          style={{ flexShrink: 0 }}
        >
          + Importeer uit SRD
        </button>
      </div>

      {/* Campaign selector */}
      {campaigns && campaigns.length > 1 && (
        <div style={{ marginBottom: 24 }}>
          <label htmlFor="campaign-select" style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>
            Kroniek
          </label>
          <select
            id="campaign-select"
            value={activeCampaignId ?? ''}
            onChange={e => setSelectedCampaignId(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--hairline)', background: 'var(--surface-2)', color: 'var(--ink)', fontSize: 14, minWidth: 240 }}
          >
            {campaigns.map(c => (
              <option key={c.id} value={c.id}>
                {c.worlds?.name ? `${c.worlds.name} — ` : ''}{c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* No campaigns */}
      {!campaignsLoading && (!campaigns || campaigns.length === 0) && (
        <EmptyState
          icon={
            <svg aria-hidden="true" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          }
          title="Geen kronieken gevonden"
          description="Maak eerst een kroniek aan om items aan toe te wijzen."
        />
      )}

      {/* Items grid */}
      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }} aria-live="polite">
          <Spinner size="lg" />
        </div>
      )}

      {!isLoading && activeCampaignId && (
        <>
          {(!items || items.length === 0) ? (
            <EmptyState
              icon={
                <svg aria-hidden="true" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
              }
              title="Nog geen items"
              description="Importeer magische items uit de SRD om te beginnen."
              action={<button type="button" className="pangu-btn pangu-btn-primary" onClick={() => setSrdOpen(true)}>Importeer uit SRD</button>}
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
              {items.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDetailItem(item)}
                  style={{
                    textAlign: 'left',
                    cursor: 'pointer',
                    padding: '14px 16px',
                    borderRadius: 12,
                    border: '1px solid var(--hairline)',
                    background: 'var(--surface)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                  aria-label={`Item: ${item.name}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <p style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.name}
                    </p>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: itemRarityColor[item.rarity], border: `1px solid ${itemRarityColor[item.rarity]}40`, borderRadius: 4, padding: '2px 6px', flexShrink: 0 }}>
                      {itemRarityLabel[item.rarity]}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>{itemTypeLabel[item.item_type]}</span>
                    {item.is_magical && <span style={{ fontSize: 11, color: 'var(--violet)' }}>Magisch</span>}
                    {item.requires_attunement && <span style={{ fontSize: 11, color: 'var(--gold)' }}>Afstemming vereist</span>}
                    {item.source?.startsWith('srd') && <span style={{ fontSize: 11, color: 'var(--azure)' }}>SRD</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* SRD import modal */}
      <Modal open={srdOpen} onClose={() => setSrdOpen(false)} title="Magische items importeren uit de SRD" className="max-w-xl">
        <CompendiumBrowser
          kind="item"
          onImport={(data, edition) => importMutation.mutate({ magicItem: data as Open5eMagicItem, edition })}
          importedSlugs={importedSlugs}
          isPending={importMutation.isPending}
        />
      </Modal>

      {/* Item detail modal */}
      <Modal open={!!detailItem} onClose={() => setDetailItem(null)} title={detailItem?.name ?? ''}>
        {detailItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Meta row */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: itemRarityColor[detailItem.rarity] }}>
                {itemRarityLabel[detailItem.rarity]}
              </span>
              <span style={{ color: 'var(--hairline)' }}>·</span>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>{itemTypeLabel[detailItem.item_type]}</span>
              {detailItem.is_magical && <><span style={{ color: 'var(--hairline)' }}>·</span><span style={{ fontSize: 11, color: 'var(--violet)' }}>Magisch</span></>}
              {detailItem.requires_attunement && <><span style={{ color: 'var(--hairline)' }}>·</span><span style={{ fontSize: 11, color: 'var(--gold)' }}>Afstemming vereist</span></>}
              {detailItem.weight != null && <><span style={{ color: 'var(--hairline)' }}>·</span><span style={{ fontSize: 11, color: 'var(--muted)' }}>{detailItem.weight} lbs</span></>}
            </div>

            {/* Description */}
            {detailItem.description && (
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: 'var(--ink-soft)', whiteSpace: 'pre-wrap' }}>
                {detailItem.description}
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

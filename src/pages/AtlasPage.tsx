import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { CSSProperties } from 'react'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { OrnateDivider } from '@/components/ui/OrnateDivider'
import { EmptyState } from '@/components/ui/EmptyState'
import { LocationCard, ForgeLocationCard } from '@/components/location/LocationCard'
import { ConstellationAtlas } from '@/components/location/ConstellationAtlas'
import { useCampaignWithWorld } from '@/hooks/queries/useCampaign'
import { useCampaignLocations, useCreateCampaignLocation } from '@/hooks/queries/useCampaignLocations'
import { locationStatusColor } from '@/lib/statusMaps'
import type { Location } from '@/types/location.types'

export default function AtlasPage() {
  const { id: campaignId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data: campaign, isLoading: campaignLoading } = useCampaignWithWorld(campaignId)
  const { data: locations, isLoading: locationsLoading } = useCampaignLocations(campaignId)
  const createLocation = useCreateCampaignLocation(campaignId!)

  const markers = (locations ?? [])
    .filter((l): l is Location & { map_x: number; map_y: number } => l.map_x != null && l.map_y != null)
    .map((l) => ({ id: l.id, name: l.name, x: l.map_x, y: l.map_y, location_type: l.location_type }))

  const selected = selectedId ? (locations ?? []).find((l) => l.id === selectedId) ?? null : null

  if (campaignLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }} aria-live="polite" aria-label="Atlas laden...">
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
    <div>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 24 }}>
        <Breadcrumbs compact items={[
          { label: 'Wereld', to: `/worlds/${campaign.world_id}` },
          { label: campaign.name, to: `/campaigns/${campaignId}` },
          { label: 'Atlas' },
        ]} />
      </div>

      {/* Page header */}
      <header style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p className="pg-eyebrow">Kroniek — {campaign.name}</p>
          <h1 className="pg-display-xl">Atlas</h1>
          <p style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-soft)' }}>
            {markers.length > 0
              ? `${markers.length} van de ${(locations ?? []).length} locatie${(locations ?? []).length !== 1 ? 's' : ''} op de kaart geplaatst.`
              : 'Plaats locaties op de kaart via Locatie bewerken.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {!campaign.map_image_url && (
            <Button variant="secondary" size="sm" onClick={() => navigate(`/campaigns/${campaignId}/edit`)}>
              Kaartafbeelding uploaden
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={() => createLocation.mutate()} loading={createLocation.isPending}>
            + Locatie toevoegen
          </Button>
        </div>
      </header>

      {/* Main split: map + aside */}
      <div className="atlas-layout">
        {/* Map */}
        <ConstellationAtlas
          campaignId={campaignId!}
          mapImageUrl={campaign.map_image_url}
          markers={markers}
          selectedId={selectedId ?? undefined}
          onSelect={(id) => setSelectedId((prev) => (prev === id ? null : id))}
          height={560}
        />

        {/* Aside panel */}
        <div className="atlas-aside">
          <div className="atlas-aside-scroll">
            {selected ? (
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="atlas-aside-back"
                  onClick={() => setSelectedId(null)}
                >
                  ← Alle locaties
                </Button>

                {(selected.location_type || selected.region) && (
                  <div className="atlas-aside-meta">
                    {selected.location_type && <Chip tone="violet">{selected.location_type}</Chip>}
                    {selected.region && <Chip>{selected.region}</Chip>}
                  </div>
                )}

                <h2 className="atlas-aside-title">{selected.name}</h2>

                {selected.subtitle && <p className="atlas-aside-sub">{selected.subtitle}</p>}

                {selected.description && (
                  <p className="atlas-aside-desc">
                    {selected.description.length > 200
                      ? selected.description.slice(0, 200) + '…'
                      : selected.description}
                  </p>
                )}

                {selected.climate && (
                  <div className="atlas-stat-grid">
                    <div className="atlas-stat">
                      <div className="atlas-stat-label">Klimaat</div>
                      <div className="atlas-stat-val">{selected.climate}</div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <p className="pg-eyebrow" style={{ marginBottom: 8 }}>
                  {(locations ?? []).length} locatie{(locations ?? []).length !== 1 ? 's' : ''}
                </p>
                <p className="atlas-aside-hint">
                  {markers.length > 0 ? 'Klik op een pin of kies hieronder.' : 'Nog geen pins op de kaart — bewerk een locatie om te plaatsen.'}
                </p>

                {locationsLoading ? (
                  <div className="atlas-aside-loading">
                    <Spinner size="sm" />
                  </div>
                ) : (locations ?? []).length === 0 ? (
                  <p className="atlas-aside-empty">Nog geen locaties.</p>
                ) : (
                  <div className="atlas-aside-list">
                    {(locations ?? []).map((loc) => (
                      <button
                        key={loc.id}
                        className="atlas-loc-row"
                        data-selected={loc.id === selectedId ? 'true' : undefined}
                        onClick={() => setSelectedId((prev) => (prev === loc.id ? null : loc.id))}
                      >
                        <span
                          className="atlas-loc-row-dot"
                          style={{ '--dot': loc.map_x != null ? locationStatusColor[loc.status] ?? 'var(--violet)' : 'var(--hairline-strong)' } as CSSProperties}
                          aria-hidden="true"
                        />
                        <span className="atlas-loc-row-name">{loc.name}</span>
                        {loc.location_type && (
                          <span className="atlas-loc-row-type">{loc.location_type}</span>
                        )}
                        {loc.map_x == null && (
                          <span className="atlas-loc-row-flag" title="Niet op kaart">–</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {selected && (
            <div className="atlas-aside-foot">
              <Button
                variant="primary"
                onClick={() => navigate(`/locations/${selected.id}`)}
              >
                Open locatiepagina →
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* All locations grid */}
      <div style={{ marginTop: 40 }}>
        <OrnateDivider label={`Alle locaties · ${(locations ?? []).length}`} />
      </div>

      <div style={{ marginTop: 20 }}>
        {(locations ?? []).length === 0 && !locationsLoading ? (
          <EmptyState
            title="Nog geen locaties"
            description="Breng de eerste plek in kaart. Elk verhaal speelt zich ergens af."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(locations ?? []).map((location) => (
              <LocationCard key={location.id} location={location} />
            ))}
            <ForgeLocationCard onClick={() => createLocation.mutate()} loading={createLocation.isPending} />
          </div>
        )}
      </div>
    </div>
  )
}

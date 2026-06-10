import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
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
          <p className="pangu-eyebrow">Kroniek — {campaign.name}</p>
          <h1 className="pangu-display-xl">Atlas</h1>
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
                <button
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 12px', fontFamily: 'var(--font-body)' }}
                  onClick={() => setSelectedId(null)}
                >
                  ← Alle locaties
                </button>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                  {selected.location_type && (
                    <span className="badge badge-violet" style={{ fontSize: 11 }}>{selected.location_type}</span>
                  )}
                  {selected.region && (
                    <span style={{ fontSize: 12, color: 'var(--muted)', alignSelf: 'center' }}>{selected.region}</span>
                  )}
                </div>

                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, textTransform: 'uppercase', lineHeight: 1.1, margin: '0 0 8px' }}>
                  {selected.name}
                </h2>

                {selected.subtitle && (
                  <p style={{ fontSize: 13, color: 'var(--gold)', fontStyle: 'italic', marginBottom: 8 }}>{selected.subtitle}</p>
                )}

                {selected.description && (
                  <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.6, marginBottom: 12 }}>
                    {selected.description.length > 200
                      ? selected.description.slice(0, 200) + '…'
                      : selected.description}
                  </p>
                )}

                {(selected.climate) && (
                  <div className="atlas-stat-grid">
                    {selected.climate && (
                      <div className="atlas-stat">
                        <div className="atlas-stat-label">Klimaat</div>
                        <div className="atlas-stat-val">{selected.climate}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <p className="pangu-eyebrow" style={{ marginBottom: 8 }}>
                  {(locations ?? []).length} locatie{(locations ?? []).length !== 1 ? 's' : ''}
                </p>
                <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>
                  {markers.length > 0 ? 'Klik op een pin of kies hieronder.' : 'Nog geen pins op de kaart — bewerk een locatie om te plaatsen.'}
                </p>

                {locationsLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                    <Spinner size="sm" />
                  </div>
                ) : (locations ?? []).length === 0 ? (
                  <p style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>Nog geen locaties.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {(locations ?? []).map((loc) => (
                      <button
                        key={loc.id}
                        className="atlas-loc-row"
                        data-selected={loc.id === selectedId ? 'true' : undefined}
                        onClick={() => setSelectedId((prev) => (prev === loc.id ? null : loc.id))}
                      >
                        <span
                          className="atlas-loc-row-dot"
                          style={{ background: loc.map_x != null ? locationStatusColor[loc.status] ?? 'var(--violet)' : 'var(--hairline-strong)' }}
                          aria-hidden="true"
                        />
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{loc.name}</span>
                        {loc.location_type && (
                          <span style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            {loc.location_type}
                          </span>
                        )}
                        {loc.map_x == null && (
                          <span title="Niet op kaart" style={{ fontSize: 10, color: 'var(--muted)' }}>–</span>
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
                style={{ width: '100%', justifyContent: 'center' }}
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

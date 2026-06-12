import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Breadcrumb } from '@/components/ui/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Tabs } from '@/components/ui/Tabs'
import { PartyTab } from '@/components/campaign/PartyTab'
import { SessionsTab } from '@/components/campaign/SessionsTab'
import { LocationsTab } from '@/components/campaign/LocationsTab'
import { LoreTab } from '@/components/campaign/LoreTab'
import { NpcsTab } from '@/components/campaign/NpcsTab'
import { FactionsTab } from '@/components/campaign/FactionsTab'
import { QuestsTab } from '@/components/campaign/QuestsTab'
import { EncountersTab } from '@/components/campaign/EncountersTab'
import { TreasuryTab } from '@/components/campaign/TreasuryTab'
import { NotesTab } from '@/components/campaign/NotesTab'
import { InvitePanel } from '@/components/campaign/InvitePanel'
import { ReisgezelschapBanner } from '@/components/campaign/ReisgezelschapBanner'
import { useCampaignWithWorld } from '@/hooks/queries/useCampaign'
import { useCampaignSessions, useCreateCampaignSession } from '@/hooks/queries/useCampaignSessions'
import { useCampaignLocations, useCreateCampaignLocation } from '@/hooks/queries/useCampaignLocations'
import { useCampaignNpcs, useCreateCampaignNpc } from '@/hooks/queries/useCampaignNpcs'
import { useCampaignLore, useCreateCampaignLore } from '@/hooks/queries/useCampaignLore'
import { useCampaignQuests, useCreateCampaignQuest } from '@/hooks/queries/useCampaignQuests'
import { useCampaignEncounters, useCreateCampaignEncounter } from '@/hooks/queries/useCampaignEncounters'
import { useCampaignCharacters } from '@/hooks/queries/useCampaignCharacters'
import { useCampaignItems, useForgeCampaignItem } from '@/hooks/queries/useCampaignItems'
import { useCampaignFactions, useCreateCampaignFaction } from '@/hooks/queries/useCampaignFactions'
import { sanitizeImageUrl } from '@/utils/sanitizeUrl'
import { pickGradient, coverGradients } from '@/utils/pickGradient'
import { campaignStatusLabel, campaignStatusColor } from '@/lib/statusMaps'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useAuthStore } from '@/stores/auth.store'

type TabId = 'party' | 'sessions' | 'locations' | 'lore' | 'npcs' | 'factions' | 'quests' | 'encounters' | 'treasury' | 'notes' | 'invite'

const ALL_TABS: { id: TabId; label: string; dmOnly?: boolean }[] = [
  { id: 'party',     label: 'Het Gezelschap' },
  { id: 'sessions',  label: 'Sessies' },
  { id: 'locations', label: 'Locaties' },
  { id: 'lore',      label: 'Lore' },
  { id: 'npcs',      label: "NPC's" },
  { id: 'factions',  label: 'Facties' },
  { id: 'quests',    label: 'Quests' },
  { id: 'encounters',label: 'Gevechten' },
  { id: 'treasury',  label: 'Schatkist' },
  { id: 'notes',     label: 'DM-notities', dmOnly: true },
  { id: 'invite',    label: 'Uitnodigingen', dmOnly: true },
]

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabId>('sessions')
  const user = useAuthStore(s => s.user)

  const { data: campaign, isLoading } = useCampaignWithWorld(id)
  const { data: sessions,    isLoading: isLoadingSessions }    = useCampaignSessions(id)
  const { data: characters,  isLoading: isLoadingCharacters }  = useCampaignCharacters(id)
  const { data: allItems,    isLoading: isLoadingItems }        = useCampaignItems(id)
  const { data: locations,   isLoading: isLoadingLocations }   = useCampaignLocations(id)
  const { data: loreItems,   isLoading: isLoadingLore }         = useCampaignLore(id)
  const { data: npcs,        isLoading: isLoadingNpcs }         = useCampaignNpcs(id)
  const { data: quests,      isLoading: isLoadingQuests }       = useCampaignQuests(id)
  const { data: encounters,  isLoading: isLoadingEncounters }   = useCampaignEncounters(id)
  const { data: factions,    isLoading: isLoadingFactions }     = useCampaignFactions(id)

  const createSession   = useCreateCampaignSession(id!)
  const createLocation  = useCreateCampaignLocation(id!)
  const createLore      = useCreateCampaignLore(id!)
  const createNpc       = useCreateCampaignNpc(id!)
  const createQuest     = useCreateCampaignQuest(id!)
  const createEncounter = useCreateCampaignEncounter(id!)
  const createFaction   = useCreateCampaignFaction(id!)
  const createItem      = useForgeCampaignItem(id!)

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }} aria-live="polite" aria-label="Kroniek laden…">
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

  const isDM = campaign.user_id === user?.id
  const tabs = ALL_TABS.filter(t => !t.dmOnly || isDM)

  const gradient = campaign.header_image ? undefined : pickGradient(campaign.id, coverGradients)

  /* Dynamic font size based on title length (matches prototype) */
  const titleLen = campaign.name.length
  const titleSize =
    titleLen <= 12 ? 'clamp(56px, 8vw, 100px)' :
    titleLen <= 22 ? 'clamp(44px, 6.5vw, 84px)' :
    titleLen <= 32 ? 'clamp(32px, 4.8vw, 62px)' :
                     'clamp(24px, 3.4vw, 44px)'

  return (
    <div>
      <Breadcrumb
        items={[
          { label: campaign.worlds?.name ?? 'Wereld', onClick: () => navigate(`/worlds/${campaign.world_id}`) },
          { label: campaign.name },
        ]}
      />

      {/* ── Hero ── */}
      <section
        className="world-hero-v2"
        style={{
          '--accent': 'var(--violet)',
          marginTop: 16,
          backgroundImage: campaign.header_image
            ? undefined
            : `${gradient}, var(--void)`,
          backgroundSize: 'cover',
        } as React.CSSProperties}
        aria-label={`${campaign.name} — kroniek-header`}
      >
        {/* Background image */}
        {campaign.header_image && sanitizeImageUrl(campaign.header_image) && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${sanitizeImageUrl(campaign.header_image)})`,
              backgroundSize: 'cover',
              backgroundPosition: campaign.header_image_position ?? 'center',
            }}
          />
        )}

        <div className="world-hero-v2-gradient" aria-hidden="true" />
        <div className="world-hero-v2-accent-bar" aria-hidden="true" />

        {/* Status badge top-right */}
        <div className="world-hero-v2-badge">
          <StatusBadge
            label={campaignStatusLabel[campaign.status]}
            color={campaignStatusColor[campaign.status]}
          />
        </div>

        <div className="world-hero-v2-content">
          {/* Eyebrow: world name */}
          <p className="world-hero-v2-era">
            {campaign.worlds?.name ?? ''}
          </p>

          {/* Title */}
          <h1
            className="world-hero-v2-name"
            style={{ fontSize: titleSize }}
          >
            {campaign.name.toUpperCase()}
          </h1>

          {/* Motto / subtitle */}
          {campaign.subtitle && (
            <p className="world-hero-v2-quote">"{campaign.subtitle}"</p>
          )}

          <div className="world-hero-v2-bottom">
            {campaign.description && (
              <p className="world-hero-v2-desc">{campaign.description}</p>
            )}
            <div className="world-hero-v2-actions">
              <Button
                variant="primary"
                onClick={() => navigate(`/campaigns/${id}/sessions`)}
                aria-label="Sessie starten"
              >
                ▶ Sessie starten
              </Button>
              <Button
                variant="gold"
                onClick={() => navigate(`/worlds/${campaign.world_id}/world-builder`)}
                aria-label="Lore Forge openen"
              >
                ✦ Lore Forge
              </Button>
              {isDM && (
                <Button
                  variant="ghost"
                  onClick={() => navigate(`/campaigns/${id}/edit`)}
                  aria-label="Kroniek bewerken"
                >
                  ✎ Bewerken
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Party banner ── */}
      {characters && characters.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <ReisgezelschapBanner
            campaignId={id!}
            partyVitals={{
              avgLevel: Math.round(characters.reduce((s, c) => s + c.level, 0) / characters.length),
              totalHp:  characters.reduce((s, c) => s + c.hp_current, 0),
              treasury: characters.reduce((s, c) => s + (c.gold ?? 0), 0),
            }}
            partyMembers={characters.map(c => ({ id: c.id, name: c.name }))}
          />
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ marginTop: 28 }}>
        <Tabs
          variant="line"
          label="Kroniek-secties"
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as TabId)}
          items={tabs.map(t => ({ id: t.id, label: t.label }))}
        />
      </div>

      {/* ── Tab panels ── */}
      <div
        role="tabpanel"
        id={`panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        style={{ marginTop: 28 }}
      >
        {activeTab === 'party' && (
          <PartyTab
            characters={characters ?? []}
            isLoading={isLoadingCharacters}
            onAddHero={() => navigate('/characters')}
          />
        )}

        {activeTab === 'sessions' && (
          <SessionsTab
            sessions={sessions ?? []}
            isLoading={isLoadingSessions}
            forging={createSession.isPending}
            onForge={(nextNumber) => createSession.mutate({ sessionNumber: nextNumber })}
          />
        )}

        {activeTab === 'locations' && (
          <LocationsTab
            locations={locations}
            isLoading={isLoadingLocations}
            forging={createLocation.isPending}
            onForge={() => createLocation.mutate()}
            onViewAll={() => navigate(`/campaigns/${id}/locations`)}
          />
        )}

        {activeTab === 'lore' && (
          <LoreTab
            loreItems={loreItems}
            isLoading={isLoadingLore}
            forging={createLore.isPending}
            onForge={() => createLore.mutate()}
            onViewAll={() => navigate(`/campaigns/${id}/lore`)}
          />
        )}

        {activeTab === 'npcs' && (
          <NpcsTab
            npcs={npcs ?? []}
            factions={factions}
            isLoading={isLoadingNpcs}
            forging={createNpc.isPending}
            onForge={() => createNpc.mutate()}
            onViewAll={() => navigate(`/campaigns/${id}/npcs`)}
          />
        )}

        {activeTab === 'factions' && (
          <FactionsTab
            factions={factions}
            npcs={npcs}
            isLoading={isLoadingFactions}
            forging={createFaction.isPending}
            onForge={() => createFaction.mutate()}
            onViewAll={() => navigate(`/campaigns/${id}/factions`)}
          />
        )}

        {activeTab === 'quests' && (
          <QuestsTab
            quests={quests}
            isLoading={isLoadingQuests}
            forging={createQuest.isPending}
            onForge={() => createQuest.mutate()}
            onViewAll={() => navigate(`/campaigns/${id}/quests`)}
          />
        )}

        {activeTab === 'encounters' && (
          <EncountersTab
            encounters={encounters}
            isLoading={isLoadingEncounters}
            forging={createEncounter.isPending}
            onForge={() => createEncounter.mutate()}
            onViewAll={() => navigate(`/campaigns/${id}/encounters`)}
          />
        )}

        {activeTab === 'treasury' && (
          <TreasuryTab
            allItems={allItems}
            isLoading={isLoadingItems}
            forging={createItem.isPending}
            onForge={() => createItem.mutate()}
            onViewAll={() => navigate(`/campaigns/${id}/items`)}
          />
        )}

        {activeTab === 'notes' && isDM && (
          <NotesTab notes={campaign.notes} />
        )}

        {activeTab === 'invite' && isDM && (
          <InvitePanel campaignId={id!} campaignName={campaign.name} />
        )}
      </div>
    </div>
  )
}

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
import { pickGradient, coverGradients } from '@/utils/pickGradient'
import { sanitizeImageUrl } from '@/utils/sanitizeUrl'
import { campaignStatusLabel, campaignStatusColor } from '@/lib/statusMaps'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useAuthStore } from '@/stores/auth.store'

const scrimGradient =
  'linear-gradient(to top, var(--void) 0%, rgb(var(--void-rgb) / 0.97) 20%, rgb(var(--void-rgb) / 0.72) 40%, rgb(var(--void-rgb) / 0.18) 62%, transparent 82%)'

type TabId = 'party' | 'sessions' | 'locations' | 'lore' | 'npcs' | 'factions' | 'quests' | 'encounters' | 'treasury' | 'notes' | 'invite'

const TABS: { id: TabId; label: string; dmOnly?: boolean }[] = [
  { id: 'party', label: 'The Party' },
  { id: 'sessions', label: 'Sessies' },
  { id: 'locations', label: 'Locaties' },
  { id: 'lore', label: 'Lore' },
  { id: 'npcs', label: "NPC's" },
  { id: 'factions', label: 'Facties' },
  { id: 'quests', label: 'Quests' },
  { id: 'encounters', label: 'Gevechten' },
  { id: 'treasury', label: 'Schatkist' },
  { id: 'notes', label: 'DM-notities' },
  { id: 'invite', label: 'Uitnodigingen', dmOnly: true },
]

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabId>('sessions')

  const user = useAuthStore(s => s.user)

  const { data: campaign, isLoading } = useCampaignWithWorld(id)
  const { data: sessions, isLoading: isLoadingSessions } = useCampaignSessions(id)
  const { data: characters, isLoading: isLoadingCharacters } = useCampaignCharacters(id)
  const { data: allItems, isLoading: isLoadingItems } = useCampaignItems(id)
  const { data: locations, isLoading: isLoadingLocations } = useCampaignLocations(id)
  const { data: loreItems, isLoading: isLoadingLore } = useCampaignLore(id)
  const { data: npcs, isLoading: isLoadingNpcs } = useCampaignNpcs(id)
  const { data: quests, isLoading: isLoadingQuests } = useCampaignQuests(id)
  const { data: encounters, isLoading: isLoadingEncounters } = useCampaignEncounters(id)
  const { data: factions, isLoading: isLoadingFactions } = useCampaignFactions(id)

  const createSession = useCreateCampaignSession(id!)
  const createLocation = useCreateCampaignLocation(id!)
  const createLore = useCreateCampaignLore(id!)
  const createNpc = useCreateCampaignNpc(id!)
  const createQuest = useCreateCampaignQuest(id!)
  const createEncounter = useCreateCampaignEncounter(id!)
  const createFaction = useCreateCampaignFaction(id!)
  const createItem = useForgeCampaignItem(id!)

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }} aria-live="polite" aria-label="Kroniek laden...">
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

  const initial = campaign.name.trim()[0]?.toUpperCase() ?? '?'
  const gradient = campaign.header_image ? undefined : pickGradient(campaign.id, coverGradients)

  return (
    <div>
      <Breadcrumb items={[
        { label: campaign.worlds?.name ?? 'Wereld', onClick: () => navigate(`/worlds/${campaign.world_id}`) },
        { label: campaign.name },
      ]} />

      {/* Campaign header */}
      <div
        style={{
          position: 'relative',
          borderRadius: 'var(--r-xl)',
          border: '1px solid var(--hairline)',
          overflow: 'hidden',
        }}
      >
        {campaign.header_image ? (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', inset: 0,
              backgroundImage: sanitizeImageUrl(campaign.header_image) ? `url(${sanitizeImageUrl(campaign.header_image)})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: campaign.header_image_position ?? 'center',
            }}
          />
        ) : (
          <div
            aria-hidden="true"
            style={{ position: 'absolute', inset: 0, background: `${gradient}, var(--void)` }}
          />
        )}

        <div aria-hidden="true" className="wdh-scrim" style={{ background: scrimGradient }} />

        {/* Mobile layout */}
        <div className="wdh-mobile">
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '8%', left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(120px, 38vw, 180px)',
              fontWeight: 600,
              color: 'var(--ink)', opacity: 0.09,
              lineHeight: 1, userSelect: 'none', pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {initial}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 20px 0' }}>
            <StatusBadge label={campaignStatusLabel[campaign.status]} color={campaignStatusColor[campaign.status]} />
          </div>

          <div style={{ flex: 1 }} />

          <div style={{ padding: '0 24px 28px' }}>
            {campaign.subtitle && (
              <p style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontStyle: 'italic',
                fontSize: 13, letterSpacing: '0.03em',
                color: 'var(--gold)', margin: '0 0 10px',
              }}>
                {campaign.subtitle}
              </p>
            )}
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(24px, 6.5vw, 34px)',
              fontWeight: 600, lineHeight: 0.92,
              letterSpacing: '0.04em', textTransform: 'uppercase',
              color: 'var(--ink)', margin: '0 0 14px',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              maxWidth: '100%',
            }}>
              {campaign.name}
            </h1>
            {campaign.description && (
              <p style={{
                fontSize: 13, lineHeight: 1.7,
                color: 'var(--ink-soft)', margin: '0 0 18px',
              }}>
                {campaign.description}
              </p>
            )}
            <div className="wdh-btns">
              <Button
                variant="primary"
                aria-label="Sessie starten"
                onClick={() => navigate(`/campaigns/${id}/sessions`)}
              >
                ▶ Sessie starten
              </Button>
              <Button
                variant="gold"
                aria-label="Lore Forge — AI lore genereren"
              >
                ✦ Lore Forge
              </Button>
            </div>
          </div>
        </div>

        {/* Desktop layout */}
        <div className="wdh-desktop">
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '8%', left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(180px, 26vw, 320px)',
              fontWeight: 600,
              color: 'var(--ink)', opacity: 0.09,
              lineHeight: 1, userSelect: 'none', pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {initial}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '20px 28px 0' }}>
            <StatusBadge label={campaignStatusLabel[campaign.status]} color={campaignStatusColor[campaign.status]} />
          </div>

          <div style={{ flex: 1 }} />

          <div style={{ padding: '0 clamp(28px, 4vw, 48px) 36px' }}>
            {campaign.subtitle && (
              <p style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontStyle: 'italic',
                fontSize: 15, letterSpacing: '0.03em',
                color: 'var(--gold)', margin: '0 0 12px',
              }}>
                {campaign.subtitle}
              </p>
            )}
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(44px, 5.5vw, 80px)',
              fontWeight: 600, lineHeight: 0.92,
              letterSpacing: '0.04em', textTransform: 'uppercase',
              color: 'var(--ink)', margin: '0 0 18px',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {campaign.name}
            </h1>

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 32 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {campaign.description && (
                  <p style={{
                    fontSize: 14, lineHeight: 1.7,
                    color: 'var(--ink-soft)', margin: 0,
                  }}>
                    {campaign.description}
                  </p>
                )}
              </div>
              <div style={{ flexShrink: 0, display: 'flex', gap: 10 }}>
                <Button
                  variant="primary"
                  aria-label="Sessie starten"
                  onClick={() => navigate(`/campaigns/${id}/sessions`)}
                >
                  ▶ Sessie starten
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Party banner ── */}
      {characters && characters.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <ReisgezelschapBanner
            campaignId={id!}
            partyVitals={{
              avgLevel: Math.round(characters.reduce((s, c) => s + c.level, 0) / characters.length),
              totalHp: characters.reduce((s, c) => s + c.hp_current, 0),
              treasury: characters.reduce((s, c) => s + (c.gold ?? 0), 0),
            }}
            partyMembers={characters.map(c => ({ id: c.id, name: c.name }))}
          />
        </div>
      )}

      {/* ── Tab navigation ── */}
      <div style={{ marginTop: 32 }}>
        <Tabs
          variant="line"
          label="Kroniek secties"
          value={activeTab}
          onValueChange={(id) => setActiveTab(id as TabId)}
          items={TABS.filter(tab => !tab.dmOnly || campaign.user_id === user?.id).map(tab => ({
            id: tab.id,
            label: tab.label,
          }))}
        />
      </div>

      {/* ── Tab panels ── */}
      <div
        role="tabpanel"
        id={`panel-${activeTab}`}
        style={{ marginTop: 32 }}
      >
        {activeTab === 'party' && (
          <PartyTab
            characters={characters ?? []}
            isLoading={isLoadingCharacters}
            allItems={allItems ?? []}
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
            isLoading={isLoadingNpcs}
            forging={createNpc.isPending}
            onForge={() => createNpc.mutate()}
            onViewAll={() => navigate(`/campaigns/${id}/npcs`)}
          />
        )}

        {activeTab === 'factions' && (
          <FactionsTab
            factions={factions}
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

        {activeTab === 'notes' && (
          <NotesTab notes={campaign.notes} />
        )}

        {activeTab === 'invite' && campaign.user_id === user?.id && (
          <InvitePanel campaignId={id!} campaignName={campaign.name} />
        )}
      </div>
    </div>
  )
}

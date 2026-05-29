import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { useAuthStore } from '@/stores/auth.store'
import { Spinner } from '@/components/ui/Spinner'
import { StoryArcTracker } from '@/components/session/StoryArcTracker'
import { LocationCard, ForgeLocationCard } from '@/components/location/LocationCard'
import { LoreCard, ForgeLoreCard } from '@/components/lore/LoreCard'
import { NpcRow } from '@/components/npc/NpcCard'
import { DmNpcPanel } from '@/components/npc/DmNpcPanel'
import { QuestCard, ForgeQuestCard } from '@/components/quest/QuestCard'
import { EncounterCard, ForgeEncounterCard } from '@/components/encounter/EncounterCard'
import { PartyMemberRow } from '@/components/character/CharacterCard'
import { DmCharacterPanel } from '@/components/character/DmCharacterPanel'
import { ItemCard, ForgeItemCard } from '@/components/item/ItemCard'
import { useCampaignWithWorld } from '@/hooks/queries/useCampaign'
import { useCampaignSessions } from '@/hooks/queries/useCampaignSessions'
import { useCampaignLocations } from '@/hooks/queries/useCampaignLocations'
import { useCampaignNpcs } from '@/hooks/queries/useCampaignNpcs'
import { useCampaignLore } from '@/hooks/queries/useCampaignLore'
import { useCampaignQuests } from '@/hooks/queries/useCampaignQuests'
import { useCampaignEncounters } from '@/hooks/queries/useCampaignEncounters'
import { useCampaignCharacters } from '@/hooks/queries/useCampaignCharacters'
import { useCampaignItems } from '@/hooks/queries/useCampaignItems'
import { pickGradient, coverGradients } from '@/utils/pickGradient'
import { sanitizeImageUrl } from '@/utils/sanitizeUrl'
import { campaignStatusLabel } from '@/lib/statusMaps'
import type { Session } from '@/types/session.types'
import type { Location } from '@/types/location.types'
import type { Lore } from '@/types/lore.types'
import type { Npc } from '@/types/npc.types'
import type { Quest } from '@/types/quest.types'
import type { Encounter } from '@/types/encounter.types'
import type { Item } from '@/types/item.types'
import type { Character } from '@/types/character.types'

// ── PartySection ──────────────────────────────────────────────────────────────
// Split-screen party view: left = member list, right = DM character panel.
function PartySection({
  characters,
  isLoading,
  allItems,
  onAddHero,
}: {
  characters: Character[]
  isLoading: boolean
  allItems: Item[]
  onAddHero: () => void
}) {
  const [selectedId, setSelectedId] = useState<string | null>(
    () => characters[0]?.id ?? null
  )

  const selected = characters.find(c => c.id === selectedId) ?? characters[0] ?? null
  const characterItems = selected ? allItems.filter(i => i.character_id === selected.id) : []

  return (
    <section aria-labelledby="tab-party-heading">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2
          id="tab-party-heading"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(22px, 4vw, 30px)',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--ink)',
            margin: 0,
          }}
        >
          The Party
        </h2>
        <button
          type="button"
          className="pangu-btn pangu-btn-ghost pangu-btn-sm"
          onClick={onAddHero}
          aria-label="Held toevoegen — ga naar karakters"
        >
          + Held toevoegen
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }} aria-live="polite" aria-busy="true">
          <Spinner size="md" />
        </div>
      ) : characters.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 2fr) minmax(320px, 3fr)',
          gap: 20,
          alignItems: 'start',
        }}>
          {/* Left: party member list */}
          <ul
            style={{ display: 'flex', flexDirection: 'column', gap: 10, listStyle: 'none', padding: 0, margin: 0 }}
            role="list"
            aria-label="Karakters in deze kroniek"
          >
            {characters.map((character) => (
              <li key={character.id}>
                <PartyMemberRow
                  character={character}
                  selected={character.id === (selected?.id)}
                  onSelect={() => setSelectedId(character.id)}
                />
              </li>
            ))}
          </ul>

          {/* Right: DM detail panel */}
          {selected && (
            <div style={{ position: 'sticky', top: 20, maxHeight: 'calc(100vh - 180px)' }}>
              <DmCharacterPanel character={selected} items={characterItems} />
            </div>
          )}
        </div>
      ) : (
        <div className="pangu-surface" style={{ padding: 24, textAlign: 'center', borderStyle: 'dashed' }}>
          <p style={{ fontSize: 14, color: 'var(--muted)', margin: '0 0 6px', fontStyle: 'italic' }}>
            Nog geen helden in deze kroniek.
          </p>
          <p style={{ fontSize: 12, color: 'var(--subtle)', margin: 0 }}>
            Spelers kunnen hun karakter koppelen via het karakterscherm (Karakters → Bewerken → Kampagne).
          </p>
        </div>
      )}
    </section>
  )
}

// ── NpcSection ────────────────────────────────────────────────────────────────
// Split-screen NPC view: left = clickable NPC list, right = DM info panel.
function NpcSection({
  npcs,
  isLoading,
  onForge,
  onViewAll,
}: {
  npcs: import('@/types/npc.types').Npc[]
  isLoading: boolean
  onForge: () => void
  onViewAll: () => void
}) {
  const [selectedId, setSelectedId] = useState<string | null>(
    () => npcs[0]?.id ?? null
  )
  const selected = npcs.find(n => n.id === selectedId) ?? npcs[0] ?? null

  return (
    <section aria-labelledby="tab-npcs-heading">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2
          id="tab-npcs-heading"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(22px, 4vw, 30px)',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--ink)',
            margin: 0,
          }}
        >
          NPC's
        </h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="pangu-btn pangu-btn-ghost pangu-btn-sm"
            onClick={onForge}
          >
            + NPC toevoegen
          </button>
          {npcs.length > 0 && (
            <button
              type="button"
              className="pangu-btn pangu-btn-ghost pangu-btn-sm"
              onClick={onViewAll}
            >
              Alle NPCs →
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }} aria-live="polite" aria-busy="true">
          <Spinner size="md" />
        </div>
      ) : npcs.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(240px, 2fr) minmax(300px, 3fr)',
          gap: 20,
          alignItems: 'start',
        }}>
          {/* Left: NPC list */}
          <ul
            style={{ display: 'flex', flexDirection: 'column', gap: 8, listStyle: 'none', padding: 0, margin: 0 }}
            role="list"
            aria-label="NPC's in deze kroniek"
          >
            {npcs.map((npc) => (
              <li key={npc.id}>
                <NpcRow
                  npc={npc}
                  selected={npc.id === (selected?.id)}
                  onSelect={() => setSelectedId(npc.id)}
                />
              </li>
            ))}
          </ul>

          {/* Right: DM detail panel */}
          {selected && (
            <div style={{ position: 'sticky', top: 20, maxHeight: 'calc(100vh - 180px)' }}>
              <DmNpcPanel npc={selected} />
            </div>
          )}
        </div>
      ) : (
        <div className="pangu-surface" style={{ padding: 24, textAlign: 'center', borderStyle: 'dashed' }}>
          <p style={{ fontSize: 14, color: 'var(--muted)', margin: '0 0 6px', fontStyle: 'italic' }}>
            Nog geen NPC's in deze kroniek.
          </p>
          <p style={{ fontSize: 12, color: 'var(--subtle)', margin: 0 }}>
            Voeg een NPC toe om personages bij te houden.
          </p>
        </div>
      )}
    </section>
  )
}

const scrimGradient =
  'linear-gradient(to top, var(--void) 0%, rgba(10,10,22,0.97) 20%, rgba(10,10,22,0.72) 40%, rgba(10,10,22,0.18) 62%, transparent 82%)'

type TabId = 'party' | 'sessions' | 'locations' | 'lore' | 'npcs' | 'quests' | 'encounters' | 'treasury' | 'notes'

const TABS: { id: TabId; label: string }[] = [
  { id: 'party', label: 'The Party' },
  { id: 'sessions', label: 'Sessies' },
  { id: 'locations', label: 'Locaties' },
  { id: 'lore', label: 'Lore' },
  { id: 'npcs', label: "NPC's" },
  { id: 'quests', label: 'Quests' },
  { id: 'encounters', label: 'Gevechten' },
  { id: 'treasury', label: 'Schatkist' },
  { id: 'notes', label: 'DM-notities' },
]

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore(s => s.user)
  const [activeTab, setActiveTab] = useState<TabId>('sessions')

  const { data: campaign, isLoading } = useCampaignWithWorld(id)
  const { data: sessions, isLoading: isLoadingSessions } = useCampaignSessions(id)
  const { data: characters, isLoading: isLoadingCharacters } = useCampaignCharacters(id)
  const { data: allItems, isLoading: isLoadingItems } = useCampaignItems(id)
  const { data: locations, isLoading: isLoadingLocations } = useCampaignLocations(id)
  const { data: loreItems, isLoading: isLoadingLore } = useCampaignLore(id)
  const { data: npcs, isLoading: isLoadingNpcs } = useCampaignNpcs(id)
  const { data: quests, isLoading: isLoadingQuests } = useCampaignQuests(id)
  const { data: encounters, isLoading: isLoadingEncounters } = useCampaignEncounters(id)

  const createSession = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Niet ingelogd')
      const nextNumber = sessions && sessions.length > 0
        ? Math.max(...sessions.map((s) => s.session_number ?? 0)) + 1
        : 1
      const { data, error } = await supabase
        .from('sessions')
        .insert({ campaign_id: id!, user_id: user.id, name: 'Nieuwe sessie', session_number: nextNumber, status: 'planned' })
        .select()
        .single()
      if (error) throw error
      return data as Session
    },
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.sessions(id!) })
      navigate(`/sessions/${newSession.id}/edit`, { state: { isNew: true, campaignId: id } })
    },
    onError: () => { toast.error('Sessie aanmaken mislukt') },
  })

  const createLocation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Niet ingelogd')
      const { data, error } = await supabase
        .from('locations')
        .insert({ campaign_id: id!, user_id: user.id, name: 'Nieuwe locatie', status: 'draft' })
        .select()
        .single()
      if (error) throw error
      return data as Location
    },
    onSuccess: (newLocation) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.locations(id!) })
      navigate(`/locations/${newLocation.id}/edit`, { state: { isNew: true, campaignId: id } })
    },
    onError: () => { toast.error('Locatie aanmaken mislukt') },
  })

  const createLore = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Niet ingelogd')
      const { data, error } = await supabase
        .from('lore')
        .insert({ campaign_id: id!, user_id: user.id, name: 'Nieuwe lore', status: 'draft' })
        .select()
        .single()
      if (error) throw error
      return data as Lore
    },
    onSuccess: (newLore) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.lore(id!) })
      navigate(`/lore/${newLore.id}/edit`, { state: { isNew: true, campaignId: id } })
    },
    onError: () => { toast.error('Lore aanmaken mislukt') },
  })

  const createNpc = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Niet ingelogd')
      const { data, error } = await supabase
        .from('npcs')
        .insert({ campaign_id: id!, user_id: user.id, name: 'Nieuwe NPC', status: 'draft' })
        .select()
        .single()
      if (error) throw error
      return data as Npc
    },
    onSuccess: (newNpc) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.npcs(id!) })
      navigate(`/npcs/${newNpc.id}/edit`, { state: { isNew: true, campaignId: id } })
    },
    onError: () => { toast.error('NPC aanmaken mislukt') },
  })

  const createQuest = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Niet ingelogd')
      const { data, error } = await supabase
        .from('quests')
        .insert({ campaign_id: id!, user_id: user.id, name: 'Nieuwe quest', status: 'draft' })
        .select()
        .single()
      if (error) throw error
      return data as Quest
    },
    onSuccess: (newQuest) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.quests(id!) })
      navigate(`/quests/${newQuest.id}/edit`, { state: { isNew: true, campaignId: id } })
    },
    onError: () => { toast.error('Quest aanmaken mislukt') },
  })

  const createEncounter = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Niet ingelogd')
      const { data, error } = await supabase
        .from('encounters')
        .insert({ campaign_id: id!, user_id: user.id, name: 'Nieuw gevecht', status: 'draft' })
        .select()
        .single()
      if (error) throw error
      return data as Encounter
    },
    onSuccess: (newEncounter) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.encounters(id!) })
      navigate(`/encounters/${newEncounter.id}/edit`, { state: { isNew: true, campaignId: id } })
    },
    onError: () => { toast.error('Gevecht aanmaken mislukt') },
  })

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
    onError: () => { toast.error('Item aanmaken mislukt') },
  })

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
        <button type="button" className="pangu-btn pangu-btn-ghost" onClick={() => navigate('/dashboard')} style={{ marginTop: 16 }}>
          ← Terug naar dashboard
        </button>
      </div>
    )
  }

  const initial = campaign.name.trim()[0]?.toUpperCase() ?? '?'
  const gradient = campaign.header_image ? undefined : pickGradient(campaign.id, coverGradients)
  const dmPoolItems = allItems?.filter(i => !i.character_id) ?? []

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
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '4px 12px',
              background: 'var(--gold)',
              borderRadius: 'var(--r-full)',
              fontFamily: 'var(--font-body)',
              fontSize: 10, fontWeight: 700,
              letterSpacing: '0.16em', textTransform: 'uppercase',
              color: 'var(--void)',
            }}>
              {campaignStatusLabel[campaign.status]}
            </span>
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
              <button
                type="button"
                className="pangu-btn pangu-btn-primary"
                aria-label="Sessie starten"
                onClick={() => navigate(`/campaigns/${id}/sessions`)}
              >
                ▶ Sessie starten
              </button>
              <button
                type="button"
                className="pangu-btn pangu-btn-gold"
                aria-label="Lore Forge — AI lore genereren"
              >
                ✦ Lore Forge
              </button>
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
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '4px 12px',
              background: 'var(--gold)',
              borderRadius: 'var(--r-full)',
              fontFamily: 'var(--font-body)',
              fontSize: 10, fontWeight: 700,
              letterSpacing: '0.16em', textTransform: 'uppercase',
              color: 'var(--void)',
            }}>
              {campaignStatusLabel[campaign.status]}
            </span>
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
                <button
                  type="button"
                  className="pangu-btn pangu-btn-primary"
                  aria-label="Sessie starten"
                  onClick={() => navigate(`/campaigns/${id}/sessions`)}
                >
                  ▶ Sessie starten
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab navigation ── */}
      <div
        role="tablist"
        aria-label="Kroniek secties"
        style={{
          display: 'flex',
          gap: 4,
          marginTop: 32,
          overflowX: 'auto',
          paddingBottom: 2,
          scrollbarWidth: 'none',
          borderBottom: '1px solid var(--hairline)',
        }}
      >
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flexShrink: 0,
              padding: '10px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id
                ? '2px solid var(--violet)'
                : '2px solid transparent',
              marginBottom: -1,
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              fontSize: 13, fontWeight: activeTab === tab.id ? 700 : 500,
              letterSpacing: '0.04em',
              color: activeTab === tab.id ? 'var(--violet-soft)' : 'var(--muted)',
              transition: 'color var(--t-fast) var(--ease-out), border-color var(--t-fast) var(--ease-out)',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => {
              if (activeTab !== tab.id)
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--ink-soft)'
            }}
            onMouseLeave={e => {
              if (activeTab !== tab.id)
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab panels ── */}
      <div style={{ marginTop: 32 }}>

        {/* The Party */}
        {activeTab === 'party' && (
          <PartySection
            characters={characters ?? []}
            isLoading={isLoadingCharacters}
            allItems={allItems ?? []}
            onAddHero={() => navigate('/characters')}
          />
        )}

        {/* Sessies — Story Arc */}
        {activeTab === 'sessions' && (
          <section aria-labelledby="tab-sessions-heading">
            {isLoadingSessions ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }} aria-live="polite" aria-busy="true">
                <Spinner size="lg" />
              </div>
            ) : (
              <StoryArcTracker
                sessions={sessions ?? []}
                onForge={() => createSession.mutate()}
                forgeLoading={createSession.isPending}
              />
            )}
          </section>
        )}

        {/* Locaties */}
        {activeTab === 'locations' && (
          <section aria-labelledby="tab-locations-heading">
            <h2
              id="tab-locations-heading"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(22px, 4vw, 30px)',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--ink)',
                margin: '0 0 24px',
              }}
            >
              Locaties
            </h2>
            {isLoadingLocations ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }} aria-live="polite" aria-busy="true">
                <Spinner size="md" />
              </div>
            ) : (
              <>
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
                  aria-label="Locaties in deze kroniek"
                >
                  {locations?.map((loc) => (
                    <li key={loc.id}><LocationCard location={loc} /></li>
                  ))}
                  <li>
                    <ForgeLocationCard onClick={() => createLocation.mutate()} loading={createLocation.isPending} />
                  </li>
                </ul>
                {locations && locations.length > 0 && (
                  <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="pangu-btn pangu-btn-ghost pangu-btn-sm"
                      onClick={() => navigate(`/campaigns/${id}/locations`)}
                    >
                      Alle locaties bekijken →
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* Lore */}
        {activeTab === 'lore' && (
          <section aria-labelledby="tab-lore-heading">
            <h2
              id="tab-lore-heading"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(22px, 4vw, 30px)',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--ink)',
                margin: '0 0 24px',
              }}
            >
              Lore
            </h2>
            {isLoadingLore ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }} aria-live="polite" aria-busy="true">
                <Spinner size="md" />
              </div>
            ) : (
              <>
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
                  aria-label="Lore in deze kroniek"
                >
                  {loreItems?.map((lore) => (
                    <li key={lore.id}><LoreCard lore={lore} /></li>
                  ))}
                  <li>
                    <ForgeLoreCard onClick={() => createLore.mutate()} loading={createLore.isPending} />
                  </li>
                </ul>
                {loreItems && loreItems.length > 0 && (
                  <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="pangu-btn pangu-btn-ghost pangu-btn-sm"
                      onClick={() => navigate(`/campaigns/${id}/lore`)}
                    >
                      Alle lore bekijken →
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* NPCs */}
        {activeTab === 'npcs' && (
          <NpcSection
            npcs={npcs ?? []}
            isLoading={isLoadingNpcs}
            onForge={() => createNpc.mutate()}
            onViewAll={() => navigate(`/campaigns/${id}/npcs`)}
          />
        )}

        {/* Quests */}
        {activeTab === 'quests' && (
          <section aria-labelledby="tab-quests-heading">
            <h2
              id="tab-quests-heading"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(22px, 4vw, 30px)',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--ink)',
                margin: '0 0 24px',
              }}
            >
              Quests
            </h2>
            {isLoadingQuests ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }} aria-live="polite" aria-busy="true">
                <Spinner size="md" />
              </div>
            ) : (
              <>
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
                  aria-label="Quests in deze kroniek"
                >
                  {quests?.map((quest) => (
                    <li key={quest.id}><QuestCard quest={quest} /></li>
                  ))}
                  <li>
                    <ForgeQuestCard onClick={() => createQuest.mutate()} loading={createQuest.isPending} />
                  </li>
                </ul>
                {quests && quests.length > 0 && (
                  <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="pangu-btn pangu-btn-ghost pangu-btn-sm"
                      onClick={() => navigate(`/campaigns/${id}/quests`)}
                    >
                      Alle quests bekijken →
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* Gevechten */}
        {activeTab === 'encounters' && (
          <section aria-labelledby="tab-encounters-heading">
            <h2
              id="tab-encounters-heading"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(22px, 4vw, 30px)',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--ink)',
                margin: '0 0 24px',
              }}
            >
              Gevechten
            </h2>
            {isLoadingEncounters ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }} aria-live="polite" aria-busy="true">
                <Spinner size="md" />
              </div>
            ) : (
              <>
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
                  aria-label="Gevechten in deze kroniek"
                >
                  {encounters?.slice(0, 6).map((encounter) => (
                    <li key={encounter.id}><EncounterCard encounter={encounter} /></li>
                  ))}
                  <li>
                    <ForgeEncounterCard onClick={() => createEncounter.mutate()} loading={createEncounter.isPending} />
                  </li>
                </ul>
                {encounters && encounters.length > 0 && (
                  <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="pangu-btn pangu-btn-ghost pangu-btn-sm"
                      onClick={() => navigate(`/campaigns/${id}/encounters`)}
                    >
                      Alle gevechten bekijken →
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* Schatkist */}
        {activeTab === 'treasury' && (
          <section aria-labelledby="tab-treasury-heading">
            <h2
              id="tab-treasury-heading"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(22px, 4vw, 30px)',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--ink)',
                margin: '0 0 24px',
              }}
            >
              Schatkist
            </h2>
            {isLoadingItems ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }} aria-live="polite" aria-busy="true">
                <Spinner size="md" />
              </div>
            ) : (
              <>
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
                  aria-label="Items in DM-schatkist"
                >
                  {dmPoolItems.slice(0, 6).map((item) => (
                    <li key={item.id}><ItemCard item={item} /></li>
                  ))}
                  <li>
                    <ForgeItemCard onClick={() => createItem.mutate()} loading={createItem.isPending} />
                  </li>
                </ul>
                {allItems && allItems.length > 0 && (
                  <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="pangu-btn pangu-btn-ghost pangu-btn-sm"
                      onClick={() => navigate(`/campaigns/${id}/items`)}
                    >
                      Alle items bekijken →
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* DM-notities */}
        {activeTab === 'notes' && (
          <section aria-labelledby="tab-notes-heading">
            <h2
              id="tab-notes-heading"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(22px, 4vw, 30px)',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--ink)',
                margin: '0 0 24px',
              }}
            >
              DM-notities
            </h2>
            {campaign.notes ? (
              <div
                className="pangu-surface"
                style={{
                  padding: 28,
                  borderColor: 'rgba(245,180,50,0.22)',
                  background: 'linear-gradient(180deg, rgba(245,180,50,0.04), transparent)',
                }}
              >
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.18em', textTransform: 'uppercase',
                  color: 'var(--gold)', margin: '0 0 12px',
                }}>
                  ✦ Alleen zichtbaar voor de DM
                </p>
                <p style={{
                  fontSize: 14, lineHeight: 1.75,
                  color: 'var(--ink-soft)', margin: 0,
                  whiteSpace: 'pre-wrap',
                }}>
                  {campaign.notes}
                </p>
              </div>
            ) : (
              <p style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>
                Nog geen DM-notities.
              </p>
            )}
          </section>
        )}

      </div>
    </div>
  )
}

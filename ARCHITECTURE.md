# PANGU v2 — Doel-architectuur

Dit document beschrijft de target-staat na de refactor. Het is normatief: nieuwe code volgt deze afspraken; bestaande code migreert hier naartoe per fase (zie REFACTOR-PLAN.md).

---

## Lagenmodel

```
┌─────────────────────────────────────────────────────────────┐
│  View Layer                                                 │
│  src/pages/       — routepagina's (≤150 r, orchestratie)    │
│  src/components/  — UI-componenten (presentationeel)        │
├─────────────────────────────────────────────────────────────┤
│  State Layer                                                │
│  src/hooks/queries/  — TanStack Query (server state)        │
│  src/stores/         — Zustand (client state)               │
│  src/hooks/          — generieke React hooks                │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                                 │
│  src/lib/supabase.ts — één Supabase client-instantie        │
│  src/lib/open5e.ts   — Open5e API client + mappers          │
├─────────────────────────────────────────────────────────────┤
│  Domain Layer                                               │
│  src/types/       — TypeScript types                        │
│  src/utils/       — pure hulpfuncties                       │
│  src/lib/         — configuratie, constanten, kaarten       │
└─────────────────────────────────────────────────────────────┘
```

### Verkeersregels

| Van | Naar | Toegestaan |
|-----|------|-----------|
| pages | components | ✓ |
| pages | hooks/queries | ✓ |
| pages | stores | ✓ |
| pages | lib/supabase | ✗ (via hooks) |
| components | hooks/queries | ✓ (via props of directe import) |
| components | lib/supabase | ✗ |
| hooks/queries | lib/supabase | ✓ |
| hooks/queries | stores | ✓ (lezen van auth, campaign id) |
| stores | lib/supabase | ✗ (stores zijn synchrone state) |
| utils/types | alles anders | ✗ (geen imports van hogere lagen) |

---

## Query hooks (`src/hooks/queries/`)

### Bestandsnaamgeving

Één bestand per entity-type. Conventie: `use[EntityType].ts` voor enkelvoud (detail), `useCampaign[EntityType]s.ts` voor lijstqueries die campaign-scoped zijn.

| Bestand | Exports |
|---------|---------|
| `useCampaign.ts` | `useCampaign(id)`, `useCampaignWithWorld(id)` |
| `useCampaignSessions.ts` | `useCampaignSessions(campaignId)`, `useCreateCampaignSession(campaignId)` |
| `useCampaignLocations.ts` | `useCampaignLocations(campaignId)`, `useCreateCampaignLocation(campaignId)` |
| `useCampaignNpcs.ts` | `useCampaignNpcs(campaignId)`, `useCreateCampaignNpc(campaignId)` |
| `useCampaignLore.ts` | `useCampaignLore(campaignId)`, `useCreateCampaignLore(campaignId)` |
| `useCampaignQuests.ts` | `useCampaignQuests(campaignId)`, `useCreateCampaignQuest(campaignId)` |
| `useCampaignEncounters.ts` | `useCampaignEncounters(campaignId)`, `useCreateCampaignEncounter(campaignId)` |
| `useCampaignItems.ts` | `useCampaignItems(campaignId)`, `useCreateCampaignItem(campaignId)` |
| `useCampaignFactions.ts` | `useCampaignFactions(campaignId)`, `useCreateCampaignFaction(campaignId)` |
| `useNpc.ts` | `useNpc(id)`, `useNpcWithCampaign(id)`, `useSaveNpc(id)`, `useDeleteNpc(id)` |
| `useLocation.ts` | `useLocation(id)`, `useLocationWithCampaign(id)`, `useSaveLocation(id)`, `useDeleteLocation(id)` |
| `useLore.ts` | `useLore(id)`, `useLoreWithCampaign(id)`, `useSaveLore(id)`, `useDeleteLore(id)` |
| `useSession.ts` | `useSession(id)`, `useSessionWithCampaign(id)`, `useSaveSession(id)`, `useDeleteSession(id)` |
| `useQuest.ts` | `useQuest(id)`, `useQuestWithCampaign(id)`, `useSaveQuest(id)`, `useDeleteQuest(id)` |
| `useEncounter.ts` | `useEncounter(id)`, `useEncounterWithCampaign(id)`, `useSaveEncounter(id)`, `useDeleteEncounter(id)` |
| `useBestiary.ts` | `useBestiary(id)`, `useBestiaryWithWorld(id)`, `useSaveBestiary(id)`, `useDeleteBestiary(id)` |
| `useCharacter.ts` | `useCharacter(id)`, `useSaveCharacter(id)`, `useDeleteCharacter(id)`, `useCharacterMutations(id)` |
| `useItem.ts` | `useItem(id)`, `useSaveItem(id)`, `useDeleteItem(id)` |
| `useWorld.ts` | `useWorld(id)`, `useCreateWorld()` |
| `useWorldBestiaries.ts` | `useWorldBestiaries(worldId)`, `useCreateBestiary(worldId)` |

### Query key structuur

Elke entity-type heeft een eigen namespace in `src/lib/queryKeys.ts`:

```ts
export const queryKeys = {
  worlds:     { all, detail(id), bestiaries(worldId) },
  campaigns:  { all, active, detail(id), detailWithWorld(id), byWorld(worldId), members(id), invite(id) },
  sessions:   { byCampaign(id), planned, detail(id), detailFull(id), myNote(id), playerNotes(id) },
  locations:  { byCampaign(id), detail(id), detailFull(id) },
  npcs:       { byCampaign(id), detail(id), detailFull(id) },
  lore:       { byCampaign(id), detail(id), detailFull(id) },
  quests:     { byCampaign(id), detail(id), detailFull(id) },
  encounters: { byCampaign(id), detail(id), detailFull(id), monsters(id), monstersFull(id) },
  bestiaries: { byWorld(id), detail(id), detailFull(id) },
  factions:   { byCampaign(id), detail(id), detailFull(id), members(id) },
  characters: { all, detail(id), byCampaign(id), items(id), spells(id) },
  items:      { byCampaign(id), detail(id) },
  spells:     { all, detail(id) },
  entityLinks:(type, id),
  srd:        { monsters(q, ed), items(q, ed), spells(q, ed) },
  admin:      { users },
  userAiSettings: (userId),
  notifications: { list(userId) },
  invites:    { byCode(code) },
}
```

### staleTime

Gebruik de constanten uit `src/lib/queryClient.ts`:

```ts
export const STALE = {
  list:     30_000,        // overzichtsqueries
  detail:   60_000,        // detailqueries
  slow:     5 * 60_000,    // instellingen, invites
  external: 60 * 60_000,   // SRD / externe API
} as const
```

### Mutatie-conventie

Elke `useMutation` in een query hook:

1. Roept de supabase-operatie aan
2. Bij `onSuccess`: invalideert de relevante query keys
3. Toont feedback via `toast.success` of `toast.error` (nooit stille failures)
4. Retourneert het mutatie-object zodat de aanroeper `.isPending`, `.isError` kan lezen

```ts
export function useCreateCampaignNpc(campaignId: string) {
  const queryClient = useQueryClient()
  const user = useAuthStore(s => s.user)
  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Niet ingelogd')
      const { data, error } = await supabase
        .from('npcs')
        .insert({ campaign_id: campaignId, user_id: user.id, name: 'Nieuwe NPC', status: 'draft' })
        .select().single()
      if (error) throw error
      return data as Npc
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.npcs.byCampaign(campaignId) }),
    onError: () => toast.error('NPC aanmaken mislukt'),
  })
}
```

---

## Component-primitieven (`src/components/ui/`)

### Bestaande primitieven — gebruik altijd

| Component | Gebruik |
|-----------|---------|
| `Button` | Alle knoppen; `variant` + `size` props; nooit `pangu-btn` CSS-klasse |
| `Input` | Alle formuliervelden; `label` + `error` + `aria-describedby` |
| `Modal` | Alle dialogen; focus trap + Escape + aria ingebouwd |
| `ConfirmDialog` | Verwijder-bevestiging; wrappend om `Modal` |
| `EntityCard` | Basis voor alle entiteitskaarten |
| `ForgeCard` | "Nieuw aanmaken" placeholder |
| `StatusBadge` | Status-badges; altijd via `statusMaps` |
| `EmptyState` | Lege staat in overzichtslijsten |
| `EntityCardSkeleton` | Laadstatus voor kaart-grids |
| `Breadcrumbs` | Navigatie-breadcrumbs |

### Nieuwe primitief: `StandardEntityCard`

Voor entiteiten die het standaard card-patroon volgen (gradient + naam + subtitle + status + optioneel type-label + beschrijving):

```tsx
// src/components/ui/StandardEntityCard.tsx
interface StandardEntityCardProps {
  id: string
  name: string
  subtitle?: string | null
  description?: string | null
  statusLabel: string
  statusColor: string
  gradient: string
  route: string
  ariaPrefix: string
  typeLabel?: string
  typeColor?: string
  className?: string
}
```

Feature-cards worden wrappers:

```tsx
// src/components/npc/NpcCard.tsx
export const NpcCard = memo(function NpcCard({ npc }: { npc: Npc }) {
  return (
    <StandardEntityCard
      id={npc.id}
      name={npc.name}
      subtitle={npc.subtitle}
      description={npc.description}
      statusLabel={npcStatusLabel[npc.status]}
      statusColor={npcStatusColor[npc.status]}
      gradient={pickGradient(npc.id, npcGradients)}
      route={`/npcs/${npc.id}`}
      ariaPrefix="NPC"
      typeLabel={npc.npc_role ?? undefined}
      typeColor="var(--crimson)"
    />
  )
})
```

### Componentgrootte

- Max ~150 regels per component
- Business logica in hooks, niet in presentationele componenten
- Tab-panels als eigen componenten, niet als inline JSX in een pagina

---

## Edit-pagina's

Alle edit-pagina's gebruiken `useEntityEdit`:

```ts
const {
  form, set, dirty, committed, setCommitted,
  deleteOpen, setDeleteOpen, resetForm, guard,
} = useEntityEdit({ entity: data, isNew })
```

Pagina's met header-afbeelding combineren dit met `useImagePositioning`:

```ts
const { position, onMouseDown, onMouseMove, onMouseUp } = useImagePositioning(
  form.header_image_position,
  (pos) => set('header_image_position', pos),
)
```

De save- en delete-mutaties staan in de query hook van het entity-type; de edit-pagina roept ze aan.

---

## Draft GC

Alle overzichtspagina's die de Forge-kaart tonen, gebruiken `useDraftGC`:

```ts
useDraftGC('npcs', 'campaign_id', campaignId)
```

De hook staat in `src/hooks/useDraftGC.ts`.

---

## D&D 5e constanten (`src/utils/dnd5e.ts`)

Centraal bestand voor alle spelregel-data die in meerdere componenten wordt gebruikt:

```ts
export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'

export const ABILITIES: { key: AbilityKey; label: string; abbr: string }[] = [...]

export interface Skill { name: string; ability: AbilityKey; abbr: string }
export const D5E_SKILLS: Skill[] = [...]           // 18 vaardigheden

export interface SavingThrow { label: string; abbr: string; statKey: `stat_${AbilityKey}` }
export const D5E_SAVING_THROWS: SavingThrow[] = [...]

export const D5E_CONDITIONS: string[] = [...]       // 17 condities

export const SPELL_LEVEL_LABELS: string[] = ['Kantrip', '1e', '2e', ...]

export function abilityModifier(score: number): number { return Math.floor((score - 10) / 2) }
export function formatModifier(score: number): string {
  const m = abilityModifier(score)
  return m >= 0 ? `+${m}` : String(m)
}
```

---

## Stores (Zustand)

| Store | State | Wanneer gebruiken |
|-------|-------|-----------------|
| `useAuthStore` | user, profile | Overal waar user-identiteit nodig is |
| `useCampaignStore` | activeCampaignId | Sidebar-navigatie, context-dependent queries |
| `useUIStore` | sidebarCollapsed | AppLayout |
| `usePreferencesStore` | instellingen | SettingsPage + per-feature flags |

### Regels

- Stores bevatten geen server-state — gebruik TanStack Query daarvoor
- Stores bevatten geen gevoelige data (geen tokens, API keys)
- Lees stores met selector-functies: `useAuthStore(s => s.user)` — nooit de gehele store destructuren
- Schrijf stores alleen vanuit event handlers of mutatie-callbacks, nooit in render

---

## Statusmappen en gradients

**Statuslabels en -kleuren:** altijd vanuit `src/lib/statusMaps.ts`. Nooit lokaal herdefiniëren.

**Gradients:** altijd via `pickGradient(id, palet)` uit `src/utils/pickGradient.ts`. Nooit lokale `cardGradients` arrays definiëren.

```ts
// Correct
import { pickGradient, npcGradients } from '@/utils/pickGradient'
import { npcStatusLabel, npcStatusColor } from '@/lib/statusMaps'

// Fout
const cardGradients = ['radial-gradient(...)', ...]
function pickGradient(id: string): string { ... }
```

---

## Toegankelijkheid (A11Y)

Elke feature is pas af als de volledige A11Y-checklist in CLAUDE.md is doorlopen. Specifieke architecturale regels:

### Interactieve elementen

- Knoppen zijn altijd `<button>` of de `Button` component — nooit `<div onClick>`
- Klikbare kaarten: `EntityCard` met `role="button"` is toegestaan als de kaart een article-semantiek draagt én geen directe navigatie-link is; voor pure navigatie: gebruik `<a>` of `<Link>`
- `min-w-[44px]` en `min-h-[44px]` op alle touch-targets (de `Button` component garandeert dit al via `sizeStyles`)

### Tab-navigatie

```tsx
// Patroon voor custom tabs
<div role="tablist" aria-label="[beschrijving]">
  {tabs.map(tab => (
    <button
      key={tab.id}
      role="tab"
      id={`tab-${tab.id}`}
      aria-selected={activeTab === tab.id}
      aria-controls={`panel-${tab.id}`}
      tabIndex={activeTab === tab.id ? 0 : -1}
      onClick={() => setActiveTab(tab.id)}
      onKeyDown={handleTabKeyDown}
    >
      {tab.label}
    </button>
  ))}
</div>
{tabs.map(tab => (
  <div
    key={tab.id}
    role="tabpanel"
    id={`panel-${tab.id}`}
    aria-labelledby={`tab-${tab.id}`}
    hidden={activeTab !== tab.id}
  >
    ...
  </div>
))}
```

### Laadstates

```tsx
<div role="status" aria-live="polite" aria-label="Laden...">
  <Spinner size="lg" />
</div>
```

### Focus

- `outline: none` alleen op elementen die een expliciete `focus-visible` stijl als vervanging hebben
- Modals: focus trap aanwezig (Modal component regelt dit), focus keert terug bij sluiten
- Na mutatie-successen hoeft focus niet terug; toast volstaat

---

## Routing

Routes worden gedefinieerd in `src/routes/index.tsx`. Regels:

- Alle pagina's zijn lazy-loaded via `React.lazy()` + `Suspense` (de `wrap()` helper)
- Auth-guards via `loader`: `requireAuth`, `requireAdmin`
- Nieuwe routes volgen het patroon `/:entity/:id` voor detail, `/:entity/:id/edit` voor bewerken
- Foutpagina op route-niveau: `<RouteErrorPage />` als `errorElement`

---

## Bestandsorganisatie

```
src/
├── components/
│   ├── ui/           # Primitieven: Button, Input, Modal, EntityCard, …
│   ├── [entity]/     # Feature-componenten: NpcCard, DmNpcPanel, …
│   └── [feature]/    # Domein-overstijgende features: link/, compendium/, …
├── hooks/
│   ├── queries/      # Één bestand per entity-type
│   └── use*.ts       # Generieke hooks (useEntityEdit, useDraftGC, …)
├── lib/
│   ├── supabase.ts   # Client (één instantie)
│   ├── queryClient.ts # QueryClient + STALE constanten
│   ├── queryKeys.ts  # Gecentraliseerde query keys
│   ├── statusMaps.ts # Status labels + kleuren
│   ├── linkMaps.ts   # Entity link labels + routes
│   ├── constants.ts  # DEV_MODE
│   └── open5e.ts     # Open5e client + mappers
├── pages/            # Routepagina's (≤150 r na refactor)
├── stores/           # Zustand stores
├── types/            # TypeScript types (geen imports van hogere lagen)
└── utils/
    ├── cn.ts
    ├── dnd5e.ts      # D&D 5e constanten + helpers
    ├── equipmentUtils.ts
    ├── format.ts     # formatDate, formatXP, …
    ├── pickGradient.ts
    └── sanitizeUrl.ts
```

---

## TypeScript

- Strict mode altijd aan
- Geen `any` — gebruik `unknown` met type guards bij werkelijke onzekerheid
- `as unknown as T` alleen als tijdelijke maatregel bij ontbrekende gegenereerde types; document in een comment met "Remove after type regen"
- Geen `@ts-ignore` of `@ts-expect-error` zonder uitleg
- Domain types in `src/types/[entity].types.ts`; auto-gegenereerde schema-types in `database.types.ts`
- Types regenereren na elke migratie: `npx supabase gen types typescript --local > src/types/database.types.ts`

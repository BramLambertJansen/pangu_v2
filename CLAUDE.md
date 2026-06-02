# PANGU v2 — CLAUDE.md

## Projectoverzicht

PANGU is een AI-ondersteund campaign management platform voor tabletop RPGs (PWA). Een Dungeon Master (DM) bouwt een levende wereld met locaties, NPCs, lore en avonturen; een AI-agent genereert consistente nieuwe content op basis van de bestaande wereld. Spelers beheren hun eigen karakter en inventaris.

---

## Taalconventie

| Waar | Taal |
|---|---|
| UI-teksten, labels, foutmeldingen, toasts | Nederlands |
| Code: variabelenamen, functies, types, interfaces | Engels |
| Code: comments, console logs | Engels |
| Commit messages | Engels |

---

## Tech Stack

| Laag | Technologie |
|---|---|
| Framework | React 19 + Vite 6 |
| Taal | TypeScript (strict mode) |
| Styling | TailwindCSS v4 (vite plugin, geen config-bestand) |
| Client state | Zustand v5 (persisted) |
| Server state | TanStack Query v5 (mutations + cache invalidation) |
| Routing | react-router-dom v7 |
| Validatie | Zod |
| Toasts | Sonner |
| Testing | Vitest + jsdom |
| Backend | Supabase (auth, database, storage, realtime) |
| PWA | vite-plugin-pwa |
| API | Vercel serverless functions (`api/admin/`) |
| AI | Supabase Edge Function (`supabase/functions/ai-chat/`) |

---

## Projectstructuur

```
src/
├── App.tsx                  # Root: QueryClientProvider, RouterProvider, Toaster
├── main.tsx                 # Entry point
├── index.css                # CSS design tokens (TailwindCSS v4, :root vars)
├── vite-env.d.ts
├── components/
│   ├── AuthInitializer.tsx  # Supabase auth state listener, initializes auth store
│   ├── ErrorBoundary.tsx    # React error boundary (top-level)
│   ├── ui/                  # Herbruikbare basis-componenten
│   │   ├── Avatar.tsx
│   │   ├── Badge.tsx
│   │   ├── Breadcrumb.tsx   # Enkele breadcrumb-item
│   │   ├── Breadcrumbs.tsx  # Breadcrumb-container met items array
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── ConfirmDialog.tsx # Herbruikbare bevestigingsdialoog (verwijderen, etc.)
│   │   ├── EmptyState.tsx   # Lege staat placeholder voor lijsten
│   │   ├── EntityCard.tsx   # Generieke entiteitskaart (basis voor feature cards)
│   │   ├── EntityCardSkeleton.tsx # Skeleton-loader voor entiteitskaarten
│   │   ├── ForgeCard.tsx    # Generieke "nieuw aanmaken" placeholder-kaart
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Skeleton.tsx     # Basis skeleton-loader
│   │   ├── Spinner.tsx
│   │   └── StatusBadge.tsx  # Badge met status-kleur via statusMaps
│   ├── admin/               # Admin feature components
│   │   ├── CreateUserModal.tsx
│   │   ├── DeleteUserModal.tsx
│   │   ├── EditUserModal.tsx
│   │   └── UserTable.tsx
│   ├── bestiary/
│   │   └── BestiaryCard.tsx
│   ├── campaign/
│   │   └── CampaignCard.tsx  # CampaignCard + ForgeCampaignCard
│   ├── character/
│   │   └── CharacterCard.tsx
│   ├── encounter/
│   │   └── EncounterCard.tsx
│   ├── item/
│   │   └── ItemCard.tsx
│   ├── location/
│   │   └── LocationCard.tsx
│   ├── lore/
│   │   └── LoreCard.tsx
│   ├── npc/
│   │   └── NpcCard.tsx
│   ├── quest/
│   │   └── QuestCard.tsx
│   ├── session/
│   │   ├── DmPlayerNotesPanel.tsx # DM-overzicht van alle spelernotities per sessie
│   │   ├── PlayerNotepad.tsx      # Speler-notitieblok met autosave + karakter-koppeling
│   │   ├── SessionCard.tsx        # SessionCard + ForgeSessionCard
│   │   └── StoryArcTracker.tsx    # Tijdlijn-visualisatie van sessies (Romeinse nummers)
│   └── world/
│       ├── CompassRose.tsx
│       ├── WorldCard.tsx      # WorldCard + ForgeWorldCard
│       ├── WorldDetailDivider.tsx
│       └── WorldDetailHeader.tsx
├── hooks/                   # Custom React hooks
│   ├── useAI.ts             # AI chat integration (calls ai-chat Edge Function)
│   ├── useEditGuard.ts      # Voorkomt navigeren weg bij unsaved changes
│   ├── useEntityEdit.ts     # Generieke edit form state (dirty, committed, delete)
│   ├── useImagePositioning.ts # Drag-to-reposition voor header images
│   ├── useOnlineStatus.ts   # Browser online/offline status via navigator.onLine + events
│   ├── useUnsavedChangesPrompt.ts # Browser beforeunload dialog
│   └── queries/             # TanStack Query custom hooks (1 per entity)
│       ├── useCampaign.ts           # + useCampaignWithWorld export
│       ├── useCampaignCharacters.ts
│       ├── useCampaignEncounters.ts
│       ├── useCampaignItems.ts      # + useCreateCampaignItem export
│       ├── useCampaignLocations.ts
│       ├── useCampaignLore.ts
│       ├── useCampaignNpcs.ts
│       ├── useCampaignQuests.ts
│       ├── useCampaignSessions.ts
│       ├── useCharacterItems.ts
│       ├── useCharacters.ts
│       ├── useEncounterMonsters.ts  # Encounter monsters + bestiary join; EncounterMonsterFull type
│       ├── usePlayerNotes.ts        # useMySessionNote, useSessionPlayerNotes, useSavePlayerNote
│       ├── useSession.ts
│       ├── useUserAISettings.ts     # Fetch + mutate user_ai_settings; useSetByokKey
│       ├── useWorld.ts
│       └── useWorldBestiaries.ts
├── layouts/
│   ├── AppLayout.tsx         # Sidebar + starfield achtergrond
│   └── AuthLayout.tsx
├── lib/
│   ├── constants.ts          # VITE_DEV_MODE env flag (`DEV_MODE` boolean export)
│   ├── localDb.ts            # Generic localStorage CRUD layer voor DEV_MODE (per-user namespace)
│   ├── queryClient.ts        # TanStack Query client instantie
│   ├── queryKeys.ts          # Gecentraliseerde query key constanten
│   ├── statusMaps.ts         # Status label + kleurkaarten (alle entiteiten)
│   ├── supabase.ts           # Supabase client (getypeerd via Database); in DEV_MODE gewrapped via adapter
│   └── supabaseLocal.ts      # Supabase-compatible localStorage adapter voor DEV_MODE (LocalQueryBuilder)
├── pages/                   # 40 pagina-componenten (lazy-loaded via routes)
│   ├── AdminPage.tsx
│   ├── BestiariesPage.tsx
│   ├── BestiaryDetailPage.tsx
│   ├── BestiaryEditPage.tsx
│   ├── CampaignDetailPage.tsx
│   ├── CampaignEditPage.tsx
│   ├── CampaignItemsPage.tsx
│   ├── CampaignsPage.tsx
│   ├── CharacterDetailPage.tsx
│   ├── CharacterEditPage.tsx
│   ├── CharactersPage.tsx
│   ├── DashboardPage.tsx
│   ├── EncounterDetailPage.tsx
│   ├── EncounterEditPage.tsx
│   ├── EncounterRunPage.tsx  # Live gevechtsrunner: initiatiefvolgorde, HP tracking, d20 rolls
│   ├── EncountersPage.tsx
│   ├── ItemEditPage.tsx
│   ├── LocationDetailPage.tsx
│   ├── LocationEditPage.tsx
│   ├── LocationsPage.tsx
│   ├── LoginPage.tsx
│   ├── LootGeneratorPage.tsx # AI-aangedreven itemgenerator met bulk-aanmaken
│   ├── LoreDetailPage.tsx
│   ├── LoreEditPage.tsx
│   ├── LoresPage.tsx
│   ├── NpcDetailPage.tsx
│   ├── NpcEditPage.tsx
│   ├── NpcsPage.tsx
│   ├── QuestDetailPage.tsx
│   ├── QuestEditPage.tsx
│   ├── QuestsPage.tsx
│   ├── RegisterPage.tsx
│   ├── SessionDetailPage.tsx
│   ├── SessionEditPage.tsx
│   ├── SessionsPage.tsx
│   ├── SettingsPage.tsx
│   ├── WorldBuilderPage.tsx  # AI Wereldbouwer: vrije prompt + shortcuts voor Lore Forge
│   ├── WorldDetailPage.tsx
│   ├── WorldEditPage.tsx
│   └── WorldsPage.tsx
├── routes/
│   ├── index.tsx             # React Router config + auth loaders
│   ├── loaders.ts            # requireAuth / requireAdmin loader functies
│   ├── PageLoader.tsx        # Suspense fallback component
│   └── RouteErrorPage.tsx    # Route-level error boundary pagina
├── stores/
│   ├── auth.store.ts
│   ├── campaign.store.ts
│   ├── preferences.store.ts
│   └── ui.store.ts
├── test/
│   ├── setup.ts              # Vitest setup (jsdom, @testing-library)
│   ├── auth-loaders.test.ts
│   ├── Input.test.tsx
│   ├── Modal.test.tsx
│   └── useEntityEdit.test.ts
├── types/
│   ├── database.types.ts     # Auto-gegenereerd via Supabase CLI
│   ├── ai.ts                 # Provider, Message, AIResponse, ErrorResponse
│   ├── bestiary.types.ts
│   ├── campaign.types.ts
│   ├── character.types.ts
│   ├── encounter.types.ts
│   ├── item.types.ts
│   ├── location.types.ts
│   ├── lore.types.ts
│   ├── npc.types.ts
│   ├── player_note.types.ts  # PlayerNote + PlayerNoteWithCharacter
│   ├── quest.types.ts
│   ├── session.types.ts
│   └── world.types.ts
└── utils/
    ├── apiError.ts           # getApiError() voor serverless responses
    ├── cn.ts                 # clsx + tailwind-merge
    ├── equipmentUtils.ts     # Equipment slots: labels, icons, ALLOWED_SLOTS_BY_TYPE, calculateEffectiveStats, getEquippedItemsBySlot, formatItemBonuses
    ├── pickGradient.ts       # Hash-gebaseerde gradient paletten per entity-type
    └── sanitizeUrl.ts        # sanitizeImageUrl() — valideert HTTPS URLs

api/
└── admin/
    ├── _auth.ts              # verifyAdmin() middleware
    ├── users.ts              # GET (lijst) + POST (aanmaken)
    └── users/[id].ts         # PATCH (bewerken) + DELETE

supabase/
├── migrations/               # SQL-migraties (genummerd, chronologisch)
└── functions/
    └── ai-chat/              # Supabase Edge Function voor AI content generatie
        ├── index.ts          # Hoofd handler (auth, BYOK, routing, rate limiting)
        ├── types.ts          # Gedeelde types (Provider, Message, AIResponse, etc.)
        ├── providers.ts      # callGroq(), callGemini(), callAnthropic(), callOpenAI()
        ├── config.ts         # AI_CONFIG (rate limits, modellen, system prompt)
        └── ratelimit.ts      # getUserUsage(), getOrgUsage(), routeRequest(), incrementUsage()
```

### Path alias

De `@`-alias is geconfigureerd in zowel `vite.config.ts` als `tsconfig.app.json`:

```ts
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
```

---

## Componentconventies

### Herbruikbare UI-componenten (`src/components/ui/`)

Elk basis-component:
- Exporteert een `Props`-type via `React.ComponentPropsWithoutRef`
- Accepteert een `className`-prop via `cn()` (clsx + tailwind-merge)
- Is forward-ref-compatibel waar van toepassing
- Heeft een korte JSDoc-regel boven de functiedefinitie bij niet-evidente props

Beschikbare componenten:
- `Button` — varianten: `primary`, `secondary`, `ghost`, `danger`; maten: `sm`, `md`, `lg`; `loading` boolean
- `Input` — met label, foutmelding en aria-koppeling (`htmlFor`/`id`/`aria-describedby`)
- `Modal` — met focus trap, `role="dialog"`, `aria-modal="true"`
- `Spinner` — laadstatus-indicator; maten: `sm`, `md`, `lg`
- `Badge` — status-labels (semantisch neutraal)
- `Card` — content-containers
- `Avatar` — initials-weergave voor users/NPCs
- `Breadcrumbs` / `Breadcrumb` — navigatie-breadcrumbs met items array
- `ConfirmDialog` — herbruikbare bevestigingsdialoog (gebruikt voor verwijderen)
- `EmptyState` — lege staat placeholder voor overzichtspagina's
- `EntityCard` — generieke entiteitskaart (basis voor alle feature cards)
- `EntityCardSkeleton` — skeleton-loader variant van EntityCard
- `ForgeCard` — generieke "nieuw aanmaken" placeholder-kaart (basis voor ForgeXxxCard)
- `Skeleton` — inline skeleton-loader blok
- `StatusBadge` — badge met automatische kleur uit `statusMaps`

### Feature-componenten (`src/components/[feature]/`)

Elk feature-domein heeft een map: `campaign/`, `session/`, `world/`, `admin/`, `bestiary/`, `character/`, `encounter/`, `item/`, `location/`, `lore/`, `npc/`, `quest/`.

**Forge-patroon:** elke lijst heeft een `Forge[Entity]Card` naast `[Entity]Card`. De ForgeCard is een placeholder-kaart waarmee een nieuwe entiteit direct aangemaakt wordt (click → mutation → redirect naar edit). De generieke `ForgeCard` UI-component is de basis; feature-specifieke ForgeCards wikkelen hier een mutation omheen.

**Sessie-specifieke componenten (`src/components/session/`):**
- `DmPlayerNotesPanel` — DM-overzicht van alle spelernotities voor een sessie; collapsibele notitiekaarten met karakter-koppeling
- `PlayerNotepad` — speler-notitieblok met debounced autosave, karakter-associatie en tijdstempel van laatste opslag
- `StoryArcTracker` — tijdlijn-visualisatie van alle sessies in een kroniek; sessienummers als Romeinse cijfers; `onForge` callback voor nieuwe sessie

### Generieke hooks (`src/hooks/`)

- **`useEntityEdit<T>`** — standaard edit-form state: `form`, `set(key, value)`, `dirty`, `committed`, `deleteOpen`, `resetForm`, `guard`. Gebruik voor alle edit-pagina's.
- **`useEditGuard`** — blokkeert navigeren weg bij unsaved + uncommitted changes.
- **`useImagePositioning`** — mouse/touch drag-to-reposition voor header images.
- **`useOnlineStatus`** — geeft `boolean` terug; luistert naar `window` `online`/`offline` events.
- **`useUnsavedChangesPrompt`** — browser `beforeunload` dialog bij dirty forms.
- **`useAI`** — AI chat integratie: `{ ask, loading, windowRemaining, windowResetsAt, lastProvider, lastModel }`.

### Query hooks (`src/hooks/queries/`)

Eén hook per entity type. Elke query hook bevat typisch `useQuery` voor fetching en `useMutation` met cache-invalidatie. Importeer via:

```ts
import { useCampaign, useCampaignWithWorld } from '@/hooks/queries/useCampaign'
import { useWorldBestiaries } from '@/hooks/queries/useWorldBestiaries'
import { useEncounterMonsters } from '@/hooks/queries/useEncounterMonsters'
import { useMySessionNote, useSessionPlayerNotes, useSavePlayerNote } from '@/hooks/queries/usePlayerNotes'
import { useUserAISettings, useSetByokKey } from '@/hooks/queries/useUserAISettings'
```

---

## Design System

### CSS-variabelen (globaal)

Gedefinieerd op `:root` in `src/index.css`, beschikbaar via `var(--naam)`:

| Groep | Variabelen |
|---|---|
| Achtergrond | `--void`, `--void-2`, `--surface`, `--surface-2`, `--surface-3` |
| Accent | `--violet`, `--gold`, `--teal`, `--crimson`, `--azure` |
| Tekst | `--ink`, `--ink-soft`, `--muted`, `--subtle` |
| Borders | `--hairline`, `--hairline-strong` |
| Spacing | `--sp-1` t/m `--sp-4` |
| Typography | `--font-display`, `--font-body` |
| Animatie | `--t-fast`, `--t-base`, `--ease-out` |
| Radius | `--r-full`, `--r-xl` |

### Kleurthema

Dark theme (void/indigo/gold). Nooit hardcoded HEX-waarden gebruiken buiten de variabele-definitie zelf.

### Kaart-gradients (`src/utils/pickGradient.ts`)

Alle entiteitskaarten gebruiken `pickGradient(id, gradients)` voor een deterministische gradient op basis van de eerste en laatste karakter van het entity-ID. Er zijn aparte paletten per entity-type:

| Palet | Gebruik |
|---|---|
| `coverGradients` | Hero cards (WorldCard, CampaignDetailPage header) |
| `accentGradients` | Compacte campaign cards (standaard) |
| `sessionGradients` | SessionCard (zijdelings, lichter) |
| `locationGradients` | LocationCard (teal-tinted) |
| `loreGradients` | LoreCard (violet-tinted) |
| `npcGradients` | NpcCard (crimson-tinted) |
| `characterGradients` | CharacterCard (azure-tinted) |
| `bestiaryGradients` | BestiaryCard (diep teal/groen) |
| `encounterGradients` | EncounterCard (crimson/gevaar) |
| `itemGradients` | ItemCard (goud/crimson) |
| `questGradients` | QuestCard (goud-tinted) |

Geen externe kleurprop nodig; importeer het juiste palet en geef het door aan `pickGradient`.

### Equipment utilities (`src/utils/equipmentUtils.ts`)

Gebruik voor alle logica rond uitrusting — nooit hardcoded in componenten:

| Export | Beschrijving |
|---|---|
| `EQUIPMENT_SLOT_LABELS` | `Record<EquipmentSlot, string>` — Nederlandse slot-namen (Hoofd, Hals, Torso, …) |
| `EQUIPMENT_SLOT_ICONS` | `Record<EquipmentSlot, string>` — Emoji per slot |
| `ALLOWED_SLOTS_BY_TYPE` | `Record<ItemType, EquipmentSlot[]>` — Welke slots geldig zijn per item-type; potions/scrolls hebben `[]` (niet uitrustbaar) |
| `isEquippable(itemType)` | Retourneert `true` als het item-type uitrustbaar is |
| `calculateEffectiveStats(character, equippedItems)` | Sommeert alle stat-bonussen van uitgeruste items, retourneert `EffectiveStats` |
| `getEquippedItemsBySlot(items)` | Geeft `Partial<Record<EquipmentSlot, Item>>` terug voor snelle slot-lookup |
| `formatItemBonuses(props)` | Formatteert niet-nul bonussen als leesbare strings (bijv. `+2 AC`) |

### Status-kleuren en -labels (`src/lib/statusMaps.ts`)

Gebruik altijd `statusMaps` voor het weergeven van statussen — nooit hardcoded labels of kleuren. Exporteert `[entity]StatusLabel`, `[entity]StatusColor`, `itemRarityLabel`, `itemRarityColor`, `itemTypeLabel` voor alle entity-types.

### Header-afbeelding positie

`WorldEditPage` en `CampaignEditPage` ondersteunen drag-to-reposition van de header-afbeelding via `useImagePositioning` (mouse + touch events). De positie wordt opgeslagen als `"X% Y%"` string en teruggelezen als `object-position` op het `<img>`-element.

Hetzelfde patroon geldt voor **karakterportretten**: `portrait_url` + `portrait_position` op de `characters`-tabel (migraties 033–034); drag-reposition via `useImagePositioning`.

---

## Toast-gebruik (Sonner)

Alle gebruikersfeedback verloopt via Sonner toasts. De `<Toaster />` staat in `App.tsx`.

```ts
import { toast } from 'sonner';

toast.success('Wereld opgeslagen');
toast.error('Opslaan mislukt');
toast.loading('Bezig met genereren...');
toast.promise(saveWorld(), {
  loading: 'Opslaan...',
  success: 'Wereld opgeslagen',
  error: 'Opslaan mislukt',
});
```

Regels:
- Succesmeldingen: altijd via `toast.success`
- Foutmeldingen: altijd via `toast.error` (nooit alleen console.error)
- Langlopende acties: `toast.promise` of `toast.loading` → `toast.dismiss`
- Geen `alert()` of `confirm()` gebruiken

---

## State Management

### Zustand (client state)

- Één store per domein: `useAuthStore`, `useCampaignStore`, `useUIStore`, `usePreferencesStore`
- Persist alleen wat nodig is (geen gevoelige data)
- Store-bestanden: `src/stores/[domain].store.ts`
- `usePreferencesStore` isoleert per gebruiker: storage key = `'preferences:${userId}'`

| Store | State | Opgeslagen |
|---|---|---|
| `auth.store.ts` | `user`, `profile` | ja (`'auth'`) |
| `campaign.store.ts` | `activeCampaignId` | ja (`'campaign'`) |
| `ui.store.ts` | `sidebarCollapsed` | nee |
| `preferences.store.ts` | `sessionReminders`, `soundEffects`, `autosaveNotes`, `loreSuggestions`, `language` | ja (per user) |

### TanStack Query (server state)

- Query keys zijn arrays, geëxporteerd als constanten vanuit `src/lib/queryKeys.ts`
- Mutations invalideren altijd de relevante queries na succes
- Optimistic updates voor snelle UI-feedback waar zinvol
- `staleTime` instellen per query-type (geen globale standaard van 0)
- Alle query/mutation logica in `src/hooks/queries/` — nooit inline in pagina's

---

## DEV_MODE (offline development)

Wanneer `VITE_DEV_MODE=true` in de omgeving staat, worden alle Supabase database-calls onderschept en gerouteerd naar localStorage via een compatibele adapter. Auth en storage blijven op de echte Supabase client.

### Hoe het werkt

| Bestand | Rol |
|---|---|
| `src/lib/constants.ts` | Exporteert `DEV_MODE: boolean` (`VITE_DEV_MODE === 'true'`) |
| `src/lib/localDb.ts` | CRUD-laag op localStorage; namespace `pangu-dev-db:<userId>` |
| `src/lib/supabaseLocal.ts` | `createLocalSupabaseAdapter()` wraps de Supabase client zodat `.from()` → `LocalQueryBuilder` → `localDb` gaat |

### Ondersteunde query-patronen (LocalQueryBuilder)

- `.select('*').eq().order().limit()`
- `.select('*').eq().single()` / `.maybeSingle()`
- `.select('*, alias:table(cols)').eq().single()` — join-resolutie via `${alias}_id` FK
- `.select('*').eq().eq()` — meerdere eq-filters
- `.select('*').in(field, vals)` — IN-filter
- `.not(field, 'is', null)` — NOT NULL filter
- `.insert({}).select().single()` — insert + return
- `.insert([])` — bulk insert
- `.update({}).eq('id', id)`
- `.delete().eq('id', id)` en bulk delete via filters

### Admin dev modus toggle

In de Admin-pagina (`/admin`) kan de dev-modus run-time worden in/uitgeschakeld. Bij uitschakelen worden de cache gewist en de DB-data herladen vanuit Supabase.

---

## Supabase

- Client: `src/lib/supabase.ts` — één instantie, getypeerd via `createClient<Database>`; in DEV_MODE gewrapped via `createLocalSupabaseAdapter`
- RLS (Row Level Security) is altijd ingeschakeld op alle tabellen
- Migraties in `supabase/migrations/`
- Types regenereren: `npx supabase gen types typescript --local > src/types/database.types.ts`

### Domain types (`src/types/`)

Naast de auto-gegenereerde `database.types.ts` zijn er handmatige domain-types:

```ts
// world.types.ts
type WorldStatus = 'draft' | 'active' | 'archived'

// campaign.types.ts
type CampaignStatus = 'draft' | 'active' | 'archived' | 'completed'

// session.types.ts
type SessionStatus = 'planned' | 'active' | 'completed' | 'archived'

// location.types.ts
type LocationStatus = 'draft' | 'active' | 'discovered' | 'archived'

// npc.types.ts
type NpcStatus = 'draft' | 'active' | 'retired' | 'archived'

// lore.types.ts
type LoreStatus = 'draft' | 'active' | 'archived'

// bestiary.types.ts
type BestiaryStatus = 'draft' | 'active' | 'archived'

// quest.types.ts
type QuestStatus = 'draft' | 'active' | 'completed' | 'failed' | 'archived'

// encounter.types.ts
type EncounterStatus = 'draft' | 'ready' | 'active' | 'completed' | 'archived'

// item.types.ts
type ItemType = 'weapon' | 'armor' | 'potion' | 'ring' | 'rod' | 'scroll' | 'staff' | 'wand' | 'wondrous' | 'misc'
type ItemRarity = 'common' | 'uncommon' | 'rare' | 'very_rare' | 'legendary' | 'artifact'
type EquipmentSlot = 'head' | 'neck' | 'chest' | 'cloak' | 'gloves' | 'ring1' | 'ring2' | 'boots' | 'main_hand' | 'off_hand'
interface ItemStatBonuses { ac_bonus?, str_bonus?, dex_bonus?, con_bonus?, int_bonus?, wis_bonus?, cha_bonus?, hp_bonus?, speed_bonus?, initiative_bonus?, attack_bonus?, damage_bonus?, damage_dice?, stealth_disadvantage?, skill_bonuses? }
// Item has: equipped_slot: EquipmentSlot | null, properties: ItemStatBonuses

// character.types.ts
type CharacterStatus = 'active' | 'inactive' | 'retired' | 'archived'

// player_note.types.ts
interface PlayerNote { id, session_id, user_id, character_id, content, updated_at }
interface PlayerNoteWithCharacter extends PlayerNote { character: { name, character_class } | null }

// ai.ts
type Provider = 'groq' | 'gemini' | 'anthropic' | 'openai'
interface AIResponse { reply, provider, model, window_remaining }
interface ErrorResponse { error, code, window_resets_at? }
```

### Database tabellen (via `database.types.ts`)

| Tabel | Scope | Beschrijving |
|---|---|---|
| `profiles` | global | Gebruikersprofielen met rol (`user`/`admin`) |
| `worlds` | user | DM-owned campaign settings |
| `campaigns` | world | Kronieken binnen een wereld |
| `sessions` | campaign | Spelsessies binnen een kroniek |
| `locations` | campaign | Locaties binnen een kroniek |
| `npcs` | campaign | NPCs binnen een kroniek |
| `lore` | campaign | Lore-items binnen een kroniek |
| `bestiaries` | world | Wezens/monsters (D&D stat blocks) |
| `characters` | user | Spelerkarakters (globaal, optioneel campaign-gekoppeld) |
| `encounters` | campaign | Gevechtsencounters (optioneel sessie-gekoppeld) |
| `encounter_monsters` | encounter | Junction: wezens met aantallen per encounter |
| `items` | campaign | Items/loot (DM-pool of toegewezen aan karakter) |
| `quests` | campaign | Quests binnen een kroniek |
| `player_notes` | session | Spelernotities per sessie (unique per session_id + user_id) |

Alle tabellen hebben `committed boolean DEFAULT false` — bestaande rijen zijn `true`, nieuwe forge-aanmaak start als `false` (redirect naar edit voor invulling).

### Migraties (chronologisch)

| # | Bestand | Inhoud |
|---|---|---|
| 001 | `001_profiles.sql` | Profiles tabel + RLS + `handle_new_user` trigger |
| 002 | `002_profile_settings.sql` | Profile settings |
| 003 | `003_worlds.sql` | Worlds tabel + RLS |
| 004 | `004_worlds_header_image_position.sql` | Header image positie voor worlds |
| 005 | `005_campaigns.sql` | Campaigns tabel + RLS |
| 006 | `006_campaigns_header_image.sql` | Header image + positie voor campaigns |
| 007 | `007_sessions.sql` | Sessions tabel + RLS + `update_sessions_updated_at` trigger |
| 008 | `008_locations.sql` | Locations tabel + RLS |
| 009 | `009_lore.sql` | Lore tabel + RLS |
| 010 | `010_npcs.sql` | NPCs tabel + RLS |
| 011 | `011_worlds_updated_at.sql` | `updated_at` trigger voor worlds |
| 012 | `012_campaigns_updated_at.sql` | `updated_at` trigger voor campaigns |
| 013 | `013_missing_indexes.sql` | Ontbrekende indexes |
| 014 | `014_characters.sql` | Characters tabel + RLS (D&D stat block) |
| 015 | `015_bestiaries.sql` | Bestiaries tabel + RLS + index op `(world_id, created_at DESC)` |
| 016 | `016_fix_characters_updated_at.sql` | Fix `updated_at` trigger voor characters |
| 017 | `017_avatar.sql` | Avatar kolom op profiles |
| 018 | `018_quests.sql` | Quests tabel + RLS |
| 019 | `019_campaign_id_to_characters.sql` | `campaign_id` FK op characters |
| 020 | `020_encounters.sql` | Encounters + `encounter_monsters` junction tabel + RLS |
| 021 | `021_items.sql` | Items tabel + RLS |
| 022 | `022_characters_proficient_skills.sql` | `proficient_skills text[]` op characters |
| 023 | `023_profile_ai_keys.sql` | `byok_keys jsonb` op profiles (Anthropic + OpenAI) |
| 024 | `024_ai_usage.sql` | `ai_usage` + `ai_org_usage` tabellen + RLS + atomische RPC-functies |
| 025 | `025_worlds_campaigns_notes.sql` | `notes text` kolom op worlds en campaigns |
| 026 | `026_committed_column.sql` | `committed boolean` op alle entity-tabellen |
| 027 | `027_item_equipped_slot.sql` | `equipped_slot text` op items + unique index per (character_id, slot) |
| 028 | `028_atomic_ai_claim.sql` | `claim_ai_request()` PostgreSQL functie — atomische rate-limit claim (check + increment in één statement) |
| 029 | `029_encounter_monsters_rls.sql` | Fix `encounter_monsters` RLS: encounter ownership verificatie toegevoegd aan policy |
| 030 | `030_org_usage_upsert.sql` | Fix `increment_org_groq_usage()`: UPSERT i.p.v. bare UPDATE om stille nul-rijen te voorkomen |
| 031 | `031_character_proficiencies.sql` | D&D 5.5e: 15 kolommen op characters — saving throws, expertise, talen, bekwaamheden, inspiration, hit die, death saves, exhaustion, uitlijning, roleplay traits |
| 032 | `032_character_extended.sql` | D&D 5.5e uitbreiding: temp HP, spreuken (spell_slots jsonb), concentratie, feats, weapon masteries, condities, klasseresources, platina/elektrum, alternatieve snelheden, zintuigen, uiterlijk |
| 033 | `033_character_portrait.sql` | `portrait_url text` kolom op characters |
| 034 | `034_character_portrait_position.sql` | `portrait_position text DEFAULT 'center'` kolom op characters |
| 035 | `035_player_notes.sql` | `player_notes` tabel + RLS: spelers zien eigen notities, DM ziet alle notities voor campaign-sessies; unique index op (session_id, user_id) |

---

## AI-integratie (Lore Forge)

### Frontend (`src/hooks/useAI.ts`)

```ts
const { ask, loading, windowRemaining, windowResetsAt, lastProvider, lastModel } = useAI()

// Gebruik
await ask({ messages: [{ role: 'user', content: prompt }] })
```

### Backend (`supabase/functions/ai-chat/`)

- **Cascaderende free-tier providers:** Groq (llama-3.3-70b) → Gemini 2.5 Flash-Lite
- **BYOK:** Anthropic + OpenAI via `byok_keys jsonb` op het gebruikersprofiel
- **Per-user rate limiting:** configureerbaar via `config.ts` (standaard 5 req / 5 uur)
- **Org-level Groq soft cap:** configureerbaar max requests/dag
- **Usage tracking:** `ai_usage` (per user), `ai_org_usage` (org-breed)
- **System prompt:** "Pangu Oracle" DM-assistent persona (in `config.ts`)

Routing-beslissing: BYOK keys aanwezig → gebruik BYOK provider. Anders: Groq (gratis) → Gemini (gratis) → rate-limit fout.

---

## Routing

Routes zijn gedefinieerd in `src/routes/index.tsx`. Lazy-loading voor alle pagina-routes via React Suspense + `PageLoader` fallback.

### Huidige routes

| Route | Pagina | Auth |
|---|---|---|
| `/` | redirect → `/dashboard` | — |
| `/login` | `LoginPage` | nee (AuthLayout) |
| `/register` | `RegisterPage` | nee (AuthLayout) |
| `/dashboard` | `DashboardPage` | `requireAuth` |
| `/admin` | `AdminPage` | `requireAdmin` |
| `/settings` | `SettingsPage` | `requireAuth` |
| `/worlds` | `WorldsPage` | `requireAuth` |
| `/worlds/:id` | `WorldDetailPage` | `requireAuth` |
| `/worlds/:id/edit` | `WorldEditPage` | `requireAuth` |
| `/worlds/:id/world-builder` | `WorldBuilderPage` | `requireAuth` |
| `/campaigns` | `CampaignsPage` | `requireAuth` |
| `/campaigns/:id` | `CampaignDetailPage` | `requireAuth` |
| `/campaigns/:id/edit` | `CampaignEditPage` | `requireAuth` |
| `/campaigns/:id/sessions` | `SessionsPage` | `requireAuth` |
| `/campaigns/:id/locations` | `LocationsPage` | `requireAuth` |
| `/campaigns/:id/lore` | `LoresPage` | `requireAuth` |
| `/campaigns/:id/npcs` | `NpcsPage` | `requireAuth` |
| `/campaigns/:id/quests` | `QuestsPage` | `requireAuth` |
| `/campaigns/:id/encounters` | `EncountersPage` | `requireAuth` |
| `/campaigns/:id/items` | `CampaignItemsPage` | `requireAuth` |
| `/campaigns/:id/loot-generator` | `LootGeneratorPage` | `requireAuth` |
| `/campaigns/:id/factions` | `FactionsPage` | `requireAuth` |
| `/factions/:id` | `FactionDetailPage` | `requireAuth` |
| `/factions/:id/edit` | `FactionEditPage` | `requireAuth` |
| `/sessions/:id` | `SessionDetailPage` | `requireAuth` |
| `/sessions/:id/edit` | `SessionEditPage` | `requireAuth` |
| `/locations/:id` | `LocationDetailPage` | `requireAuth` |
| `/locations/:id/edit` | `LocationEditPage` | `requireAuth` |
| `/lore/:id` | `LoreDetailPage` | `requireAuth` |
| `/lore/:id/edit` | `LoreEditPage` | `requireAuth` |
| `/npcs/:id` | `NpcDetailPage` | `requireAuth` |
| `/npcs/:id/edit` | `NpcEditPage` | `requireAuth` |
| `/worlds/:id/bestiary` | `BestiariesPage` | `requireAuth` |
| `/bestiary/:id` | `BestiaryDetailPage` | `requireAuth` |
| `/bestiary/:id/edit` | `BestiaryEditPage` | `requireAuth` |
| `/quests/:id` | `QuestDetailPage` | `requireAuth` |
| `/quests/:id/edit` | `QuestEditPage` | `requireAuth` |
| `/encounters/:id` | `EncounterDetailPage` | `requireAuth` |
| `/encounters/:id/edit` | `EncounterEditPage` | `requireAuth` |
| `/encounters/:id/run` | `EncounterRunPage` | `requireAuth` |
| `/characters` | `CharactersPage` | `requireAuth` |
| `/characters/:id` | `CharacterDetailPage` | `requireAuth` |
| `/characters/:id/edit` | `CharacterEditPage` | `requireAuth` |
| `/items/:id/edit` | `ItemEditPage` | `requireAuth` |

### Auth loaders (`src/routes/loaders.ts`)

- `requireAuth` — redirect naar `/login` als geen sessie actief
- `requireAdmin` — redirect naar `/dashboard` als rol ≠ `'admin'`

---

## Testing

Tests staan in `src/test/`. Framework: **Vitest** met jsdom-environment en `@testing-library/react`.

```bash
npm run test        # Vitest (watch mode)
npm run type-check  # tsc --noEmit
npm run lint        # ESLint
```

Huidige testbestanden:
- `auth-loaders.test.ts` — route loader logica
- `Input.test.tsx` — Input component
- `Modal.test.tsx` — Modal component
- `useEntityEdit.test.ts` — edit form hook

---

## Test-agent (Technisch + Visueel)

De test-agent voert vóór elke merge een volledige technische én visuele controle uit. Geen specifieke tooling is verplicht — de agent kiest de beschikbare tools op basis van de context.

### Verplichte checks

| Check | Methode |
|---|---|
| Unit + integratietests | `npm run test` — alle tests moeten slagen |
| TypeScript | `npm run type-check` — nul fouten |
| Linting | `npm run lint` — nul warnings/errors |
| Visuele controle | Screenshot-vergelijking of handmatige inspectie van gewijzigde componenten op alle breakpoints (360px, 768px, 1280px) |
| A11Y-scan | axe-core via browser DevTools, axe CLI of Playwright axe-plugin — nul critical/serious violations op gewijzigde pagina's |
| Responsiveness | Controleer op mobiel (360px), tablet (768px) en desktop (1280px): geen horizontale scroll, correcte navigatieweergave, touch targets ≥ 44×44px |

### Wanneer uitvoeren

- Vóór elke PR of push naar `main`
- Na elke significante UI-wijziging (nieuw component, layout-aanpassing, breakpoint-fix)

### Slagingscriteria

Alle checks moeten slagen. Bij een falende a11y-scan of visuele regressie: eerst fixen, dan pas mergen. Geen uitzonderingen.

---

## Review-agent

De review-agent beoordeelt drie dimensies van elke wijziging. Bevindingen van categorie **blocker** moeten opgelost zijn vóór merge; **suggesties** kunnen na merge opgepakt worden.

### 1. Code review (correctheid)

- Bugs, type-onveiligheid en logicafouten
- TypeScript strict-naleving — geen `any`, geen `@ts-ignore` zonder uitleg
- Componentgrootte ≤ ~150 regels; business logica in hooks, niet in presentationele componenten
- Query-logica in `src/hooks/queries/` — nooit inline in pagina-componenten
- Geen directe Supabase-calls buiten `@/lib/supabase`
- Foutafhandeling alleen aan systeemgrenzen (gebruikersinput, externe APIs)

### 2. A11Y review

- Volledige A11Y-checklist (zie hieronder) doorlopen op alle gewijzigde componenten en pagina's
- Focus management na route-wijzigingen en modal-openingen
- `aria-live` regio's aanwezig voor dynamische inhoud (toasts, laadstates, formulierfouten)
- Geen `outline: none` zonder een zichtbare custom focus-stijl als vervanging
- Screen reader-naamgeving correct via semantisch HTML, `aria-label` of `aria-labelledby`

### 3. Responsive review

- Visuele inspectie op alle drie breakpoints (< 640px, 640–900px, > 900px)
- Sidebar/navigatie-gedrag correct: 240px left rail op desktop, bottom bar op mobiel
- Grids en lijsten breken correct af; geen overlappende of afgeknipte elementen
- Touch targets ≥ 44×44px op alle interactieve elementen op mobiel
- Formulieren en modals bruikbaar en scrollbaar op smal scherm

---

## A11Y-checklist

Elke feature is pas **klaar** als alle punten gehaald zijn. A11Y is niet optioneel — geen merge zonder groene checklist.

### Contrast & kleur

- [ ] Tekstcontrast ≥ 4.5:1; UI-component contrast ≥ 3:1 (WCAG 1.4.11)
- [ ] Kleurcontrast gecheckt vóór elk PR (browser DevTools accessibility panel of axe)
- [ ] Informatie nooit uitsluitend via kleur overgebracht

### Focus & toetsenbord

- [ ] Focus ring zichtbaar op alle interactieve elementen; geen `outline: none` zonder zichtbare custom stijl als vervanging
- [ ] Tab-volgorde logisch en voorspelbaar (volgt visuele leesvolgorde)
- [ ] `Escape` sluit modals, dropdowns en popovers
- [ ] Pijltjestoetsen navigeren binnen lijsten, menu's en radio-groepen (roving tabindex waar van toepassing)

### Semantiek & structuur

- [ ] Semantisch HTML (`nav`, `main`, `header`, `section`, `button`, `ul`/`li`, etc.)
- [ ] Één `<h1>` per pagina; koppenstructuur hiërarchisch (h1 → h2 → h3)
- [ ] Landmarks aanwezig: `<nav>`, `<main>`, `<header>`

### Forms & feedback

- [ ] Velden gekoppeld via `htmlFor`/`id`; fouten via `aria-describedby`
- [ ] Foutmeldingen beschrijvend en gelinkt aan het veld
- [ ] Laadstates en statuswijzigingen aangekondigd via `aria-live="polite"` of `role="status"`

### Componenten

- [ ] Icon-only knoppen hebben `aria-label`; decoratieve SVGs hebben `aria-hidden="true"`
- [ ] Modals hebben `role="dialog"` + `aria-modal="true"` + focus trap; focus keert terug naar trigger na sluiting
- [ ] Screen reader-only hulptekst via `.sr-only` klasse (niet via `display: none` of `visibility: hidden`)

### Mobiel & motion

- [ ] Touch targets ≥ 44×44px
- [ ] `prefers-reduced-motion` gerespecteerd (geen animaties forceren)
- [ ] Geen horizontale scroll op mobiel (< 640px)

---

## Responsiveness

Alle UI is **mobile-first** en werkt op mobiel, tablet en desktop. Dit is een harde eis, geen nice-to-have.

| Breakpoint | Breedte | Navigatie |
|---|---|---|
| Mobiel | < 640px | Bottom navigation bar (64px hoogte) |
| Tablet | 640–900px | Bottom navigation bar (64px hoogte) |
| Desktop | > 900px | Left sidebar rail (240px breedte), inklapbaar |

### Regels

- **Mobile-first:** Tailwind-classes beginnen zonder prefix (mobiel), dan `sm:`, `md:`, `lg:`
- **Grids:** `grid-cols-1` op mobiel → `grid-cols-2` op `sm:` → `grid-cols-3` of `grid-cols-4` op `lg:`
- **Geen vaste breedtes** in `px` op elementen die de viewport kunnen overschrijden
- **Geen horizontale scroll:** body heeft geen `overflow-x`; tabellen zitten in een `overflow-x-auto` wrapper
- **Formulieren en modals:** max-breedte beperkt (`max-w-lg`), gecentreerd, scrollbaar bij smalle viewport
- **Afbeeldingen:** altijd `w-full` of `max-w-full` — nooit buiten hun container

---

## Ontwikkelregels

1. **Geen comments die uitleggen wát de code doet** — alleen waaróm (verborgen constraints, workarounds, niet-evidente invarianten).
2. **Geen halve implementaties** — een feature is af of staat achter een feature flag.
3. **Geen onnodige abstracties** — drie vergelijkbare regels zijn beter dan een premature helper.
4. **Foutafhandeling alleen aan systeemgrenzen** — gebruikersinput, externe APIs. Vertrouw interne code en framework-garanties.
5. **TypeScript strict** — geen `any`, geen `@ts-ignore` zonder uitleg.
6. **Elke nieuwe feature documenteren** in de Feature Status hieronder.
7. **Query logica in `src/hooks/queries/`** — nooit inline TanStack Query in pagina-componenten.
8. **Status labels/kleuren via `statusMaps`** — nooit hardcoded in componenten.
9. **Gradients via `pickGradient`** — importeer het juiste palet uit `pickGradient.ts`.
10. **`useEntityEdit` voor edit-pagina's** — standaard hook voor form state, dirty tracking, delete dialoog.
11. **Equipment logica via `equipmentUtils`** — nooit slot-labels, -icons of stat-calculaties hardcoden; gebruik `EQUIPMENT_SLOT_LABELS`, `ALLOWED_SLOTS_BY_TYPE`, `calculateEffectiveStats`, etc.
12. **Geen directe DB-calls buiten DEV_MODE-context** — `supabase.ts` exporteert de (eventueel gewrapped) client; importeer altijd via `@/lib/supabase`.
13. **A11Y is niet optioneel** — de volledige A11Y-checklist is een harde exit-eis voor elke feature. Geen merge zonder groene checklist. Voer de axe-scan uit op elke gewijzigde pagina.
14. **Volledig responsive** — alle componenten werken op mobiel (< 640px), tablet (640–900px) en desktop (> 900px). Zie de Responsiveness-sectie. Geen horizontale scroll, geen afgeknipte elementen.

---

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # ESLint
npm run type-check   # tsc --noEmit
npm run test         # Vitest
```

---

## Feature Status

> Bijhouden welke features beschikbaar zijn in de app. Elke keer dat iets wordt afgerond, direct hier bijwerken.

### Infrastructuur
- [x] Vite + React 19 + TypeScript setup
- [x] TailwindCSS v4 configuratie + CSS design tokens (`src/index.css`)
- [x] Supabase client + types
- [x] TanStack Query client + gecentraliseerde query keys
- [x] Zustand stores (auth, campaign, ui, preferences)
- [x] react-router-dom v7 routing (lazy-loaded, auth guards)
- [x] Sonner toasts (`<Toaster />` in `App.tsx`)
- [x] PWA-configuratie (vite-plugin-pwa, manifest, icons)
- [x] Vercel serverless API (`api/admin/`)
- [x] `@`-path alias (Vite + TypeScript)
- [x] Vitest + jsdom test setup (`src/test/`)
- [x] `AuthInitializer` — Supabase auth state listener
- [x] `ErrorBoundary` — top-level React error boundary
- [x] DEV_MODE systeem — `VITE_DEV_MODE=true` schakelt localStorage-adapter in voor Supabase (`constants.ts`, `localDb.ts`, `supabaseLocal.ts`)

### UI Basis-componenten (`src/components/ui/`)
- [x] `Button` (variants: primary/secondary/ghost/danger, sizes: sm/md/lg, loading state)
- [x] `Input` (label, foutmelding, aria-koppeling)
- [x] `Modal` (focus trap, role="dialog", aria-modal)
- [x] `Spinner` (sizes: sm/md/lg)
- [x] `Badge`
- [x] `Card`
- [x] `Avatar` (initials-weergave)
- [x] `Breadcrumb` + `Breadcrumbs` (navigatie-breadcrumbs)
- [x] `ConfirmDialog` (herbruikbare bevestigingsdialoog)
- [x] `EmptyState` (lege staat placeholder)
- [x] `EntityCard` + `EntityCardSkeleton` (generieke entiteitskaart basis)
- [x] `ForgeCard` (generieke "nieuw aanmaken" placeholder)
- [x] `Skeleton` (inline skeleton-loader)
- [x] `StatusBadge` (status-badge met kleur uit statusMaps)

### Authenticatie
- [x] Login pagina (email + wachtwoord, validatie, redirect op rol)
- [x] Registratie pagina — formulier met naam, e-mail, wachtwoord + bevestiging; Supabase signup; e-mailbevestiging afhandeling
- [x] Supabase Auth integratie (`signInWithPassword`, `signOut`)
- [x] Protected routes (loaders: `requireAuth`, `requireAdmin`)
- [x] Auth store (Zustand) — `user`, `profile`, `setUser`, `setProfile`, `signOut`
- [x] Auto-profile aanmaken bij signup (`handle_new_user` trigger in `001_profiles.sql`)

### Admin
- [x] Profiles tabel + RLS (`001_profiles.sql`)
- [x] Profile settings tabel (`002_profile_settings.sql`)
- [x] Vercel serverless API (`api/admin/users.ts`, `api/admin/users/[id].ts`)
- [x] Admin pagina `/admin` — accountbeheer (lijst, aanmaken, bewerken, verwijderen)
- [x] Zelf-verwijdering-preventie in DELETE endpoint
- [x] Rol-gebaseerde navigatie (Accountbeheer zichtbaar voor admins)
- [x] Uitloggen via sidebar
- [x] Admin AI-testpaneel — "Test Gemini / Groq" knop met provider-badge, model-naam en resterend-verzoeken-teller
- [x] Admin dev modus toggle — schakel sync uit voor lokaal testen; cache wissen en DB-data herladen bij uitschakelen

### Instellingen
- [x] Instellingen pagina `/settings` (3 tabs: Profiel, Voorkeuren, Info)
- [x] Profiel-tab — naam, lidwoordkeuze, bio, avatar; email read-only
- [x] Voorkeuren-tab — sessieherinneringen, geluidseffecten, autosave, lore-suggesties, taal (nl/en/de/fr)
- [x] Info-tab — PANGU branding, versie, status, licentie
- [x] Preferences store (Zustand, per-gebruiker geïsoleerd via user ID)
- [x] BYOK keys — Anthropic + OpenAI API keys opslaan via `byok_keys jsonb` op profiel (`023_profile_ai_keys.sql`)

### Dashboard
- [x] Dashboard pagina `/dashboard` — recent: 4 werelden, 4 actieve campaigns, 6 geplande sessies
- [x] Begroeting met gebruikersnaam
- [x] Responsief grid-layout

### Werelden (DM)
- [x] Worlds tabel + RLS (`003_worlds.sql`)
- [x] Header image positie (`004_worlds_header_image_position.sql`)
- [x] DM-notities kolom (`025_worlds_campaigns_notes.sql`)
- [x] Werelden overzicht `/worlds` — grid met WorldCard + ForgeWorldCard, lege staat, responsief
- [x] Wereld aanmaken — direct aanmaken + redirect naar bewerken
- [x] Wereld bewerken `/worlds/:id/edit` — naam, subtitle, quote, beschrijving, DM-notities, header image + drag-to-reposition, status
- [x] Wereld verwijderen — met bevestigingsdialoog
- [x] Wereld detail `/worlds/:id` — breadcrumbs, WorldDetailHeader, WorldDetailDivider, DM-notities, campaigns lijst, bestiarium-link
- [x] Navigatie-item "Werelden" in sidebar

### Campaigns (DM)
- [x] Campaigns tabel + RLS (`005_campaigns.sql`)
- [x] Campaign header image (`006_campaigns_header_image.sql`)
- [x] DM-notities kolom (`025_worlds_campaigns_notes.sql`)
- [x] Campaign aanmaken (vanuit wereld detail, "+ Nieuwe kroniek") → direct redirect naar bewerken
- [x] Campaign bewerken `/campaigns/:id/edit` — volledig formulier, DM-notities, drag-to-reposition, status
- [x] Campaign verwijderen — met bevestigingsdialoog
- [x] Campaign detail `/campaigns/:id` — breadcrumbs, header, status badge, DM-notities, sessies lijst, actieknoppen
- [x] Campaign overzicht `/campaigns` — grid per wereld met CampaignCard + ForgeCampaignCard, lege staat

### Sessies
- [x] Sessies tabel + RLS (`007_sessions.sql`)
- [x] `update_sessions_updated_at` trigger
- [x] Sessie-overzicht per campaign `/campaigns/:id/sessions` — grid met SessionCard + ForgeSessionCard
- [x] Sessie aanmaken — direct aanmaken + redirect naar bewerken
- [x] Sessie bewerken `/sessions/:id/edit` — naam, subtitle, sessienummer, datum, status, beschrijving, DM-notities
- [x] Sessie-detailpagina `/sessions/:id` — breadcrumbs, header met sessienummer-, datum- en statusbadge, beschrijving, DM-notities
- [x] Sessie verwijderen — met bevestigingsdialoog
- [x] Spelernotities (`035_player_notes.sql`) — `PlayerNotepad` component met debounced autosave; `DmPlayerNotesPanel` voor DM-overzicht; `usePlayerNotes` query hook
- [x] Verhaallijntijdlijn — `StoryArcTracker` component met Romeinse sessienummers + `onForge` callback

### Wereld — Locaties
- [x] Locations tabel + RLS (`008_locations.sql`)
- [x] Locatie-overzicht per campaign `/campaigns/:id/locations`
- [x] Locatie aanmaken / bewerken / verwijderen
- [x] Locatie-detailpagina `/locations/:id` — breadcrumbs (wereld · kroniek · locaties), header met type- en statusbadge, beschrijving, DM-notities

### Wereld — NPCs
- [x] NPCs tabel + RLS (`010_npcs.sql`)
- [x] NPC-overzicht per campaign `/campaigns/:id/npcs`
- [x] NPC aanmaken / bewerken / verwijderen
- [x] NPC-detailpagina `/npcs/:id` — breadcrumbs, header met rol- en statusbadge, beschrijving, DM-notities

### Wereld — Lore
- [x] Lore tabel + RLS (`009_lore.sql`)
- [x] Lore-overzicht per campaign `/campaigns/:id/lore`
- [x] Lore-item aanmaken / bewerken / verwijderen
- [x] Lore-detailpagina `/lore/:id` — breadcrumbs, header met categorie- en statusbadge, beschrijving, DM-notities

### Wereld — Bestiarium
- [x] Bestiaries tabel + RLS (`015_bestiaries.sql`) — world-scoped, full D&D stat block (HP, AC, speed, 6 eigenschappen)
- [x] Bestiarium-overzicht per wereld `/worlds/:id/bestiary` — grid met BestiaryCard + ForgeBestiaryCard, lege staat
- [x] Wezen aanmaken — direct aanmaken + redirect naar bewerken
- [x] Wezen bewerken `/bestiary/:id/edit` — naam, subtitel, type, dreigingsniveau, leefgebied, status, HP/AC/snelheid, 6 eigenschappen, beschrijving, DM-notities
- [x] Wezen-detailpagina `/bestiary/:id` — breadcrumbs (wereld · bestiarium), header met type- en dreigingsbadges, stat block met modifiers, beschrijving, DM-notities
- [x] Wezen verwijderen — met bevestigingsdialoog
- [x] Bestiarium-link in wereld-detailpagina

### Karakter (Spelersperspectief)
- [x] Characters tabel + RLS (`014_characters.sql`) — global per user, full D&D stat block
- [x] `campaign_id` op characters (`019_campaign_id_to_characters.sql`) — karakter koppelen aan één kroniek
- [x] Karakters overzicht `/characters` — grid met CharacterCard + ForgeCharacterCard, zoekfilter
- [x] Karakter aanmaken — direct aanmaken + redirect naar bewerken
- [x] Karakter bewerken `/characters/:id/edit` — naam, klasse, subklasse, ras, level, XP, HP, AC, snelheid, initiatief, vaardigheidsbonus, 6 eigenschappen, vaardigheden (18 skills), schatkist, achtergrond, privénotities, kroniek-koppeling
- [x] Karakter-detailpagina `/characters/:id` — Stats/Vaardigheden/Lore/Inventaris/Spreuken tabs, inline HP ±1, XP-balk, eigenschappen-grid met modifiers, vaardigheidstab met proficiency-indicator + berekende modifiers, schatkist, inventaris met "Teruggeven aan DM"
- [x] Karakter verwijderen — met bevestigingsdialoog
- [x] Navigatie-item "Karakters" in sidebar
- [x] Karakters zichtbaar in kroniek-detailpagina (via campaign_id)
- [x] Vaardigheden (skill proficiencies) — `proficient_skills text[]` op characters (`022_characters_proficient_skills.sql`); 18 D&D 5e vaardigheden, klikbare toggle in edit, berekende modifiers in detail
- [x] D&D 5.5e — reddingsgooien, expertise, talen & bekwaamheden (`031_character_proficiencies.sql`); 3-state vaardigheids-cycle (geen → proficient → expertise); saving throw toggles; TagInput voor talen/wapens/uitrustingen/tools
- [x] D&D 5.5e — uitgebreide gevechtsstate (`031`/`032`): temp HP, inspiratie, hit dice, death saves (klikbare pips), exhaustion badge
- [x] D&D 5.5e — spreuken (`032_character_extended.sql`): spreuk-DC + aanvalsbonus, spreukslots 1-9 als klikbare pips, concentratie toggle; volledig Spreuken-tab in detailpagina
- [x] D&D 5.5e — klasseresources (`032`): vrij configureerbare resources (Ki-punten, Woede, etc.) met ±1 widget in detailpagina
- [x] D&D 5.5e — feats & weapon masteries als TagInput; uiterlijk (leeftijd/lengte/gewicht); alternatieve snelheden + duisterzicht; platina + elektrum valuta
- [x] D&D 5.5e — condities picker (17 condities) in Stats-tab van detailpagina
- [x] Karakterportret — `portrait_url` + `portrait_position` op characters (`033`/`034_character_portrait*.sql`); drag-to-reposition via `useImagePositioning`

### Items / Schatkist
- [x] Items tabel + RLS (`021_items.sql`) — campaign-scoped, character_id nullable (DM-pool vs toegewezen)
- [x] Item aanmaken vanuit kroniek-detailpagina — ForgeItemCard → redirect naar bewerken
- [x] Item bewerken `/items/:id/edit` — naam, type, zeldzaamheid, magisch, aantal, gewicht, beschrijving, toewijzen aan karakter
- [x] Items overzicht per kroniek `/campaigns/:id/items` — filter op alles/schatkist/karakter
- [x] Items in kroniek-detailpagina (DM-pool preview max 6 + "Alle items bekijken →")
- [x] Inventaris-tab in karakter-detailpagina — lijst van toegewezen items + "Teruggeven aan DM"
- [x] ItemCard + ForgeItemCard component (`src/components/item/ItemCard.tsx`)
- [x] Equipment slots — `equipped_slot text` op items (`027_item_equipped_slot.sql`); 10 slots (head/neck/chest/cloak/gloves/ring1/ring2/boots/main_hand/off_hand); uniek per character via partial index
- [x] `EquipmentSlot` type + `ItemStatBonuses` interface in `src/types/item.types.ts`
- [x] `equipmentUtils.ts` — slot-labels (NL), slot-icons, `ALLOWED_SLOTS_BY_TYPE`, `calculateEffectiveStats`, `getEquippedItemsBySlot`, `formatItemBonuses`

### Wereld — Quests
- [x] Quests tabel + RLS (`018_quests.sql`) — campaign-scoped, status (draft/active/completed/failed/archived)
- [x] Quest-overzicht per campaign `/campaigns/:id/quests` — grid met QuestCard + ForgeQuestCard, lege staat
- [x] Quest aanmaken — direct aanmaken + redirect naar bewerken
- [x] Quest bewerken `/quests/:id/edit` — naam, subtitel, type, moeilijkheidsgraad, status, beloning, beschrijving, DM-notities
- [x] Quest-detailpagina `/quests/:id` — breadcrumbs (wereld · kroniek · quests), header met type- en statusbadge, beschrijving, beloning, DM-notities
- [x] Quest verwijderen — met bevestigingsdialoog
- [x] Quest-preview in kroniek-detailpagina (inline grid + "Alle quests bekijken →")

### Gevechten — Encounter Builder
- [x] Encounters tabel + RLS + `session_id` FK (`020_encounters.sql`)
- [x] `encounter_monsters` junction tabel + RLS
- [x] Gevechten-overzicht per kroniek `/campaigns/:id/encounters` — grid met EncounterCard + ForgeEncounterCard
- [x] Gevecht aanmaken — direct aanmaken + redirect naar bewerken
- [x] Gevecht bewerken `/encounters/:id/edit` — naam, subtitel, omgeving, moeilijkheidsgraad, status, sessie-koppeling, beschrijving, DM-notities
- [x] Monster builder in edit pagina — inline picker met zoekveld, wezens uit wereld-bestiarium, aantalcontrols, verwijderknop; save via full-replace strategie
- [x] Gevecht-detailpagina `/encounters/:id` — breadcrumbs, header met moeilijkheid- en omgevingsbadges, monsters-tabel met stats, beschrijving, DM-notities
- [x] Gevecht verwijderen — met bevestigingsdialoog (cascade verwijdert encounter_monsters)
- [x] Gevechten-preview in kroniek-detailpagina (max 3 + "Alle gevechten bekijken →")
- [x] Live gevechtsrunner `/encounters/:id/run` — initiatiefvolgorde (d20 + DEX modifier), HP-balk met kleurovergang (teal→goud→crimson), ±HP controls, deelnemersbeheer (characters + monsters + handmatig), rondenteller

### AI-integratie (Lore Forge)
- [x] Supabase Edge Function `ai-chat` (`supabase/functions/ai-chat/`)
  - [x] Cascaderende free-tier providers: Groq (llama-3.3-70b) → Gemini 2.5 Flash-Lite
  - [x] Per-user rate limiting via `ai_usage` tabel (configureerbaar via `config.ts`)
  - [x] Org-level Groq soft cap via `ai_org_usage` tabel
  - [x] BYOK: keys opgeslagen in `profiles.byok_keys` (gelezen + geschreven via `useUserAISettings` / `useSetByokKey` hooks)
  - [x] `useAI()` hook (`src/hooks/useAI.ts`) + types (`src/types/ai.ts`)
  - [x] Migraties `024_ai_usage.sql` + `028_atomic_ai_claim.sql` — atomische rate-limit claim via `claim_ai_request()` RPC
  - [x] `029_encounter_monsters_rls.sql` — fix: encounter ownership verificatie in `encounter_monsters` policy
  - [x] `030_org_usage_upsert.sql` — fix: `increment_org_groq_usage()` gebruikt UPSERT
  - [x] Groq→Gemini cascade fallback bij provider errors (inner try-catch in `index.ts`)
- [x] Admin AI-testpaneel (`/admin`) — provider-badge, model-naam, resterend-verzoeken-teller
- [x] Content genereren voor locaties (UI integratie)
- [x] Content genereren voor NPCs (UI integratie)
- [x] Content genereren voor lore (UI integratie)
- [x] Wereldbouwer pagina `/worlds/:id/world-builder` — vrije prompt + 6 snelkoppelingen (Locatie, NPC, Quest, Wending, Gerucht, Buit); world-context wordt automatisch prepended; kopieer-knop + "Opnieuw genereren"; provider/model badge in response; Ctrl/Cmd+Enter om te genereren
- [x] AI Lootgenerator `/campaigns/:id/loot-generator` — contextprompt + 5 snelkoppelingen (Kerkerbuit, Quest beloning, Bandietenleider, Toverdrankjes, Oud artefact); AI genereert JSON-array van items; bulk-aanmaken via `useCreateCampaignItem`; individueel verwijderen vóór opslaan
- [x] Consistentiecheck op gegenereerde content — "Consistentiecheck" knop in Wereldbouwer na generatie; tweede AI-call toetst de gegenereerde tekst op consistentie met de wereld-context; resultaat getoond in teal-sectie onder het antwoord

### Entiteitsrelaties (Entity Links)
- [x] Migratie `038_entity_links.sql` — generieke relatietabel (`entity_links`) met campaign-scoped RLS (subquery op `campaigns.user_id`), CHECK tegen zelf-link, UNIQUE op gerichte link + relatie, indexes op beide richtingen
- [x] `src/types/link.types.ts` — `LinkableEntityType`, `LinkRelation`, `EntityLink`, `ResolvedLink` (normaliseert naar "de andere kant" + direction)
- [x] `src/lib/linkMaps.ts` — `relationLabel`, `relationInverseLabel`, `linkableTypeLabel`, `linkableTypeRoute` (parallel aan `statusMaps.ts`)
- [x] `src/hooks/queries/useEntityLinks.ts` — `useEntityLinks(type, id)`: twee aparte `.eq().eq()`-queries (DEV_MODE heeft geen `.or()`), merge + naam-resolutie via `.in()` per type (geen polymorfe joins); `useCreateLink()` + `useDeleteLink()` invalideren beide endpoints
- [x] `src/components/link/RelatedEntities.tsx` — sectie op detailpagina's: gegroepeerd per doel-type, juist label per richting (outgoing/incoming), doorkliklinks, verwijderen via `ConfirmDialog`, "Verbind…"-knop opent modal, focus-restore na sluiting
- [x] `src/components/link/LinkEntityModal.tsx` — drie-stappen modal (type → relatie → entiteit), zoekfilter in JS, hergebruikt bestaande campaign-query hooks, A11Y: `<label>` + `htmlFor`, stap-indicator
- [x] Wiring op: `NpcDetailPage`, `LocationDetailPage`, `LoreDetailPage`, `QuestDetailPage`, `SessionDetailPage`, `EncounterDetailPage`, `CharacterDetailPage`, `ItemEditPage` (items routen naar `/edit`), `FactionDetailPage`
- Notitie: items hebben geen `status`-kolom — name-resolution selecteert `'id, name'` voor items; `ResolvedLink.entity.status` is `string | null`

### Facties & Organisaties
- [x] Migratie `039_factions.sql` — `factions` tabel met `campaign_id` FK, `type`, `reputation` (default `neutral`), `status` (default `draft`), `motto`, `goals`, `description`, `notes`, `committed`; RLS op campaign-eigenaarschap; `update_factions_updated_at` trigger; index op `(campaign_id, created_at DESC)`
- [x] Migratie `040_npc_faction.sql` — `faction_id uuid REFERENCES factions(id) ON DELETE SET NULL` op `npcs`; partial index op `faction_id`
- [x] `src/types/faction.types.ts` — `FactionStatus`, `FactionType` (9 typen), `FactionReputation` (5 niveaus), `Faction` interface
- [x] `src/types/npc.types.ts` — `faction_id: string | null` toegevoegd aan `Npc`
- [x] `src/types/link.types.ts` — `'faction'` toegevoegd aan `LinkableEntityType`
- [x] `src/lib/linkMaps.ts` — `linkableTypeLabel.faction = 'Factie'`, `linkableTypeRoute.faction = '/factions'`
- [x] `src/lib/statusMaps.ts` — `factionStatusLabel/Color`, `factionTypeLabel`, `factionReputationLabel/Color`
- [x] `src/utils/pickGradient.ts` — `factionGradients` palet (heraldisch crimson/goud)
- [x] `src/lib/queryKeys.ts` — `campaigns.factions(id)`, `campaigns.factionDetail(id)`, `campaigns.factionDetailFull(id)`
- [x] `src/hooks/queries/useCampaignFactions.ts` — `useCampaignFactions` (lijst) + `useCreateCampaignFaction` (forge)
- [x] `src/hooks/queries/useFaction.ts` — `useFaction` (single), `useFactionFull` (met campaign+worlds join), `FactionWithCampaign` type
- [x] `src/hooks/queries/useEntityLinks.ts` — `faction: 'factions'` toegevoegd aan `typeToTable`
- [x] `src/components/link/LinkEntityModal.tsx` — `faction` toegevoegd aan `ALL_TYPES` en `entityListMap`
- [x] `src/components/faction/FactionCard.tsx` — `FactionCard` (compact card met type/reputatie/motto) + `ForgeFactionCard`
- [x] `src/pages/FactionsPage.tsx` — overzicht per kroniek; grid + ForgeCard + EmptyState; draft GC
- [x] `src/pages/FactionDetailPage.tsx` — breadcrumbs (wereld · kroniek · facties), header met type/reputatie/status badges, motto, doelen, beschrijving, ledenlijst (NPCs via `.eq('faction_id', id)`), DM-notities, `<RelatedEntities type="faction" …/>`
- [x] `src/pages/FactionEditPage.tsx` — naam, subtitel, type, reputatie, status, motto, doelen, beschrijving, DM-notities; `useEntityEdit` + `useEditGuard`; delete via `ConfirmDialog`
- [x] `src/pages/NpcEditPage.tsx` — factie-dropdown (opties uit `useCampaignFactions`); schrijft `faction_id`
- [x] `src/pages/NpcDetailPage.tsx` — doorklikbare factie-badge als `faction_id` gezet is
- [x] `src/pages/CampaignDetailPage.tsx` — tab "Facties" (na NPC's); inline grid max 6 + "Alle facties bekijken →"; `createFaction` mutation

### SRD-Compendium (Open5e import) — Fase A
- [x] Migratie `041_srd_source.sql` — `source text` + `source_slug text` op `bestiaries` en `items`; partial unique indexes op `(world_id, source_slug)` resp. `(campaign_id, source_slug)` waar `source_slug IS NOT NULL`
- [x] `src/types/open5e.types.ts` — raw Open5e V2 API types: `Open5eDocument`, `Open5eListResponse<T>`, `Open5eMonster`, `Open5eMagicItem`, `Open5eSpell`
- [x] `src/lib/open5e.ts` — V2 client (`searchMonsters`, `searchMagicItems`, `searchSpells`); mappers `mapMonsterToBestiary`, `mapMagicItemToItem`; hulpfuncties `mapChallengeRating`, `mapSpeed`, `mapItemType`, `mapItemRarity`; `SRD_SLUG = 'srd'` constante
- [x] `src/types/bestiary.types.ts` — `source: string | null` + `source_slug: string | null` toegevoegd
- [x] `src/types/item.types.ts` — `source: string | null` + `source_slug: string | null` toegevoegd
- [x] `src/types/database.types.ts` — `source` + `source_slug` toegevoegd aan `bestiaries` en `items` Row/Insert/Update
- [x] `src/lib/queryKeys.ts` — `srd.monsters(q)`, `srd.items(q)`, `srd.spells(q)` toegevoegd
- [x] `src/hooks/queries/useSrdSearch.ts` — `useSrdMonsterSearch(query)`, `useSrdItemSearch(query)` (staleTime 1 uur); `useImportMonster(worldId)` + `useImportMagicItem(campaignId)` mutaties met dedup-check + Sonner-feedback
- [x] `src/components/compendium/CompendiumBrowser.tsx` — herbruikbare zoekbrowser (kind: 'monster'|'item'); debounced zoekveld, resultatenlijst met "Importeer"-knop / "✓ In bibliotheek" label, CC-BY-4.0 + Open5e attributieregel
- [x] `src/components/bestiary/BestiaryCard.tsx` — "SRD"-badge op `BestiaryCard` en `BestiaryRow` wanneer `source === 'srd'`
- [x] `src/components/item/ItemCard.tsx` — "SRD"-badge op `ItemCard` wanneer `source === 'srd'`
- [x] `src/pages/BestiariesPage.tsx` — "Importeer uit SRD"-knop in header → Modal met `CompendiumBrowser kind="monster"`
- [x] `src/pages/CampaignItemsPage.tsx` — "Importeer uit SRD"-knop naast "AI Buitgenerator" → Modal met `CompendiumBrowser kind="item"`
- [x] `src/pages/SettingsPage.tsx` — SRD/Open5e attributieblok in de "Over"-tab
- [x] `src/test/open5e-mappers.test.ts` — 28 unit tests voor alle mappers en hulpfuncties (geen netwerkcalls)
- Attentie: Open5e V2 CORS werkt client-side; geen proxy nodig. SRD-document-slug is `'srd'` (5.1 CC-BY-4.0); wijzig `SRD_SLUG` in `open5e.ts` voor 5.2.

### SRD-Compendium (Open5e import) — Fase B: Spreukenbibliotheek
- [x] Migratie `042_spells.sql` — `spells` tabel (user-scoped): id, user_id, name, level (0-9), school, casting_time, range, components, duration, concentration, ritual, description, higher_level, classes text[], source, source_slug; RLS owner-only; unique index op `(user_id, source_slug) WHERE source_slug IS NOT NULL`
- [x] `src/types/spell.types.ts` — `SpellSchool` union (8 scholen) + `Spell` interface
- [x] `src/types/database.types.ts` — `spells` tabel (Row/Insert/Update) toegevoegd
- [x] `src/lib/statusMaps.ts` — `spellSchoolLabel` (Dutch) + `spellSchoolColor` (8 scholen, elk een eigen kleur)
- [x] `src/utils/pickGradient.ts` — `spellGradients` palet (violet/azure arcane theme, 4 varianten)
- [x] `src/lib/queryKeys.ts` — `spells.all` + `spells.detail(id)` query keys
- [x] `src/lib/open5e.ts` — `mapSpellSchool()` + `mapSpellToSpell()` mapper toegevoegd
- [x] `src/hooks/queries/useSpells.ts` — `useSpells()` (alle spreuken van de user, gesorteerd op level + name) + `useDeleteSpell()` (met cache-invalidatie + toast)
- [x] `src/hooks/queries/useSrdSearch.ts` — `useSrdSpellSearch(query)` + `useImportSpell()` mutatie met dedup-check + Sonner-feedback; `CompendiumBrowser` kind uitgebreid met `'spell'`
- [x] `src/components/spell/SpellCard.tsx` — compact card: school-kleur, level-label (Kantrip/Niveau X), C/R/SRD badges, casting time/range/duration rij, klassen-rij, delete-knop
- [x] `src/pages/SpellsPage.tsx` — spreukbibliotheek met level- en school-filters, grid van SpellCards, "Importeer uit SRD"-knop, EmptyState, ConfirmDialog voor verwijderen
- [x] `src/routes/index.tsx` — `/spells` route (lazy SpellsPage, requireAuth)
- [x] `src/layouts/AppLayout.tsx` — "Spreuken" nav-item toegevoegd (na Karakters)
- [x] `src/test/open5e-mappers.test.ts` — `mapSpellSchool` (alle 8 scholen + fallback) + `mapSpellToSpell` tests uitgebreid (niveau 0, concentratie, ritueel, klassen-parsing, lege klassen)

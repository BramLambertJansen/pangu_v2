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
| Styling | TailwindCSS v4 |
| Client state | Zustand v5 (persisted) |
| Server state | TanStack Query v5 (mutations + cache invalidation) |
| Routing | react-router-dom v7 |
| Validatie | Zod |
| Toasts | Sonner |
| Backend | Supabase (auth, database, storage, realtime) |
| PWA | vite-plugin-pwa |
| API | Vercel serverless functions (`api/admin/`) |

---

## Projectstructuur

```
src/
├── App.tsx                  # Root: QueryClientProvider, RouterProvider, Toaster
├── main.tsx                 # Entry point
├── components/
│   ├── ui/                  # Herbruikbare basis-componenten
│   │   ├── Avatar.tsx
│   │   ├── Badge.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── Spinner.tsx
│   ├── admin/               # Admin feature components
│   │   ├── CreateUserModal.tsx
│   │   ├── DeleteUserModal.tsx
│   │   ├── EditUserModal.tsx
│   │   └── UserTable.tsx
│   ├── campaign/
│   │   └── CampaignCard.tsx  # CampaignCard + ForgeCampaignCard
│   ├── session/
│   │   └── SessionCard.tsx   # SessionCard + ForgeSessionCard
│   └── world/
│       ├── CompassRose.tsx
│       ├── WorldCard.tsx      # WorldCard + ForgeWorldCard
│       ├── WorldDetailDivider.tsx
│       └── WorldDetailHeader.tsx
├── hooks/                   # Custom React hooks (momenteel leeg)
├── layouts/
│   ├── AppLayout.tsx         # Sidebar + starfield achtergrond
│   └── AuthLayout.tsx
├── lib/
│   ├── queryClient.ts        # TanStack Query client instantie
│   ├── queryKeys.ts          # Gecentraliseerde query key constanten
│   └── supabase.ts           # Supabase client (getypeerd via Database)
├── pages/
│   ├── AdminPage.tsx
│   ├── CampaignDetailPage.tsx
│   ├── CampaignEditPage.tsx
│   ├── DashboardPage.tsx
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── SessionDetailPage.tsx
│   ├── SessionEditPage.tsx
│   ├── SessionsPage.tsx
│   ├── SettingsPage.tsx
│   ├── WorldDetailPage.tsx
│   ├── WorldEditPage.tsx
│   └── WorldsPage.tsx
├── routes/
│   └── index.tsx             # React Router config + auth loaders
├── stores/
│   ├── auth.store.ts
│   ├── campaign.store.ts
│   ├── preferences.store.ts
│   └── ui.store.ts
├── types/
│   ├── database.types.ts     # Auto-gegenereerd via Supabase CLI
│   ├── campaign.types.ts
│   ├── session.types.ts
│   └── world.types.ts
└── utils/
    ├── apiError.ts           # getApiError() voor serverless responses
    └── cn.ts                 # clsx + tailwind-merge

api/
└── admin/
    ├── _auth.ts              # verifyAdmin() middleware
    ├── users.ts              # GET (lijst) + POST (aanmaken)
    └── users/[id].ts         # PATCH (bewerken) + DELETE

supabase/
└── migrations/               # SQL-migraties (genummerd, chronologisch)
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

### Feature-componenten (`src/components/[feature]/`)

Elk feature-domein heeft een map: `campaign/`, `session/`, `world/`, `admin/`.  
Toekomstige domeinen: `character/`, `location/`, `npc/`, `lore/`.

**Forge-patroon:** elke lijst heeft een `Forge[Entity]Card` naast `[Entity]Card`. De ForgeCard is een placeholder-kaart waarmee een nieuwe entiteit direct aangemaakt wordt (click → mutation → redirect naar edit).

---

## Design System

### CSS-variabelen (globaal)

Gedefinieerd op `:root`, beschikbaar via `var(--naam)`:

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

### Kaart-gradients

`WorldCard`, `CampaignCard` en `SessionCard` berekenen een deterministische gradient op basis van de eerste 8 tekens van het entity-ID (hash → HSL palette). Geen externe kleurprop nodig.

### Header-afbeelding positie

`WorldEditPage` en `CampaignEditPage` ondersteunen drag-to-reposition van de header-afbeelding (mouse + touch events). De positie wordt opgeslagen als `"X% Y%"` string en teruggelezen als `object-position` op het `<img>`-element.

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

---

## Supabase

- Client: `src/lib/supabase.ts` — één instantie, getypeerd via `createClient<Database>`
- RLS (Row Level Security) is altijd ingeschakeld op alle tabellen
- Migraties in `supabase/migrations/`
- Types regenereren: `npx supabase gen types typescript --local > src/types/database.types.ts`

### Domain types (`src/types/`)

Naast de auto-gegenereerde `database.types.ts` zijn er handmatige domain-types:

```ts
// world.types.ts
type WorldStatus = 'draft' | 'active' | 'archived'
interface World { id, user_id, name, subtitle, quote, description, header_image, header_image_position, status, created_at, updated_at }

// campaign.types.ts
type CampaignStatus = 'draft' | 'active' | 'archived' | 'completed'
interface Campaign { id, world_id, user_id, name, subtitle, description, header_image, header_image_position, status, created_at, updated_at }

// session.types.ts
type SessionStatus = 'planned' | 'active' | 'completed' | 'archived'
interface Session { id, campaign_id, user_id, name, subtitle, description, notes, status, session_date, session_number, created_at, updated_at }
```

### Migraties (chronologisch)

| # | Bestand | Inhoud |
|---|---|---|
| 001 | `001_profiles.sql` | Profiles tabel + RLS + `handle_new_user` trigger (auto-profile bij signup) |
| 002 | `002_profile_settings.sql` | Profile settings (gereserveerd) |
| 003 | `003_worlds.sql` | Worlds tabel + RLS |
| 004 | `004_worlds_header_image_position.sql` | Header image positie voor worlds |
| 005 | `005_campaigns.sql` | Campaigns tabel + RLS + index op `(world_id, created_at DESC)` |
| 006 | `006_campaigns_header_image.sql` | Header image + positie voor campaigns |
| 007 | `007_sessions.sql` | Sessions tabel + RLS + index + `update_sessions_updated_at` trigger |
| 015 | `015_bestiaries.sql` | Bestiaries tabel + RLS + index op `(world_id, created_at DESC)` + `update_bestiaries_updated_at` trigger |
| 018 | `018_encounters.sql` | Encounters tabel + RLS + index + `update_encounters_updated_at` trigger; encounter_monsters junction tabel + RLS + index |
| 020 | `020_characters_proficient_skills.sql` | `proficient_skills text[]` kolom op characters — D&D 5e skill proficiencies |
| 021 | `021_worlds_campaigns_notes.sql` | `notes text` kolom op worlds en campaigns |

---

## Routing

Routes zijn gedefinieerd in `src/routes/index.tsx`. Lazy-loading voor alle pagina-routes via React Suspense.

### Huidige routes

| Route | Pagina | Auth | Status |
|---|---|---|---|
| `/` | redirect → `/dashboard` | — | ✅ |
| `/login` | `LoginPage` | nee (AuthLayout) | ✅ |
| `/register` | `RegisterPage` | nee (AuthLayout) | ✅ |
| `/dashboard` | `DashboardPage` | `requireAuth` | ✅ |
| `/admin` | `AdminPage` | `requireAdmin` | ✅ |
| `/settings` | `SettingsPage` | `requireAuth` | ✅ |
| `/worlds` | `WorldsPage` | `requireAuth` | ✅ |
| `/worlds/:id` | `WorldDetailPage` | `requireAuth` | ✅ |
| `/worlds/:id/edit` | `WorldEditPage` | `requireAuth` | ✅ |
| `/campaigns/:id` | `CampaignDetailPage` | `requireAuth` | ✅ |
| `/campaigns/:id/edit` | `CampaignEditPage` | `requireAuth` | ✅ |
| `/campaigns/:id/sessions` | `SessionsPage` | `requireAuth` | ✅ |
| `/sessions/:id` | `SessionDetailPage` | `requireAuth` | ✅ |
| `/sessions/:id/edit` | `SessionEditPage` | `requireAuth` | ✅ |
| `/campaigns/:id/locations` | `LocationsPage` | `requireAuth` | ✅ |
| `/locations/:id` | `LocationDetailPage` | `requireAuth` | ✅ |
| `/locations/:id/edit` | `LocationEditPage` | `requireAuth` | ✅ |
| `/campaigns/:id/lore` | `LoresPage` | `requireAuth` | ✅ |
| `/lore/:id` | `LoreDetailPage` | `requireAuth` | ✅ |
| `/lore/:id/edit` | `LoreEditPage` | `requireAuth` | ✅ |
| `/campaigns/:id/npcs` | `NpcsPage` | `requireAuth` | ✅ |
| `/npcs/:id` | `NpcDetailPage` | `requireAuth` | ✅ |
| `/npcs/:id/edit` | `NpcEditPage` | `requireAuth` | ✅ |
| `/worlds/:id/bestiary` | `BestiariesPage` | `requireAuth` | ✅ |
| `/bestiary/:id` | `BestiaryDetailPage` | `requireAuth` | ✅ |
| `/bestiary/:id/edit` | `BestiaryEditPage` | `requireAuth` | ✅ |
| `/campaigns/:id/quests` | `QuestsPage` | `requireAuth` | ✅ |
| `/quests/:id` | `QuestDetailPage` | `requireAuth` | ✅ |
| `/quests/:id/edit` | `QuestEditPage` | `requireAuth` | ✅ |
| `/campaigns/:id/encounters` | `EncountersPage` | `requireAuth` | ✅ |
| `/encounters/:id` | `EncounterDetailPage` | `requireAuth` | ✅ |
| `/encounters/:id/edit` | `EncounterEditPage` | `requireAuth` | ✅ |
| `/characters` | `CharactersPage` | `requireAuth` | ✅ |
| `/characters/:id` | `CharacterDetailPage` | `requireAuth` | ✅ |
| `/characters/:id/edit` | `CharacterEditPage` | `requireAuth` | ✅ |
| `/campaigns` | `CampaignsPage` | `requireAuth` | ✅ |
| `/campaigns/:id/items` | `CampaignItemsPage` | `requireAuth` | ✅ |
| `/items/:id/edit` | `ItemEditPage` | `requireAuth` | ✅ |

### Auth loaders

- `requireAuth` — redirect naar `/login` als geen sessie actief
- `requireAdmin` — redirect naar `/dashboard` als rol ≠ `'admin'`

---

## A11Y-checklist

Elke feature is pas **klaar** als alle punten gehaald zijn:

- [ ] Tekstcontrast ≥ 4.5:1; UI-component contrast ≥ 3:1 (WCAG 1.4.11)
- [ ] Focus ring zichtbaar op alle interactieve elementen; geen `outline: none` zonder custom stijl
- [ ] Semantisch HTML (`nav`, `main`, `header`, `section`, `button`, etc.)
- [ ] Forms: velden gekoppeld via `htmlFor`/`id`; fouten via `aria-describedby`
- [ ] Icon-only knoppen hebben `aria-label`; decoratieve SVGs hebben `aria-hidden="true"`
- [ ] Laadstates aangekondigd via `aria-live`; modals hebben `role="dialog"` + `aria-modal="true"` + focus trap
- [ ] Touch targets ≥ 44×44px
- [ ] `prefers-reduced-motion` gerespecteerd (geen animaties forceren)

---

## Ontwikkelregels

1. **Geen comments die uitleggen wát de code doet** — alleen waaróm (verborgen constraints, workarounds, niet-evidente invarianten).
2. **Geen halve implementaties** — een feature is af of staat achter een feature flag.
3. **Geen onnodige abstracties** — drie vergelijkbare regels zijn beter dan een premature helper.
4. **Foutafhandeling alleen aan systeemgrenzen** — gebruikersinput, externe APIs. Vertrouw interne code en framework-garanties.
5. **TypeScript strict** — geen `any`, geen `@ts-ignore` zonder uitleg.
6. **Elke nieuwe feature documenteren** in de Feature Status hieronder.
7. **Hooks directory** — extraheer herbruikbare query/state logica naar `src/hooks/` zodra dezelfde logica op ≥2 plekken voorkomt (bv. `useImagePositioning`, `useWorld`).

---

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # ESLint
npm run type-check   # tsc --noEmit
```

---

## Feature Status

> Bijhouden welke features beschikbaar zijn in de app. Elke keer dat iets wordt afgerond, direct hier bijwerken.

### Infrastructuur
- [x] Vite + React 19 + TypeScript setup
- [x] TailwindCSS v4 configuratie + CSS design tokens
- [x] Supabase client + types
- [x] TanStack Query client + gecentraliseerde query keys
- [x] Zustand stores (auth, campaign, ui, preferences)
- [x] react-router-dom v7 routing (lazy-loaded, auth guards)
- [x] Sonner toasts (`<Toaster />` in `App.tsx`)
- [x] PWA-configuratie (vite-plugin-pwa, manifest, icons)
- [x] Vercel serverless API (`api/admin/`)
- [x] `@`-path alias (Vite + TypeScript)

### UI Basis-componenten (`src/components/ui/`)
- [x] `Button` (variants: primary/secondary/ghost/danger, sizes: sm/md/lg, loading state)
- [x] `Input` (label, foutmelding, aria-koppeling)
- [x] `Modal` (focus trap, role="dialog", aria-modal)
- [x] `Spinner` (sizes: sm/md/lg)
- [x] `Badge`
- [x] `Card`
- [x] `Avatar` (initials-weergave)

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

### Instellingen
- [x] Instellingen pagina `/settings` (3 tabs: Profiel, Voorkeuren, Info)
- [x] Profiel-tab — naam, lidwoordkeuze, bio, avatar; email read-only
- [x] Voorkeuren-tab — sessieherinneringen, geluidseffecten, autosave, lore-suggesties, taal (nl/en/de/fr)
- [x] Info-tab — PANGU branding, versie, status, licentie
- [x] Preferences store (Zustand, per-gebruiker geïsoleerd via user ID)

### Dashboard
- [x] Dashboard pagina `/dashboard` — recent: 4 werelden, 4 actieve campaigns, 6 geplande sessies
- [x] Begroeting met gebruikersnaam
- [x] Responsief grid-layout

### Werelden (DM)
- [x] Worlds tabel + RLS (`003_worlds.sql`)
- [x] Header image positie (`004_worlds_header_image_position.sql`)
- [x] DM-notities kolom (`021_worlds_campaigns_notes.sql`)
- [x] Werelden overzicht `/worlds` — grid met WorldCard + ForgeWorldCard, lege staat, responsief
- [x] Wereld aanmaken — direct aanmaken + redirect naar bewerken
- [x] Wereld bewerken `/worlds/:id/edit` — naam, subtitle, quote, beschrijving, DM-notities, header image + drag-to-reposition, status
- [x] Wereld verwijderen — met bevestigingsdialoog
- [x] Wereld detail `/worlds/:id` — breadcrumbs, WorldDetailHeader, WorldDetailDivider, DM-notities, campaigns lijst, bestiarium-link
- [x] Navigatie-item "Werelden" in sidebar

### Campaigns (DM)
- [x] Campaigns tabel + RLS (`005_campaigns.sql`)
- [x] Campaign header image (`006_campaigns_header_image.sql`)
- [x] DM-notities kolom (`021_worlds_campaigns_notes.sql`)
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
- [x] Sessie bewerken `/sessions/:id/edit` — naam, subtitle, sessienummer, datum, status (planned/active/completed/archived), beschrijving, DM-notities
- [x] Sessie-detailpagina `/sessions/:id` — breadcrumbs (wereld · kroniek · sessies), header met sessienummer-, datum- en statusbadge, beschrijving, DM-notities
- [x] Sessie verwijderen — met bevestigingsdialoog

### Wereld — Locaties
- [x] Locatie-overzicht per campaign (`/campaigns/:id/locations`)
- [x] Locatie aanmaken / bewerken / verwijderen
- [x] Locatie-detailpagina `/locations/:id` — breadcrumbs (wereld · kroniek · locaties), header met type- en status-badge, beschrijving, DM-notities

### Wereld — NPCs
- [x] NPC-overzicht per campaign (`/campaigns/:id/npcs`)
- [x] NPC aanmaken / bewerken / verwijderen
- [x] NPC-detailpagina `/npcs/:id` — breadcrumbs (wereld · kroniek · NPCs), header met rol- en statusbadge, beschrijving, DM-notities

### Wereld — Lore
- [x] Lore-overzicht per campaign (`/campaigns/:id/lore`)
- [x] Lore-item aanmaken / bewerken / verwijderen
- [x] Lore-detailpagina `/lore/:id` — breadcrumbs (wereld · kroniek · lore), header met categorie- en statusbadge, beschrijving, DM-notities

### Wereld — Bestiarium
- [x] Bestiaries tabel + RLS (`015_bestiaries.sql`) — world-scoped, full D&D stat block (HP, AC, speed, 6 eigenschappen)
- [x] Bestiarium-overzicht per wereld (`/worlds/:id/bestiary`) — grid met BestiaryCard + ForgeBestiaryCard, lege staat
- [x] Wezen aanmaken — direct aanmaken + redirect naar bewerken
- [x] Wezen bewerken `/bestiary/:id/edit` — naam, subtitel, type, dreigingsniveau, leefgebied, status, HP/AC/snelheid, 6 eigenschappen, beschrijving, DM-notities
- [x] Wezen-detailpagina `/bestiary/:id` — breadcrumbs (wereld · bestiarium), header met type- en dreigingsbadges, stat block met modifiers, beschrijving, DM-notities
- [x] Wezen verwijderen — met bevestigingsdialoog
- [x] Bestiarium-link in wereld-detailpagina

### Karakter (Spelersperspectief)
- [x] Characters tabel + RLS (`014_characters.sql`) — global per user, full D&D stat block
- [x] `campaign_id` op characters (`018_campaign_id_to_characters.sql`) — karakter koppelen aan één kroniek
- [x] Karakters overzicht `/characters` — grid met CharacterCard + ForgeCharacterCard, zoekfilter
- [x] Karakter aanmaken — direct aanmaken + redirect naar bewerken
- [x] Karakter bewerken `/characters/:id/edit` — naam, klasse, subklasse, ras, level, XP, HP, AC, snelheid, initiatief, vaardigheidsbonus, 6 eigenschappen, **vaardigheden (18 skills)**, schatkist, achtergrond, privénotities, **kroniek-koppeling**
- [x] Karakter-detailpagina `/characters/:id` — Stats/Vaardigheden/Lore/Inventaris tabs, inline HP ±1, XP-balk, eigenschappen-grid met modifiers, vaardigheidstab met proficiency-indicator + berekende modifiers, schatkist, inventaris met "Teruggeven aan DM"
- [x] Karakter verwijderen — met bevestigingsdialoog
- [x] Navigatie-item "Karakters" in sidebar
- [x] Karakters zichtbaar in kroniek-detailpagina (via campaign_id)
- [x] Vaardigheden (skill proficiencies) — `proficient_skills text[]` op characters (`020_characters_proficient_skills.sql`); 18 D&D 5e vaardigheden, klikbare toggle in edit, berekende modifiers in detail
- [ ] Spreuken (v2 — vereist JSONB-tabel)

### Items / Schatkist
- [x] Items tabel + RLS (`019_items.sql`) — campaign-scoped, character_id nullable (DM-pool vs toegewezen)
- [x] Item aanmaken vanuit kroniek-detailpagina — ForgeItemCard → redirect naar bewerken
- [x] Item bewerken `/items/:id/edit` — naam, type, zeldzaamheid, magisch, aantal, gewicht, beschrijving, toewijzen aan karakter
- [x] Items overzicht per kroniek `/campaigns/:id/items` — filter op alles/schatkist/karakter
- [x] Items in kroniek-detailpagina (DM-pool preview max 6 + "Alle items bekijken →")
- [x] Inventaris-tab in karakter-detailpagina — lijst van toegewezen items + "Teruggeven aan DM"
- [x] ItemCard + ForgeItemCard component (`src/components/item/ItemCard.tsx`)

### Wereld — Quests
- [x] Quests tabel + RLS (`017_quests.sql`) — campaign-scoped, status (draft/active/completed/failed/archived), type, difficulty, reward
- [x] Quest-overzicht per campaign (`/campaigns/:id/quests`) — grid met QuestCard + ForgeQuestCard, lege staat
- [x] Quest aanmaken — direct aanmaken + redirect naar bewerken
- [x] Quest bewerken `/quests/:id/edit` — naam, subtitel, type, moeilijkheidsgraad, status, beloning, beschrijving, DM-notities
- [x] Quest-detailpagina `/quests/:id` — breadcrumbs (wereld · kroniek · quests), header met type- en statusbadge, beschrijving, beloning, DM-notities
- [x] Quest verwijderen — met bevestigingsdialoog
- [x] Quest-preview in kroniek-detailpagina (inline grid + "Alle quests bekijken →")

### Gevechten — Encounter Builder
- [x] Encounters tabel + RLS + `session_id` FK (optionele koppeling aan sessie) (`018_encounters.sql`)
- [x] `encounter_monsters` junction tabel + RLS (bestiary creatures met aantallen)
- [x] Gevechten-overzicht per kroniek (`/campaigns/:id/encounters`) — grid met EncounterCard + ForgeEncounterCard
- [x] Gevecht aanmaken — direct aanmaken + redirect naar bewerken
- [x] Gevecht bewerken `/encounters/:id/edit` — naam, subtitel, omgeving, moeilijkheidsgraad, status, sessie-koppeling, beschrijving, DM-notities
- [x] Monster builder in edit pagina — inline picker met zoekveld, alle wezens uit wereld-bestiarium, aantalcontrols (+ / −), verwijderknop; save via full-replace strategie
- [x] Gevecht-detailpagina `/encounters/:id` — breadcrumbs, header met moeilijkheid- en omgevingsbadges, monsters-tabel met stats, beschrijving, DM-notities
- [x] Gevecht verwijderen — met bevestigingsdialoog (cascade verwijdert ook encounter_monsters)
- [x] Gevechten-preview in kroniek-detailpagina (inline grid max 3 + "Alle gevechten bekijken →")

### AI-integratie (Lore Forge)
- [x] Supabase Edge Function `ai-chat` (`supabase/functions/ai-chat/`)
  - [x] Cascaderende free-tier providers: Groq (llama-3.3-70b) → Gemini 2.5 Flash-Lite
  - [x] Per-user rate limiting via `ai_usage` tabel (configureerbaar via `config.ts`)
  - [x] Org-level Groq soft cap via `ai_org_usage` tabel
  - [x] BYOK: uitbreidbare `byok_keys jsonb` map (nu: Anthropic + OpenAI)
  - [x] `useAI()` hook (`src/hooks/useAI.ts`) + types (`src/types/ai.ts`) — exposeert `lastProvider` + `lastModel`
  - [x] Migratie `021_ai_usage.sql` uitgerold naar productie (tabellen + RLS + atomische RPC-functies)
- [x] Admin AI-testpaneel (`/admin`) — "Test Gemini / Groq" knop met provider-badge, model-naam en resterend-verzoeken-teller
- [ ] Content genereren voor locaties (UI integratie)
- [ ] Content genereren voor NPCs (UI integratie)
- [ ] Content genereren voor lore (UI integratie)
- [ ] Consistentiecheck op gegenereerde content

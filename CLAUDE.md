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
│   ├── RegisterPage.tsx      # ⚠️ STUB
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

---

## Routing

Routes zijn gedefinieerd in `src/routes/index.tsx`. Lazy-loading voor alle pagina-routes via React Suspense.

### Huidige routes

| Route | Pagina | Auth | Status |
|---|---|---|---|
| `/` | redirect → `/dashboard` | — | ✅ |
| `/login` | `LoginPage` | nee (AuthLayout) | ✅ |
| `/register` | `RegisterPage` | nee (AuthLayout) | ⚠️ stub |
| `/dashboard` | `DashboardPage` | `requireAuth` | ✅ |
| `/admin` | `AdminPage` | `requireAdmin` | ✅ |
| `/settings` | `SettingsPage` | `requireAuth` | ✅ |
| `/worlds` | `WorldsPage` | `requireAuth` | ✅ |
| `/worlds/:id` | `WorldDetailPage` | `requireAuth` | ✅ |
| `/worlds/:id/edit` | `WorldEditPage` | `requireAuth` | ✅ |
| `/campaigns/:id` | `CampaignDetailPage` | `requireAuth` | ✅ |
| `/campaigns/:id/edit` | `CampaignEditPage` | `requireAuth` | ✅ |
| `/campaigns/:id/sessions` | `SessionsPage` | `requireAuth` | ✅ |
| `/sessions/:id/edit` | `SessionEditPage` | `requireAuth` | ✅ |
| `/campaigns/:id/lore` | `LoresPage` | `requireAuth` | ✅ |
| `/lore/:id/edit` | `LoreEditPage` | `requireAuth` | ✅ |

### Geplande routes (nog niet geïmplementeerd)

```
/campaigns               → overzicht alle campaigns
/campaigns/:id/locations → locaties per campaign
/campaigns/:id/npcs      → NPCs per campaign
/characters/:id          → spelersperspectief
```

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
- [ ] Registratie pagina ⚠️ stub — formulier nog te bouwen (email, wachtwoord, display_name + Supabase signup)
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
- [x] Werelden overzicht `/worlds` — grid met WorldCard + ForgeWorldCard, lege staat, responsief
- [x] Wereld aanmaken — direct aanmaken + redirect naar bewerken
- [x] Wereld bewerken `/worlds/:id/edit` — naam, subtitle, quote, beschrijving, header image + drag-to-reposition, status
- [x] Wereld verwijderen — met bevestigingsdialoog
- [x] Wereld detail `/worlds/:id` — WorldDetailHeader, WorldDetailDivider, CompassRose, campaigns lijst
- [x] Navigatie-item "Werelden" in sidebar

### Campaigns (DM)
- [x] Campaigns tabel + RLS (`005_campaigns.sql`)
- [x] Campaign header image (`006_campaigns_header_image.sql`)
- [x] Campaign aanmaken (vanuit wereld detail, "+ Nieuwe kroniek") → direct redirect naar bewerken
- [x] Campaign bewerken `/campaigns/:id/edit` — volledig formulier, drag-to-reposition, status
- [x] Campaign verwijderen — met bevestigingsdialoog
- [x] Campaign detail `/campaigns/:id` — breadcrumbs, header, status badge, sessies lijst, actieknoppen
- [ ] Campaign overzicht `/campaigns` — lijst/dashboard van alle campaigns

### Sessies
- [x] Sessies tabel + RLS (`007_sessions.sql`)
- [x] `update_sessions_updated_at` trigger
- [x] Sessie-overzicht per campaign `/campaigns/:id/sessions` — grid met SessionCard + ForgeSessionCard
- [x] Sessie aanmaken — direct aanmaken + redirect naar bewerken
- [x] Sessie bewerken `/sessions/:id/edit` — naam, subtitle, sessienummer, datum, status (planned/active/completed/archived), beschrijving, DM-notities
- [x] Sessie verwijderen — met bevestigingsdialoog

### Wereld — Locaties
- [x] Locatie-overzicht per campaign (`/campaigns/:id/locations`)
- [x] Locatie aanmaken / bewerken / verwijderen
- [ ] Locatie-detailpagina

### Wereld — NPCs
- [ ] NPC-overzicht per campaign
- [ ] NPC aanmaken / bewerken / verwijderen
- [ ] NPC-detailpagina

### Wereld — Lore
- [x] Lore-overzicht per campaign (`/campaigns/:id/lore`)
- [x] Lore-item aanmaken / bewerken / verwijderen

### Karakter (Spelersperspectief)
- [ ] Karakterblad bekijken
- [ ] Inventaris beheren
- [ ] Karakterstats bijwerken

### AI-integratie (Lore Forge)
- [ ] AI-agent configuratie
- [ ] Content genereren voor locaties
- [ ] Content genereren voor NPCs
- [ ] Content genereren voor lore
- [ ] Consistentiecheck op gegenereerde content

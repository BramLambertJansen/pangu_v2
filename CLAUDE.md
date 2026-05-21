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
| Client state | Zustand (persisted) |
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
├── assets/              # Statische bestanden (fonts, icons, images)
├── components/
│   ├── ui/              # Herbruikbare basis-componenten (Button, Input, Modal, etc.)
│   └── [feature]/       # Feature-specifieke componenten
├── hooks/               # Custom React hooks
├── layouts/             # Pagina-layouts (AppLayout, AuthLayout)
├── lib/
│   ├── supabase.ts      # Supabase client
│   ├── queryClient.ts   # TanStack Query client
│   └── queryKeys.ts     # Gecentraliseerde query key constanten
├── pages/               # Route-componenten (één per route)
├── routes/              # Route-definities
├── stores/              # Zustand stores (één per domein)
├── types/               # Gedeelde TypeScript types/interfaces
└── utils/               # Pure utility-functies (cn.ts, apiError.ts)

api/
└── admin/
    ├── _auth.ts         # Auth middleware (Vercel serverless)
    ├── users.ts         # User CRUD
    └── users/[id].ts    # Dynamisch user endpoint

supabase/
└── migrations/          # SQL-migraties (genummerd, chronologisch)
```

---

## Componentconventies

### Herbruikbare UI-componenten (`src/components/ui/`)

Elk basis-component:
- Exporteert een `Props`-type via `React.ComponentPropsWithoutRef`
- Accepteert een `className`-prop via `cn()` (clsx + tailwind-merge)
- Is forward-ref-compatibel waar van toepassing
- Heeft een korte JSDoc-regel boven de functiedefinitie bij niet-evidente props

Verplichte componenten vóór feature-werk:
- `Button` — varianten: `primary`, `secondary`, `ghost`, `danger`; maten: `sm`, `md`, `lg`
- `Input` — met label, foutmelding en aria-koppeling
- `Modal` — met focus trap, `role="dialog"`, `aria-modal="true"`
- `Spinner` — laadstatus-indicator
- `Badge` — status-labels (varianten: `default`, `success`, `warning`, `danger`, `info`)
- `Card` — content-containers (sub-components: `CardHeader`, `CardTitle`, `CardContent`)
- `Avatar` — voor NPCs, spelers (met fallback-initialen, 3 maten)

### Feature-componenten (`src/components/[feature]/`)

Gegroepeerd per domein:

| Map | Componenten |
|---|---|
| `world/` | `WorldCard`, `WorldDetailHeader`, `WorldDetailDivider`, `CompassRose` |
| `campaign/` | `CampaignCard` |
| `session/` | `SessionCard` |
| `admin/` | `UserTable`, `CreateUserModal`, `EditUserModal`, `DeleteUserModal` |

Geplande mappen (nog leeg): `character/`, `location/`, `npc/`, `lore/`.

---

## Design System

Alle design tokens zijn gedefinieerd als CSS custom properties in `src/index.css`.

### Kleuren
```css
/* Achtergronden (donkerste → lichtste) */
--void: #0a0a14        /* body achtergrond */
--void-2: #0f0e1c
--surface: #15142a
--surface-2: #1c1a35
--surface-3: #252243
--surface-hover: #2d2950

/* Accent */
--violet: #9b8aff       /* primaire accentkleur */
--violet-soft: #b5a7ff
--violet-deep: #6b58d6
--violet-glow: rgba(155, 138, 255, 0.35)
--gold: #f5c842         /* highlights, titels */
--gold-soft: #ffd968
--gold-deep: #c9a02e
--teal: #3ecfb2         /* succes / actief */
--crimson: #ff6b6b      /* fout / gevaar */
--azure: #6ba7ff        /* info / link */

/* Tekst */
--ink: #f0ecf7          /* primaire tekst */
--ink-soft: #c8c2dc     /* secondaire tekst */
--muted: #8079a0        /* placeholder / uitgeschakeld */
--subtle: #4a4565       /* borders, separators */

/* Borders */
--hairline: rgba(155, 138, 255, 0.14)
--hairline-strong: rgba(155, 138, 255, 0.28)
```

### Typografie
```css
--font-display: 'Cinzel', Georgia, serif      /* titels, headings */
--font-body: 'Manrope', system-ui, sans-serif  /* lopende tekst */
--font-mono: 'JetBrains Mono', ui-monospace   /* code */
```

### Spacing (4px grid)
`--sp-1` (4px) · `--sp-2` (8px) · `--sp-3` (12px) · `--sp-4` (16px) · `--sp-5` (20px) · `--sp-6` (24px) · `--sp-8` (32px) · `--sp-10` (40px) · `--sp-12` (48px) · `--sp-16` (64px) · `--sp-20` (80px)

### Border radius
`--r-xs` (4px) · `--r-sm` (6px) · `--r-md` (8px) · `--r-lg` (12px) · `--r-xl` (16px) · `--r-full` (9999px)

### Animatie
```css
--ease-out: cubic-bezier(0.2, 0.7, 0.2, 1)
--t-fast: 180ms    /* hover-states */
--t-base: 220ms    /* standaard overgangen */
--t-slow: 280ms    /* modals, panels */
```

Gebruik altijd de tokens in plaats van hardcoded waarden. TailwindCSS v4 heeft geen aparte config-file — alles gaat via CSS custom properties en `@theme`.

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
- `usePreferencesStore` isoleert per gebruiker via auth user ID (localStorage key bevat user ID)
- `useUIStore` is **niet** gepersisteerd (sidebarCollapsed reset bij refresh)

### TanStack Query (server state)

- Query keys zijn arrays, geëxporteerd als constanten vanuit `src/lib/queryKeys.ts`
- Mutations invalideren altijd de relevante queries na succes
- Optimistic updates voor snelle UI-feedback waar zinvol
- `staleTime` instellen per query-type (geen globale standaard van 0)

```ts
// src/lib/queryKeys.ts — huidige structuur
export const queryKeys = {
  campaigns: {
    all: ['campaigns'],
    detail: (id: string) => ['campaigns', id],
    byWorld: (worldId: string) => ['campaigns', 'world', worldId],
    locations: (id: string) => ['campaigns', id, 'locations'],
    npcs: (id: string) => ['campaigns', id, 'npcs'],
    lore: (id: string) => ['campaigns', id, 'lore'],
    sessions: (campaignId: string) => ['campaigns', campaignId, 'sessions'],
    sessionDetail: (sessionId: string) => ['sessions', sessionId],
  },
  characters: {
    all: ['characters'],
    detail: (id: string) => ['characters', id],
  },
  worlds: {
    all: ['worlds'],
    detail: (id: string) => ['worlds', id],
  },
  admin: {
    users: ['admin', 'users'],
  },
}
```

---

## Supabase

- Client: `src/lib/supabase.ts` — één instantie, geëxporteerd als `supabase`
- RLS (Row Level Security) is altijd ingeschakeld op alle tabellen
- Migraties in `supabase/migrations/`
- Types genereren via: `npx supabase gen types typescript --local > src/types/database.types.ts`

### Migraties (chronologisch)
| # | Bestand | Inhoud |
|---|---|---|
| 001 | `001_profiles.sql` | Profiles tabel + RLS + auto-create trigger bij nieuwe auth user |
| 002 | `002_profile_settings.sql` | `pronouns` en `bio` kolommen aan profiles |
| 003 | `003_worlds.sql` | Worlds tabel + RLS |
| 004 | `004_worlds_header_image_position.sql` | `header_image_position` kolom voor worlds |
| 005 | `005_campaigns.sql` | Campaigns tabel + RLS + index op (world_id, created_at DESC) |
| 006 | `006_campaigns_header_image.sql` | `header_image` en `header_image_position` voor campaigns |
| 007 | `007_sessions.sql` | Sessions tabel + RLS + index op (campaign_id, created_at DESC) + updated_at trigger |

### Status-enums per entiteit

| Entiteit | Statussen |
|---|---|
| World | `draft` · `active` · `archived` |
| Campaign | `draft` · `active` · `archived` · `completed` |
| Session | `planned` · `active` · `completed` · `archived` |

---

## Image Positioning Pattern

Worlds en campaigns ondersteunen versleepbare header-images. De positie wordt opgeslagen als CSS `object-position` string (bijv. `"45% 30%"`).

- Drag-interactie: mouse- en touch-events op het preview-element
- Positie als `"X% Y%"` in `header_image_position` kolom
- Rendering: `style={{ objectPosition: header_image_position }}`
- Gebruik dit patroon consistent voor alle toekomstige entiteiten met header-images

---

## Routing

Routes zijn gedefinieerd in `src/routes/index.tsx`. Lazy-loading voor alle pagina-routes via React Suspense.

Routestructuur (huidige staat):
```
/                        → redirect naar /dashboard of /login
/login                   → AuthLayout
/register                → AuthLayout  ⚠️ pagina is nog een stub
/dashboard               → AppLayout  ⚠️ pagina is nog een stub
/admin                   → AppLayout (requireAdmin loader)
/settings                → AppLayout
/worlds                  → AppLayout
/worlds/:id              → AppLayout
/worlds/:id/edit         → AppLayout
/campaigns/:id           → AppLayout
/campaigns/:id/edit      → AppLayout
/campaigns/:id/sessions  → AppLayout
/sessions/:id/edit       → AppLayout
```

Geplande routes (nog niet geïmplementeerd):
```
/campaigns               → overzicht
/campaigns/:id/locations → locaties
/campaigns/:id/npcs      → NPCs
/campaigns/:id/lore      → lore
/characters/:id          → spelersperspectief
```

### Route loaders
- `requireAuth` — redirect naar `/login` als niet ingelogd
- `requireAdmin` — redirect naar `/dashboard` als niet admin

---

## Vercel Serverless API (`api/admin/`)

Alle endpoints vereisen een geldig admin-JWT in de `Authorization: Bearer <token>` header.

| Methode | Endpoint | Actie |
|---|---|---|
| GET | `/api/admin/users` | Lijst alle profielen |
| POST | `/api/admin/users` | Maak nieuwe gebruiker aan |
| PATCH | `/api/admin/users/:id` | Bewerk gebruiker (naam, email, wachtwoord) |
| DELETE | `/api/admin/users/:id` | Verwijder gebruiker (niet zichzelf) |

`_auth.ts` exporteert `createAdminClient()` (service_role key) en `verifyAdmin(authHeader)`.

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
7. **Design tokens** — gebruik altijd CSS custom properties uit `index.css`, nooit hardcoded hex-waarden.
8. **Nieuwe migraties** — voeg altijd toe aan de migratietabel in dit bestand; nummering is chronologisch en aaneengesloten.

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

## Omgevingsvariabelen

```bash
VITE_SUPABASE_URL=          # Supabase project URL (frontend)
VITE_SUPABASE_ANON_KEY=     # Supabase anon key (frontend)
SUPABASE_SERVICE_ROLE_KEY=  # Service role key (server-side only, nooit in VITE_*)
```

---

## Feature Status

> Bijhouden welke features beschikbaar zijn in de app. Elke keer dat iets wordt afgerond, direct hier bijwerken.

### Infrastructuur
- [x] Vite + React 19 + TypeScript setup
- [x] TailwindCSS v4 configuratie + design tokens (`src/index.css`)
- [x] Supabase client + types
- [x] TanStack Query client + gecentraliseerde query keys
- [x] Zustand stores scaffold (auth, campaign, ui, preferences)
- [x] react-router-dom v7 routing (lazy-loaded, auth guards)
- [x] Sonner toasts (`<Toaster />` in `App.tsx`)
- [x] PWA-configuratie (vite-plugin-pwa, manifest, icons)
- [x] Vercel serverless API (`api/admin/`)

### UI Basis-componenten (`src/components/ui/`)
- [x] `Button` (varianten: primary, secondary, ghost, danger; maten: sm, md, lg)
- [x] `Input` (label, foutmelding, aria-koppeling)
- [x] `Modal` (focus trap, escape-toets, click-outside)
- [x] `Spinner` (3 maten, role="status")
- [x] `Badge` (varianten: default, success, warning, danger, info)
- [x] `Card` (CardHeader, CardTitle, CardContent)
- [x] `Avatar` (fallback-initialen, 3 maten)

### Authenticatie
- [x] Login pagina (email + wachtwoord, validatie, redirect op rol)
- [ ] Registratie pagina ⚠️ stub — formulier nog te bouwen
- [x] Supabase Auth integratie (`signInWithPassword`, `signOut`)
- [x] Protected routes (loaders: `requireAuth`, `requireAdmin`)
- [x] Auth store (Zustand) — `user`, `profile`, `setUser`, `setProfile`, `signOut`

### Admin
- [x] Profiles tabel + RLS (`001_profiles.sql`)
- [x] Profile settings tabel (`002_profile_settings.sql`)
- [x] Vercel serverless API (`api/admin/users.ts`, `api/admin/users/[id].ts`)
- [x] Admin pagina `/admin` — accountbeheer (lijst, aanmaken, bewerken, verwijderen)
- [x] Rol-gebaseerde navigatie (Accountbeheer zichtbaar voor admins)
- [x] Uitloggen via sidebar

### Instellingen
- [x] Instellingen pagina `/settings` (3 tabs: Profiel, Voorkeuren, Info)
- [x] Profiel-tab — naam/avatar formulier (display_name, pronouns, bio)
- [x] Voorkeuren-tab — sessieherinneringen, geluidseffecten, autosave, lore-suggesties, taal (nl/en/de/fr)
- [x] Preferences store (Zustand, per-gebruiker geïsoleerd via user ID)

### Werelden (DM)
- [x] Worlds tabel + RLS (`003_worlds.sql`)
- [x] Header image positie (`004_worlds_header_image_position.sql`)
- [x] Werelden overzicht `/worlds` — grid met WorldCard, lege staat, responsief
- [x] Wereld aanmaken — direct aanmaken + redirect naar bewerken
- [x] Wereld bewerken `/worlds/:id/edit` — naam, subtitle, quote, beschrijving, header image + positie, status
- [x] Wereld verwijderen — met bevestigingsdialoog
- [x] Wereld detail `/worlds/:id` — WorldDetailHeader, WorldDetailDivider, CompassRose
- [x] Navigatie-item "Werelden" in sidebar

### Campaigns (DM)
- [x] Campaigns tabel + RLS (`005_campaigns.sql`)
- [x] Campaign header image (`006_campaigns_header_image.sql`)
- [x] Campaign aanmaken (vanuit wereld detail, "+ Nieuwe kroniek")
- [x] Campaign bewerken `/campaigns/:id/edit` — volledig formulier, image positioning, status
- [x] Campaign verwijderen — met bevestigingsdialoog
- [x] Campaign detail `/campaigns/:id` — breadcrumbs, header, status badge, actieknoppen
- [ ] Campaign overzicht `/campaigns` — lijst/dashboard

### Dashboard
- [ ] Dashboard pagina `/dashboard` ⚠️ stub — inhoud nog te bepalen en bouwen

### Wereld — Locaties
- [ ] Locatie-overzicht per campaign
- [ ] Locatie aanmaken / bewerken / verwijderen
- [ ] Locatie-detailpagina

### Wereld — NPCs
- [ ] NPC-overzicht per campaign
- [ ] NPC aanmaken / bewerken / verwijderen
- [ ] NPC-detailpagina

### Wereld — Lore
- [ ] Lore-overzicht per campaign
- [ ] Lore-item aanmaken / bewerken / verwijderen

### Sessies
- [x] Sessies tabel + RLS (`007_sessions.sql`)
- [x] Sessie-overzicht per campaign `/campaigns/:id/sessions` — grid met SessionCard, "+ Nieuwe sessie"
- [x] Sessie aanmaken — direct aanmaken + redirect naar bewerken
- [x] Sessie bewerken `/sessions/:id/edit` — naam, subtitle, sessienummer, datum, status, beschrijving, DM-notities
- [x] Sessie verwijderen — met bevestigingsdialoog

### Karakter (Spelersperspectief)
- [ ] Karakterblad bekijken
- [ ] Inventaris beheren
- [ ] Karakterstats bijwerken

### AI-integratie
- [ ] AI-agent configuratie
- [ ] Content genereren voor locaties
- [ ] Content genereren voor NPCs
- [ ] Content genereren voor lore
- [ ] Consistentiecheck op gegenereerde content

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
- `Badge` — status-labels
- `Card` — content-containers
- `Avatar` — voor NPCs, spelers

### Feature-componenten (`src/components/[feature]/`)

Gegroepeerd per domein: `campaign/`, `character/`, `location/`, `npc/`, `session/`, `lore/`.

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
- `usePreferencesStore` isoleert per gebruiker via auth user ID

### TanStack Query (server state)

- Query keys zijn arrays, geëxporteerd als constanten vanuit `src/lib/queryKeys.ts`
- Mutations invalideren altijd de relevante queries na succes
- Optimistic updates voor snelle UI-feedback waar zinvol
- `staleTime` instellen per query-type (geen globale standaard van 0)

---

## Supabase

- Client: `src/lib/supabase.ts` — één instantie, geëxporteerd als `supabase`
- RLS (Row Level Security) is altijd ingeschakeld op alle tabellen
- Migraties in `supabase/migrations/`
- Types genereren via: `npx supabase gen types typescript --local > src/types/database.types.ts`

### Migraties (chronologisch)
| # | Bestand | Inhoud |
|---|---|---|
| 001 | `001_profiles.sql` | Profiles tabel + RLS |
| 002 | `002_profile_settings.sql` | Profile settings (voorkeuren) |
| 003 | `003_worlds.sql` | Worlds tabel + RLS |
| 004 | `004_worlds_header_image_position.sql` | Header image positie voor worlds |
| 005 | `005_campaigns.sql` | Campaigns tabel + RLS |
| 006 | `006_campaigns_header_image.sql` | Header image voor campaigns |

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
- [x] TailwindCSS v4 configuratie
- [x] Supabase client + types
- [x] TanStack Query client + gecentraliseerde query keys
- [x] Zustand stores scaffold (auth, campaign, ui, preferences)
- [x] react-router-dom v7 routing (lazy-loaded, auth guards)
- [x] Sonner toasts (`<Toaster />` in `App.tsx`)
- [x] PWA-configuratie (vite-plugin-pwa, manifest, icons)
- [x] Vercel serverless API (`api/admin/`)

### UI Basis-componenten (`src/components/ui/`)
- [x] `Button`
- [x] `Input`
- [x] `Modal` (focus trap)
- [x] `Spinner`
- [x] `Badge`
- [x] `Card`
- [x] `Avatar`

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
- [x] Profiel-tab — naam/avatar formulier
- [x] Voorkeuren-tab — sessieherinneringen, geluidseffecten, autosave, lore-suggesties, taal
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
- [x] Locatie-overzicht per campaign (`/campaigns/:id/locations`)
- [x] Locatie aanmaken / bewerken / verwijderen
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

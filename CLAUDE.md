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
│   └── queryClient.ts   # TanStack Query client
├── pages/               # Route-componenten (één per route)
├── routes/              # Route-definities
├── stores/              # Zustand stores (één per domein)
├── types/               # Gedeelde TypeScript types/interfaces
└── utils/               # Pure utility-functies
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

- Één store per domein: `useCampaignStore`, `useCharacterStore`, `useUIStore`
- Persist alleen wat nodig is (geen gevoelige data)
- Store-bestanden: `src/stores/[domain].store.ts`

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

---

## Routing

Routes zijn gedefinieerd in `src/routes/index.tsx`. Lazy-loading voor alle pagina-routes.

Routestructuur:
```
/                        → redirect naar /dashboard of /login
/login                   → AuthLayout
/register                → AuthLayout
/dashboard               → AppLayout
/campaigns               → AppLayout
/campaigns/:id           → AppLayout
/campaigns/:id/locations → AppLayout
/campaigns/:id/npcs      → AppLayout
/campaigns/:id/lore      → AppLayout
/campaigns/:id/sessions  → AppLayout
/characters/:id          → AppLayout (spelersperspectief)
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
- [x] TanStack Query client
- [x] Zustand stores scaffold
- [x] react-router-dom v7 routing
- [x] Sonner toasts (`<Toaster />` in `App.tsx`)
- [x] PWA-configuratie (vite-plugin-pwa)

### UI Basis-componenten (`src/components/ui/`)
- [x] `Button`
- [x] `Input`
- [x] `Modal` (focus trap)
- [x] `Spinner`
- [x] `Badge`
- [x] `Card`
- [x] `Avatar`

### Authenticatie
- [x] Login pagina (email + wachtwoord, redirect op rol)
- [ ] Registratie pagina
- [x] Supabase Auth integratie (`signInWithPassword`, `signOut`)
- [x] Protected routes (loaders: `requireAuth`, `requireAdmin`)
- [x] Auth store (Zustand) — uitgebreid met `profile` + `signOut`

### Admin
- [x] Profiles tabel + RLS (`supabase/migrations/001_profiles.sql`)
- [x] Vercel serverless API (`api/admin/users.ts`, `api/admin/users/[id].ts`)
- [x] Admin pagina `/admin` — accountbeheer (lijst, aanmaken, bewerken, verwijderen)
- [x] Rol-gebaseerde navigatie (Accountbeheer zichtbaar voor admins)
- [x] Uitloggen via sidebar

### Werelden (DM)
- [x] Werelden tabel + RLS (`supabase/migrations/003_worlds.sql`)
- [x] Werelden overzicht `/worlds` — grid met WorldCard, lege staat, responsief
- [x] Wereld aanmaken — direct aanmaken + redirect naar bewerken
- [x] Wereld bewerken `/worlds/:id` — naam, subtitle, quote, beschrijving, header image, status
- [x] Wereld verwijderen — met bevestigingsdialoog
- [x] Navigatie-item "Werelden" in sidebar

### Campaign Management (DM)
- [ ] Campaign overzicht / dashboard
- [ ] Campaign aanmaken
- [ ] Campaign bewerken / verwijderen

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
- [ ] Sessie-overzicht per campaign
- [ ] Sessie aanmaken / bewerken
- [ ] Sessieaantekeningen

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

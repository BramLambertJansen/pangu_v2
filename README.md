# PANGU v2

AI-ondersteund campaign management platform voor tabletop RPGs (PWA). Een Dungeon
Master bouwt een levende wereld met locaties, NPCs, lore, facties en avonturen; een
AI-agent (Lore Forge) genereert consistente nieuwe content op basis van die wereld.
Spelers beheren hun eigen karakter en inventaris.

## Snelstart

```bash
npm install     # dependencies installeren
npm run dev     # dev-server starten (Vite)
```

Maak een `.env.local` met je Supabase-gegevens (`VITE_SUPABASE_URL`,
`VITE_SUPABASE_ANON_KEY`). Zet `VITE_DEV_MODE=true` om de app offline te draaien
tegen een localStorage-adapter in plaats van Supabase (zie de DEV_MODE-sectie in
`CLAUDE.md`).

## Tech stack

| Laag | Technologie |
|---|---|
| Framework | React 19 + Vite 6 |
| Taal | TypeScript (strict) |
| Styling | TailwindCSS v4 + CSS design tokens |
| Client state | Zustand v5 (persisted) |
| Server state | TanStack Query v5 |
| Routing | react-router-dom v7 |
| Validatie | Zod · Toasts | Sonner |
| Testing | Vitest + jsdom |
| Backend | Supabase (auth, database, storage, realtime) |
| API | Vercel serverless functions (`api/`) |
| AI | Supabase Edge Function (`supabase/functions/ai-chat/`) |

## Scripts

```bash
npm run dev          # dev-server
npm run build        # productie-build (tsc -b + vite build)
npm run preview      # productie-build previewen
npm run lint         # ESLint
npm run type-check   # tsc -b (geen emit)
npm run test         # Vitest (single run)
npm run test:watch   # Vitest watch-modus
npm run check:styles # theming-guardrail (inline-style/hex/pangu-class scan)
npm run check        # lint + type-check + test in één
```

## Conventies

- **UI-teksten** in het Nederlands; **code** (namen, comments, commits) in het Engels.
- Statuslabels en -kleuren altijd via `src/lib/statusMaps.ts`.
- Query-/mutation-logica in `src/hooks/queries/`, nooit inline in pagina's.
- Volledig responsive + A11Y-checklist is een harde exit-eis per feature.

## Documentatie

- [`CLAUDE.md`](./CLAUDE.md) — volledige projectgids: structuur, conventies, design
  system, migraties en feature-status.
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — systeemontwerp en datamodel.
- [`REFACTOR-PLAN.md`](./REFACTOR-PLAN.md) — gefaseerd refactor-plan en voortgang.
- [`docs/design-system/`](./docs/design-system/) — design-system- en theming-strategie.

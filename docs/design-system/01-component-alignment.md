# 01 — Component Alignment & Consolidation

> **Doel:** alle UI van PANGU door één uniforme, token-gedreven componentlaag laten
> lopen, zodat de toekomstige thema-omschakeling (meerdere thema's) triviaal wordt.
> Dit document is zowel het audit-resultaat als het migratiecontract.

## Achtergrond

Het design-system levert een canonieke, **token-gedreven** componentlaag met
**niet-geprefixte** klassen (`.btn`, `.surface`, `.input`, `.badge`, `.tab`, `.modal`,
`.search-bar`…). De app gebruikte historisch `.pangu-*`-klassen én een tweede,
Tailwind-gebaseerd componentsysteem (`<Button>`, `<Badge>`, `<Input>`…). Daarnaast staat
er in veel pagina's ad-hoc inline-styling met **hardgecodeerde `rgba()`/hex**. Dat zijn de
blokkers voor een schone thema-switch.

**Status na deze branch (fase 1):** de canonieke klassenlaag is toegevoegd aan
`src/index.css` en de bestaande `.pangu-*`-klassen zijn **gegroepeerde aliassen** geworden
(zelfde regels, beide selectors). Niets verandert visueel. De look-omschakeling naar DS-v2
(rondere hoeken etc.) is bewust uitgesteld naar **fase 2** (alleen token-waarden wijzigen).

## Klasse-mapping (`.pangu-*` → canoniek)

Beide namen wijzen nu naar dezelfde regels in `src/index.css`. De canonieke naam is het
doel; `.pangu-*` blijft werken tot de sweep (sectie "Resterende migratie") klaar is.

| Huidig (`.pangu-*`) | Canoniek (DS) | Opmerking |
|---|---|---|
| `.pangu-btn` (+ `-primary/-ghost/-gold/-violet-soft/-crimson/-sm`) | `.btn` (+ `-primary/-ghost/-gold/-violet-soft/-crimson/-sm`) | Waarden identiek; nieuw toegevoegd: `.btn-lg`, `.btn-icon`, `.btn-link`, `.hp-step` |
| `.pangu-surface` / `.pangu-surface-glow` | `.surface` / `.surface-glow` | Nieuw: `.surface-2`, `.surface-void`, `.clickable` |
| `.pangu-input` | `.input` | — |
| `.pangu-textarea` | `.textarea` | — |
| `.pangu-select` | `.select-trigger` | — |
| `.pangu-label` | `.label` | — |
| `.pangu-tab-bar` / `.pangu-tab` | `.tab-bar` / `.tab` | Nieuw: `.tab-indicator` (schuivende pill) |
| `.pangu-eyebrow` | `.pg-eyebrow` | — |
| `.pangu-display(-lg/-xl)` | `.pg-display(-lg/-xl)` | — |
| `.pangu-quote` | `.pg-quote` | — |
| `.pangu-section-title` | `.pg-section-title` | — |

**Geen DS-equivalent (blijven app-specifiek):** `.nav-item*`, `.pangu-toggle*`,
`.pangu-breadcrumb*`, `.mobile-topbar*`, `.sidebar-*`, `.entity-card*`, `.campaign-card`,
`.forge-card*`, `.status-badge`, `.skeleton-pulse`, `.page-transition`, `.skip-to-content`,
`.dashboard-link-row`, `.settings-avatar`, `.wdh-*`. Deze zijn token-gedreven en thema-klaar.

**Nieuw toegevoegde canonieke klassen (bestonden niet in de app):** `.search-bar*`,
`.badge`/`.badge-*` (DS-variant naast bestaande `.status-badge`), `.chip`, `.stat-pill`,
`.kicker`, `.div-ornate`, `.tab-indicator`, `.placeholder-img`, `.btn-icon`, `.btn-link`,
`.btn-lg`, `.hp-step`, `.pg-label`, `.pg-mono`.

## React-basiscomponenten — status

| Component | Status |
|---|---|
| `Button` | ✅ **Geconvergeerd** — rendert nu de canonieke `.btn`-laag (177× usages, geen API-wijziging). Variant→`.btn-primary/-secondary/-ghost/-crimson/-gold`, size→`.btn-sm/-lg`. Look wijzigt (pill/uppercase), zoals afgesproken. |
| `Card` | ✅ Rendert nu `.surface` i.p.v. losse Tailwind-utilities. |
| `Input`, `Badge` | Tailwind semantische aliassen (`border-hairline`, `bg-surface`) — token-backed, theme-klaar. |
| `Modal` | Tailwind + inline; kan optioneel naar `.modal*`-klassen (cosmetisch, niet blokkerend). |
| `StatusBadge` | `.status-badge` + dynamische `style.background` uit `statusMaps` — OK. |
| `Breadcrumbs` | ✅ **Geconsolideerd** — `Breadcrumb` (onClick-API) en `Breadcrumbs` (Link-API) samengevoegd tot één component (`src/components/ui/Breadcrumbs.tsx`). Items accepteren `to` of `onClick`; varianten: `standard`/`arcane`, `compact`, `showBack`, `collapse`. CSS in `src/index.css` (`.breadcrumb`, `.bc-*`) volgt de canonieke design-tokens uit `pangu-design-system`. |
| `EmptyState`, `ForgeCard`, `NotificationCenter` | Inline `style={{}}` — gebruiken `var(--token)` (theme-klaar). Hardgecodeerde kleurliterals zijn verwijderd; markup-naar-klasse opschoning is optioneel. |
| `Skeleton`, `Spinner`, `Avatar`, `ConfirmDialog` | Klasse / Tailwind — OK. |

## Hardgecodeerde-kleur hotlist (thema-blokkers)

| Bestand | Locatie | Status |
|---|---|---|
| `src/layouts/AppLayout.tsx` | Starfield `#f5c842` / `#f0ecf7` | **Opgelost** — geëxtraheerd naar `src/components/ui/Starfield.tsx`, leest nu `var(--starfield-gold)` / `var(--starfield-star)`. |
| `src/layouts/AppLayout.tsx` | achtergrond-glows `rgba(155,138,255,0.08)` / `rgba(245,200,66,0.04)` | Token toegevoegd (`--overlay-violet` / `--overlay-gold`); inline-gebruik nog te vervangen. |
| `src/components/campaign/CampaignCard.tsx` | `STATUS_BG` + overlay rgba | ✅ **Opgelost** — kanaal-tokens. |
| `src/components/world/WorldCard.tsx` | scrim rgba | ✅ **Opgelost** — `rgb(var(--void-rgb) / α)`. |
| `src/components/session/SessionCard.tsx` | accent-rgba's | ✅ **Opgelost** — kanaal-tokens. |
| `src/pages/WorldDetailPage.tsx` | DM-notities rgba | ✅ **Opgelost** — `rgb(var(--gold-rgb) / α)`. |
| `src/pages/{Npc,Location}DetailPage.tsx` | `var(--emerald, #hex)` undefined-token fallback | ✅ **Opgelost** — naar `var(--teal)` / `var(--crimson)`. |

### Kanaal-tokens (de kern van de oplossing)

Toegevoegd aan `:root`: `--violet-rgb`, `--gold-rgb`, `--teal-rgb`, `--crimson-rgb`,
`--azure-rgb`, `--muted-rgb`, `--void-rgb` (R G B-triplets). Hiermee worden alle alpha-tints
geschreven als `rgb(var(--violet-rgb) / 0.08)`. **Alle ~355 gekleurde `rgba()`-literals** in
de app zijn hierheen omgezet, waarbij bijna-duplicaat-bases (meerdere goud-/paars-/rood-/
blauw-varianten) zijn genormaliseerd naar hun canonieke familie. De accent-as
(`:root[data-accent]`) overschrijft ook `--violet-rgb`, zodat accentwissel de tints meeneemt.
Overige tokens: `--scrim`, `--scrim-strong`, `--overlay-violet`, `--overlay-gold`,
`--starfield-star`, `--starfield-gold`.

## Status consolidatie

- [x] `<Button>` → canonieke `.btn` (incl. nieuwe `.btn-secondary`).
- [x] `<Card>` → `.surface`.
- [x] Alle gekleurde `rgba()`-literals → kanaal-tokens (355×, 60 bestanden); 0 resterend.
- [x] Stray hex + undefined-token fallbacks opgeruimd (m.u.v. bewuste muntkleuren).
- [x] Starfield + AppLayout-glows token-gedreven.

**Bewuste uitzonderingen (géén thema-kleuren, blijven hardcoded):** muntkleuren
platina/elektrum/koper (`#e5e7eb`/`#c0a060`/`#b87333`) in `CharacterStatsTab`/
`CharacterInventoryTab` — datakleuren, vergelijkbaar met rariteitskleuren. Neutrale
zwart-schaduwen (`rgba(0,0,0,…)`) en witte sheens (`rgba(255,255,255,…)`) blijven, die zijn
thema-onafhankelijk.

### Optioneel (cosmetisch, niet blokkerend voor theming)
- [ ] Inline `style={{}}`-markup → canonieke klassen waar het de leesbaarheid helpt (functioneel al theme-klaar via `var()`).
- [ ] `Modal` optioneel naar `.modal*`-klassen.

## Nieuwe herbruikbare primitives (toegevoegd in deze branch)

`src/components/ui/`: `Starfield`, `SearchBar`, `Chip`, `StatPill`, `OrnateDivider`,
`Tabs` (geanimeerde indicator), `KbdHint`, `DiceRoller`, `StubPanel`. Allemaal
token-gedreven; zichtbaar in `/design-system`.

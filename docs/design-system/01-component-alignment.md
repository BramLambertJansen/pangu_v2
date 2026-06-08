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

| Component | Stijlmethode nu | Actie |
|---|---|---|
| `Button` | Tailwind-utilities (`rounded-md`, `bg-violet`) — **afwijkende look** t.o.v. `.btn` (pill/uppercase) | **Convergentie-beslissing voor fase 2.** Twee knopstijlen bestaan naast elkaar; visueel samenvoegen wijzigt de look, dus uitgesteld. |
| `Input`, `Badge`, `Card` | Tailwind semantische aliassen (`border-hairline`, `bg-surface`) — schoon | Behouden; eventueel later via `.input`/`.badge`/`.surface`. |
| `Modal` | Tailwind + inline | Kan naar `.modal*`-klassen. |
| `StatusBadge` | `.status-badge` + inline `style.background` | OK (dynamische kleur uit `statusMaps`). |
| `Breadcrumbs`, `EmptyState`, `ForgeCard`, `NotificationCenter` | Zware inline `style={{}}` | **Migreren** naar klassen/aliassen (geen kleurwaarden hardcoden). |
| `Skeleton`, `Spinner`, `Avatar`, `ConfirmDialog` | Klasse / Tailwind | OK. |

## Hardgecodeerde-kleur hotlist (thema-blokkers)

| Bestand | Locatie | Status |
|---|---|---|
| `src/layouts/AppLayout.tsx` | Starfield `#f5c842` / `#f0ecf7` | **Opgelost** — geëxtraheerd naar `src/components/ui/Starfield.tsx`, leest nu `var(--starfield-gold)` / `var(--starfield-star)`. |
| `src/layouts/AppLayout.tsx` | achtergrond-glows `rgba(155,138,255,0.08)` / `rgba(245,200,66,0.04)` | Token toegevoegd (`--overlay-violet` / `--overlay-gold`); inline-gebruik nog te vervangen. |
| `src/components/campaign/CampaignCard.tsx` | `STATUS_BG` rgba-map + overlay rgba | **Te migreren** → `statusMaps` + tokens. |
| `src/components/world/WorldCard.tsx` | scrim `rgba(10,10,20,0.98)` | **Te migreren** → `var(--scrim-strong)`. |
| `src/components/session/SessionCard.tsx` | accent-rgba's | **Te migreren** → tokens/`statusMaps`. |
| `src/pages/WorldDetailPage.tsx` | DM-notities `rgba(245,180,50,0.22/0.04)` | **Te migreren** → token. |

Tokens die hiervoor zijn toegevoegd aan `:root`: `--scrim`, `--scrim-strong`,
`--overlay-violet`, `--overlay-gold`, `--starfield-star`, `--starfield-gold` (waarden komen
overeen met het huidige beeld → geen visuele wijziging).

## Resterende migratie (gevolgd als checklist)

De aliaslaag houdt de app werkend en identiek; de sweep is mechanisch opruimwerk.

- [ ] Basiscomponenten met inline styles → klassen (`Breadcrumbs`, `EmptyState`, `ForgeCard`, `NotificationCenter`).
- [ ] Card-kleuren centraliseren via `statusMaps` + tokens (`CampaignCard`, `WorldCard`, `SessionCard`).
- [ ] `WorldDetailPage` + overige pagina's: inline rgba/hex → tokens.
- [ ] Pagina-sweep `src/pages/*`: ad-hoc inline-styling → canonieke klassen/componenten.
- [ ] Fase 2: knop-convergentie (`<Button>` ↔ `.btn`) als onderdeel van de DS-v2 re-skin.
- [ ] Acceptatie-eind­staat: repo-brede grep vindt geen hardgecodeerde hex/`rgba()` meer in `className`/`style` buiten `:root`.

## Nieuwe herbruikbare primitives (toegevoegd in deze branch)

`src/components/ui/`: `Starfield`, `SearchBar`, `Chip`, `StatPill`, `OrnateDivider`,
`Tabs` (geanimeerde indicator), `KbdHint`, `DiceRoller`, `StubPanel`. Allemaal
token-gedreven; zichtbaar in `/design-system`.

# 02 — Feature Backlog (prototype → app)

> **Doel:** vastleggen welke schermen/functionaliteit uit het v2-prototype en het
> design-system nog ontbreken of slechts deels in de huidige app zitten. Dit is de
> bron voor toekomstig feature-werk (fase 3+). Styling valt buiten scope hier.

Bronnen: `proto_handoff/pangu-v2/project/` (prototype) en
`ds_handoff/pangu-design-system/project/` (design-system: `ui_kits/app/`, `preview/`,
`screenshots/`).

Voor elk item is een **stub** met stabiele props-interface alvast in de codebase gezet
(zie `docs/design-system/01` → "Nieuwe herbruikbare primitives" en de feature-mappen),
zodat de uitwerking later geen API-churn geeft.

## Nieuwe schermen

| Feature | Bron | Stub | Beschrijving |
|---|---|---|---|
| Constellatie-atlas / interactieve kaart | `pages-atlas.jsx`, `comp-constellation.html`, `interactive-map.tsx` | `location/ConstellationAtlas` | Zoom-/pan-bare sterrenkaart van locaties met klikbare markers + detailpaneel. Nu alleen lijst-gebaseerd (`LocationsPage`). |
| Plaatsen-accordion | `pages-atlas.jsx` (PlaceAccordion), `comp-place-accordion.html` | `location/PlaceAccordion` | Uitklapbare sublocaties (tavernes, gilden, tempels) met NPC-aanwezigheid. Ontbreekt. |
| Verhaallijn-ruggengraat / hoofdstukken | `pages-1.jsx` (CampaignDetail arc), `comp-chapter-spine.html` | `campaign/StoryArcSpine` | Verticale hoofdstuk-tijdlijn met detailpaneel. Deels: `StoryArcTracker` toont sessies, geen hoofdstuk-model. |
| Reisgezelschap-banner | `pages-1.jsx`, `comp-reisgezelschap-banner.html` | `campaign/ReisgezelschapBanner` | Huidige locatie → bestemming met statusstippen + groepsvitaliteit. Geen reis-/party-locatiestatus aanwezig. |
| ~~Karakter-wizard (7 stappen)~~ ✅ | `wiz-pangu.jsx`, `wiz-steps.jsx`, screenshots `*-wizard-steps.png` | `character/CharacterWizard` | **Gebouwd** — route `/characters/new`; plan + details in `04-character-wizard-plan.md`. |
| Live sessie-weergave | `pages-2.jsx` (SessionView), `comp-session.html` | (toekomstig) | Speelklok, party-tiles, sessielog + AI-kroniek, encounter/notities-panelen. Deels: `SessionDetailPage` + `EncounterRunPage`. |

## Herbruikbare widgets

| Feature | Bron | Stub | Beschrijving |
|---|---|---|---|
| Dobbelsteen-roller | `dice-roller.tsx`, `comp-dice.html` | **`ui/DiceRoller` (volledig)** | d4–d100 met animatie + historie. Geïmplementeerd in deze branch. |
| Gevechtstracker / initiatiefwiel | `combat-tracker.tsx`, `comp-initiative-wheel.html` | `encounter/CombatTracker` | Initiatiefvolgorde, beurt-markering, HP-steppers als widget. Overlap: `EncounterRunPage` (uitbreiden, niet dupliceren). |
| Sanctum-inventaris (paper-doll) | `SanctumInventory.jsx/.html` | `character/SanctumInventory` | Silhouet met slots + rugzak-grid, rariteitsgloed. Overlap: bestaande `equipmentUtils` + slots. |
| Vaardigheden-paneel | `SkillsPanel.jsx`, `comp-skills-panel.html` | `character/SkillsPanel` | 5e-vaardigheden per kenmerk met dot-states. Overlap: skill-data in `CharacterDetailPage`. |
| Spreukslots-tracker | `SpellSlots.jsx`, `comp-spells.html` | `character/SpellSlots` | Pip-knoppen per niveau, gebruikt/resterend. Overlap: pip-weergave in karakter-detail + `SpellsPage`. |
| Factie-overzicht | `pages-1.jsx` (FactionSplitView), `comp-faction-display.html` | `faction/FactionDisplay` | Relatie-/reputatievisualisatie. Overlap: `FactionsPage` (tekstueel). |
| Master-detail layout | `comp-master-detail.html`, diverse split-views | (patroon) | Lijst links + detail rechts, herbruikbaar over entiteiten. |
| Hero-/wereldbanner | `comp-world-hero.html`, `pages-1.jsx` | (patroon) | Full-bleed hero met motto + CTA's. Deels: `WorldDetailHeader`. |
| Quest-lijst-UI | `comp-quest-list.html` | (patroon) | Geformatteerde questlijst met prioriteitsmarker. Overlap: `QuestsPage`. |

## Aandachtspunten

- **Niet dupliceren:** `EncounterRunPage`, `SpellsPage`, `equipmentUtils`/equipment-slots,
  en `StoryArcTracker` bestaan al — de bovenstaande widgets moeten hierop voortbouwen.
- **Datamodel:** atlas-markers, hoofdstukken en reis-/party-status hebben nieuwe
  Supabase-kolommen/tabellen nodig (migraties) — buiten scope van fase 1.
- Prioritering en datamodel-ontwerp volgen in fase 3, ná de DS-v2 re-skin (fase 2).

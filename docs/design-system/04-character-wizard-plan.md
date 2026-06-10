# 04 — Implementatieplan: Karakter-wizard (7 stappen)

> **Status: gebouwd** (fase 1 t/m 5). Afwijkingen t.o.v. dit plan: glyph/accentkleur-personalisatie weggelaten (geen kolommen), `background text` kolom toegevoegd via migratie 049, en het portret in stap 1 is een URL + preview (drag-reposition blijft op de bewerkpagina). **Layout-revisie:** voor rust is `/characters/new` een gefocuste full-screen takeover gemaakt — een standalone route búiten `AppLayout`, waarbij de wizard-rail de app-nav vervangt (merk + stappen + annuleren/overslaan), de paginakop is geschrapt, de content een gecentreerde max-breedte (680px) met gepinde navigatiebalk krijgt, en de keuzekaarten neutraal zijn (kleur alleen bij selectie). `WizardShell` heeft hiervoor `brand`/`railFooter`/`footer`/`fullHeight` slots; de normale (ingebedde) modus blijft bestaan. Zie de sectie "Karakter-wizard" in `CLAUDE.md` voor de gerealiseerde omvang.

> Bouwplan voor de begeleide karakteropbouw uit het prototype (`wiz-pangu.jsx`, `wiz-steps.jsx`, `wiz-data.jsx`, `wiz-ui.jsx`). Vervangt de stub `src/components/character/CharacterWizard.tsx`. Zie ook backlog-item "Karakter-wizard (7 stappen)" in `02-feature-backlog.md`.

---

## 1. Wat het prototype doet (referentie)

Het prototype is een **full-page ervaring** met drie kolommen:

| Zone | Inhoud |
|---|---|
| Links | Stepper-zijbalk (vervangt de app-nav): 7 stappen met ✓/nummer-dots, afgeronde stappen klikbaar, "Cancel" onderaan |
| Midden | Stapinhoud (`WizStepContent`: kicker + titel + subtitel + content + navigatiebalk onderaan met Terug/Doorgaan en validatie-gate) |
| Rechts | Live preview-paneel (228px): avatar/glyph, naam, ras · klasse · level, ability-grid met modifiers, gekozen skills, voortgangspips |

De 7 stappen + afronding:

1. **Basic Info** — naam, accentkleur (4 opties), glyph (15 symbolen), portret-upload
2. **Race** — 10 SRD-rassen als art-banner kaarten (glyph, tagline, ability-bonussen, trait); geselecteerde trait-balk onderin
3. **Class** — 12 SRD-klassen als kaarten (hit die, primary stat, caster-type, skill-pool); subklasse-keuze per klasse
4. **Ability Scores** — drie methodes via tabs: **Point Buy** (27 punten, 8–15, kostentabel), **Standard Array** (15/14/13/12/10/8 klik-toewijzen), **Manual** (3–20); rasbonussen als aparte kolom
5. **Skill Proficiencies** — kies N uit de klasse-pool, gegroepeerd per ability; voortgangspips "x van n"
6. **Backstory** — achtergrond (8 SRD-backgrounds: 2 skills + feature), alignment (3×3 grid), personality/ideal/bond/flaw tekstvelden
7. **Spells** — alleen voor casters (non-casters krijgen een skip-scherm): kies X cantrips + Y level-1 spreuken
8. **Complete** — samenvattingsscherm, "naar character sheet"

State wordt per wijziging naar `localStorage` (`pangu-wizard-v1`) geschreven → de wizard is hervatbaar na refresh.

Wij behouden deze structuur en flow, maar bouwen hem met **canonieke DS-klassen + bestaande primitives** (geen inline styles, zie `check:styles`-vangrail) en **mobile-first**.

---

## 2. Kernbeslissing: waar komt de D&D 5e-data vandaan?

Drie opties overwogen:

| Optie | Beoordeling |
|---|---|
| **A. Statische SRD-dataset in de repo** (aanbevolen) | De wizard heeft een kleine, stabiele, gecureerde dataset nodig: ~10 rassen, 12 klassen, 8 backgrounds, point-buy kosten, skill-pools. Dit is *spelregeldata* die nooit verandert (SRD 5.1, CC-BY-4.0 — attributie staat al in `SettingsPage`). Typed, deterministisch, werkt offline in DEV_MODE, geen latency, geen parsing-risico. Het prototype (`wiz-data.jsx`) is feitelijk al deze dataset — we porten hem naar TypeScript. |
| **B. Open5e API runtime** | De V2 API heeft `races`, `backgrounds`, `feats` endpoints, maar `classes` zit (volwaardig) alleen in V1 als markdown-blobs zonder gestructureerde skill-keuzes; bovendien: netwerk-afhankelijkheid in het kritieke creatie-pad, breekt DEV_MODE, en de API-data mist precies wat de wizard nodig heeft (taglines, glyphs, "kies N skills uit pool" in machine-leesbare vorm). |
| **C. LLM (ai-chat Edge Function)** | Ongeschikt voor regeldata: free-tier rate limit is 5 req/5 uur, non-deterministisch, vereist validatie — en er valt niets te "genereren" aan statische regels. |

**Besluit: hybride met A als basis.**

- **Statisch (`src/data/dnd5e/`):** rassen, klassen, subklassen, backgrounds, alignments, point-buy kosten, standard array. Eén keer cureren (vanuit `wiz-data.jsx` + SRD), daarna onderhoudsvrij.
- **Open5e (bestaande integratie):** alleen voor de **spreuken-stap** — de app heeft al een spreukenbibliotheek (`spells`-tabel, `useImportSpell`, `CompendiumBrowser kind="spell"`). De wizard hergebruikt die in plaats van een eigen spreuklijst.
- **LLM (bestaande `useAI`):** alleen voor **flavor, opt-in**: een "✨ Stel voor"-knop bij personality/ideal/bond/flaw in stap 6 die op basis van ras + klasse + achtergrond + alignment suggesties genereert (zelfde patroon als `LootGeneratorPage`: prompt → JSON → parse → invullen, gebruiker kan bewerken). Geen harde afhankelijkheid: zonder AI werkt de wizard volledig.

---

## 3. Architectuur

### 3.1 Route & entry points

- **Nieuwe route** `/characters/new` → `CharacterWizardPage` (lazy, `requireAuth`), gerenderd **binnen `AppLayout`** maar met een eigen stepper-kolom in het content-gebied. We vervangen de app-nav níet (anders verliezen we mobiele bottom-bar + notificaties en wijkt het af van alle andere pagina's); de prototype-look ontstaat door de stepper als linker rail ín de pagina.
- **`CharactersPage`:** de bestaande `ForgeCharacterCard` navigeert voortaan naar `/characters/new` (begeleid) i.p.v. direct een lege rij te forgen. In de wizard-footer komt een link **"Wizard overslaan → leeg karakter"** die het huidige forge-gedrag (`useCreateCharacter` → edit-pagina) behoudt voor power users.
- **`CharacterWizard` component** houdt zijn bestaande props (`campaignId?`, `onComplete?`, `onCancel?`) zodat hij later ook in de **JoinPage-flow** (`useJoinAndCreateCharacter`) ingebed kan worden — buiten scope van deze iteratie, maar de props maken het mogelijk.
- Querystring `?campaign=<id>` op `/characters/new` vult `campaignId` (zodat kroniek-pagina's er direct heen kunnen linken).

### 3.2 Draft-state & persistentie

- **Geen DB-rij tot afronding.** Anders dan het forge-patroon maken we pas een `characters`-insert bij "Smeed karakter" (met `committed: true`). Voordeel: geen wees-rijen, geen draft-GC nodig, en annuleren is gratis.
- **`useCharacterWizard` hook** (`src/hooks/useCharacterWizard.ts`): houdt één `WizardDraft`-object + `step` in state; elke mutatie schrijft (debounced) naar `localStorage` key `pangu-wizard:<userId>` (zelfde per-user namespacing als `preferences.store`). Bij mount: draft herstellen → "Doorgaan waar je gebleven was". Bij afronden of annuleren: key wissen.
- Validatie per stap als pure functie `validateStep(step, draft): boolean` → drijft de "Doorgaan"-knop én de stepper (alleen terug-navigeren naar afgeronde stappen, zoals het prototype).

```ts
interface WizardDraft {
  name: string; subtitle: string; portraitUrl: string | null
  campaignId: string | null
  raceId: string | null
  classId: string | null; subclassId: string | null
  abilityMethod: 'pointbuy' | 'array' | 'manual'
  scores: Record<AbilityKey, number>          // basisscores zónder rasbonus
  arrayAssigned: Partial<Record<AbilityKey, number>>
  skillProficiencies: string[]                // Nederlandse skill-namen (D5E_SKILLS)
  backgroundId: string | null; alignment: string | null
  personality: string; ideal: string; bond: string; flaw: string
  cantripIds: string[]; spellIds: string[]    // spell-ids uit de bibliotheek
}
```

### 3.3 Data-laag: `src/data/dnd5e/`

Nieuwe map (eerste gebruik van `src/data/`), met types in `src/types/dnd5e-srd.types.ts`:

| Bestand | Inhoud |
|---|---|
| `races.ts` | `SrdRace[]`: id, naam, glyph, tagline (NL), `bonuses: Partial<Record<AbilityKey, number>>`, trait (NL), `speed`, `darkvision`, `languages: string[]`, gradient-index |
| `classes.ts` | `SrdClass[]`: id, naam, glyph, tagline (NL), `hitDie: HitDie`, `primaryAbility`, `casterType: 'none' | 'full' | 'half' | 'pact'`, `spellcastingAbility: 'int' | 'wis' | 'cha' | null`, `savingThrows: AbilityKey[]`, `numSkills`, `skillPool: string[] | 'any'` (**Nederlandse** namen uit `D5E_SKILLS`), `armorProficiencies`/`weaponProficiencies: string[]`, `subclasses: { id, name, desc }[]`, `cantripsKnown`/`spellsKnownL1: number`, `spellSlotsL1: number` |
| `backgrounds.ts` | `SrdBackground[]`: id, naam, desc (NL), `skills: string[]` (NL), `feature`, `languages?: number`, `toolProficiencies?: string[]` |
| `abilityMethods.ts` | `POINT_BUY_BUDGET = 27`, `POINT_BUY_COSTS` (8→0 … 15→9), `STANDARD_ARRAY = [15,14,13,12,10,8]`, `ALIGNMENTS` (3×3, NL-labels) |
| `index.ts` | barrel + lookups (`getRace(id)`, `getClass(id)`, …) |

> **Let op bij het cureren:** de skill-pools in `wiz-data.jsx` zijn Engels; ze moeten gemapt worden naar de bestaande Nederlandse namen in `src/utils/dnd5e.ts` (`'Athletics'` → `'Atletiek'`, `'Sleight of Hand'` → `'Vingervlugheid'`, etc.), omdat `proficient_skills` overal in de app (SkillsPanel, CharacterDetailPage, DmCharacterPanel) die Nederlandse namen verwacht. Een unit test bewaakt dat elke pool-entry in `D5E_SKILLS` voorkomt.

Afgeleide berekeningen in `src/utils/characterDerivation.ts` (puur, testbaar):

```ts
finalScores(draft)        // basis + rasbonus per ability
deriveLevel1Stats(draft)  // hp_max = hitDie-max + CON-mod; armor_class = 10 + DEX-mod;
                          // initiative = DEX-mod; proficiency_bonus = 2; speed/darkvision uit ras;
                          // spell_slots = { '1': { current: n, max: n } } voor casters;
                          // hit_dice_current = 1; xp = 0; xp_next = 300
buildCharacterInsert(draft, userId)  // → volledige characters-Insert (committed: true)
```

`proficient_skills` = klasse-picks ∪ background-skills (dedupliceerd); `saving_throw_proficiencies`, `languages`, `weapon/armor_proficiencies` uit klasse + ras + background samengevoegd.

**Geen migratie nodig** — alle doelvelden bestaan al op `characters` (migraties 014/022/031–034).

### 3.4 Mutations

- **`useForgeCharacterFromWizard`** (in `src/hooks/queries/useCharacters.ts`): één mutation die (1) de character-insert doet, (2) bij spreukkeuze `character_spells`-rijen bulk-insert (`{ character_id, spell_id, prepared: true }`), (3) `queryKeys.characters.all` (+ `byCampaign`) invalideert, (4) navigeert naar `/characters/:id` + `toast.success('Karakter gesmeed')`.
- Alle DB-verkeer via `@/lib/supabase`; de gebruikte patronen (`.insert([])`, `.insert({}).select().single()`) worden door de DEV_MODE `LocalQueryBuilder` ondersteund.

---

## 4. Componenten

### 4.1 Nieuwe **generieke** primitives (`src/components/ui/`) — herbruikbaar buiten de wizard

| Component | Beschrijving | Hergebruik elders |
|---|---|---|
| `WizardShell` | Layout-frame: stepper-rail (desktop) / compacte voortgangsheader (mobiel) + content-slot + `WizardNavBar`. Props: `steps: { id, label, note?, done, active, reachable }[]`, `onStepSelect`, `onCancel` | toekomstige wizards (wereld-onboarding, campaign-setup) |
| `WizardNavBar` | Terug/Doorgaan-balk met validatie-gate (`canNext`), labels per stap, `aria-live` voor blokkeer-reden | idem |
| `SelectableCardGrid` + `SelectableCard` | "Kies één (of N) uit grid"-kaart: gradient-banner (via `pickGradient`), glyph, titel, tagline, meta-regel, geselecteerd-state (`aria-pressed`/radiogroup) | ras/klasse/subklasse/background; later bijv. thema-keuze, template-keuze |
| `PickProgress` | Voortgangspips "x van n gekozen" + resterend-label (`role="status"`) | skill-picks, spell-picks; later bijv. invite-stappen |
| `AbilityScoreEditor` | De drie invoermethodes achter één component (SegmentedControl voor methode; NumberStepper voor point-buy; klik-toewijzen voor array; Input voor manual) + rasbonus/totaal/modifier-kolommen | later herbruikbaar in `CharacterEditPage` (vervangt losse number-inputs) |
| `AlignmentGrid` | 3×3 radiogroup met pijltjesnavigatie | detail-/editpagina's |

### 4.2 Wizard-specifiek (`src/components/character/wizard/`)

| Bestand | Inhoud |
|---|---|
| `CharacterWizard.tsx` | (bestaande stub-locatie) orkestratie: `useCharacterWizard` + `WizardShell` + stap-switch |
| `WizardPreviewPanel.tsx` | rechterkolom (desktop ≥ 1280px; op smallere viewports een uitklapbare samenvattingsbalk boven de navbar): portret/initialen-`Avatar`, naam, ras · klasse, `StatPill`-grid met finale scores + modifiers, skill-`Chip`s |
| `StepBasics.tsx` … `StepSpells.tsx` | 7 stap-componenten (elk ≤ ~150 regels; logica in de hook/utils, niet in de stap) |
| `StepReview.tsx` | afrondingsscherm: volledige samenvatting + "Smeed karakter" |

### 4.3 Hergebruik van bestaande componenten

`FormField`, `Input`, `Select`, `Textarea`, `SegmentedControl` (ability-methode!), `NumberStepper` (point-buy ±), `Chip`, `StatPill`, `Badge`, `Button`, `ConfirmDialog` (annuleren met niet-lege draft), `EmptyState`, `Spinner`, `CompendiumBrowser kind="spell"` (SRD-import in stap 7), `useImagePositioning` (portret, stap 1 — zelfde patroon als `CharacterEditPage`). Stapkoppen via DS-klassen `.kicker` + bestaande typografie-tokens; accenten via `pickGradient(characterGradients)` — géén eigen kleurprop zoals het prototype (accentkleur/glyph slaan we over: `characters` heeft daar geen kolommen voor en `CharacterCard` gebruikt al `characterGradients`).

---

## 5. De stappen in detail (afwijkingen t.o.v. prototype)

| # | Stap | Inhoud | Validatie ("Doorgaan" actief als) |
|---|---|---|---|
| 1 | **Basis** | naam, subtitel (optioneel), kroniek-koppeling (`Select` uit eigen campaigns, voorgevuld via prop/query), portret-URL + drag-reposition | naam niet leeg |
| 2 | **Ras** | `SelectableCardGrid` met 10 rassen; trait-balk onder de selectie met bonussen/snelheid/duisterzicht/talen | ras gekozen |
| 3 | **Klasse** | `SelectableCardGrid` met 12 klassen (hit die, primary, caster-badge); daaronder subklasse-kaarten van de gekozen klasse (optioneel — 5e geeft de meeste subklasses pas op level 3) | klasse gekozen |
| 4 | **Eigenschappen** | `AbilityScoreEditor`; banner toont resterende punten (point buy) of niet-toegewezen waarden (array) | point buy: budget niet overschreden; array: alle 6 toegewezen; manual: altijd |
| 5 | **Vaardigheden** | `PickProgress` + skill-kaarten gegroepeerd per ability uit de klasse-pool; reeds-door-background-gedekte skills gemarkeerd | exact `numSkills` gekozen |
| 6 | **Achtergrond** | background-grid (8), `AlignmentGrid`, vier `Textarea`s (personality/ideal/bond/flaw) met `labelAction` = "✨ Stel voor" (`useAI`, optioneel) | background gekozen (alignment + teksten optioneel) |
| 7 | **Spreuken** | casters: `PickProgress` voor cantrips + level-1 spreuken uit de **spreukenbibliotheek** (`useSpells()` gefilterd op level 0/1 + klasse), met inline "Importeer uit SRD" (`CompendiumBrowser`); non-casters: skip-paneel met flavor-tekst en direct "Doorgaan" | casters: aantallen kloppen óf expliciet "later kiezen"; non-casters: altijd |
| 8 | **Overzicht** | volledige samenvatting per sectie met "wijzig"-links naar de stap; primaire knop **"Smeed karakter"** | — |

UI-teksten volledig **Nederlands** (stapnamen: Basis · Ras · Klasse · Eigenschappen · Vaardigheden · Achtergrond · Spreuken · Overzicht); ras-/klasse-/spreuknamen blijven Engels (D&D-eigennamen, consistent met de rest van de app).

---

## 6. AI-flavor (stap 6, opt-in)

Zelfde patroon als `LootGeneratorPage`:

```
prompt: "Genereer voor een <ras> <klasse> met achtergrond <background> en alignment <alignment>
[indien ingevuld: genaamd <naam>] een JSON-object met velden personality, ideal, bond, flaw.
Nederlands, elk 1–2 zinnen. Antwoord met alleen JSON."
```

→ `ask(messages)` → strip codefences → `JSON.parse` → velden voorinvullen (bestaande tekst nooit stilzwijgend overschrijven: bevestiging via `ConfirmDialog` als er al iets staat). Toon `windowRemaining` als hint; bij rate-limit een nette `toast.error`. Geen blokkerende afhankelijkheid.

---

## 7. A11Y & responsiveness (harde eisen)

- Stepper = `<nav aria-label="Stappen">` met `aria-current="step"`; niet-bereikbare stappen `disabled` (niet alleen visueel).
- Elke stap: één `<h1>` blijft de pagina-titel ("Nieuw karakter"), stap-titels als `<h2>`; bij stapwissel focus naar de stap-heading (`tabIndex={-1}` + `.focus()`), en `role="status"`-regio meldt "Stap x van 8: <naam>".
- Kaart-grids als radiogroup (één keuze) of toggle-buttons met `aria-pressed` (meerkeuze skills/spells); volledige pijltjes-navigatie via bestaand roving-tabindex-patroon (`SegmentedControl` als referentie).
- Point-buy `NumberStepper`s hebben al accessible names; resterend-budget in `aria-live="polite"`.
- **Mobiel (< 640px):** stepper-rail wordt een compacte voortgangsheader (stap x/8 + label + progressbar); preview-paneel wordt een uitklapbare samenvatting; navbar sticky boven de bottom-nav; touch targets ≥ 44px; geen horizontale scroll (grids `grid-cols-2` → `sm:grid-cols-3` → `lg:grid-cols-5`).
- Axe-scan op de wizard-route op alle drie breakpoints vóór merge (test-agent checklist).

---

## 8. Testplan

| Test | Soort |
|---|---|
| `dnd5e-data.test.ts` — elke skill in elke klasse-pool en background bestaat in `D5E_SKILLS`; point-buy kostentabel compleet; elke klasse heeft ≥ 1 subklasse; caster-klassen hebben `spellcastingAbility` | data-integriteit |
| `characterDerivation.test.ts` — finale scores (basis+ras), HP/AC/initiative/PB-derivatie, point-buy budgetvalidatie, array-toewijzing, `buildCharacterInsert` mapping (incl. dedup van skills uit klasse ∪ background) | unit |
| `useCharacterWizard.test.ts` — stapvalidatie-gates, draft persist/restore/clear per user-namespace | unit (patroon: `useEntityEdit.test.ts`) |
| `wizard-steps.test.tsx` — render-flow happy path: stap 1→8, non-caster skipt spreuken, terugnavigeren behoudt keuzes | component |
| Bestaande suites + `type-check` + `lint` + `check:styles` groen | regressie |

---

## 9. Fasering

| Fase | Scope | Resultaat |
|---|---|---|
| **1. Data & derivatie** | `src/data/dnd5e/` + types + `characterDerivation.ts` + tests | regeldata gecureerd en bewaakt; nog geen UI |
| **2. Generieke primitives** | `WizardShell`, `WizardNavBar`, `SelectableCard(Grid)`, `PickProgress`, `AbilityScoreEditor`, `AlignmentGrid` + showcase-secties op `/design-system` | herbruikbare bouwstenen, los van de wizard reviewbaar |
| **3. Wizard-flow** | `useCharacterWizard`, stappen 1–6 + 8, route `/characters/new`, entry vanaf `CharactersPage`, `useForgeCharacterFromWizard`, draft-persistentie | end-to-end karakter aanmaken zonder spreuken |
| **4. Spreuken & AI** | stap 7 (bibliotheek + SRD-import + `character_spells` bulk-insert), "✨ Stel voor" in stap 6 | volledige feature-pariteit met prototype |
| **5. Polish & exit-checks** | a11y-scan (3 breakpoints), responsive QA, `CLAUDE.md` Feature Status + dit document bijwerken, backlog-item afvinken | merge-klaar |

Elke fase is afzonderlijk merge-baar (de stub blijft tot fase 3 gewoon staan; primitives uit fase 2 zijn al zichtbaar op `/design-system`).

---

## 10. Expliciet buiten scope (deze iteratie)

- Startuitrusting/equipment-keuze per klasse (SRD-equipment-packs) — kan later als stap 7b; items-infra bestaat al.
- Glyph/accentkleur-personalisatie uit het prototype — geen kolommen op `characters`; heroverwegen bij een eventueel `character_appearance`-veld.
- Wizard hergebruiken in `JoinPage` (props ondersteunen het al).
- Levels > 1 / level-up-flow — de wizard maakt altijd een level-1 karakter.
- 2024-regels (SRD 5.2): dataset is nu 5.1; `SrdEdition`-switch bestaat al in `open5e.ts` en kan later op de dataset toegepast worden.

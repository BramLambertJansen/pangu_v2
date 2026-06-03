# PANGU v2 — Refactor Plan

Gebaseerd op volledige codebase-analyse (juni 2026). Bevindingen geordend op prioriteit: architectuur & modulariteit → dedup & best practices → UI-componenten & consistentie → A11Y → documentatie.

Elke bevinding heeft: **wat** (bestand/pad + regelnummer), **waarom** het een probleem is, **severity** (hoog/midden/laag), **voorgestelde fix**.

---

## 1. Architectuur & Modulariteit

### 1.1 Inline `useQuery` / `useMutation` in pagina-componenten
**Severity: HOOG**

**Wat:**
- `src/pages/DashboardPage.tsx` — 3 inline `useQuery` blokken (werelden, campaigns, sessies)
- `src/pages/NpcDetailPage.tsx:51` — inline query voor NPC+campaign+world join
- `src/pages/LocationDetailPage.tsx:40` — inline query voor locatie+campaign+world join
- `src/pages/LoreDetailPage.tsx:42` — inline query voor lore+campaign+world join
- `src/pages/SessionDetailPage.tsx:49` — inline query voor sessie+campaign+world join
- `src/pages/QuestDetailPage.tsx:36` — inline query voor quest+campaign+world join
- `src/pages/EncounterDetailPage.tsx:62` — inline query voor encounter+campaign join
- `src/pages/CharacterDetailPage.tsx:545–675` — 8 inline `useMutation`s (HP, inspiratie, death saves, spell slots, condities, class resources, temp HP, long rest)
- `src/pages/CharacterEditPage.tsx:300,360,383,492` — inline queries + save/delete mutaties
- `src/pages/WorldsPage.tsx:18–80`, `src/pages/BestiaryEditPage.tsx:69–136`, `src/pages/LoreEditPage.tsx:38–92`, `src/pages/SessionEditPage.tsx:36–91`, `src/pages/ItemEditPage.tsx:145–225` — query + mutatie inline in edit-pagina's
- `src/pages/CampaignDetailPage.tsx:290–431` — 7 inline forge-mutaties (session, location, lore, npc, quest, encounter, faction, item)
- `src/pages/NpcsPage.tsx:49`, `src/pages/EncountersPage.tsx`, `src/pages/QuestsPage.tsx`, `src/pages/LoresPage.tsx`, `src/pages/LocationsPage.tsx` — forge-mutaties inline

Totaal: **151 directe `.from()` aanroepen** in pages, **118 `useQuery`/`useMutation` definities** buiten `src/hooks/queries/`.

**Waarom een probleem:**
- Violates CLAUDE.md regel 7: "Query logica in `src/hooks/queries/` — nooit inline TanStack Query in pagina-componenten".
- Query-logica is niet herbruikbaar en niet testbaar in isolatie.
- Cache-invalidatie en staleTime inconsistent per pagina.
- Detail-pagina's kunnen de join-query niet delen met andere consumenten.

**Fix:**
Voeg per ontbrekend entity-type een query hook toe in `src/hooks/queries/`:

| Ontbrekende hook | Bestand | Gebruikt door |
|---|---|---|
| `useNpc(id)` + `useNpcWithCampaign(id)` | `useNpc.ts` | NpcDetailPage, NpcEditPage |
| `useLocation(id)` + `useLocationWithCampaign(id)` | `useLocation.ts` | LocationDetailPage, LocationEditPage |
| `useLore(id)` + `useLoreWithCampaign(id)` | `useLore.ts` | LoreDetailPage, LoreEditPage |
| `useQuest(id)` + `useQuestWithCampaign(id)` | `useQuest.ts` | QuestDetailPage, QuestEditPage |
| `useEncounter(id)` + `useEncounterWithCampaign(id)` | `useEncounter.ts` | EncounterDetailPage, EncounterEditPage |
| `useBestiary(id)` + `useBestiaryWithWorld(id)` | `useBestiary.ts` | BestiaryDetailPage, BestiaryEditPage |
| `useCharacter(id)` | `useCharacter.ts` | CharacterDetailPage, CharacterEditPage |
| `useItem(id)` | uitbreiden `useCampaignItems.ts` | ItemEditPage |

Voeg daarnaast forge-mutaties toe aan bestaande hooks:
- `useCreateCampaignNpc`, `useCreateCampaignLocation`, `useCreateCampaignLore`, `useCreateCampaignSession`, `useCreateCampaignQuest`, `useCreateCampaignEncounter` — naar de respectieve `useCampaign*.ts` hooks
- `useCreateWorld` → `useWorld.ts`
- `useCreateBestiary` → `useWorldBestiaries.ts`

Verplaats de 8 character live-mutaties naar `useCharacterMutations.ts` of bundel ze in `useCharacter.ts`.

---

### 1.2 Draft GC-logica gedupliceerd in 12 pagina's
**Severity: HOOG**

**Wat:**
`src/pages/NpcsPage.tsx:30–44`, `LocationsPage.tsx:30–44`, `LoresPage.tsx:30–44`, `QuestsPage.tsx:30–44`, `EncountersPage.tsx:30–44`, `BestiariesPage.tsx:48–63`, `WorldsPage.tsx:58–76`, `CampaignsPage.tsx:77–92`, `SessionsPage.tsx:58–73`, `CampaignItemsPage.tsx:51–66`, `FactionsPage.tsx`, `CharactersPage.tsx` — allemaal identieke `useEffect` die uncommitted drafts ouder dan 30 minuten verwijdert.

**Waarom een probleem:**
Elke pagina bevat ~15 regels identieke code. Eén bug-fix of timeout-aanpassing moet 12× doorgevoerd worden.

**Fix:**
Extraheer naar `src/hooks/useDraftGC.ts`:

```ts
export function useDraftGC(table: string, foreignKey: string, foreignValue: string | undefined) {
  const user = useAuthStore(s => s.user)
  useEffect(() => {
    if (!user?.id || !foreignValue) return
    const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    void supabase
      .from(table).select('id')
      .eq(foreignKey, foreignValue)
      .eq('committed', false)
      .lt('created_at', cutoff)
      .then(({ data }) => {
        if (data?.length) supabase.from(table).delete().in('id', data.map(r => r.id))
      })
  }, [user?.id, foreignValue])
}
```

Gebruik: `useDraftGC('npcs', 'campaign_id', campaignId)`

---

### 1.3 `WorldEditPage` en `CampaignEditPage` gebruiken `useEntityEdit` niet
**Severity: HOOG**

**Wat:**
`src/pages/WorldEditPage.tsx:32–37` en `src/pages/CampaignEditPage.tsx:35–40` beheren `form`, `dirty`, `committed`, `deleteOpen` handmatig — exact het patroon dat `useEntityEdit` al afhandelt. De andere 8 edit-pagina's gebruiken de hook wel.

**Waarom een probleem:**
Twee pagina's met eigen form-state raken bij code-changes uit sync met de overige edit-pagina's. Beide pagina's hebben ook `useImagePositioning` nodig — dat is de reden dat de hook er nooit in terecht is gekomen — maar dat is orthogonaal: `useImagePositioning` werkt naast `useEntityEdit`.

**Fix:**
Vervang de handmatige `useState`-blokken door:

```ts
const { form, set, dirty, committed, setCommitted,
        deleteOpen, setDeleteOpen, resetForm, guard } = useEntityEdit({ entity: world, isNew })

// Extra state voor afbeeldingspositionering — onafhankelijk:
const { position, onMouseDown, onMouseMove, onMouseUp } = useImagePositioning(
  form.header_image_position,
  (pos) => set('header_image_position', pos),
)
```

---

### 1.4 `CharacterDetailPage` en `CharacterEditPage` zijn monolithisch
**Severity: HOOG**

**Wat:**
- `src/pages/CharacterDetailPage.tsx` — 1981 regels: 5 tab-panels als inline JSX, 8 mutaties, hardcoded constanten, lokale helper-functies
- `src/pages/CharacterEditPage.tsx` — 1724 regels: alle formuliervelden van een volledig D&D 5.5e karakter in één component

**Waarom een probleem:**
Componenten >150 regels zijn moeilijk te reviewen en te testen (CLAUDE.md regel: "Componentgrootte ≤ ~150 regels; business logica in hooks, niet in presentationele componenten").

**Fix:**
Splits `CharacterDetailPage` in tab-componenten:

```
src/components/character/
  CharacterStatsTab.tsx       # Stats, saving throws, conditions, resources
  CharacterSkillsTab.tsx      # 18 vaardigheden + expertise
  CharacterInventoryTab.tsx   # Equipment slots + items
  CharacterSpellsTab.tsx      # Spell slots + known spells
  CharacterLoreTab.tsx        # Background, traits, appearance
```

`CharacterDetailPage` wordt dan ~150 regels: tab-state + orchestratie van sub-componenten + data-hooks.

Splits `CharacterEditPage` in secties (als accordeon of tabs), elk ~150 regels.

---

### 1.5 `CampaignDetailPage` is monolithisch (1164 regels, 11 tab-panels)
**Severity: HOOG**

**Wat:**
`src/pages/CampaignDetailPage.tsx` — 11 tab-panels (`party`, `sessions`, `locations`, `lore`, `npcs`, `factions`, `quests`, `encounters`, `treasury`, `notes`, `invite`) als inline JSX + 7 forge-mutaties.

**Waarom een probleem:**
Idem §1.4. Elke tab-panel is ~50–100 regels die de detailpagina onleesbaar maken.

**Fix:**
Extraheer elk tab-panel als component:

```
src/components/campaign/
  PartyTab.tsx
  SessionsTab.tsx
  LocationsTab.tsx
  LoreTab.tsx
  NpcsTab.tsx
  FactionsTab.tsx
  QuestsTab.tsx
  EncountersTab.tsx
  TreasuryTab.tsx
  NotesTab.tsx
  InviteTab.tsx       # (al bestaat InvitePanel; wrapper)
```

De forge-mutaties verhuizen naar de respectieve `useCreate*` hooks (zie §1.1).

---

## 2. Dedup & Best Practices

### 2.1 `abilityModifier` driemaal gedefinieerd
**Severity: HOOG**

**Wat:**
- `src/pages/CharacterDetailPage.tsx:92` — retourneert `string` (`"+3"`)
- `src/pages/BestiaryDetailPage.tsx:43` — retourneert `string`
- `src/pages/EncounterRunPage.tsx:63` — retourneert `number`

**Fix:**
Voeg toe aan `src/utils/dnd5e.ts` (nieuw bestand, zie §2.4):

```ts
export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}
export function formatModifier(score: number): string {
  const mod = abilityModifier(score)
  return mod >= 0 ? `+${mod}` : String(mod)
}
```

Verwijder de drie lokale definities.

---

### 2.2 `SKILLS` en `SAVING_THROWS` twee keer gedefinieerd
**Severity: HOOG**

**Wat:**
- `src/pages/CharacterDetailPage.tsx:62` — `SKILLS: Skill[]` (18 vaardigheden, inclusief `ability` en `abbr`)
- `src/pages/CharacterEditPage.tsx:17` — `SKILLS` (idem, maar iets andere shape: geen `abbr` in sommige velden)
- `src/pages/CharacterDetailPage.tsx:38` — `SAVING_THROWS` (6 items met `statKey`)
- `src/pages/CharacterEditPage.tsx:38` — `SAVING_THROWS` (6 items, iets andere shape)

**Fix:**
Verplaats naar `src/utils/dnd5e.ts` met één gedeeld type en één export. Beide pagina's importeren.

---

### 2.3 `ABILITY_SCORES` tweemaal gedefinieerd
**Severity: MIDDEN**

**Wat:**
- `src/components/character/DmCharacterPanel.tsx:15`
- `src/components/bestiary/DmBestiaryPanel.tsx:11`

Beide definiëren een identieke array van `{ key, label, abbr }` voor STR/DEX/CON/INT/WIS/CHA.

**Fix:**
Naar `src/utils/dnd5e.ts` verplaatsen, beide componenten importeren.

---

### 2.4 D&D 5e constanten verspreid over bestanden
**Severity: MIDDEN**

**Wat:**
De volgende constanten zijn hard-coded op meerdere plaatsen:
- Ability-scores (STR/DEX/CON/INT/WIS/CHA) — `DmCharacterPanel.tsx`, `DmBestiaryPanel.tsx`, `CharacterDetailPage.tsx`, `BestiaryDetailPage.tsx`
- 18 vaardigheden — `CharacterDetailPage.tsx`, `CharacterEditPage.tsx`, `ItemEditPage.tsx:46`
- 17 condities (D&D 5.5e) — alleen in `CharacterDetailPage.tsx:48`
- Spell-level labels (`'1e', '2e', …, '9e'`) — `CharacterDetailPage.tsx:60`
- Spellcasting ability labels (`{ int: 'Intelligentie', … }`) — `CharacterDetailPage.tsx:56`

**Fix:**
Maak `src/utils/dnd5e.ts`:

```ts
export const ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const
export const ABILITY_LABELS: Record<AbilityKey, { label: string; abbr: string }> = { ... }
export const D5E_SKILLS: Skill[] = [ ... ]       // 18 items
export const D5E_SAVING_THROWS: SavingThrow[] = [ ... ]
export const D5E_CONDITIONS: string[] = [ ... ]   // 17 condities
export const SPELL_LEVEL_LABELS = ['Kantrip', '1e', …, '9e'] as const
export function abilityModifier(score: number): number { ... }
export function formatModifier(score: number): string { ... }
```

---

### 2.5 Lokale `pickGradient` + `cardGradients` in 5 detail-pagina's
**Severity: HOOG**

**Wat:**
- `src/pages/NpcDetailPage.tsx:35–44`
- `src/pages/LocationDetailPage.tsx:29–38`
- `src/pages/LoreDetailPage.tsx:27–36`
- `src/pages/EncounterDetailPage.tsx:45–54`
- `src/pages/SessionDetailPage.tsx:21–30`

Elk definieert zijn eigen `cardGradients` array en `pickGradient()` functie, terwijl de juiste paletten al beschikbaar zijn in `src/utils/pickGradient.ts` (`npcGradients`, `locationGradients`, `loreGradients`, `encounterGradients`, `sessionGradients`).

**Fix:**
Verwijder de lokale definities; importeer de correcte paletten:

```ts
// NpcDetailPage
import { pickGradient, npcGradients } from '@/utils/pickGradient'
const gradient = pickGradient(npc.id, npcGradients)
```

---

### 2.6 Lokale statusLabel/statusColor in `NpcDetailPage`
**Severity: MIDDEN**

**Wat:**
`src/pages/NpcDetailPage.tsx:21–33` definieert `statusLabel` en `statusColor` lokaal terwijl `npcStatusLabel` en `npcStatusColor` al bestaan in `src/lib/statusMaps.ts`.

**Fix:**
Importeer vanuit `statusMaps` en verwijder de lokale definities.

---

### 2.7 `formatDate` driemaal gedefinieerd
**Severity: MIDDEN**

**Wat:**
- `src/components/session/SessionCard.tsx:10`
- `src/pages/SessionDetailPage.tsx:33`
- `src/components/admin/UserTable.tsx:36`

**Fix:**
Voeg `formatDate(isoString: string): string` toe aan `src/utils/format.ts` (nieuw bestand of toevoegen aan bestaande utils). Alle drie bestanden importeren.

---

### 2.8 Feature-card componenten structureel identiek
**Severity: MIDDEN**

**Wat:**
`NpcCard.tsx` (217 r), `LocationCard.tsx` (134 r), `LoreCard.tsx` (134 r), `QuestCard.tsx` (137 r), `EncounterCard.tsx` (139 r) zijn voor ~90% identiek: zelfde `EntityCard` wrapper, zelfde gradient-div, zelfde naam/subtitle/status layout. Enige verschillen zijn de entiteits-specifieke velden (tweede badge, beschrijvingsstijl, kleur).

**Waarom een probleem:**
Elke stylewijziging aan de card-layout moet 5× doorgevoerd worden.

**Fix:**
Extraheer een `StandardEntityCard` component in `src/components/ui/`:

```tsx
interface StandardEntityCardProps {
  entity: { id: string; name: string; subtitle?: string | null; status: string; description?: string | null }
  gradient: string
  route: string
  statusLabel: string
  statusColor: string
  secondaryLabel?: string
  secondaryColor?: string
  ariaPrefix: string
}
```

De vijf feature-cards worden wrappers van ~20 regels die entiteits-specifieke waarden doorgeven.

*Opmerking:* `NpcCard.tsx` heeft een extra `NpcRow` export (voor de DM-panel lijst) — die blijft apart.

---

### 2.9 Forge-create mutaties deels niet geëxtraheerd
**Severity: MIDDEN**

**Wat:**
Alleen `useCreateCampaignItem` en `useCreateCampaignFaction` zijn geëxtraheerd naar query hooks. De forge-mutaties voor NPC, Location, Lore, Session, Quest, Encounter, World, Campaign en Bestiary zitten inline in de respectieve overzichtspagina's.

**Fix:** Zie §1.1 — voeg `useCreate*` exports toe aan de bestaande query hooks.

---

### 2.10 `as unknown as SupabaseClient` in 10 bestanden
**Severity: MIDDEN**

**Wat:**
`src/pages/NpcDetailPage.tsx:8`, `CampaignDetailPage.tsx:11`, `FactionEditPage.tsx:8`, `NpcEditPage.tsx:10`, `FactionsPage.tsx:7`, `FactionDetailPage.tsx:6`, `src/hooks/queries/useFaction.ts:9`, `useCampaignFactions.ts:12`, `useEntityLinks.ts:11` — allemaal casten de supabase client weg omdat `database.types.ts` de migrated tabellen (`factions`, `entity_links`) nog niet bevat.

Eén `as any` in `src/hooks/queries/useUserAISettings.ts:15`.

**Waarom een probleem:**
TypeScript-garanties zijn verbroken. Bij type-fouten in queries crasht pas runtime.

**Fix:**
Regenereer `database.types.ts` via `npx supabase gen types typescript --local > src/types/database.types.ts` zodra alle migraties op de lokale Supabase instance draaien. Verwijder alle casts. Verwijder ook de `as any` in `useUserAISettings`.

---

### 2.11 `staleTime` inconsistentie
**Severity: LAAG**

**Wat:**
Query hooks gebruiken inconsistente `staleTime` waarden zonder gedocumenteerde rationale:
- Lijstqueries: mix van `1000 * 30` en `30_000` (functioneel gelijk maar visueel inconsistent)
- Detail queries: mix van `1000 * 30` en `1000 * 60`
- Specials: `1000 * 60 * 5` (invite, AI-settings), `1000 * 60 * 60` (SRD)

**Fix:**
Definieer stale-time constanten in `src/lib/queryClient.ts`:

```ts
export const STALE = {
  list: 30_000,      // overzichten: relatief snel stale
  detail: 60_000,    // detail-pagina's: 1 min
  slow: 5 * 60_000,  // instellingen, invites
  external: 60 * 60_000, // externe API (SRD)
} as const
```

Gebruik in alle query hooks: `staleTime: STALE.list`.

---

### 2.12 Inline `style={{}}` objecten dominant aanwezig
**Severity: MIDDEN**

**Wat:**
527 inline `style={{}}` objecten in `src/components/`, 1552 in `src/pages/`. Het project gebruikt Tailwind v4 maar het grootste deel van de styling is nog inline.

**Waarom een probleem:**
- Inline stijlen kunnen niet gepurgd worden door Tailwind.
- Consistentie lastig te handhaven (bv. `fontSize: 14` vs `text-sm`).
- Verhindert visuele search/grep naar stijlpatronen.

**Fix:**
Migreer inline stijlen naar Tailwind-klassen in volgorde van de component-splits (§1.4, §1.5). Prioriteit: herbruikbare UI-componenten eerst (`ForgeCard.tsx` — bevat nog veel inline stijlen), daarna feature-cards.

---

## 3. UI-componenten & Consistentie

### 3.1 `pangu-btn` CSS-klasse gebruikt in plaats van `Button` component
**Severity: MIDDEN**

**Wat:**
143 directe `className="pangu-btn ..."` gebruiken in de codebase (excl. `index.css`). Meest problematisch:
- `src/components/ui/ConfirmDialog.tsx:35,43` — de dialog gebruikt `pangu-btn` ipv `<Button>`
- `src/components/ErrorBoundary.tsx:87`
- `src/components/world/WorldDetailHeader.tsx:151,154,235,238`
- `src/pages/LocationEditPage.tsx:359,362,387,395,419`
- Alle edit-pagina's voor de "Opslaan" / "Verwijderen" knoppen

**Waarom een probleem:**
`Button` component garandeert `focus-visible` styles, `min-w-[44px]` (touch target), loading state, en TypeScript-safe `variant` prop. Raw `pangu-btn` bypasses dit alles.

**Fix:**
Vervang `pangu-btn` gebruik door `<Button variant="...">`:
- `pangu-btn-primary` → `variant="primary"`
- `pangu-btn-secondary` → `variant="secondary"`
- `pangu-btn-ghost` → `variant="ghost"`
- `pangu-btn-crimson` → `variant="danger"`
- `pangu-btn-gold` — ontbreekt als variant in `Button`; voeg `variant="gold"` toe of gebruik `className` override

Begin bij `ConfirmDialog` en `ErrorBoundary` (laagste risico), dan edit-pagina's.

---

### 3.2 Tab-navigatie in `CampaignDetailPage` is niet toegankelijk
**Severity: MIDDEN**

**Wat:**
`src/pages/CampaignDetailPage.tsx:665–716` — tabbladen zijn geïmplementeerd als `<button>` met `aria-selected` maar zonder `role="tablist"`, `role="tab"`, of roving-tabindex. De tab-panels missen `role="tabpanel"` en `aria-labelledby`.

**Fix:**
Voeg semantische ARIA-rollen toe:
```tsx
<div role="tablist" aria-label="Kroniek secties">
  <button role="tab" aria-selected={activeTab === tab.id} aria-controls={`panel-${tab.id}`} id={`tab-${tab.id}`}>
    {tab.label}
  </button>
</div>
<div role="tabpanel" id={`panel-${tab.id}`} aria-labelledby={`tab-${tab.id}`}>
  ...
</div>
```

Voeg roving-tabindex toe: alleen het actieve tab-item is tab-focusable (`tabIndex={activeTab === tab.id ? 0 : -1}`), pijltoetsen navigeren.

---

### 3.3 `DashboardPage` — `LinkRow` met JS hover
**Severity: LAAG**

**Wat:**
`src/pages/DashboardPage.tsx:18–40` — `LinkRow` is een `<button>` die hover-kleur beheert via `onMouseEnter`/`onMouseLeave` inline handlers in plaats van CSS. Focus-state ontbreekt.

**Fix:**
Vervang door een Tailwind-gestijlde `<button>` of gebruik de `ghost` variant van `Button`.

---

### 3.4 `queryKeys` structuur inconsistent
**Severity: LAAG**

**Wat:**
`src/lib/queryKeys.ts` — de keys voor NPC, Location, Lore, Quest, Encounter detail staan onder `campaigns.npcDetail(id)`, terwijl Characters (`characters.detail(id)`), Items (`items.detail(id)`) en Worlds (`worlds.bestiaryDetail(id)`) eigen namespaces hebben.

**Waarom een probleem:**
Inconsistente structuur maakt gerichte cache-invalidatie foutgevoelig.

**Fix (gecombineerd met §1.1):**
Verplaats entiteits-specifieke keys naar hun eigen namespace zodra de hooks worden geëxtraheerd:

```ts
npcs: {
  byCampaign: (id: string) => ['npcs', 'campaign', id] as const,
  detail: (id: string) => ['npcs', id] as const,
  detailFull: (id: string) => ['npcs', id, 'full'] as const,
},
// idem voor locations, lore, sessions, quests, encounters, bestiaries
```

`campaigns.*Detail` keys verwijderen zodra geen hooks meer direct naar hen verwijzen.

---

## 4. A11Y

### 4.1 `outline: none` zonder zichtbare focus-vervanging
**Severity: MIDDEN**

**Wat:**
`src/index.css:587` (`.mobile-topbar-brand`) en `src/index.css:926,1009` (twee anonieme interactieve kaart-elementen) hebben `outline: none` maar geen zichtbaar alternatief. De form-inputs op regels 277, 305, 331 zijn OK: ze hebben een `box-shadow` focus-state.

**Fix:**
Voeg voor de twee interactieve CSS-klassen een `focus-visible` stijl toe:
```css
.mobile-topbar-brand:focus-visible { outline: 2px solid var(--violet); outline-offset: 2px; }
```

---

### 4.2 `EntityCard` gebruikt `role="button"` op `<article>`
**Severity: LAAG**

**Wat:**
`src/components/ui/EntityCard.tsx:22` — `<article role="button">` is semantisch ongewoon. Screen readers krijgen een conflict tussen landmark-semantiek (`article`) en widget-semantiek (`button`).

**Fix:**
Gebruik `<div role="button">` als het element klikbaar is, of wrappend `<a>` als het een navigatievervanging is. Behoud `<article>` wanneer er geen `onClick` is.

---

### 4.3 Laadstates zonder `aria-live` op individuele secties
**Severity: LAAG**

**Wat:**
Meerdere pagina's tonen een `<Spinner>` in een container zonder `aria-live="polite"` — de spinner is visueel maar niet angekondigd aan screen readers. `NpcsPage`, `BestiariesPage`, `QuestsPage` hebben de annotatie op de skeleton-lijst, maar de "Kroniek laden…" fallback voor de campaign query ontbreekt op meerdere plaatsen.

**Fix:**
Voeg `aria-live="polite"` toe aan de spinner-container, of gebruik `role="status"` met een beschrijvende tekst:
```tsx
<div role="status" aria-live="polite" aria-label="Laden...">
  <Spinner size="lg" />
</div>
```

---

## 5. Documentatie

### 5.1 CLAUDE.md structuur-overzicht verouderd
**Severity: LAAG**

**Wat:**
De Projectstructuur-sectie in `CLAUDE.md` mist:
- `src/components/character/DmCharacterPanel.tsx` (637 regels)
- `src/components/npc/DmNpcPanel.tsx`
- `src/components/bestiary/DmBestiaryPanel.tsx`
- `src/components/campaign/InvitePanel.tsx`
- `src/components/ui/NotificationCenter.tsx`
- `src/pages/JoinPage.tsx`, `ItemsPage.tsx`

**Fix:** Update de structuurlijst in CLAUDE.md na de refactor-fasen.

---

### 5.2 Geen tests voor pagina's en grote hooks
**Severity: LAAG**

**Wat:**
Van de 46 pagina's en 31 hooks zijn er tests voor: 4 UI-componenten, 2 hooks, 1 mapper-module, 1 loader. `CharacterDetailPage`, `CampaignDetailPage`, `EncounterRunPage` hebben geen tests.

**Fix:**
Voeg testbestanden toe als onderdeel van component-splits. Prioriteit: de nieuw te extraheren hooks (`useNpc`, `useCharacter`, `useDraftGC`) en D&D 5e utils (`dnd5e.ts`).

---

## Gefaseerd Plan

### Fase 1 — Extractie query hooks & mutations ✅ AFGEROND
**Branch:** `claude/pangu-v2-refactor-kickoff-2uSRr`
**Commits:** `refactor: extract all query hooks and mutations out of page components` + `fix: resolve all ESLint and test failures`

**Wat gedaan:**
- Nieuwe hooks aangemaakt: `useNpc.ts`, `useLocation.ts`, `useLore.ts`, `useQuest.ts`, `useEncounter.ts`, `useBestiary.ts`, `useCharacter.ts`, `useProfile.ts`
- `useCreate*` exports toegevoegd aan: `useWorld.ts`, `useCampaign.ts`, `useNpc.ts`, `useLocation.ts`, `useLore.ts`, `useSession.ts`, `useQuest.ts`, `useEncounter.ts`, `useBestiary.ts`
- `useSave*` + `useDelete*` exports toegevoegd aan alle entity hooks
- `useDraftGC` hook geëxtraheerd (was al aanwezig, verfijnd)
- `useFactionMembers`, `useSaveFaction`, `useDeleteFaction` toegevoegd aan `useFaction.ts`
- `useUserCampaignsWithWorld`, `useSaveCampaign`, `useDeleteCampaign` toegevoegd aan `useCampaign.ts`
- Alle inline TanStack Query uit pagina's verwijderd — **0 `@tanstack/react-query` imports in `src/pages/`**
- ESLint 0 errors (inclusief `_`-prefix conventie in config)
- TypeScript 0 errors
- Vitest 88/88 tests groen (2 pre-existing test-bugs gefixed: `auth-loaders`, `LinkEntityModal`)

**Resultaat:** `§1.1`, `§1.2`, `§2.9` volledig afgerond.

---

### Fase 2 — D&D 5e constanten & gedeelde utils (laag risico)
**Doel:** Één source of truth voor spelregels-data.

1. Maak `src/utils/dnd5e.ts` met abilities, skills, saving throws, conditions, spell labels, `abilityModifier`, `formatModifier`
2. Maak `src/utils/format.ts` met `formatDate`
3. Voeg `STALE` constanten toe in `src/lib/queryClient.ts`
4. Vervang lokale definities in `CharacterDetailPage`, `CharacterEditPage`, `BestiaryDetailPage`, `EncounterRunPage`, `DmCharacterPanel`, `DmBestiaryPanel`, `ItemEditPage`, `SessionCard`, `SessionDetailPage`, `UserTable`

**Rollen:** Implementor → Review-agent
**Risico:** Laag — constanten-verplaatsing

---

### Fase 2 — D&D 5e constanten & gedeelde utils (laag risico)
**Doel:** Één source of truth voor spelregels-data.

1. Maak `src/utils/dnd5e.ts` met abilities, skills, saving throws, conditions, spell labels, `abilityModifier`, `formatModifier`
2. Maak `src/utils/format.ts` met `formatDate`
3. Voeg `STALE` constanten toe in `src/lib/queryClient.ts`
4. Vervang lokale definities in `CharacterDetailPage`, `CharacterEditPage`, `BestiaryDetailPage`, `EncounterRunPage`, `DmCharacterPanel`, `DmBestiaryPanel`, `ItemEditPage`, `SessionCard`, `SessionDetailPage`, `UserTable`

**Rollen:** Implementor → Review-agent
**Risico:** Laag — constanten-verplaatsing

---

### Fase 3 — Gradient & statusMaps opruimen (laag risico)
**Doel:** Gebruik altijd de centrale utils.

1. Verwijder lokale `cardGradients` + `pickGradient` in `NpcDetailPage`, `LocationDetailPage`, `LoreDetailPage`, `EncounterDetailPage`, `SessionDetailPage`
2. Vervang lokale statusLabel/statusColor in `NpcDetailPage`
3. Regenereer `database.types.ts`; verwijder alle `as unknown as SupabaseClient` casts

**Rollen:** Implementor → Review-agent
**Risico:** Laag

---

### Fase 4 — `useEntityEdit` adoptie & `queryKeys` opschonen (laag–midden risico)
**Doel:** Uniforme form state in alle edit-pagina's.

1. Migreer `WorldEditPage` en `CampaignEditPage` naar `useEntityEdit`
2. Herstructureer `queryKeys` naar entiteits-specifieke namespaces (parallel aan fase 1-uitvoer)
3. Pas alle queryhooks aan op de nieuwe keys; zorg dat invalidatie-aanroepen meegaan

**Rollen:** Implementor → Test-agent (visuele check edit-flows) → Review-agent
**Risico:** Midden — form state en cache keys raken meerdere pagina's

---

### Fase 5 — Component-splits (midden risico)
**Doel:** Geen componenten >150 regels.

1. Split `CharacterDetailPage` in 5 tab-componenten
2. Split `CharacterEditPage` in formuliersecties
3. Split `CampaignDetailPage` in 11 tab-panel-componenten
4. Extraheer `StandardEntityCard` UI-primitief; maak NpcCard, LocationCard, LoreCard, QuestCard, EncounterCard wrappers

**Rollen:** Architect (API-definitie tab-componenten) → Implementor → Test-agent (visuele check alle gewijzigde pagina's + A11Y) → Review-agent
**Risico:** Midden — UI-structuur wordt gerearrangeerd

---

### Fase 6 — `Button`-adoptie & A11Y fixes (laag–midden risico)
**Doel:** Consistente interactieve elementen, groene A11Y-checklist.

1. Vervang `pangu-btn` door `<Button>` in ConfirmDialog, ErrorBoundary, WorldDetailHeader, alle edit-pagina's
2. Voeg `role="tablist"` + `role="tab"` + roving-tabindex toe in CampaignDetailPage tabs
3. Fix `outline: none` zonder focus-vervanging in index.css
4. Fix `EntityCard` role semantiek
5. Voeg `aria-live` toe aan ontbrekende laadstates

**Rollen:** Implementor → Test-agent (axe-scan op gewijzigde pagina's) → Review-agent
**Risico:** Laag

---

### Fase 7 — Inline style → Tailwind (laag, incrementeel)
**Doel:** Consistente styling via Tailwind.

Migreer inline `style={{}}` naar Tailwind-klassen per component-groep, in dezelfde volgorde als de splits. Geen gedragsverandering.

**Rollen:** Implementor → Test-agent (visuele check op alle breakpoints)
**Risico:** Laag

---

## Samenvatting prioriteiten

| # | Bevinding | Severity | Fase | Status |
|---|-----------|----------|------|--------|
| 1.1 | Inline queries/mutaties in pagina's | HOOG | 1 | ✅ |
| 1.2 | Draft GC 12× gedupliceerd | HOOG | 1 | ✅ |
| 2.9 | Forge-mutaties niet geëxtraheerd | MIDDEN | 1 | ✅ |
| 1.3 | WorldEditPage/CampaignEditPage geen useEntityEdit | HOOG | 4 | — |
| 1.4 | CharacterDetailPage/EditPage monolithisch | HOOG | 5 | — |
| 1.5 | CampaignDetailPage monolithisch | HOOG | 5 | — |
| 2.1 | `abilityModifier` 3× gedefinieerd | HOOG | 2 | — |
| 2.2 | SKILLS/SAVING_THROWS 2× gedefinieerd | HOOG | 2 | — |
| 2.5 | Lokale pickGradient in 5 pagina's | HOOG | 3 | — |
| 2.3 | ABILITY_SCORES 2× gedefinieerd | MIDDEN | 2 | — |
| 2.4 | D&D constanten verspreid | MIDDEN | 2 | — |
| 2.6 | Lokale statusMaps in NpcDetailPage | MIDDEN | 3 | — |
| 2.7 | `formatDate` 3× gedefinieerd | MIDDEN | 2 | — |
| 2.8 | Feature-card structuur identiek | MIDDEN | 5 | — |
| 2.10 | `as unknown as SupabaseClient` | MIDDEN | 3 | — |
| 2.11 | staleTime inconsistentie | LAAG | 4 | — |
| 2.12 | Inline style domineert | MIDDEN | 7 | — |
| 3.1 | pangu-btn bypast Button component | MIDDEN | 6 | — |
| 3.2 | Tab-navigatie niet toegankelijk | MIDDEN | 6 | — |
| 3.3 | DashboardPage LinkRow JS hover | LAAG | 6 | — |
| 3.4 | queryKeys inconsistent | LAAG | 4 | — |
| 4.1 | outline:none zonder focus-vervanging | MIDDEN | 6 | — |
| 4.2 | EntityCard role=button op article | LAAG | 6 | — |
| 4.3 | Laadstates zonder aria-live | LAAG | 6 | — |
| 5.1 | CLAUDE.md structuur verouderd | LAAG | na fase 5 | — |
| 5.2 | Geen tests voor pagina's/grote hooks | LAAG | per fase | — |

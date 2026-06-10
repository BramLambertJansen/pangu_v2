import { useState } from 'react'
import {
  useThemeStore,
  ACCENTS,
  DENSITIES,
  THEMES,
  type ThemeAccent,
  type ThemeDensity,
  type ThemeName,
} from '@/stores/theme.store'
import { SearchBar } from '@/components/ui/SearchBar'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { FormField } from '@/components/ui/FormField'
import { IconButton } from '@/components/ui/IconButton'
import { NumberStepper } from '@/components/ui/NumberStepper'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { StatPill } from '@/components/ui/StatPill'
import { OrnateDivider } from '@/components/ui/OrnateDivider'
import { Tabs } from '@/components/ui/Tabs'
import { Toggle } from '@/components/ui/Toggle'
import { Checkbox } from '@/components/ui/Checkbox'
import { RadioGroup, Radio } from '@/components/ui/Radio'
import { DiceRoller } from '@/components/ui/DiceRoller'
import { KbdHint } from '@/components/ui/KbdHint'
import { Card } from '@/components/ui/Card'
import { EntityCard } from '@/components/ui/EntityCard'
import { ForgeCard } from '@/components/ui/ForgeCard'
import { EntityCardSkeleton } from '@/components/ui/EntityCardSkeleton'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Spinner } from '@/components/ui/Spinner'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Modal } from '@/components/ui/Modal'
import { SkillsPanel } from '@/components/character/SkillsPanel'
import { SpellSlots } from '@/components/character/SpellSlots'
import { SanctumInventory } from '@/components/character/SanctumInventory'
import { CharacterWizard } from '@/components/character/CharacterWizard'
import { CombatTracker } from '@/components/encounter/CombatTracker'
import { ConstellationAtlas } from '@/components/location/ConstellationAtlas'
import { PlaceAccordion } from '@/components/location/PlaceAccordion'
import { ReisgezelschapBanner } from '@/components/campaign/ReisgezelschapBanner'
import { StoryArcSpine } from '@/components/campaign/StoryArcSpine'
import { FactionDisplay } from '@/components/faction/FactionDisplay'
import { PartySplitView, PartyVitalsGrid } from '@/components/campaign/PartySplitView'
import { NpcSplitView } from '@/components/npc/NpcSplitView'
import { FactionSplitView } from '@/components/faction/FactionSplitView'
import type { Character } from '@/types/character.types'
import type { Npc } from '@/types/npc.types'
import type { Faction } from '@/types/faction.types'

const COLOR_TOKENS = [
  'void', 'void-2', 'surface', 'surface-2', 'surface-3', 'surface-hover',
  'violet', 'violet-soft', 'violet-deep', 'gold', 'gold-soft', 'teal',
  'crimson', 'azure', 'ink', 'ink-soft', 'muted', 'subtle',
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="pg-section-title mb-4">{title}</h2>
      {children}
    </section>
  )
}

/**
 * In-app design-system gallery. Doubles as the validation surface for the
 * theme switch: the axis controls flip data-theme / data-accent / data-density
 * on <html> and the whole page re-skins with no markup changes.
 */
export default function DesignSystemPage() {
  const { theme, accent, density, setTheme, setAccent, setDensity } = useThemeStore()
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('overzicht')
  const [modalOpen, setModalOpen] = useState(false)
  const [toggled, setToggled] = useState(true)
  const [checked1, setChecked1] = useState(true)
  const [checked2, setChecked2] = useState(false)
  const [radio, setRadio] = useState<string>('actief')
  const [hp, setHp] = useState(42)
  const [seg, setSeg] = useState<'lijst' | 'kaart'>('lijst')
  const [demoStatus, setDemoStatus] = useState('draft')

  return (
    <div className="page-transition mx-auto max-w-5xl">
      <p className="pg-eyebrow">Ontwikkeling</p>
      <h1 className="pg-display mb-2">Design System</h1>
      <p className="mb-8 max-w-2xl text-sm text-muted">
        Levende catalogus van de herbruikbare componenten en tokens. Wissel de assen hieronder om
        de thema-omschakeling te testen — alles wordt token-gedreven her-gestyled, de functionaliteit
        verandert niet.
      </p>

      {/* Theme axis controls */}
      <div className="surface-glow mb-12 flex flex-wrap gap-6 p-5">
        <ThemeAxis<ThemeName> label="Thema" value={theme} options={THEMES} onChange={setTheme} />
        <ThemeAxis<ThemeAccent> label="Accent" value={accent} options={ACCENTS} onChange={setAccent} />
        <ThemeAxis<ThemeDensity> label="Densiteit" value={density} options={DENSITIES} onChange={setDensity} />
      </div>

      <Section title="Kleur-tokens">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {COLOR_TOKENS.map((t) => (
            <div key={t} className="surface overflow-hidden">
              <div className="h-14 w-full" style={{ background: `var(--${t})` }} />
              <div className="p-2 font-mono text-[11px] text-muted">--{t}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Knoppen">
        <div className="flex flex-wrap items-center gap-3">
          <button className="btn btn-primary">Primair</button>
          <button className="btn btn-gold">Goud</button>
          <button className="btn btn-violet-soft">Violet zacht</button>
          <button className="btn btn-ghost">Ghost</button>
          <button className="btn btn-crimson">Crimson</button>
          <button className="btn btn-sm btn-primary">Klein</button>
          <button className="btn btn-link btn-link-gold">Bekijk alles →</button>
        </div>
      </Section>

      <Section title="Formulier-primitives">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Naam" placeholder="Bijv. Aldric de Wijze" hint="Zoals getoond aan spelers" />
          <Select
            label="Status"
            value={demoStatus}
            onChange={(e) => setDemoStatus(e.target.value)}
            options={[
              { value: 'draft', label: 'Concept' },
              { value: 'active', label: 'Actief' },
              { value: 'archived', label: 'Gearchiveerd' },
            ]}
          />
          <Input label="Met fout" defaultValue="te kort" error="Naam moet minstens 3 tekens zijn" />
          <Input label="Met suffix" placeholder="Wachtwoord" suffix={<KbdHint>⏎</KbdHint>} />
        </div>
        <div className="mt-4">
          <Textarea
            label="Beschrijving"
            placeholder="Beschrijf de locatie…"
            rows={3}
            labelAction={
              <Button variant="ghost" size="sm">
                ✦ Genereer
              </Button>
            }
          />
        </div>
        <div className="mt-4">
          <FormField label="Aangepaste controle" hint="FormField wikkelt willekeurige controls">
            <div className="flex items-center gap-3">
              <Toggle checked={toggled} onChange={setToggled} label="Zichtbaar voor spelers" />
            </div>
          </FormField>
        </div>
        <div className="mt-4 max-w-md">
          <SearchBar value={search} onValueChange={setSearch} placeholder="Zoek in de kosmos…" />
        </div>
      </Section>

      <Section title="Acties & invoer-widgets">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <IconButton aria-label="Verwijderen">🗑</IconButton>
            <IconButton aria-label="Bewerken" size="sm">
              ✎
            </IconButton>
          </div>
          <NumberStepper label="HP" value={hp} onChange={setHp} min={0} max={99} />
          <SegmentedControl
            label="Weergave"
            value={seg}
            onChange={setSeg}
            options={[
              { value: 'lijst', label: 'Lijst' },
              { value: 'kaart', label: 'Kaart' },
            ]}
          />
        </div>
      </Section>

      <Section title="Badges, chips & pills">
        <div className="flex flex-wrap items-center gap-3">
          <span className="badge badge-violet">Violet</span>
          <span className="badge badge-gold">Goud</span>
          <span className="badge badge-teal">Teal</span>
          <span className="badge badge-outline">Outline</span>
          <Chip>Mens · Tovenaar</Chip>
          <Chip tone="violet">Reddingsworp</Chip>
          <Chip tone="crimson">Verdoofd</Chip>
          <Chip tone="teal">Ki: 3/5</Chip>
          <StatPill value={42} label="HP" />
          <KbdHint>/</KbdHint>
        </div>
      </Section>

      <Section title="Tabs">
        <div className="flex flex-col gap-6">
          <Tabs
            label="Voorbeeld tabs (pill)"
            value={tab}
            onValueChange={setTab}
            items={[
              { id: 'overzicht', label: 'Overzicht' },
              { id: 'kenmerken', label: 'Kenmerken' },
              { id: 'spreuken', label: 'Spreuken' },
            ]}
          />
          <Tabs
            variant="line"
            label="Voorbeeld tabs (line)"
            value={tab}
            onValueChange={setTab}
            items={[
              { id: 'overzicht', label: 'Overzicht' },
              { id: 'kenmerken', label: 'Kenmerken' },
              { id: 'spreuken', label: 'Spreuken' },
            ]}
          />
        </div>
      </Section>

      <Section title="Ornate Divider">
        <OrnateDivider label="Mijn Werelden" />
        <OrnateDivider label="Violet accent" tone="violet" />
        <OrnateDivider label="Muted toon" tone="muted" />
        <OrnateDivider label="Custom glyph" glyph="✦" />
        <OrnateDivider label="Compact" compact />
        <OrnateDivider />
      </Section>

      <Section title="Dobbelsteen">
        <div className="max-w-sm">
          <DiceRoller />
        </div>
      </Section>

      <Section title="Surfaces">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(['surface', 'surface-2', 'surface-void', 'surface-glow'] as const).map((s) => (
            <div key={s} className={`${s} flex h-24 items-center justify-center`}>
              <code className="font-mono text-[11px] text-muted">.{s}</code>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Kaarten">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <p className="label">Card</p>
            <p className="text-sm text-ink-soft">Generieke container op de canonieke <code>.surface</code>-laag.</p>
          </Card>

          <EntityCard ariaLabel="Voorbeeld entiteitskaart" variant="compact" onClick={() => {}}>
            <div className="p-5">
              <p className="pg-section-title mb-1">EntityCard</p>
              <p className="text-sm text-ink-soft">Klikbare entiteitskaart (compact). Basis voor alle feature-cards.</p>
            </div>
          </EntityCard>

          <ForgeCard
            variant="compact"
            accent="violet"
            title="Nieuw smeden"
            subtitle="Een leeg kosmos wacht."
            onClick={() => {}}
          />

          <div>
            <EntityCardSkeleton count={1} variant="compact" />
          </div>
        </div>
      </Section>

      <Section title="Basis-componenten">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <Avatar fallback="AW" />
            <Avatar fallback="PG" size="sm" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Default</Badge>
            <Badge variant="success">Actief</Badge>
            <Badge variant="warning">Concept</Badge>
            <Badge variant="danger">Mislukt</Badge>
            <Badge variant="info">Gereed</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge label="Voltooid" color="var(--teal)" />
            <StatusBadge label="Actief" color="var(--violet)" />
            <StatusBadge tone="soft" label="Concept" color="var(--gold)" />
            <StatusBadge tone="soft" label="Gearchiveerd" color="var(--muted)" />
          </div>
          <Spinner />
          <button type="button" className="btn-icon" aria-label="Voorbeeld icoonknop">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          </button>
          <div className="flex items-center gap-1">
            <button type="button" className="hp-step" aria-label="HP omlaag">−</button>
            <span className="pg-mono">24</span>
            <button type="button" className="hp-step" aria-label="HP omhoog">+</button>
          </div>
          <Toggle checked={toggled} onChange={setToggled} aria-label="Voorbeeld schakelaar" />
          <button type="button" className="btn btn-violet-soft btn-sm" onClick={() => setModalOpen(true)}>
            Open modal
          </button>
        </div>

        <div className="mt-5 max-w-md">
          <Skeleton className="h-4 w-3/4 rounded" />
          <Skeleton className="mt-2 h-4 w-1/2 rounded" />
        </div>

        <div className="mt-5 h-40 max-w-xs overflow-hidden rounded-[var(--r-lg)]">
          <div className="placeholder-img"><span className="ph-glyph">P</span></div>
        </div>
      </Section>

      <Section title="Toggle / Switch">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex flex-col items-center gap-1">
              <Toggle checked={toggled} onChange={setToggled} aria-label="Default toggle" />
              <span className="text-[11px] text-muted">default · md</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Toggle checked={toggled} onChange={setToggled} variant="gold" aria-label="Gold toggle" />
              <span className="text-[11px] text-muted">gold</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Toggle checked={toggled} onChange={setToggled} size="sm" aria-label="Small toggle" />
              <span className="text-[11px] text-muted">sm</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Toggle checked={toggled} onChange={setToggled} disabled aria-label="Disabled toggle" />
              <span className="text-[11px] text-muted">disabled</span>
            </div>
          </div>
          <div className="max-w-md">
            <Toggle
              checked={toggled}
              onChange={setToggled}
              label="Sessieherinneringen"
              description="Stuur een melding 24 uur vóór een geplande sessie."
            />
          </div>
          <div className="max-w-md">
            <Toggle
              checked={toggled}
              onChange={setToggled}
              variant="gold"
              label="Lore-suggesties"
              description="Gouden variant voor warme, brand-positieve schakelaars."
            />
          </div>
        </div>
      </Section>

      <Section title="Checkbox + Radio">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-3">
            <Checkbox checked={checked1} onChange={setChecked1} label="✦ Magisch item" />
            <Checkbox checked={checked2} onChange={setChecked2} label="Sluipen nadeel (zwaar pantser)" />
            <Checkbox checked indeterminate onChange={() => {}} label="Gedeeltelijk geselecteerd" />
            <Checkbox checked={false} onChange={() => {}} disabled label="Uitgeschakeld" />
          </div>
          <div>
            <RadioGroup
              value={radio}
              onChange={setRadio}
              label="Status van de kroniek"
              description="Bepaalt waar de kroniek verschijnt op het dashboard."
            >
              <Radio value="concept" label="Concept" description="Nog niet zichtbaar voor spelers." />
              <Radio value="actief" label="Actief" description="Loopt momenteel, met geplande sessies." />
              <Radio value="voltooid" label="Voltooid" description="Het verhaal is tot een einde gebracht." />
              <Radio value="gearchiveerd" label="Gearchiveerd" description="Verborgen uit het standaardoverzicht." disabled />
            </RadioGroup>
          </div>
        </div>
      </Section>

      <Section title="Empty states">
        <div className="grid gap-4 md:grid-cols-2">
          <EmptyState
            icon="🌐"
            title="Geen werelden gesmeed"
            description="Jouw Codex is leeg. Begin met het smeden van de eerste wereld voor jouw gezelschap."
            quote="Zelfs de grootste verhalen begonnen met één stap."
            action={<button className="btn btn-primary btn-sm">＋ Wereld smeden</button>}
          />
          <EmptyState
            variant="error"
            icon="⚡"
            title="Nexus onbereikbaar"
            description="De arcane verbinding is verbroken. Controleer je verbinding en probeer opnieuw."
            action={<button className="btn btn-crimson btn-sm">↺ Opnieuw proberen</button>}
          />
          <EmptyState
            inline
            icon="⚔"
            title="Geen helden toegevoegd"
            description="Voeg helden toe om het gezelschap samen te stellen."
            action={<button className="btn btn-ghost btn-sm">＋ Held</button>}
          />
          <EmptyState
            title="Een leeg kosmos wacht."
            description="Begin waar je wil — geen icoon nodig."
          />
        </div>
      </Section>

      <Section title="Breadcrumbs">
        <div className="flex flex-col gap-5">
          <div>
            <p className="label mb-1">Standaard</p>
            <Breadcrumbs
              items={[
                { label: 'Werelden', to: '/worlds' },
                { label: 'Aerthos', to: '/worlds/1' },
                { label: 'Bestiarium' },
              ]}
            />
          </div>

          <div>
            <p className="label mb-1">Met current-prop</p>
            <Breadcrumbs
              items={[
                { label: 'Werelden', to: '/worlds' },
                { label: 'Aerthos', to: '/worlds/1' },
                { label: 'Bestiarium', to: '/worlds/1/bestiary' },
              ]}
              current="Drakeneed"
            />
          </div>

          <div>
            <p className="label mb-1">Compact</p>
            <Breadcrumbs
              compact
              items={[
                { label: 'Werelden', to: '/worlds' },
                { label: 'Aerthos', to: '/worlds/1' },
                { label: 'Bestiarium' },
              ]}
            />
          </div>

          <div>
            <p className="label mb-1">Arcane</p>
            <Breadcrumbs
              variant="arcane"
              items={[
                { label: 'Werelden', to: '/worlds' },
                { label: 'Aerthos', to: '/worlds/1' },
              ]}
              current="Drakeneed"
            />
          </div>

          <div>
            <p className="label mb-1">Met terug-knop</p>
            <Breadcrumbs
              showBack
              onBack={() => {}}
              items={[
                { label: 'Werelden', to: '/worlds' },
                { label: 'Aerthos', to: '/worlds/1' },
                { label: 'Bestiarium' },
              ]}
            />
          </div>

          <div>
            <p className="label mb-1">Ingeklapt (diep pad)</p>
            <Breadcrumbs
              collapse={{ start: 1, end: -2 }}
              items={[
                { label: 'Werelden', to: '/worlds' },
                { label: 'Aerthos', to: '/worlds/1' },
                { label: 'Kronieken', to: '/campaigns' },
                { label: 'De Verloren Vesting', to: '/campaigns/1' },
                { label: 'Sessies', to: '/campaigns/1/sessions' },
                { label: 'Sessie IV' },
              ]}
            />
          </div>

          <div>
            <p className="label mb-1">Met acties</p>
            <Breadcrumbs
              items={[
                { label: 'Werelden', to: '/worlds' },
                { label: 'Aerthos' },
              ]}
              actions={<button className="btn btn-sm btn-ghost">Bewerken</button>}
            />
          </div>
        </div>
      </Section>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Voorbeeld modal"
        footer={
          <>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setModalOpen(false)}>Annuleren</button>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setModalOpen(false)}>Bevestigen</button>
          </>
        }
      >
        <p className="text-sm text-ink-soft">
          Token-gedreven dialoog met focus-trap, gestructureerde head/body/foot
          en violet-glow box-shadow. Sluit met Escape, de kruisknop of de annuleren-knop.
        </p>
      </Modal>

      <OrnateDivider label="Gevechts- & locatiewidgets" />

      <Section title="CombatTracker">
        <CombatTracker
          encounterId="demo"
          activeIndex={1}
          combatants={[
            { id: 'c1', name: 'Aldric de Grijze', initiative: 18, hp: 32, maxHp: 45 },
            { id: 'c2', name: 'Sareth Schaduwvoet', initiative: 15, hp: 28, maxHp: 28 },
            { id: 'c3', name: 'Bandiet Kapitein', initiative: 12, hp: 6, maxHp: 24 },
            { id: 'c4', name: 'Grot Trol', initiative: 8, hp: 0, maxHp: 84 },
          ]}
        />
      </Section>

      <Section title="PlaceAccordion">
        <PlaceAccordion
          locationId="demo"
          places={[
            { id: 'p1', name: 'Grote Hal', type: 'Hal', npcCount: 3 },
            { id: 'p2', name: 'Smidse', type: 'Werkplaats', npcCount: 1 },
            { id: 'p3', name: 'Geheime Doorgang', type: 'Doorgang' },
          ]}
        />
      </Section>

      <Section title="ReisgezelschapBanner">
        <ReisgezelschapBanner
          campaignId="demo"
          currentLocation="Havensstad Myrwater"
          destination="Duistere Vesting"
          partyVitals={{ avgLevel: 7, totalHp: 148, treasury: 430 }}
          partyMembers={[
            { id: 'm1', name: 'Aldric' },
            { id: 'm2', name: 'Sareth' },
            { id: 'm3', name: 'Brix' },
            { id: 'm4', name: 'Yenna' },
          ]}
        />
      </Section>

      <Section title="SkillsPanel">
        <SkillsPanel
          proficientSkills={['athletics', 'perception', 'stealth', 'history']}
          expertiseSkills={['perception']}
          abilityScores={{ str: 16, dex: 14, con: 13, int: 12, wis: 15, cha: 10 }}
          proficiencyBonus={3}
        />
      </Section>

      <Section title="SpellSlots">
        <SpellSlots
          slots={[4, 3, 3, 1, 0, 0, 0, 0, 0]}
          used={[1, 2, 0, 0, 0, 0, 0, 0, 0]}
        />
      </Section>

      <Section title="SanctumInventory">
        <SanctumInventory characterId="demo" items={[]} />
      </Section>

      <OrnateDivider label="Split View — meester/detail layouts" />

      <Section title="PartySplitView">
        <PartySplitView characters={DEMO_CHARACTERS} />
        <div style={{ marginTop: 24 }}>
          <PartyVitalsGrid characters={DEMO_CHARACTERS} />
        </div>
      </Section>

      <Section title="NpcSplitView">
        <NpcSplitView npcs={DEMO_NPCS} factions={DEMO_FACTIONS} />
      </Section>

      <Section title="FactionSplitView">
        <FactionSplitView factions={DEMO_FACTIONS} npcs={DEMO_NPCS} />
      </Section>

      <OrnateDivider label="Toekomstige componenten" />

      <Section title="Stubs (in ontwikkeling)">
        <div className="grid gap-4 md:grid-cols-2">
          <CharacterWizard />
          <ConstellationAtlas campaignId="demo" />
          <StoryArcSpine campaignId="demo" />
          <FactionDisplay campaignId="demo" />
        </div>
      </Section>
    </div>
  )
}

/* ── Demo data for split-view previews ── */

const DEMO_CHARACTERS: Character[] = [
  {
    id: 'c1', user_id: 'u1', campaign_id: null, name: 'Aldric Stonehammer',
    subtitle: null, character_class: 'Paladin', character_subclass: 'Oath of Devotion',
    character_race: 'Dwarf', level: 7, xp: 2350, xp_next: 6500,
    hp_current: 58, hp_max: 72, temp_hp: 0, armor_class: 18, speed: 25,
    fly_speed: 0, swim_speed: 0, climb_speed: 0, burrow_speed: 0, initiative: 1,
    proficiency_bonus: 3,
    stat_str: 18, stat_dex: 12, stat_con: 16, stat_int: 10, stat_wis: 14, stat_cha: 16,
    gold: 245, silver: 0, copper: 0, platinum: 0, electrum: 0,
    description: 'Een rechtvaardige dwerg-paladin op zoek naar zijn verloren clan.',
    notes: null, status: 'active', proficient_skills: ['athletics', 'perception'],
    saving_throw_proficiencies: ['wis', 'cha'], expertise_skills: [],
    languages: [], tool_proficiencies: [], weapon_proficiencies: [], armor_proficiencies: [],
    inspiration: false, hit_die: 'd10', hit_dice_current: 7,
    death_save_successes: 0, death_save_failures: 0, exhaustion: 0,
    alignment: 'Wettig Goed', personality_traits: '', ideals: '', bonds: '', flaws: '',
    portrait_url: null, portrait_position: 'center',
    feats: [], weapon_masteries: [], active_conditions: [],
    darkvision: 60, special_senses: null,
    age: null, height: null, weight: null, appearance: null,
    spell_slots: {}, concentrating: false, concentration_spell: null,
    spellcasting_ability: null, class_resources: {},
    committed: true, created_at: '', updated_at: '',
  },
  {
    id: 'c2', user_id: 'u1', campaign_id: null, name: 'Sareth Moonwhisper',
    subtitle: null, character_class: 'Wizard', character_subclass: 'School of Illusion',
    character_race: 'Elf', level: 7, xp: 3100, xp_next: 6500,
    hp_current: 32, hp_max: 48, temp_hp: 0, armor_class: 13, speed: 30,
    fly_speed: 0, swim_speed: 0, climb_speed: 0, burrow_speed: 0, initiative: 3,
    proficiency_bonus: 3,
    stat_str: 8, stat_dex: 16, stat_con: 12, stat_int: 20, stat_wis: 14, stat_cha: 10,
    gold: 90, silver: 0, copper: 0, platinum: 0, electrum: 0,
    description: 'Een sluwe elf-magiër gespecialiseerd in illusies.',
    notes: null, status: 'active', proficient_skills: ['arcana', 'history'],
    saving_throw_proficiencies: ['int', 'wis'], expertise_skills: ['arcana'],
    languages: [], tool_proficiencies: [], weapon_proficiencies: [], armor_proficiencies: [],
    inspiration: true, hit_die: 'd6', hit_dice_current: 7,
    death_save_successes: 0, death_save_failures: 0, exhaustion: 0,
    alignment: 'Chaotisch Neutraal', personality_traits: '', ideals: '', bonds: '', flaws: '',
    portrait_url: null, portrait_position: 'center',
    feats: [], weapon_masteries: [], active_conditions: [],
    darkvision: 60, special_senses: null,
    age: null, height: null, weight: null, appearance: null,
    spell_slots: {}, concentrating: true, concentration_spell: null,
    spellcasting_ability: 'int', class_resources: {},
    committed: true, created_at: '', updated_at: '',
  },
] as Character[]

const DEMO_FACTIONS: Faction[] = [
  {
    id: 'f1', campaign_id: 'camp1', user_id: 'u1',
    name: 'Zilveren Schemering', subtitle: null,
    type: 'arcane', reputation: 'friendly', status: 'active',
    motto: 'Kennis is de enige ware macht.', goals: 'De oude arcanumteksten verzamelen.',
    description: 'Een geheime genootschap van magiërs dat zich inzet voor het behoud van magische kennis.',
    notes: null, committed: true, created_at: '', updated_at: '',
  },
  {
    id: 'f2', campaign_id: 'camp1', user_id: 'u1',
    name: 'Ijzeren Troon', subtitle: null,
    type: 'noble_house', reputation: 'unfriendly', status: 'active',
    motto: 'Macht door ijzer en bloed.', goals: 'Controle over de handelswegen.',
    description: 'Een ambitieuze adellijke familie die streeft naar politieke dominantie.',
    notes: null, committed: true, created_at: '', updated_at: '',
  },
] as Faction[]

const DEMO_NPCS: Npc[] = [
  {
    id: 'n1', campaign_id: 'camp1', user_id: 'u1',
    name: 'Myrna Ashvale', subtitle: null,
    npc_role: 'Herbergier', status: 'active', faction_id: 'f1',
    description: 'Een vriendelijke herbergier met geheimen uit het verleden.',
    notes: null, created_at: '', updated_at: '',
  },
  {
    id: 'n2', campaign_id: 'camp1', user_id: 'u1',
    name: 'Lord Caius', subtitle: null,
    npc_role: 'Edelman', status: 'archived', faction_id: 'f2',
    description: 'Een meedogenloze edelman met duistere plannen voor de regio.',
    notes: null, created_at: '', updated_at: '',
  },
] as Npc[]

function ThemeAxis<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: readonly T[]
  onChange: (v: T) => void
}) {
  return (
    <div>
      <p className="label">{label}</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            className={value === opt ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-ghost'}
            aria-pressed={value === opt}
            onClick={() => onChange(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

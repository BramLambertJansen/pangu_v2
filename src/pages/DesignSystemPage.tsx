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
import { Chip } from '@/components/ui/Chip'
import { StatPill } from '@/components/ui/StatPill'
import { OrnateDivider } from '@/components/ui/OrnateDivider'
import { Tabs } from '@/components/ui/Tabs'
import { DiceRoller } from '@/components/ui/DiceRoller'
import { KbdHint } from '@/components/ui/KbdHint'
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

      <Section title="Formulier">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="ds-input">Naam</label>
            <input id="ds-input" className="input" placeholder="Bijv. Aldric de Wijze" />
          </div>
          <div>
            <label className="label" htmlFor="ds-select">Status</label>
            <select id="ds-select" className="select-trigger">
              <option>Concept</option>
              <option>Actief</option>
            </select>
          </div>
        </div>
        <div className="mt-4 max-w-md">
          <SearchBar value={search} onValueChange={setSearch} placeholder="Zoek in de kosmos…" />
        </div>
      </Section>

      <Section title="Badges, chips & pills">
        <div className="flex flex-wrap items-center gap-3">
          <span className="badge badge-violet">Violet</span>
          <span className="badge badge-gold">Goud</span>
          <span className="badge badge-teal">Teal</span>
          <span className="badge badge-outline">Outline</span>
          <Chip>Mens · Tovenaar</Chip>
          <StatPill value={42} label="HP" />
          <KbdHint>/</KbdHint>
        </div>
      </Section>

      <Section title="Tabs">
        <Tabs
          label="Voorbeeld tabs"
          value={tab}
          onValueChange={setTab}
          items={[
            { id: 'overzicht', label: 'Overzicht' },
            { id: 'kenmerken', label: 'Kenmerken' },
            { id: 'spreuken', label: 'Spreuken' },
          ]}
        />
      </Section>

      <Section title="Divider">
        <OrnateDivider label="Mijn Werelden" />
      </Section>

      <Section title="Dobbelsteen">
        <div className="max-w-sm">
          <DiceRoller />
        </div>
      </Section>

      <OrnateDivider label="Toekomstige componenten" />

      <Section title="Stubs (in ontwikkeling)">
        <div className="grid gap-4 md:grid-cols-2">
          <SkillsPanel />
          <SpellSlots />
          <SanctumInventory characterId="demo" />
          <CharacterWizard />
          <CombatTracker encounterId="demo" />
          <ConstellationAtlas campaignId="demo" />
          <PlaceAccordion locationId="demo" />
          <ReisgezelschapBanner campaignId="demo" />
          <StoryArcSpine campaignId="demo" />
          <FactionDisplay campaignId="demo" />
        </div>
      </Section>
    </div>
  )
}

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

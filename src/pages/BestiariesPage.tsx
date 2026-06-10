import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Modal } from '@/components/ui/Modal'
import { BestiaryRow, ForgeBestiaryCard } from '@/components/bestiary/BestiaryCard'
import { DmBestiaryPanel } from '@/components/bestiary/DmBestiaryPanel'
import { OrnateDivider } from '@/components/ui/OrnateDivider'
import { CompendiumBrowser } from '@/components/compendium/CompendiumBrowser'
import type { Open5eMonster } from '@/types/open5e.types'
import { useWorld } from '@/hooks/queries/useWorld'
import { useWorldBestiaries, useCreateBestiary } from '@/hooks/queries/useWorldBestiaries'
import { useImportMonster } from '@/hooks/queries/useSrdSearch'
import { useDraftGC } from '@/hooks/useDraftGC'

export default function BestiariesPage() {
  const { id: worldId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [srdOpen, setSrdOpen] = useState(false)

  const { data: world, isLoading: worldLoading } = useWorld(worldId)
  const { data: bestiaries, isLoading: bestiariesLoading } = useWorldBestiaries(worldId)
  const createBestiary = useCreateBestiary(worldId!)
  const importMonster = useImportMonster(worldId ?? '')
  const importedSlugs = useMemo(
    () => (bestiaries ?? []).map(b => b.source_slug).filter((s): s is string => s !== null),
    [bestiaries],
  )

  useDraftGC('bestiaries', 'world_id', worldId)

  // Set first bestiary as selected when data loads
  useEffect(() => {
    if (bestiaries && bestiaries.length > 0 && !selectedId) {
      setSelectedId(bestiaries[0].id)
    }
  }, [bestiaries, selectedId])

  if (worldLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }} aria-live="polite" aria-label="Wereld laden...">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!world) {
    return (
      <div>
        <p style={{ color: 'var(--muted)' }}>Wereld niet gevonden.</p>
        <Button variant="ghost" onClick={() => navigate('/worlds')} style={{ marginTop: 16 }}>
          ← Terug naar werelden
        </Button>
      </div>
    )
  }

  const committed = bestiaries?.filter(b => b.committed) ?? []
  const selected = committed.find(b => b.id === selectedId) ?? committed[0] ?? null

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 24 }}>
        <Breadcrumbs compact items={[
          { label: 'Werelden', to: '/worlds' },
          { label: world.name, to: `/worlds/${worldId}` },
          { label: 'Bestiarium' },
        ]} />
      </div>

      {/* Page header */}
      <header style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p className="pangu-eyebrow">Wereld — {world.name}</p>
          <h1 className="pangu-display-xl">Bestiarium</h1>
          <p style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-soft)' }}>
            Catalogiseer de wezens en monsters van deze wereld.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSrdOpen(true)}
          style={{
            flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 16px',
            background: 'rgb(var(--azure-rgb) / 0.08)',
            border: '1px solid rgb(var(--azure-rgb) / 0.3)',
            borderRadius: 'var(--r-full)',
            color: 'var(--azure)',
            fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            cursor: 'pointer', transition: 'all var(--t-fast)', whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgb(var(--azure-rgb) / 0.15)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgb(var(--azure-rgb) / 0.08)' }}
          aria-label="Wezens importeren uit de SRD via Open5e"
        >
          <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Importeer uit SRD
        </button>
      </header>

      <Modal open={srdOpen} onClose={() => setSrdOpen(false)} title="Wezens importeren uit de SRD" size="lg">
        <CompendiumBrowser
          kind="monster"
          onImport={(data, edition) => importMonster.mutate({ monster: data as Open5eMonster, edition })}
          importedSlugs={importedSlugs}
          isPending={importMonster.isPending}
        />
      </Modal>

      <OrnateDivider label={`${committed.length} wezen${committed.length !== 1 ? 's' : ''}`} />

      {/* Splitscreen */}
      <style>{`
        .bestiary-split { display: grid; grid-template-columns: minmax(240px, 2fr) minmax(320px, 3fr); gap: 20px; align-items: start; }
        @media (max-width: 700px) { .bestiary-split { grid-template-columns: 1fr; } }
      `}</style>
      <div style={{ marginTop: 24 }}>
        {bestiariesLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }} aria-live="polite" aria-busy="true">
            <Spinner size="md" />
          </div>
        ) : committed.length === 0 ? (
          <>
            <EmptyState
              title="Nog geen wezens"
              description="Vul het bestiarium met de gevaarlijke en mysterieuze wezens van deze wereld."
            />
            <div style={{ marginTop: 16, maxWidth: 280 }}>
              <ForgeBestiaryCard onClick={() => createBestiary.mutate()} loading={createBestiary.isPending} />
            </div>
          </>
        ) : (
          <div className="bestiary-split">
            {/* Left: bestiary list */}
            <div>
              <ul
                style={{ display: 'flex', flexDirection: 'column', gap: 8, listStyle: 'none', padding: 0, margin: '0 0 10px' }}
                role="list"
                aria-label="Wezens in dit bestiarium"
              >
                {committed.map((bestiary) => (
                  <li key={bestiary.id}>
                    <BestiaryRow
                      bestiary={bestiary}
                      selected={bestiary.id === (selected?.id)}
                      onSelect={() => setSelectedId(bestiary.id)}
                    />
                  </li>
                ))}
              </ul>
              <ForgeBestiaryCard onClick={() => createBestiary.mutate()} loading={createBestiary.isPending} />
            </div>

            {/* Right: DM stat block panel */}
            {selected && (
              <div style={{ position: 'sticky', top: 20, maxHeight: 'calc(100vh - 180px)' }}>
                <DmBestiaryPanel bestiary={selected} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

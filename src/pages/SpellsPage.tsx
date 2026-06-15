import { useState, useMemo } from 'react'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { SpellCard } from '@/components/spell/SpellCard'
import { CompendiumBrowser } from '@/components/compendium/CompendiumBrowser'
import { useSpells, useDeleteSpell } from '@/hooks/queries/useSpells'
import { useImportSpell } from '@/hooks/queries/useSrdSearch'
import type { Open5eSpell } from '@/types/open5e.types'
import type { Spell, SpellSchool } from '@/types/spell.types'
import { spellSchoolLabel, spellSchoolColor } from '@/lib/statusMaps'

const ALL_SCHOOLS: SpellSchool[] = [
  'abjuration', 'conjuration', 'divination', 'enchantment',
  'evocation', 'illusion', 'necromancy', 'transmutation',
]

export default function SpellsPage() {
  const { data: spells, isLoading } = useSpells()
  const deleteSpell = useDeleteSpell()
  const importSpell = useImportSpell()
  const [srdOpen, setSrdOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [detailSpell, setDetailSpell] = useState<Spell | null>(null)
  const [schoolFilter, setSchoolFilter] = useState<SpellSchool | 'all'>('all')
  const [levelFilter, setLevelFilter] = useState<number | 'all'>('all')

  const importedSlugs = useMemo(
    () => (spells ?? []).map(s => s.source_slug).filter((s): s is string => s !== null),
    [spells],
  )

  const filtered = useMemo(() => {
    let list = spells ?? []
    if (schoolFilter !== 'all') list = list.filter(s => s.school === schoolFilter)
    if (levelFilter !== 'all') list = list.filter(s => s.level === levelFilter)
    return list
  }, [spells, schoolFilter, levelFilter])

  const spellToDelete = spells?.find(s => s.id === deleteId)

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p className="pg-eyebrow">Persoonlijke bibliotheek</p>
          <h1 className="pg-display-xl">Spreuken</h1>
          <p style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-soft)' }}>
            Importeer spreuken uit de SRD en bouw je spreukbibliotheek.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSrdOpen(true)}
          style={{
            flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 16px',
            background: 'rgb(var(--violet-rgb) / 0.08)',
            border: '1px solid rgb(var(--violet-rgb) / 0.3)',
            borderRadius: 'var(--r-full)',
            color: 'var(--violet)',
            fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            cursor: 'pointer', transition: 'all var(--t-fast)', whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgb(var(--violet-rgb) / 0.15)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgb(var(--violet-rgb) / 0.08)' }}
          aria-label="Spreuken importeren uit de SRD via Open5e"
        >
          <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Importeer uit SRD
        </button>
      </div>

      {/* Filters */}
      {!isLoading && (spells?.length ?? 0) > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          <select
            value={levelFilter}
            onChange={e => setLevelFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            aria-label="Filteren op niveau"
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--hairline)', background: 'var(--surface-2)', color: 'var(--ink)', fontSize: 12, cursor: 'pointer' }}
          >
            <option value="all">Alle niveaus</option>
            <option value="0">Kantrippen</option>
            {[1,2,3,4,5,6,7,8,9].map(l => <option key={l} value={l}>Niveau {l}</option>)}
          </select>
          <select
            value={schoolFilter}
            onChange={e => setSchoolFilter(e.target.value as SpellSchool | 'all')}
            aria-label="Filteren op spreukschool"
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--hairline)', background: 'var(--surface-2)', color: 'var(--ink)', fontSize: 12, cursor: 'pointer' }}
          >
            <option value="all">Alle scholen</option>
            {ALL_SCHOOLS.map(s => <option key={s} value={s}>{spellSchoolLabel[s]}</option>)}
          </select>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }} aria-live="polite" aria-busy="true">
          <Spinner size="lg" />
        </div>
      ) : (spells?.length ?? 0) === 0 ? (
        <EmptyState
          title="Nog geen spreuken"
          description="Importeer spreuken uit de SRD om je bibliotheek te vullen."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="Geen treffers"
          description="Geen spreuken voor de huidige filters."
        />
      ) : (
        <ul
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--sp-5)', listStyle: 'none', padding: 0, margin: 0 }}
          role="list"
          aria-label={`${filtered.length} spreuk${filtered.length !== 1 ? 'en' : ''} in je bibliotheek`}
        >
          {filtered.map(spell => (
            <li key={spell.id}>
              <SpellCard spell={spell} onClick={() => setDetailSpell(spell)} onDelete={() => setDeleteId(spell.id)} />
            </li>
          ))}
        </ul>
      )}

      {/* SRD import modal */}
      <Modal open={srdOpen} onClose={() => setSrdOpen(false)} title="Spreuken importeren uit de SRD" size="lg">
        <CompendiumBrowser
          kind="spell"
          onImport={(data, edition) => importSpell.mutate({ spell: data as Open5eSpell, edition })}
          importedSlugs={importedSlugs}
          isPending={importSpell.isPending}
        />
      </Modal>

      {/* Spell detail modal */}
      <Modal open={!!detailSpell} onClose={() => setDetailSpell(null)} title={detailSpell?.name ?? ''}>
        {detailSpell && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* School + level */}
            <p style={{ margin: 0, fontSize: 13, color: spellSchoolColor[detailSpell.school], fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {detailSpell.level === 0 ? 'Kantrip' : `Niveau ${detailSpell.level}`} · {spellSchoolLabel[detailSpell.school]}
              {detailSpell.concentration && ' · Concentratie'}
              {detailSpell.ritual && ' · Ritueel'}
            </p>

            {/* Cast info grid */}
            <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', margin: 0, padding: '12px 16px', background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--hairline)' }}>
              {([
                ['Uitwerptijd', detailSpell.casting_time],
                ['Bereik', detailSpell.range],
                ['Componenten', detailSpell.components],
                ['Duur', detailSpell.duration],
              ] as [string, string | null][]).filter(([, v]) => v).map(([label, value]) => (
                <div key={label}>
                  <dt style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 2 }}>{label}</dt>
                  <dd style={{ fontSize: 13, color: 'var(--ink-soft)', margin: 0 }}>{value}</dd>
                </div>
              ))}
            </dl>

            {/* Description */}
            {detailSpell.description && (
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: 'var(--ink-soft)', whiteSpace: 'pre-wrap' }}>
                {detailSpell.description}
              </p>
            )}

            {/* At higher levels */}
            {detailSpell.higher_level && (
              <div style={{ padding: '12px 16px', background: 'rgb(var(--violet-rgb) / 0.06)', borderRadius: 8, border: '1px solid rgb(var(--violet-rgb) / 0.18)' }}>
                <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--violet)' }}>Op hogere niveaus</p>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: 'var(--ink-soft)' }}>{detailSpell.higher_level}</p>
              </div>
            )}

            {/* Classes */}
            {detailSpell.classes.length > 0 && (
              <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>
                <strong style={{ color: 'var(--ink-soft)' }}>Klassen:</strong> {detailSpell.classes.join(', ')}
              </p>
            )}
          </div>
        )}
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        title="Spreuk verwijderen"
        confirmLabel="Verwijderen"
        confirmVariant="crimson"
        loading={deleteSpell.isPending}
        onConfirm={() => {
          if (deleteId) deleteSpell.mutate(deleteId, { onSettled: () => setDeleteId(null) })
        }}
        onClose={() => setDeleteId(null)}
      >
        Wil je <strong>{spellToDelete?.name ?? ''}</strong> uit je bibliotheek verwijderen?
      </ConfirmDialog>
    </div>
  )
}

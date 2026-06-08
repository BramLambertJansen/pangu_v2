import { useState, useEffect, useId } from 'react'
import { Spinner } from '@/components/ui/Spinner'
import { useSrdMonsterSearch, useSrdItemSearch, useSrdSpellSearch } from '@/hooks/queries/useSrdSearch'
import type { SrdEdition } from '@/lib/open5e'
import type { Open5eMonster, Open5eMagicItem, Open5eSpell } from '@/types/open5e.types'

export type SrdKind = 'monster' | 'item' | 'spell'
export type SrdResult = Open5eMonster | Open5eMagicItem | Open5eSpell

interface Props {
  kind: SrdKind
  onImport: (data: SrdResult, edition: SrdEdition) => void
  importedSlugs: string[]
  isPending?: boolean
}

export function CompendiumBrowser({ kind, onImport, importedSlugs, isPending }: Props) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [edition, setEdition] = useState<SrdEdition>('2014')
  const inputId = useId()
  const editionId = useId()

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 400)
    return () => clearTimeout(t)
  }, [query])

  const monsterSearch = useSrdMonsterSearch(kind === 'monster' ? debouncedQuery : '', edition)
  const itemSearch = useSrdItemSearch(kind === 'item' ? debouncedQuery : '', edition)
  const spellSearch = useSrdSpellSearch(kind === 'spell' ? debouncedQuery : '', edition)
  const { data, isLoading, isError } =
    kind === 'monster' ? monsterSearch : kind === 'item' ? itemSearch : spellSearch
  const results = (data ?? []) as SrdResult[]

  const labelText =
    kind === 'monster' ? 'Wezen zoeken' :
    kind === 'item' ? 'Magisch item zoeken' :
    'Spreuk zoeken'
  const placeholder =
    kind === 'monster' ? 'bijv. owlbear, dragon, goblin...' :
    kind === 'item' ? 'bijv. bag of holding, flame tongue...' :
    'bijv. fireball, cure wounds, detect magic...'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <label
            htmlFor={inputId}
            style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}
          >
            {labelText}
          </label>
          <input
            id={inputId}
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={placeholder}
            autoFocus
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '10px 12px', borderRadius: 8,
              border: '1px solid var(--hairline)',
              background: 'var(--surface-2)',
              color: 'var(--ink)', fontSize: 14,
              outline: 'none',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgb(var(--violet-rgb) / 0.5)' }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--hairline)' }}
          />
        </div>
        <div>
          <label
            htmlFor={editionId}
            style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}
          >
            Editie
          </label>
          <select
            id={editionId}
            value={edition}
            onChange={e => setEdition(e.target.value as SrdEdition)}
            style={{
              padding: '10px 10px', borderRadius: 8,
              border: '1px solid var(--hairline)',
              background: 'var(--surface-2)',
              color: 'var(--ink)', fontSize: 13,
              cursor: 'pointer', outline: 'none',
            }}
          >
            <option value="2014">SRD 5.1 (2014)</option>
            <option value="2024">SRD 5.2 (2024)</option>
          </select>
        </div>
      </div>

      {debouncedQuery.length < 2 && (
        <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>
          Typ minimaal 2 tekens om te zoeken in de SRD.
        </p>
      )}

      {isLoading && debouncedQuery.length >= 2 && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }} aria-live="polite" aria-label="Zoeken...">
          <Spinner size="sm" />
        </div>
      )}

      {isError && (
        <p role="alert" style={{ color: 'var(--crimson)', fontSize: 13, textAlign: 'center', padding: '8px 0' }}>
          Verbinding met Open5e mislukt. Controleer je internetverbinding.
        </p>
      )}

      {!isLoading && !isError && debouncedQuery.length >= 2 && results.length === 0 && (
        <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>
          Geen resultaten gevonden in de SRD.
        </p>
      )}

      {results.length > 0 && (
        <ul
          role="list"
          aria-label="SRD zoekresultaten"
          style={{ display: 'flex', flexDirection: 'column', gap: 6, listStyle: 'none', padding: 0, margin: 0, maxHeight: 300, overflowY: 'auto' }}
        >
          {results.map(result => {
            const alreadyImported = importedSlugs.includes((result as Open5eMonster).key ?? result.slug ?? '')
            const meta =
              kind === 'monster' ? monsterMeta(result as Open5eMonster) :
              kind === 'item' ? itemMeta(result as Open5eMagicItem) :
              spellMeta(result as Open5eSpell)

            return (
              <li
                key={(result as Open5eMonster).key ?? result.slug}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--hairline)', background: 'var(--surface-2)' }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {result.name}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.06em' }}>
                    {meta}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { if (!alreadyImported && !isPending) onImport(result, edition) }}
                  disabled={alreadyImported || isPending}
                  aria-label={alreadyImported ? `${result.name} al geïmporteerd` : `Importeer ${result.name}`}
                  style={{
                    flexShrink: 0, padding: '6px 12px', borderRadius: 6,
                    border: `1px solid ${alreadyImported ? 'var(--hairline)' : 'rgb(var(--teal-rgb) / 0.4)'}`,
                    background: alreadyImported ? 'transparent' : 'rgb(var(--teal-rgb) / 0.08)',
                    color: alreadyImported ? 'var(--muted)' : 'var(--teal)',
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                    cursor: alreadyImported || isPending ? 'default' : 'pointer',
                    opacity: isPending && !alreadyImported ? 0.6 : 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {alreadyImported ? '✓ In bibliotheek' : isPending ? '...' : 'Importeer'}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <p style={{ fontSize: 11, color: 'var(--subtle)', textAlign: 'center', marginTop: 4, borderTop: '1px solid var(--hairline)', paddingTop: 10 }}>
        {edition === '2024'
          ? <>Inhoud van de <abbr title="Systems Reference Document 5.2, Creative Commons Attribution 4.0 International">SRD 5.2 (2024)</abbr> via Open5e · CC-BY-4.0 · Powered by Open5e</>
          : <>Inhoud van de <abbr title="Systems Reference Document 5.1, Creative Commons Attribution 4.0 International">SRD 5.1 (2014)</abbr> via Open5e · CC-BY-4.0 · Powered by Open5e</>
        }
      </p>
    </div>
  )
}

function strField(val: unknown): string {
  if (!val) return ''
  if (typeof val === 'string') return val
  if (typeof val === 'object') {
    const o = val as Record<string, unknown>
    return (o.label as string) || (o.name as string) || (o.slug as string) || (o.key as string) || ''
  }
  return ''
}

function monsterMeta(m: Open5eMonster): string {
  const parts: string[] = []
  const type = strField(m.type)
  if (type) parts.push(type)
  if (m.challenge_rating) parts.push(`CR ${m.challenge_rating}`)
  if (m.hit_points) parts.push(`${m.hit_points} HP`)
  if (m.armor_class) parts.push(`AC ${m.armor_class}`)
  return parts.join(' · ')
}

function itemMeta(i: Open5eMagicItem): string {
  const parts: string[] = []
  const type = strField(i.type)
  const rarity = strField(i.rarity)
  if (type) parts.push(type)
  if (rarity) parts.push(rarity)
  if (i.requires_attunement) parts.push('attunement')
  return parts.join(' · ')
}

function spellMeta(s: Open5eSpell): string {
  const parts: string[] = []
  const level = typeof s.level === 'number' ? s.level : parseInt(String(s.level), 10)
  parts.push(level === 0 ? 'Kantrip' : `Niveau ${level}`)
  const school = strField(s.school)
  if (school) parts.push(school)
  if (s.casting_time) parts.push(s.casting_time)
  if (s.concentration) parts.push('Concentratie')
  return parts.join(' · ')
}

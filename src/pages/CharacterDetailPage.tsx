import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { Spinner } from '@/components/ui/Spinner'
import { characterStatusLabel, characterStatusColor, itemRarityLabel, itemRarityColor, itemTypeLabel } from '@/lib/statusMaps'
import { useCharacterItems } from '@/hooks/queries/useCharacterItems'
import type { Character } from '@/types/character.types'

type Tab = 'stats' | 'lore' | 'inventaris' | 'vaardigheden'

interface Skill {
  name: string
  ability: 'stat_str' | 'stat_dex' | 'stat_con' | 'stat_int' | 'stat_wis' | 'stat_cha'
  abbr: 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA'
}

const SKILLS: Skill[] = [
  { name: 'Atletiek',          ability: 'stat_str', abbr: 'STR' },
  { name: 'Acrobatiek',        ability: 'stat_dex', abbr: 'DEX' },
  { name: 'Vingervlugheid',    ability: 'stat_dex', abbr: 'DEX' },
  { name: 'Sluipen',           ability: 'stat_dex', abbr: 'DEX' },
  { name: 'Magie',             ability: 'stat_int', abbr: 'INT' },
  { name: 'Geschiedenis',      ability: 'stat_int', abbr: 'INT' },
  { name: 'Onderzoek',         ability: 'stat_int', abbr: 'INT' },
  { name: 'Natuur',            ability: 'stat_int', abbr: 'INT' },
  { name: 'Religie',           ability: 'stat_int', abbr: 'INT' },
  { name: 'Dierenverzorging',  ability: 'stat_wis', abbr: 'WIS' },
  { name: 'Inzicht',           ability: 'stat_wis', abbr: 'WIS' },
  { name: 'Geneeskunde',       ability: 'stat_wis', abbr: 'WIS' },
  { name: 'Waarneming',        ability: 'stat_wis', abbr: 'WIS' },
  { name: 'Overleven',         ability: 'stat_wis', abbr: 'WIS' },
  { name: 'Bedrog',            ability: 'stat_cha', abbr: 'CHA' },
  { name: 'Intimidatie',       ability: 'stat_cha', abbr: 'CHA' },
  { name: 'Optreden',          ability: 'stat_cha', abbr: 'CHA' },
  { name: 'Overtuigen',        ability: 'stat_cha', abbr: 'CHA' },
]

const abilityScores: { key: keyof Character; abbr: string; label: string }[] = [
  { key: 'stat_str', abbr: 'STR', label: 'Sterkte' },
  { key: 'stat_dex', abbr: 'DEX', label: 'Behendigheid' },
  { key: 'stat_con', abbr: 'CON', label: 'Constitutie' },
  { key: 'stat_int', abbr: 'INT', label: 'Intelligentie' },
  { key: 'stat_wis', abbr: 'WIS', label: 'Wijsheid' },
  { key: 'stat_cha', abbr: 'CHA', label: 'Charisma' },
]

function abilityModifier(score: number): string {
  const mod = Math.floor((score - 10) / 2)
  return mod >= 0 ? `+${mod}` : `${mod}`
}

const detailCardGradients = [
  'radial-gradient(ellipse 60% 80% at 25% 35%, rgba(56,152,255,0.32) 0%, rgba(30,80,200,0.18) 45%, var(--void) 78%)',
  'radial-gradient(ellipse 60% 80% at 28% 38%, rgba(107,167,255,0.28) 0%, rgba(56,152,255,0.18) 50%, var(--void) 78%)',
  'radial-gradient(ellipse 60% 80% at 30% 40%, rgba(155,138,255,0.24) 0%, rgba(56,152,255,0.20) 50%, var(--void) 78%)',
  'radial-gradient(ellipse 60% 80% at 25% 38%, rgba(56,152,255,0.26) 0%, rgba(62,207,178,0.16) 50%, var(--void) 78%)',
]

export default function CharacterDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<Tab>('stats')

  const { data: items, isLoading: isLoadingItems } = useCharacterItems(id)

  const returnItemToDm = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('items')
        .update({ character_id: null, updated_at: new Date().toISOString() })
        .eq('id', itemId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.items(id!) })
      // Also invalidate the campaign items cache so DM pool updates
      queryClient.invalidateQueries({ queryKey: ['items'] })
      toast.success('Item teruggegeven aan de DM')
    },
    onError: () => {
      toast.error('Teruggeven mislukt')
    },
  })

  const { data: character, isLoading } = useQuery<Character>({
    queryKey: queryKeys.characters.detail(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as Character
    },
    enabled: !!id,
    staleTime: 1000 * 60,
  })

  const updateHp = useMutation({
    mutationFn: async (newHp: number) => {
      const { error } = await supabase
        .from('characters')
        .update({ hp_current: newHp, updated_at: new Date().toISOString() })
        .eq('id', id!)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.detail(id!) })
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.all })
    },
    onError: () => {
      toast.error('HP bijwerken mislukt')
    },
  })

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }} aria-live="polite" aria-label="Karakter laden...">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!character) {
    return (
      <div>
        <p style={{ color: 'var(--muted)' }}>Karakter niet gevonden.</p>
        <button type="button" className="pangu-btn pangu-btn-ghost" onClick={() => navigate('/characters')} style={{ marginTop: 16 }}>
          ← Terug naar karakters
        </button>
      </div>
    )
  }

  const code = (id!.charCodeAt(0) || 0) + (id!.charCodeAt(id!.length - 1) || 0)
  const headerGradient = detailCardGradients[code % detailCardGradients.length]

  const classLabel = [character.character_class, character.character_subclass].filter(Boolean).join(' · ')
  const xpPct = character.xp_next > 0 ? Math.min(100, Math.round((character.xp / character.xp_next) * 100)) : 0
  const hpPct = character.hp_max > 0 ? Math.min(100, Math.round((character.hp_current / character.hp_max) * 100)) : 0
  const hpLow = character.hp_current < character.hp_max * 0.3

  return (
    <div>
      {/* Back link */}
      <button
        type="button"
        onClick={() => navigate('/characters')}
        aria-label="Terug naar karakters"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--muted)', fontSize: 12, fontWeight: 700,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          fontFamily: 'var(--font-body)',
          marginBottom: 24, padding: 0,
          transition: 'color var(--t-fast)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink-soft)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
      >
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
        </svg>
        Terug naar karakters
      </button>

      {/* Hero header card */}
      <div
        className="pangu-surface"
        style={{
          marginBottom: 24,
          padding: '32px 28px',
          position: 'relative',
          overflow: 'hidden',
          minHeight: 160,
        }}
      >
        {/* Gradient */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0,
            background: headerGradient,
            pointerEvents: 'none',
          }}
        />

        {/* Watermark initial */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: 24, top: '50%',
            transform: 'translateY(-50%)',
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(72px, 12vw, 120px)',
            fontWeight: 700,
            letterSpacing: '0.04em',
            color: 'rgba(107,167,255,0.08)',
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          {character.name.charAt(0).toUpperCase()}
        </div>

        {/* Content */}
        <div style={{ position: 'relative' }}>
          {/* Badges row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {classLabel && (
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '3px 10px',
                borderRadius: 'var(--r-full)',
                fontSize: 11, fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: 'var(--azure)',
                border: '1px solid rgba(107,167,255,0.35)',
                background: 'rgba(107,167,255,0.08)',
              }}>
                {classLabel}
              </span>
            )}
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '3px 10px',
              borderRadius: 'var(--r-full)',
              fontSize: 11, fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: characterStatusColor[character.status],
              border: `1px solid ${characterStatusColor[character.status]}55`,
              background: `${characterStatusColor[character.status]}11`,
            }}>
              {characterStatusLabel[character.status]}
            </span>

            {/* Edit link */}
            <Link
              to={`/characters/${character.id}/edit`}
              className="pangu-btn pangu-btn-ghost pangu-btn-sm"
              style={{ marginLeft: 'auto' }}
            >
              Bewerken
            </Link>
          </div>

          {/* Name */}
          <h1 className="pangu-display-xl" style={{ margin: '0 0 4px' }}>
            {character.name}
          </h1>

          {/* Race · Level */}
          <p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: '0 0 12px' }}>
            {[character.character_race, `Level ${character.level}`].filter(Boolean).join(' · ')}
            {character.subtitle && <span style={{ color: 'var(--gold)', fontStyle: 'italic' }}> — {character.subtitle}</span>}
          </p>

          {/* XP progress bar */}
          <div style={{ maxWidth: 280 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Ervaringspunten</span>
              <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{character.xp} / {character.xp_next} XP</span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={character.xp}
              aria-valuemin={0}
              aria-valuemax={character.xp_next}
              aria-label={`${character.xp} van ${character.xp_next} ervaringspunten`}
              style={{
                height: 6, borderRadius: 3,
                background: 'var(--hairline)',
                overflow: 'hidden',
              }}
            >
              <div style={{
                height: '100%',
                width: `${xpPct}%`,
                background: 'var(--azure)',
                borderRadius: 3,
                transition: 'width 0.4s var(--ease-out)',
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Karakter tabs"
        style={{
          display: 'flex',
          gap: 2,
          marginBottom: 20,
          borderBottom: '1px solid var(--hairline)',
        }}
      >
        {(
          [
            { key: 'stats', label: 'Stats' },
            { key: 'vaardigheden', label: 'Vaardigheden' },
            { key: 'lore', label: 'Lore' },
            { key: 'inventaris', label: `Inventaris${items && items.length > 0 ? ` (${items.length})` : ''}` },
          ] as { key: Tab; label: string }[]
        ).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={activeTab === key}
            aria-controls={`tabpanel-${key}`}
            id={`tab-${key}`}
            onClick={() => setActiveTab(key)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === key ? '2px solid var(--azure)' : '2px solid transparent',
              color: activeTab === key ? 'var(--ink)' : 'var(--muted)',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-body)',
              padding: '10px 16px',
              marginBottom: -1,
              transition: 'color var(--t-fast)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Stats tab */}
      <div
        id="tabpanel-stats"
        role="tabpanel"
        aria-labelledby="tab-stats"
        hidden={activeTab !== 'stats'}
      >
        {/* Combat stats row */}
        <div className="pangu-surface" style={{ padding: 24, marginBottom: 16 }}>
          <p className="pangu-section-title" style={{ marginBottom: 16 }}>Gevechtsstats</p>

          {/* HP with inline edit */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: hpLow ? 'rgba(220,90,80,0.06)' : 'rgba(107,167,255,0.06)',
              border: `1px solid ${hpLow ? 'rgba(220,90,80,0.2)' : 'rgba(107,167,255,0.2)'}`,
              borderRadius: 'var(--r-full)',
              padding: '6px 14px',
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: hpLow ? 'var(--crimson)' : 'var(--azure)' }}>
                HP
              </span>
              <button
                type="button"
                aria-label="HP verlagen"
                onClick={() => {
                  const next = Math.max(0, character.hp_current - 1)
                  updateHp.mutate(next)
                }}
                disabled={updateHp.isPending || character.hp_current <= 0}
                style={{
                  width: 22, height: 22,
                  borderRadius: '50%',
                  border: '1px solid var(--hairline)',
                  background: 'var(--surface)',
                  color: 'var(--muted)',
                  cursor: character.hp_current <= 0 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, lineHeight: 1,
                  transition: 'background var(--t-fast)',
                  opacity: character.hp_current <= 0 ? 0.4 : 1,
                }}
              >
                −
              </button>
              <span style={{
                fontSize: 15, fontWeight: 700, minWidth: 48, textAlign: 'center',
                color: hpLow ? 'var(--crimson)' : 'var(--ink)',
              }}>
                {character.hp_current} / {character.hp_max}
              </span>
              <button
                type="button"
                aria-label="HP verhogen"
                onClick={() => {
                  const next = Math.min(character.hp_max, character.hp_current + 1)
                  updateHp.mutate(next)
                }}
                disabled={updateHp.isPending || character.hp_current >= character.hp_max}
                style={{
                  width: 22, height: 22,
                  borderRadius: '50%',
                  border: '1px solid var(--hairline)',
                  background: 'var(--surface)',
                  color: 'var(--muted)',
                  cursor: character.hp_current >= character.hp_max ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, lineHeight: 1,
                  transition: 'background var(--t-fast)',
                  opacity: character.hp_current >= character.hp_max ? 0.4 : 1,
                }}
              >
                +
              </button>
            </div>

            {/* HP bar */}
            <div style={{ flex: 1, minWidth: 80, maxWidth: 200 }}>
              <div
                role="progressbar"
                aria-valuenow={character.hp_current}
                aria-valuemin={0}
                aria-valuemax={character.hp_max}
                aria-label={`${character.hp_current} van ${character.hp_max} levenspunten`}
                style={{ height: 8, borderRadius: 4, background: 'var(--hairline)', overflow: 'hidden' }}
              >
                <div style={{
                  height: '100%',
                  width: `${hpPct}%`,
                  background: hpLow ? 'var(--crimson)' : 'var(--azure)',
                  borderRadius: 4,
                  transition: 'width 0.3s var(--ease-out), background 0.3s',
                }} />
              </div>
            </div>
          </div>

          {/* Other combat stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 12 }}>
            {[
              { label: 'AC', value: character.armor_class },
              { label: 'Snelheid', value: `${character.speed} ft` },
              { label: 'Initiatief', value: character.initiative >= 0 ? `+${character.initiative}` : `${character.initiative}` },
              { label: 'Prof.', value: `+${character.proficiency_bonus}` },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--hairline)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  textAlign: 'center',
                }}
              >
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 4px' }}>
                  {label}
                </p>
                <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', margin: 0, fontFamily: 'var(--font-display)' }}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Ability scores */}
        <div className="pangu-surface" style={{ padding: 24, marginBottom: 16 }}>
          <p className="pangu-section-title" style={{ marginBottom: 16 }}>Eigenschappen</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {abilityScores.map(({ key, abbr, label }) => {
              const score = character[key] as number
              const mod = abilityModifier(score)
              return (
                <div
                  key={key}
                  title={label}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--hairline)',
                    borderRadius: 8,
                    padding: '12px 8px',
                    textAlign: 'center',
                  }}
                >
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 6px' }}>
                    {abbr}
                  </p>
                  <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)', margin: '0 0 2px', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                    {score}
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--azure)', fontWeight: 700, margin: 0 }}>
                    {mod}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Currency */}
        {(character.gold > 0 || character.silver > 0 || character.copper > 0) && (
          <div className="pangu-surface" style={{ padding: 24 }}>
            <p className="pangu-section-title" style={{ marginBottom: 16 }}>Schatkist</p>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {[
                { label: 'Goud', value: character.gold, color: 'var(--gold)' },
                { label: 'Zilver', value: character.silver, color: 'var(--ink-soft)' },
                { label: 'Koper', value: character.copper, color: '#b87333' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ textAlign: 'center', minWidth: 64 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 4px' }}>
                    {label}
                  </p>
                  <p style={{ fontSize: 22, fontWeight: 700, color, margin: 0, fontFamily: 'var(--font-display)' }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Vaardigheden tab */}
      <div
        id="tabpanel-vaardigheden"
        role="tabpanel"
        aria-labelledby="tab-vaardigheden"
        hidden={activeTab !== 'vaardigheden'}
      >
        <div className="pangu-surface" style={{ padding: 24 }}>
          <p className="pangu-section-title" style={{ marginBottom: 4 }}>Vaardigheden</p>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 0, marginBottom: 20 }}>
            Gemarkeerde vaardigheden tellen je vaardigheidsbonus (+{character.proficiency_bonus}) mee.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
            {SKILLS.map((skill) => {
              const isProficient = character.proficient_skills.includes(skill.name)
              const baseScore = character[skill.ability] as number
              const baseMod = Math.floor((baseScore - 10) / 2)
              const totalMod = isProficient ? baseMod + character.proficiency_bonus : baseMod
              const modLabel = totalMod >= 0 ? `+${totalMod}` : `${totalMod}`
              return (
                <div
                  key={skill.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: isProficient ? 'rgba(139,92,246,0.08)' : 'var(--surface)',
                    border: isProficient ? '1px solid rgba(139,92,246,0.3)' : '1px solid var(--hairline)',
                    transition: 'background var(--t-fast), border-color var(--t-fast)',
                  }}
                >
                  {/* Proficiency indicator */}
                  <span
                    aria-label={isProficient ? `${skill.name}: vaardig` : `${skill.name}: niet vaardig`}
                    style={{
                      width: 10, height: 10,
                      borderRadius: '50%',
                      flexShrink: 0,
                      background: isProficient ? 'var(--violet)' : 'transparent',
                      border: `2px solid ${isProficient ? 'var(--violet)' : 'var(--hairline-strong)'}`,
                      transition: 'background var(--t-fast), border-color var(--t-fast)',
                    }}
                  />

                  {/* Skill name + ability */}
                  <span style={{ flex: 1, fontSize: 13, color: isProficient ? 'var(--ink)' : 'var(--ink-soft)', fontWeight: isProficient ? 600 : 400 }}>
                    {skill.name}
                    <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 5, fontWeight: 400 }}>
                      {skill.abbr}
                    </span>
                  </span>

                  {/* Modifier */}
                  <span style={{
                    fontSize: 14, fontWeight: 700,
                    fontFamily: 'var(--font-display)',
                    color: isProficient ? 'var(--violet)' : 'var(--ink-soft)',
                    minWidth: 28, textAlign: 'right',
                  }}>
                    {modLabel}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Inventaris tab */}
      <div
        id="tabpanel-inventaris"
        role="tabpanel"
        aria-labelledby="tab-inventaris"
        hidden={activeTab !== 'inventaris'}
      >
        {isLoadingItems ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }} aria-live="polite" aria-busy="true">
            <Spinner size="md" />
          </div>
        ) : items && items.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {items.map((item) => (
              <div
                key={item.id}
                className="pangu-surface"
                style={{ padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}
              >
                {/* Left: item info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <h3 style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 16, fontWeight: 600,
                      letterSpacing: '0.04em', textTransform: 'uppercase',
                      color: 'var(--ink)', margin: 0,
                    }}>
                      {item.is_magical && <span style={{ color: 'var(--gold)', marginRight: 6 }} aria-hidden="true">✦</span>}
                      {item.name}
                      {item.quantity > 1 && (
                        <span style={{ fontSize: 13, color: 'var(--ink-soft)', fontWeight: 400, marginLeft: 6 }}>×{item.quantity}</span>
                      )}
                    </h3>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center',
                      padding: '2px 8px',
                      borderRadius: 'var(--r-full)',
                      fontSize: 10, fontWeight: 700,
                      letterSpacing: '0.12em', textTransform: 'uppercase',
                      color: itemRarityColor[item.rarity],
                      border: `1px solid ${itemRarityColor[item.rarity]}55`,
                      background: `${itemRarityColor[item.rarity]}11`,
                    }}>
                      {itemRarityLabel[item.rarity]}
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      letterSpacing: '0.12em', textTransform: 'uppercase',
                      color: 'var(--muted)',
                    }}>
                      {itemTypeLabel[item.item_type]}
                    </span>
                  </div>
                  {item.description && (
                    <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: 0, lineHeight: 1.65 }}>
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Right: action */}
                <button
                  type="button"
                  className="pangu-btn pangu-btn-ghost pangu-btn-sm"
                  onClick={() => returnItemToDm.mutate(item.id)}
                  disabled={returnItemToDm.isPending}
                  aria-label={`${item.name} teruggeven aan DM`}
                  style={{ flexShrink: 0 }}
                >
                  Teruggeven aan DM
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="pangu-surface" style={{ padding: 28, textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>
              Geen items in je inventaris.
            </p>
            <p style={{ fontSize: 12, color: 'var(--subtle)', margin: '8px 0 0' }}>
              De DM kan items toewijzen vanuit de kroniek-schatkist.
            </p>
          </div>
        )}
      </div>

      {/* Lore tab */}
      <div
        id="tabpanel-lore"
        role="tabpanel"
        aria-labelledby="tab-lore"
        hidden={activeTab !== 'lore'}
      >
        {/* Description / backstory */}
        {character.description ? (
          <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
            <p className="pangu-section-title" style={{ marginBottom: 12 }}>Achtergrond</p>
            <p style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--ink-soft)', margin: 0, whiteSpace: 'pre-wrap' }}>
              {character.description}
            </p>
          </div>
        ) : (
          <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
            <p className="pangu-section-title" style={{ marginBottom: 12 }}>Achtergrond</p>
            <p style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic' }}>
              Nog geen achtergrondverhaal toegevoegd.
            </p>
          </div>
        )}

        {/* Private notes */}
        <div
          className="pangu-surface"
          style={{
            padding: 28,
            borderColor: 'rgba(107,167,255,0.18)',
            background: 'rgba(107,167,255,0.03)',
          }}
        >
          <p className="pangu-section-title" style={{ marginBottom: 4 }}>
            ✦ Privénotities
          </p>
          <p style={{ fontSize: 12, color: 'var(--azure)', marginBottom: 16, marginTop: 0 }}>
            Alleen zichtbaar voor jou
          </p>
          {character.notes ? (
            <p style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--ink-soft)', margin: 0, whiteSpace: 'pre-wrap' }}>
              {character.notes}
            </p>
          ) : (
            <p style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>
              Geen notities.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

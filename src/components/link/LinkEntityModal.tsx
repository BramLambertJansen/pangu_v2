import { useState, useEffect, useId } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useCampaignLocations } from '@/hooks/queries/useCampaignLocations'
import { useCampaignNpcs } from '@/hooks/queries/useCampaignNpcs'
import { useCampaignLore } from '@/hooks/queries/useCampaignLore'
import { useCampaignQuests } from '@/hooks/queries/useCampaignQuests'
import { useCampaignSessions } from '@/hooks/queries/useCampaignSessions'
import { useCampaignItems } from '@/hooks/queries/useCampaignItems'
import { useCampaignEncounters } from '@/hooks/queries/useCampaignEncounters'
import { useCampaignCharacters } from '@/hooks/queries/useCampaignCharacters'
import { useCreateLink } from '@/hooks/queries/useEntityLinks'
import { linkableTypeLabel, relationLabel } from '@/lib/linkMaps'
import type { LinkableEntityType, LinkRelation } from '@/types/link.types'

const ALL_TYPES: LinkableEntityType[] = ['location', 'npc', 'lore', 'quest', 'session', 'item', 'encounter', 'character']
const ALL_RELATIONS: LinkRelation[] = ['related_to', 'located_in', 'member_of', 'owns', 'involved_in', 'ally_of', 'enemy_of', 'mentions']

type Step = 'type' | 'relation' | 'entity'

interface Props {
  open: boolean
  onClose: () => void
  sourceType: LinkableEntityType
  sourceId: string
  campaignId: string
}

export function LinkEntityModal({ open, onClose, sourceType, sourceId, campaignId }: Props) {
  const [step, setStep] = useState<Step>('type')
  const [targetType, setTargetType] = useState<LinkableEntityType | ''>('')
  const [relation, setRelation] = useState<LinkRelation | ''>('')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState('')

  const typeId = useId()
  const relationId = useId()
  const searchId = useId()

  const createLink = useCreateLink()

  useEffect(() => {
    if (!open) {
      setStep('type')
      setTargetType('')
      setRelation('')
      setSearch('')
      setSelectedId('')
    }
  }, [open])

  const locations  = useCampaignLocations(campaignId)
  const npcs       = useCampaignNpcs(campaignId)
  const lore       = useCampaignLore(campaignId)
  const quests     = useCampaignQuests(campaignId)
  const sessions   = useCampaignSessions(campaignId)
  const items      = useCampaignItems(campaignId)
  const encounters = useCampaignEncounters(campaignId)
  const characters = useCampaignCharacters(campaignId)

  const entityListMap: Record<LinkableEntityType, Array<{ id: string; name: string }>> = {
    location:  locations.data  ?? [],
    npc:       npcs.data       ?? [],
    lore:      lore.data       ?? [],
    quest:     quests.data     ?? [],
    session:   sessions.data   ?? [],
    item:      items.data      ?? [],
    encounter: encounters.data ?? [],
    character: characters.data ?? [],
  }

  const entities = targetType
    ? entityListMap[targetType].filter(e => e.id !== sourceId)
    : []

  const filtered = search.trim()
    ? entities.filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
    : entities

  async function handleSubmit() {
    if (!targetType || !relation || !selectedId) return
    await createLink.mutateAsync({
      campaign_id: campaignId,
      from_type: sourceType,
      from_id: sourceId,
      to_type: targetType,
      to_id: selectedId,
      relation,
    })
    onClose()
  }

  const stepLabel = step === 'type' ? 'Stap 1 van 3' : step === 'relation' ? 'Stap 2 van 3' : 'Stap 3 van 3'

  return (
    <Modal open={open} onClose={onClose} title="Verbinding leggen">
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 20px' }}>
        {stepLabel}
      </p>

      {step === 'type' && (
        <div>
          <label htmlFor={typeId} style={{ display: 'block', fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>
            Type entiteit
          </label>
          <select
            id={typeId}
            value={targetType}
            onChange={e => setTargetType(e.target.value as LinkableEntityType)}
            className="pangu-input"
            style={{ width: '100%' }}
          >
            <option value="">Kies een type…</option>
            {ALL_TYPES.filter(t => t !== sourceType).map(t => (
              <option key={t} value={t}>{linkableTypeLabel[t]}</option>
            ))}
          </select>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
            <Button variant="primary" disabled={!targetType} onClick={() => setStep('relation')}>Volgende →</Button>
          </div>
        </div>
      )}

      {step === 'relation' && (
        <div>
          <label htmlFor={relationId} style={{ display: 'block', fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>
            Relatie
          </label>
          <select
            id={relationId}
            value={relation}
            onChange={e => setRelation(e.target.value as LinkRelation)}
            className="pangu-input"
            style={{ width: '100%' }}
          >
            <option value="">Kies een relatie…</option>
            {ALL_RELATIONS.map(r => (
              <option key={r} value={r}>{relationLabel[r]}</option>
            ))}
          </select>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
            <Button variant="ghost" onClick={() => setStep('type')}>← Terug</Button>
            <Button variant="primary" disabled={!relation} onClick={() => setStep('entity')}>Volgende →</Button>
          </div>
        </div>
      )}

      {step === 'entity' && (
        <div>
          <label htmlFor={searchId} style={{ display: 'block', fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>
            Zoek {targetType ? linkableTypeLabel[targetType] : ''}
          </label>
          <input
            id={searchId}
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Naam zoeken…"
            className="pangu-input"
            style={{ width: '100%', marginBottom: 12 }}
            autoFocus
          />
          <ul role="listbox" aria-label={`Kies ${targetType ? linkableTypeLabel[targetType] : 'entiteit'}`} style={{ listStyle: 'none', margin: 0, padding: 0, maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {filtered.length === 0 && (
              <li style={{ fontSize: 13, color: 'var(--muted)', padding: '12px 0', textAlign: 'center' }}>Geen resultaten gevonden.</li>
            )}
            {filtered.map(e => (
              <li key={e.id} role="option" aria-selected={selectedId === e.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(e.id)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '10px 14px',
                    minHeight: 44,
                    borderRadius: 8, border: '1px solid',
                    borderColor: selectedId === e.id ? 'var(--violet)' : 'var(--hairline)',
                    background: selectedId === e.id ? 'rgba(107,167,255,0.08)' : 'var(--surface)',
                    color: 'var(--ink-soft)', fontSize: 14, cursor: 'pointer',
                    transition: 'border-color var(--t-fast), background var(--t-fast)',
                  }}
                >
                  {e.name}
                </button>
              </li>
            ))}
          </ul>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
            <Button variant="ghost" onClick={() => setStep('relation')}>← Terug</Button>
            <Button variant="primary" disabled={!selectedId || createLink.isPending} loading={createLink.isPending} onClick={handleSubmit}>
              Verbinden
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

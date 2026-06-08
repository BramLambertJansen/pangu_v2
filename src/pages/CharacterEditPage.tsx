import { useCallback } from 'react'
import { useImagePositioning } from '@/hooks/useImagePositioning'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Spinner } from '@/components/ui/Spinner'
import { useEntityEdit } from '@/hooks/useEntityEdit'
import { useCharacter, useSaveCharacter, useDeleteCharacter } from '@/hooks/queries/useCharacter'
import { useAuthStore } from '@/stores/auth.store'
import type { Character } from '@/types/character.types'
import type { Campaign } from '@/types/campaign.types'
import { CharacterEditBasicSection } from '@/components/character/CharacterEditBasicSection'
import { CharacterEditCombatSection } from '@/components/character/CharacterEditCombatSection'
import { CharacterEditAbilitiesSection } from '@/components/character/CharacterEditAbilitiesSection'
import { CharacterEditSpellsSection } from '@/components/character/CharacterEditSpellsSection'
import { CharacterEditLoreSection } from '@/components/character/CharacterEditLoreSection'

export default function CharacterEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore(s => s.user)

  const locationState = location.state as { isNew?: boolean; joinCampaignId?: string } | null
  const isNew = locationState?.isNew ?? false
  const joinCampaignId = locationState?.joinCampaignId

  const { data: characterData, isLoading } = useCharacter(id)

  const {
    form, set, dirty, setDirty,
    committed, setCommitted,
    deleteOpen, setDeleteOpen,
    resetForm, guard,
  } = useEntityEdit({ entity: characterData, isNew })

  const handlePortraitPositionChange = useCallback((posString: string) => {
    set('portrait_position', posString)
  }, [set])

  const {
    containerRef: portraitContainerRef,
    posString: portraitPosString,
    isDragging: portraitIsDragging,
    resetPosition: resetPortraitPosition,
    handlers: portraitPosHandlers,
  } = useImagePositioning(characterData?.portrait_position, handlePortraitPositionChange)

  const cycleSkill = useCallback((skillName: string) => {
    const proficients: string[] = form.proficient_skills ?? []
    const experts: string[] = form.expertise_skills ?? []
    if (experts.includes(skillName)) {
      set('expertise_skills', experts.filter(s => s !== skillName))
      set('proficient_skills', proficients.filter(s => s !== skillName))
    } else if (proficients.includes(skillName)) {
      set('expertise_skills', [...experts, skillName])
    } else {
      set('proficient_skills', [...proficients, skillName])
    }
  }, [form.proficient_skills, form.expertise_skills, set])

  const toggleSavingThrow = useCallback((abilityLabel: string) => {
    const current: string[] = form.saving_throw_proficiencies ?? []
    const updated = current.includes(abilityLabel)
      ? current.filter(s => s !== abilityLabel)
      : [...current, abilityLabel]
    set('saving_throw_proficiencies', updated)
  }, [form.saving_throw_proficiencies, set])

  const { data: userCampaigns } = useQuery<Pick<Campaign, 'id' | 'name'>[]>({
    queryKey: [...queryKeys.campaigns.all, 'names'],
    queryFn: async () => {
      if (!user) return []
      const [ownedRes, memberRes] = await Promise.all([
        supabase.from('campaigns').select('id, name').eq('user_id', user.id),
        supabase.from('campaign_members').select('campaigns!inner(id, name)').eq('user_id', user.id),
      ])
      if (ownedRes.error) throw ownedRes.error
      if (memberRes.error) throw memberRes.error

      const memberCampaigns = (memberRes.data ?? []).map(
        (row) => (row as unknown as { campaigns: Pick<Campaign, 'id' | 'name'> }).campaigns
      )
      const seen = new Set<string>()
      return [...(ownedRes.data ?? []), ...memberCampaigns]
        .filter((c) => { if (seen.has(c.id)) return false; seen.add(c.id); return true })
        .sort((a, b) => a.name.localeCompare(b.name)) as Pick<Campaign, 'id' | 'name'>[]
    },
    enabled: !!user,
    staleTime: 1000 * 60,
  })

  const saveCharacter = useSaveCharacter(id!)
  const deleteCharacter = useDeleteCharacter(id!)

  async function handleDiscardConfirm() {
    if (guard.isDraftDiscard) {
      try { await deleteCharacter.mutateAsync() } catch { return }
    }
    const handled = guard.confirmLeave()
    if (!handled) {
      navigate('/characters')
    }
  }

  function handleBack() {
    if (!committed) {
      guard.requestDiscard()
    } else {
      navigate(`/characters/${id}`)
    }
  }

  function handleCancel() {
    if (!committed) {
      guard.requestDiscard()
    } else {
      resetForm()
      resetPortraitPosition(characterData!.portrait_position)
      navigate(`/characters/${id}`)
    }
  }

  function handleSave() {
    toast.promise(
      saveCharacter.mutateAsync({ form, joinCampaignId, userId: user?.id }).then(() => {
        setCommitted(true)
        setDirty(false)
      }),
      { loading: 'Opslaan...', success: 'Karakter opgeslagen', error: 'Opslaan mislukt' },
    )
  }

  function handleDelete() {
    toast.promise(
      deleteCharacter.mutateAsync().then(() => navigate('/characters')),
      { loading: 'Verwijderen...', success: 'Karakter verwijderd', error: 'Verwijderen mislukt' },
    )
    setDeleteOpen(false)
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }} aria-live="polite" aria-label="Karakter laden...">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!characterData) {
    return (
      <div>
        <p style={{ color: 'var(--muted)' }}>Karakter niet gevonden.</p>
        <Button variant="ghost" onClick={() => navigate('/characters')} style={{ marginTop: 16 }}>
          ← Terug naar karakters
        </Button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <div style={{ maxWidth: 820, width: '100%' }}>

        {/* Back link */}
        <button
          type="button"
          onClick={handleBack}
          aria-label="Terug naar karakter"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            color: 'var(--muted)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0 0 20px',
            transition: 'color var(--t-fast)',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--ink-soft)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--muted)' }}
        >
          ← Terug
        </button>

        <header style={{ marginBottom: 28 }}>
          <h1 className="pangu-display-xl">{characterData.name}</h1>
          <p style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-soft)' }}>
            Pas de details en stats van je personage aan.
          </p>
        </header>

        <CharacterEditBasicSection
          form={form as Character}
          set={set}
          campaigns={userCampaigns}
          portraitContainerRef={portraitContainerRef}
          portraitPosString={portraitPosString}
          portraitIsDragging={portraitIsDragging}
          portraitPosHandlers={portraitPosHandlers}
        />

        <CharacterEditCombatSection
          form={form as Character}
          set={set}
        />

        <CharacterEditAbilitiesSection
          form={form as Character}
          set={set}
          cycleSkill={cycleSkill}
          toggleSavingThrow={toggleSavingThrow}
        />

        <CharacterEditSpellsSection
          form={form as Character}
          set={set}
        />

        <CharacterEditLoreSection
          form={form as Character}
          set={set}
          onCancel={handleCancel}
          onSave={handleSave}
          isSaving={saveCharacter.isPending}
          dirty={dirty}
          committed={committed}
        />

        {/* Danger zone */}
        <div
          className="pangu-surface"
          style={{ marginBottom: 32, padding: 28, borderColor: 'rgb(var(--crimson-rgb) / 0.18)' }}
        >
          <p className="pangu-section-title" style={{ marginBottom: 4 }}>Gevarenzone</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, paddingTop: 16, borderTop: '1px solid var(--hairline)' }}>
            <div>
              <p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: 0 }}>Karakter verwijderen</p>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: '2px 0 0' }}>
                Dit verwijdert het karakter permanent en kan niet ongedaan worden gemaakt.
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setDeleteOpen(true)}
            >
              Verwijder karakter
            </Button>
          </div>
        </div>

      </div>

      {/* Delete modal */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Karakter verwijderen"
      >
        <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 24 }}>
          Weet je zeker dat je <strong style={{ color: 'var(--ink)' }}>{characterData.name}</strong> wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
            Annuleren
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={deleteCharacter.isPending}>
            Verwijder karakter
          </Button>
        </div>
      </Modal>

      {/* Discard dialog */}
      <ConfirmDialog
        open={guard.discardOpen}
        onClose={guard.cancelLeave}
        onConfirm={handleDiscardConfirm}
        title={guard.isDraftDiscard ? 'Karakter weggooien?' : 'Niet-opgeslagen wijzigingen'}
        confirmLabel={guard.isDraftDiscard ? 'Weggooien' : 'Verlaten'}
        cancelLabel={guard.isDraftDiscard ? 'Annuleren' : 'Blijven'}
        confirmVariant="crimson"
      >
        {guard.isDraftDiscard
          ? 'Dit item is nog niet opgeslagen en wordt permanent verwijderd. Doorgaan?'
          : 'Je hebt niet-opgeslagen wijzigingen. Weet je zeker dat je de pagina wilt verlaten?'
        }
      </ConfirmDialog>
    </div>
  )
}

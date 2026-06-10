import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Avatar } from '@/components/ui/Avatar'
import { useUserCampaignNames } from '@/hooks/queries/useCampaign'
import { useAuthStore } from '@/stores/auth.store'
import { sanitizeImageUrl } from '@/utils/sanitizeUrl'
import type { WizardDraft } from '@/types/character_wizard.types'

interface Props {
  draft: WizardDraft
  patch: (updates: Partial<WizardDraft>) => void
}

export function StepBasics({ draft, patch }: Props) {
  const user = useAuthStore((s) => s.user)
  const { data: campaigns } = useUserCampaignNames(user?.id)
  const portraitPreview = sanitizeImageUrl(draft.portraitUrl)

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:gap-8">
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <Input
          label="Naam"
          value={draft.name}
          onChange={(e) => patch({ name: e.target.value })}
          placeholder="bijv. Lyria Moonweaver"
          required
        />
        <Input
          label="Subtitel"
          value={draft.subtitle}
          onChange={(e) => patch({ subtitle: e.target.value })}
          placeholder="bijv. De laatste van haar huis"
          hint="Optioneel — een korte typering onder de naam"
        />
        <Select
          label="Kroniek"
          value={draft.campaignId ?? ''}
          onChange={(e) => patch({ campaignId: e.target.value || null })}
          hint="Optioneel — koppel je karakter aan een kroniek"
          options={[
            { value: '', label: 'Geen kroniek' },
            ...(campaigns ?? []).map((c) => ({ value: c.id, label: c.name })),
          ]}
        />
      </div>

      <div className="flex flex-col items-center gap-3 sm:w-56">
        <Avatar
          size="lg"
          src={portraitPreview}
          alt={draft.name || 'Portretvoorbeeld'}
          fallback="✦"
        />
        <Input
          label="Portret-URL"
          type="url"
          value={draft.portraitUrl}
          onChange={(e) => patch({ portraitUrl: e.target.value })}
          placeholder="https://..."
          hint="Alleen https. Positioneren kan later op de bewerkpagina."
          error={
            draft.portraitUrl.trim() && !portraitPreview
              ? 'Ongeldige afbeeldings-URL (https vereist)'
              : undefined
          }
          fieldClassName="w-full"
        />
      </div>
    </div>
  )
}

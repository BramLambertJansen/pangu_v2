import { QuestCard, ForgeQuestCard } from '@/components/quest/QuestCard'
import { Spinner } from '@/components/ui/Spinner'
import type { Quest } from '@/types/quest.types'

export function QuestsTab({
  quests,
  isLoading,
  forging,
  onForge,
  onViewAll,
}: {
  quests: Quest[] | undefined
  isLoading: boolean
  forging: boolean
  onForge: () => void
  onViewAll: () => void
}) {
  return (
    <section aria-labelledby="tab-quests-heading">
      <h2
        id="tab-quests-heading"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(22px, 4vw, 30px)',
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--ink)',
          margin: '0 0 24px',
        }}
      >
        Quests
      </h2>
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }} aria-live="polite" aria-busy="true">
          <Spinner size="md" />
        </div>
      ) : (
        <>
          <ul
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 'var(--sp-5)',
              listStyle: 'none',
              padding: 0,
              margin: 0,
            }}
            role="list"
            aria-label="Quests in deze kroniek"
          >
            {quests?.map((quest) => (
              <li key={quest.id}><QuestCard quest={quest} /></li>
            ))}
            <li>
              <ForgeQuestCard onClick={onForge} loading={forging} />
            </li>
          </ul>
          {quests && quests.length > 0 && (
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="pangu-btn pangu-btn-ghost pangu-btn-sm"
                onClick={onViewAll}
              >
                Alle quests bekijken →
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}

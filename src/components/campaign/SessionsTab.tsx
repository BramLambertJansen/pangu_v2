import { StoryArcTracker } from '@/components/session/StoryArcTracker'
import { Spinner } from '@/components/ui/Spinner'
import type { Session } from '@/types/session.types'

export function SessionsTab({
  sessions,
  isLoading,
  forging,
  onForge,
}: {
  sessions: Session[]
  isLoading: boolean
  forging: boolean
  onForge: (nextNumber: number) => void
}) {
  return (
    <section aria-labelledby="tab-sessions-heading">
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }} aria-live="polite" aria-busy="true">
          <Spinner size="lg" />
        </div>
      ) : (
        <StoryArcTracker
          sessions={sessions}
          onForge={() => {
            const nextNumber = sessions.length > 0
              ? Math.max(...sessions.map((s) => s.session_number ?? 0)) + 1
              : 1
            onForge(nextNumber)
          }}
          forgeLoading={forging}
        />
      )}
    </section>
  )
}

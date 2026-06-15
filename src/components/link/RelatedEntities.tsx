import { useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { OrnateDivider } from '@/components/ui/OrnateDivider'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Button } from '@/components/ui/Button'
import { LinkEntityModal } from '@/components/link/LinkEntityModal'
import { useEntityLinks, useDeleteLink } from '@/hooks/queries/useEntityLinks'
import { relationLabel, relationInverseLabel, linkableTypeLabel, linkableTypeRoute } from '@/lib/linkMaps'
import type { LinkableEntityType, ResolvedLink } from '@/types/link.types'

interface Props {
  type: LinkableEntityType
  id: string
  campaignId: string
}

function entityHref(link: ResolvedLink): string {
  const base = `${linkableTypeRoute[link.entity.type]}/${link.entity.id}`
  // Items have no detail page — route directly to edit
  return link.entity.type === 'item' ? `${base}/edit` : base
}

export function RelatedEntities({ type, id, campaignId }: Props) {
  const { data: links, isLoading } = useEntityLinks(type, id)
  const deleteLink = useDeleteLink()
  const [modalOpen, setModalOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<ResolvedLink | null>(null)
  const triggerWrapRef = useRef<HTMLSpanElement>(null)

  const openModal = useCallback(() => setModalOpen(true), [])
  const closeModal = useCallback(() => {
    setModalOpen(false)
    // Return focus to the trigger button after modal closes
    triggerWrapRef.current?.querySelector('button')?.focus()
  }, [])

  // Group links by the type of the connected entity
  const grouped = new Map<LinkableEntityType, ResolvedLink[]>()
  for (const link of links ?? []) {
    const group = grouped.get(link.entity.type) ?? []
    group.push(link)
    grouped.set(link.entity.type, group)
  }

  function handleDeleteConfirm() {
    if (!pendingDelete) return
    deleteLink.mutate({
      linkId: pendingDelete.linkId,
      fromType: type,
      fromId: id,
      toType: pendingDelete.entity.type,
      toId: pendingDelete.entity.id,
    }, { onSettled: () => setPendingDelete(null) })
  }

  return (
    <section aria-label="Verbonden entiteiten">
      <OrnateDivider label="Verbonden" />

      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
          <Spinner size="md" />
        </div>
      )}

      {!isLoading && grouped.size === 0 && (
        <EmptyState
          title="Geen verbindingen"
          description="Leg verbanden met locaties, NPCs, quests en meer."
          action={
            <span ref={triggerWrapRef}>
              <Button variant="secondary" size="sm" onClick={openModal}>
                Verbind…
              </Button>
            </span>
          }
        />
      )}

      {!isLoading && grouped.size > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {Array.from(grouped.entries()).map(([entityType, group]) => (
            <div key={entityType}>
              <p style={{
                fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
                letterSpacing: '0.18em', textTransform: 'uppercase',
                color: 'var(--muted)', margin: '0 0 10px',
              }}>
                {linkableTypeLabel[entityType]}
              </p>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {group.map(link => {
                  const label = link.direction === 'outgoing'
                    ? relationLabel[link.relation]
                    : relationInverseLabel[link.relation]
                  return (
                    <li key={link.linkId} className="surface" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic', flexShrink: 0 }}>{label}</span>
                      <Link
                        to={entityHref(link)}
                        style={{ fontSize: 14, color: 'var(--violet)', fontWeight: 600, textDecoration: 'none', flex: 1, minWidth: 0 }}
                        onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                        onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                      >
                        {link.entity.name}
                      </Link>
                      <button
                        type="button"
                        aria-label={`Verwijder koppeling met ${link.entity.name}`}
                        onClick={() => setPendingDelete(link)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          minWidth: 44, minHeight: 44,
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'var(--muted)', borderRadius: 6,
                          transition: 'color var(--t-fast)',
                          flexShrink: 0,
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--crimson)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
                      >
                        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                        </svg>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}

          <div>
            <span ref={triggerWrapRef}>
              <Button variant="secondary" size="sm" onClick={openModal}>
                + Verbind…
              </Button>
            </span>
          </div>
        </div>
      )}

      <LinkEntityModal
        open={modalOpen}
        onClose={closeModal}
        sourceType={type}
        sourceId={id}
        campaignId={campaignId}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Verbinding verwijderen?"
        confirmLabel="Verwijderen"
        confirmVariant="crimson"
        loading={deleteLink.isPending}
      >
        Weet je zeker dat je de koppeling met <strong>{pendingDelete?.entity.name}</strong> wilt verwijderen?
      </ConfirmDialog>
    </section>
  )
}

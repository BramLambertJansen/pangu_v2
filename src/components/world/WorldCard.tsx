import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/utils/cn'
import type { World } from '@/types/world.types'

interface Props {
  world: World
}

const statusLabel: Record<string, string> = {
  draft: 'Concept',
  active: 'Actief',
  archived: 'Gearchiveerd',
}

const statusVariant: Record<string, 'default' | 'success' | 'warning'> = {
  draft: 'default',
  active: 'success',
  archived: 'warning',
}

export function WorldCard({ world }: Props) {
  const navigate = useNavigate()

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Wereld: ${world.name}`}
      onClick={() => navigate(`/worlds/${world.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          navigate(`/worlds/${world.id}`)
        }
      }}
      className={cn(
        'relative overflow-hidden rounded-lg cursor-pointer',
        'border border-gray-800 bg-gray-900',
        'transition-all duration-200 hover:border-gray-600 hover:scale-[1.02]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500',
      )}
      style={{ minHeight: '180px' }}
    >
      {/* Header image or gradient placeholder */}
      {world.header_image ? (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${world.header_image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          aria-hidden="true"
        />
      ) : (
        <div
          className="absolute inset-0"
          aria-hidden="true"
          style={{
            background: 'radial-gradient(ellipse 80% 80% at 50% -20%, rgba(155, 138, 255, 0.18), transparent 70%), var(--void)',
          }}
        />
      )}

      {/* Dark overlay for legibility */}
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{ background: 'linear-gradient(to top, rgba(8,6,18,0.92) 0%, rgba(8,6,18,0.5) 60%, rgba(8,6,18,0.25) 100%)' }}
      />

      {/* Content */}
      <div className="relative flex flex-col justify-end h-full p-4" style={{ minHeight: '180px' }}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2
              className="truncate"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '16px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                color: 'var(--ink)',
                margin: 0,
              }}
            >
              {world.name}
            </h2>
            {world.subtitle && (
              <p
                className="mt-1 truncate text-sm"
                style={{ color: 'var(--muted)' }}
              >
                {world.subtitle}
              </p>
            )}
          </div>
          <Badge variant={statusVariant[world.status] ?? 'default'} className="shrink-0">
            {statusLabel[world.status] ?? world.status}
          </Badge>
        </div>
      </div>
    </article>
  )
}

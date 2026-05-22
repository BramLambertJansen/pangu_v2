import { Skeleton } from './Skeleton'

interface Props {
  count?: number
  variant?: 'hero' | 'compact'
}

export function EntityCardSkeleton({ count = 3, variant = 'compact' }: Props) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} aria-hidden="true">
          <Skeleton
            style={{
              borderRadius: 'var(--r-xl)',
              height: variant === 'hero' ? 520 : 120,
            }}
          />
        </li>
      ))}
    </>
  )
}

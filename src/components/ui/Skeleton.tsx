import { cn } from '@/utils/cn'

export interface SkeletonProps {
  className?: string
  style?: React.CSSProperties
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn('skeleton-pulse', className)}
      style={style}
      aria-hidden="true"
    />
  )
}

import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/utils/cn'

type Size = 'sm' | 'md' | 'lg'

export interface AvatarProps extends ComponentPropsWithoutRef<'div'> {
  src?: string
  /** Used as alt text for the image, or as aria-label for the fallback */
  alt?: string
  size?: Size
  /** One or two characters shown when no image is available */
  fallback?: string
}

const sizeClass: Record<Size, string> = {
  sm: 'avatar-sm',
  md: 'avatar-md',
  lg: 'avatar-lg',
}

const sizePx: Record<Size, number> = {
  sm: 32,
  md: 40,
  lg: 56,
}

export function Avatar({ src, alt, size = 'md', fallback, className, ...props }: AvatarProps) {
  return (
    <div className={cn('avatar', sizeClass[size], className)} {...props}>
      {src ? (
        <img src={src} alt={alt ?? ''} width={sizePx[size]} height={sizePx[size]} />
      ) : (
        <span aria-label={alt}>{fallback ?? '?'}</span>
      )}
    </div>
  )
}

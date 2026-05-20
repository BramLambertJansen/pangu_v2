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

const sizeStyles: Record<Size, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
}

export function Avatar({ src, alt, size = 'md', fallback, className, ...props }: AvatarProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center overflow-hidden rounded-full bg-indigo-800 font-medium text-white select-none',
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {src ? (
        <img src={src} alt={alt ?? ''} className="h-full w-full object-cover" />
      ) : (
        <span aria-label={alt}>{fallback ?? '?'}</span>
      )}
    </div>
  )
}

import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/utils/cn'

export type CardProps = ComponentPropsWithoutRef<'div'>

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn('rounded-lg border border-hairline bg-surface p-4', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export type CardHeaderProps = ComponentPropsWithoutRef<'div'>

export function CardHeader({ className, children, ...props }: CardHeaderProps) {
  return (
    <div className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  )
}

export type CardTitleProps = ComponentPropsWithoutRef<'h3'>

export function CardTitle({ className, children, ...props }: CardTitleProps) {
  return (
    <h3 className={cn('text-lg font-semibold text-ink', className)} {...props}>
      {children}
    </h3>
  )
}

export type CardContentProps = ComponentPropsWithoutRef<'div'>

export function CardContent({ className, children, ...props }: CardContentProps) {
  return (
    <div className={cn('text-sm text-ink-soft', className)} {...props}>
      {children}
    </div>
  )
}

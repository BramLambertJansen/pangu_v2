import { cn } from '@/utils/cn';

type LogoVariant = 'full' | 'icon';
type LogoSize = 'sm' | 'md' | 'lg' | 'xl';

interface LogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  className?: string;
}

const sizeMap: Record<LogoSize, { icon: number; full: { w: number; h: number } }> = {
  sm:  { icon: 32,  full: { w: 120, h: 135 } },
  md:  { icon: 48,  full: { w: 180, h: 202 } },
  lg:  { icon: 64,  full: { w: 240, h: 270 } },
  xl:  { icon: 96,  full: { w: 320, h: 360 } },
};

/** Pangu logo — compass-style P emblem with optional wordmark */
export function Logo({ variant = 'full', size = 'md', className }: LogoProps) {
  const dims = sizeMap[size];

  if (variant === 'icon') {
    return (
      <img
        src="/favicon.svg"
        width={dims.icon}
        height={dims.icon}
        alt="Pangu"
        className={cn('shrink-0', className)}
        aria-hidden="false"
      />
    );
  }

  return (
    <img
      src="/logo.svg"
      width={dims.full.w}
      height={dims.full.h}
      alt="Pangu — Sanctum II"
      className={cn('shrink-0', className)}
    />
  );
}

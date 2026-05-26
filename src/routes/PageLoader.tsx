import { Spinner } from '@/components/ui/Spinner'

export function PageLoader() {
  return (
    <div className="flex h-full items-center justify-center" aria-live="polite" aria-label="Pagina laden...">
      <Spinner size="lg" />
    </div>
  )
}

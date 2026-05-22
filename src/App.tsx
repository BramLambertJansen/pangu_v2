import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import { queryClient } from '@/lib/queryClient'
import { router } from '@/routes'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AuthInitializer } from '@/components/AuthInitializer'

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthInitializer />
        <RouterProvider router={router} />
        <Toaster richColors position="top-right" />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

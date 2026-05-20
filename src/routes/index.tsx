import { lazy, Suspense } from 'react'
import { createBrowserRouter, redirect } from 'react-router-dom'
import AppLayout from '@/layouts/AppLayout'
import AuthLayout from '@/layouts/AuthLayout'
import { Spinner } from '@/components/ui/Spinner'

const LoginPage = lazy(() => import('@/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/RegisterPage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))

function PageLoader() {
  return (
    <div className="flex h-full items-center justify-center" aria-live="polite" aria-label="Pagina laden...">
      <Spinner size="lg" />
    </div>
  )
}

function wrap(Page: React.ComponentType) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Page />
    </Suspense>
  )
}

export const router = createBrowserRouter([
  {
    path: '/',
    loader: () => redirect('/dashboard'),
  },
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: wrap(LoginPage) },
      { path: '/register', element: wrap(RegisterPage) },
    ],
  },
  {
    element: <AppLayout />,
    children: [
      { path: '/dashboard', element: wrap(DashboardPage) },
    ],
  },
])

import { lazy, Suspense } from 'react'
import { createBrowserRouter, redirect } from 'react-router-dom'
import AppLayout from '@/layouts/AppLayout'
import AuthLayout from '@/layouts/AuthLayout'
import { Spinner } from '@/components/ui/Spinner'
import { supabase } from '@/lib/supabase'

const LoginPage = lazy(() => import('@/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/RegisterPage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const AdminPage = lazy(() => import('@/pages/AdminPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const WorldsPage = lazy(() => import('@/pages/WorldsPage'))
const WorldDetailPage = lazy(() => import('@/pages/WorldDetailPage'))
const WorldEditPage = lazy(() => import('@/pages/WorldEditPage'))
const CampaignDetailPage = lazy(() => import('@/pages/CampaignDetailPage'))
const CampaignEditPage = lazy(() => import('@/pages/CampaignEditPage'))
const LocationsPage = lazy(() => import('@/pages/LocationsPage'))
const LocationEditPage = lazy(() => import('@/pages/LocationEditPage'))
const SessionsPage = lazy(() => import('@/pages/SessionsPage'))
const SessionEditPage = lazy(() => import('@/pages/SessionEditPage'))

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

async function requireAuth() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return redirect('/login')
  return null
}

async function requireAdmin() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'admin') return redirect('/dashboard')
  return null
}

export const router = createBrowserRouter([
  {
    path: '/',
    loader: () => redirect('/dashboard'),
    element: null,
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
      {
        path: '/dashboard',
        loader: requireAuth,
        element: wrap(DashboardPage),
      },
      {
        path: '/admin',
        loader: requireAdmin,
        element: wrap(AdminPage),
      },
      {
        path: '/settings',
        loader: requireAuth,
        element: wrap(SettingsPage),
      },
      {
        path: '/worlds',
        loader: requireAuth,
        element: wrap(WorldsPage),
      },
      {
        path: '/worlds/:id',
        loader: requireAuth,
        element: wrap(WorldDetailPage),
      },
      {
        path: '/worlds/:id/edit',
        loader: requireAuth,
        element: wrap(WorldEditPage),
      },
      {
        path: '/campaigns/:id',
        loader: requireAuth,
        element: wrap(CampaignDetailPage),
      },
      {
        path: '/campaigns/:id/edit',
        loader: requireAuth,
        element: wrap(CampaignEditPage),
      },
      {
        path: '/campaigns/:id/locations',
        loader: requireAuth,
        element: wrap(LocationsPage),
      },
      {
        path: '/locations/:id/edit',
        loader: requireAuth,
        element: wrap(LocationEditPage),
      },
      {
        path: '/campaigns/:id/sessions',
        loader: requireAuth,
        element: wrap(SessionsPage),
      },
      {
        path: '/sessions/:id/edit',
        loader: requireAuth,
        element: wrap(SessionEditPage),
      },
    ],
  },
])

import { lazy, Suspense } from 'react'
import { createBrowserRouter, redirect, isRouteErrorResponse, useRouteError } from 'react-router-dom'
import AppLayout from '@/layouts/AppLayout'
import AuthLayout from '@/layouts/AuthLayout'
import { Spinner } from '@/components/ui/Spinner'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'

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
const LocationDetailPage = lazy(() => import('@/pages/LocationDetailPage'))
const LocationEditPage = lazy(() => import('@/pages/LocationEditPage'))
const LoresPage = lazy(() => import('@/pages/LoresPage'))
const LoreDetailPage = lazy(() => import('@/pages/LoreDetailPage'))
const LoreEditPage = lazy(() => import('@/pages/LoreEditPage'))
const NpcsPage = lazy(() => import('@/pages/NpcsPage'))
const NpcDetailPage = lazy(() => import('@/pages/NpcDetailPage'))
const NpcEditPage = lazy(() => import('@/pages/NpcEditPage'))
const SessionsPage = lazy(() => import('@/pages/SessionsPage'))
const SessionEditPage = lazy(() => import('@/pages/SessionEditPage'))
const CharactersPage = lazy(() => import('@/pages/CharactersPage'))
const CharacterDetailPage = lazy(() => import('@/pages/CharacterDetailPage'))
const CharacterEditPage = lazy(() => import('@/pages/CharacterEditPage'))
const BestiariesPage = lazy(() => import('@/pages/BestiariesPage'))
const BestiaryDetailPage = lazy(() => import('@/pages/BestiaryDetailPage'))
const BestiaryEditPage = lazy(() => import('@/pages/BestiaryEditPage'))
const QuestsPage = lazy(() => import('@/pages/QuestsPage'))
const QuestDetailPage = lazy(() => import('@/pages/QuestDetailPage'))
const QuestEditPage = lazy(() => import('@/pages/QuestEditPage'))
const EncountersPage = lazy(() => import('@/pages/EncountersPage'))
const EncounterDetailPage = lazy(() => import('@/pages/EncounterDetailPage'))
const EncounterEditPage = lazy(() => import('@/pages/EncounterEditPage'))

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

export async function requireAuth() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return redirect('/login')
  return null
}

export async function requireAdmin() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return redirect('/login')

  // Use persisted profile from store to avoid an extra round-trip on every navigation
  const { profile } = useAuthStore.getState()
  if (profile !== null) {
    return profile.role === 'admin' ? null : redirect('/dashboard')
  }

  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (data?.role !== 'admin') return redirect('/dashboard')
  return null
}

function RouteErrorPage() {
  const error = useRouteError()
  const is404 = isRouteErrorResponse(error) && error.status === 404

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100dvh',
        textAlign: 'center',
        padding: '2rem',
        background: 'var(--void)',
        color: 'var(--ink)',
      }}
    >
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 72, fontWeight: 700, color: 'var(--violet)', margin: 0, lineHeight: 1 }}>
        {is404 ? '404' : '500'}
      </p>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, marginTop: 16 }}>
        {is404 ? 'Pagina niet gevonden' : 'Er is iets misgegaan'}
      </h1>
      <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginTop: 8, maxWidth: 380 }}>
        {is404
          ? 'Deze pagina bestaat niet of is verplaatst.'
          : 'Een onverwachte fout heeft de pagina onderbroken.'}
      </p>
      <a
        href="/dashboard"
        className="pangu-btn pangu-btn-primary"
        style={{ marginTop: 28, textDecoration: 'none' }}
      >
        Terug naar dashboard
      </a>
    </div>
  )
}

export const router = createBrowserRouter([
  {
    path: '/',
    loader: () => redirect('/dashboard'),
    element: null,
    errorElement: <RouteErrorPage />,
  },
  {
    element: <AuthLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { path: '/login', element: wrap(LoginPage) },
      { path: '/register', element: wrap(RegisterPage) },
    ],
  },
  {
    element: <AppLayout />,
    errorElement: <RouteErrorPage />,
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
        path: '/locations/:id',
        loader: requireAuth,
        element: wrap(LocationDetailPage),
      },
      {
        path: '/locations/:id/edit',
        loader: requireAuth,
        element: wrap(LocationEditPage),
      },
      {
        path: '/campaigns/:id/lore',
        loader: requireAuth,
        element: wrap(LoresPage),
      },
      {
        path: '/lore/:id',
        loader: requireAuth,
        element: wrap(LoreDetailPage),
      },
      {
        path: '/lore/:id/edit',
        loader: requireAuth,
        element: wrap(LoreEditPage),
      },
      {
        path: '/campaigns/:id/npcs',
        loader: requireAuth,
        element: wrap(NpcsPage),
      },
      {
        path: '/npcs/:id',
        loader: requireAuth,
        element: wrap(NpcDetailPage),
      },
      {
        path: '/npcs/:id/edit',
        loader: requireAuth,
        element: wrap(NpcEditPage),
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
      {
        path: '/characters',
        loader: requireAuth,
        element: wrap(CharactersPage),
      },
      {
        path: '/characters/:id',
        loader: requireAuth,
        element: wrap(CharacterDetailPage),
      },
      {
        path: '/characters/:id/edit',
        loader: requireAuth,
        element: wrap(CharacterEditPage),
      },
      {
        path: '/worlds/:id/bestiary',
        loader: requireAuth,
        element: wrap(BestiariesPage),
      },
      {
        path: '/bestiary/:id',
        loader: requireAuth,
        element: wrap(BestiaryDetailPage),
      },
      {
        path: '/bestiary/:id/edit',
        loader: requireAuth,
        element: wrap(BestiaryEditPage),
      },
      {
        path: '/campaigns/:id/quests',
        loader: requireAuth,
        element: wrap(QuestsPage),
      },
      {
        path: '/quests/:id',
        loader: requireAuth,
        element: wrap(QuestDetailPage),
      },
      {
        path: '/quests/:id/edit',
        loader: requireAuth,
        element: wrap(QuestEditPage),
      },
      {
        path: '/campaigns/:id/encounters',
        loader: requireAuth,
        element: wrap(EncountersPage),
      },
      {
        path: '/encounters/:id',
        loader: requireAuth,
        element: wrap(EncounterDetailPage),
      },
      {
        path: '/encounters/:id/edit',
        loader: requireAuth,
        element: wrap(EncounterEditPage),
      },
      { path: '*', element: <RouteErrorPage /> },
    ],
  },
])

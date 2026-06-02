import { lazy, Suspense } from 'react'
import { createBrowserRouter, redirect } from 'react-router-dom'
import AppLayout from '@/layouts/AppLayout'
import AuthLayout from '@/layouts/AuthLayout'
import { requireAuth, requireAdmin, requireRegistrationEnabled } from './loaders'
import { PageLoader } from './PageLoader'
import { RouteErrorPage } from './RouteErrorPage'

const LoginPage = lazy(() => import('@/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/RegisterPage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const AdminPage = lazy(() => import('@/pages/AdminPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const WorldsPage = lazy(() => import('@/pages/WorldsPage'))
const WorldDetailPage = lazy(() => import('@/pages/WorldDetailPage'))
const WorldEditPage = lazy(() => import('@/pages/WorldEditPage'))
const WorldBuilderPage = lazy(() => import('@/pages/WorldBuilderPage'))
const CampaignsPage = lazy(() => import('@/pages/CampaignsPage'))
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
const SessionDetailPage = lazy(() => import('@/pages/SessionDetailPage'))
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
const EncounterRunPage = lazy(() => import('@/pages/EncounterRunPage'))
const CampaignItemsPage = lazy(() => import('@/pages/CampaignItemsPage'))
const LootGeneratorPage = lazy(() => import('@/pages/LootGeneratorPage'))
const ItemEditPage = lazy(() => import('@/pages/ItemEditPage'))
const JoinPage = lazy(() => import('@/pages/JoinPage'))
const FactionsPage = lazy(() => import('@/pages/FactionsPage'))
const FactionDetailPage = lazy(() => import('@/pages/FactionDetailPage'))
const FactionEditPage = lazy(() => import('@/pages/FactionEditPage'))
const SpellsPage = lazy(() => import('@/pages/SpellsPage'))
const ItemsPage = lazy(() => import('@/pages/ItemsPage'))

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
    element: null,
    errorElement: <RouteErrorPage />,
  },
  {
    element: <AuthLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { path: '/login', element: wrap(LoginPage) },
      { path: '/register', loader: requireRegistrationEnabled, element: wrap(RegisterPage) },
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
        path: '/worlds/:id/world-builder',
        loader: requireAuth,
        element: wrap(WorldBuilderPage),
      },
      {
        path: '/campaigns',
        loader: requireAuth,
        element: wrap(CampaignsPage),
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
        path: '/sessions/:id',
        loader: requireAuth,
        element: wrap(SessionDetailPage),
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
      {
        path: '/encounters/:id/run',
        loader: requireAuth,
        element: wrap(EncounterRunPage),
      },
      {
        path: '/campaigns/:id/items',
        loader: requireAuth,
        element: wrap(CampaignItemsPage),
      },
      {
        path: '/campaigns/:id/loot-generator',
        loader: requireAuth,
        element: wrap(LootGeneratorPage),
      },
      {
        path: '/items/:id/edit',
        loader: requireAuth,
        element: wrap(ItemEditPage),
      },
      {
        path: '/campaigns/:id/factions',
        loader: requireAuth,
        element: wrap(FactionsPage),
      },
      {
        path: '/factions/:id',
        loader: requireAuth,
        element: wrap(FactionDetailPage),
      },
      {
        path: '/factions/:id/edit',
        loader: requireAuth,
        element: wrap(FactionEditPage),
      },
      {
        path: '/spells',
        loader: requireAuth,
        element: wrap(SpellsPage),
      },
      {
        path: '/items',
        loader: requireAuth,
        element: wrap(ItemsPage),
      },
      { path: '*', element: <RouteErrorPage /> },
    ],
  },
  {
    path: '/join/:code',
    element: wrap(JoinPage),
    errorElement: <RouteErrorPage />,
  },
])

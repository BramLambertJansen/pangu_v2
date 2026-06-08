import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import { useUIStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/queryClient'
import { toast } from 'sonner'
import { useState, useEffect, useRef } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { NotificationCenter } from '@/components/ui/NotificationCenter'
import { Starfield } from '@/components/ui/Starfield'
import { DEV_MODE } from '@/lib/constants'

const baseNavItems = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    to: '/worlds',
    label: 'Werelden',
    icon: (
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  {
    to: '/campaigns',
    label: 'Kronieken',
    icon: (
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    to: '/characters',
    label: 'Karakters',
    icon: (
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    to: '/spells',
    label: 'Spreuken',
    icon: (
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 3 C15 3 20 8 20 13 C20 16.31 17.31 19 14 19 L14 21 L10 21 L10 19 C6.69 19 4 16.31 4 13 C4 8 9 3 9 3 Z" />
        <line x1="12" y1="3" x2="12" y2="7" />
        <line x1="9" y1="3" x2="7" y2="6" />
        <line x1="15" y1="3" x2="17" y2="6" />
      </svg>
    ),
  },
  {
    to: '/items',
    label: 'Items',
    icon: (
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    ),
  },
]

const designSystemNavItem = {
  to: '/design-system',
  label: 'Design System',
  icon: (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r="2.5" />
      <circle cx="6.5" cy="11.5" r="2.5" />
      <circle cx="17" cy="15" r="3" />
      <path d="M4 21h16" />
    </svg>
  ),
}

const settingsNavItem = {
  to: '/settings',
  label: 'Instellingen',
  icon: (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
}

export default function AppLayout() {
  const location = useLocation()
  const sidebarCollapsed = useUIStore(s => s.sidebarCollapsed)
  const toggleSidebar = useUIStore(s => s.toggleSidebar)
  const profile = useAuthStore(s => s.profile)
  const signOut = useAuthStore(s => s.signOut)
  const isOnline = useOnlineStatus()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = [
    ...baseNavItems,
    ...(profile?.role === 'admin' || DEV_MODE ? [designSystemNavItem] : []),
    settingsNavItem,
  ]

  async function handleSignOut() {
    await supabase.auth.signOut()
    signOut()
    queryClient.clear()
    toast.success('Uitgelogd')
    navigate('/login', { replace: true })
  }

  const topbarRef = useRef<HTMLElement>(null)
  const mainRef = useRef<HTMLElement>(null)
  const lastScrollY = useRef(0)

  useEffect(() => {
    const main = mainRef.current
    if (!main) return

    const onScroll = () => {
      const y = main.scrollTop
      // Hide when scrolling down past 80px; reveal on any upward scroll
      const hide = y > lastScrollY.current && y > 80
      topbarRef.current?.classList.toggle('mobile-topbar--hidden', hide)
      lastScrollY.current = y
    }

    main.addEventListener('scroll', onScroll, { passive: true })
    return () => main.removeEventListener('scroll', onScroll)
  }, [])

  const iconOnly = `nav-item nav-item--icon-only`
  const sidebarWidth = sidebarCollapsed ? '56px' : '240px'

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--void)', color: 'var(--ink)' }}>
      <a href="#main-content" className="skip-to-content">Naar inhoud springen</a>

      {/* ── Mobile backdrop ── */}
      <div
        aria-hidden="true"
        className={`sidebar-backdrop${mobileOpen ? '' : ' is-hidden'}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* ── Background layers ── */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 0,
          background: [
            'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(155, 138, 255, 0.08), transparent 60%)',
            'radial-gradient(ellipse 60% 80% at 100% 100%, rgba(245, 200, 66, 0.04), transparent 60%)',
            'var(--void)',
          ].join(', '),
        }}
      />
      <Starfield />
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 2,
          opacity: 0.04,
          mixBlendMode: 'overlay',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ── Sidebar ── */}
      <nav
        id="sidebar-nav"
        aria-label="Hoofdnavigatie"
        className={`sidebar-nav relative flex flex-col h-full shrink-0${mobileOpen ? ' is-open' : ''}`}
        style={{
          width: sidebarWidth,
          zIndex: 10,
          background: 'linear-gradient(180deg, var(--void-2) 0%, var(--void) 100%)',
          borderRight: '1px solid var(--hairline)',
          transition: `width var(--t-base) var(--ease-out)`,
          overflow: 'hidden',
        }}
      >
        <div
          className="flex flex-col h-full"
          style={{
            padding: sidebarCollapsed ? 'var(--sp-6) var(--sp-2)' : 'var(--sp-6) var(--sp-4)',
            gap: 'var(--sp-4)',
            transition: `padding var(--t-base) var(--ease-out)`,
            minWidth: sidebarCollapsed ? '56px' : '240px',
          }}
        >
          {/* Logo */}
          <div
            className="flex items-center shrink-0"
            style={{
              paddingBottom: 'var(--sp-5)',
              borderBottom: '1px solid var(--hairline)',
              justifyContent: 'center',
            }}
          >
            {sidebarCollapsed ? (
              <img
                src="/pangu.svg"
                alt="PANGU"
                width={36}
                height={36}
                style={{ borderRadius: '6px', display: 'block', flexShrink: 0 }}
              />
            ) : (
              <img
                src="/pangu.svg"
                alt="PANGU Sanctum II"
                style={{ width: '120px', height: 'auto', borderRadius: '8px', display: 'block' }}
              />
            )}
          </div>

          {/* Nav links */}
          <ul className="flex flex-col" role="list" style={{ gap: '2px', flex: 1, paddingTop: 'var(--sp-3)' }}>
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  title={sidebarCollapsed ? item.label : undefined}
                  aria-label={sidebarCollapsed ? item.label : undefined}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    sidebarCollapsed
                      ? `${iconOnly}${isActive ? ' nav-item--active' : ''}`
                      : `nav-item${isActive ? ' nav-item--active' : ''}`
                  }
                >
                  {item.icon}
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Footer */}
          <div className="flex flex-col shrink-0" style={{ gap: 'var(--sp-2)' }}>
            {/* ── Status indicators ── */}
            {(!isOnline || DEV_MODE) && (
              <div
                role="status"
                aria-live="polite"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  padding: sidebarCollapsed ? '4px 0' : '4px 8px',
                }}
              >
                {!isOnline && (
                  <div
                    title="Geen internetverbinding"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--gold)',
                      justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                    }}
                  >
                    {/* Wifi-off icon */}
                    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <line x1="1" y1="1" x2="23" y2="23" />
                      <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
                      <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
                      <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
                      <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
                      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                      <line x1="12" y1="20" x2="12.01" y2="20" />
                    </svg>
                    {!sidebarCollapsed && <span>Offline</span>}
                  </div>
                )}
                {DEV_MODE && (
                  <div
                    title="Dev modus actief — data wordt lokaal opgeslagen"
                    style={{ display: 'flex', justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}
                  >
                    {sidebarCollapsed ? (
                      // Collapsed: icon-only dot to signal dev mode
                      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--violet)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="16 18 22 12 16 6" />
                        <polyline points="8 6 2 12 8 18" />
                      </svg>
                    ) : (
                      <Badge variant="info" className="gap-1.5">
                        <svg aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="16 18 22 12 16 6" />
                          <polyline points="8 6 2 12 8 18" />
                        </svg>
                        Dev modus
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            )}
            <NotificationCenter />
            <div aria-hidden="true" style={{ height: '1px', background: 'var(--hairline)', margin: '0 8px' }} />
            <button
              onClick={() => setMobileOpen(false)}
              className="sidebar-close-btn nav-item"
              aria-label="Menu sluiten"
            >
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              <span>Sluiten</span>
            </button>
            <button
              onClick={handleSignOut}
              className={sidebarCollapsed ? iconOnly : 'nav-item'}
              aria-label="Uitloggen"
              title={sidebarCollapsed ? 'Uitloggen' : undefined}
            >
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              {!sidebarCollapsed && <span>Uitloggen</span>}
            </button>
            <button
              onClick={toggleSidebar}
              className={`sidebar-collapse-btn ${sidebarCollapsed ? iconOnly : 'nav-item'}`}
              aria-label={sidebarCollapsed ? 'Navigatie uitklappen' : 'Navigatie inklappen'}
              title={sidebarCollapsed ? 'Uitklappen' : undefined}
            >
              {sidebarCollapsed ? (
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 5l7 7-7 7" />
                  <path d="M3 5l7 7-7 7" />
                </svg>
              ) : (
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 19l-7-7 7-7" />
                  <path d="M21 19l-7-7 7-7" />
                </svg>
              )}
              {!sidebarCollapsed && <span>Inklappen</span>}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Main content ── */}
      <main
        ref={mainRef}
        id="main-content"
        className="main-content flex-1 overflow-auto"
        style={{ position: 'relative', zIndex: 10 }}
      >
        {/* ── Mobile top bar (fixed, hidden on desktop) ── */}
        <header ref={topbarRef} className="mobile-topbar" aria-label="Mobiele navigatiebalk">
          <button
            onClick={() => setMobileOpen(true)}
            className="mobile-topbar-btn"
            aria-label="Menu openen"
            aria-expanded={mobileOpen}
            aria-controls="sidebar-nav"
          >
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <Link to="/dashboard" className="mobile-topbar-brand" aria-label="Naar dashboard">
            <img
              src="/pangu.svg"
              alt="PANGU"
              width={28}
              height={28}
              aria-hidden="true"
              style={{ borderRadius: '4px', display: 'block', flexShrink: 0 }}
            />
          </Link>

          <button
            onClick={() => navigate('/settings')}
            className="mobile-topbar-avatar-btn"
            aria-label="Naar instellingen"
          >
            <Avatar
              fallback={(profile?.display_name ?? '?').slice(0, 2).toUpperCase()}
              alt={profile?.display_name ?? 'Gebruiker'}
              size="sm"
            />
          </button>
        </header>
        <div key={location.pathname} className="page-transition">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
import { useUIStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/queryClient'
import { toast } from 'sonner'
import { useMemo, useState, useEffect, useRef } from 'react'
import { Avatar } from '@/components/ui/Avatar'

interface Star {
  id: number
  x: number
  y: number
  r: number
  opacity: number
  isGold: boolean
}

function Starfield() {
  const stars = useMemo<Star[]>(() => {
    // Seeded xorshift32 for deterministic star positions (no flicker on re-render)
    let s = 0xdeadbeef
    const rand = () => {
      s ^= s << 13
      s ^= s >> 17
      s ^= s << 5
      return (s >>> 0) / 0x100000000
    }
    return Array.from({ length: 220 }, (_, id) => ({
      id,
      x: rand() * 1600,
      y: rand() * 1100,
      r: 0.25 + rand() * 1.2,
      opacity: 0.18 + rand() * 0.55,
      isGold: rand() < 0.06,
    }))
  }, [])

  return (
    <svg
      className="fixed inset-0 h-full w-full pointer-events-none"
      style={{ zIndex: 1 }}
      viewBox="0 0 1600 1100"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {stars.map(({ id, x, y, r, opacity, isGold }) => (
        <g key={id}>
          <circle cx={x} cy={y} r={r} fill={isGold ? '#f5c842' : '#f0ecf7'} opacity={opacity} />
          {isGold && (
            <>
              <line x1={x - r * 4} y1={y} x2={x + r * 4} y2={y} stroke="#f5c842" strokeWidth="0.4" opacity={opacity * 0.5} />
              <line x1={x} y1={y - r * 4} x2={x} y2={y + r * 4} stroke="#f5c842" strokeWidth="0.4" opacity={opacity * 0.5} />
            </>
          )}
        </g>
      ))}
    </svg>
  )
}

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
    to: '/characters',
    label: 'Karakters',
    icon: (
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
]

const adminNavItem = {
  to: '/admin',
  label: 'Accountbeheer',
  icon: (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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
  const sidebarCollapsed = useUIStore(s => s.sidebarCollapsed)
  const toggleSidebar = useUIStore(s => s.toggleSidebar)
  const profile = useAuthStore(s => s.profile)
  const signOut = useAuthStore(s => s.signOut)
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = [
    ...baseNavItems,
    ...(profile?.role === 'admin' ? [adminNavItem] : []),
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
              gap: '12px',
              paddingBottom: 'var(--sp-5)',
              borderBottom: '1px solid var(--hairline)',
              justifyContent: sidebarCollapsed ? 'center' : undefined,
            }}
          >
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
              <circle cx="14" cy="14" r="12" stroke="#f5c842" strokeWidth="1" strokeOpacity="0.5" />
              <circle cx="14" cy="14" r="8" stroke="#9b8aff" strokeWidth="1.5" />
              <circle cx="14" cy="14" r="3" fill="#9b8aff" />
              <circle cx="14" cy="5" r="1.5" fill="#f5c842" />
              <circle cx="22" cy="18" r="1" fill="#9b8aff" opacity="0.7" />
            </svg>
            {!sidebarCollapsed && (
              <div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: 600, letterSpacing: '0.18em', color: 'var(--ink)', margin: 0 }}>
                  PANGU
                </p>
                <p style={{ fontSize: '10px', letterSpacing: '0.22em', color: 'var(--muted)', margin: '2px 0 0' }}>
                  SANCTUM · II
                </p>
              </div>
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
            <svg width="20" height="20" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <circle cx="14" cy="14" r="12" stroke="#f5c842" strokeWidth="1" strokeOpacity="0.6" />
              <circle cx="14" cy="14" r="8" stroke="#9b8aff" strokeWidth="1.5" />
              <circle cx="14" cy="14" r="3" fill="#9b8aff" />
              <circle cx="14" cy="5" r="1.5" fill="#f5c842" />
              <circle cx="22" cy="18" r="1" fill="#9b8aff" opacity="0.7" />
            </svg>
            <span className="mobile-topbar-wordmark" aria-hidden="true">PANGU</span>
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
        <Outlet />
      </main>
    </div>
  )
}

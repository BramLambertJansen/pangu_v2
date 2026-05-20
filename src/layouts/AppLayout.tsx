import { Outlet, NavLink } from 'react-router-dom'
import { useUIStore } from '@/stores/ui.store'
import { CosmicBackground } from '@/components/ui/CosmicBackground'

const navItems = [
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
    to: '/campaigns',
    label: 'Campaigns',
    icon: (
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
]

export default function AppLayout() {
  const { sidebarOpen, toggleSidebar } = useUIStore()

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--void)', color: 'var(--ink)' }}>
      <CosmicBackground />

      {/* ── Sidebar ── */}
      {sidebarOpen && (
        <nav
          aria-label="Hoofdnavigatie"
          className="relative flex flex-col h-full overflow-y-auto shrink-0"
          style={{
            width: '240px',
            zIndex: 10,
            background: 'linear-gradient(180deg, var(--void-2) 0%, var(--void) 100%)',
            borderRight: '1px solid var(--hairline)',
          }}
        >
          <div
            className="flex flex-col h-full"
            style={{ padding: 'var(--sp-6) var(--sp-4)', gap: 'var(--sp-4)' }}
          >
            {/* Logo */}
            <div
              className="flex items-center shrink-0"
              style={{ gap: '12px', paddingBottom: 'var(--sp-5)', borderBottom: '1px solid var(--hairline)' }}
            >
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
                <circle cx="14" cy="14" r="12" stroke="#f5c842" strokeWidth="1" strokeOpacity="0.5" />
                <circle cx="14" cy="14" r="8" stroke="#9b8aff" strokeWidth="1.5" />
                <circle cx="14" cy="14" r="3" fill="#9b8aff" />
                <circle cx="14" cy="5" r="1.5" fill="#f5c842" />
                <circle cx="22" cy="18" r="1" fill="#9b8aff" opacity="0.7" />
              </svg>
              <div>
                <p
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '13px',
                    fontWeight: 600,
                    letterSpacing: '0.18em',
                    color: 'var(--ink)',
                    margin: 0,
                  }}
                >
                  PANGU
                </p>
                <p style={{ fontSize: '10px', letterSpacing: '0.22em', color: 'var(--muted)', margin: '2px 0 0' }}>
                  SANCTUM · II
                </p>
              </div>
            </div>

            {/* Nav links */}
            <ul
              className="flex flex-col"
              role="list"
              style={{ gap: '2px', flex: 1, paddingTop: 'var(--sp-3)' }}
            >
              {navItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) => `nav-item${isActive ? ' nav-item--active' : ''}`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>

            {/* Footer */}
            <div className="flex flex-col shrink-0" style={{ gap: 'var(--sp-2)' }}>
              <div aria-hidden="true" style={{ height: '1px', background: 'var(--hairline)', margin: '0 8px' }} />
              <button
                onClick={toggleSidebar}
                className="nav-item"
                aria-label="Navigatie inklappen"
              >
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 19l-7-7 7-7" />
                  <path d="M21 19l-7-7 7-7" />
                </svg>
                <span>Inklappen</span>
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* ── Main content ── */}
      <div className="flex flex-1 flex-col overflow-hidden" style={{ position: 'relative', zIndex: 10 }}>
        <header
          className="flex items-center shrink-0"
          style={{
            height: '56px',
            paddingInline: 'var(--sp-6)',
            borderBottom: '1px solid var(--hairline)',
            background: 'rgba(10, 10, 20, 0.7)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <button
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? 'Navigatie inklappen' : 'Navigatie uitklappen'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              color: 'var(--muted)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderRadius: 'var(--r-sm)',
              transition: 'color var(--t-fast), background var(--t-fast)',
              flexShrink: 0,
            }}
          >
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </header>

        <main
          className="flex-1 overflow-auto"
          style={{ padding: 'var(--sp-12) clamp(var(--sp-6), 4vw, var(--sp-12)) 100px' }}
        >
          <div style={{ maxWidth: '1320px', margin: '0 auto' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

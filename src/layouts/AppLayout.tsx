import { Outlet, NavLink } from 'react-router-dom'
import { useUIStore } from '@/stores/ui.store'

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/campaigns', label: 'Campaigns' },
]

export default function AppLayout() {
  const { sidebarOpen, toggleSidebar } = useUIStore()

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950 text-gray-100">
      {sidebarOpen && (
        <nav
          className="flex w-60 shrink-0 flex-col border-r border-gray-800 bg-gray-900 p-4"
          aria-label="Hoofdnavigatie"
        >
          <p className="mb-6 text-xl font-bold tracking-tight text-indigo-400">PANGU</p>
          <ul className="flex flex-col gap-1" role="list">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `block rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                      isActive
                        ? 'bg-indigo-900/50 text-indigo-300'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-12 shrink-0 items-center border-b border-gray-800 px-4">
          <button
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? 'Navigatie sluiten' : 'Navigatie openen'}
            className="rounded p-1.5 text-gray-400 hover:bg-gray-800 hover:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

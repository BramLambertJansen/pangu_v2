import { Outlet } from 'react-router-dom'
import { CosmicBackground } from '@/components/ui/CosmicBackground'

export default function AuthLayout() {
  return (
    <div
      className="relative flex min-h-screen items-center justify-center px-4 py-16"
      style={{ background: 'var(--void)', color: 'var(--ink)' }}
    >
      <CosmicBackground />

      <div className="relative w-full" style={{ maxWidth: '420px', zIndex: 10 }}>
        {/* Logo */}
        <div className="mb-10 text-center">
          <svg
            width="40"
            height="40"
            viewBox="0 0 28 28"
            fill="none"
            aria-hidden="true"
            style={{ margin: '0 auto' }}
          >
            <circle cx="14" cy="14" r="12" stroke="#f5c842" strokeWidth="1" strokeOpacity="0.5" />
            <circle cx="14" cy="14" r="8" stroke="#9b8aff" strokeWidth="1.5" />
            <circle cx="14" cy="14" r="3" fill="#9b8aff" />
            <circle cx="14" cy="5" r="1.5" fill="#f5c842" />
            <circle cx="22" cy="18" r="1" fill="#9b8aff" opacity="0.7" />
          </svg>
          <p className="kicker" style={{ marginTop: 'var(--sp-3)' }}>PANGU</p>
          <p className="micro" style={{ marginTop: 'var(--sp-1)' }}>SANCTUM · II</p>
        </div>

        {/* Auth card */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--hairline)',
            borderRadius: 'var(--r-xl)',
            padding: 'var(--sp-8)',
          }}
        >
          <Outlet />
        </div>
      </div>
    </div>
  )
}

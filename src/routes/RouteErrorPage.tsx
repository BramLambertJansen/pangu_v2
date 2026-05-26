import { isRouteErrorResponse, useRouteError } from 'react-router-dom'

export function RouteErrorPage() {
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

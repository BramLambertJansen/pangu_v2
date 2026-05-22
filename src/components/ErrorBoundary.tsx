import { Component, type ErrorInfo, type ReactNode } from 'react'
import { CompassRose } from '@/components/world/CompassRose'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack)
  }

  private handleReset = () => {
    this.setState({ error: null })
    window.location.href = '/'
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div
        role="alert"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100dvh',
          padding: '2rem',
          textAlign: 'center',
          background: 'var(--void)',
          color: 'var(--ink)',
        }}
      >
        <CompassRose size={64} opacity={0.5} />
        <h1
          className="pangu-display-xl"
          style={{ marginTop: 24 }}
        >
          Er is iets misgegaan
        </h1>
        <p
          style={{
            marginTop: 12,
            fontSize: 14,
            color: 'var(--ink-soft)',
            maxWidth: 420,
          }}
        >
          Het Sanctum heeft een onverwachte fout tegengekomen. Je voortgang is
          bewaard. Keer terug naar het dashboard om verder te gaan.
        </p>
        <pre
          aria-label="Foutdetails"
          style={{
            marginTop: 20,
            padding: '12px 16px',
            background: 'var(--surface)',
            border: '1px solid var(--hairline)',
            borderRadius: 'var(--r-xl)',
            fontSize: 12,
            color: 'var(--muted)',
            maxWidth: 560,
            width: '100%',
            textAlign: 'left',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {error.message}
        </pre>
        <button
          type="button"
          className="pangu-btn pangu-btn-primary"
          style={{ marginTop: 28 }}
          onClick={this.handleReset}
        >
          Terug naar dashboard
        </button>
      </div>
    )
  }
}

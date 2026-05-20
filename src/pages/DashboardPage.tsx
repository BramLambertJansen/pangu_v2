function SectionDivider({ label }: { label: string }) {
  return (
    <div
      className="flex items-center"
      style={{ gap: 'var(--sp-4)', marginBottom: 'var(--sp-8)' }}
      aria-hidden="true"
    >
      <div style={{ flex: 1, height: '1px', background: 'var(--hairline)' }} />
      <span className="micro">{label}</span>
      <div style={{ flex: 1, height: '1px', background: 'var(--hairline)' }} />
    </div>
  )
}

function EmptyState({ icon, heading, body }: { icon: React.ReactNode; heading: string; body: string }) {
  return (
    <div
      className="flex flex-col items-center text-center"
      style={{
        padding: 'var(--sp-16) var(--sp-8)',
        background: 'var(--surface)',
        border: '1px dashed var(--hairline-strong)',
        borderRadius: 'var(--r-xl)',
        gap: 'var(--sp-4)',
      }}
    >
      <div style={{ color: 'var(--subtle)' }} aria-hidden="true">{icon}</div>
      <p className="title">{heading}</p>
      <p className="body" style={{ maxWidth: '300px' }}>{body}</p>
    </div>
  )
}

function GlobeIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

function BookIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  )
}

export default function DashboardPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-20)' }}>

      {/* ── Greeting ── */}
      <header>
        <div
          style={{ width: '36px', height: '2px', background: 'var(--gold)', borderRadius: 'var(--r-full)', marginBottom: 'var(--sp-5)' }}
          aria-hidden="true"
        />
        <p className="eyebrow" style={{ marginBottom: 'var(--sp-3)' }}>Welkom terug, Dungeon Master</p>
        <h1 className="display-lg" style={{ marginBottom: 'var(--sp-4)' }}>
          Waar gaan we naartoe?
        </h1>
        <p className="body-lg">Begin een nieuw avontuur of pak een lopende campaign op.</p>
      </header>

      {/* ── Worlds ── */}
      <section aria-labelledby="worlds-heading">
        <SectionDivider label="Jouw Werelden" />
        <div
          className="flex items-end justify-between flex-wrap"
          style={{ gap: 'var(--sp-4)', marginBottom: 'var(--sp-6)' }}
        >
          <div>
            <p className="eyebrow eyebrow-muted" style={{ marginBottom: 'var(--sp-2)' }}>Kies een wereld</p>
            <h2 id="worlds-heading" className="title">Alle werelden</h2>
          </div>
        </div>
        <EmptyState
          icon={<GlobeIcon />}
          heading="Geen werelden"
          body="Maak je eerste wereld aan om je campaigns in te starten."
        />
      </section>

      {/* ── Chronicles ── */}
      <section aria-labelledby="chronicles-heading">
        <SectionDivider label="Lopende Chronicles" />
        <div style={{ marginBottom: 'var(--sp-6)' }}>
          <p className="eyebrow eyebrow-muted" style={{ marginBottom: 'var(--sp-2)' }}>Of pak een campaign op</p>
          <h2 id="chronicles-heading" className="title">Alle campaigns</h2>
        </div>
        <EmptyState
          icon={<BookIcon />}
          heading="Geen campaigns"
          body="Campaigns verschijnen hier zodra je een wereld hebt aangemaakt."
        />
      </section>

    </div>
  )
}

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { UserTable } from '@/components/admin/UserTable'
import { CreateUserModal } from '@/components/admin/CreateUserModal'

export default function AdminPage() {
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <section aria-labelledby="admin-heading">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1
            id="admin-heading"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '22px',
              fontWeight: 600,
              letterSpacing: '0.1em',
              color: 'var(--ink)',
              margin: 0,
            }}
          >
            ACCOUNTBEHEER
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
            Overzicht en beheer van alle accounts
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          Nieuw account
        </Button>
      </div>

      <UserTable />

      <CreateUserModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </section>
  )
}

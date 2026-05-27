/**
 * Generic localStorage CRUD layer for DEV_MODE.
 * All data is stored per-user under the key `pangu-dev-db:<userId>`.
 */

const STORE_PREFIX = 'pangu-dev-db'

function getUserId(): string {
  try {
    const auth = JSON.parse(localStorage.getItem('auth') ?? '{}')
    const id = auth?.state?.user?.id as string | undefined
    if (!id) {
      console.error('[localDb] Could not resolve user ID from auth store; using "guest" namespace')
    }
    return id ?? 'guest'
  } catch {
    console.error('[localDb] Failed to parse auth store; using "guest" namespace')
    return 'guest'
  }
}

function storeKey(): string {
  return `${STORE_PREFIX}:${getUserId()}`
}

type Row = Record<string, unknown>
type LocalStore = Record<string, Row[]>

function readStore(): LocalStore {
  try {
    const raw = localStorage.getItem(storeKey())
    return raw ? (JSON.parse(raw) as LocalStore) : {}
  } catch {
    return {}
  }
}

function writeStore(store: LocalStore): void {
  localStorage.setItem(storeKey(), JSON.stringify(store))
}

export const localDb = {
  getAll(table: string): Row[] {
    return readStore()[table] ?? []
  },

  getById(table: string, id: string): Row | undefined {
    return (readStore()[table] ?? []).find((r) => r.id === id)
  },

  insert(table: string, data: Row): Row {
    const store = readStore()
    const now = new Date().toISOString()
    const row: Row = {
      committed: false,
      ...data,
      id: (data.id as string | undefined) ?? crypto.randomUUID(),
      created_at: (data.created_at as string | undefined) ?? now,
      updated_at: now,
    }
    store[table] = [...(store[table] ?? []), row]
    writeStore(store)
    return row
  },

  update(table: string, id: string, data: Row): Row {
    const store = readStore()
    const rows = store[table] ?? []
    const idx = rows.findIndex((r) => r.id === id)
    if (idx === -1) throw new Error(`[localDb] Row ${id} not found in ${table}`)
    const updated: Row = { ...rows[idx], ...data, updated_at: new Date().toISOString() }
    store[table] = [...rows.slice(0, idx), updated, ...rows.slice(idx + 1)]
    writeStore(store)
    return updated
  },

  delete(table: string, id: string): void {
    const store = readStore()
    store[table] = (store[table] ?? []).filter((r) => r.id !== id)
    writeStore(store)
  },

  /** Delete all rows matching a predicate — used for bulk deletes (e.g. encounter_monsters). */
  deleteWhere(table: string, predicate: (row: Row) => boolean): void {
    const store = readStore()
    store[table] = (store[table] ?? []).filter((r) => !predicate(r))
    writeStore(store)
  },

  /** Wipe all local dev data for all users. Called on startup when DEV_MODE=false. */
  clearAll(): void {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(STORE_PREFIX))
      .forEach((k) => localStorage.removeItem(k))
  },
}

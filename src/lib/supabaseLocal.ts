/**
 * Supabase-compatible local adapter for DEV_MODE.
 *
 * Intercepts `supabase.from(table)` calls and routes them to localStorage via
 * localDb instead of the real Supabase database. Auth and storage pass through
 * to the real Supabase client unchanged.
 *
 * Supported query patterns (all variants found in this codebase):
 *   .select('*').eq().order().limit()
 *   .select('*').eq().single() / .maybeSingle()
 *   .select('*, table(cols)').eq().single()          — join resolution (shorthand)
 *   .select('*, alias:table(cols)').eq().single()   — join resolution (explicit alias)
 *   .select('*').eq().eq()                          — multiple eq filters
 *   .select('*').in(field, vals)                    — IN filter
 *   .not(field, 'is', null)                         — NOT NULL filter
 *   .insert({}).select().single()                   — insert + return
 *   .insert([])                                     — bulk insert
 *   .update({}).eq('id', id)
 *   .delete().eq('id', id)
 *   .delete().eq('other_field', val)                — bulk delete by field
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { localDb } from '@/lib/localDb'

type Row = Record<string, unknown>
type QueryResult = { data: unknown; error: unknown }

type Filter =
  | { type: 'eq'; field: string; value: unknown }
  | { type: 'neq'; field: string; value: unknown }
  | { type: 'in'; field: string; values: unknown[] }
  | { type: 'not-is-null'; field: string }
  | { type: 'is-null'; field: string }

type Operation = 'select' | 'insert' | 'update' | 'delete'

class LocalQueryBuilder {
  private _table: string
  private _op: Operation = 'select'
  private _selectCols = '*'
  private _filters: Filter[] = []
  private _order: Array<{ column: string; ascending: boolean }> = []
  private _limitN?: number
  private _singleMode: 'none' | 'single' | 'maybeSingle' = 'none'
  private _payload?: unknown
  private _returnData = false

  constructor(table: string) {
    this._table = table
  }

  // ── Query builder methods ────────────────────────────────────────────────

  select(columns = '*'): this {
    if (this._op === 'insert' || this._op === 'update') {
      // Called after insert/update to request the inserted/updated row back
      this._returnData = true
    } else {
      this._op = 'select'
      this._selectCols = columns
    }
    return this
  }

  eq(field: string, value: unknown): this {
    this._filters.push({ type: 'eq', field, value })
    return this
  }

  neq(field: string, value: unknown): this {
    this._filters.push({ type: 'neq', field, value })
    return this
  }

  in(field: string, values: unknown[]): this {
    this._filters.push({ type: 'in', field, values })
    return this
  }

  /** Only `.not(field, 'is', null)` is used in this codebase (NOT NULL check). */
  not(field: string, _operator: string, _value: unknown): this {
    this._filters.push({ type: 'not-is-null', field })
    return this
  }

  is(field: string, value: null): this {
    void value
    this._filters.push({ type: 'is-null', field })
    return this
  }

  order(column: string, options?: { ascending?: boolean }): this {
    this._order.push({ column, ascending: options?.ascending ?? true })
    return this
  }

  limit(n: number): this {
    this._limitN = n
    return this
  }

  insert(payload: unknown): this {
    this._op = 'insert'
    this._payload = payload
    return this
  }

  update(payload: Row): this {
    this._op = 'update'
    this._payload = payload
    return this
  }

  delete(): this {
    this._op = 'delete'
    return this
  }

  // ── Terminal methods ─────────────────────────────────────────────────────

  single(): Promise<QueryResult> {
    this._singleMode = 'single'
    return this._run()
  }

  maybeSingle(): Promise<QueryResult> {
    this._singleMode = 'maybeSingle'
    return this._run()
  }

  /** Makes the builder thenable so `await builder` works without `.single()`. */
  then(
    resolve: (value: QueryResult) => void,
    reject: (reason: unknown) => void,
  ): Promise<void> {
    return this._run().then(resolve, reject)
  }

  // ── Internal execution ───────────────────────────────────────────────────

  private _applyFilters(rows: Row[]): Row[] {
    return rows.filter((row) =>
      this._filters.every((f) => {
        switch (f.type) {
          case 'eq':
            return row[f.field] === f.value
          case 'neq':
            return row[f.field] !== f.value
          case 'in':
            return f.values.includes(row[f.field])
          case 'not-is-null':
            return row[f.field] !== null && row[f.field] !== undefined
          case 'is-null':
            return row[f.field] === null || row[f.field] === undefined
        }
      }),
    )
  }

  private _applyOrder(rows: Row[]): Row[] {
    if (this._order.length === 0) return rows
    return [...rows].sort((a, b) => {
      for (const { column, ascending } of this._order) {
        const av = a[column] ?? ''
        const bv = b[column] ?? ''
        let cmp: number
        if (typeof av === 'number' && typeof bv === 'number') {
          cmp = av - bv
        } else {
          const as = String(av)
          const bs = String(bv)
          cmp = as < bs ? -1 : as > bs ? 1 : 0
        }
        if (cmp !== 0) return ascending ? cmp : -cmp
      }
      return 0
    })
  }

  /**
   * Resolves join specs in the select column string.
   * Supports two formats:
   *   `alias:table(col1, col2)` — explicit alias; FK field = `${alias}_id`
   *   `table(col1, col2)`       — shorthand (PostgREST default); FK field =
   *                               `${singularized-table}_id` (e.g. worlds → world_id)
   */
  private _resolveJoins(row: Row): Row {
    const result: Row = { ...row }
    // Match optional `alias:` prefix followed by `table(colSpec)`
    const joinRe = /(?:(\w+):)?(\w+)\(([^)]+)\)/g
    let m: RegExpExecArray | null
    while ((m = joinRe.exec(this._selectCols)) !== null) {
      const [, alias, joinTable, colSpec] = m
      // When no alias: key in result = table name; FK = singular table name + '_id'
      const resultKey = alias ?? joinTable
      const fkField = alias
        ? `${alias}_id`
        : `${joinTable.replace(/s$/, '')}_id`
      const fkValue = row[fkField] as string | undefined
      if (fkValue) {
        const joinedRow = localDb.getById(joinTable, fkValue) as Row | undefined
        if (joinedRow) {
          if (colSpec.trim() === '*') {
            result[resultKey] = joinedRow
          } else {
            const cols = colSpec.split(',').map((c) => c.trim())
            result[resultKey] = Object.fromEntries(cols.map((c) => [c, joinedRow[c]]))
          }
        } else {
          result[resultKey] = null
        }
      } else {
        result[resultKey] = null
      }
    }
    return result
  }

  private async _run(): Promise<QueryResult> {
    try {
      if (this._op === 'select') {
        let rows = localDb.getAll(this._table) as Row[]
        rows = this._applyFilters(rows)
        rows = this._applyOrder(rows)
        if (this._limitN !== undefined) rows = rows.slice(0, this._limitN)

        // Detect both `alias:table(cols)` and plain `table(cols)` join patterns
        const hasJoins = /\w+\(/.test(this._selectCols)
        const result = hasJoins ? rows.map((r) => this._resolveJoins(r)) : rows

        if (this._singleMode === 'single') {
          if (result.length === 0)
            return { data: null, error: { code: 'PGRST116', message: 'No rows found' } }
          return { data: result[0], error: null }
        }
        if (this._singleMode === 'maybeSingle') {
          return { data: result[0] ?? null, error: null }
        }
        return { data: result, error: null }
      }

      if (this._op === 'insert') {
        const items = Array.isArray(this._payload)
          ? (this._payload as Row[])
          : [this._payload as Row]
        const inserted = items.map((item) => localDb.insert(this._table, item))

        if (!this._returnData) return { data: null, error: null }
        if (this._singleMode === 'single') return { data: inserted[0], error: null }
        return { data: inserted, error: null }
      }

      if (this._op === 'update') {
        const idFilter = this._filters.find((f) => f.type === 'eq' && f.field === 'id')
        if (!idFilter || idFilter.type !== 'eq') {
          throw new Error('[localDb] update() requires .eq("id", value)')
        }
        const updated = localDb.update(this._table, idFilter.value as string, this._payload as Row)
        if (this._returnData) return { data: updated, error: null }
        return { data: null, error: null }
      }

      if (this._op === 'delete') {
        const idFilter = this._filters.find((f) => f.type === 'eq' && f.field === 'id')
        if (idFilter && idFilter.type === 'eq') {
          localDb.delete(this._table, idFilter.value as string)
        } else {
          // Bulk delete: remove all rows matching the filters
          localDb.deleteWhere(this._table, (row) => this._applyFilters([row]).length > 0)
        }
        return { data: null, error: null }
      }

      return { data: null, error: null }
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? { message: err.message } : err,
      }
    }
  }
}

/**
 * Wraps a real Supabase client so that `.from()` table operations go to
 * localStorage while `.auth` and `.storage` remain on the real client.
 */
export function createLocalSupabaseAdapter(
  realClient: SupabaseClient<Database>,
): SupabaseClient<Database> {
  const adapter = {
    from: (table: string) => new LocalQueryBuilder(table),
    auth: realClient.auth,
    storage: realClient.storage,
    channel: realClient.channel.bind(realClient),
    removeChannel: realClient.removeChannel.bind(realClient),
    removeAllChannels: realClient.removeAllChannels.bind(realClient),
    getChannels: realClient.getChannels.bind(realClient),
    rpc: realClient.rpc.bind(realClient),
    schema: realClient.schema.bind(realClient),
    realtime: realClient.realtime,
  }
  // Type-cast: the adapter covers all code paths used in this codebase.
  return adapter as unknown as SupabaseClient<Database>
}

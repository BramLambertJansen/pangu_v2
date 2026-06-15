#!/usr/bin/env node
/**
 * Documentation-drift guard — keeps CLAUDE.md honest about the code.
 *
 * Fails (exit 1) when a code artifact is not referenced in CLAUDE.md:
 *   - every supabase/migrations/*.sql file is named in the migrations table
 *   - every src/components/ui/*.tsx primitive is mentioned (design-system registry)
 *
 * This is the automated backbone of the "GATE docs" rule. It checks references,
 * not counts, so it has no false positives from prose drift.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const doc = readFileSync(join(ROOT, 'CLAUDE.md'), 'utf8')

const missing = []

const migrations = readdirSync(join(ROOT, 'supabase', 'migrations')).filter((f) => f.endsWith('.sql'))
for (const f of migrations) {
  if (!doc.includes(f)) missing.push(`migration not documented in CLAUDE.md: ${f}`)
}

const primitives = readdirSync(join(ROOT, 'src', 'components', 'ui'))
  .filter((f) => f.endsWith('.tsx'))
  .map((f) => f.replace(/\.tsx$/, ''))
for (const name of primitives) {
  if (!new RegExp(`\\b${name}\\b`).test(doc)) missing.push(`ui primitive not documented in CLAUDE.md: ${name}`)
}

console.log(`check:docs — scanned ${migrations.length} migrations, ${primitives.length} ui primitives`)
if (missing.length) {
  console.error(`\n✗ ${missing.length} documentation gap(s):`)
  for (const m of missing) console.error(`  ${m}`)
  console.error(`\nUpdate CLAUDE.md (migrations table / UI section) in the same commit.`)
  process.exit(1)
}
console.log('✓ CLAUDE.md is in sync with migrations and design-system primitives')

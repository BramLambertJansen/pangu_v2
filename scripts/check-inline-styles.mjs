#!/usr/bin/env node
/**
 * Theming guardrail — keeps the component layer token-driven.
 *
 * Scans src/ for the patterns that block a clean theme switch:
 *   - literal hex colors           (#rrggbb)        → use tokens
 *   - literal colored rgb()/rgba() (rgb(155,...))   → use rgb(var(--x-rgb) / a)
 *   - color-mix()                  (second strategy) → use channel tokens
 *   - legacy .pangu-* classes      (className)       → use canonical classes
 * Plus one WARN rule (never blocks): raw-px borderRadius (sweep target → var(--r-*)).
 *
 * Allowed (per docs/design-system/03 contract): rgba(0,0,0,…) shadows and
 * rgba(255,255,255,…) sheens are theme-independent; coin/rarity data colors are
 * meaning-driven and stay literal.
 *
 * Usage:  node scripts/check-inline-styles.mjs [--strict]
 *   default  report only, exit 0   (warn phase)
 *   --strict exit 1 on any blocking violation (flip on after the sweep)
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const SRC = join(ROOT, 'src')
const STRICT = process.argv.includes('--strict')

/** Literal hex colors that are meaning-driven data, not theme skin. */
const ALLOWED_HEX = new Set(['#e5e7eb', '#c0a060', '#b87333'])

/** `pangu-*` tokens that are storage-key / app-state namespaces, not style aliases. */
const KEEP_PANGU = new Set(['pangu-dev-mode', 'pangu-dev-db', 'pangu-wizard'])

/** rgb/rgba triplets that are theme-independent (neutral shadow / sheen). */
function isNeutralRgb(inner) {
  const head = inner.replace(/\s+/g, '').split(',').slice(0, 3).join(',')
  return head === '0,0,0' || head === '255,255,255'
}

const files = []
;(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const s = statSync(p)
    if (s.isDirectory()) walk(p)
    else if (['.tsx', '.ts'].includes(extname(p)) && !p.endsWith('.d.ts')) files.push(p)
  }
})(SRC)

const blocking = { 'literal-hex': [], 'literal-rgb': [], 'color-mix': [], 'pangu-class': [] }
const warns = { 'raw-radius': [] }

const HEX_RE = /#[0-9a-fA-F]{3,8}\b/g
const RGB_RE = /rgba?\(([^)]*)\)/g
const PANGU_RE = /\bpangu-[a-z0-9-]+/g
const RADIUS_RE = /borderRadius:\s*['"]?\d/

for (const file of files) {
  const rel = file.slice(ROOT.length + 1)
  const lines = readFileSync(file, 'utf8').split('\n')
  lines.forEach((line, i) => {
    const where = `${rel}:${i + 1}`

    for (const m of line.matchAll(HEX_RE)) {
      if (!ALLOWED_HEX.has(m[0].toLowerCase())) blocking['literal-hex'].push(`${where}  ${m[0]}`)
    }
    for (const m of line.matchAll(RGB_RE)) {
      const inner = m[1]
      if (inner.includes('var(')) continue
      if (isNeutralRgb(inner)) continue
      if (/[0-9]/.test(inner.trim()[0] ?? '')) blocking['literal-rgb'].push(`${where}  ${m[0]}`)
    }
    if (line.includes('color-mix(')) blocking['color-mix'].push(where)
    for (const m of line.matchAll(PANGU_RE)) {
      if (KEEP_PANGU.has(m[0])) continue // storage-key / app-state namespaces, not style aliases
      blocking['pangu-class'].push(`${where}  ${m[0]}`)
    }
    if (RADIUS_RE.test(line)) warns['raw-radius'].push(where)
  })
}

function report(group, label) {
  const total = Object.values(group).reduce((n, arr) => n + arr.length, 0)
  console.log(`\n${label}: ${total}`)
  for (const [rule, arr] of Object.entries(group)) {
    if (!arr.length) continue
    console.log(`  ${rule}: ${arr.length}`)
    for (const hit of arr.slice(0, 8)) console.log(`    ${hit}`)
    if (arr.length > 8) console.log(`    … +${arr.length - 8} more`)
  }
  return total
}

console.log(`Theming guardrail — scanned ${files.length} files in src/`)
const blockingTotal = report(blocking, 'BLOCKING (theme-skin literals)')
report(warns, 'WARN (sweep targets, non-blocking)')

if (STRICT && blockingTotal > 0) {
  console.error(`\n✗ ${blockingTotal} blocking violation(s). Use tokens / canonical classes.`)
  process.exit(1)
}
console.log(`\n${blockingTotal === 0 ? '✓ no blocking violations' : `(warn mode) ${blockingTotal} blocking violation(s) — pass --strict to enforce`}`)

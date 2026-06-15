export function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null
  // Parse YYYY-MM-DD as local calendar date to avoid UTC-midnight timezone shift
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (m) {
    const d = new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]))
    return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
  }
  return new Intl.DateTimeFormat('nl-NL', { dateStyle: 'medium' }).format(new Date(dateStr))
}

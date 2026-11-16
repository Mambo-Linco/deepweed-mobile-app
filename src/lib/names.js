// Model labels look like "Blackjack (Bidens pilosa  Tsine)" or just "Chaarendo".
export function parseSpecies(raw = '') {
  const open = raw.indexOf('(')
  if (open === -1) return { common: raw.trim(), detail: '', local: '', raw }
  const base = raw.slice(0, open).trim()
  const close = raw.lastIndexOf(')')
  const inner = raw.slice(open + 1, close === -1 ? undefined : close)
  const tail = close === -1 ? '' : raw.slice(close + 1).trim()
  const parts = inner.split(/\s{2,}/).map((s) => s.trim()).filter(Boolean)
  const local = parts.length > 1 ? parts[parts.length - 1] : tail
  const detail = parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0] || ''
  const latinFirst = /^[A-Z][a-z]+ [a-z]+/.test(base)
  return { common: latinFirst && detail ? detail : base, detail: latinFirst && detail ? base : detail, local, raw }
}
export const displayName = (raw) => parseSpecies(raw).common

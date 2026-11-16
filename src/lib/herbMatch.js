// Same name-matching rules as backend/src/services/herbicideMatch.ts, so offline results match online ones.
export function searchTerms(className) {
  const terms = new Set()
  const open = className.indexOf('(')
  const base = (open === -1 ? className : className.slice(0, open)).trim()
  const inner = open === -1 ? '' : className.slice(open + 1).replace(/\)[^)]*$/, '')

  if (base) terms.add(base)
  for (const part of inner.split(/\s{2,}/)) {
    const t = part.replace(/\bspp\.?/i, '').trim()
    if (t) terms.add(t)
  }
  const words = base.split(/\s+/)
  if (/^[A-Z][a-z]+$/.test(words[0]) && words.length >= 2 && /^[a-z]+$/.test(words[1])) terms.add(`${words[0]} ${words[1]}`)
  return [...terms].map((t) => t.toLowerCase()).filter((t) => t.length >= 5)
}

export function matchHerbicides(className, list) {
  const terms = searchTerms(className)
  if (!terms.length || !list?.length) return []
  return list
    .filter((h) => {
      const w = (h.weed_name || '').toLowerCase()
      return terms.some((t) => w.includes(t))
    })
    .sort((a, b) => a.weed_name.localeCompare(b.weed_name) || a.herbicide_name.localeCompare(b.herbicide_name))
}

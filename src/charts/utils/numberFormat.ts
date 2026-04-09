/**
 * Compact axis label formatter: 1,500 → "1.5K", 2,400,000 → "2.4M", etc.
 */
export function compactNumber(v: number): string {
  if (v >= 1e12) return `${+( v / 1e12).toFixed(1)}T`
  if (v >= 1e9)  return `${+( v / 1e9 ).toFixed(1)}B`
  if (v >= 1e6)  return `${+( v / 1e6 ).toFixed(1)}M`
  if (v >= 1e3)  return `${+( v / 1e3 ).toFixed(1)}K`
  return String(v)
}

/**
 * Rounds a raw data max up to a clean tick boundary with ~10% headroom.
 * e.g. 24,090 → 30,000 | 1,234,567 → 2,000,000
 */
export function niceMax(value: number): number {
  if (value <= 0) return 10
  const withBuffer = value * 1.1
  const magnitude  = Math.pow(10, Math.floor(Math.log10(withBuffer)))
  return Math.ceil(withBuffer / magnitude) * magnitude
}

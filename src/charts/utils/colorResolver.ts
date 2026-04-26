import type { ChartConfig, ElementOverride } from '@/types/chart.types'
import type { DataRow } from '@/types/data.types'
import type { Theme } from '@/types/theme.types'

export function resolveItemColor(
  i: number,
  row: DataRow,
  config: ChartConfig,
  theme: Theme,
): string {
  const colorMode = config.colorMode as string
  const colorField = config.colorField as string
  const colorMap = config.colorMap as Record<string, string>
  if ((colorMode === 'byCategory' || colorMode === 'customMap') && colorField) {
    const val = String(row[colorField] ?? '')
    if (colorMode === 'customMap') return colorMap[val] ?? theme.colors[i % theme.colors.length]
    return theme.colors[i % theme.colors.length]
  }
  return theme.colors[0]
}

export function getOverrideForItem(
  overrides: Record<string, Record<string, unknown>>,
  seriesIdx: number,
  dataIdx: number,
): ElementOverride {
  return (overrides[`${seriesIdx}:${dataIdx}`] ?? {}) as ElementOverride
}

// Returns the override color if ALL items in the series share the same one; otherwise the fallback.
// Used to keep the legend marker in sync when the user applies "todos" via the inspector.
export function getEffectiveSeriesColor(
  seriesIdx: number,
  dataCount: number,
  overrides: Record<string, Record<string, unknown>>,
  fallback: string,
): string {
  if (dataCount === 0) return fallback
  let first: string | undefined
  for (let i = 0; i < dataCount; i++) {
    const c = overrides[`${seriesIdx}:${i}`]?.color as string | undefined
    if (!c) return fallback
    if (!first) first = c
    else if (c !== first) return fallback
  }
  return first ?? fallback
}

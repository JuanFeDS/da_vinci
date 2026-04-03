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

import type { ChartConfig } from '@/types/chart.types'
import type { Theme } from '@/types/theme.types'

export interface ExportedConfig {
  chartId: string
  config: ChartConfig
  theme: Theme
  exportedAt: string
}

export function exportConfigAsJSON(chartId: string, config: ChartConfig, theme: Theme): void {
  const payload: ExportedConfig = { chartId, config, theme, exportedAt: new Date().toISOString() }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `davinci-config-${chartId}-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

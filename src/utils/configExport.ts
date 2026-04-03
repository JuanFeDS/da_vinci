import type { ChartConfig } from '@/types/chart.types'
import type { Theme } from '@/types/theme.types'

export interface ExportedConfig {
  chartId: string
  config: ChartConfig
  theme: Theme
  exportedAt: string
}

export function exportConfigAsJSON(chartId: string, config: ChartConfig, theme: Theme): void {
  const exportData = {
    chartId,
    config: {
      ...config,
      colorMode: config.colorMode,
      colorField: config.colorField,
      colorMap: config.colorMap,
      elementOverrides: config.elementOverrides,
    },
    theme: {
      id: theme.id,
      name: theme.name,
      colors: theme.colors,
    },
    exportedAt: new Date().toISOString(),
  }

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `davinci-${chartId}-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

import { useState, useCallback } from 'react'
import type { ChartConfig, ChartPlugin } from '@/types/chart.types'
import type { ProcessedData } from '@/types/data.types'

function autoAssignAxes(plugin: ChartPlugin, data: ProcessedData): Partial<ChartConfig> {
  const { numeric_columns, categorical_columns, columns } = data
  const overrides: Partial<ChartConfig> = {}

  if (plugin.id === 'pie') {
    overrides.xAxis = categorical_columns[0] ?? columns[0] ?? ''
    overrides.yAxis = numeric_columns[0] ?? columns[1] ?? ''
  } else if (plugin.id === 'scatter') {
    overrides.xAxis = numeric_columns[0] ?? columns[0] ?? ''
    overrides.yAxis = numeric_columns[1] ?? numeric_columns[0] ?? columns[1] ?? ''
  } else {
    overrides.xAxis = categorical_columns[0] ?? columns[0] ?? ''
    overrides.yAxis = numeric_columns[0] ?? columns[1] ?? ''
  }

  return overrides
}

export function useChartConfig() {
  const [plugin, setPlugin] = useState<ChartPlugin | null>(null)
  const [config, setConfig] = useState<ChartConfig>({} as ChartConfig)
  const [data, setData] = useState<ProcessedData | null>(null)

  const selectPlugin = useCallback((p: ChartPlugin, currentData: ProcessedData | null) => {
    const base = { ...p.defaultConfig }
    if (currentData) {
      Object.assign(base, autoAssignAxes(p, currentData))
    }
    setPlugin(p)
    setConfig(base)
  }, [])

  const updateConfig = useCallback((key: string, value: unknown) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }, [])

  const updateData = useCallback((newData: ProcessedData) => {
    setData(newData)
    if (plugin) {
      setConfig((prev) => ({ ...prev, ...autoAssignAxes(plugin, newData) }))
    }
  }, [plugin])

  const resetConfig = useCallback(() => {
    if (plugin) {
      const base = { ...plugin.defaultConfig }
      if (data) Object.assign(base, autoAssignAxes(plugin, data))
      setConfig(base)
    }
  }, [plugin, data])

  return { plugin, config, data, selectPlugin, updateConfig, updateData, resetConfig, setData }
}

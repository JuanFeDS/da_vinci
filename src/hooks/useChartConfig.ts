import { useState, useCallback, useEffect } from 'react'
import type { ChartConfig, ChartPlugin } from '@/types/chart.types'
import type { ProcessedData } from '@/types/data.types'
import { getChartById } from '@/charts/registry'
import { idbGet, idbSet, idbDelete } from '@/utils/db'

const LS = {
  pluginId: 'dvinci:pluginId',
  config: 'dvinci:config',
}

const IDB_DATA_KEY = 'dvinci:data'

function lsLoad<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function lsSave(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch { /* ignorar */ }
}

const PIE_IDS = ['pie', 'donut', 'treemap']
const SCATTER_IDS = ['scatter', 'bubble']
const MULTI_SERIES_IDS = ['grouped-bar', 'stacked-bar']

function autoAssignAxes(plugin: ChartPlugin, data: ProcessedData): Partial<ChartConfig> {
  const { numeric_columns, categorical_columns, columns } = data
  const overrides: Partial<ChartConfig> = { numericColumns: numeric_columns }

  if (PIE_IDS.includes(plugin.id)) {
    overrides.xAxis = categorical_columns[0] ?? columns[0] ?? ''
    overrides.yAxis = numeric_columns[0] ?? columns[1] ?? ''
  } else if (SCATTER_IDS.includes(plugin.id)) {
    overrides.xAxis = numeric_columns[0] ?? columns[0] ?? ''
    overrides.yAxis = numeric_columns[1] ?? numeric_columns[0] ?? columns[1] ?? ''
  } else if (plugin.id === 'histogram') {
    overrides.xAxis = numeric_columns[0] ?? columns[0] ?? ''
    overrides.yAxis = '_auto_'
  } else if (plugin.id === 'heatmap') {
    overrides.xAxis = categorical_columns[0] ?? columns[0] ?? ''
    overrides.yAxis = categorical_columns[1] ?? columns[1] ?? ''
  } else if (MULTI_SERIES_IDS.includes(plugin.id)) {
    overrides.xAxis = categorical_columns[0] ?? columns[0] ?? ''
    overrides.yAxis = numeric_columns[0] ?? columns[1] ?? ''
  } else {
    overrides.xAxis = categorical_columns[0] ?? columns[0] ?? ''
    overrides.yAxis = numeric_columns[0] ?? columns[1] ?? ''
  }

  return overrides
}

export function useChartConfig() {
  const [plugin, setPlugin] = useState<ChartPlugin | null>(() => {
    const id = localStorage.getItem(LS.pluginId)
    return id ? (getChartById(id) ?? null) : null
  })
  const [config, setConfig] = useState<ChartConfig>(() => lsLoad<ChartConfig>(LS.config) ?? ({} as ChartConfig))
  const [data, setData] = useState<ProcessedData | null>(null)

  // Restaurar dataset desde IndexedDB al montar
  useEffect(() => {
    idbGet<ProcessedData>(IDB_DATA_KEY).then((saved) => {
      if (saved) setData(saved)
    })
  }, [])

  // Persistir plugin
  useEffect(() => {
    if (plugin) lsSave(LS.pluginId, plugin.id)
    else localStorage.removeItem(LS.pluginId)
  }, [plugin])

  // Persistir config
  useEffect(() => {
    if (Object.keys(config).length > 0) lsSave(LS.config, config)
  }, [config])

  // Persistir data en IndexedDB (soporta datasets grandes)
  useEffect(() => {
    if (data) idbSet(IDB_DATA_KEY, data)
    else idbDelete(IDB_DATA_KEY)
  }, [data])

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

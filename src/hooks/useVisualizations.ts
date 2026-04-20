import { useState, useCallback, useEffect, useRef } from 'react'
import type { ChartPlugin, ChartConfig } from '@/types/chart.types'
import type { ProcessedData } from '@/types/data.types'
import type { Visualization, SaveStatus } from '@/types/visualization.types'
import { getChartById } from '@/charts/registry'
import { idbGet, idbDelete } from '@/utils/db'
import {
  createVisualization,
  saveVisualization,
  listVisualizations,
  deleteVisualization as deleteVizFromDB,
} from '@/utils/visualizationStore'
import { getActiveThemeId } from '@/utils/themeStorage'

const LS_OPEN_TABS  = 'dvinci:openTabIds'
const LS_ACTIVE_TAB = 'dvinci:activeTabId'
const LS_PLUGIN     = 'dvinci:pluginId'
const LS_CONFIG     = 'dvinci:config'
const IDB_DATA      = 'dvinci:data'

const PIE_IDS         = ['pie', 'donut', 'treemap']
const SCATTER_IDS     = ['scatter', 'bubble']
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

export function useVisualizations() {
  const [tabs, setTabs]               = useState<Visualization[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [saveStatuses, setSaveStatuses] = useState<Record<string, SaveStatus>>({})
  const [allViz, setAllViz]           = useState<Visualization[]>([])
  const [initialized, setInitialized] = useState(false)

  const tabsRef       = useRef(tabs)
  const allVizRef     = useRef(allViz)
  const saveTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  useEffect(() => { tabsRef.current = tabs }, [tabs])
  useEffect(() => { allVizRef.current = allViz }, [allViz])

  // ── Persist open tab list ─────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem(LS_OPEN_TABS, JSON.stringify(tabs.map(t => t.id)))
  }, [tabs])

  useEffect(() => {
    if (activeTabId) localStorage.setItem(LS_ACTIVE_TAB, activeTabId)
    else localStorage.removeItem(LS_ACTIVE_TAB)
  }, [activeTabId])

  // ── Auto-save (debounced 1s) ──────────────────────────────────────────────
  const scheduleSave = useCallback((id: string) => {
    setSaveStatuses(prev => ({ ...prev, [id]: 'unsaved' }))
    if (saveTimersRef.current[id]) clearTimeout(saveTimersRef.current[id])
    saveTimersRef.current[id] = setTimeout(async () => {
      setSaveStatuses(prev => ({ ...prev, [id]: 'saving' }))
      const viz = tabsRef.current.find(t => t.id === id)
      if (viz) {
        await saveVisualization(viz)
        setAllViz(prev => {
          const idx = prev.findIndex(v => v.id === id)
          const next = idx >= 0
            ? prev.map((v, i) => i === idx ? viz : v)
            : [viz, ...prev]
          return next.sort((a, b) => b.updatedAt - a.updatedAt)
        })
        setSaveStatuses(prev => ({ ...prev, [id]: 'saved' }))
      }
    }, 1000)
  }, [])

  // ── Initialization + migration ────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const all = await listVisualizations()
      setAllViz(all)

      // Restore previously open tabs
      let openIds: string[] = []
      try { openIds = JSON.parse(localStorage.getItem(LS_OPEN_TABS) ?? '[]') } catch { /* */ }
      const savedActiveId = localStorage.getItem(LS_ACTIVE_TAB)

      if (openIds.length > 0) {
        const openVizs = openIds.map(id => all.find(v => v.id === id)).filter(Boolean) as Visualization[]
        if (openVizs.length > 0) {
          setTabs(openVizs)
          setActiveTabId(
            savedActiveId && openVizs.some(v => v.id === savedActiveId)
              ? savedActiveId
              : openVizs[0].id,
          )
          setSaveStatuses(Object.fromEntries(openVizs.map(v => [v.id, 'saved' as SaveStatus])))
          setInitialized(true)
          return
        }
      }

      // Migrate from old single-visualization localStorage/IDB system
      const oldPluginId = localStorage.getItem(LS_PLUGIN)
      const oldConfig = (() => {
        try { return JSON.parse(localStorage.getItem(LS_CONFIG) ?? 'null') } catch { return null }
      })()
      const oldData = await idbGet<ProcessedData>(IDB_DATA)

      if (oldPluginId || oldData) {
        const migrated = createVisualization('Mi primera visualización', {
          pluginId: oldPluginId ?? null,
          config: oldConfig ?? ({} as ChartConfig),
          data: oldData,
          themeId: getActiveThemeId(),
        })
        await saveVisualization(migrated)
        setAllViz([migrated])
        setTabs([migrated])
        setActiveTabId(migrated.id)
        setSaveStatuses({ [migrated.id]: 'saved' })
        localStorage.removeItem(LS_PLUGIN)
        localStorage.removeItem(LS_CONFIG)
        await idbDelete(IDB_DATA)
      }

      setInitialized(true)
    }
    init()
  }, [])

  // ── Derived active-tab state ──────────────────────────────────────────────
  const activeTab = tabs.find(t => t.id === activeTabId) ?? null
  const plugin    = activeTab?.pluginId ? (getChartById(activeTab.pluginId) ?? null) : null
  const config    = (activeTab?.config ?? {}) as ChartConfig
  const data      = activeTab?.data ?? null
  const themeId   = activeTab?.themeId ?? getActiveThemeId()

  // ── Config mutations ──────────────────────────────────────────────────────
  const selectPlugin = useCallback((p: ChartPlugin) => {
    setTabs(prev => prev.map(t => {
      if (t.id !== activeTabId) return t
      if (t.pluginId === p.id) return t          // no-op: same plugin
      const base = { ...p.defaultConfig }
      if (t.data) Object.assign(base, autoAssignAxes(p, t.data))
      return { ...t, pluginId: p.id, config: base, updatedAt: Date.now() }
    }))
    if (activeTabId) scheduleSave(activeTabId)
  }, [activeTabId, scheduleSave])

  const updateConfig = useCallback((key: string, value: unknown) => {
    setTabs(prev => prev.map(t =>
      t.id === activeTabId
        ? { ...t, config: { ...t.config, [key]: value }, updatedAt: Date.now() }
        : t,
    ))
    if (activeTabId) scheduleSave(activeTabId)
  }, [activeTabId, scheduleSave])

  const updateData = useCallback((newData: ProcessedData) => {
    setTabs(prev => prev.map(t => {
      if (t.id !== activeTabId) return t
      const p = t.pluginId ? getChartById(t.pluginId) : null
      const axisUpdates = p ? autoAssignAxes(p, newData) : {}
      return { ...t, data: newData, config: { ...t.config, ...axisUpdates }, updatedAt: Date.now() }
    }))
    if (activeTabId) scheduleSave(activeTabId)
  }, [activeTabId, scheduleSave])

  const resetConfig = useCallback(() => {
    if (!activeTabId || !plugin) return
    setTabs(prev => prev.map(t => {
      if (t.id !== activeTabId) return t
      const base = { ...plugin.defaultConfig }
      if (t.data) Object.assign(base, autoAssignAxes(plugin, t.data))
      return { ...t, config: base, updatedAt: Date.now() }
    }))
    scheduleSave(activeTabId)
  }, [activeTabId, plugin, scheduleSave])

  const updateTheme = useCallback((newThemeId: string) => {
    setTabs(prev => prev.map(t =>
      t.id === activeTabId ? { ...t, themeId: newThemeId, updatedAt: Date.now() } : t,
    ))
    if (activeTabId) scheduleSave(activeTabId)
  }, [activeTabId, scheduleSave])

  // ── Tab operations ────────────────────────────────────────────────────────
  const newTab = useCallback(() => {
    const name = `Visualización ${allViz.length + 1}`
    const viz = createVisualization(name, { themeId: getActiveThemeId() })
    setTabs(prev => [...prev, viz])
    setActiveTabId(viz.id)
    setAllViz(prev => [viz, ...prev])
    setSaveStatuses(prev => ({ ...prev, [viz.id]: 'unsaved' }))
    scheduleSave(viz.id)
  }, [allViz.length, scheduleSave])

  const closeTab = useCallback((id: string) => {
    setTabs(prev => {
      const next = prev.filter(t => t.id !== id)
      setActiveTabId(cur => {
        if (cur !== id) return cur
        const idx = prev.findIndex(t => t.id === id)
        return next[Math.min(idx, next.length - 1)]?.id ?? null
      })
      return next
    })
    setSaveStatuses(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    if (saveTimersRef.current[id]) {
      clearTimeout(saveTimersRef.current[id])
      delete saveTimersRef.current[id]
    }
  }, [])

  const switchTab = useCallback((id: string) => setActiveTabId(id), [])

  const duplicateTab = useCallback((id: string) => {
    const src = tabsRef.current.find(t => t.id === id)
    if (!src) return
    const dup = createVisualization(`${src.name} (copia)`, {
      pluginId: src.pluginId,
      config: { ...src.config },
      data: src.data,
      themeId: src.themeId,
    })
    setTabs(prev => [...prev, dup])
    setActiveTabId(dup.id)
    setAllViz(prev => [dup, ...prev])
    setSaveStatuses(prev => ({ ...prev, [dup.id]: 'unsaved' }))
    scheduleSave(dup.id)
  }, [scheduleSave])

  const renameTab = useCallback((id: string, name: string) => {
    setTabs(prev => prev.map(t =>
      t.id === id ? { ...t, name, updatedAt: Date.now() } : t,
    ))
    scheduleSave(id)
  }, [scheduleSave])

  const openVisualization = useCallback((id: string) => {
    if (tabsRef.current.some(t => t.id === id)) {
      setActiveTabId(id)
      return
    }
    const viz = allVizRef.current.find(v => v.id === id)
    if (!viz) return
    setTabs(prev => [...prev, viz])
    setActiveTabId(id)
    setSaveStatuses(prev => ({ ...prev, [id]: 'saved' }))
  }, [])

  const deleteViz = useCallback(async (id: string) => {
    closeTab(id)
    await deleteVizFromDB(id)
    setAllViz(prev => prev.filter(v => v.id !== id))
  }, [closeTab])

  return {
    tabs,
    activeTabId,
    saveStatuses,
    allViz,
    initialized,
    plugin,
    config,
    data,
    themeId,
    selectPlugin,
    updateConfig,
    updateData,
    resetConfig,
    updateTheme,
    newTab,
    closeTab,
    switchTab,
    duplicateTab,
    renameTab,
    openVisualization,
    deleteViz,
  }
}

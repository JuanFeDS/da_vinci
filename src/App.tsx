import { useEffect, useRef, useState } from 'react'
import { Sparkles, Database } from 'lucide-react'
import { useVisualizations } from '@/hooks/useVisualizations'
import { useTheme } from '@/hooks/useTheme'
import { useInspector } from '@/hooks/useInspector'
import { DataUploader } from '@/components/DataUploader'
import { ChartSelector } from '@/components/ChartSelector'
import { ChartViewer } from '@/components/ChartViewer'
import { ConfigPanel } from '@/components/ConfigPanel'
import { TabBar } from '@/components/TabBar'
import { HomeScreen } from '@/components/HomeScreen'
import type { ProcessedData } from '@/types/data.types'
import type { ChartPlugin, ChartConfig, InspectedElement, ElementOverride } from '@/types/chart.types'

function App() {
  const {
    tabs, activeTabId, saveStatuses, allViz, initialized,
    plugin, config, data, themeId,
    selectPlugin, updateConfig, updateData, resetConfig, updateTheme,
    newTab, closeTab, switchTab, renameTab,
    openVisualization, deleteViz,
  } = useVisualizations()

  const { themes, activeTheme, selectTheme } = useTheme()
  const inspector = useInspector()

  const [screen, setScreen] = useState<'home' | 'editor'>('home')

  // Determine initial screen once initialized
  useEffect(() => {
    if (initialized) setScreen(tabs.length > 0 ? 'editor' : 'home')
  }, [initialized]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-navigate to home when all tabs are closed
  useEffect(() => {
    if (initialized && tabs.length === 0) setScreen('home')
  }, [initialized, tabs.length])

  // Sync useTheme with the active tab's saved themeId
  useEffect(() => {
    selectTheme(themeId)
  }, [themeId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle inspector state on tab switch and on plugin/data change within same tab
  const prevTabIdRef          = useRef<string | null>(null)
  const inspectorSyncEnabled  = useRef(false)
  const skipNextOverrideSync  = useRef(false)
  useEffect(() => {
    if (!activeTabId) return
    const tabSwitched = prevTabIdRef.current !== activeTabId
    prevTabIdRef.current = activeTabId

    if (tabSwitched) {
      // Restore the incoming tab's saved overrides
      const overrides = (config.elementOverrides as Record<string, ElementOverride>) ?? {}
      skipNextOverrideSync.current = true
      inspector.loadOverrides(overrides)
      inspectorSyncEnabled.current = true
    } else {
      // Same tab: plugin or data changed — reset inspector
      inspector.resetOverrides()
    }
  }, [activeTabId, plugin?.id, data?.dataset_info.filename]) // eslint-disable-line react-hooks/exhaustive-deps

  // Keep config.elementOverrides in sync with inspector state (user-driven changes only)
  useEffect(() => {
    if (!inspectorSyncEnabled.current) return
    if (skipNextOverrideSync.current) { skipNextOverrideSync.current = false; return }
    updateConfig('elementOverrides', inspector.overrides)
  }, [inspector.overrides]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleDataLoaded    = (d: ProcessedData) => updateData(d)
  const handlePluginSelect  = (p: ChartPlugin) => selectPlugin(p)
  const handleApplyPreset   = (overrides: Partial<ChartConfig>) =>
    Object.entries(overrides).forEach(([k, v]) => updateConfig(k, v))
  const handleElementClick  = (el: InspectedElement) => inspector.selectElement(el)
  const selectedOverride    = inspector.selected ? inspector.getOverride(inspector.selected) : {}

  const handleThemeSelect = (id: string) => {
    selectTheme(id)
    updateTheme(id)
  }

  const handleReorder = (fromCat: string, toCat: string) => {
    if (!data) return
    const currentOrder = (config.categoryOrder as string[] | undefined)
      ?? data.data.map((r) => String(r[config.xAxis] ?? ''))
    const newOrder = [...currentOrder]
    const fi = newOrder.indexOf(fromCat)
    const ti = newOrder.indexOf(toCat)
    if (fi === -1 || ti === -1) return
    ;[newOrder[fi], newOrder[ti]] = [newOrder[ti], newOrder[fi]]
    updateConfig('categoryOrder', newOrder)
    inspector.resetOverrides()
  }

  const handleLabelRename = (original: string, newLabel: string) => {
    const current = (config.labelOverrides as Record<string, string> | undefined) ?? {}
    updateConfig('labelOverrides', { ...current, [original]: newLabel })
  }

  const handleSeriesNameRename = (original: string, newLabel: string) => {
    const current = (config.seriesNameOverrides as Record<string, string> | undefined) ?? {}
    updateConfig('seriesNameOverrides', { ...current, [original]: newLabel })
  }

  const handleTextBlocksChange = (blocks: import('@/types/chart.types').TextBlock[]) => {
    updateConfig('textBlocks', blocks)
  }

  const handleLegendChange = (selected: Record<string, boolean>) => {
    updateConfig('legendSelected', selected)
  }

  const handleMerge = (fromCat: string, toCat: string, label: string) => {
    if (!data) return
    const currentGroups = (config.mergedGroups as { label: string; members: string[] }[] | undefined) ?? []
    updateConfig('mergedGroups', [...currentGroups, { label, members: [fromCat, toCat] }])
    const currentOrder = (config.categoryOrder as string[] | undefined)
      ?? data.data.map((r) => String(r[config.xAxis] ?? ''))
    const fi = currentOrder.indexOf(fromCat)
    const ti = currentOrder.indexOf(toCat)
    const insertAt = Math.min(fi === -1 ? 99999 : fi, ti === -1 ? 99999 : ti)
    const newOrder = currentOrder.filter((c) => c !== fromCat && c !== toCat)
    newOrder.splice(Math.min(insertAt, newOrder.length), 0, label)
    updateConfig('categoryOrder', newOrder)
    inspector.resetOverrides()
  }

  const handleNewTab = () => { newTab(); setScreen('editor') }
  const handleOpenViz = (id: string) => { openVisualization(id); setScreen('editor') }

  // ── Render ────────────────────────────────────────────────────────────────
  if (!initialized) {
    return (
      <div className="flex h-screen bg-surface-950 items-center justify-center">
        <div className="w-5 h-5 border-2 border-accent/40 border-t-accent rounded-full animate-spin" />
      </div>
    )
  }

  if (screen === 'home') {
    return (
      <HomeScreen
        allViz={allViz}
        onNew={handleNewTab}
        onOpen={handleOpenViz}
        onDelete={deleteViz}
      />
    )
  }

  const showWorkspace = plugin !== null && data !== null

  return (
    <div className="flex flex-col h-screen bg-surface-950 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-white/5 shrink-0">
        <button
          onClick={() => setScreen('home')}
          className="flex items-center gap-2 hover:opacity-70 transition-opacity"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-accent-light flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-semibold text-white tracking-tight">DaVinci</span>
          <span className="text-xs text-white/20 ml-1">by you</span>
        </button>
        {data && (
          <div className="flex items-center gap-1.5 glass rounded-lg px-3 py-1.5">
            <Database className="w-3.5 h-3.5 text-accent-light" />
            <span className="text-xs text-white/60">
              {data.dataset_info.filename} · {data.dataset_info.rows.toLocaleString()} filas
            </span>
          </div>
        )}
      </header>

      {/* Tab bar */}
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        saveStatuses={saveStatuses}
        onSwitch={switchTab}
        onClose={closeTab}
        onNew={handleNewTab}
        onRename={renameTab}
      />

      {/* Main workspace */}
      <div className="flex flex-1 min-h-0">
        {/* Left sidebar */}
        <aside className="w-60 shrink-0 flex flex-col gap-4 p-4 border-r border-white/5 overflow-y-auto">
          <DataUploader onDataLoaded={handleDataLoaded} />
          <div className="border-t border-white/5 pt-4">
            <ChartSelector activeId={plugin?.id ?? null} onSelect={handlePluginSelect} />
          </div>
        </aside>

        {/* Chart area */}
        <main className="flex-1 min-w-0 p-4">
          {showWorkspace ? (
            <ChartViewer
              plugin={plugin}
              config={config}
              data={data.data}
              theme={activeTheme}
              inspectorActive={inspector.inspectorActive}
              onToggleInspector={inspector.toggleMode}
              onElementClick={handleElementClick}
              onReset={resetConfig}
              onReorder={handleReorder}
              onMerge={handleMerge}
              onLabelRename={handleLabelRename}
              onSeriesNameRename={handleSeriesNameRename}
              onTextBlocksChange={handleTextBlocksChange}
              onLegendChange={handleLegendChange}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-accent/20 to-accent-light/10 border border-accent/20 flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-accent/60" />
                </div>
                <div className="absolute -inset-4 rounded-full bg-accent/5 blur-xl" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-semibold text-white mb-2">Empieza a visualizar</h2>
                <p className="text-white/40 text-sm max-w-xs">
                  {!data
                    ? 'Sube un archivo CSV o Excel para comenzar'
                    : 'Selecciona un tipo de gráfico en el panel izquierdo'}
                </p>
              </div>
            </div>
          )}
        </main>

        {/* Right config panel */}
        {showWorkspace && (
          <aside className="w-72 shrink-0 border-l border-white/5 glass">
            <ConfigPanel
              plugin={plugin}
              config={config}
              data={data}
              themes={themes}
              activeThemeId={activeTheme.id}
              inspectorActive={inspector.inspectorActive}
              selected={inspector.selected}
              selectedOverride={selectedOverride}
              onChange={updateConfig}
              onReset={resetConfig}
              onThemeSelect={handleThemeSelect}
              onApplyPreset={handleApplyPreset}
              onInspectorUpdate={(patch) =>
                inspector.selected && inspector.updateOverride(inspector.selected, patch)}
              onInspectorUpdateAll={(patch) =>
                inspector.selected && data &&
                inspector.updateAllInSeries(inspector.selected.seriesIndex, data.data.length, patch)}
              onInspectorResetElement={() =>
                inspector.selected && inspector.removeOverride(inspector.selected)}
              onClearSelection={inspector.clearSelection}
            />
          </aside>
        )}
      </div>
    </div>
  )
}

export default App

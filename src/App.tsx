import { useEffect, useRef } from 'react'
import { Sparkles, Database } from 'lucide-react'
import { useChartConfig } from '@/hooks/useChartConfig'
import { useTheme } from '@/hooks/useTheme'
import { useInspector } from '@/hooks/useInspector'
import { DataUploader } from '@/components/DataUploader'
import { ChartSelector } from '@/components/ChartSelector'
import { ChartViewer } from '@/components/ChartViewer'
import { ConfigPanel } from '@/components/ConfigPanel'
import type { ProcessedData } from '@/types/data.types'
import type { ChartPlugin, ChartConfig, InspectedElement } from '@/types/chart.types'

function App() {
  const { plugin, config, data, selectPlugin, updateConfig, updateData, resetConfig } = useChartConfig()
  const { themes, activeTheme, activeId, selectTheme } = useTheme()
  const inspector = useInspector()

  const handleDataLoaded = (d: ProcessedData) => updateData(d)
  const handlePluginSelect = (p: ChartPlugin) => selectPlugin(p, data)
  const handleApplyPreset = (overrides: Partial<ChartConfig>) => {
    Object.entries(overrides).forEach(([k, v]) => updateConfig(k, v))
  }
  const handleElementClick = (el: InspectedElement) => inspector.selectElement(el)
  const selectedOverride = inspector.selected ? inspector.getOverride(inspector.selected) : {}

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

  useEffect(() => {
    updateConfig('elementOverrides', inspector.overrides)
  }, [inspector.overrides])

  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    inspector.resetOverrides()
  }, [plugin?.id, data?.dataset_info.filename])

  const showWorkspace = plugin !== null && data !== null

  return (
    <div className="flex flex-col h-screen bg-surface-950 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-accent-light flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-semibold text-white tracking-tight">DaVinci</span>
          <span className="text-xs text-white/20 ml-1">by you</span>
        </div>
        <div className="flex items-center gap-2">
          {data && (
            <div className="flex items-center gap-1.5 glass rounded-lg px-3 py-1.5">
              <Database className="w-3.5 h-3.5 text-accent-light" />
              <span className="text-xs text-white/60">
                {data.dataset_info.filename} · {data.dataset_info.rows.toLocaleString()} filas
              </span>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar izquierdo */}
        <aside className="w-60 shrink-0 flex flex-col gap-4 p-4 border-r border-white/5 overflow-y-auto">
          <DataUploader onDataLoaded={handleDataLoaded} />
          <div className="border-t border-white/5 pt-4">
            <ChartSelector activeId={plugin?.id ?? null} onSelect={handlePluginSelect} />
          </div>
        </aside>

        {/* Área central: visor */}
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
                  {!data ? 'Sube un archivo CSV o Excel para comenzar' : 'Selecciona un tipo de gráfico en el panel izquierdo'}
                </p>
              </div>
            </div>
          )}
        </main>

        {/* Sidebar derecho: configuración */}
        {showWorkspace && (
          <aside className="w-72 shrink-0 border-l border-white/5 glass">
            <ConfigPanel
              plugin={plugin}
              config={config}
              data={data}
              themes={themes}
              activeThemeId={activeId}
              inspectorActive={inspector.inspectorActive}
              selected={inspector.selected}
              selectedOverride={selectedOverride}
              onChange={updateConfig}
              onReset={resetConfig}
              onThemeSelect={selectTheme}
              onApplyPreset={handleApplyPreset}
              onInspectorUpdate={(patch) => inspector.selected && inspector.updateOverride(inspector.selected, patch)}
              onInspectorUpdateAll={(patch) => inspector.selected && data && inspector.updateAllInSeries(inspector.selected.seriesIndex, data.data.length, patch)}
              onInspectorResetElement={() => inspector.selected && inspector.removeOverride(inspector.selected)}
              onClearSelection={inspector.clearSelection}
            />
          </aside>
        )}
      </div>
    </div>
  )
}

export default App

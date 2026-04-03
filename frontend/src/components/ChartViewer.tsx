import { useRef, useMemo, useCallback } from 'react'
import ReactECharts from 'echarts-for-react'
import type EChartsReact from 'echarts-for-react'
import { Download, RotateCcw, FileJson, MousePointer2 } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { ChartPlugin, ChartConfig, InspectedElement } from '@/types/chart.types'
import type { Theme } from '@/types/theme.types'
import type { DataRow } from '@/types/data.types'
import { exportChartAsPNG } from '@/utils/chartExport'
import { exportConfigAsJSON } from '@/utils/configExport'

interface Props {
  plugin: ChartPlugin
  config: ChartConfig
  data: DataRow[]
  theme: Theme
  inspectorActive: boolean
  onToggleInspector: () => void
  onElementClick: (el: InspectedElement) => void
  onReset: () => void
}

export function ChartViewer({ plugin, config, data, theme, inspectorActive, onToggleInspector, onElementClick, onReset }: Props) {
  const chartRef = useRef<EChartsReact | null>(null)

  const canRender = plugin.canRender
    ? plugin.canRender(config)
    : !!(config.xAxis && config.yAxis)

  const option = useMemo(() => {
    if (!canRender) return null
    return plugin.buildOption(data, config, theme)
  }, [plugin, config, data, theme, canRender])

  const handleExport = () => {
    const instance = chartRef.current?.getEchartsInstance()
    if (instance) exportChartAsPNG(instance, (config.title as string) || plugin.name)
  }

  const handleExportJSON = () => exportConfigAsJSON(plugin.id, config, theme)

  const handleChartClick = useCallback((params: unknown) => {
    if (!inspectorActive) return
    const p = params as { seriesIndex?: number; dataIndex?: number; seriesName?: string; value?: unknown; name?: string; data?: unknown }
    if (p.seriesIndex === undefined || p.dataIndex === undefined) return
    
    const categoryName = p.name ?? String(p.dataIndex)
    const metaIndex = typeof (p as { data?: { metaIndex?: number } }).data?.metaIndex === 'number'
      ? (p as { data?: { metaIndex?: number } }).data!.metaIndex!
      : undefined
    
    const finalIndex = metaIndex !== undefined ? metaIndex : p.dataIndex
    
    onElementClick({
      seriesIndex: p.seriesIndex,
      dataIndex: finalIndex,
      seriesName: p.seriesName ?? '',
      value: p.value,
      category: categoryName,
    })
  }, [inspectorActive, onElementClick])

  const onEvents = useMemo(() => ({ click: handleChartClick }), [handleChartClick])

  return (
    <div className={cn(
      'relative flex flex-col h-full glass rounded-2xl overflow-hidden transition-all duration-200',
      inspectorActive && 'ring-1 ring-accent/40',
    )}>
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />

      <div className="relative flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-sm font-medium text-white/70">{plugin.name}</span>
          {config.title && (
            <span className="text-xs text-white/30">· {config.title as string}</span>
          )}
          {inspectorActive && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-accent/20 text-accent-light border border-accent/30 font-medium">
              Inspector activo
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleInspector}
            title="Modo inspector"
            className={cn(
              'flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs transition-all duration-200 border',
              inspectorActive
                ? 'bg-accent/20 border-accent/40 text-accent-light'
                : 'btn-ghost border-transparent',
            )}
          >
            <MousePointer2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onReset} className="btn-ghost text-xs flex items-center gap-1.5 py-1.5">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
          <button onClick={handleExportJSON} className="btn-ghost text-xs flex items-center gap-1.5 py-1.5">
            <FileJson className="w-3.5 h-3.5" /> JSON
          </button>
          <button onClick={handleExport} className="btn-primary text-xs flex items-center gap-1.5 py-1.5">
            <Download className="w-3.5 h-3.5" /> PNG
          </button>
        </div>
      </div>

      <div className={cn('relative flex-1 min-h-0 p-2', inspectorActive && 'cursor-crosshair')}>
        {option ? (
          <ReactECharts
            ref={chartRef}
            option={option}
            style={{ height: '100%', width: '100%' }}
            opts={{ renderer: 'canvas', devicePixelRatio: 2 }}
            onEvents={onEvents}
            notMerge
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-white/20">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
              <span className="text-3xl">📊</span>
            </div>
            <p className="text-sm">Selecciona los ejes en el panel de configuración</p>
          </div>
        )}
      </div>
    </div>
  )
}

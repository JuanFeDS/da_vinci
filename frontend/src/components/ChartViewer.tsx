import { useRef, useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import type EChartsReact from 'echarts-for-react'
import { Download, RotateCcw, FileJson } from 'lucide-react'
import type { ChartPlugin, ChartConfig } from '@/types/chart.types'
import type { Theme } from '@/types/theme.types'
import type { DataRow } from '@/types/data.types'
import { exportChartAsPNG } from '@/utils/chartExport'
import { exportConfigAsJSON } from '@/utils/configExport'

interface Props {
  plugin: ChartPlugin
  config: ChartConfig
  data: DataRow[]
  theme: Theme
  onReset: () => void
}

export function ChartViewer({ plugin, config, data, theme, onReset }: Props) {
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

  return (
    <div className="relative flex flex-col h-full glass rounded-2xl overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />

      <div className="relative flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-sm font-medium text-white/70">{plugin.name}</span>
          {config.title && (
            <span className="text-xs text-white/30">· {config.title as string}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
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

      <div className="relative flex-1 min-h-0 p-2">
        {option ? (
          <ReactECharts
            ref={chartRef}
            option={option}
            style={{ height: '100%', width: '100%' }}
            opts={{ renderer: 'canvas', devicePixelRatio: 2 }}
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

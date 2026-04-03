import type { EChartsOption } from 'echarts'
import type { ChartPlugin, ChartConfig } from '@/types/chart.types'
import type { DataRow } from '@/types/data.types'
import type { Theme } from '@/types/theme.types'
import { getOverrideForItem } from './utils/colorResolver'

const HEATMAP_SECTIONS = [
  {
    id: 'data', label: 'Datos',
    controls: [
      { key: 'xAxis', label: 'Eje X (categoría)', type: 'select' as const, defaultValue: '' },
      { key: 'yAxis', label: 'Eje Y (categoría)', type: 'select' as const, defaultValue: '' },
      { key: 'valueAxis', label: 'Valor (numérico)', type: 'select' as const, defaultValue: '' },
      { key: 'title', label: 'Título del gráfico', type: 'text' as const, defaultValue: '' },
    ],
  },
  {
    id: 'display', label: 'Visualización',
    controls: [
      { key: 'showLabels', label: 'Mostrar valores', type: 'switch' as const, defaultValue: true },
    ],
  },
]

function buildOption(data: DataRow[], config: ChartConfig, theme: Theme): EChartsOption {
  const xVals = [...new Set(data.map((r) => String(r[config.xAxis] ?? '')))]
  const yVals = [...new Set(data.map((r) => String(r[config.yAxis] ?? '')))]
  const valueCol = (config.valueAxis as string) || (config.numericColumns as string[])[0] || ''

  const overrides = config.elementOverrides as Record<string, Record<string, unknown>>
  const heatData = data.map((r, i) => {
    const ov = getOverrideForItem(overrides, 0, i)
    return {
      value: [xVals.indexOf(String(r[config.xAxis] ?? '')), yVals.indexOf(String(r[config.yAxis] ?? '')), Number(r[valueCol] ?? 0)],
      metaIndex: i,
      itemStyle: ov.color ? { color: ov.color, opacity: ov.opacity !== undefined ? (ov.opacity as number) / 100 : 1 } : undefined,
    }
  })

  const values = heatData.map((d) => d.value[2])
  const minVal = Math.min(...values)
  const maxVal = Math.max(...values)

  return {
    backgroundColor: theme.backgroundColor,
    title: config.title ? { text: config.title as string, textStyle: { color: '#fff', fontFamily: theme.fontFamily, fontSize: 16 }, left: 'center', top: 12 } : undefined,
    tooltip: { formatter: (p: unknown) => { const d = p as { value: number[] }; return `${xVals[d.value[0]]} / ${yVals[d.value[1]]}: ${d.value[2]}` }, backgroundColor: 'rgba(0,0,0,0.8)', textStyle: { color: '#fff' } },
    grid: { top: config.title ? 72 : 40, left: 80, right: 80, bottom: 48, containLabel: true },
    xAxis: { type: 'category', data: xVals, axisLabel: { color: theme.textColor, fontSize: theme.fontSize }, axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }, splitArea: { show: true, areaStyle: { color: ['transparent', 'rgba(255,255,255,0.02)'] } } },
    yAxis: { type: 'category', data: yVals, axisLabel: { color: theme.textColor, fontSize: theme.fontSize }, axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }, splitArea: { show: true, areaStyle: { color: ['transparent', 'rgba(255,255,255,0.02)'] } } },
    visualMap: { min: minVal, max: maxVal, calculable: true, orient: 'horizontal', left: 'center', bottom: 0, textStyle: { color: theme.textColor }, inRange: { color: [`${theme.colors[0]}22`, theme.colors[0]] } },
    series: [{
      type: 'heatmap',
      data: heatData,
      label: config.showLabels ? { show: true, color: '#fff', fontSize: 10 } : { show: false },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: theme.colors[0] } },
    }],
  }
}

export const HeatmapChart: ChartPlugin = {
  id: 'heatmap', name: 'Mapa de Calor', description: 'Intensidad de valores en matriz 2D',
  icon: 'LayoutGrid', category: 'correlation',
  configSections: HEATMAP_SECTIONS,
  defaultConfig: { xAxis: '', yAxis: '', valueAxis: '', title: '', showLegend: false, showGrid: false, smooth: false, barRadius: 0, opacity: 100, labelPosition: '', seriesType: 'heatmap', showLabels: true, numericColumns: [], colorMode: 'uniform', colorField: '', colorMap: {}, elementOverrides: {} },
  buildOption,
}


import type { EChartsOption } from 'echarts'
import type { ChartPlugin, ChartConfig } from '@/types/chart.types'
import type { DataRow } from '@/types/data.types'
import type { Theme } from '@/types/theme.types'
import { getOverrideForItem } from './utils/colorResolver'

const STACKED_SECTIONS = [
  {
    id: 'data', label: 'Datos',
    controls: [
      { key: 'xAxis', label: 'Eje X (categorías)', type: 'select' as const, defaultValue: '' },
      { key: 'title', label: 'Título del gráfico', type: 'text' as const, defaultValue: '' },
    ],
  },
  {
    id: 'style', label: 'Estilo',
    controls: [
      { key: 'barRadius', label: 'Radio superior', type: 'slider' as const, defaultValue: 4, min: 0, max: 16 },
      { key: 'opacity', label: 'Opacidad', type: 'slider' as const, defaultValue: 92, min: 10, max: 100 },
    ],
  },
  {
    id: 'display', label: 'Visualización',
    controls: [
      { key: 'showLegend', label: 'Mostrar leyenda', type: 'switch' as const, defaultValue: true },
      { key: 'showGrid', label: 'Mostrar cuadrícula', type: 'switch' as const, defaultValue: true },
      { key: 'showLabels', label: 'Mostrar etiquetas', type: 'switch' as const, defaultValue: false },
      { key: 'tickRotation', label: 'Rotación de ticks', type: 'slider' as const, defaultValue: 0, min: -90, max: 90, step: 15 },
    ],
  },
]

function buildOption(data: DataRow[], config: ChartConfig, theme: Theme): EChartsOption {
  const categories = data.map((r) => String(r[config.xAxis] ?? ''))
  const numCols = (config.numericColumns as string[]).filter((c) => c !== config.xAxis).slice(0, 6)
  const opacity = (config.opacity as number) / 100
  const overrides = config.elementOverrides as Record<string, Record<string, unknown>>
  const tickRotation = (config.tickRotation as number) ?? 0

  const series = numCols.map((col, seriesIdx) => ({
    name: col, type: 'bar' as const, stack: 'total',
    data: data.map((r, dataIdx) => {
      const ov = getOverrideForItem(overrides, seriesIdx, dataIdx)
      const baseColor = theme.colors[seriesIdx % theme.colors.length]
      const finalColor = ov.color ?? baseColor
      const finalOpacity = ov.opacity !== undefined ? (ov.opacity as number) / 100 : opacity
      return {
        value: Number(r[col] ?? 0),
        name: categories[dataIdx],
        metaIndex: dataIdx,
        itemStyle: { color: finalColor, opacity: finalOpacity, borderRadius: config.barRadius as number },
        label: ov.labelShow !== undefined ? { show: ov.labelShow as boolean, formatter: ov.labelText as string | undefined, color: '#fff', fontSize: 10 } : undefined,
      }
    }),
    label: config.showLabels ? { show: true, color: '#fff', fontSize: 10 } : { show: false },
    emphasis: { focus: 'series' as const },
  }))

  return {
    backgroundColor: theme.backgroundColor,
    title: config.title ? { text: config.title as string, textStyle: { color: '#fff', fontFamily: theme.fontFamily, fontSize: 16 }, left: 'center', top: 12 } : undefined,
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' as const }, backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', textStyle: { color: '#fff' } },
    legend: { textStyle: { color: theme.textColor }, bottom: 0 },
    grid: { top: config.title ? 56 : 24, left: 48, right: 24, bottom: 48, containLabel: true },
    xAxis: { type: 'category', data: categories, axisLabel: { color: theme.textColor, fontSize: theme.fontSize, rotate: tickRotation }, axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }, splitLine: { show: false } },
    yAxis: { type: 'value', axisLabel: { color: theme.textColor, fontSize: theme.fontSize }, splitLine: { lineStyle: { color: config.showGrid ? theme.gridColor : 'transparent' } }, axisLine: { lineStyle: { color: 'transparent' } } },
    series,
  }
}

export const StackedBarChart: ChartPlugin = {
  id: 'stacked-bar', name: 'Barras Apiladas', description: 'Composición proporcional por categoría',
  icon: 'Layers', category: 'comparison',
  configSections: STACKED_SECTIONS,
  defaultConfig: { xAxis: '', yAxis: '', title: '', showLegend: true, showGrid: true, smooth: false, barRadius: 4, opacity: 92, labelPosition: 'top', seriesType: 'bar', showLabels: false, numericColumns: [], colorMode: 'uniform', colorField: '', colorMap: {}, elementOverrides: {}, tickRotation: 0 },
  buildOption,
  canRender: (config) => !!config.xAxis,
}


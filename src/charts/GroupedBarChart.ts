import type { EChartsOption } from 'echarts'
import type { ChartPlugin, ChartConfig } from '@/types/chart.types'
import type { DataRow } from '@/types/data.types'
import type { Theme } from '@/types/theme.types'
import { getOverrideForItem, getEffectiveSeriesColor } from './utils/colorResolver'
import { compactNumber } from './utils/numberFormat'

const GROUPED_SECTIONS = [
  {
    id: 'data', label: 'Datos',
    controls: [
      { key: 'xAxis', label: 'Eje X (categorías)', type: 'select' as const, defaultValue: '' },
      { key: 'title', label: 'Título del gráfico', type: 'text' as const, defaultValue: '' },
      { key: 'sortBy', label: 'Ordenar por columna', type: 'select' as const, defaultValue: '' },
      {
        key: 'sortOrder', label: 'Dirección', type: 'select' as const, defaultValue: 'asc',
        options: [
          { label: 'Ascendente', value: 'asc' },
          { label: 'Descendente', value: 'desc' },
        ],
      },
    ],
  },
  {
    id: 'style', label: 'Estilo',
    controls: [
      { key: 'barRadius', label: 'Radio de barras', type: 'slider' as const, defaultValue: 4, min: 0, max: 16 },
      { key: 'opacity', label: 'Opacidad', type: 'slider' as const, defaultValue: 90, min: 10, max: 100 },
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
  const numCols = (config.numericColumns as string[]) || []
  const sortBy = (config.sortBy as string | undefined) ?? 'none'
  const sortOrder = (config.sortOrder as string | undefined) ?? 'asc'
  let workingData = [...data]
  if (sortBy) {
    const dir = sortOrder === 'desc' ? -1 : 1
    const isNumeric = workingData.length > 0 && !isNaN(Number(workingData[0][sortBy]))
    workingData = [...workingData].sort((a, b) => {
      if (isNumeric) return dir * (Number(a[sortBy] ?? 0) - Number(b[sortBy] ?? 0))
      return dir * String(a[sortBy] ?? '').localeCompare(String(b[sortBy] ?? ''))
    })
  }
  const categories = workingData.map((r) => String(r[config.xAxis] ?? ''))
  const opacity = (config.opacity as number) / 100
  const overrides = config.elementOverrides as Record<string, Record<string, unknown>>
  const tickRotation = (config.tickRotation as number) ?? 0

  const series = numCols.map((col, seriesIdx) => {
    const baseColor      = theme.colors[seriesIdx % theme.colors.length]
    const effectiveColor = getEffectiveSeriesColor(seriesIdx, workingData.length, overrides, baseColor)
    return {
    type: 'bar' as const,
    name: col,
    itemStyle: { color: effectiveColor },
    data: workingData.map((r, dataIdx) => {
      const ov = getOverrideForItem(overrides, seriesIdx, dataIdx)
      const finalColor = ov.color ?? baseColor
      const finalOpacity = ov.opacity !== undefined ? (ov.opacity as number) / 100 : opacity
      return {
        value: Number(r[col] ?? 0),
        name: categories[dataIdx],
        metaIndex: dataIdx,
        itemStyle: { color: finalColor, opacity: finalOpacity, borderRadius: config.barRadius as number },
        label: ov.labelShow !== undefined ? { show: ov.labelShow as boolean, formatter: ov.labelText as string | undefined, color: '#fff', fontSize: 10, position: 'top' as const } : undefined,
      }
    }),
    label: config.showLabels ? { show: true, color: '#fff', fontSize: 10, position: 'top' as const, formatter: (p: { value: unknown }) => compactNumber(p.value as number) } : { show: false },
    emphasis: { itemStyle: { opacity: 1, shadowBlur: 12 } },
  }
  })

  return {
    backgroundColor: theme.backgroundColor,
    color: theme.colors,
    title: config.title ? { text: config.title as string, textStyle: { color: '#fff', fontFamily: theme.fontFamily, fontSize: 16 }, left: 'center', top: 12 } : undefined,
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', textStyle: { color: '#fff' }, valueFormatter: (v: unknown) => compactNumber(v as number) },
    legend: { textStyle: { color: theme.textColor }, bottom: 0 },
    grid: { top: config.title ? 56 : 24, left: 48, right: 24, bottom: 48, containLabel: true },
    xAxis: { type: 'category', data: categories, axisLabel: { color: theme.textColor, fontSize: theme.fontSize, rotate: tickRotation }, axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }, splitLine: { show: false } },
    yAxis: { type: 'value', axisLabel: { color: theme.textColor, fontSize: theme.fontSize, formatter: (v: number) => compactNumber(v) }, splitLine: { lineStyle: { color: config.showGrid ? theme.gridColor : 'transparent' } }, axisLine: { lineStyle: { color: 'transparent' } } },
    series,
  }
}

export const GroupedBarChart: ChartPlugin = {
  id: 'grouped-bar', name: 'Barras Agrupadas', description: 'Comparar múltiples series por categoría',
  icon: 'BarChart3', category: 'comparison',
  configSections: GROUPED_SECTIONS,
  defaultConfig: { xAxis: '', yAxis: '', title: '', showLegend: true, showGrid: true, smooth: false, barRadius: 4, opacity: 90, labelPosition: 'top', seriesType: 'bar', showLabels: false, numericColumns: [], colorMode: 'uniform', colorField: '', colorMap: {}, elementOverrides: {}, tickRotation: 0, sortBy: '', sortOrder: 'asc' },
  buildOption,
  canRender: (config) => !!config.xAxis,
}


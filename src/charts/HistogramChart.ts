import type { EChartsOption } from 'echarts'
import type { ChartPlugin, ChartConfig } from '@/types/chart.types'
import type { DataRow } from '@/types/data.types'
import type { Theme } from '@/types/theme.types'
import { getOverrideForItem } from './utils/colorResolver'
import { compactNumber } from './utils/numberFormat'

const HISTOGRAM_SECTIONS = [
  {
    id: 'data', label: 'Datos',
    controls: [
      { key: 'xAxis', label: 'Columna numérica', type: 'select' as const, defaultValue: '' },
      { key: 'title', label: 'Título del gráfico', type: 'text' as const, defaultValue: '' },
    ],
  },
  {
    id: 'style', label: 'Estilo',
    controls: [
      { key: 'bins', label: 'Cantidad de bins', type: 'slider' as const, defaultValue: 10, min: 4, max: 30 },
      { key: 'barRadius', label: 'Radio de barras', type: 'slider' as const, defaultValue: 3, min: 0, max: 12 },
      { key: 'useGradient', label: 'Gradiente', type: 'switch' as const, defaultValue: true },
    ],
  },
  {
    id: 'display', label: 'Visualización',
    controls: [
      { key: 'showGrid', label: 'Mostrar cuadrícula', type: 'switch' as const, defaultValue: true },
      { key: 'showLabels', label: 'Mostrar frecuencias', type: 'switch' as const, defaultValue: false },
    ],
  },
]

function computeBins(values: number[], binCount: number) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const width = (max - min) / binCount
  const counts = new Array(binCount).fill(0)
  const labels: string[] = []
  for (let i = 0; i < binCount; i++) {
    labels.push(`${(min + i * width).toFixed(1)}`)
  }
  values.forEach((v) => {
    let idx = Math.floor((v - min) / width)
    if (idx >= binCount) idx = binCount - 1
    counts[idx]++
  })
  return { labels, counts }
}

function buildOption(data: DataRow[], config: ChartConfig, theme: Theme): EChartsOption {
  const binCount = (config.bins as number) ?? 10
  const raw = data.map((r) => Number(r[config.xAxis] ?? 0)).filter((v) => !isNaN(v))
  const { labels, counts } = computeBins(raw, binCount)
  const color = theme.colors[0]
  const itemStyle = (config.useGradient as boolean)
    ? { color: { type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: theme.colors[1] ?? color }, { offset: 1, color }] }, borderRadius: config.barRadius as number }
    : { color, borderRadius: config.barRadius as number }

  const overrides = config.elementOverrides as Record<string, Record<string, unknown>>
  const histData = counts.map((c, i) => {
    const ov = getOverrideForItem(overrides, 0, i)
    return {
      value: c,
      name: labels[i],
      metaIndex: i,
      itemStyle: ov.color ? { color: ov.color, opacity: ov.opacity !== undefined ? (ov.opacity as number) / 100 : 1 } : itemStyle,
    }
  })

  return {
    backgroundColor: theme.backgroundColor,
    title: config.title ? { text: config.title as string, textStyle: { color: '#fff', fontFamily: theme.fontFamily, fontSize: 16 }, left: 'center', top: 12 } : undefined,
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', textStyle: { color: '#fff' } },
    grid: { top: config.title ? 56 : 24, left: 48, right: 24, bottom: 40, containLabel: true },
    xAxis: { type: 'category', data: labels, axisLabel: { color: theme.textColor, fontSize: theme.fontSize, rotate: 30 }, axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }, splitLine: { show: false } },
    yAxis: { type: 'value', name: 'Frecuencia', nameTextStyle: { color: theme.textColor }, axisLabel: { color: theme.textColor, fontSize: theme.fontSize, formatter: (v: number) => compactNumber(v) }, splitLine: { lineStyle: { color: config.showGrid ? theme.gridColor : 'transparent' } }, axisLine: { lineStyle: { color: 'transparent' } } },
    series: [{
      type: 'bar',
      data: histData, barCategoryGap: '2%', itemStyle, label: config.showLabels ? { show: true, color: '#fff', fontSize: 10, position: 'top' as const, formatter: (p: { value: unknown }) => compactNumber(p.value as number) } : { show: false } }],
  }
}

export const HistogramChart: ChartPlugin = {
  id: 'histogram', name: 'Histograma', description: 'Distribución de frecuencias numéricas',
  icon: 'BarChartHorizontal', category: 'distribution',
  configSections: HISTOGRAM_SECTIONS,
  defaultConfig: { xAxis: '', yAxis: '_auto_', title: '', showLegend: false, showGrid: true, smooth: false, barRadius: 3, opacity: 100, labelPosition: 'top', seriesType: 'bar', bins: 10, useGradient: true, showLabels: false, numericColumns: [], colorMode: 'uniform', colorField: '', colorMap: {}, elementOverrides: {} },
  buildOption,
  canRender: (config) => !!config.xAxis,
}


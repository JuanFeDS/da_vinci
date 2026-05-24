import type { EChartsOption } from 'echarts'
import type { ChartPlugin, ChartConfig } from '@/types/chart.types'
import type { DataRow } from '@/types/data.types'
import type { Theme } from '@/types/theme.types'
import { getOverrideForItem } from './utils/colorResolver'
import { compactNumber } from './utils/numberFormat'

const BUBBLE_SECTIONS = [
  {
    id: 'data', label: 'Datos',
    controls: [
      { key: 'xAxis', label: 'Eje X (numérico)', type: 'select' as const, defaultValue: '' },
      { key: 'yAxis', label: 'Eje Y (numérico)', type: 'select' as const, defaultValue: '' },
      { key: 'sizeAxis', label: 'Tamaño de burbuja', type: 'select' as const, defaultValue: '' },
      { key: 'colorAxis', label: 'Color por variable', type: 'select' as const, defaultValue: '' },
      { key: 'labelField', label: 'Etiqueta', type: 'select' as const, defaultValue: '' },
      { key: 'title', label: 'Título del gráfico', type: 'text' as const, defaultValue: '' },
    ],
  },
  {
    id: 'style', label: 'Estilo',
    controls: [
      { key: 'maxBubbleSize', label: 'Tamaño máximo', type: 'slider' as const, defaultValue: 60, min: 20, max: 120 },
      { key: 'opacity', label: 'Opacidad', type: 'slider' as const, defaultValue: 70, min: 10, max: 100 },
      { key: 'gradientStart', label: 'Color inicio', type: 'color' as const, defaultValue: '', group: 'gradient' },
      { key: 'gradientEnd', label: 'Color fin', type: 'color' as const, defaultValue: '', group: 'gradient' },
    ],
  },
  {
    id: 'display', label: 'Visualización',
    controls: [
      { key: 'showGrid', label: 'Mostrar cuadrícula', type: 'switch' as const, defaultValue: true },
      { key: 'showLabels', label: 'Mostrar etiquetas', type: 'switch' as const, defaultValue: false },
    ],
  },
]

function buildOption(data: DataRow[], config: ChartConfig, theme: Theme): EChartsOption {
  const sizeCol = (config.sizeAxis as string) || config.yAxis
  const colorCol = config.colorAxis as string
  const rawSizes = data.map((r) => Number(r[sizeCol] ?? 0))
  const maxSize = Math.max(...rawSizes)
  const maxBubble = (config.maxBubbleSize as number) ?? 60
  const opacity = (config.opacity as number) / 100

  const gradientStart = config.gradientStart as string
  const gradientEnd = config.gradientEnd as string

  const labelField = config.labelField as string

  const gradientColors = gradientStart && gradientEnd
    ? [gradientStart, gradientEnd]
    : gradientStart
      ? [gradientStart, theme.colors[theme.colors.length - 1]]
      : gradientEnd
        ? [theme.colors[0], gradientEnd]
        : theme.colors

  const overrides = config.elementOverrides as Record<string, Record<string, unknown>>
  const points = data.map((r, i) => {
    const ov = getOverrideForItem(overrides, 0, i)
    const baseColor = theme.colors[i % theme.colors.length]
    const value = colorCol
      ? [Number(r[config.xAxis] ?? 0), Number(r[config.yAxis] ?? 0), Number(r[sizeCol] ?? 10), Number(r[colorCol] ?? 0)]
      : [Number(r[config.xAxis] ?? 0), Number(r[config.yAxis] ?? 0), Number(r[sizeCol] ?? 10)]
    return {
      value,
      metaIndex: i,
      symbolSize: (ov.size as number | undefined) ?? (maxSize > 0 ? (rawSizes[i] / maxSize) * maxBubble + 8 : 16),
      itemStyle: {
        color: colorCol ? undefined : ((ov.color as string | undefined) ?? baseColor),
        opacity: ov.opacity !== undefined ? (ov.opacity as number) / 100 : opacity,
      },
    }
  })

  return {
    backgroundColor: theme.backgroundColor,
    title: config.title ? { text: config.title as string, textStyle: { color: '#fff', fontFamily: theme.fontFamily, fontSize: 16 }, left: 'center', top: 12 } : undefined,
    tooltip: {
      formatter: (params: unknown) => {
        const p = params as { value: number[] }
        return `${config.xAxis}: ${compactNumber(p.value[0])}<br/>${config.yAxis}: ${compactNumber(p.value[1])}<br/>${sizeCol}: ${compactNumber(p.value[2])}`
      },
      backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', textStyle: { color: '#fff' },
    },
    visualMap: colorCol ? { show: true, dimension: 3, min: 0, max: 100, inRange: { color: gradientColors }, textStyle: { color: theme.textColor }, calculable: true, right: 0, top: 'center' } : undefined,
    grid: { top: config.title ? 56 : 24, left: 48, right: colorCol ? 80 : 24, bottom: 56, containLabel: true },
    xAxis: { type: 'value', name: config.xAxis as string, nameLocation: 'middle', nameGap: 28, nameTextStyle: { color: theme.textColor }, axisLabel: { color: theme.textColor, fontSize: theme.fontSize, formatter: (v: number) => compactNumber(v) }, splitLine: { lineStyle: { color: config.showGrid ? theme.gridColor : 'transparent' } }, axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } } },
    yAxis: { type: 'value', name: config.yAxis as string, nameLocation: 'middle', nameGap: 48, nameTextStyle: { color: theme.textColor }, axisLabel: { color: theme.textColor, fontSize: theme.fontSize, formatter: (v: number) => compactNumber(v) }, splitLine: { lineStyle: { color: config.showGrid ? theme.gridColor : 'transparent' } }, axisLine: { lineStyle: { color: 'transparent' } } },
    series: [{
      type: 'scatter',
      data: points,
      label: config.showLabels
        ? { show: true, color: '#fff', fontSize: 10, formatter: labelField ? (p: { dataIndex: number }) => String(data[p.dataIndex]?.[labelField] ?? '') : undefined }
        : { show: false },
    }],
  }
}

export const BubbleChart: ChartPlugin = {
  id: 'bubble', name: 'Burbujas', description: 'Comparar 3 variables con tamaño',
  icon: 'CircleDot', category: 'correlation',
  configSections: BUBBLE_SECTIONS,
  defaultConfig: { xAxis: '', yAxis: '', sizeAxis: '', colorAxis: '', labelField: '', title: '', showLegend: false, showGrid: true, smooth: false, barRadius: 0, opacity: 70, labelPosition: '', seriesType: 'scatter', maxBubbleSize: 60, showLabels: false, gradientStart: '', gradientEnd: '', numericColumns: [], colorMode: 'uniform', colorField: '', colorMap: {}, elementOverrides: {} },
  buildOption,
  supportsColorBy: true,
}

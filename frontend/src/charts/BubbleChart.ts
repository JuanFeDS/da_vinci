import type { EChartsOption } from 'echarts'
import type { ChartPlugin, ChartConfig } from '@/types/chart.types'
import type { DataRow } from '@/types/data.types'
import type { Theme } from '@/types/theme.types'

const BUBBLE_SECTIONS = [
  {
    id: 'data', label: 'Datos',
    controls: [
      { key: 'xAxis', label: 'Eje X (numérico)', type: 'select' as const, defaultValue: '' },
      { key: 'yAxis', label: 'Eje Y (numérico)', type: 'select' as const, defaultValue: '' },
      { key: 'sizeAxis', label: 'Tamaño de burbuja', type: 'select' as const, defaultValue: '' },
      { key: 'title', label: 'Título del gráfico', type: 'text' as const, defaultValue: '' },
    ],
  },
  {
    id: 'style', label: 'Estilo',
    controls: [
      { key: 'maxBubbleSize', label: 'Tamaño máximo', type: 'slider' as const, defaultValue: 60, min: 20, max: 120 },
      { key: 'opacity', label: 'Opacidad', type: 'slider' as const, defaultValue: 70, min: 10, max: 100 },
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
  const rawSizes = data.map((r) => Number(r[sizeCol] ?? 0))
  const maxSize = Math.max(...rawSizes)
  const maxBubble = (config.maxBubbleSize as number) ?? 60
  const opacity = (config.opacity as number) / 100

  const points = data.map((r, i) => ({
    value: [Number(r[config.xAxis] ?? 0), Number(r[config.yAxis] ?? 0), rawSizes[i]],
    symbolSize: maxSize > 0 ? (rawSizes[i] / maxSize) * maxBubble + 8 : 16,
    itemStyle: { color: theme.colors[i % theme.colors.length], opacity },
  }))

  return {
    backgroundColor: theme.backgroundColor,
    title: config.title ? { text: config.title as string, textStyle: { color: '#fff', fontFamily: theme.fontFamily, fontSize: 16 }, left: 'center', top: 12 } : undefined,
    tooltip: {
      formatter: (params: unknown) => {
        const p = params as { value: number[] }
        return `${config.xAxis}: ${p.value[0]}<br/>${config.yAxis}: ${p.value[1]}<br/>${sizeCol}: ${p.value[2]}`
      },
      backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', textStyle: { color: '#fff' },
    },
    grid: { top: config.title ? 56 : 24, left: 48, right: 24, bottom: 40, containLabel: true },
    xAxis: { type: 'value', name: config.xAxis, nameTextStyle: { color: theme.textColor }, axisLabel: { color: theme.textColor, fontSize: theme.fontSize }, splitLine: { lineStyle: { color: config.showGrid ? theme.gridColor : 'transparent' } }, axisLine: { lineStyle: { color: 'transparent' } } },
    yAxis: { type: 'value', name: config.yAxis, nameTextStyle: { color: theme.textColor }, axisLabel: { color: theme.textColor, fontSize: theme.fontSize }, splitLine: { lineStyle: { color: config.showGrid ? theme.gridColor : 'transparent' } }, axisLine: { lineStyle: { color: 'transparent' } } },
    series: [{ type: 'scatter', data: points, label: config.showLabels ? { show: true, color: '#fff', fontSize: 10 } : { show: false } }],
  }
}

export const BubbleChart: ChartPlugin = {
  id: 'bubble', name: 'Burbujas', description: 'Comparar 3 variables con tamaño',
  icon: 'CircleDot', category: 'correlation',
  configSections: BUBBLE_SECTIONS,
  defaultConfig: { xAxis: '', yAxis: '', sizeAxis: '', title: '', showLegend: false, showGrid: true, smooth: false, barRadius: 0, opacity: 70, labelPosition: '', seriesType: 'scatter', maxBubbleSize: 60, showLabels: false, numericColumns: [] },
  buildOption,
}

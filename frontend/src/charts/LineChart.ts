import type { EChartsOption } from 'echarts'
import type { ChartPlugin, ChartConfig } from '@/types/chart.types'
import type { DataRow } from '@/types/data.types'
import type { Theme } from '@/types/theme.types'

const LINE_CONFIG_SECTIONS = [
  {
    id: 'data',
    label: 'Datos',
    controls: [
      { key: 'xAxis', label: 'Eje X (categorías)', type: 'select' as const, defaultValue: '' },
      { key: 'yAxis', label: 'Eje Y (valores)', type: 'select' as const, defaultValue: '' },
      { key: 'title', label: 'Título del gráfico', type: 'text' as const, defaultValue: '' },
    ],
  },
  {
    id: 'style',
    label: 'Estilo',
    controls: [
      { key: 'smooth', label: 'Línea suavizada', type: 'switch' as const, defaultValue: true },
      { key: 'showArea', label: 'Mostrar área', type: 'switch' as const, defaultValue: true },
      { key: 'lineWidth', label: 'Grosor de línea', type: 'slider' as const, defaultValue: 3, min: 1, max: 8 },
      { key: 'showPoints', label: 'Mostrar puntos', type: 'switch' as const, defaultValue: true },
    ],
  },
  {
    id: 'display',
    label: 'Visualización',
    controls: [
      { key: 'showLegend', label: 'Mostrar leyenda', type: 'switch' as const, defaultValue: false },
      { key: 'showGrid', label: 'Mostrar cuadrícula', type: 'switch' as const, defaultValue: true },
      { key: 'showLabels', label: 'Mostrar etiquetas', type: 'switch' as const, defaultValue: false },
    ],
  },
]

function buildOption(data: DataRow[], config: ChartConfig, theme: Theme): EChartsOption {
  const categories = data.map((r) => String(r[config.xAxis] ?? ''))
  const values = data.map((r) => Number(r[config.yAxis] ?? 0))
  const color = theme.colors[0]
  const showArea = config.showArea as boolean

  const areaStyle = showArea
    ? {
        color: {
          type: 'linear' as const,
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: `${color}55` },
            { offset: 1, color: `${color}00` },
          ],
        },
      }
    : undefined

  return {
    backgroundColor: theme.backgroundColor,
    title: config.title ? { text: config.title, textStyle: { color: '#fff', fontFamily: theme.fontFamily, fontSize: 16 }, left: 'center', top: 12 } : undefined,
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', textStyle: { color: '#fff' } },
    legend: config.showLegend ? { textStyle: { color: theme.textColor }, bottom: 0 } : undefined,
    grid: { top: config.title ? 56 : 24, left: 48, right: 24, bottom: 40, containLabel: true },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: { color: theme.textColor, fontSize: theme.fontSize, rotate: categories.length > 10 ? 30 : 0 },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: theme.textColor, fontSize: theme.fontSize },
      splitLine: { lineStyle: { color: config.showGrid ? theme.gridColor : 'transparent' } },
      axisLine: { lineStyle: { color: 'transparent' } },
    },
    series: [
      {
        type: 'line',
        data: values,
        smooth: config.smooth as boolean,
        symbol: (config.showPoints as boolean) ? 'circle' : 'none',
        symbolSize: 6,
        lineStyle: { color, width: config.lineWidth as number, shadowBlur: 12, shadowColor: `${color}55` },
        itemStyle: { color, borderWidth: 2, borderColor: '#fff' },
        areaStyle,
        label: config.showLabels ? { show: true, color: '#fff', fontSize: 10 } : { show: false },
        emphasis: { scale: true, itemStyle: { shadowBlur: 20, shadowColor: `${color}88` } },
      },
    ],
  }
}

export const LineChart: ChartPlugin = {
  id: 'line',
  name: 'Líneas',
  description: 'Mostrar tendencias y evolución temporal',
  icon: 'TrendingUp',
  category: 'trend',
  configSections: LINE_CONFIG_SECTIONS,
  defaultConfig: {
    xAxis: '',
    yAxis: '',
    title: '',
    showLegend: false,
    showGrid: true,
    smooth: true,
    barRadius: 0,
    opacity: 100,
    labelPosition: 'top',
    seriesType: 'line',
    showArea: true,
    lineWidth: 3,
    showPoints: true,
    showLabels: false,
  },
  buildOption,
}

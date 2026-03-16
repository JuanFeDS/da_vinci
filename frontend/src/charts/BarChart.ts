import type { EChartsOption } from 'echarts'
import type { ChartPlugin, ChartConfig } from '@/types/chart.types'
import type { DataRow } from '@/types/data.types'
import type { Theme } from '@/types/theme.types'

const BAR_CONFIG_SECTIONS = [
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
      { key: 'barRadius', label: 'Radio de barras', type: 'slider' as const, defaultValue: 6, min: 0, max: 20 },
      { key: 'opacity', label: 'Opacidad', type: 'slider' as const, defaultValue: 90, min: 10, max: 100 },
      { key: 'useGradient', label: 'Gradiente', type: 'switch' as const, defaultValue: true },
      { key: 'horizontal', label: 'Horizontal', type: 'switch' as const, defaultValue: false },
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
  const isHorizontal = config.horizontal as boolean
  const useGradient = config.useGradient as boolean
  const opacity = (config.opacity as number) / 100

  const itemStyle = useGradient
    ? {
        color: {
          type: 'linear' as const,
          x: isHorizontal ? 0 : 0,
          y: isHorizontal ? 0 : 1,
          x2: isHorizontal ? 1 : 0,
          y2: isHorizontal ? 0 : 0,
          colorStops: [
            { offset: 0, color: theme.colors[1] ?? color },
            { offset: 1, color },
          ],
        },
        opacity,
        borderRadius: config.barRadius as number,
      }
    : { color, opacity, borderRadius: config.barRadius as number }

  return {
    backgroundColor: theme.backgroundColor,
    title: config.title ? { text: config.title, textStyle: { color: '#fff', fontFamily: theme.fontFamily, fontSize: 16 }, left: 'center', top: 12 } : undefined,
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', textStyle: { color: '#fff' } },
    legend: config.showLegend ? { textStyle: { color: theme.textColor }, bottom: 0 } : undefined,
    grid: { top: config.title ? 56 : 24, left: 48, right: 24, bottom: 40, containLabel: true },
    xAxis: isHorizontal
      ? { type: 'value', axisLabel: { color: theme.textColor, fontSize: theme.fontSize }, splitLine: { lineStyle: { color: config.showGrid ? theme.gridColor : 'transparent' } }, axisLine: { lineStyle: { color: 'transparent' } } }
      : { type: 'category', data: categories, axisLabel: { color: theme.textColor, fontSize: theme.fontSize, rotate: categories.length > 8 ? 30 : 0 }, axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }, splitLine: { show: false } },
    yAxis: isHorizontal
      ? { type: 'category', data: categories, axisLabel: { color: theme.textColor, fontSize: theme.fontSize }, axisLine: { lineStyle: { color: 'transparent' } } }
      : { type: 'value', axisLabel: { color: theme.textColor, fontSize: theme.fontSize }, splitLine: { lineStyle: { color: config.showGrid ? theme.gridColor : 'transparent' } }, axisLine: { lineStyle: { color: 'transparent' } } },
    series: [
      {
        type: 'bar',
        data: values,
        itemStyle,
        label: config.showLabels ? { show: true, color: '#fff', fontSize: 11 } : { show: false },
        emphasis: { itemStyle: { opacity: 1, shadowBlur: 16, shadowColor: `${color}66` } },
      },
    ],
  }
}

export const BarChart: ChartPlugin = {
  id: 'bar',
  name: 'Barras',
  description: 'Comparar valores entre categorías',
  icon: 'BarChart2',
  category: 'comparison',
  configSections: BAR_CONFIG_SECTIONS,
  defaultConfig: {
    xAxis: '',
    yAxis: '',
    title: '',
    showLegend: false,
    showGrid: true,
    smooth: false,
    barRadius: 6,
    opacity: 90,
    labelPosition: 'top',
    seriesType: 'bar',
    useGradient: true,
    horizontal: false,
    showLabels: false,
    numericColumns: [],
  },
  buildOption,
}

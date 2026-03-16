import type { EChartsOption } from 'echarts'
import type { ChartPlugin, ChartConfig } from '@/types/chart.types'
import type { DataRow } from '@/types/data.types'
import type { Theme } from '@/types/theme.types'

const SCATTER_CONFIG_SECTIONS = [
  {
    id: 'data',
    label: 'Datos',
    controls: [
      { key: 'xAxis', label: 'Eje X', type: 'select' as const, defaultValue: '' },
      { key: 'yAxis', label: 'Eje Y', type: 'select' as const, defaultValue: '' },
      { key: 'title', label: 'Título del gráfico', type: 'text' as const, defaultValue: '' },
    ],
  },
  {
    id: 'style',
    label: 'Estilo',
    controls: [
      { key: 'pointSize', label: 'Tamaño de puntos', type: 'slider' as const, defaultValue: 10, min: 4, max: 30 },
      { key: 'opacity', label: 'Opacidad', type: 'slider' as const, defaultValue: 80, min: 10, max: 100 },
      { key: 'showGlow', label: 'Efecto glow', type: 'switch' as const, defaultValue: true },
    ],
  },
  {
    id: 'display',
    label: 'Visualización',
    controls: [
      { key: 'showLegend', label: 'Mostrar leyenda', type: 'switch' as const, defaultValue: false },
      { key: 'showGrid', label: 'Mostrar cuadrícula', type: 'switch' as const, defaultValue: true },
    ],
  },
]

function buildOption(data: DataRow[], config: ChartConfig, theme: Theme): EChartsOption {
  const scatterData = data.map((r) => [
    Number(r[config.xAxis] ?? 0),
    Number(r[config.yAxis] ?? 0),
  ])
  const color = theme.colors[0]
  const opacity = (config.opacity as number) / 100
  const showGlow = config.showGlow as boolean

  return {
    backgroundColor: theme.backgroundColor,
    title: config.title ? { text: config.title, textStyle: { color: '#fff', fontFamily: theme.fontFamily, fontSize: 16 }, left: 'center', top: 12 } : undefined,
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(0,0,0,0.8)',
      borderColor: 'rgba(255,255,255,0.1)',
      textStyle: { color: '#fff' },
      formatter: (params: unknown) => {
        const p = params as { value: number[] }
        return `${config.xAxis}: ${p.value[0]}<br/>${config.yAxis}: ${p.value[1]}`
      },
    },
    legend: config.showLegend ? { textStyle: { color: theme.textColor }, bottom: 0 } : undefined,
    grid: { top: config.title ? 56 : 24, left: 48, right: 24, bottom: 40, containLabel: true },
    xAxis: {
      type: 'value',
      name: config.xAxis,
      nameTextStyle: { color: theme.textColor },
      axisLabel: { color: theme.textColor, fontSize: theme.fontSize },
      splitLine: { lineStyle: { color: config.showGrid ? theme.gridColor : 'transparent' } },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
    },
    yAxis: {
      type: 'value',
      name: config.yAxis,
      nameTextStyle: { color: theme.textColor },
      axisLabel: { color: theme.textColor, fontSize: theme.fontSize },
      splitLine: { lineStyle: { color: config.showGrid ? theme.gridColor : 'transparent' } },
      axisLine: { lineStyle: { color: 'transparent' } },
    },
    series: [
      {
        type: 'scatter',
        data: scatterData,
        symbolSize: config.pointSize as number,
        itemStyle: {
          color,
          opacity,
          shadowBlur: showGlow ? 16 : 0,
          shadowColor: showGlow ? `${color}88` : 'transparent',
        },
        emphasis: {
          itemStyle: { opacity: 1, shadowBlur: 24, shadowColor: `${color}aa` },
          scale: 1.3,
        },
      },
    ],
  }
}

export const ScatterChart: ChartPlugin = {
  id: 'scatter',
  name: 'Dispersión',
  description: 'Explorar correlaciones entre variables',
  icon: 'ScatterChart',
  category: 'correlation',
  configSections: SCATTER_CONFIG_SECTIONS,
  defaultConfig: {
    xAxis: '',
    yAxis: '',
    title: '',
    showLegend: false,
    showGrid: true,
    smooth: false,
    barRadius: 0,
    opacity: 80,
    labelPosition: 'top',
    seriesType: 'scatter',
    pointSize: 10,
    showGlow: true,
    numericColumns: [],
  },
  buildOption,
}

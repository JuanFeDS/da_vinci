import type { EChartsOption } from 'echarts'
import type { ChartPlugin, ChartConfig } from '@/types/chart.types'
import type { DataRow } from '@/types/data.types'
import type { Theme } from '@/types/theme.types'

const PIE_CONFIG_SECTIONS = [
  {
    id: 'data',
    label: 'Datos',
    controls: [
      { key: 'xAxis', label: 'Categorías', type: 'select' as const, defaultValue: '' },
      { key: 'yAxis', label: 'Valores', type: 'select' as const, defaultValue: '' },
      { key: 'title', label: 'Título del gráfico', type: 'text' as const, defaultValue: '' },
    ],
  },
  {
    id: 'style',
    label: 'Estilo',
    controls: [
      { key: 'donut', label: 'Modo donut', type: 'switch' as const, defaultValue: false },
      { key: 'donutSize', label: 'Tamaño del hueco', type: 'slider' as const, defaultValue: 50, min: 20, max: 80 },
      { key: 'roseType', label: 'Tipo rosa', type: 'switch' as const, defaultValue: false },
      { key: 'borderRadius', label: 'Radio de borde', type: 'slider' as const, defaultValue: 4, min: 0, max: 16 },
    ],
  },
  {
    id: 'display',
    label: 'Visualización',
    controls: [
      { key: 'showLegend', label: 'Mostrar leyenda', type: 'switch' as const, defaultValue: true },
      { key: 'showLabels', label: 'Mostrar etiquetas', type: 'switch' as const, defaultValue: true },
      { key: 'showValues', label: 'Mostrar valores', type: 'switch' as const, defaultValue: false },
    ],
  },
]

function buildOption(data: DataRow[], config: ChartConfig, theme: Theme): EChartsOption {
  const isDonut = config.donut as boolean
  const innerRadius = isDonut ? `${config.donutSize as number}%` : '0%'

  const pieData = data.map((r, i) => ({
    name: String(r[config.xAxis] ?? `Item ${i}`),
    value: Number(r[config.yAxis] ?? 0),
    itemStyle: { color: theme.colors[i % theme.colors.length] },
  }))

  const labelFormatter = config.showValues
    ? '{b}: {c} ({d}%)'
    : '{b}: {d}%'

  return {
    backgroundColor: theme.backgroundColor,
    title: config.title ? { text: config.title, textStyle: { color: '#fff', fontFamily: theme.fontFamily, fontSize: 16 }, left: 'center', top: 12 } : undefined,
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(0,0,0,0.8)',
      borderColor: 'rgba(255,255,255,0.1)',
      textStyle: { color: '#fff' },
      formatter: '{b}: {c} ({d}%)',
    },
    legend: config.showLegend
      ? { orient: 'horizontal', bottom: 8, textStyle: { color: theme.textColor, fontSize: theme.fontSize } }
      : undefined,
    series: [
      {
        type: 'pie',
        radius: [innerRadius, '70%'],
        center: ['50%', '50%'],
        roseType: (config.roseType as boolean) ? 'area' : undefined,
        data: pieData,
        label: config.showLabels
          ? { show: true, formatter: labelFormatter, color: theme.textColor, fontSize: theme.fontSize }
          : { show: false },
        labelLine: config.showLabels ? { lineStyle: { color: 'rgba(255,255,255,0.3)' } } : undefined,
        itemStyle: { borderRadius: config.borderRadius as number, borderColor: theme.backgroundColor, borderWidth: 2 },
        emphasis: { itemStyle: { shadowBlur: 20, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.5)' }, scaleSize: 8 },
      },
    ],
  }
}

export const PieChart: ChartPlugin = {
  id: 'pie',
  name: 'Circular',
  description: 'Mostrar proporciones y composición',
  icon: 'PieChart',
  category: 'proportion',
  configSections: PIE_CONFIG_SECTIONS,
  defaultConfig: {
    xAxis: '',
    yAxis: '',
    title: '',
    showLegend: true,
    showGrid: false,
    smooth: false,
    barRadius: 0,
    opacity: 100,
    labelPosition: 'outside',
    seriesType: 'pie',
    donut: false,
    donutSize: 50,
    roseType: false,
    borderRadius: 4,
    showLabels: true,
    showValues: false,
  },
  buildOption,
}

import type { EChartsOption } from 'echarts'
import type { ChartPlugin, ChartConfig } from '@/types/chart.types'
import type { DataRow } from '@/types/data.types'
import type { Theme } from '@/types/theme.types'
import { getOverrideForItem } from './utils/colorResolver'

const DONUT_SECTIONS = [
  {
    id: 'data', label: 'Datos',
    controls: [
      { key: 'xAxis', label: 'Etiqueta (categoría)', type: 'select' as const, defaultValue: '' },
      { key: 'yAxis', label: 'Valor (numérico)', type: 'select' as const, defaultValue: '' },
      { key: 'title', label: 'Título del gráfico', type: 'text' as const, defaultValue: '' },
    ],
  },
  {
    id: 'style', label: 'Estilo',
    controls: [
      { key: 'innerRadius', label: 'Radio interior (%)', type: 'slider' as const, defaultValue: 40, min: 20, max: 70 },
      { key: 'outerRadius', label: 'Radio exterior (%)', type: 'slider' as const, defaultValue: 70, min: 40, max: 85 },
      { key: 'roseType', label: 'Modo Rosa (radios)', type: 'switch' as const, defaultValue: false },
    ],
  },
  {
    id: 'display', label: 'Visualización',
    controls: [
      { key: 'showLegend', label: 'Mostrar leyenda', type: 'switch' as const, defaultValue: true },
      { key: 'showLabels', label: 'Mostrar etiquetas', type: 'switch' as const, defaultValue: true },
    ],
  },
]

function buildOption(data: DataRow[], config: ChartConfig, theme: Theme): EChartsOption {
  const inner = `${config.innerRadius ?? 40}%`
  const outer = `${config.outerRadius ?? 70}%`

  const overrides = config.elementOverrides as Record<string, Record<string, unknown>>
  const donutData = data.map((r, i) => {
    const ov = getOverrideForItem(overrides, 0, i)
    const baseColor = theme.colors[i % theme.colors.length]
    return {
      name: String(r[config.xAxis] ?? `Item ${i}`),
      value: Number(r[config.yAxis] ?? 0),
      metaIndex: i,
      itemStyle: { color: ov.color ?? baseColor, opacity: ov.opacity !== undefined ? (ov.opacity as number) / 100 : 1 },
    }
  })

  return {
    backgroundColor: theme.backgroundColor,
    title: config.title
      ? { text: config.title as string, textStyle: { color: '#fff', fontFamily: theme.fontFamily, fontSize: 16 }, left: 'center', top: 12 }
      : undefined,
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)', backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', textStyle: { color: '#fff' } },
    legend: config.showLegend ? { orient: 'horizontal', bottom: 0, textStyle: { color: theme.textColor } } : undefined,
    series: [{
      type: 'pie',
      radius: [inner, outer],
      center: ['50%', '50%'],
      roseType: (config.roseType as boolean) ? 'radius' : undefined,
      data: donutData,
      label: config.showLabels
        ? { show: true, color: theme.textColor, fontSize: theme.fontSize, formatter: '{b}\n{d}%' }
        : { show: false },
      labelLine: { show: config.showLabels as boolean, lineStyle: { color: theme.textColor } },
      emphasis: { itemStyle: { shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.5)' }, scaleSize: 8 },
    }],
  }
}

export const DonutChart: ChartPlugin = {
  id: 'donut', name: 'Dona', description: 'Proporciones con espacio central',
  icon: 'Disc', category: 'proportion',
  configSections: DONUT_SECTIONS,
  defaultConfig: { xAxis: '', yAxis: '', title: '', showLegend: true, showGrid: false, smooth: false, barRadius: 0, opacity: 100, labelPosition: '', seriesType: 'pie', innerRadius: 40, outerRadius: 70, roseType: false, showLabels: true, numericColumns: [], colorMode: 'uniform', colorField: '', colorMap: {}, elementOverrides: {} },
  buildOption,
}


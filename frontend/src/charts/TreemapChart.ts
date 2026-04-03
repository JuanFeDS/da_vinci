import type { EChartsOption } from 'echarts'
import type { ChartPlugin, ChartConfig } from '@/types/chart.types'
import type { DataRow } from '@/types/data.types'
import type { Theme } from '@/types/theme.types'
import { getOverrideForItem } from './utils/colorResolver'

const TREEMAP_SECTIONS = [
  {
    id: 'data', label: 'Datos',
    controls: [
      { key: 'xAxis', label: 'Nombre (categoría)', type: 'select' as const, defaultValue: '' },
      { key: 'yAxis', label: 'Valor (numérico)', type: 'select' as const, defaultValue: '' },
      { key: 'title', label: 'Título del gráfico', type: 'text' as const, defaultValue: '' },
    ],
  },
  {
    id: 'style', label: 'Estilo',
    controls: [
      { key: 'borderWidth', label: 'Borde entre celdas', type: 'slider' as const, defaultValue: 2, min: 0, max: 8 },
      { key: 'showBreadcrumb', label: 'Mostrar ruta', type: 'switch' as const, defaultValue: true },
    ],
  },
  {
    id: 'display', label: 'Visualización',
    controls: [
      { key: 'showLabels', label: 'Mostrar etiquetas', type: 'switch' as const, defaultValue: true },
    ],
  },
]

function buildOption(data: DataRow[], config: ChartConfig, theme: Theme): EChartsOption {
  const overrides = config.elementOverrides as Record<string, Record<string, unknown>>
  const treemapData = data.map((r, i) => {
    const ov = getOverrideForItem(overrides, 0, i)
    const baseColor = theme.colors[i % theme.colors.length]
    return {
      name: String(r[config.xAxis] ?? `Item ${i}`),
      value: Number(r[config.yAxis] ?? 0),
      metaIndex: i,
      itemStyle: { color: ov.color ?? baseColor, opacity: ov.opacity !== undefined ? (ov.opacity as number) / 100 : 1, borderColor: theme.backgroundColor, borderWidth: (config.borderWidth as number) ?? 2 },
    }
  })

  return {
    backgroundColor: theme.backgroundColor,
    title: config.title
      ? { text: config.title as string, textStyle: { color: '#fff', fontFamily: theme.fontFamily, fontSize: 16 }, left: 'center', top: 12 }
      : undefined,
    tooltip: {
      formatter: (p: unknown) => { const d = p as { name: string; value: number }; return `${d.name}: ${d.value}` },
      backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', textStyle: { color: '#fff' },
    },
    series: [{
      type: 'treemap',
      data: treemapData,
      top: config.title ? 56 : 8,
      bottom: (config.showBreadcrumb as boolean) ? 36 : 8,
      left: 8,
      right: 8,
      roam: false,
      nodeClick: false,
      breadcrumb: { show: config.showBreadcrumb as boolean, bottom: 0, itemStyle: { color: 'rgba(255,255,255,0.08)', textStyle: { color: theme.textColor } } },
      label: config.showLabels
        ? { show: true, color: '#fff', fontSize: 12, fontWeight: 'bold' as const, overflow: 'truncate' }
        : { show: false },
      upperLabel: { show: false },
      levels: [{ itemStyle: { borderWidth: (config.borderWidth as number) ?? 2, gapWidth: (config.borderWidth as number) ?? 2, borderColor: theme.backgroundColor } }],
      emphasis: { itemStyle: { shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.5)' } },
    }],
  }
}

export const TreemapChart: ChartPlugin = {
  id: 'treemap', name: 'Mapa de Árbol', description: 'Proporciones jerárquicas por área',
  icon: 'SquareStack', category: 'proportion',
  configSections: TREEMAP_SECTIONS,
  defaultConfig: { xAxis: '', yAxis: '', title: '', showLegend: false, showGrid: false, smooth: false, barRadius: 0, opacity: 100, labelPosition: '', seriesType: 'treemap', borderWidth: 2, showBreadcrumb: true, showLabels: true, numericColumns: [], colorMode: 'uniform', colorField: '', colorMap: {}, elementOverrides: {} },
  buildOption,
}


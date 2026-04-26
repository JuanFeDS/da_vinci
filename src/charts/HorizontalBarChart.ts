import type { EChartsOption } from 'echarts'
import type { ChartPlugin, ChartConfig } from '@/types/chart.types'
import type { DataRow } from '@/types/data.types'
import type { Theme } from '@/types/theme.types'
import { resolveItemColor, getOverrideForItem } from './utils/colorResolver'
import { compactNumber } from './utils/numberFormat'

const HORIZONTAL_BAR_SECTIONS = [
  {
    id: 'data',
    label: 'Datos',
    controls: [
      { key: 'xAxis', label: 'Categorías', type: 'select' as const, defaultValue: '' },
      { key: 'yAxis', label: 'Valores',    type: 'select' as const, defaultValue: '' },
      { key: 'title', label: 'Título del gráfico', type: 'text' as const, defaultValue: '' },
    ],
  },
  {
    id: 'style',
    label: 'Estilo',
    controls: [
      { key: 'barRadius', label: 'Radio de barras', type: 'slider' as const, defaultValue: 6, min: 0, max: 20 },
      { key: 'opacity',   label: 'Opacidad',        type: 'slider' as const, defaultValue: 90, min: 10, max: 100 },
      { key: 'useGradient', label: 'Gradiente',     type: 'switch' as const, defaultValue: true },
    ],
  },
  {
    id: 'display',
    label: 'Visualización',
    controls: [
      { key: 'showLegend',  label: 'Mostrar leyenda',       type: 'switch' as const, defaultValue: false },
      { key: 'showGrid',    label: 'Mostrar cuadrícula',    type: 'switch' as const, defaultValue: true  },
      { key: 'showLabels',  label: 'Mostrar etiquetas',     type: 'switch' as const, defaultValue: false },
      { key: 'showAllTicks', label: 'Forzar todos los ticks', type: 'switch' as const, defaultValue: false },
    ],
  },
]

function buildOption(data: DataRow[], config: ChartConfig, theme: Theme): EChartsOption {
  const mergedGroups = (config.mergedGroups as { label: string; members: string[] }[] | undefined) ?? []
  let workingData = [...data]
  for (const group of mergedGroups) {
    const memberSet  = new Set(group.members)
    const memberRows = workingData.filter((r) => memberSet.has(String(r[config.xAxis] ?? '')))
    if (memberRows.length === 0) continue
    const sum = memberRows.reduce((acc, r) => acc + Number(r[config.yAxis] ?? 0), 0)
    workingData = [
      ...workingData.filter((r) => !memberSet.has(String(r[config.xAxis] ?? ''))),
      { [config.xAxis]: group.label, [config.yAxis]: sum },
    ]
  }

  const categoryOrder = config.categoryOrder as string[] | undefined
  if (categoryOrder && categoryOrder.length > 0) {
    workingData = [...workingData].sort((a, b) => {
      const ai = categoryOrder.indexOf(String(a[config.xAxis] ?? ''))
      const bi = categoryOrder.indexOf(String(b[config.xAxis] ?? ''))
      return (ai === -1 ? 99999 : ai) - (bi === -1 ? 99999 : bi)
    })
  } else {
    // Default: sort descending by value — after reverse, largest ends up at top
    workingData = [...workingData].sort((a, b) =>
      Number(b[config.yAxis] ?? 0) - Number(a[config.yAxis] ?? 0)
    )
  }

  // ECharts renders category axis bottom-to-top; reverse so the first item appears at the top
  workingData = [...workingData].reverse()

  const categories   = workingData.map((r) => String(r[config.xAxis] ?? ''))
  const overrides    = config.elementOverrides as Record<string, Record<string, unknown>>
  const useGradient  = config.useGradient as boolean
  const opacity      = (config.opacity as number) / 100
  const colorMode    = config.colorMode as string
  const showAllTicks = config.showAllTicks as boolean
  const labelOverrides    = (config.labelOverrides as Record<string, string> | undefined) ?? {}
  const hasLabelOverrides = Object.keys(labelOverrides).length > 0
  const labelFormatter    = hasLabelOverrides ? (value: string) => labelOverrides[value] ?? value : undefined
  const baseColor = theme.colors[0]

  const seriesData = workingData.map((row, i) => {
    const ov           = getOverrideForItem(overrides, 0, i)
    const resolvedBase = colorMode === 'uniform' ? baseColor : resolveItemColor(i, row, config, theme)
    const finalColor   = (ov.color as string | undefined) ?? resolvedBase
    const finalOpacity = ov.opacity !== undefined ? (ov.opacity as number) / 100 : opacity
    const finalBorder  = ov.borderColor ? { borderColor: ov.borderColor, borderWidth: (ov.borderWidth as number | undefined) ?? 1 } : {}
    const itemStyle    = useGradient && colorMode === 'uniform' && !ov.color
      ? {
          color: { type: 'linear' as const, x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [{ offset: 0, color: theme.colors[1] ?? finalColor }, { offset: 1, color: finalColor }] },
          opacity: finalOpacity, borderRadius: config.barRadius as number, ...finalBorder,
        }
      : { color: finalColor, opacity: finalOpacity, borderRadius: config.barRadius as number, ...finalBorder }

    const labelOverride = ov.labelShow !== undefined
      ? { show: ov.labelShow as boolean, formatter: (ov.labelText as string | undefined) ?? undefined, color: '#fff', fontSize: 11 }
      : undefined

    return {
      value:     Number(row[config.yAxis] ?? 0),
      name:      categories[i],
      metaIndex: i,
      itemStyle,
      label: labelOverride,
    }
  })

  return {
    backgroundColor: theme.backgroundColor,
    title: config.title ? { text: config.title, textStyle: { color: '#fff', fontFamily: theme.fontFamily, fontSize: 16 }, left: 'center', top: 12 } : undefined,
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', textStyle: { color: '#fff' }, valueFormatter: (v: unknown) => compactNumber(v as number) },
    legend:  config.showLegend ? { textStyle: { color: theme.textColor }, bottom: 0 } : undefined,
    grid:    { top: config.title ? 56 : 24, left: 24, right: 32, bottom: 40, containLabel: true },
    xAxis: {
      type: 'value',
      axisLabel: { color: theme.textColor, fontSize: theme.fontSize, formatter: (v: number) => compactNumber(v) },
      splitLine: { lineStyle: { color: config.showGrid ? theme.gridColor : 'transparent' } },
      axisLine:  { lineStyle: { color: 'transparent' } },
    },
    yAxis: {
      type:         'category',
      data:         categories,
      triggerEvent: true,
      axisLabel: {
        color:    theme.textColor,
        fontSize: theme.fontSize,
        ...(showAllTicks ? { interval: 0 } : {}),
        ...(labelFormatter ? { formatter: labelFormatter } : {}),
      },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
    },
    series: [{
      type:     'bar',
      data:     seriesData,
      label:    config.showLabels ? { show: true, color: '#fff', fontSize: 11, formatter: (p: { value: unknown }) => compactNumber(p.value as number) } : { show: false },
      emphasis: { itemStyle: { opacity: 1, shadowBlur: 16, shadowColor: `${baseColor}66` } },
    }],
  }
}

export const HorizontalBarChart: ChartPlugin = {
  id:          'horizontal-bar',
  name:        'Barras Horizontales',
  description: 'Comparar categorías con barras laterales',
  icon:        'BarChartHorizontal',
  category:    'comparison',
  configSections: HORIZONTAL_BAR_SECTIONS,
  defaultConfig: {
    xAxis: '', yAxis: '', title: '',
    showLegend: false, showGrid: true,
    smooth: false, barRadius: 6, opacity: 90,
    labelPosition: 'top', seriesType: 'bar',
    useGradient: true, horizontal: true,
    showLabels: false, showAllTicks: false,
    numericColumns: [], colorMode: 'uniform', colorField: '', colorMap: {}, elementOverrides: {},
    labelOverrides: {},
  },
  buildOption,
  supportsColorBy: true,
  supportsDrag:    true,
}

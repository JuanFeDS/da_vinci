import type { EChartsOption } from 'echarts'
import type { ChartPlugin, ChartConfig } from '@/types/chart.types'
import type { DataRow } from '@/types/data.types'
import type { Theme } from '@/types/theme.types'
import { getOverrideForItem } from './utils/colorResolver'
import { compactNumber, niceMax } from './utils/numberFormat'

const AREA_SECTIONS = [
  {
    id: 'data', label: 'Datos',
    controls: [
      { key: 'xAxis',    label: 'Eje X (categorías)',   type: 'select' as const, defaultValue: '' },
      { key: 'valueCol', label: 'Columna de valor (Y)',  type: 'select' as const, defaultValue: '' },
      { key: 'stackCol', label: 'Columna de agrupación', type: 'select' as const, defaultValue: '' },
      { key: 'title',      label: 'Título del gráfico', type: 'text' as const, defaultValue: '' },
      { key: 'xAxisTitle', label: 'Título eje X',      type: 'text' as const, defaultValue: '' },
      { key: 'yAxisTitle', label: 'Título eje Y',      type: 'text' as const, defaultValue: '' },
    ],
  },
  {
    id: 'style', label: 'Estilo',
    controls: [
      { key: 'smooth',      label: 'Línea suavizada',   type: 'switch' as const, defaultValue: true },
      { key: 'lineWidth',   label: 'Grosor de línea',   type: 'slider' as const, defaultValue: 2, min: 1, max: 8 },
      { key: 'fillOpacity', label: 'Opacidad relleno',  type: 'slider' as const, defaultValue: 60, min: 5, max: 100 },
      { key: 'showPoints',  label: 'Mostrar puntos',    type: 'switch' as const, defaultValue: false },
    ],
  },
  {
    id: 'display', label: 'Visualización',
    controls: [
      { key: 'showLegend',    label: 'Mostrar leyenda',    type: 'switch' as const, defaultValue: true },
      { key: 'legendPosition', label: 'Posición leyenda',  type: 'select' as const, defaultValue: 'bottom', options: [{ label: 'Abajo', value: 'bottom' }, { label: 'Arriba', value: 'top' }, { label: 'Izquierda', value: 'left' }, { label: 'Derecha', value: 'right' }] },
      { key: 'showGrid',      label: 'Mostrar cuadrícula', type: 'switch' as const, defaultValue: true },
      { key: 'percentMode',   label: 'Modo 100%',          type: 'switch' as const, defaultValue: false },
      { key: 'showDataZoom',  label: 'Barra de rango (X)', type: 'switch' as const, defaultValue: false },
    ],
  },
]

function buildOption(data: DataRow[], config: ChartConfig, theme: Theme): EChartsOption {
  const xAxisCol   = config.xAxis     as string
  const valueCol   = config.valueCol  as string
  const stackCol   = config.stackCol  as string
  const xAxisTitle = (config.xAxisTitle as string | undefined) ?? ''
  const yAxisTitle = (config.yAxisTitle as string | undefined) ?? ''
  const fillOpacity = ((config.fillOpacity as number) ?? 60) / 100
  const overrides  = config.elementOverrides as Record<string, Record<string, unknown>>

  // Unique categories in order of first appearance
  const categoriesOrdered: string[] = []
  const categorySeen = new Set<string>()
  data.forEach((r) => {
    const cat = String(r[xAxisCol] ?? '')
    if (!categorySeen.has(cat)) { categorySeen.add(cat); categoriesOrdered.push(cat) }
  })

  // Unique stack values in order of first appearance → one series each
  const stackValuesOrdered: string[] = []
  const stackSeen = new Set<string>()
  data.forEach((r) => {
    const sv = String(r[stackCol] ?? '')
    if (!stackSeen.has(sv)) { stackSeen.add(sv); stackValuesOrdered.push(sv) }
  })

  // Aggregate: (category, stackValue) → sum of valueCol
  const agg = new Map<string, Map<string, number>>()
  data.forEach((r) => {
    const cat = String(r[xAxisCol] ?? '')
    const sv  = String(r[stackCol]  ?? '')
    const val = Number(r[valueCol]  ?? 0)
    if (!agg.has(cat)) agg.set(cat, new Map())
    const catMap = agg.get(cat)!
    catMap.set(sv, (catMap.get(sv) ?? 0) + val)
  })

  // Sort series by value at last category, smallest first (largest on top)
  const lastCat = categoriesOrdered[categoriesOrdered.length - 1]
  if (lastCat !== undefined) {
    stackValuesOrdered.sort((a, b) =>
      (agg.get(lastCat)?.get(a) ?? 0) - (agg.get(lastCat)?.get(b) ?? 0)
    )
  }

  const percentMode = config.percentMode as boolean

  // Compute per-category totals (needed for percent mode normalization AND for Y axis max)
  const catTotals = new Map<string, number>()
  categoriesOrdered.forEach((cat) => {
    let total = 0
    stackValuesOrdered.forEach((sv) => { total += agg.get(cat)?.get(sv) ?? 0 })
    catTotals.set(cat, total)
  })

  const maxStackTotal = Math.max(0, ...Array.from(catTotals.values()))
  const yAxisMax = percentMode ? 100 : niceMax(maxStackTotal)

  const labelOverrides      = (config.labelOverrides      as Record<string, string> | undefined) ?? {}
  const seriesNameOverrides = (config.seriesNameOverrides as Record<string, string> | undefined) ?? {}
  const hasLabelOverrides   = Object.keys(labelOverrides).length > 0
  const labelFormatter      = hasLabelOverrides ? (value: string) => labelOverrides[value] ?? value : undefined

  const series = stackValuesOrdered.map((sv, seriesIdx) => {
    const color = theme.colors[seriesIdx % theme.colors.length]
    const hexAlpha = Math.round(fillOpacity * 255).toString(16).padStart(2, '0')

    return {
      name: seriesNameOverrides[sv] ?? sv,
      type: 'line' as const,
      stack: 'total',
      smooth: config.smooth as boolean,
      symbol: (config.showPoints as boolean) ? 'circle' : 'none',
      symbolSize: 5,
      lineStyle: { color, width: config.lineWidth as number },
      itemStyle: { color },
      areaStyle: {
        color: {
          type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: `${color}${hexAlpha}` }, { offset: 1, color: `${color}15` }],
        },
      },
      data: categoriesOrdered.map((cat, dataIdx) => {
        const ov = getOverrideForItem(overrides, seriesIdx, dataIdx)
        const rawValue = agg.get(cat)?.get(sv) ?? 0
        const total = catTotals.get(cat) ?? 1
        const displayValue = percentMode ? (total === 0 ? 0 : (rawValue / total) * 100) : rawValue
        return {
          value: displayValue,
          name: cat,
          metaIndex: dataIdx,
          itemStyle: ov.color ? { color: ov.color, opacity: ov.opacity !== undefined ? (ov.opacity as number) / 100 : 1 } : undefined,
        }
      }),
      emphasis: { focus: 'series' as const },
    }
  })

  const showLegend     = config.showLegend     as boolean
  const legendPosition = (config.legendPosition as string | undefined) ?? 'bottom'
  const showDataZoom   = config.showDataZoom   as boolean

  const legendIsBottom = showLegend && legendPosition === 'bottom'
  const legendIsTop    = showLegend && legendPosition === 'top'
  const legendIsLeft   = showLegend && legendPosition === 'left'
  const legendIsRight  = showLegend && legendPosition === 'right'
  const bottomSpace = (legendIsBottom ? 28 : 0) + (showDataZoom ? 40 : 0) + (legendIsBottom || showDataZoom ? 16 : 8)

  return {
    backgroundColor: theme.backgroundColor,
    title: config.title
      ? { text: config.title as string, textStyle: { color: '#fff', fontFamily: theme.fontFamily, fontSize: 16 }, left: 'center', top: 12 }
      : undefined,
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0,0,0,0.8)',
      borderColor: 'rgba(255,255,255,0.1)',
      textStyle: { color: '#fff' },
      valueFormatter: percentMode
        ? (v: unknown) => `${(v as number).toFixed(1)}%`
        : (v: unknown) => (v as number).toFixed(2),
    },
    legend: showLegend
      ? {
          textStyle: { color: theme.textColor },
          data: [...stackValuesOrdered].reverse().map((sv) => seriesNameOverrides[sv] ?? sv),
          orient: (legendIsLeft || legendIsRight) ? 'vertical' as const : 'horizontal' as const,
          ...(legendIsBottom && { bottom: showDataZoom ? 44 : 4, left: 'center' }),
          ...(legendIsTop    && { top: 4, left: 'center' }),
          ...(legendIsLeft   && { left: 4, top: 'middle', right: 'auto' }),
          ...(legendIsRight  && { right: 4, top: 'middle', left: 'auto' }),
        }
      : { show: false },
    dataZoom: showDataZoom
      ? [{ type: 'slider', xAxisIndex: 0, bottom: showLegend && legendIsBottom ? 28 : 4, height: 24, start: 0, end: 100, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.04)', fillerColor: 'rgba(124,106,255,0.15)', handleStyle: { color: '#7c6aff' }, moveHandleStyle: { color: '#7c6aff' }, textStyle: { color: theme.textColor }, dataBackground: { lineStyle: { color: 'rgba(255,255,255,0.15)' }, areaStyle: { color: 'rgba(255,255,255,0.05)' } }, selectedDataBackground: { lineStyle: { color: '#7c6aff' }, areaStyle: { color: 'rgba(124,106,255,0.1)' } } }]
      : undefined,
    grid: {
      top:    (config.title ? 56 : 24) + (legendIsTop ? 32 : 0),
      left:   legendIsLeft  ? '28%' : 48,
      right:  legendIsRight ? '28%' : 24,
      bottom: bottomSpace,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: categoriesOrdered,
      boundaryGap: false,
      triggerEvent: true,
      name: xAxisTitle || undefined,
      nameLocation: 'middle' as const,
      nameGap: 28,
      nameTextStyle: { color: theme.textColor, fontSize: theme.fontSize },
      axisLabel: { color: theme.textColor, fontSize: theme.fontSize, ...(labelFormatter ? { formatter: labelFormatter } : {}) },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: yAxisMax,
      name: yAxisTitle || undefined,
      nameLocation: 'middle' as const,
      nameGap: 48,
      nameTextStyle: { color: theme.textColor, fontSize: theme.fontSize },
      axisLabel: {
        color: theme.textColor,
        fontSize: theme.fontSize,
        formatter: percentMode ? (v: number) => `${v}%` : (v: number) => compactNumber(v),
      },
      splitLine: { lineStyle: { color: config.showGrid ? theme.gridColor : 'transparent' } },
      axisLine: { lineStyle: { color: 'transparent' } },
    },
    series,
  }
}

export const AreaChart: ChartPlugin = {
  id: 'area',
  name: 'Área',
  description: 'Volumen y tendencia acumulada',
  icon: 'AreaChart',
  category: 'trend',
  configSections: AREA_SECTIONS,
  defaultConfig: {
    xAxis: '', yAxis: '', valueCol: '', stackCol: '',
    title: '', showLegend: true, legendPosition: 'bottom', showGrid: true,
    smooth: true, barRadius: 0, opacity: 100, labelPosition: 'top', seriesType: 'line',
    fillOpacity: 60, lineWidth: 2, showPoints: false,
    percentMode: false, showDataZoom: false, legendPosition: 'bottom',
    xAxisTitle: '', yAxisTitle: '',
    labelOverrides: {}, seriesNameOverrides: {},
    numericColumns: [], colorMode: 'uniform', colorField: '', colorMap: {}, elementOverrides: {},
  },
  buildOption,
  canRender: (config) => !!(config.xAxis && config.valueCol && config.stackCol),
}

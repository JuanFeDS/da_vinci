import type { EChartsOption } from 'echarts'
import type { ChartPlugin, ChartConfig } from '@/types/chart.types'
import type { DataRow } from '@/types/data.types'
import type { Theme } from '@/types/theme.types'
import { getOverrideForItem, getEffectiveSeriesColor } from './utils/colorResolver'
import { compactNumber } from './utils/numberFormat'

const LINE_CONFIG_SECTIONS = [
  {
    id: 'data',
    label: 'Datos',
    controls: [
      { key: 'xAxis',     label: 'Eje X (categorías)',  type: 'select' as const, defaultValue: '' },
      { key: 'yAxis',     label: 'Eje Y (valores)',      type: 'select' as const, defaultValue: '' },
      { key: 'groupCol',  label: 'Agrupar por',          type: 'select' as const, defaultValue: '' },
      {
        key: 'aggFn', label: 'Agregación', type: 'select' as const, defaultValue: 'avg',
        options: [{ label: 'Promedio', value: 'avg' }, { label: 'Suma', value: 'sum' }],
      },
      { key: 'title',     label: 'Título del gráfico',   type: 'text'   as const, defaultValue: '' },
    ],
  },
  {
    id: 'style',
    label: 'Estilo',
    controls: [
      { key: 'smooth',    label: 'Línea suavizada',  type: 'switch' as const, defaultValue: true },
      { key: 'showArea',  label: 'Mostrar área',      type: 'switch' as const, defaultValue: true },
      { key: 'lineWidth', label: 'Grosor de línea',   type: 'slider' as const, defaultValue: 3, min: 1, max: 8 },
      { key: 'showPoints',  label: 'Mostrar puntos',        type: 'switch' as const, defaultValue: true },
      { key: 'symbolSize', label: 'Tamaño de puntos', type: 'slider' as const, defaultValue: 6, min: 2, max: 20 },
    ],
  },
  {
    id: 'display',
    label: 'Visualización',
    controls: [
      { key: 'showLegend', label: 'Mostrar leyenda',    type: 'switch' as const, defaultValue: false },
      { key: 'showGrid',   label: 'Mostrar cuadrícula', type: 'switch' as const, defaultValue: true },
      { key: 'showLabels', label: 'Mostrar etiquetas',  type: 'switch' as const, defaultValue: false },
      { key: 'yMin', label: 'Eje Y mínimo', type: 'number' as const, defaultValue: '', step: 1 },
      { key: 'yMax', label: 'Eje Y máximo', type: 'number' as const, defaultValue: '', step: 1 },
    ],
  },
]

function makeAreaStyle(color: string, showArea: boolean) {
  if (!showArea) return undefined
  return {
    color: {
      type: 'linear' as const,
      x: 0, y: 0, x2: 0, y2: 1,
      colorStops: [
        { offset: 0, color: `${color}55` },
        { offset: 1, color: `${color}00` },
      ],
    },
  }
}

function parseAxisBound(val: unknown): number | undefined {
  const n = Number(val)
  return (val !== '' && val !== null && val !== undefined && !isNaN(n)) ? n : undefined
}

function buildSingleOption(data: DataRow[], config: ChartConfig, theme: Theme): EChartsOption {
  const categories = data.map((r) => String(r[config.xAxis] ?? ''))
  const overrides  = config.elementOverrides as Record<string, Record<string, unknown>>
  const color      = theme.colors[0]
  const showArea   = config.showArea as boolean
  const yMin       = parseAxisBound(config.yMin)
  const yMax       = parseAxisBound(config.yMax)

  const lineData = data.map((r, i) => {
    const ov = getOverrideForItem(overrides, 0, i)
    return {
      value:     Number(r[config.yAxis] ?? 0),
      name:      categories[i],
      metaIndex: i,
      itemStyle: ov.color ? { color: ov.color, opacity: ov.opacity !== undefined ? (ov.opacity as number) / 100 : 1 } : undefined,
      label:     ov.labelShow !== undefined ? { show: ov.labelShow as boolean, formatter: ov.labelText as string | undefined } : undefined,
    }
  })

  return {
    backgroundColor: theme.backgroundColor,
    title:   config.title ? { text: config.title, textStyle: { color: '#fff', fontFamily: theme.fontFamily, fontSize: 16 }, left: 'center', top: 12 } : undefined,
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', textStyle: { color: '#fff' }, valueFormatter: (v: unknown) => compactNumber(v as number) },
    legend:  config.showLegend ? { textStyle: { color: theme.textColor }, bottom: 0 } : undefined,
    grid:    { top: config.title ? 56 : 24, left: 48, right: 24, bottom: 40, containLabel: true },
    xAxis: {
      type:      'category',
      data:      categories,
      axisLabel: { color: theme.textColor, fontSize: theme.fontSize, rotate: categories.length > 10 ? 30 : 0 },
      axisLine:  { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
      splitLine: { show: false },
    },
    yAxis: {
      type:      'value',
      min:       yMin,
      max:       yMax,
      axisLabel: { color: theme.textColor, fontSize: theme.fontSize, formatter: (v: number) => compactNumber(v) },
      splitLine: { lineStyle: { color: config.showGrid ? theme.gridColor : 'transparent' } },
      axisLine:  { lineStyle: { color: 'transparent' } },
    },
    series: [{
      type:       'line',
      data:       lineData,
      smooth:     config.smooth as boolean,
      symbol:     (config.showPoints as boolean) ? 'circle' : 'none',
      symbolSize: config.symbolSize as number,
      lineStyle:  { color, width: config.lineWidth as number, shadowBlur: 12, shadowColor: `${color}55` },
      itemStyle:  { color },
      areaStyle:  makeAreaStyle(color, showArea),
      label:      config.showLabels ? { show: true, color: '#fff', fontSize: 10, formatter: (p: { value: unknown }) => compactNumber(p.value as number) } : { show: false },
      emphasis:   { scale: true, itemStyle: { shadowBlur: 20, shadowColor: `${color}88` } },
    }],
  }
}

function buildGroupedOption(data: DataRow[], config: ChartConfig, theme: Theme, groupCol: string): EChartsOption {
  const xAxisCol = config.xAxis as string
  const valueCol = config.yAxis as string
  const showArea = config.showArea as boolean
  const overrides = config.elementOverrides as Record<string, Record<string, unknown>>
  const aggFn = (config.aggFn as string) ?? 'avg'
  const yMin  = parseAxisBound(config.yMin)
  const yMax  = parseAxisBound(config.yMax)

  // Pivot: (category, groupValue) → { sum, count }
  const categoriesOrdered: string[] = []
  const categorySeen = new Set<string>()
  const groupValuesOrdered: string[] = []
  const groupSeen = new Set<string>()
  const agg = new Map<string, Map<string, { sum: number; count: number }>>()

  data.forEach((r) => {
    const cat = String(r[xAxisCol] ?? '')
    const gv  = String(r[groupCol]  ?? '')
    const val = Number(r[valueCol]  ?? 0)
    if (!categorySeen.has(cat)) { categorySeen.add(cat); categoriesOrdered.push(cat) }
    if (!groupSeen.has(gv))     { groupSeen.add(gv);     groupValuesOrdered.push(gv) }
    if (!agg.has(cat)) agg.set(cat, new Map())
    const catMap = agg.get(cat)!
    const prev = catMap.get(gv) ?? { sum: 0, count: 0 }
    catMap.set(gv, { sum: prev.sum + val, count: prev.count + 1 })
  })

  const series = groupValuesOrdered.map((gv, seriesIdx) => {
    const baseColor      = theme.colors[seriesIdx % theme.colors.length]
    const effectiveColor = getEffectiveSeriesColor(seriesIdx, categoriesOrdered.length, overrides, baseColor)

    return {
      name:       gv,
      type:       'line' as const,
      smooth:     config.smooth as boolean,
      symbol:     (config.showPoints as boolean) ? 'circle' : 'none',
      symbolSize: config.symbolSize as number,
      lineStyle:  { color: effectiveColor, width: config.lineWidth as number, shadowBlur: 8, shadowColor: `${effectiveColor}44` },
      itemStyle:  { color: effectiveColor },
      areaStyle:  makeAreaStyle(effectiveColor, showArea),
      label:      config.showLabels ? { show: true, color: '#fff', fontSize: 10, formatter: (p: { value: unknown }) => compactNumber(p.value as number) } : { show: false },
      emphasis:   { focus: 'series' as const },
      data: categoriesOrdered.map((cat, dataIdx) => {
        const ov    = getOverrideForItem(overrides, seriesIdx, dataIdx)
        const entry = agg.get(cat)?.get(gv)
        const value = entry
          ? (aggFn === 'avg' ? entry.sum / entry.count : entry.sum)
          : 0
        return {
          value,
          name:      cat,
          metaIndex: dataIdx,
          itemStyle: ov.color
            ? { color: ov.color as string, opacity: ov.opacity !== undefined ? (ov.opacity as number) / 100 : 1 }
            : undefined,
        }
      }),
    }
  })

  return {
    backgroundColor: theme.backgroundColor,
    color:   theme.colors,
    title:   config.title ? { text: config.title, textStyle: { color: '#fff', fontFamily: theme.fontFamily, fontSize: 16 }, left: 'center', top: 12 } : undefined,
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', textStyle: { color: '#fff' }, valueFormatter: (v: unknown) => compactNumber(v as number) },
    legend:  config.showLegend ? { textStyle: { color: theme.textColor }, bottom: 0 } : undefined,
    grid:    { top: config.title ? 56 : 24, left: 48, right: 24, bottom: config.showLegend ? 48 : 40, containLabel: true },
    xAxis: {
      type:        'category',
      data:        categoriesOrdered,
      boundaryGap: false,
      axisLabel:   { color: theme.textColor, fontSize: theme.fontSize, rotate: categoriesOrdered.length > 10 ? 30 : 0 },
      axisLine:    { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
      splitLine:   { show: false },
    },
    yAxis: {
      type:      'value',
      min:       yMin,
      max:       yMax,
      axisLabel: { color: theme.textColor, fontSize: theme.fontSize, formatter: (v: number) => compactNumber(v) },
      splitLine: { lineStyle: { color: config.showGrid ? theme.gridColor : 'transparent' } },
      axisLine:  { lineStyle: { color: 'transparent' } },
    },
    series,
  }
}

function buildOption(data: DataRow[], config: ChartConfig, theme: Theme): EChartsOption {
  const groupCol = (config.groupCol as string) ?? ''
  if (groupCol) return buildGroupedOption(data, config, theme, groupCol)
  return buildSingleOption(data, config, theme)
}

export const LineChart: ChartPlugin = {
  id: 'line',
  name: 'Líneas',
  description: 'Mostrar tendencias y evolución temporal',
  icon: 'TrendingUp',
  category: 'trend',
  configSections: LINE_CONFIG_SECTIONS,
  defaultConfig: {
    xAxis: '', yAxis: '', groupCol: '', aggFn: 'avg', title: '', yMin: '', yMax: '', symbolSize: 6,
    showLegend: false, showGrid: true,
    smooth: true, barRadius: 0, opacity: 100,
    labelPosition: 'top', seriesType: 'line',
    showArea: true, lineWidth: 3, showPoints: true, showLabels: false,
    numericColumns: [], colorMode: 'uniform', colorField: '', colorMap: {}, elementOverrides: {},
  },
  buildOption,
  canRender: (config) => !!(config.xAxis && config.yAxis),
  supportsColorBy: true,
}

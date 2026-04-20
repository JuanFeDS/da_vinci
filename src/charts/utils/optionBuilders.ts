import type { EChartsOption } from 'echarts'
import type { ChartConfig } from '@/types/chart.types'
import type { DataRow } from '@/types/data.types'
import type { Theme } from '@/types/theme.types'
import { compactNumber, niceMax } from './numberFormat'

// ─── Legend position flags ────────────────────────────────────────────────────

export interface LegendFlags {
  isBottom: boolean
  isTop:    boolean
  isLeft:   boolean
  isRight:  boolean
}

export function getLegendFlags(config: ChartConfig): LegendFlags {
  const showLegend     = config.showLegend as boolean
  const legendPosition = (config.legendPosition as string | undefined) ?? 'bottom'
  return {
    isBottom: showLegend && legendPosition === 'bottom',
    isTop:    showLegend && legendPosition === 'top',
    isLeft:   showLegend && legendPosition === 'left',
    isRight:  showLegend && legendPosition === 'right',
  }
}

// ─── Grid bottom space ────────────────────────────────────────────────────────

export function calcBottomSpace(config: ChartConfig): number {
  const f            = getLegendFlags(config)
  const showDataZoom = config.showDataZoom as boolean
  return (f.isBottom ? 28 : 0) + (showDataZoom ? 40 : 0) + (f.isBottom || showDataZoom ? 16 : 8)
}

// ─── Title ────────────────────────────────────────────────────────────────────

export function buildTitle(config: ChartConfig, theme: Theme): EChartsOption['title'] {
  return config.title
    ? { text: config.title as string, textStyle: { color: '#fff', fontFamily: theme.fontFamily, fontSize: 16 }, left: 'center', top: 12 }
    : undefined
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

export function buildTooltip(
  percentMode: boolean,
  theme: Theme,
  opts?: { axisPointer?: 'shadow' | 'line' | 'cross' }
): EChartsOption['tooltip'] {
  return {
    trigger: 'axis',
    ...(opts?.axisPointer ? { axisPointer: { type: opts.axisPointer } } : {}),
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderColor:     'rgba(255,255,255,0.1)',
    textStyle:       { color: '#fff' },
    valueFormatter:  percentMode
      ? (v: unknown) => `${(v as number).toFixed(1)}%`
      : (v: unknown) => (v as number).toFixed(2),
  }
}

// ─── Legend ───────────────────────────────────────────────────────────────────

export function buildLegend(
  config:      ChartConfig,
  legendNames: string[],
  theme:       Theme,
): EChartsOption['legend'] {
  const showLegend   = config.showLegend as boolean
  if (!showLegend) return { show: false }

  const f            = getLegendFlags(config)
  const showDataZoom = config.showDataZoom as boolean
  return {
    textStyle: { color: theme.textColor },
    data:      legendNames,
    orient:    (f.isLeft || f.isRight) ? 'vertical' as const : 'horizontal' as const,
    ...(f.isBottom && { bottom: showDataZoom ? 44 : 4, left:  'center' }),
    ...(f.isTop    && { top:    4,                      left:  'center' }),
    ...(f.isLeft   && { left:   4,  top: 'middle', right: 'auto' }),
    ...(f.isRight  && { right:  4,  top: 'middle', left:  'auto' }),
  }
}

// ─── Grid ─────────────────────────────────────────────────────────────────────

export function buildGrid(config: ChartConfig): EChartsOption['grid'] {
  const f           = getLegendFlags(config)
  const bottomSpace = calcBottomSpace(config)
  return {
    top:          (config.title ? 56 : 24) + (f.isTop ? 32 : 0),
    left:         f.isLeft  ? '28%' : 48,
    right:        f.isRight ? '28%' : 24,
    bottom:       bottomSpace,
    containLabel: true,
  }
}

// ─── DataZoom ─────────────────────────────────────────────────────────────────

export function buildDataZoom(config: ChartConfig, theme: Theme): EChartsOption['dataZoom'] {
  if (!(config.showDataZoom as boolean)) return undefined

  const f = getLegendFlags(config)
  return [{
    type:                   'slider',
    xAxisIndex:             0,
    bottom:                 f.isBottom ? 28 : 4,
    height:                 24,
    start:                  0,
    end:                    100,
    borderColor:            'rgba(255,255,255,0.1)',
    backgroundColor:        'rgba(255,255,255,0.04)',
    fillerColor:            'rgba(124,106,255,0.15)',
    handleStyle:            { color: '#7c6aff' },
    moveHandleStyle:        { color: '#7c6aff' },
    textStyle:              { color: theme.textColor },
    dataBackground:         { lineStyle: { color: 'rgba(255,255,255,0.15)' }, areaStyle: { color: 'rgba(255,255,255,0.05)' } },
    selectedDataBackground: { lineStyle: { color: '#7c6aff' },               areaStyle: { color: 'rgba(124,106,255,0.1)' } },
  }]
}

// ─── X Axis (category) ────────────────────────────────────────────────────────

export function buildXAxis(
  config:     ChartConfig,
  categories: string[],
  theme:      Theme,
  opts?: { labelFormatter?: (v: string) => string; boundaryGap?: boolean },
): EChartsOption['xAxis'] {
  const xAxisTitle   = (config.xAxisTitle  as string | undefined) ?? ''
  const tickRotation = (config.tickRotation as number  | undefined) ?? 0
  const { labelFormatter, boundaryGap = true } = opts ?? {}
  return {
    type:         'category',
    data:         categories,
    boundaryGap,
    triggerEvent: true,
    name:         xAxisTitle || undefined,
    nameLocation: 'middle' as const,
    nameGap:      28,
    nameTextStyle: { color: theme.textColor, fontSize: theme.fontSize },
    axisLabel: {
      color:    theme.textColor,
      fontSize: theme.fontSize,
      rotate:   tickRotation,
      ...(labelFormatter ? { formatter: labelFormatter } : {}),
    },
    axisLine:  { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
    splitLine: { show: false },
  }
}

// ─── Y Axis (value, stacked) ──────────────────────────────────────────────────

export function buildYAxis(
  config:      ChartConfig,
  theme:       Theme,
  yAxisMax:    number,
  percentMode: boolean,
): EChartsOption['yAxis'] {
  const yAxisTitle = (config.yAxisTitle as string | undefined) ?? ''
  return {
    type:         'value',
    min:          0,
    max:          yAxisMax,
    name:         yAxisTitle || undefined,
    nameLocation: 'middle' as const,
    nameGap:      48,
    nameTextStyle: { color: theme.textColor, fontSize: theme.fontSize },
    axisLabel: {
      color:     theme.textColor,
      fontSize:  theme.fontSize,
      formatter: percentMode ? (v: number) => `${v}%` : (v: number) => compactNumber(v),
    },
    splitLine: { lineStyle: { color: config.showGrid ? theme.gridColor : 'transparent' } },
    axisLine:  { lineStyle: { color: 'transparent' } },
  }
}

// ─── Pivot aggregation ────────────────────────────────────────────────────────

export interface PivotResult {
  categoriesOrdered:  string[]
  stackValuesOrdered: string[]
  agg:                Map<string, Map<string, number>>
  catTotals:          Map<string, number>
  maxStackTotal:      number
  yAxisMax:           number
}

export function buildPivotAgg(
  data:        DataRow[],
  xAxisCol:    string,
  valueCol:    string,
  stackCol:    string,
  percentMode: boolean,
): PivotResult {
  // Unique categories in first-appearance order
  const categoriesOrdered: string[] = []
  const categorySeen = new Set<string>()
  data.forEach((r) => {
    const cat = String(r[xAxisCol] ?? '')
    if (!categorySeen.has(cat)) { categorySeen.add(cat); categoriesOrdered.push(cat) }
  })

  // Unique stack values in first-appearance order
  const stackValuesOrdered: string[] = []
  const stackSeen = new Set<string>()
  data.forEach((r) => {
    const sv = String(r[stackCol] ?? '')
    if (!stackSeen.has(sv)) { stackSeen.add(sv); stackValuesOrdered.push(sv) }
  })

  // Aggregate (category, stackValue) → sum of valueCol
  const agg = new Map<string, Map<string, number>>()
  data.forEach((r) => {
    const cat = String(r[xAxisCol] ?? '')
    const sv  = String(r[stackCol]  ?? '')
    const val = Number(r[valueCol]  ?? 0)
    if (!agg.has(cat)) agg.set(cat, new Map())
    const catMap = agg.get(cat)!
    catMap.set(sv, (catMap.get(sv) ?? 0) + val)
  })

  // Sort series: smallest at bottom, largest on top
  const lastCat = categoriesOrdered[categoriesOrdered.length - 1]
  if (lastCat !== undefined) {
    stackValuesOrdered.sort((a, b) =>
      (agg.get(lastCat)?.get(a) ?? 0) - (agg.get(lastCat)?.get(b) ?? 0)
    )
  }

  // Per-category totals
  const catTotals = new Map<string, number>()
  categoriesOrdered.forEach((cat) => {
    let total = 0
    stackValuesOrdered.forEach((sv) => { total += agg.get(cat)?.get(sv) ?? 0 })
    catTotals.set(cat, total)
  })

  const maxStackTotal = Math.max(0, ...Array.from(catTotals.values()))
  const yAxisMax      = percentMode ? 100 : niceMax(maxStackTotal)

  return { categoriesOrdered, stackValuesOrdered, agg, catTotals, maxStackTotal, yAxisMax }
}

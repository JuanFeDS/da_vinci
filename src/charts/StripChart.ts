import type { EChartsOption } from 'echarts'
import type { ChartPlugin, ChartConfig } from '@/types/chart.types'
import type { DataRow } from '@/types/data.types'
import type { Theme } from '@/types/theme.types'
import { getOverrideForItem } from './utils/colorResolver'
import { compactNumber } from './utils/numberFormat'

// Deterministic jitter so points don't jump on every re-render
function seededJitter(i: number): number {
  const x = Math.sin(i * 9301 + 49297) * 233280
  return (x - Math.floor(x) - 0.5) * 2 // -1 to 1
}

const STRIP_CONFIG_SECTIONS = [
  {
    id: 'data',
    label: 'Datos',
    controls: [
      { key: 'xAxis', label: 'Variable categórica', type: 'select' as const, defaultValue: '' },
      { key: 'yAxis', label: 'Variable numérica', type: 'select' as const, defaultValue: '' },
      { key: 'title', label: 'Título del gráfico', type: 'text' as const, defaultValue: '' },
    ],
  },
  {
    id: 'layout',
    label: 'Disposición',
    controls: [
      {
        key: 'orientation',
        label: 'Orientación',
        type: 'select' as const,
        defaultValue: 'vertical',
        options: [
          { label: 'Vertical (cat. en X)', value: 'vertical' },
          { label: 'Horizontal (cat. en Y)', value: 'horizontal' },
        ],
      },
      {
        key: 'sortBy',
        label: 'Ordenar por',
        type: 'select' as const,
        defaultValue: 'none',
        options: [
          { label: 'Sin ordenar', value: 'none' },
          { label: 'Media', value: 'mean' },
          { label: 'Mediana', value: 'median' },
          { label: 'Conteo', value: 'count' },
        ],
      },
      {
        key: 'sortOrder',
        label: 'Dirección',
        type: 'select' as const,
        defaultValue: 'asc',
        options: [
          { label: 'Ascendente', value: 'asc' },
          { label: 'Descendente', value: 'desc' },
        ],
      },
    ],
  },
  {
    id: 'style',
    label: 'Estilo',
    controls: [
      { key: 'pointSize', label: 'Tamaño de puntos', type: 'slider' as const, defaultValue: 8, min: 3, max: 24 },
      { key: 'opacity', label: 'Opacidad', type: 'slider' as const, defaultValue: 70, min: 10, max: 100 },
      { key: 'showGlow', label: 'Efecto glow', type: 'switch' as const, defaultValue: false },
    ],
  },
  {
    id: 'jitter',
    label: 'Jitter',
    controls: [
      { key: 'jitter', label: 'Activar jitter', type: 'switch' as const, defaultValue: true },
      { key: 'jitterAmount', label: 'Intensidad del jitter', type: 'slider' as const, defaultValue: 30, min: 5, max: 100 },
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
  const catField = config.xAxis as string
  const numField = config.yAxis as string
  const orientation = (config.orientation as string) || 'vertical'
  const jitterEnabled = config.jitter as boolean
  const jitterScale = ((config.jitterAmount as number) ?? 30) / 100 * 0.4
  const pointSize = (config.pointSize as number) ?? 8
  const opacity = (config.opacity as number) / 100
  const showGlow = config.showGlow as boolean
  const overrides = config.elementOverrides as Record<string, Record<string, unknown>>
  const colorMode = config.colorMode as string
  const colorField = (config.colorField as string) || catField
  const colorMap = config.colorMap as Record<string, string>

  const sortBy = (config.sortBy as string) || 'none'
  const sortOrder = (config.sortOrder as string) || 'asc'

  const rawCategories = [...new Set(data.map(r => String(r[catField] ?? '')))]

  let categories: string[]
  if (sortBy === 'none') {
    categories = rawCategories
  } else {
    const groupValues = new Map<string, number[]>()
    for (const cat of rawCategories) groupValues.set(cat, [])
    for (const r of data) {
      const cat = String(r[catField] ?? '')
      groupValues.get(cat)?.push(Number(r[numField] ?? 0))
    }

    const stat = (vals: number[]): number => {
      if (vals.length === 0) return 0
      if (sortBy === 'count') return vals.length
      if (sortBy === 'mean') return vals.reduce((a, b) => a + b, 0) / vals.length
      // median
      const sorted = [...vals].sort((a, b) => a - b)
      const mid = Math.floor(sorted.length / 2)
      return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
    }

    categories = [...rawCategories].sort((a, b) => {
      const diff = stat(groupValues.get(a)!) - stat(groupValues.get(b)!)
      return sortOrder === 'asc' ? diff : -diff
    })
  }

  const catIndexMap = new Map(categories.map((c, i) => [c, i]))

  const uniqueColorVals = [...new Set(data.map(r => String(r[colorField] ?? '')))]
  const colorValIndexMap = new Map(uniqueColorVals.map((v, i) => [v, i]))

  const scatterData = data.map((r, i) => {
    const catVal = String(r[catField] ?? '')
    const catI = catIndexMap.get(catVal) ?? 0
    const jitterOffset = jitterEnabled ? seededJitter(i) * jitterScale : 0
    const numVal = Number(r[numField] ?? 0)

    const ov = getOverrideForItem(overrides, 0, i)

    let pointColor: string
    if (colorMode === 'byCategory' || colorMode === 'customMap') {
      const colorVal = String(r[colorField] ?? '')
      const colorIdx = colorValIndexMap.get(colorVal) ?? 0
      pointColor = colorMode === 'customMap'
        ? (colorMap[colorVal] ?? theme.colors[colorIdx % theme.colors.length])
        : theme.colors[colorIdx % theme.colors.length]
    } else {
      pointColor = theme.colors[catI % theme.colors.length]
    }

    const finalColor = ov.color ?? pointColor
    const finalOpacity = ov.opacity !== undefined ? (ov.opacity as number) / 100 : opacity
    const finalSize = (ov.size as number | undefined) ?? pointSize
    const catCoord = catI + jitterOffset
    const value = orientation === 'vertical' ? [catCoord, numVal] : [numVal, catCoord]

    return {
      value,
      symbolSize: finalSize,
      itemStyle: {
        color: finalColor,
        opacity: finalOpacity,
        borderColor: ov.borderColor,
        borderWidth: ov.borderWidth ?? 0,
        shadowBlur: showGlow ? 10 : 0,
        shadowColor: showGlow ? `${finalColor}88` : 'transparent',
      },
    }
  })

  // Index 0 → visible category axis (bottom/left): provides labels with natural boundaryGap.
  // Index 1 → hidden value axis (same position): positions scatter data numerically.
  // Both have identical pixel mapping: value k ↔ category center k = (k+0.5)/N * gridSize.
  const visibleCatAxis = {
    type: 'category' as const,
    data: categories,
    boundaryGap: true,
    axisLabel: { color: theme.textColor, fontSize: theme.fontSize, interval: 0 },
    axisTick: { show: false },
    axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
    splitLine: { show: false },
  }

  const hiddenCatAxis = {
    type: 'value' as const,
    min: -0.5,
    max: categories.length - 0.5,
    show: false,
  }

  const numAxisConfig = {
    type: 'value' as const,
    name: numField,
    nameLocation: 'middle' as const,
    nameGap: orientation === 'vertical' ? 44 : 32,
    nameTextStyle: { color: theme.textColor },
    axisLabel: {
      color: theme.textColor,
      fontSize: theme.fontSize,
      formatter: (v: number) => compactNumber(v),
    },
    splitLine: { lineStyle: { color: config.showGrid ? theme.gridColor : 'transparent' } },
    axisLine: { lineStyle: { color: 'transparent' } },
  }

  const isVertical = orientation === 'vertical'

  return {
    backgroundColor: theme.backgroundColor,
    title: config.title
      ? { text: config.title as string, textStyle: { color: theme.textColor, fontFamily: theme.fontFamily, fontSize: 16 }, left: 'center', top: 12 }
      : undefined,
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(0,0,0,0.8)',
      borderColor: 'rgba(255,255,255,0.1)',
      textStyle: { color: '#fff' },
      formatter: (params: unknown) => {
        const p = params as { dataIndex: number }
        const r = data[p.dataIndex]
        if (!r) return ''
        return `${catField}: <b>${String(r[catField] ?? '')}</b><br/>${numField}: <b>${compactNumber(Number(r[numField] ?? 0))}</b>`
      },
    },
    legend: config.showLegend ? { textStyle: { color: theme.textColor }, bottom: 0 } : undefined,
    grid: { top: config.title ? 56 : 24, left: 48, right: 24, bottom: 40, containLabel: true },
    xAxis: isVertical ? [visibleCatAxis, hiddenCatAxis] : [numAxisConfig],
    yAxis: isVertical ? [numAxisConfig] : [visibleCatAxis, hiddenCatAxis],
    series: [
      {
        type: 'scatter',
        xAxisIndex: isVertical ? 1 : 0,
        yAxisIndex: isVertical ? 0 : 1,
        data: scatterData,
        emphasis: {
          itemStyle: { opacity: 1, shadowBlur: 20, shadowColor: `${theme.colors[0]}aa` },
          scale: 1.3,
        },
      },
    ],
  }
}

export const StripChart: ChartPlugin = {
  id: 'strip',
  name: 'Strip Plot',
  description: 'Distribución de valores numéricos por categoría',
  icon: 'ScatterChart',
  category: 'distribution',
  configSections: STRIP_CONFIG_SECTIONS,
  defaultConfig: {
    xAxis: '', yAxis: '', title: '', showLegend: false, showGrid: true, smooth: false,
    barRadius: 0, opacity: 70, labelPosition: 'top', seriesType: 'scatter',
    pointSize: 8, showGlow: false, jitter: true, jitterAmount: 30,
    orientation: 'vertical', sortBy: 'none', sortOrder: 'asc',
    numericColumns: [], colorMode: 'byCategory', colorField: '', colorMap: {}, elementOverrides: {},
  },
  canRender: (config) => Boolean(config.xAxis && config.yAxis),
  buildOption,
  supportsColorBy: true,
}

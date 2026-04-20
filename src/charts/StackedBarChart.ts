import type { EChartsOption } from 'echarts'
import type { ChartPlugin, ChartConfig } from '@/types/chart.types'
import type { DataRow } from '@/types/data.types'
import type { Theme } from '@/types/theme.types'
import { getOverrideForItem } from './utils/colorResolver'
import {
  buildTitle, buildTooltip, buildLegend, buildGrid, buildDataZoom,
  buildXAxis, buildYAxis, buildPivotAgg,
} from './utils/optionBuilders'
import {
  STACK_DATA_CONTROLS, STACK_DISPLAY_CONTROLS, SHARED_STACK_DEFAULT_CONFIG,
} from './utils/sharedSections'

const STACKED_SECTIONS = [
  {
    id: 'data', label: 'Datos',
    controls: STACK_DATA_CONTROLS,
  },
  {
    id: 'style', label: 'Estilo',
    controls: [
      { key: 'barRadius', label: 'Radio superior', type: 'slider' as const, defaultValue: 4, min: 0, max: 16 },
      { key: 'opacity',   label: 'Opacidad',       type: 'slider' as const, defaultValue: 92, min: 10, max: 100 },
    ],
  },
  {
    id: 'display', label: 'Visualización',
    controls: [
      ...STACK_DISPLAY_CONTROLS,
      { key: 'showLabels',  label: 'Mostrar etiquetas',  type: 'switch' as const, defaultValue: false },
      { key: 'tickRotation', label: 'Rotación de ticks', type: 'slider' as const, defaultValue: 0, min: -90, max: 90, step: 15 },
    ],
  },
]

function buildOption(data: DataRow[], config: ChartConfig, theme: Theme): EChartsOption {
  const xAxisCol  = config.xAxis    as string
  const valueCol  = config.valueCol as string
  const stackCol  = config.stackCol as string
  const opacity   = (config.opacity as number) / 100
  const overrides = config.elementOverrides as Record<string, Record<string, unknown>>

  const percentMode = config.percentMode as boolean
  const { categoriesOrdered, stackValuesOrdered, agg, catTotals, yAxisMax } =
    buildPivotAgg(data, xAxisCol, valueCol, stackCol, percentMode)

  const labelOverrides      = (config.labelOverrides      as Record<string, string> | undefined) ?? {}
  const seriesNameOverrides = (config.seriesNameOverrides as Record<string, string> | undefined) ?? {}
  const hasLabelOverrides   = Object.keys(labelOverrides).length > 0
  const labelFormatter      = hasLabelOverrides ? (value: string) => labelOverrides[value] ?? value : undefined

  const series = stackValuesOrdered.map((sv, seriesIdx) => ({
    name: seriesNameOverrides[sv] ?? sv,
    type: 'bar' as const,
    stack: 'total',
    data: categoriesOrdered.map((cat, dataIdx) => {
      const ov           = getOverrideForItem(overrides, seriesIdx, dataIdx)
      const baseColor    = theme.colors[seriesIdx % theme.colors.length]
      const finalColor   = ov.color ?? baseColor
      const finalOpacity = ov.opacity !== undefined ? (ov.opacity as number) / 100 : opacity
      const rawValue     = agg.get(cat)?.get(sv) ?? 0
      const total        = catTotals.get(cat) ?? 1
      const displayValue = percentMode ? (total === 0 ? 0 : (rawValue / total) * 100) : rawValue
      return {
        value: displayValue,
        name:  cat,
        metaIndex: dataIdx,
        itemStyle: { color: finalColor, opacity: finalOpacity, borderRadius: config.barRadius as number },
        label: ov.labelShow !== undefined
          ? { show: ov.labelShow as boolean, formatter: ov.labelText as string | undefined, color: '#fff', fontSize: 10 }
          : undefined,
      }
    }),
    label:    config.showLabels ? { show: true, color: '#fff', fontSize: 10 } : { show: false },
    emphasis: { focus: 'series' as const },
  }))

  const legendNames = [...stackValuesOrdered].reverse().map((sv) => seriesNameOverrides[sv] ?? sv)

  return {
    backgroundColor: theme.backgroundColor,
    title:    buildTitle(config, theme),
    tooltip:  buildTooltip(percentMode, theme, { axisPointer: 'shadow' }),
    legend:   buildLegend(config, legendNames, theme),
    dataZoom: buildDataZoom(config, theme),
    grid:     buildGrid(config),
    xAxis:    buildXAxis(config, categoriesOrdered, theme, { labelFormatter }),
    yAxis:    buildYAxis(config, theme, yAxisMax, percentMode),
    series,
  }
}

export const StackedBarChart: ChartPlugin = {
  id: 'stacked-bar',
  name: 'Barras Apiladas',
  description: 'Composición proporcional por categoría',
  icon: 'Layers',
  category: 'comparison',
  configSections: STACKED_SECTIONS,
  defaultConfig: {
    ...SHARED_STACK_DEFAULT_CONFIG,
    smooth: false, barRadius: 4, opacity: 92,
    labelPosition: 'top', seriesType: 'bar',
    showLabels: false, tickRotation: 0,
  },
  buildOption,
  canRender: (config) => !!(config.xAxis && config.valueCol && config.stackCol),
}

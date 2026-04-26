import type { EChartsOption } from 'echarts'
import type { ChartPlugin, ChartConfig } from '@/types/chart.types'
import type { DataRow } from '@/types/data.types'
import type { Theme } from '@/types/theme.types'
import { getOverrideForItem, getEffectiveSeriesColor } from './utils/colorResolver'
import {
  buildTitle, buildTooltip, buildLegend, buildGrid, buildDataZoom,
  buildXAxis, buildYAxis, buildPivotAgg,
} from './utils/optionBuilders'
import {
  STACK_DATA_CONTROLS, STACK_DISPLAY_CONTROLS, SHARED_STACK_DEFAULT_CONFIG,
} from './utils/sharedSections'

const AREA_SECTIONS = [
  {
    id: 'data', label: 'Datos',
    controls: STACK_DATA_CONTROLS,
  },
  {
    id: 'style', label: 'Estilo',
    controls: [
      { key: 'smooth',      label: 'Línea suavizada',  type: 'switch' as const, defaultValue: true },
      { key: 'lineWidth',   label: 'Grosor de línea',  type: 'slider' as const, defaultValue: 2, min: 1, max: 8 },
      { key: 'fillOpacity', label: 'Opacidad relleno', type: 'slider' as const, defaultValue: 60, min: 5, max: 100 },
      { key: 'showPoints',  label: 'Mostrar puntos',   type: 'switch' as const, defaultValue: false },
    ],
  },
  {
    id: 'display', label: 'Visualización',
    controls: STACK_DISPLAY_CONTROLS,
  },
]

function buildOption(data: DataRow[], config: ChartConfig, theme: Theme): EChartsOption {
  const xAxisCol    = config.xAxis    as string
  const valueCol    = config.valueCol as string
  const stackCol    = config.stackCol as string
  const fillOpacity = ((config.fillOpacity as number) ?? 60) / 100
  const overrides   = config.elementOverrides as Record<string, Record<string, unknown>>

  const percentMode = config.percentMode as boolean
  const { categoriesOrdered, stackValuesOrdered, agg, catTotals, yAxisMax } =
    buildPivotAgg(data, xAxisCol, valueCol, stackCol, percentMode)

  const labelOverrides      = (config.labelOverrides      as Record<string, string> | undefined) ?? {}
  const seriesNameOverrides = (config.seriesNameOverrides as Record<string, string> | undefined) ?? {}
  const hasLabelOverrides   = Object.keys(labelOverrides).length > 0
  const labelFormatter      = hasLabelOverrides ? (value: string) => labelOverrides[value] ?? value : undefined

  const series = stackValuesOrdered.map((sv, seriesIdx) => {
    const baseColor      = theme.colors[seriesIdx % theme.colors.length]
    const effectiveColor = getEffectiveSeriesColor(seriesIdx, categoriesOrdered.length, overrides, baseColor)
    const hexAlpha       = Math.round(fillOpacity * 255).toString(16).padStart(2, '0')

    return {
      name:   seriesNameOverrides[sv] ?? sv,
      type:   'line' as const,
      stack:  'total',
      smooth: config.smooth as boolean,
      symbol: (config.showPoints as boolean) ? 'circle' : 'none',
      symbolSize: 5,
      lineStyle: { color: effectiveColor, width: config.lineWidth as number },
      itemStyle: { color: effectiveColor },
      areaStyle: {
        color: {
          type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: `${effectiveColor}${hexAlpha}` }, { offset: 1, color: `${effectiveColor}15` }],
        },
      },
      data: categoriesOrdered.map((cat, dataIdx) => {
        const ov           = getOverrideForItem(overrides, seriesIdx, dataIdx)
        const rawValue     = agg.get(cat)?.get(sv) ?? 0
        const total        = catTotals.get(cat) ?? 1
        const displayValue = percentMode ? (total === 0 ? 0 : (rawValue / total) * 100) : rawValue
        return {
          value:     displayValue,
          name:      cat,
          metaIndex: dataIdx,
          itemStyle: ov.color
            ? { color: ov.color as string, opacity: ov.opacity !== undefined ? (ov.opacity as number) / 100 : 1 }
            : undefined,
        }
      }),
      emphasis: { focus: 'series' as const },
    }
  })

  const legendNames = [...stackValuesOrdered].reverse().map((sv) => seriesNameOverrides[sv] ?? sv)

  return {
    backgroundColor: theme.backgroundColor,
    color:    theme.colors,
    title:    buildTitle(config, theme),
    tooltip:  buildTooltip(percentMode, theme),
    legend:   buildLegend(config, legendNames, theme),
    dataZoom: buildDataZoom(config, theme),
    grid:     buildGrid(config),
    xAxis:    buildXAxis(config, categoriesOrdered, theme, { labelFormatter, boundaryGap: false }),
    yAxis:    buildYAxis(config, theme, yAxisMax, percentMode),
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
    ...SHARED_STACK_DEFAULT_CONFIG,
    smooth: true, barRadius: 0, opacity: 100,
    labelPosition: 'top', seriesType: 'line',
    fillOpacity: 60, lineWidth: 2, showPoints: false,
  },
  buildOption,
  canRender: (config) => !!(config.xAxis && config.valueCol && config.stackCol),
}

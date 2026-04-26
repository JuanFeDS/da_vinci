import { BarChart } from './BarChart'
import { HorizontalBarChart } from './HorizontalBarChart'
import { GroupedBarChart } from './GroupedBarChart'
import { StackedBarChart } from './StackedBarChart'
import { LineChart } from './LineChart'
import { AreaChart } from './AreaChart'
import { HistogramChart } from './HistogramChart'
import { ScatterChart } from './ScatterChart'
import { BubbleChart } from './BubbleChart'
import { HeatmapChart } from './HeatmapChart'
import { PieChart } from './PieChart'
import { DonutChart } from './DonutChart'
import { TreemapChart } from './TreemapChart'
import type { ChartPlugin, ChartCategory } from '@/types/chart.types'

export const CHART_REGISTRY: ChartPlugin[] = [
  BarChart, HorizontalBarChart, GroupedBarChart, StackedBarChart,
  LineChart, AreaChart,
  HistogramChart,
  ScatterChart, BubbleChart, HeatmapChart,
  PieChart, DonutChart, TreemapChart,
]

export const CHART_CATEGORIES: { id: ChartCategory; label: string }[] = [
  { id: 'comparison',   label: 'Comparación' },
  { id: 'trend',        label: 'Evolución' },
  { id: 'distribution', label: 'Distribución' },
  { id: 'correlation',  label: 'Correlación' },
  { id: 'proportion',   label: 'Proporción' },
]

export function getChartById(id: string): ChartPlugin | undefined {
  return CHART_REGISTRY.find((c) => c.id === id)
}


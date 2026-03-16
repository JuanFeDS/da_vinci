import { BarChart } from './BarChart'
import { LineChart } from './LineChart'
import { ScatterChart } from './ScatterChart'
import { PieChart } from './PieChart'
import type { ChartPlugin } from '@/types/chart.types'

export const CHART_REGISTRY: ChartPlugin[] = [
  BarChart,
  LineChart,
  ScatterChart,
  PieChart,
]

export function getChartById(id: string): ChartPlugin | undefined {
  return CHART_REGISTRY.find((c) => c.id === id)
}

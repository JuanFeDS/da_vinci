import type { EChartsOption } from 'echarts'
import type { DataRow, ProcessedData } from './data.types'
import type { Theme } from './theme.types'

export type ControlType = 'select' | 'color' | 'switch' | 'slider' | 'text'

export type ChartCategory = 'comparison' | 'trend' | 'distribution' | 'correlation' | 'proportion'

export interface ControlOption {
  label: string
  value: string
}

export interface ConfigControl {
  key: string
  label: string
  type: ControlType
  defaultValue: unknown
  options?: ControlOption[]
  min?: number
  max?: number
  step?: number
}

export interface ConfigSection {
  id: string
  label: string
  controls: ConfigControl[]
}

export interface ChartConfig {
  xAxis: string
  yAxis: string
  title: string
  showLegend: boolean
  showGrid: boolean
  smooth: boolean
  barRadius: number
  opacity: number
  labelPosition: string
  seriesType: string
  numericColumns: string[]
  [key: string]: unknown
}

export interface ChartPlugin {
  id: string
  name: string
  description: string
  icon: string
  category: ChartCategory
  configSections: ConfigSection[]
  defaultConfig: ChartConfig
  buildOption: (data: DataRow[], config: ChartConfig, theme: Theme) => EChartsOption
  canRender?: (config: ChartConfig) => boolean
}

export interface ChartState {
  plugin: ChartPlugin | null
  config: ChartConfig
  data: ProcessedData | null
}

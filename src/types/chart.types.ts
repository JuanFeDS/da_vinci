import type { EChartsOption } from 'echarts'
import type { DataRow, ProcessedData } from './data.types'
import type { Theme } from './theme.types'

export type ControlType = 'select' | 'color' | 'switch' | 'slider' | 'text'

export type ChartCategory = 'comparison' | 'trend' | 'distribution' | 'correlation' | 'proportion'

export type ColorMode = 'uniform' | 'byCategory' | 'customMap'

export interface TextBlock {
  id: string
  text: string
  x: number         // percentage 0–100 relative to chart container width
  y: number         // percentage 0–100 relative to chart container height
  width: number     // pixels
  height?: number   // pixels; undefined = auto (grows with content)
  fontSize: number  // pixels
  fontFamily: string
  color: string
  bold: boolean
  italic: boolean
}

export interface DataFilter {
  id: string
  column: string
  selectedValues: string[]
}

export interface ElementOverride {
  color?: string
  opacity?: number
  borderColor?: string
  borderWidth?: number
  labelShow?: boolean
  labelText?: string
  size?: number
}

export interface InspectedElement {
  seriesIndex: number
  dataIndex: number
  seriesName: string
  value: unknown
  category?: string
}

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
  group?: string
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
  colorMode: ColorMode
  colorField: string
  colorMap: Record<string, string>
  elementOverrides: Record<string, ElementOverride>
  textBlocks?: TextBlock[]
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
  supportsColorBy?: boolean
  supportsDrag?: boolean
}

export interface ChartState {
  plugin: ChartPlugin | null
  config: ChartConfig
  data: ProcessedData | null
}

import type { ChartConfig } from './chart.types'
import type { ProcessedData } from './data.types'

export type SaveStatus = 'saved' | 'saving' | 'unsaved'

export interface Visualization {
  id: string
  name: string
  pluginId: string | null
  config: ChartConfig
  data: ProcessedData | null
  themeId: string
  createdAt: number
  updatedAt: number
}

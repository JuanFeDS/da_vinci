import type { Visualization } from '@/types/visualization.types'
import type { ChartConfig } from '@/types/chart.types'
import { vizGet, vizPut, vizDelete, vizGetAll } from './db'

export function createVisualization(name: string, partial?: Partial<Visualization>): Visualization {
  const now = Date.now()
  return {
    id: `viz-${now}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    pluginId: null,
    config: {} as ChartConfig,
    data: null,
    themeId: 'cosmic',
    createdAt: now,
    updatedAt: now,
    ...partial,
  }
}

export async function saveVisualization(viz: Visualization): Promise<void> {
  await vizPut(viz)
}

export async function getVisualization(id: string): Promise<Visualization | null> {
  return vizGet<Visualization>(id)
}

export async function listVisualizations(): Promise<Visualization[]> {
  const all = await vizGetAll<Visualization>()
  return all.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function deleteVisualization(id: string): Promise<void> {
  await vizDelete(id)
}

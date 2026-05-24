import type { ElementType } from 'react'
import {
  BarChart2, BarChart3, Layers, TrendingUp, AreaChart,
  BarChartHorizontal, ScatterChart, CircleDot, LayoutGrid,
  PieChart, Disc, SquareStack,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { CHART_REGISTRY, CHART_CATEGORIES } from '@/charts/registry'
import type { ChartPlugin } from '@/types/chart.types'

const ICON_MAP: Record<string, ElementType> = {
  BarChart2, BarChart3, Layers, TrendingUp, AreaChart,
  BarChartHorizontal, ScatterChart, CircleDot, LayoutGrid,
  PieChart, Disc, SquareStack,
}

interface Props {
  activeId: string | null
  onSelect: (plugin: ChartPlugin) => void
}

export function ChartSelector({ activeId, onSelect }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40 px-1">Tipo de gráfico</p>
      {CHART_CATEGORIES.map((cat) => {
        const plugins = CHART_REGISTRY.filter((p) => p.category === cat.id)
        if (!plugins.length) return null
        return (
          <div key={cat.id} className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35 px-1">{cat.label}</p>
            <div className="grid grid-cols-3 gap-1.5">
              {plugins.map((plugin) => {
                const Icon = ICON_MAP[plugin.icon] ?? BarChart2
                const isActive = activeId === plugin.id
                return (
                  <button
                    key={plugin.id}
                    onClick={() => !isActive && onSelect(plugin)}
                    title={plugin.description}
                    className={cn(
                      'flex flex-col items-center gap-1.5 py-2 px-1 rounded-xl border transition-all duration-200',
                      isActive
                        ? 'bg-accent/20 border-accent/50 text-white'
                        : 'bg-white/5 border-white/8 text-white/50 hover:bg-white/10 hover:border-white/20 hover:text-white',
                    )}
                  >
                    <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-accent-light' : 'text-white/30')} />
                    <span className="text-[10px] font-medium leading-tight text-center line-clamp-1">{plugin.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

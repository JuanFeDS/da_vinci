import { BarChart2, TrendingUp, ScatterChart, PieChart } from 'lucide-react'
import { cn } from '@/utils/cn'
import { CHART_REGISTRY } from '@/charts/registry'
import type { ChartPlugin } from '@/types/chart.types'

const ICON_MAP: Record<string, React.ElementType> = {
  BarChart2,
  TrendingUp,
  ScatterChart,
  PieChart,
}

interface Props {
  activeId: string | null
  onSelect: (plugin: ChartPlugin) => void
}

export function ChartSelector({ activeId, onSelect }: Props) {
  return (
    <div className="space-y-2">
      <p className="section-label px-1">Tipo de gráfico</p>
      <div className="grid grid-cols-2 gap-2">
        {CHART_REGISTRY.map((plugin) => {
          const Icon = ICON_MAP[plugin.icon] ?? BarChart2
          const isActive = activeId === plugin.id
          return (
            <button
              key={plugin.id}
              onClick={() => onSelect(plugin)}
              className={cn(
                'flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 text-left',
                isActive
                  ? 'bg-accent/20 border-accent/60 text-white'
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-white/20 hover:text-white',
              )}
            >
              <Icon className={cn('w-5 h-5', isActive ? 'text-accent-light' : 'text-white/40')} />
              <div className="text-center">
                <p className="text-xs font-semibold">{plugin.name}</p>
                <p className="text-[10px] text-white/30 mt-0.5 leading-tight">{plugin.description}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

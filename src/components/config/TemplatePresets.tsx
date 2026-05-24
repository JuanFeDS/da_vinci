import type { ElementType } from 'react'
import { Minimize2, Maximize2, Sparkles, FileText } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { ChartConfig } from '@/types/chart.types'

interface Preset {
  id: string
  label: string
  Icon: ElementType
  overrides: Partial<ChartConfig>
}

const PRESETS: Preset[] = [
  {
    id: 'minimal', label: 'Minimal', Icon: Minimize2,
    overrides: { showGrid: false, showLegend: false, showLabels: false, opacity: 100, barRadius: 2 },
  },
  {
    id: 'bold', label: 'Bold', Icon: Maximize2,
    overrides: { showGrid: true, showLegend: true, showLabels: true, opacity: 100, barRadius: 2 },
  },
  {
    id: 'clean', label: 'Clean', Icon: Sparkles,
    overrides: { showGrid: true, showLegend: false, showLabels: false, opacity: 85, barRadius: 8 },
  },
  {
    id: 'report', label: 'Report', Icon: FileText,
    overrides: { showGrid: true, showLegend: true, showLabels: true, opacity: 90, barRadius: 4 },
  },
]

interface Props {
  onApply: (overrides: Partial<ChartConfig>) => void
}

export function TemplatePresets({ onApply }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Plantillas rápidas</p>
      <div className="grid grid-cols-2 gap-1.5">
        {PRESETS.map(({ id, label, Icon, overrides }) => (
          <button
            key={id}
            onClick={() => onApply(overrides)}
            className={cn(
              'flex items-center gap-2 px-2.5 py-2 rounded-lg border border-white/10 bg-white/5',
              'hover:bg-white/10 hover:border-white/20 transition-all duration-150 text-left',
            )}
          >
            <Icon className="w-3.5 h-3.5 text-accent-light shrink-0" />
            <span className="text-xs text-white/60 hover:text-white">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

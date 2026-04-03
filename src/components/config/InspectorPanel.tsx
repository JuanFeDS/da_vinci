import { MousePointer2, Trash2, Copy } from 'lucide-react'
import { AppearanceControls } from './inspector/AppearanceControls'
import { BorderControls } from './inspector/BorderControls'
import { LabelControls } from './inspector/LabelControls'
import type { InspectedElement, ElementOverride } from '@/types/chart.types'

interface Props {
  selected: InspectedElement | null
  override: ElementOverride
  inspectorActive: boolean
  onUpdate: (patch: Partial<ElementOverride>) => void
  onUpdateAll: (patch: Partial<ElementOverride>) => void
  onReset: () => void
  onClearSelection: () => void
}

export function InspectorPanel({ selected, override, inspectorActive, onUpdate, onUpdateAll, onReset, onClearSelection }: Props) {
  if (!inspectorActive) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-10 px-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
          <MousePointer2 className="w-5 h-5 text-white/20" />
        </div>
        <div>
          <p className="text-xs text-white/40 leading-relaxed">
            Activa el modo inspector con el icono <MousePointer2 className="w-3 h-3 inline mb-0.5" /> en el visor, luego haz click en cualquier elemento del gráfico.
          </p>
        </div>
      </div>
    )
  }

  if (!selected) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-10 px-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
          <MousePointer2 className="w-5 h-5 text-accent-light animate-pulse" />
        </div>
        <p className="text-xs text-white/40 leading-relaxed">
          Inspector activo — haz click en cualquier barra, punto, sector o elemento del gráfico.
        </p>
      </div>
    )
  }

  const hasOverride = Object.keys(override).length > 0

  return (
    <div className="space-y-4">
      {/* Info del elemento */}
      <div className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <span className="text-xs font-semibold text-white block">
              {selected.seriesName || `Serie ${selected.seriesIndex + 1}`}
            </span>
            {selected.category && (
              <span className="text-[11px] text-white/50">
                {selected.category}
              </span>
            )}
          </div>
          <button onClick={onClearSelection} className="text-white/30 hover:text-white/60 transition-colors">
            <Copy className="w-3 h-3" />
          </button>
        </div>
        <p className="text-[11px] text-white/40">
          Elemento #{selected.dataIndex + 1}
        </p>
        <p className="text-xs text-accent-light font-medium">
          {Array.isArray(selected.value)
            ? (selected.value as number[]).join(' / ')
            : String(selected.value ?? '—')}
        </p>
      </div>

      <AppearanceControls override={override} onUpdate={onUpdate} onUpdateAll={onUpdateAll} />
      <BorderControls override={override} onUpdate={onUpdate} />
      <LabelControls override={override} onUpdate={onUpdate} />

      {hasOverride && (
        <button
          onClick={onReset}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-red-500/20 bg-red-500/5 text-xs text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150"
        >
          <Trash2 className="w-3 h-3" /> Limpiar overrides del elemento
        </button>
      )}
    </div>
  )
}

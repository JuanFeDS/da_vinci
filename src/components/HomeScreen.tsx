import { Sparkles, Plus, Clock, Trash2 } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { Visualization } from '@/types/visualization.types'
import { CHART_REGISTRY } from '@/charts/registry'

function formatDate(ts: number): string {
  const d    = new Date(ts)
  const diff = Date.now() - d.getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'Hoy'
  if (days === 1) return 'Ayer'
  if (days < 7)  return `Hace ${days} días`
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface Props {
  allViz: Visualization[]
  onNew: () => void
  onOpen: (id: string) => void
  onDelete: (id: string) => void
}

export function HomeScreen({ allViz, onNew, onOpen, onDelete }: Props) {
  return (
    <div className="flex flex-col h-screen bg-surface-950 text-white overflow-hidden">
      {/* Header */}
      <header className="flex items-center px-6 py-4 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-accent-light flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-semibold text-white tracking-tight">DaVinci</span>
          <span className="text-xs text-white/20 ml-1">by you</span>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left column: actions */}
        <aside className="w-64 shrink-0 flex flex-col gap-8 px-8 py-10 border-r border-white/5">
          <div>
            <p className="text-xl font-display font-semibold text-white mb-1">Bienvenido</p>
            <p className="text-sm text-white/30">¿Qué visualizamos hoy?</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/20 mb-2">Empezar</p>
            <button
              onClick={onNew}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-accent/15 border border-accent/25 text-accent-light hover:bg-accent/22 transition-all text-sm font-medium text-left"
            >
              <Plus className="w-4 h-4 shrink-0" />
              Nueva visualización
            </button>
          </div>
        </aside>

        {/* Right column: recents */}
        <main className="flex-1 min-w-0 px-10 py-10 overflow-y-auto">
          {allViz.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
                <Clock className="w-6 h-6 text-white/20" />
              </div>
              <div>
                <p className="text-sm text-white/30">Sin visualizaciones guardadas</p>
                <p className="text-xs text-white/15 mt-1">Crea una nueva para empezar</p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/20 mb-5">Recientes</p>
              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                {allViz.map((viz) => {
                  const chartPlugin = viz.pluginId
                    ? CHART_REGISTRY.find(p => p.id === viz.pluginId)
                    : null
                  return (
                    <div
                      key={viz.id}
                      onClick={() => onOpen(viz.id)}
                      className="group relative flex flex-col gap-3 p-4 rounded-xl bg-white/3 border border-white/8 hover:bg-white/6 hover:border-white/15 cursor-pointer transition-all duration-150"
                    >
                      {/* Delete button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(viz.id) }}
                        title="Eliminar"
                        className={cn(
                          'absolute top-3 right-3 p-1.5 rounded-lg',
                          'opacity-0 group-hover:opacity-100 transition-opacity',
                          'text-white/30 hover:text-white/80 hover:bg-white/10',
                        )}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Chart type badge */}
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-accent/12 border border-accent/20 flex items-center justify-center shrink-0">
                          <Sparkles className="w-3.5 h-3.5 text-accent-light/70" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate pr-6">{viz.name}</p>
                          {chartPlugin && (
                            <p className="text-[11px] text-white/35 truncate">{chartPlugin.name}</p>
                          )}
                        </div>
                      </div>

                      {/* Dataset + date */}
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] text-white/25 truncate">
                          {viz.data?.dataset_info.filename ?? 'Sin datos'}
                        </p>
                        <p className="text-[10px] text-white/20 shrink-0">{formatDate(viz.updatedAt)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}

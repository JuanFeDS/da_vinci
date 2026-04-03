import { cn } from '@/utils/cn'
import type { ColorMode } from '@/types/chart.types'

interface Props {
  colorMode: ColorMode
  colorField: string
  colorMap: Record<string, string>
  columns: string[]
  categoryValues: string[]
  themeColors: string[]
  onModeChange: (mode: ColorMode) => void
  onFieldChange: (field: string) => void
  onColorMapChange: (key: string, color: string) => void
}

const MODES: { id: ColorMode; label: string; desc: string }[] = [
  { id: 'uniform',    label: 'Uniforme',    desc: 'Todos los elementos con el color del tema' },
  { id: 'byCategory', label: 'Por categoría', desc: 'Cada valor único recibe un color distinto' },
  { id: 'customMap',  label: 'Personalizado', desc: 'Asigna un color específico a cada valor' },
]

export function ColorByPanel({ colorMode, colorField, colorMap, columns, categoryValues, themeColors, onModeChange, onFieldChange, onColorMapChange }: Props) {
  return (
    <div className="space-y-4">
      <p className="section-label">Modo de color</p>

      <div className="space-y-1.5">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => onModeChange(m.id)}
            className={cn(
              'w-full flex items-start gap-3 px-3 py-2.5 rounded-xl border text-left transition-all duration-200',
              colorMode === m.id
                ? 'bg-accent/15 border-accent/40'
                : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20',
            )}
          >
            <span className={cn(
              'mt-0.5 w-3.5 h-3.5 rounded-full border-2 shrink-0 transition-colors',
              colorMode === m.id ? 'border-accent-light bg-accent/50' : 'border-white/20',
            )} />
            <div>
              <p className={cn('text-xs font-medium', colorMode === m.id ? 'text-white' : 'text-white/60')}>{m.label}</p>
              <p className="text-[10px] text-white/30 mt-0.5">{m.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {(colorMode === 'byCategory' || colorMode === 'customMap') && (
        <div className="space-y-2">
          <p className="section-label">Columna de color</p>
          <select
            className="input-field w-full text-xs"
            value={colorField}
            onChange={(e) => onFieldChange(e.target.value)}
          >
            <option value="">— seleccionar —</option>
            {columns.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      )}

      {colorMode === 'customMap' && colorField && categoryValues.length > 0 && (
        <div className="space-y-2">
          <p className="section-label">Mapa de colores</p>
          <div className="space-y-1.5 max-h-52 overflow-y-auto">
            {categoryValues.map((val, i) => {
              const defaultColor = themeColors[i % themeColors.length]
              const current = colorMap[val] ?? defaultColor
              return (
                <div key={val} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-white/60 truncate flex-1">{val}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="color"
                      value={current}
                      onChange={(e) => onColorMapChange(val, e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border border-white/10"
                    />
                    <span className="text-[10px] text-white/30 font-mono w-14">{current}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

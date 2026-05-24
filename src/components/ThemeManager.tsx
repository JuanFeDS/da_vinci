import { useState } from 'react'
import { Check, Download, Upload, Plus } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { Theme } from '@/types/theme.types'
import { exportThemeAsJSON, importThemeFromJSON, saveCustomTheme } from '@/utils/themeStorage'

interface Props {
  themes: Theme[]
  activeId: string
  onSelect: (id: string) => void
  onThemeAdded: (theme: Theme) => void
}

export function ThemeManager({ themes, activeId, onSelect, onThemeAdded }: Props) {
  const [importing, setImporting] = useState(false)

  const activeTheme = themes.find((t) => t.id === activeId)

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const theme = await importThemeFromJSON(file)
      saveCustomTheme(theme)
      onThemeAdded(theme)
    } catch {
      alert('Error al importar el tema')
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Tema de color</p>

      <div className="grid grid-cols-3 gap-2">
        {themes.map((theme) => (
          <button
            key={theme.id}
            onClick={() => onSelect(theme.id)}
            className={cn(
              'relative flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all duration-200',
              activeId === theme.id
                ? 'border-accent/60 bg-accent/10'
                : 'border-white/10 bg-white/5 hover:border-white/20',
            )}
          >
            <div className="flex gap-0.5">
              {theme.colors.slice(0, 5).map((c, i) => (
                <span key={i} className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />
              ))}
            </div>
            <span className="text-[10px] text-white/50 truncate w-full text-center">{theme.name}</span>
            {activeId === theme.id && (
              <span className="absolute top-1 right-1">
                <Check className="w-3 h-3 text-accent-light" />
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex gap-2 pt-1">
        {activeTheme && (
          <button
            onClick={() => exportThemeAsJSON(activeTheme)}
            className="text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200 text-xs flex items-center gap-1.5 py-1.5 flex-1 justify-center"
          >
            <Download className="w-3 h-3" />
            Exportar
          </button>
        )}
        <label className={cn('text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200 text-xs flex items-center gap-1.5 py-1.5 flex-1 justify-center cursor-pointer', importing && 'opacity-50')}>
          <Upload className="w-3 h-3" />
          Importar
          <input type="file" accept=".json" className="hidden" onChange={handleImport} disabled={importing} />
        </label>
        <button className="text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200 text-xs flex items-center gap-1.5 py-1.5 justify-center px-2" title="Nuevo tema">
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

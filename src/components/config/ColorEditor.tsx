import { Check } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { Theme } from '@/types/theme.types'

interface Props {
  themes: Theme[]
  activeId: string
  onSelect: (id: string) => void
}

export function ColorEditor({ themes, activeId, onSelect }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Paleta de colores</p>
      <div className="grid grid-cols-2 gap-1.5">
        {themes.map((theme) => {
          const isActive = theme.id === activeId
          return (
            <button
              key={theme.id}
              onClick={() => onSelect(theme.id)}
              className={cn(
                'relative flex flex-col items-start gap-1.5 p-2 rounded-xl border transition-all duration-200',
                isActive
                  ? 'border-accent/60 bg-accent/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10',
              )}
            >
              <div className="flex gap-0.5">
                {theme.colors.slice(0, 5).map((c, i) => (
                  <span
                    key={i}
                    className="w-3.5 h-3.5 rounded-full ring-1 ring-white/10"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <span className="text-[10px] text-white/50 truncate w-full text-left">{theme.name}</span>
              {isActive && (
                <span className="absolute top-1.5 right-1.5">
                  <Check className="w-3 h-3 text-accent-light" />
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

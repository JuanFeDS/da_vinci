import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import type { ElementOverride } from '@/types/chart.types'

interface Props {
  override: ElementOverride
  onUpdate: (patch: Partial<ElementOverride>) => void
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-white/50 shrink-0">{label}</span>
      <div className="flex-1 flex justify-end">{children}</div>
    </div>
  )
}

export function AppearanceControls({ override, onUpdate }: Props) {
  return (
    <div className="space-y-3">
      <p className="section-label">Apariencia</p>

      <Row label="Color">
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={(override.color as string) ?? '#7c6aff'}
            onChange={(e) => onUpdate({ color: e.target.value })}
            className={cn('w-7 h-7 rounded-md border cursor-pointer', override.color ? 'border-white/30' : 'border-white/10 opacity-40')}
          />
          {override.color && (
            <button onClick={() => onUpdate({ color: undefined })} className="text-xs text-white/30 hover:text-white/60">✕</button>
          )}
        </div>
      </Row>

      <Row label="Opacidad">
        <div className="flex items-center gap-2 w-32">
          <input
            type="range" min={10} max={100} step={5}
            value={(override.opacity as number) ?? 100}
            onChange={(e) => onUpdate({ opacity: Number(e.target.value) })}
            className="flex-1 accent-[#7c6aff] h-1 cursor-pointer"
          />
          <span className="text-xs text-white/40 w-7 text-right tabular-nums shrink-0">{(override.opacity as number) ?? 100}</span>
        </div>
      </Row>

      <Row label="Tamaño">
        <div className="flex items-center gap-2 w-32">
          <input
            type="range" min={4} max={40} step={1}
            value={(override.size as number) ?? 10}
            onChange={(e) => onUpdate({ size: Number(e.target.value) })}
            className="flex-1 accent-[#7c6aff] h-1 cursor-pointer"
          />
          <span className="text-xs text-white/40 w-7 text-right tabular-nums shrink-0">{(override.size as number) ?? 10}</span>
        </div>
      </Row>
    </div>
  )
}

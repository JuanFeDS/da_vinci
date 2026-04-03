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

export function BorderControls({ override, onUpdate }: Props) {
  return (
    <div className="space-y-3">
      <p className="section-label">Borde</p>

      <Row label="Color borde">
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={(override.borderColor as string) ?? '#ffffff'}
            onChange={(e) => onUpdate({ borderColor: e.target.value })}
            className={cn('w-7 h-7 rounded-md border cursor-pointer', override.borderColor ? 'border-white/30' : 'border-white/10 opacity-40')}
          />
          {override.borderColor && (
            <button onClick={() => onUpdate({ borderColor: undefined })} className="text-xs text-white/30 hover:text-white/60">✕</button>
          )}
        </div>
      </Row>

      <Row label="Grosor borde">
        <div className="flex items-center gap-2 w-32">
          <input
            type="range" min={0} max={6} step={1}
            value={(override.borderWidth as number) ?? 0}
            onChange={(e) => onUpdate({ borderWidth: Number(e.target.value) })}
            className="flex-1 accent-[#7c6aff] h-1 cursor-pointer"
          />
          <span className="text-xs text-white/40 w-7 text-right tabular-nums shrink-0">{(override.borderWidth as number) ?? 0}</span>
        </div>
      </Row>
    </div>
  )
}

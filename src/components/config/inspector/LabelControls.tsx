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

export function LabelControls({ override, onUpdate }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Etiqueta</p>

      <Row label="Mostrar">
        <button
          role="switch"
          aria-checked={override.labelShow ?? false}
          onClick={() => onUpdate({ labelShow: !(override.labelShow ?? false) })}
          className={cn(
            'relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 border',
            override.labelShow ? 'bg-accent border-accent/80' : 'bg-white/8 border-white/15',
          )}
        >
          <span className={cn(
            'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200',
            override.labelShow ? 'translate-x-5' : 'translate-x-0',
          )} />
        </button>
      </Row>

      <Row label="Texto">
        <input
          type="text"
          className="bg-white/[0.06] border border-white/[0.12] rounded-md px-2.5 py-1.5 text-xs text-white/90 placeholder:text-white/25 focus:outline-none focus:border-accent/50 focus:bg-white/[0.08] transition-all duration-150 w-32"
          placeholder="Auto"
          value={(override.labelText as string) ?? ''}
          onChange={(e) => onUpdate({ labelText: e.target.value || undefined })}
        />
      </Row>
    </div>
  )
}

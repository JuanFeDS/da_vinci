import { cn } from '@/utils/cn'
import type { ConfigControl } from '@/types/chart.types'

interface Props {
  control: ConfigControl
  value: unknown
  columns: string[]
  onChange: (key: string, value: unknown) => void
}

export function ControlRenderer({ control, value, columns, onChange }: Props) {
  if (control.type === 'select') {
    const opts = control.options ? control.options.map((o) => o.value) : columns
    return (
      <select
        className="input-field w-full text-xs"
        value={value as string}
        onChange={(e) => onChange(control.key, e.target.value)}
      >
        <option value="">— seleccionar —</option>
        {opts.map((col) => (
          <option key={col} value={col}>{col}</option>
        ))}
      </select>
    )
  }

  if (control.type === 'switch') {
    const checked = value as boolean
    return (
      <button
        onClick={() => onChange(control.key, !checked)}
        aria-checked={checked}
        role="switch"
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 border',
          checked
            ? 'bg-accent border-accent/80 shadow-[0_0_8px_rgba(124,106,255,0.4)]'
            : 'bg-white/8 border-white/15',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200',
            checked ? 'translate-x-5' : 'translate-x-0',
          )}
        />
      </button>
    )
  }

  if (control.type === 'slider') {
    return (
      <div className="flex items-center gap-2 w-full">
        <input
          type="range"
          min={control.min ?? 0}
          max={control.max ?? 100}
          step={control.step ?? 1}
          value={value as number}
          onChange={(e) => onChange(control.key, Number(e.target.value))}
          className="flex-1 accent-[#7c6aff] h-1 cursor-pointer"
        />
        <span className="text-xs text-white/40 w-7 text-right tabular-nums shrink-0">{value as number}</span>
      </div>
    )
  }

  if (control.type === 'text') {
    return (
      <input
        type="text"
        className="input-field w-full text-xs"
        value={(value as string) ?? ''}
        placeholder="Sin título"
        onChange={(e) => onChange(control.key, e.target.value)}
      />
    )
  }

  return null
}

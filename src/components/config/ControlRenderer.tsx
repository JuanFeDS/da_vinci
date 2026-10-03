import { useState, useEffect, useRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { ConfigControl } from '@/types/chart.types'

interface Props {
  control: ConfigControl
  value: unknown
  columns: string[]
  onChange: (key: string, value: unknown) => void
}

function SelectField({ value, opts, optLabels, onChange }: {
  value: string
  opts: string[]
  optLabels?: string[]
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const labelFor = (opt: string, i: number) => optLabels?.[i] ?? opt

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full bg-white/[0.06] border border-white/[0.12] rounded-md pl-2.5 pr-2 py-1.5 text-xs focus:outline-none focus:border-accent/50 transition-colors duration-150"
      >
        <span className={cn('truncate', value ? 'text-white/90' : 'text-white/35')}>
          {value ? (optLabels ? labelFor(value, opts.indexOf(value)) : value) : '— seleccionar —'}
        </span>
        <ChevronDown
          size={12}
          className={cn('shrink-0 ml-1 text-white/40 transition-transform duration-150', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-1 w-full bg-[#16161f] border border-white/[0.12] rounded-md shadow-2xl overflow-hidden">
          <div className="max-h-52 overflow-y-auto">
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false) }}
              className={cn(
                'w-full text-left px-2.5 py-1.5 text-xs transition-colors',
                !value ? 'text-white/60 bg-white/[0.06]' : 'text-white/30 hover:bg-white/[0.04] hover:text-white/60',
              )}
            >
              — seleccionar —
            </button>
            {opts.map((opt, i) => (
              <button
                key={opt}
                type="button"
                onClick={() => { onChange(opt); setOpen(false) }}
                className={cn(
                  'w-full text-left px-2.5 py-1.5 text-xs transition-colors',
                  value === opt
                    ? 'text-accent bg-accent/10'
                    : 'text-white/80 hover:bg-white/[0.06] hover:text-white',
                )}
              >
                {labelFor(opt, i)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function NumberField({ value, step, onChange }: { value: string; step?: number; onChange: (v: string) => void }) {
  const s   = step ?? 1
  const num = value !== '' ? Number(value) : null

  return (
    <div className="flex items-center w-full rounded-md border border-white/[0.12] bg-white/[0.06] overflow-hidden focus-within:border-accent/50 transition-colors duration-150">
      <button
        type="button"
        onClick={() => onChange(String(parseFloat(((num ?? 0) - s).toFixed(10))))}
        className="px-2.5 py-1.5 text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors text-xs select-none"
      >
        −
      </button>
      <input
        type="number"
        step={s}
        value={value}
        placeholder="auto"
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 min-w-0 bg-transparent text-center text-xs text-white/90 placeholder:text-white/25 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => onChange(String(parseFloat(((num ?? 0) + s).toFixed(10))))}
        className="px-2.5 py-1.5 text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors text-xs select-none"
      >
        +
      </button>
    </div>
  )
}

export function ControlRenderer({ control, value, columns, onChange }: Props) {
  if (control.type === 'select') {
    const opts      = control.options ? control.options.map((o) => o.value)  : columns
    const optLabels = control.options ? control.options.map((o) => o.label) : undefined
    return (
      <SelectField
        value={value as string}
        opts={opts}
        optLabels={optLabels}
        onChange={(v) => onChange(control.key, v)}
      />
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
          className="flex-1 cursor-pointer"
        />
        <span className="text-xs text-white/50 w-7 text-right tabular-nums shrink-0">{value as number}</span>
      </div>
    )
  }

  if (control.type === 'text') {
    return (
      <input
        type="text"
        className="bg-white/[0.06] border border-white/[0.12] rounded-md px-2.5 py-1.5 text-xs text-white/90 placeholder:text-white/25 focus:outline-none focus:border-accent/50 focus:bg-white/[0.08] transition-all duration-150 w-full"
        value={(value as string) ?? ''}
        placeholder="Sin título"
        onChange={(e) => onChange(control.key, e.target.value)}
      />
    )
  }

  if (control.type === 'number') {
    return (
      <NumberField
        value={(value as string) ?? ''}
        step={control.step}
        onChange={(v) => onChange(control.key, v)}
      />
    )
  }

  if (control.type === 'color') {
    const current = value as string
    return (
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={current || '#7c6aff'}
          onChange={(e) => onChange(control.key, e.target.value)}
          className="w-8 h-8 rounded cursor-pointer border border-white/10 bg-transparent p-0.5"
        />
        {current && (
          <button
            onClick={() => onChange(control.key, '')}
            className="text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            limpiar
          </button>
        )}
      </div>
    )
  }

  return null
}

import { RotateCcw } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { ChartPlugin, ChartConfig, ConfigControl } from '@/types/chart.types'
import type { ProcessedData } from '@/types/data.types'

interface Props {
  plugin: ChartPlugin
  config: ChartConfig
  data: ProcessedData
  onChange: (key: string, value: unknown) => void
  onReset: () => void
}

function ControlRenderer({
  control,
  value,
  columns,
  onChange,
}: {
  control: ConfigControl
  value: unknown
  columns: string[]
  onChange: (key: string, value: unknown) => void
}) {
  if (control.type === 'select') {
    return (
      <select
        className="input-field w-full"
        value={value as string}
        onChange={(e) => onChange(control.key, e.target.value)}
      >
        <option value="">— seleccionar —</option>
        {(control.options ? control.options.map((o) => o.value) : columns).map((col) => (
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
        className={cn(
          'relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0',
          checked ? 'bg-accent' : 'bg-white/10',
        )}
      >
        <span className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200', checked ? 'translate-x-5' : 'translate-x-0.5')} />
      </button>
    )
  }

  if (control.type === 'slider') {
    return (
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={control.min ?? 0}
          max={control.max ?? 100}
          step={control.step ?? 1}
          value={value as number}
          onChange={(e) => onChange(control.key, Number(e.target.value))}
          className="flex-1 accent-[#7c6aff] h-1"
        />
        <span className="text-xs text-white/40 w-8 text-right tabular-nums">{value as number}</span>
      </div>
    )
  }

  if (control.type === 'text') {
    return (
      <input
        type="text"
        className="input-field w-full"
        value={value as string}
        placeholder="Sin título"
        onChange={(e) => onChange(control.key, e.target.value)}
      />
    )
  }

  return null
}

export function ConfigPanel({ plugin, config, data, onChange, onReset }: Props) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
        <span className="text-sm font-semibold text-white">Configuración</span>
        <button onClick={onReset} className="btn-ghost text-xs flex items-center gap-1.5 py-1">
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-6">
        {plugin.configSections.map((section) => (
          <div key={section.id} className="space-y-3">
            <p className="section-label">{section.label}</p>
            <div className="space-y-3">
              {section.controls.map((control) => (
                <div key={control.key} className={cn('flex items-center gap-3', control.type === 'switch' ? 'justify-between' : 'flex-col items-start gap-1.5')}>
                  <label className="text-xs text-white/50 shrink-0">{control.label}</label>
                  <ControlRenderer
                    control={control}
                    value={config[control.key] ?? control.defaultValue}
                    columns={data.columns}
                    onChange={onChange}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

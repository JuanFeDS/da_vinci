import { useState } from 'react'
import { RotateCcw, ChevronDown, Settings, Palette } from 'lucide-react'
import { cn } from '@/utils/cn'
import { ControlRenderer } from './config/ControlRenderer'
import { TemplatePresets } from './config/TemplatePresets'
import { ColorEditor } from './config/ColorEditor'
import type { ChartPlugin, ChartConfig, ConfigSection } from '@/types/chart.types'
import type { ProcessedData } from '@/types/data.types'
import type { Theme } from '@/types/theme.types'

type TabId = 'config' | 'style'

interface Props {
  plugin: ChartPlugin
  config: ChartConfig
  data: ProcessedData
  themes: Theme[]
  activeThemeId: string
  onChange: (key: string, value: unknown) => void
  onReset: () => void
  onThemeSelect: (id: string) => void
  onApplyPreset: (overrides: Partial<ChartConfig>) => void
}

function CollapsibleSection({ section, config, columns, onChange }: { section: ConfigSection; config: ChartConfig; columns: string[]; onChange: (k: string, v: unknown) => void }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="space-y-2">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center justify-between w-full">
        <p className="section-label">{section.label}</p>
        <ChevronDown className={cn('w-3.5 h-3.5 text-white/30 transition-transform duration-200', open ? 'rotate-0' : '-rotate-90')} />
      </button>
      {open && (
        <div className="space-y-3">
          {section.controls.map((control) => (
            <div key={control.key} className={cn('flex items-center gap-3', control.type === 'switch' ? 'justify-between' : 'flex-col items-start gap-1.5')}>
              <label className="text-xs text-white/50 shrink-0 select-none">{control.label}</label>
              <ControlRenderer control={control} value={config[control.key] ?? control.defaultValue} columns={columns} onChange={onChange} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function ConfigPanel({ plugin, config, data, themes, activeThemeId, onChange, onReset, onThemeSelect, onApplyPreset }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('config')

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
        <span className="text-sm font-semibold text-white">Panel</span>
        <button onClick={onReset} className="btn-ghost text-xs flex items-center gap-1.5 py-1">
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>

      {/* Pestañas */}
      <div className="flex gap-1 px-2 pt-2 shrink-0">
        <button
          onClick={() => setActiveTab('config')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200',
            activeTab === 'config'
              ? 'bg-accent/20 text-white border border-accent/40'
              : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white/70',
          )}
        >
          <Settings className="w-3.5 h-3.5" />
          Configuración
        </button>
        <button
          onClick={() => setActiveTab('style')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200',
            activeTab === 'style'
              ? 'bg-accent/20 text-white border border-accent/40'
              : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white/70',
          )}
        >
          <Palette className="w-3.5 h-3.5" />
          Estilo
        </button>
      </div>

      {/* Contenido por pestaña */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {activeTab === 'config' && (
          <>
            {plugin.configSections.map((section) => (
              <CollapsibleSection key={section.id} section={section} config={config} columns={data.columns} onChange={onChange} />
            ))}
          </>
        )}

        {activeTab === 'style' && (
          <>
            <TemplatePresets onApply={onApplyPreset} />
            <div className="border-t border-white/5 pt-4">
              <ColorEditor themes={themes} activeId={activeThemeId} onSelect={onThemeSelect} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

import { useState, useMemo } from 'react'
import type { ElementType } from 'react'
import { RotateCcw, ChevronDown, Settings, Palette, MousePointer2 } from 'lucide-react'
import { cn } from '@/utils/cn'
import { ControlRenderer } from './config/ControlRenderer'
import { TemplatePresets } from './config/TemplatePresets'
import { ColorEditor } from './config/ColorEditor'
import { InspectorPanel } from './config/InspectorPanel'
import { ColorByPanel } from './config/ColorByPanel'
import type { ChartPlugin, ChartConfig, ConfigSection, InspectedElement, ElementOverride, ColorMode } from '@/types/chart.types'
import type { ProcessedData } from '@/types/data.types'
import type { Theme } from '@/types/theme.types'

type TabId = 'config' | 'style' | 'inspector'

interface Props {
  plugin: ChartPlugin
  config: ChartConfig
  data: ProcessedData
  themes: Theme[]
  activeThemeId: string
  inspectorActive: boolean
  selected: InspectedElement | null
  selectedOverride: ElementOverride
  onChange: (key: string, value: unknown) => void
  onReset: () => void
  onThemeSelect: (id: string) => void
  onApplyPreset: (overrides: Partial<ChartConfig>) => void
  onInspectorUpdate: (patch: Partial<ElementOverride>) => void
  onInspectorUpdateAll: (patch: Partial<ElementOverride>) => void
  onInspectorResetElement: () => void
  onClearSelection: () => void
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

const TABS: { id: TabId; label: string; Icon: ElementType }[] = [
  { id: 'config',    label: 'Config',    Icon: Settings },
  { id: 'style',     label: 'Estilo',    Icon: Palette },
  { id: 'inspector', label: 'Inspector', Icon: MousePointer2 },
]

export function ConfigPanel({ plugin, config, data, themes, activeThemeId, inspectorActive, selected, selectedOverride, onChange, onReset, onThemeSelect, onApplyPreset, onInspectorUpdate, onInspectorUpdateAll, onInspectorResetElement, onClearSelection }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('config')

  const categoryValues = useMemo(() => {
    const field = config.colorField as string
    if (!field) return []
    const seen = new Set<string>()
    data.data.forEach((row) => { if (row[field] != null) seen.add(String(row[field])) })
    return Array.from(seen).slice(0, 30)
  }, [data.data, config.colorField])

  const activeTheme = themes.find((t) => t.id === activeThemeId) ?? themes[0]

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
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[11px] font-medium transition-all duration-200 border',
              activeTab === id
                ? 'bg-accent/20 text-white border-accent/40'
                : cn(
                    'bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white/70',
                    id === 'inspector' && inspectorActive && 'border-accent/20 text-accent-light/60',
                  ),
            )}
          >
            <Icon className="w-3 h-3 shrink-0" />
            {label}
            {id === 'inspector' && inspectorActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-accent-light animate-pulse shrink-0" />
            )}
          </button>
        ))}
      </div>

      {/* Contenido por pestaña */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {activeTab === 'config' && plugin.configSections.map((section) => (
          <CollapsibleSection key={section.id} section={section} config={config} columns={data.columns} onChange={onChange} />
        ))}

        {activeTab === 'style' && (
          <>
            <TemplatePresets onApply={onApplyPreset} />
            <div className="border-t border-white/5 pt-4">
              <ColorEditor themes={themes} activeId={activeThemeId} onSelect={onThemeSelect} />
            </div>
            {plugin.supportsColorBy && (
              <div className="border-t border-white/5 pt-4">
                <ColorByPanel
                  colorMode={config.colorMode as ColorMode}
                  colorField={config.colorField as string}
                  colorMap={config.colorMap as Record<string, string>}
                  columns={data.columns}
                  categoryValues={categoryValues}
                  themeColors={activeTheme?.colors ?? []}
                  onModeChange={(m) => onChange('colorMode', m)}
                  onFieldChange={(f) => onChange('colorField', f)}
                  onColorMapChange={(k, v) => onChange('colorMap', { ...(config.colorMap as Record<string, string>), [k]: v })}
                />
              </div>
            )}
          </>
        )}

        {activeTab === 'inspector' && (
          <InspectorPanel
            selected={selected}
            override={selectedOverride}
            inspectorActive={inspectorActive}
            onUpdate={onInspectorUpdate}
            onUpdateAll={onInspectorUpdateAll}
            onReset={onInspectorResetElement}
            onClearSelection={onClearSelection}
          />
        )}
      </div>
    </div>
  )
}

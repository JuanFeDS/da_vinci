import { useState, useMemo } from 'react'
import { RotateCcw, ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'
import { ControlRenderer } from './config/ControlRenderer'
import { TemplatePresets } from './config/TemplatePresets'
import { ColorEditor } from './config/ColorEditor'
import { InspectorPanel } from './config/InspectorPanel'
import { ColorByPanel } from './config/ColorByPanel'
import { FilterPanel } from './config/FilterPanel'
import type { ChartPlugin, ChartConfig, ConfigControl, ConfigSection, InspectedElement, ElementOverride, ColorMode, DataFilter } from '@/types/chart.types'
import type { ProcessedData } from '@/types/data.types'
import type { Theme } from '@/types/theme.types'

type TabId = 'config' | 'style' | 'filters' | 'inspector'

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

type ControlRow = { type: 'single'; control: ConfigControl } | { type: 'group'; controls: ConfigControl[] }

function groupControls(controls: ConfigControl[]): ControlRow[] {
  const rows: ControlRow[] = []
  const seen = new Map<string, ConfigControl[]>()
  for (const control of controls) {
    if (control.group) {
      if (!seen.has(control.group)) {
        const group: ConfigControl[] = []
        seen.set(control.group, group)
        rows.push({ type: 'group', controls: group })
      }
      seen.get(control.group)!.push(control)
    } else {
      rows.push({ type: 'single', control })
    }
  }
  return rows
}

function CollapsibleSection({ section, config, columns, onChange }: { section: ConfigSection; config: ChartConfig; columns: string[]; onChange: (k: string, v: unknown) => void }) {
  const [open, setOpen] = useState(true)
  const rows = groupControls(section.controls)
  return (
    <div className="space-y-2">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center justify-between w-full">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">{section.label}</p>
        <ChevronDown className={cn('w-3.5 h-3.5 text-white/30 transition-transform duration-200', open ? 'rotate-0' : '-rotate-90')} />
      </button>
      {open && (
        <div className="space-y-3">
          {rows.map((row) => {
            if (row.type === 'single') {
              const control = row.control
              return (
                <div key={control.key} className={cn('flex items-center gap-3', control.type === 'switch' ? 'justify-between' : 'flex-col items-start gap-1.5')}>
                  <label className="text-xs text-white/50 shrink-0 select-none">{control.label}</label>
                  <ControlRenderer control={control} value={config[control.key] ?? control.defaultValue} columns={columns} onChange={onChange} />
                </div>
              )
            }
            return (
              <div key={row.controls.map((c) => c.key).join('-')} className="flex gap-3">
                {row.controls.map((control) => (
                  <div key={control.key} className="flex flex-col gap-1 flex-1">
                    <label className="text-xs text-white/50 select-none">{control.label}</label>
                    <ControlRenderer control={control} value={config[control.key] ?? control.defaultValue} columns={columns} onChange={onChange} />
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'config',    label: 'Config'    },
  { id: 'style',     label: 'Estilo'    },
  { id: 'filters',   label: 'Filtros'   },
  { id: 'inspector', label: 'Inspector' },
]

export function ConfigPanel({ plugin, config, data, themes, activeThemeId, inspectorActive, selected, selectedOverride, onChange, onReset, onThemeSelect, onApplyPreset, onInspectorUpdate, onInspectorUpdateAll, onInspectorResetElement, onClearSelection }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('config')

  const filters = (config.filters as DataFilter[] | undefined) ?? []
  const activeFilterCount = filters.filter(
    (f) => f.column && f.selectedValues.length > 0,
  ).length

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
        <button onClick={onReset} className="text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200 text-xs flex items-center gap-1.5 px-2 py-1 rounded-lg">
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>

      {/* Pestañas */}
      <div className="flex border-b border-white/[0.06] shrink-0">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1 py-2 text-[11px] font-medium transition-all duration-150 border-b-2 -mb-px',
              activeTab === id
                ? 'border-accent text-white'
                : cn(
                    'border-transparent text-white/35 hover:text-white/60',
                    id === 'inspector' && inspectorActive && 'text-accent-light/60',
                  ),
            )}
          >
            {label}
            {id === 'inspector' && inspectorActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-accent-light animate-pulse shrink-0" />
            )}
            {id === 'filters' && activeFilterCount > 0 && (
              <span className="w-3.5 h-3.5 rounded-full bg-accent/60 text-white text-[9px] flex items-center justify-center shrink-0">
                {activeFilterCount}
              </span>
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

        {activeTab === 'filters' && (
          <FilterPanel
            filters={filters}
            data={data.data}
            columns={data.columns}
            onChange={(f) => onChange('filters', f)}
          />
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

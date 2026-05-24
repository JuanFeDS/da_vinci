import { useMemo, useState } from 'react'
import { Plus, X, ChevronDown, Search } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { DataFilter } from '@/types/chart.types'
import type { DataRow } from '@/types/data.types'

interface Props {
  filters: DataFilter[]
  data: DataRow[]
  columns: string[]
  onChange: (filters: DataFilter[]) => void
}

function FilterCard({
  filter, data, columns, onUpdate, onRemove,
}: {
  filter: DataFilter
  data: DataRow[]
  columns: string[]
  onUpdate: (patch: Partial<DataFilter>) => void
  onRemove: () => void
}) {
  const [search, setSearch] = useState('')

  const uniqueValues = useMemo(() => {
    if (!filter.column) return []
    const seen = new Set<string>()
    for (const row of data) {
      const v = row[filter.column]
      if (v != null) seen.add(String(v))
    }
    return Array.from(seen).sort()
  }, [data, filter.column])

  const filtered = search
    ? uniqueValues.filter((v) => v.toLowerCase().includes(search.toLowerCase()))
    : uniqueValues

  const allSelected = uniqueValues.every((v) => filter.selectedValues.includes(v))
  const noneSelected = filter.selectedValues.length === 0

  const toggleValue = (val: string) => {
    const next = filter.selectedValues.includes(val)
      ? filter.selectedValues.filter((v) => v !== val)
      : [...filter.selectedValues, val]
    onUpdate({ selectedValues: next })
  }

  const handleColumnChange = (col: string) => {
    onUpdate({ column: col, selectedValues: [] })
    setSearch('')
  }

  const activeCount = filter.column
    ? uniqueValues.length - filter.selectedValues.filter((v) => uniqueValues.includes(v)).length === 0
      ? 0
      : uniqueValues.length - filter.selectedValues.filter((v) => uniqueValues.includes(v)).length
    : 0

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] overflow-hidden">
      {/* Card header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
        <select
          value={filter.column}
          onChange={(e) => handleColumnChange(e.target.value)}
          className="flex-1 bg-transparent text-xs text-white/80 outline-none cursor-pointer appearance-none"
        >
          <option value="" disabled className="bg-surface-900 text-white/60">Seleccionar columna…</option>
          {columns.map((col) => (
            <option key={col} value={col} className="bg-surface-900 text-white">{col}</option>
          ))}
        </select>
        {activeCount > 0 && (
          <span className="text-[10px] bg-accent/20 text-accent-light px-1.5 py-0.5 rounded-full shrink-0">
            -{activeCount}
          </span>
        )}
        <button onClick={onRemove} className="text-white/30 hover:text-white/70 transition-colors shrink-0">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Values */}
      {filter.column && uniqueValues.length > 0 && (
        <div className="px-3 py-2 space-y-2">
          {/* Search + select all/none */}
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-1.5 bg-white/5 rounded-md px-2 py-1">
              <Search className="w-3 h-3 text-white/30 shrink-0" />
              <input
                type="text"
                placeholder="Buscar…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-xs text-white/70 outline-none placeholder:text-white/25 min-w-0"
              />
            </div>
            <button
              onClick={() => onUpdate({ selectedValues: allSelected ? [] : [...uniqueValues] })}
              className="text-[10px] text-white/40 hover:text-accent-light transition-colors shrink-0"
            >
              {allSelected ? 'Ninguno' : 'Todos'}
            </button>
          </div>

          {/* Checkboxes */}
          <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
            {filtered.map((val) => {
              const checked = filter.selectedValues.includes(val)
              return (
                <label key={val} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleValue(val)}
                    className="w-3 h-3 accent-accent rounded cursor-pointer shrink-0"
                  />
                  <span className={cn(
                    'text-xs truncate transition-colors',
                    checked ? 'text-white/80' : 'text-white/35 line-through',
                  )}>
                    {val}
                  </span>
                </label>
              )
            })}
            {filtered.length === 0 && (
              <p className="text-xs text-white/25 py-1">Sin resultados</p>
            )}
          </div>

          {!noneSelected && !allSelected && (
            <p className="text-[10px] text-white/30">
              {filter.selectedValues.length} de {uniqueValues.length} valores activos
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export function FilterPanel({ filters, data, columns, onChange }: Props) {
  const [open, setOpen] = useState(true)

  const addFilter = () => {
    const id = Math.random().toString(36).slice(2)
    onChange([...filters, { id, column: '', selectedValues: [] }])
  }

  const updateFilter = (id: string, patch: Partial<DataFilter>) => {
    onChange(filters.map((f) => (f.id === id ? { ...f, ...patch } : f)))
  }

  const removeFilter = (id: string) => {
    onChange(filters.filter((f) => f.id !== id))
  }

  const activeFilters = filters.filter(
    (f) => f.column && f.selectedValues.length > 0 && f.selectedValues.length < (
      new Set(data.map((r) => String(r[f.column] ?? ''))).size
    ),
  )

  return (
    <div className="space-y-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full"
      >
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Filtros</p>
          {activeFilters.length > 0 && (
            <span className="text-[10px] bg-accent/20 text-accent-light px-1.5 py-0.5 rounded-full">
              {activeFilters.length} activo{activeFilters.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <ChevronDown className={cn('w-3.5 h-3.5 text-white/30 transition-transform duration-200', open ? 'rotate-0' : '-rotate-90')} />
      </button>

      {open && (
        <div className="space-y-2">
          {filters.length === 0 ? (
            <p className="text-xs text-white/25 py-1">Sin filtros aplicados</p>
          ) : (
            filters.map((f) => (
              <FilterCard
                key={f.id}
                filter={f}
                data={data}
                columns={columns}
                onUpdate={(patch) => updateFilter(f.id, patch)}
                onRemove={() => removeFilter(f.id)}
              />
            ))
          )}

          <button
            onClick={addFilter}
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-accent-light transition-colors py-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Añadir filtro
          </button>
        </div>
      )}
    </div>
  )
}

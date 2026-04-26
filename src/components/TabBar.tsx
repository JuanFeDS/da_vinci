import { useState, useRef, useEffect } from 'react'
import { X, Plus, Copy } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { Visualization, SaveStatus } from '@/types/visualization.types'

interface Props {
  tabs: Visualization[]
  activeTabId: string | null
  saveStatuses: Record<string, SaveStatus>
  onSwitch: (id: string) => void
  onClose: (id: string) => void
  onNew: () => void
  onRename: (id: string, name: string) => void
  onDuplicate: (id: string) => void
}

export function TabBar({ tabs, activeTabId, saveStatuses, onSwitch, onClose, onNew, onRename, onDuplicate }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const confirmCalledRef = useRef(false)

  useEffect(() => {
    if (editingId && inputRef.current) inputRef.current.select()
  }, [editingId])

  const startEdit = (tab: Visualization) => {
    confirmCalledRef.current = false
    setEditingId(tab.id)
    setEditValue(tab.name)
  }

  const confirmEdit = () => {
    if (!editingId || confirmCalledRef.current) return
    confirmCalledRef.current = true
    const trimmed = editValue.trim()
    if (trimmed) onRename(editingId, trimmed)
    setEditingId(null)
  }

  return (
    <div className="flex items-stretch h-9 border-b border-white/5 bg-surface-950 overflow-x-auto shrink-0">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId
        const status   = saveStatuses[tab.id]
        return (
          <div
            key={tab.id}
            onClick={() => onSwitch(tab.id)}
            onDoubleClick={() => startEdit(tab)}
            className={cn(
              'group relative flex items-center gap-1.5 px-3 border-r border-white/5',
              'cursor-pointer shrink-0 transition-colors select-none',
              'min-w-[90px] max-w-[200px]',
              isActive
                ? 'bg-white/5 text-white'
                : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]',
            )}
          >
            {/* Active underline */}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-px bg-accent" />
            )}

            {/* Save status dot */}
            <span
              className={cn(
                'w-1.5 h-1.5 rounded-full shrink-0 transition-colors',
                status === 'unsaved' && 'bg-orange-400',
                status === 'saving'  && 'bg-yellow-400 animate-pulse',
                (!status || status === 'saved') && 'bg-transparent',
              )}
            />

            {/* Name / editable input */}
            {editingId === tab.id ? (
              <input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={confirmEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); confirmEdit() }
                  if (e.key === 'Escape') { confirmCalledRef.current = true; setEditingId(null) }
                }}
                onClick={(e) => e.stopPropagation()}
                className="min-w-0 flex-1 text-xs bg-transparent border-none outline-none text-white"
              />
            ) : (
              <span className="text-xs truncate flex-1">{tab.name}</span>
            )}

            {/* Duplicate */}
            <button
              onClick={(e) => { e.stopPropagation(); onDuplicate(tab.id) }}
              title="Duplicar pestaña"
              className={cn(
                'shrink-0 rounded p-0.5 transition-colors',
                'text-transparent group-hover:text-white/40 hover:!text-white hover:bg-white/10',
              )}
            >
              <Copy className="w-3 h-3" />
            </button>

            {/* Close */}
            <button
              onClick={(e) => { e.stopPropagation(); onClose(tab.id) }}
              title="Cerrar pestaña"
              className={cn(
                'shrink-0 rounded p-0.5 transition-colors',
                'text-transparent group-hover:text-white/40 hover:!text-white hover:bg-white/10',
              )}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )
      })}

      <button
        onClick={onNew}
        title="Nueva visualización"
        className="flex items-center justify-center w-9 shrink-0 text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors border-r border-white/5"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

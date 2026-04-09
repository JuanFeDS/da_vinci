import { useState, useRef, useEffect, useCallback, type CSSProperties, type RefObject } from 'react'
import type { TextBlock } from '@/types/chart.types'

interface Props {
  blocks: TextBlock[]
  containerRef: RefObject<HTMLDivElement | null>
  onChange: (blocks: TextBlock[]) => void
  /** When set, this block id will immediately enter edit mode */
  autoEditId?: string | null
  onAutoEditConsumed?: () => void
}

const FONT_FAMILIES = [
  { label: 'Sistema', value: 'Inter, system-ui, sans-serif' },
  { label: 'Serif', value: 'Georgia, serif' },
  { label: 'Mono', value: "'Courier New', monospace" },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Times', value: "'Times New Roman', serif" },
]

const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 56, 64, 72]

const btnBase: CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '2px 5px',
  borderRadius: 4,
  lineHeight: 1,
  fontSize: 12,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

// 8-direction resize handles
type ResizeHandle = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw'

const HANDLE_STYLE: Record<ResizeHandle, CSSProperties> = {
  n:  { top: -5,  left: '50%', transform: 'translateX(-50%)', cursor: 'n-resize' },
  ne: { top: -5,  right: -5,                                  cursor: 'ne-resize' },
  e:  { top: '50%', right: -5, transform: 'translateY(-50%)', cursor: 'e-resize' },
  se: { bottom: -5, right: -5,                                 cursor: 'se-resize' },
  s:  { bottom: -5, left: '50%', transform: 'translateX(-50%)', cursor: 's-resize' },
  sw: { bottom: -5, left: -5,                                  cursor: 'sw-resize' },
  w:  { top: '50%', left: -5, transform: 'translateY(-50%)', cursor: 'w-resize' },
  nw: { top: -5,  left: -5,                                   cursor: 'nw-resize' },
}

const ALL_HANDLES: ResizeHandle[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']

const MIN_W = 60
const MIN_H = 24

export function TextBlockLayer({ blocks, containerRef, onChange, autoEditId, onAutoEditConsumed }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // ── Auto-edit newly added block ────────────────────────────────────────────
  useEffect(() => {
    if (!autoEditId) return
    const block = blocks.find((b) => b.id === autoEditId)
    if (block) {
      setSelectedId(autoEditId)
      setEditingId(autoEditId)
      setEditingText(block.text)
      onAutoEditConsumed?.()
    }
  }, [autoEditId])

  // ── Deselect on outside click ──────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: PointerEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-textblock]')) {
        setSelectedId(null)
        setConfirmDeleteId(null)
      }
    }
    document.addEventListener('pointerdown', handler, { capture: true })
    return () => document.removeEventListener('pointerdown', handler, { capture: true })
  }, [])

  // ── Helpers ────────────────────────────────────────────────────────────────
  const updateBlock = useCallback((id: string, patch: Partial<TextBlock>) => {
    onChange(blocks.map((b) => b.id === id ? { ...b, ...patch } : b))
  }, [blocks, onChange])

  const commitEdit = useCallback(() => {
    if (!editingId) return
    const id = editingId
    const trimmed = editingText.trim()
    setEditingId(null)
    if (trimmed) {
      onChange(blocks.map((b) => b.id === id ? { ...b, text: trimmed } : b))
    } else {
      onChange(blocks.filter((b) => b.id !== id))
      setSelectedId(null)
    }
  }, [editingId, editingText, blocks, onChange])

  // ── Move drag ──────────────────────────────────────────────────────────────
  const moveDrag = useRef<{
    id: string; el: HTMLElement
    startPX: number; startPY: number
    origX: number; origY: number
    curX: number; curY: number
    moved: boolean
  } | null>(null)

  const onMoveDown = (e: React.PointerEvent<HTMLDivElement>, block: TextBlock) => {
    if (editingId === block.id) return
    e.stopPropagation()
    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)
    moveDrag.current = {
      id: block.id, el,
      startPX: e.clientX, startPY: e.clientY,
      origX: block.x, origY: block.y,
      curX: block.x, curY: block.y,
      moved: false,
    }
  }

  const onMoveMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = moveDrag.current
    if (!d || !containerRef.current) return
    const cw = containerRef.current.offsetWidth
    const ch = containerRef.current.offsetHeight
    d.curX = Math.max(0, Math.min(100, d.origX + ((e.clientX - d.startPX) / cw) * 100))
    d.curY = Math.max(0, Math.min(100, d.origY + ((e.clientY - d.startPY) / ch) * 100))
    d.el.style.left = `${d.curX}%`
    d.el.style.top = `${d.curY}%`
    if (Math.abs(e.clientX - d.startPX) > 3 || Math.abs(e.clientY - d.startPY) > 3) d.moved = true
  }

  const onMoveUp = (_e: React.PointerEvent<HTMLDivElement>, block: TextBlock) => {
    const d = moveDrag.current
    moveDrag.current = null
    if (!d) return
    if (!d.moved) {
      setSelectedId(block.id)
      return
    }
    onChange(blocks.map((b) => b.id === d.id ? { ...b, x: d.curX, y: d.curY } : b))
  }

  // ── Resize drag (8 handles) ────────────────────────────────────────────────
  const resizeDrag = useRef<{
    id: string
    blockEl: HTMLElement
    handle: ResizeHandle
    startPX: number; startPY: number
    origX: number; origY: number  // % position
    origW: number; origH: number  // px size
    curX: number; curY: number
    curW: number; curH: number
  } | null>(null)

  const onResizeDown = (e: React.PointerEvent<HTMLDivElement>, block: TextBlock, handle: ResizeHandle) => {
    e.stopPropagation()
    e.preventDefault()
    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)
    const blockEl = document.getElementById(`tb-${block.id}`) as HTMLElement
    const origH = block.height ?? blockEl.offsetHeight
    resizeDrag.current = {
      id: block.id, blockEl, handle,
      startPX: e.clientX, startPY: e.clientY,
      origX: block.x, origY: block.y,
      origW: block.width, origH,
      curX: block.x, curY: block.y,
      curW: block.width, curH: origH,
    }
  }

  const onResizeMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = resizeDrag.current
    if (!d || !containerRef.current) return
    const cw = containerRef.current.offsetWidth
    const ch = containerRef.current.offsetHeight
    const dx = e.clientX - d.startPX
    const dy = e.clientY - d.startPY
    const h = d.handle

    let newW = d.origW
    let newH = d.origH
    let newX = d.origX
    let newY = d.origY

    // Horizontal axis
    if (h === 'e' || h === 'ne' || h === 'se') {
      newW = Math.max(MIN_W, d.origW + dx)
    } else if (h === 'w' || h === 'nw' || h === 'sw') {
      const clampedDx = Math.min(dx, d.origW - MIN_W)
      newW = Math.max(MIN_W, d.origW - clampedDx)
      newX = d.origX + (clampedDx / cw) * 100
    }

    // Vertical axis
    if (h === 's' || h === 'se' || h === 'sw') {
      newH = Math.max(MIN_H, d.origH + dy)
    } else if (h === 'n' || h === 'ne' || h === 'nw') {
      const clampedDy = Math.min(dy, d.origH - MIN_H)
      newH = Math.max(MIN_H, d.origH - clampedDy)
      newY = d.origY + (clampedDy / ch) * 100
    }

    d.curW = newW; d.curH = newH; d.curX = newX; d.curY = newY

    d.blockEl.style.width = `${newW}px`
    d.blockEl.style.height = `${newH}px`
    d.blockEl.style.left = `${newX}%`
    d.blockEl.style.top = `${newY}%`
  }

  const onResizeUp = () => {
    const d = resizeDrag.current
    resizeDrag.current = null
    if (!d) return
    onChange(blocks.map((b) =>
      b.id === d.id ? { ...b, x: d.curX, y: d.curY, width: d.curW, height: d.curH } : b
    ))
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 30 }}>
      {blocks.map((block) => {
        const isSel = selectedId === block.id
        const isEditing = editingId === block.id
        const isConfirmDelete = confirmDeleteId === block.id

        const textStyle: CSSProperties = {
          color: block.color,
          fontFamily: block.fontFamily,
          fontSize: block.fontSize,
          fontWeight: block.bold ? 'bold' : 'normal',
          fontStyle: block.italic ? 'italic' : 'normal',
          lineHeight: 1.4,
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
        }

        return (
          <div
            key={block.id}
            id={`tb-${block.id}`}
            data-textblock="true"
            style={{
              position: 'absolute',
              left: `${block.x}%`,
              top: `${block.y}%`,
              width: block.width,
              height: block.height ?? 'auto',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'auto',
              cursor: isEditing ? 'text' : 'move',
              userSelect: 'none',
              boxSizing: 'border-box',
            }}
            onPointerDown={(e) => onMoveDown(e, block)}
            onPointerMove={onMoveMove}
            onPointerUp={(e) => onMoveUp(e, block)}
            onDoubleClick={(e) => {
              e.stopPropagation()
              setSelectedId(block.id)
              setEditingId(block.id)
              setEditingText(block.text)
            }}
          >
            {/* ── Formatting toolbar ── */}
            {isSel && !isEditing && (
              <div
                data-textblock="true"
                style={{
                  position: 'absolute',
                  bottom: 'calc(100% + 8px)',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  background: 'rgba(15,15,25,0.97)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  padding: '4px 6px',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                  zIndex: 60,
                }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                {/* Font family */}
                <select
                  value={block.fontFamily}
                  onChange={(e) => updateBlock(block.id, { fontFamily: e.target.value })}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 4,
                    color: 'rgba(255,255,255,0.75)',
                    fontSize: 11,
                    padding: '2px 4px',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  {FONT_FAMILIES.map((f) => (
                    <option key={f.value} value={f.value} style={{ background: '#0f0f19' }}>
                      {f.label}
                    </option>
                  ))}
                </select>

                <Divider />

                {/* Font size */}
                <button
                  style={{ ...btnBase, color: 'rgba(255,255,255,0.6)', fontSize: 14, paddingInline: 4 }}
                  onClick={() => {
                    const prev = FONT_SIZES.filter((s) => s < block.fontSize)
                    if (prev.length) updateBlock(block.id, { fontSize: prev[prev.length - 1] })
                  }}
                >−</button>
                <select
                  value={block.fontSize}
                  onChange={(e) => updateBlock(block.id, { fontSize: Number(e.target.value) })}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 4,
                    color: 'rgba(255,255,255,0.75)',
                    fontSize: 11,
                    padding: '2px 2px',
                    width: 40,
                    textAlign: 'center',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  {FONT_SIZES.map((s) => (
                    <option key={s} value={s} style={{ background: '#0f0f19' }}>{s}</option>
                  ))}
                </select>
                <button
                  style={{ ...btnBase, color: 'rgba(255,255,255,0.6)', fontSize: 14, paddingInline: 4 }}
                  onClick={() => {
                    const next = FONT_SIZES.filter((s) => s > block.fontSize)
                    if (next.length) updateBlock(block.id, { fontSize: next[0] })
                  }}
                >+</button>

                <Divider />

                {/* Bold */}
                <button
                  title="Negrita"
                  style={{
                    ...btnBase,
                    fontWeight: 'bold',
                    color: block.bold ? '#a78bfa' : 'rgba(255,255,255,0.45)',
                    background: block.bold ? 'rgba(167,139,250,0.15)' : 'none',
                  }}
                  onClick={() => updateBlock(block.id, { bold: !block.bold })}
                >B</button>

                {/* Italic */}
                <button
                  title="Cursiva"
                  style={{
                    ...btnBase,
                    fontStyle: 'italic',
                    color: block.italic ? '#a78bfa' : 'rgba(255,255,255,0.45)',
                    background: block.italic ? 'rgba(167,139,250,0.15)' : 'none',
                  }}
                  onClick={() => updateBlock(block.id, { italic: !block.italic })}
                >I</button>

                <Divider />

                {/* Color picker */}
                <label
                  title="Color del texto"
                  style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '2px 3px' }}
                >
                  <div style={{
                    width: 16, height: 16, borderRadius: 3,
                    border: '1px solid rgba(255,255,255,0.25)',
                    background: block.color,
                    boxShadow: `0 0 0 1px rgba(0,0,0,0.3)`,
                  }} />
                  <input
                    type="color"
                    value={block.color}
                    onChange={(e) => updateBlock(block.id, { color: e.target.value })}
                    style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
                    tabIndex={-1}
                  />
                </label>

                <Divider />

                {/* Delete */}
                {isConfirmDelete ? (
                  <>
                    <span style={{ color: 'rgba(255,200,200,0.8)', fontSize: 10, paddingInline: 2 }}>¿Eliminar?</span>
                    <button
                      style={{ ...btnBase, color: '#f87171', fontSize: 11 }}
                      onClick={() => {
                        onChange(blocks.filter((b) => b.id !== block.id))
                        setConfirmDeleteId(null)
                        setSelectedId(null)
                      }}
                    >Sí</button>
                    <button
                      style={{ ...btnBase, color: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                      onClick={() => setConfirmDeleteId(null)}
                    >No</button>
                  </>
                ) : (
                  <button
                    title="Eliminar bloque"
                    style={{ ...btnBase, color: 'rgba(248,113,113,0.6)', fontSize: 13 }}
                    onClick={() => setConfirmDeleteId(block.id)}
                  >✕</button>
                )}
              </div>
            )}

            {/* ── Text content or inline editor ── */}
            {isEditing ? (
              <textarea
                autoFocus
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') { e.preventDefault(); setEditingId(null) }
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitEdit() }
                }}
                onPointerDown={(e) => e.stopPropagation()}
                style={{
                  ...textStyle,
                  width: '100%',
                  height: block.height ? '100%' : undefined,
                  background: 'rgba(0,0,0,0.7)',
                  border: '1px solid rgba(167,139,250,0.5)',
                  borderRadius: 6,
                  padding: '4px 8px',
                  outline: 'none',
                  resize: 'none',
                  display: 'block',
                  cursor: 'text',
                  userSelect: 'text',
                  boxSizing: 'border-box',
                }}
              />
            ) : (
              <div
                style={{
                  ...textStyle,
                  padding: '4px 8px',
                  height: block.height ? '100%' : undefined,
                  overflow: block.height ? 'hidden' : undefined,
                  borderRadius: 6,
                  border: isSel
                    ? '1px solid rgba(167,139,250,0.55)'
                    : '1px solid transparent',
                  background: isSel
                    ? 'rgba(167,139,250,0.06)'
                    : 'rgba(0,0,0,0)',
                  transition: 'border-color 0.15s, background 0.15s',
                  boxSizing: 'border-box',
                }}
              >
                {block.text}
              </div>
            )}

            {/* ── 8-direction resize handles ── */}
            {isSel && !isEditing && ALL_HANDLES.map((h) => (
              <div
                key={h}
                data-textblock="true"
                style={{
                  position: 'absolute',
                  width: 10,
                  height: 10,
                  background: '#a78bfa',
                  border: '1.5px solid rgba(255,255,255,0.5)',
                  borderRadius: 2,
                  pointerEvents: 'auto',
                  zIndex: 10,
                  ...HANDLE_STYLE[h],
                }}
                onPointerDown={(e) => onResizeDown(e, block, h)}
                onPointerMove={onResizeMove}
                onPointerUp={onResizeUp}
              />
            ))}
          </div>
        )
      })}
    </div>
  )
}

function Divider() {
  return <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.1)', marginInline: 1 }} />
}

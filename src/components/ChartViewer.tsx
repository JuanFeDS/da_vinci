import { useRef, useMemo, useCallback, useState, useEffect } from 'react'
import ReactECharts from 'echarts-for-react'
import type EChartsReact from 'echarts-for-react'
import { Download, RotateCcw, FileJson, MousePointer2, GripVertical, Type } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { ChartPlugin, ChartConfig, InspectedElement, TextBlock } from '@/types/chart.types'
import type { Theme } from '@/types/theme.types'
import type { DataRow } from '@/types/data.types'
import { exportChartAsPNG } from '@/utils/chartExport'
import { exportConfigAsJSON } from '@/utils/configExport'
import { TextBlockLayer } from '@/components/TextBlockLayer'

interface ActionPopup {
  fromCat: string
  toCat: string
  x: number
  y: number
  stage: 'choice' | 'merge'
  mergeLabel: string
}

interface LabelEditPopup {
  original: string
  initialDisplay: string  // display text when editing started, to detect first keypress
  x: number
  y: number
  value: string
  type: 'axis' | 'series'
}

interface Props {
  plugin: ChartPlugin
  config: ChartConfig
  data: DataRow[]
  theme: Theme
  inspectorActive: boolean
  onToggleInspector: () => void
  onElementClick: (el: InspectedElement) => void
  onReset: () => void
  onReorder?: (fromCat: string, toCat: string) => void
  onMerge?: (fromCat: string, toCat: string, label: string) => void
  onLabelRename?: (original: string, newLabel: string) => void
  onSeriesNameRename?: (original: string, newLabel: string) => void
  onTextBlocksChange?: (blocks: TextBlock[]) => void
  onLegendChange?: (selected: Record<string, boolean>) => void
}

// Compute bar pixel bounds using ECharts axis conversion
function computeBarBounds(
  instance: ReturnType<EChartsReact['getEchartsInstance']>,
  catIdx: number,
  barValue: number,
  isHorizontal: boolean,
): { x: number; y: number; w: number; h: number } | null {
  try {
    const cvt = instance.convertToPixel.bind(instance) as (f: unknown, v: unknown) => number

    if (isHorizontal) {
      // category on Y axis, value on X axis
      const y0 = cvt({ yAxisIndex: 0 }, 0)
      const y1 = cvt({ yAxisIndex: 0 }, 1)
      const slotH = Math.abs(y1 - y0)
      const barH = slotH * 0.6
      const centerY = cvt({ yAxisIndex: 0 }, catIdx)
      const rightPx = cvt({ xAxisIndex: 0 }, barValue)
      const leftPx = cvt({ xAxisIndex: 0 }, 0)
      const barW = Math.abs(rightPx - leftPx)
      return { x: Math.min(leftPx, rightPx), y: centerY - barH / 2, w: barW, h: barH }
    } else {
      // category on X axis, value on Y axis
      const x0 = cvt({ xAxisIndex: 0 }, 0)
      const x1 = cvt({ xAxisIndex: 0 }, 1)
      const slotW = Math.abs(x1 - x0)
      const barW = slotW * 0.6
      const centerX = cvt({ xAxisIndex: 0 }, catIdx)
      const topPx = cvt({ yAxisIndex: 0 }, barValue)
      const bottomPx = cvt({ yAxisIndex: 0 }, 0)
      const barH = Math.abs(bottomPx - topPx)
      return { x: centerX - barW / 2, y: Math.min(topPx, bottomPx), w: barW, h: barH }
    }
  } catch {
    return null
  }
}

export function ChartViewer({
  plugin, config, data, theme,
  inspectorActive, onToggleInspector, onElementClick, onReset,
  onReorder, onMerge, onLabelRename, onSeriesNameRename, onTextBlocksChange, onLegendChange,
}: Props) {
  const chartRef = useRef<EChartsReact | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const ghostRef = useRef<HTMLDivElement>(null)
  const targetRef = useRef<HTMLDivElement>(null)

  const [dragMode, setDragMode] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [actionPopup, setActionPopup] = useState<ActionPopup | null>(null)
  const [labelEditPopup, setLabelEditPopup] = useState<LabelEditPopup | null>(null)

  // Text blocks
  const [pendingEditId, setPendingEditId] = useState<string | null>(null)
  const textBlocks = (config.textBlocks as TextBlock[] | undefined) ?? []

  // Keep a ref to config so dblclick handler (stable callback) can read latest overrides
  const configRef = useRef(config)
  useEffect(() => { configRef.current = config }, [config])
  // Guard against double-call: blur fires when focused input is removed from DOM on Enter
  const labelConfirmCalled = useRef(false)

  // Mutable drag state — avoids stale closure issues in ZRender handlers
  const zrState = useRef<{ active: boolean; fromIdx: number | null }>({ active: false, fromIdx: null })
  // Ghost dimensions stored in a ref so mousemove handler can read them without closure staleness
  const ghostDims = useRef<{ w: number; h: number; color: string } | null>(null)

  const canRender = plugin.canRender
    ? plugin.canRender(config)
    : !!(config.xAxis && config.yAxis)

  const option = useMemo(() => {
    if (!canRender) return null
    return plugin.buildOption(data, config, theme)
  }, [plugin, config, data, theme, canRender])

  // Inject persisted legend selection so ECharts applies it even after a merge update
  const displayOption = useMemo(() => {
    if (!option) return null
    const savedSelected = config.legendSelected as Record<string, boolean> | undefined
    const seriesNames = (option.series as { name?: string }[] ?? [])
      .map(s => s.name).filter(Boolean) as string[]
    if (seriesNames.length === 0) return option
    const selected: Record<string, boolean> = {}
    seriesNames.forEach(name => { selected[name] = savedSelected?.[name] ?? true })
    const existingLegend = option.legend as Record<string, unknown> | undefined
    if (!existingLegend || (existingLegend as { show?: boolean }).show === false) return option
    return { ...option, legend: { ...existingLegend, selected } }
  }, [option, config.legendSelected])

  // Mutually exclusive modes
  useEffect(() => { if (inspectorActive && dragMode) setDragMode(false) }, [inspectorActive])
  useEffect(() => {
    if (!dragMode) {
      setActionPopup(null)
      setIsDragging(false)
      zrState.current = { active: false, fromIdx: null }
      if (ghostRef.current) ghostRef.current.style.display = 'none'
      if (targetRef.current) targetRef.current.style.display = 'none'
    }
  }, [dragMode])

  // ── ZRender drag listeners ──────────────────────────────────────────────
  useEffect(() => {
    if (!dragMode || !chartRef.current || !option) return
    const instance = chartRef.current.getEchartsInstance()
    const zr = instance.getZr()

    const getEffectiveCats = (): string[] => {
      const isH = config.horizontal as boolean
      if (isH) return ((option.yAxis as { data?: string[] })?.data ?? [])
      return ((option.xAxis as { data?: string[] })?.data ?? [])
    }

    const getBarIdx = (x: number, y: number): number | null => {
      try {
        if (!(instance.containPixel as (f: unknown, v: unknown) => boolean)('grid', [x, y])) return null
        const isH = config.horizontal as boolean
        const raw = isH
          ? (instance.convertFromPixel as (f: unknown, v: unknown) => number)({ yAxisIndex: 0 }, y)
          : (instance.convertFromPixel as (f: unknown, v: unknown) => number)({ xAxisIndex: 0 }, x)
        const idx = Math.round(raw)
        const cats = getEffectiveCats()
        if (isNaN(idx) || idx < 0 || idx >= cats.length) return null
        return idx
      } catch {
        return null
      }
    }

    const onDown = (e: { offsetX: number; offsetY: number }) => {
      const idx = getBarIdx(e.offsetX, e.offsetY)
      if (idx === null) return
      zrState.current = { active: true, fromIdx: idx }
      setIsDragging(true)

      const isH = config.horizontal as boolean
      const cats = getEffectiveCats()
      // Read bar value from rendered option series data
      const seriesData = (option.series as { data?: { value?: number }[] }[])[0]?.data ?? []
      const barValue = seriesData[idx]?.value ?? 1
      const barRadius = (config.barRadius as number) ?? 6

      // Get bar pixel bounds to size the ghost
      const bounds = computeBarBounds(instance, idx, barValue, isH)

      // Determine ghost color from theme or colorMap
      const catName = cats[idx] ?? ''
      const colorMap = config.colorMap as Record<string, string>
      const color = colorMap?.[catName] ?? theme.colors[idx % theme.colors.length] ?? theme.colors[0]

      const gw = bounds?.w ?? 40
      const gh = bounds?.h ?? 60
      ghostDims.current = { w: gw, h: gh, color }

      if (ghostRef.current) {
        const el = ghostRef.current
        el.style.display = 'block'
        el.style.width = `${gw}px`
        el.style.height = `${gh}px`
        el.style.left = `${e.offsetX + 8 - gw / 2}px`
        el.style.top = `${e.offsetY + 8 - gh / 2}px`
        el.style.borderRadius = `${barRadius}px`
        el.style.background = `linear-gradient(to top, ${color}99, ${color}cc)`
        el.style.boxShadow = `0 0 24px ${color}55, 0 8px 24px rgba(0,0,0,0.4)`
      }

      ;(instance.dispatchAction as (a: unknown) => void)({ type: 'highlight', seriesIndex: 0, dataIndex: idx })
    }

    const onMove = (e: { offsetX: number; offsetY: number }) => {
      if (!zrState.current.active || !ghostDims.current) return
      const { w, h, color } = ghostDims.current
      const isH = config.horizontal as boolean

      // Move ghost with cursor (direct DOM update — no React re-render)
      if (ghostRef.current) {
        ghostRef.current.style.left = `${e.offsetX + 8 - w / 2}px`
        ghostRef.current.style.top = `${e.offsetY + 8 - h / 2}px`
      }

      // Update target indicator at hover bar position
      const toIdx = getBarIdx(e.offsetX, e.offsetY)
      const fromIdx = zrState.current.fromIdx

      if (targetRef.current) {
        if (toIdx !== null && toIdx !== fromIdx) {
          try {
            const cvt = instance.convertToPixel.bind(instance) as (f: unknown, v: unknown) => number
            const el = targetRef.current
            el.style.display = 'block'
            el.style.background = `${color}55`
            el.style.boxShadow = `0 0 12px ${color}44`

            if (isH) {
              const centerY = cvt({ yAxisIndex: 0 }, toIdx)
              el.style.top = `${centerY + 8 - h / 2}px`
              el.style.left = '8px'
              el.style.width = '3px'
              el.style.height = `${h}px`
              el.style.borderRadius = '2px'
            } else {
              const centerX = cvt({ xAxisIndex: 0 }, toIdx)
              const bottomY = cvt({ yAxisIndex: 0 }, 0)
              el.style.left = `${centerX + 8 - w / 2}px`
              el.style.top = `${bottomY + 8 - 3}px`
              el.style.width = `${w}px`
              el.style.height = '3px'
              el.style.borderRadius = '2px'
            }
          } catch {
            targetRef.current.style.display = 'none'
          }
        } else {
          targetRef.current.style.display = 'none'
        }
      }
    }

    const onUp = (e: { offsetX: number; offsetY: number }) => {
      // Always hide visuals first
      if (ghostRef.current) ghostRef.current.style.display = 'none'
      if (targetRef.current) targetRef.current.style.display = 'none'
      ghostDims.current = null

      if (!zrState.current.active || zrState.current.fromIdx === null) return
      const fromIdx = zrState.current.fromIdx
      zrState.current = { active: false, fromIdx: null }
      setIsDragging(false)
      ;(instance.dispatchAction as (a: unknown) => void)({ type: 'downplay', seriesIndex: 0, dataIndex: fromIdx })

      const toIdx = getBarIdx(e.offsetX, e.offsetY)
      if (toIdx === null || toIdx === fromIdx) return

      const cats = getEffectiveCats()
      const fromCat = cats[fromIdx]
      const toCat = cats[toIdx]
      if (!fromCat || !toCat) return

      const cw = containerRef.current?.offsetWidth ?? 600
      const px = Math.min(e.offsetX + 8, cw - 250)
      const py = Math.max(e.offsetY + 8 - 110, 8)
      setActionPopup({ fromCat, toCat, x: px, y: py, stage: 'choice', mergeLabel: `${fromCat} + ${toCat}` })
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    zr.on('mousedown', onDown as any)
    zr.on('mousemove', onMove as any)
    zr.on('mouseup', onUp as any)
    return () => {
      zr.off('mousedown', onDown as any)
      zr.off('mousemove', onMove as any)
      zr.off('mouseup', onUp as any)
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */
  }, [dragMode, option, theme])

  // ── Text block add ──────────────────────────────────────────────────────
  const addTextBlock = () => {
    const id = `tb-${Date.now()}`
    const newBlock: TextBlock = {
      id, text: 'Texto', x: 50, y: 50,
      width: 160, fontSize: 16,
      fontFamily: 'Inter, system-ui, sans-serif',
      color: theme.textColor,
      bold: false, italic: false,
    }
    onTextBlocksChange?.([...textBlocks, newBlock])
    setPendingEditId(id)
  }

  // ── Regular chart interactions ──────────────────────────────────────────
  const handleExport = () => {
    const instance = chartRef.current?.getEchartsInstance()
    if (instance) exportChartAsPNG(instance, (config.title as string) || plugin.name)
  }

  const handleExportJSON = () => exportConfigAsJSON(plugin.id, config, theme)

  const handleChartClick = useCallback((params: unknown) => {
    if (!inspectorActive) return
    const p = params as { seriesIndex?: number; dataIndex?: number; seriesName?: string; value?: unknown; name?: string; data?: unknown }
    if (p.seriesIndex === undefined || p.dataIndex === undefined) return

    const categoryName = p.name ?? String(p.dataIndex)
    const metaIndex = typeof (p as { data?: { metaIndex?: number } }).data?.metaIndex === 'number'
      ? (p as { data?: { metaIndex?: number } }).data!.metaIndex!
      : undefined
    const finalIndex = metaIndex !== undefined ? metaIndex : p.dataIndex

    onElementClick({
      seriesIndex: p.seriesIndex,
      dataIndex: finalIndex,
      seriesName: p.seriesName ?? '',
      value: p.value,
      category: categoryName,
    })
  }, [inspectorActive, onElementClick])

  const handleDblClick = useCallback((params: unknown) => {
    const p = params as {
      componentType?: string
      targetType?: string
      value?: string
      name?: string
      event?: { offsetX: number; offsetY: number }
    }

    const PADDING = 8

    // ── Legend item rename ──────────────────────────────────────────────────
    if (p.componentType === 'legend' && p.name) {
      const overrides = (configRef.current.seriesNameOverrides as Record<string, string> | undefined) ?? {}
      const currentDisplay = overrides[p.name] ?? p.name
      const x = (p.event?.offsetX ?? 0) + PADDING
      const y = (p.event?.offsetY ?? 0) + PADDING
      labelConfirmCalled.current = false
      setLabelEditPopup({ original: p.name, initialDisplay: currentDisplay, x, y, value: currentDisplay, type: 'series' })
      return
    }

    // ── Axis label rename ───────────────────────────────────────────────────
    if ((p.componentType !== 'xAxis' && p.componentType !== 'yAxis') || p.targetType !== 'axisLabel' || !p.value) return

    const instance = chartRef.current?.getEchartsInstance()
    if (!instance) return

    const overrides = (configRef.current.labelOverrides as Record<string, string> | undefined) ?? {}
    const currentDisplay = overrides[p.value] ?? p.value
    const isH = (configRef.current.horizontal as boolean) ?? false

    // ECharts event coords are canvas-relative; container has p-2 (8px) padding → add 8
    const rawX = p.event?.offsetX ?? 0
    const rawY = p.event?.offsetY ?? 0

    let x = rawX + PADDING
    let y = rawY + PADDING

    try {
      const cvt = instance.convertToPixel.bind(instance) as (f: unknown, v: unknown) => number
      const opt = instance.getOption() as { xAxis?: {data?: string[]}[]; yAxis?: {data?: string[]}[] }
      const cats = isH ? (opt.yAxis?.[0]?.data ?? []) : (opt.xAxis?.[0]?.data ?? [])
      const catIdx = cats.indexOf(p.value)
      if (catIdx >= 0) {
        if (!isH) {
          x = cvt({ xAxisIndex: 0 }, catIdx) + PADDING
          const baselineY = cvt({ yAxisIndex: 0 }, 0)
          y = baselineY + 8 + Math.ceil(theme.fontSize / 2) + PADDING
        } else {
          y = cvt({ yAxisIndex: 0 }, catIdx) + PADDING
        }
      }
    } catch { /* fallback to click coords */ }

    labelConfirmCalled.current = false
    setLabelEditPopup({ original: p.value, initialDisplay: currentDisplay, x, y, value: currentDisplay, type: 'axis' })
  }, []) // stable — reads configRef and chartRef

  const handleLabelRenameConfirm = () => {
    if (!labelEditPopup || labelConfirmCalled.current) return
    labelConfirmCalled.current = true
    const trimmed = labelEditPopup.value.trim()
    if (trimmed) {
      if (labelEditPopup.type === 'series') onSeriesNameRename?.(labelEditPopup.original, trimmed)
      else onLabelRename?.(labelEditPopup.original, trimmed)
    }
    setLabelEditPopup(null)
  }

  const handleLegendSelectChanged = useCallback((params: unknown) => {
    const p = params as { selected: Record<string, boolean> }
    onLegendChange?.(p.selected)
  }, [onLegendChange])

  const onEvents = useMemo(() => ({
    click: handleChartClick,
    dblclick: handleDblClick,
    legendselectchanged: handleLegendSelectChanged,
  }), [handleChartClick, handleDblClick, handleLegendSelectChanged])

  const toggleDragMode = () => {
    if (!dragMode && inspectorActive) onToggleInspector()
    setDragMode((m) => !m)
  }

  const handleReorderAction = () => {
    if (!actionPopup || !onReorder) return
    onReorder(actionPopup.fromCat, actionPopup.toCat)
    setActionPopup(null)
  }

  const handleMergeAction = () => {
    if (!actionPopup || !onMerge || !actionPopup.mergeLabel.trim()) return
    onMerge(actionPopup.fromCat, actionPopup.toCat, actionPopup.mergeLabel.trim())
    setActionPopup(null)
  }

  const cursorClass = dragMode
    ? isDragging ? 'cursor-grabbing' : 'cursor-grab'
    : inspectorActive ? 'cursor-crosshair' : ''

  return (
    <div className={cn(
      'relative flex flex-col h-full glass rounded-2xl overflow-hidden transition-all duration-200',
      inspectorActive && 'ring-1 ring-accent/40',
      dragMode && 'ring-1 ring-emerald-500/40',
    )}>
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />

      {/* ── Toolbar ── */}
      <div className="relative flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-sm font-medium text-white/70">{plugin.name}</span>
          {config.title && <span className="text-xs text-white/30">· {config.title as string}</span>}
          {inspectorActive && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-accent/20 text-accent-light border border-accent/30 font-medium">
              Inspector activo
            </span>
          )}
          {dragMode && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
              Modo arrastrar
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {plugin.supportsDrag && (
            <button
              onClick={toggleDragMode}
              title="Modo arrastrar barras"
              className={cn(
                'flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs transition-all duration-200 border',
                dragMode
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'btn-ghost border-transparent',
              )}
            >
              <GripVertical className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={addTextBlock}
            title="Agregar bloque de texto"
            className="btn-ghost border-transparent flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs transition-all duration-200 border"
          >
            <Type className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onToggleInspector}
            title="Modo inspector"
            className={cn(
              'flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs transition-all duration-200 border',
              inspectorActive
                ? 'bg-accent/20 border-accent/40 text-accent-light'
                : 'btn-ghost border-transparent',
            )}
          >
            <MousePointer2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onReset} className="btn-ghost text-xs flex items-center gap-1.5 py-1.5">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
          <button onClick={handleExportJSON} className="btn-ghost text-xs flex items-center gap-1.5 py-1.5">
            <FileJson className="w-3.5 h-3.5" /> JSON
          </button>
          <button onClick={handleExport} className="btn-primary text-xs flex items-center gap-1.5 py-1.5">
            <Download className="w-3.5 h-3.5" /> PNG
          </button>
        </div>
      </div>

      {/* ── Chart area ── */}
      <div ref={containerRef} className={cn('relative flex-1 min-h-0 p-2', cursorClass)}>
        {displayOption ? (
          <ReactECharts
            key={plugin.id}
            ref={chartRef}
            option={displayOption}
            style={{ height: '100%', width: '100%' }}
            opts={{ renderer: 'canvas', devicePixelRatio: 2 }}
            onEvents={onEvents}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-white/20">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
              <span className="text-3xl">📊</span>
            </div>
            <p className="text-sm">Selecciona los ejes en el panel de configuración</p>
          </div>
        )}

        {/* Ghost bar — follows cursor during drag (DOM-direct, no re-renders) */}
        <div
          ref={ghostRef}
          style={{
            position: 'absolute',
            display: 'none',
            pointerEvents: 'none',
            zIndex: 50,
            transition: 'none',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        />

        {/* Target drop indicator */}
        <div
          ref={targetRef}
          style={{
            position: 'absolute',
            display: 'none',
            pointerEvents: 'none',
            zIndex: 40,
            transition: 'none',
          }}
        />

        {/* Text blocks overlay */}
        <TextBlockLayer
          blocks={textBlocks}
          containerRef={containerRef}
          onChange={(blocks) => onTextBlocksChange?.(blocks)}
          autoEditId={pendingEditId}
          onAutoEditConsumed={() => setPendingEditId(null)}
        />

        {/* Label inline editor — all styles fixed at mount, nothing changes while typing */}
        {labelEditPopup && (
          <input
            autoFocus
            style={{
              position: 'absolute',
              left: labelEditPopup.x,
              top: labelEditPopup.y,
              transform: 'translate(-50%, -50%)',
              zIndex: 50,
              // Fixed dimensions — nothing changes while typing
              width: Math.max((labelEditPopup.initialDisplay.length + 4) * Math.ceil(theme.fontSize * 0.6), 80),
              height: theme.fontSize + 2,
              lineHeight: `${theme.fontSize + 2}px`,
              // Covers canvas text behind with chart background color
              background: theme.backgroundColor,
              border: 'none',
              outline: 'none',
              boxShadow: 'none',
              WebkitAppearance: 'none',
              color: theme.textColor,
              fontFamily: theme.fontFamily,
              fontSize: theme.fontSize,
              textAlign: 'center',
              padding: 0,
              margin: 0,
              caretColor: theme.colors[0],
            }}
            value={labelEditPopup.value}
            onChange={(e) => setLabelEditPopup((p) => p && { ...p, value: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); handleLabelRenameConfirm() }
              if (e.key === 'Escape') setLabelEditPopup(null)
            }}
            onBlur={handleLabelRenameConfirm}
          />
        )}

        {/* Action popup */}
        {actionPopup && (
          <div
            className="absolute z-50 glass border border-white/10 rounded-xl shadow-2xl p-3"
            style={{ left: actionPopup.x, top: actionPopup.y, minWidth: 220 }}
          >
            {actionPopup.stage === 'choice' ? (
              <>
                <button
                  onClick={() => setActionPopup(null)}
                  className="absolute top-2 right-2 text-white/20 hover:text-white/60 text-xs leading-none"
                >✕</button>
                <p className="text-xs text-white/40 mb-2 pr-4">
                  <span className="text-white/80 font-medium">"{actionPopup.fromCat}"</span>
                  {' → '}
                  <span className="text-white/80 font-medium">"{actionPopup.toCat}"</span>
                </p>
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={handleReorderAction}
                    className="btn-ghost text-xs text-left px-2.5 py-2 rounded-lg hover:bg-white/10"
                  >
                    ↔ Intercambiar posición
                  </button>
                  <button
                    onClick={() => setActionPopup((p) => p && { ...p, stage: 'merge' })}
                    className="btn-primary text-xs px-2.5 py-2 rounded-lg text-left"
                  >
                    ⊕ Combinar en una barra
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-white/40 mb-1.5">Nombre del grupo combinado</p>
                <input
                  className="w-full glass rounded-lg px-2.5 py-1.5 text-xs text-white border border-white/10 focus:border-accent/50 outline-none mb-2"
                  value={actionPopup.mergeLabel}
                  onChange={(e) => setActionPopup((p) => p && { ...p, mergeLabel: e.target.value })}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleMergeAction()}
                />
                <div className="flex gap-1.5">
                  <button onClick={handleMergeAction} className="btn-primary text-xs flex-1 py-1.5">
                    Confirmar
                  </button>
                  <button onClick={() => setActionPopup(null)} className="btn-ghost text-xs px-3 py-1.5">
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

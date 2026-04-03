import { useState, useCallback } from 'react'
import type { InspectedElement, ElementOverride } from '@/types/chart.types'

export interface InspectorState {
  active: boolean
  selected: InspectedElement | null
  overrides: Record<string, ElementOverride>
}

function overrideKey(el: InspectedElement): string {
  return `${el.seriesIndex}:${el.dataIndex}`
}

export function useInspector() {
  const [state, setState] = useState<InspectorState>({
    active: false,
    selected: null,
    overrides: {},
  })

  const toggleMode = useCallback(() => {
    setState((s) => ({ ...s, active: !s.active, selected: s.active ? null : s.selected }))
  }, [])

  const selectElement = useCallback((el: InspectedElement) => {
    setState((s) => ({ ...s, selected: el }))
  }, [])

  const clearSelection = useCallback(() => {
    setState((s) => ({ ...s, selected: null }))
  }, [])

  const updateOverride = useCallback((el: InspectedElement, patch: Partial<ElementOverride>) => {
    const key = overrideKey(el)
    setState((s) => ({
      ...s,
      overrides: { ...s.overrides, [key]: { ...s.overrides[key], ...patch } },
    }))
  }, [])

  const removeOverride = useCallback((el: InspectedElement) => {
    const key = overrideKey(el)
    setState((s) => {
      const next = { ...s.overrides }
      delete next[key]
      return { ...s, overrides: next }
    })
  }, [])

  const getOverride = useCallback(
    (el: InspectedElement): ElementOverride => state.overrides[overrideKey(el)] ?? {},
    [state.overrides],
  )

  const resetOverrides = useCallback(() => {
    setState((s) => ({ ...s, overrides: {}, selected: null }))
  }, [])

  return {
    inspectorActive: state.active,
    selected: state.selected,
    overrides: state.overrides,
    toggleMode,
    selectElement,
    clearSelection,
    updateOverride,
    removeOverride,
    getOverride,
    resetOverrides,
  }
}

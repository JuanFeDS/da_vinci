import { useState, useCallback } from 'react'
import type { Theme } from '@/types/theme.types'
import { getAllThemes, getActiveThemeId, setActiveThemeId, saveCustomTheme } from '@/utils/themeStorage'

export function useTheme() {
  const [themes, setThemes] = useState<Theme[]>(() => getAllThemes())
  const [activeId, setActiveId] = useState<string>(() => getActiveThemeId())

  const activeTheme = themes.find((t) => t.id === activeId) ?? themes[0]

  const selectTheme = useCallback((id: string) => {
    setActiveId(id)
    setActiveThemeId(id)
  }, [])

  const addCustomTheme = useCallback((theme: Theme) => {
    saveCustomTheme(theme)
    setThemes(getAllThemes())
    setActiveId(theme.id)
    setActiveThemeId(theme.id)
  }, [])

  const refreshThemes = useCallback(() => {
    setThemes(getAllThemes())
  }, [])

  return { themes, activeTheme, activeId, selectTheme, addCustomTheme, refreshThemes }
}

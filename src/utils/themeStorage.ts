import type { Theme } from '@/types/theme.types'
import { DEFAULT_THEMES } from '@/types/theme.types'

const STORAGE_KEY = 'davinci_custom_themes'
const ACTIVE_KEY = 'davinci_active_theme'

export function getCustomThemes(): Theme[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Theme[]) : []
  } catch {
    return []
  }
}

export function saveCustomTheme(theme: Theme): void {
  const themes = getCustomThemes()
  const idx = themes.findIndex((t) => t.id === theme.id)
  if (idx >= 0) {
    themes[idx] = theme
  } else {
    themes.push(theme)
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(themes))
}

export function deleteCustomTheme(id: string): void {
  const themes = getCustomThemes().filter((t) => t.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(themes))
}

export function getAllThemes(): Theme[] {
  return [...DEFAULT_THEMES, ...getCustomThemes()]
}

export function getActiveThemeId(): string {
  return localStorage.getItem(ACTIVE_KEY) ?? DEFAULT_THEMES[0].id
}

export function setActiveThemeId(id: string): void {
  localStorage.setItem(ACTIVE_KEY, id)
}

export function exportThemeAsJSON(theme: Theme): void {
  const blob = new Blob([JSON.stringify(theme, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `davinci-theme-${theme.id}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importThemeFromJSON(file: File): Promise<Theme> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const theme = JSON.parse(e.target?.result as string) as Theme
        resolve(theme)
      } catch {
        reject(new Error('Archivo JSON inválido'))
      }
    }
    reader.onerror = () => reject(new Error('Error leyendo archivo'))
    reader.readAsText(file)
  })
}

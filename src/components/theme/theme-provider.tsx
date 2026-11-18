import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { THEME_STORAGE_KEY, ThemeContext, type Theme } from './theme-context'

// Light is the default; index.html applies the stored theme before first paint.
function readStoredTheme(): Theme {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readStoredTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // Storage can be unavailable (private mode); the toggle still works for this session.
    }
  }, [theme])

  const value = useMemo(() => ({ theme, setTheme }), [theme])
  return <ThemeContext value={value}>{children}</ThemeContext>
}

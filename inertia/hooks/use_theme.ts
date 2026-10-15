import { useState } from 'react'
import { usePage } from '@inertiajs/react'

const COOKIE = 'app_theme'
const ONE_YEAR = 60 * 60 * 24 * 365

export type Theme = 'light' | 'dark'

/** Current theme plus a toggle that updates `<html data-theme>` and the cookie. */
export function useTheme() {
  const page = usePage()
  const [theme, setTheme] = useState<Theme>(() => {
    const current = typeof document === 'undefined' ? null : document.documentElement.dataset.theme
    if (current === 'dark' || current === 'light') return current
    return page.props.preferences?.theme ?? 'light'
  })

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    document.cookie = `${COOKIE}=${next}; path=/; max-age=${ONE_YEAR}; samesite=lax`
  }

  return { theme, isDark: theme === 'dark', toggle }
}

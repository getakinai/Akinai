import { useCallback, useSyncExternalStore } from 'react'
import { RecentReportsSchema, type RecentReport } from '../_types'

const STORAGE_KEY = 'admin_analytics_recent_reports'
const CHANGE_EVENT = 'admin-analytics-recent-reports'
const MAX_RECENT = 5
const EMPTY: RecentReport[] = []

let cachedRaw: string | null = null
let cachedValue: RecentReport[] = EMPTY

function read(): RecentReport[] {
  let raw: string | null = null
  try {
    raw = window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return EMPTY
  }
  if (raw === cachedRaw) return cachedValue
  cachedRaw = raw
  if (!raw) {
    cachedValue = EMPTY
    return cachedValue
  }
  try {
    const parsed = RecentReportsSchema.safeParse(JSON.parse(raw))
    cachedValue = parsed.success ? parsed.data : EMPTY
  } catch {
    cachedValue = EMPTY
  }
  return cachedValue
}

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange)
  window.addEventListener(CHANGE_EVENT, onChange)
  return () => {
    window.removeEventListener('storage', onChange)
    window.removeEventListener(CHANGE_EVENT, onChange)
  }
}

/** Reports this browser opened most recently (newest first), kept in localStorage. */
export function useRecentReports() {
  const recent = useSyncExternalStore(subscribe, read, () => EMPTY)

  const remember = useCallback((key: string) => {
    const next = [
      { key, viewedAt: new Date().toISOString() },
      ...read().filter((item) => item.key !== key),
    ].slice(0, MAX_RECENT)
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      return
    }
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }, [])

  return { recent, remember }
}

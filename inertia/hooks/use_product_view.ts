import { useCallback, useSyncExternalStore } from 'react'
import type { ProductCardLayout } from '~/components/storefront'

const STORAGE_KEY = 'storefront_product_view'
const CHANGE_EVENT = 'storefront-product-view'

function read(): ProductCardLayout {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'list' ? 'list' : 'grid'
  } catch {
    return 'grid'
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange)
  window.addEventListener(CHANGE_EVENT, onChange)
  return () => {
    window.removeEventListener('storage', onChange)
    window.removeEventListener(CHANGE_EVENT, onChange)
  }
}

/**
 * Grid or list layout for storefront product listings, remembered in
 * localStorage. Server render and first paint use `grid`.
 */
export function useProductView() {
  const view = useSyncExternalStore(subscribe, read, () => 'grid' as const)

  const setView = useCallback((next: ProductCardLayout) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {}
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }, [])

  return [view, setView] as const
}

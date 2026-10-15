import { useEffect, type RefObject } from 'react'

export const STICKY_HEADER_HEIGHT_VAR = '--sf-header-height'

/**
 * Publishes the sticky header's height as a CSS variable on `<html>`, so
 * sticky page elements (e.g. the collection filters) can sit just below it.
 * Kept in sync as the header resizes (menu wrapping, viewport changes).
 */
export function useStickyHeaderHeight(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const root = document.documentElement
    const update = () =>
      root.style.setProperty(STICKY_HEADER_HEIGHT_VAR, `${element.offsetHeight}px`)

    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => {
      observer.disconnect()
      root.style.removeProperty(STICKY_HEADER_HEIGHT_VAR)
    }
  }, [ref])
}

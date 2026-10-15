import type { MouseEvent } from 'react'
import { router } from '@inertiajs/react'

export const collectionRailId = (slug: string) => `collection-${slug}`

/**
 * Click handler for links to `/collections/<slug>`. On the home page it
 * scrolls to the collection's rail when one is shown; otherwise it opens
 * the collection page. Modified clicks (new tab, etc.) are left alone.
 */
export function onCollectionLinkClick(event: MouseEvent<HTMLAnchorElement>, slug: string) {
  if (event.defaultPrevented || event.button !== 0) return
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

  event.preventDefault()
  const rail =
    window.location.pathname === '/' ? document.getElementById(collectionRailId(slug)) : null

  if (rail) {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    rail.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
    window.history.replaceState(window.history.state, '', `#${collectionRailId(slug)}`)
    return
  }

  router.visit(event.currentTarget.getAttribute('href') ?? `/collections/${slug}`)
}

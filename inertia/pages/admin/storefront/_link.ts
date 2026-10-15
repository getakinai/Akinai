import { type MenuItemType } from '~/lib/storefront'

type LinkedRecord = { title: string; status: 'draft' | 'active' | 'archived' } | null

export type StorefrontLinkRecord = {
  type: MenuItemType
  collectionId: string | null
  pageId: string | null
  url: string | null
  collection: LinkedRecord
  page: LinkedRecord
}

/** Where a menu item, hero slide or promo banner points, for the admin lists. */
export function linkTargetLabel(link: StorefrontLinkRecord) {
  if (link.type === 'url') return link.url ?? ''
  if (link.type === 'page') return link.page ? `Page · ${link.page.title}` : 'Page removed'
  return link.collection ? `Collection · ${link.collection.title}` : 'Collection removed'
}

/**
 * Why the link is missing from the storefront because of its target, or
 * null when the target is live.
 */
export function linkTargetProblem(link: StorefrontLinkRecord) {
  if (link.type === 'collection' && !link.collection) return 'Collection removed'
  if (link.type === 'collection' && link.collection?.status !== 'active')
    return 'Collection not active'
  if (link.type === 'page' && !link.page) return 'Page removed'
  if (link.type === 'page' && link.page?.status !== 'active') return 'Page not active'
  return null
}

/** The linked collection or page was deleted, so the record can't be saved as is. */
export function isBrokenLink(link: StorefrontLinkRecord) {
  return (
    (link.type === 'collection' && !link.collectionId) || (link.type === 'page' && !link.pageId)
  )
}

/** The link fields of an update payload, matching the form's discriminated union. */
export function linkPayload(link: StorefrontLinkRecord) {
  if (link.type === 'collection') {
    return {
      type: 'collection' as const,
      collectionId: link.collectionId ?? '',
      pageId: null,
      url: null,
    }
  }
  if (link.type === 'page') {
    return { type: 'page' as const, collectionId: null, pageId: link.pageId ?? '', url: null }
  }
  return { type: 'url' as const, collectionId: null, pageId: null, url: link.url ?? '' }
}

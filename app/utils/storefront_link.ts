import type Collection from '#models/collection'
import type Page from '#models/page'
import type { MenuItemType } from '#constants/storefront'

type StorefrontLink = {
  type: MenuItemType
  url: string | null
  collection?: Collection | null
  page?: Page | null
}

/**
 * The linked collection and page for the back-office shape of menu items,
 * hero slides and promo banners. Expects both relations preloaded.
 */
export function linkTargets({ collection, page }: StorefrontLink) {
  return {
    collection: collection
      ? {
          id: collection.id,
          title: collection.title,
          slug: collection.slug,
          status: collection.status,
        }
      : null,
    page: page ? { id: page.id, title: page.title, slug: page.slug, status: page.status } : null,
  }
}

/**
 * The storefront URL a link points at.
 */
export function linkHref({ type, url, collection, page }: StorefrontLink): string {
  if (type === 'collection' && collection) return `/collections/${collection.slug}`
  if (type === 'page' && page) return `/pages/${page.slug}`
  return url ?? '/'
}

import { toQueryString } from '~/lib/query_string'

/**
 * Storefront product page URL. `collection` is the collection the shopper
 * came from, shown in the product page breadcrumb.
 */
export function productHref(slug: string, collection?: string) {
  return `/products/${encodeURIComponent(slug)}${toQueryString({ collection })}`
}

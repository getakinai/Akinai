import type { InertiaPages } from '@adonisjs/inertia/types'

/**
 * Inertia page name for a plugin admin or storefront page under
 * `plugins/<key>/client/pages/`.
 */
export function pluginPage<Key extends string, Page extends string>(
  key: Key,
  page: Page
): `plugins/${Key}/${Page}` & keyof InertiaPages {
  return `plugins/${key}/${page}` as `plugins/${Key}/${Page}` & keyof InertiaPages
}

import type StorefrontMenuItem from '#models/storefront_menu_item'
import { BaseTransformer } from '@adonisjs/core/transformers'
import { linkHref, linkTargets } from '#utils/storefront_link'

/**
 * `toObject` is the back-office shape and expects `collection` and `page`
 * preloaded. `toPublic` resolves the link target; collection items point at
 * the collection page. On the home page the storefront scrolls to the
 * collection's rail instead when one is shown.
 */
export default class StorefrontMenuItemTransformer extends BaseTransformer<StorefrontMenuItem> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'label',
        'type',
        'collectionId',
        'pageId',
        'url',
        'position',
        'isVisible',
        'createdAt',
        'updatedAt',
      ]),
      ...linkTargets(this.resource),
    }
  }

  toPublic() {
    const { id, label, type, url, collection } = this.resource

    return {
      id,
      label,
      href: linkHref(this.resource),
      collectionSlug: type === 'collection' ? (collection?.slug ?? null) : null,
      isExternal: type === 'url' && /^https?:\/\//.test(url ?? ''),
    }
  }
}

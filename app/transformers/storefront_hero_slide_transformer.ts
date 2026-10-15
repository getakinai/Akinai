import type StorefrontHeroSlide from '#models/storefront_hero_slide'
import { BaseTransformer } from '@adonisjs/core/transformers'
import { imageUrl } from '#utils/image_url'
import { linkHref, linkTargets } from '#utils/storefront_link'

/**
 * `toObject` is the back-office shape and expects `collection` and `page`
 * preloaded. `toPublic` resolves the link target. Neither exposes the raw
 * drive key.
 */
export default class StorefrontHeroSlideTransformer extends BaseTransformer<StorefrontHeroSlide> {
  toObject() {
    const { image } = this.resource

    return {
      ...this.pick(this.resource, [
        'id',
        'eyebrow',
        'heading',
        'subheading',
        'buttonLabel',
        'type',
        'collectionId',
        'pageId',
        'url',
        'position',
        'isVisible',
        'createdAt',
        'updatedAt',
      ]),
      imageUrl: image ? imageUrl(image) : null,
      ...linkTargets(this.resource),
    }
  }

  toPublic() {
    const { id, eyebrow, heading, subheading, buttonLabel, type, url, image } = this.resource

    return {
      id,
      eyebrow,
      heading,
      subheading,
      buttonLabel,
      imageUrl: image ? imageUrl(image) : null,
      href: linkHref(this.resource),
      isExternal: type === 'url' && /^https?:\/\//.test(url ?? ''),
    }
  }
}

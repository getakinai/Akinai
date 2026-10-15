import type Product from '#models/product'
import { BaseTransformer } from '@adonisjs/core/transformers'
import { imageUrl } from '#utils/image_url'
import { extraNumber } from '#utils/extra_number'
import { storefrontProductLabel } from '#utils/storefront_product_label'

/**
 * Reads the `price_min`, `compare_at_price` and `variant_id` extras and
 * the preloaded vendor, product type (shown as the category) and active
 * label from StorefrontCatalogRepository.productCards.
 * `compareAtPrice` is only set when it is above the price. `variantId` is
 * the cheapest variant, the one the cart adds at `price`.
 */
export default class StorefrontProductCardTransformer extends BaseTransformer<Product> {
  toObject() {
    const { $extras, vendor, productType, coverImage } = this.resource
    const price = extraNumber($extras.price_min)
    const compareAt = extraNumber($extras.compare_at_price)

    return {
      ...this.pick(this.resource, ['id', 'title', 'slug']),
      imageUrl: coverImage ? imageUrl(coverImage) : null,
      variantId: typeof $extras.variant_id === 'string' ? $extras.variant_id : null,
      vendor: vendor ? vendor.name : null,
      category: productType ? productType.name : null,
      label: storefrontProductLabel(this.resource),
      price,
      compareAtPrice: price !== null && compareAt !== null && compareAt > price ? compareAt : null,
    }
  }
}

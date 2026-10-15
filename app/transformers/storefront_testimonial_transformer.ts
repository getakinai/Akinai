import type ProductReview from '#models/product_review'
import { BaseTransformer } from '@adonisjs/core/transformers'
import { reviewerName } from '#transformers/storefront_product_review_transformer'

/**
 * A featured review shown on the home page. Expects `customer` and
 * `product` preloaded. Never exposes the reviewer's full name, email or id.
 */
export default class StorefrontTestimonialTransformer extends BaseTransformer<ProductReview> {
  toObject() {
    const { id, rating, title, body, customer, product } = this.resource
    return {
      id,
      rating,
      title,
      body,
      authorName: reviewerName(customer?.fullName),
      product: product ? { title: product.title, slug: product.slug } : null,
    }
  }
}

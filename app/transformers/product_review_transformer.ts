import type ProductReview from '#models/product_review'
import { BaseTransformer } from '@adonisjs/core/transformers'

/**
 * Staff view of a review, with the customer's name and email, and the
 * product when it is preloaded.
 */
export default class ProductReviewTransformer extends BaseTransformer<ProductReview> {
  toObject() {
    const { customer, product } = this.resource
    return {
      ...this.pick(this.resource, [
        'id',
        'productId',
        'rating',
        'title',
        'body',
        'isHidden',
        'isFeatured',
        'createdAt',
      ]),
      customer: customer
        ? { id: customer.id, fullName: customer.fullName, email: customer.email }
        : null,
      product: product
        ? { id: product.id, title: product.title, slug: product.slug, status: product.status }
        : null,
    }
  }
}

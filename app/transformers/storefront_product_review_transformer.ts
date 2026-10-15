import type ProductReview from '#models/product_review'
import { BaseTransformer } from '@adonisjs/core/transformers'

/**
 * "Jane D." from "Jane Doe". Shoppers never see a reviewer's full name,
 * email or id.
 */
export function reviewerName(fullName: string | null | undefined): string {
  const parts = (fullName ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'Customer'
  const [first, ...rest] = parts
  const last = rest.at(-1)
  return last ? `${first} ${last[0].toUpperCase()}.` : first
}

export default class StorefrontProductReviewTransformer extends BaseTransformer<ProductReview> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'rating', 'title', 'body', 'createdAt']),
      author: reviewerName(this.resource.customer?.fullName),
    }
  }
}

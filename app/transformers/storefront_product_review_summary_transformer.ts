import { BaseTransformer } from '@adonisjs/core/transformers'
import type { ProductReviewSummary } from '#services/product_review_service'

export default class StorefrontProductReviewSummaryTransformer extends BaseTransformer<ProductReviewSummary> {
  toObject() {
    const { average, count, distribution, viewerHasReviewed } = this.resource
    return { average, count, distribution, viewerHasReviewed }
  }
}

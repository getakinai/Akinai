import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ProductReviewService from '#services/product_review_service'
import ProductReviewTransformer from '#transformers/product_review_transformer'

@inject()
export default class AdminStorefrontFeaturedReviewsListController {
  constructor(protected productReviewService: ProductReviewService) {}

  async handle(ctx: HttpContext) {
    const reviews = await this.productReviewService.listFeatured()
    return ctx.serialize(ProductReviewTransformer.transform(reviews))
  }
}

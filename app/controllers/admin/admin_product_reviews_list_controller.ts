import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ProductReviewService, { PRODUCT_REVIEWS_PER_PAGE } from '#services/product_review_service'
import ProductService from '#services/product_service'
import ProductReviewTransformer from '#transformers/product_review_transformer'
import { adminProductReviewsQueryValidator } from '#validators/admin_product_reviews_query_validator'

@inject()
export default class AdminProductReviewsListController {
  constructor(
    protected productService: ProductService,
    protected productReviewService: ProductReviewService
  ) {}

  async handle(ctx: HttpContext) {
    const { page, perPage } = await ctx.request.validateUsing(adminProductReviewsQueryValidator, {
      data: ctx.request.qs(),
    })
    const product = await this.productService.findOrFail(ctx.params.id)
    const reviews = await this.productReviewService.paginateForProduct(
      product.id,
      page ?? 1,
      perPage ?? PRODUCT_REVIEWS_PER_PAGE
    )

    return ctx.serialize(ProductReviewTransformer.paginate(reviews.all(), reviews.getMeta()))
  }
}

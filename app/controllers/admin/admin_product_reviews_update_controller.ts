import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ProductReviewService from '#services/product_review_service'
import ProductReviewTransformer from '#transformers/product_review_transformer'
import { adminProductReviewParamsValidator } from '#validators/admin_product_review_params_validator'
import { adminProductReviewUpdateValidator } from '#validators/admin_product_review_update_validator'

@inject()
export default class AdminProductReviewsUpdateController {
  constructor(protected productReviewService: ProductReviewService) {}

  async handle(ctx: HttpContext) {
    const { params } = await ctx.request.validateUsing(adminProductReviewParamsValidator)
    const { isHidden, isFeatured } = await ctx.request.validateUsing(
      adminProductReviewUpdateValidator
    )

    const review = await this.productReviewService.findForProductOrFail(
      params.productId,
      ctx.params.id
    )
    const updated = await this.productReviewService.setFlags(review, { isHidden, isFeatured })

    return ctx.serialize(ProductReviewTransformer.transform(updated))
  }
}

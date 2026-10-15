import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { errors as lucidErrors } from '@adonisjs/lucid'
import CustomerService from '#services/customer_service'
import ProductReviewService from '#services/product_review_service'
import StorefrontProductReviewSummaryTransformer from '#transformers/storefront_product_review_summary_transformer'
import { storefrontProductSlugValidator } from '#validators/storefront_product_slug_validator'

/**
 * Public rating summary. SilentAuthMiddleware has already checked the
 * `customer` guard, so a signed-in shopper also learns whether they have
 * reviewed the product.
 */
@inject()
export default class StorefrontProductReviewsSummaryController {
  constructor(
    protected productReviewService: ProductReviewService,
    protected customerService: CustomerService
  ) {}

  async handle(ctx: HttpContext) {
    const [error, params] = await storefrontProductSlugValidator.tryValidate({
      slug: ctx.params.slug,
    })
    if (error) throw new lucidErrors.E_ROW_NOT_FOUND()

    const account = ctx.auth.use('customer').user
    const customer = account ? await this.customerService.profileFor(account) : null
    const summary = await this.productReviewService.summary(params.slug, customer)

    return ctx.serialize(StorefrontProductReviewSummaryTransformer.transform(summary))
  }
}

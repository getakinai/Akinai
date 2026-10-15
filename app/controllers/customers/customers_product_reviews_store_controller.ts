import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { errors as lucidErrors } from '@adonisjs/lucid'
import CustomerService from '#services/customer_service'
import ProductReviewService from '#services/product_review_service'
import StorefrontProductReviewTransformer from '#transformers/storefront_product_review_transformer'
import { customersProductReviewStoreValidator } from '#validators/customers_product_review_store_validator'
import { storefrontProductSlugValidator } from '#validators/storefront_product_slug_validator'

@inject()
export default class CustomersProductReviewsStoreController {
  constructor(
    protected customerService: CustomerService,
    protected productReviewService: ProductReviewService
  ) {}

  async handle(ctx: HttpContext) {
    const [error, params] = await storefrontProductSlugValidator.tryValidate({
      slug: ctx.params.slug,
    })
    if (error) throw new lucidErrors.E_ROW_NOT_FOUND()

    const payload = await ctx.request.validateUsing(customersProductReviewStoreValidator)
    const customer = await this.customerService.profileFor(ctx.auth.use('customer').getUserOrFail())

    const review = await this.productReviewService.create(params.slug, customer, {
      rating: payload.rating,
      title: payload.title,
      body: payload.body,
    })

    ctx.response.status(201)
    return ctx.serialize(StorefrontProductReviewTransformer.transform(review))
  }
}

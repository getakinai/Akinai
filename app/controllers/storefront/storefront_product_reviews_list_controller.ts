import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { errors as lucidErrors } from '@adonisjs/lucid'
import ProductReviewService from '#services/product_review_service'
import StorefrontCatalogTokenService from '#services/storefront_catalog_token_service'
import StorefrontProductReviewTransformer from '#transformers/storefront_product_review_transformer'
import { storefrontProductReviewsQueryValidator } from '#validators/storefront_product_reviews_query_validator'
import { storefrontProductSlugValidator } from '#validators/storefront_product_slug_validator'

@inject()
export default class StorefrontProductReviewsListController {
  constructor(
    protected productReviewService: ProductReviewService,
    protected catalogTokenService: StorefrontCatalogTokenService
  ) {}

  async handle(ctx: HttpContext) {
    const [error, params] = await storefrontProductSlugValidator.tryValidate({
      slug: ctx.params.slug,
    })
    if (error) throw new lucidErrors.E_ROW_NOT_FOUND()

    const { cursor } = await ctx.request.validateUsing(storefrontProductReviewsQueryValidator, {
      data: ctx.request.qs(),
    })
    const scope = this.catalogTokenService.scope({ list: 'product-reviews', slug: params.slug })
    const page = this.catalogTokenService.pageFrom(ctx.session, scope, cursor)
    const reviews = await this.productReviewService.paginateVisible(params.slug, page)

    return ctx.serialize(
      StorefrontProductReviewTransformer.paginate(reviews.all(), {
        total: reviews.total,
        nextCursor: this.catalogTokenService.nextCursor(ctx.session, scope, page, reviews.lastPage),
      })
    )
  }
}

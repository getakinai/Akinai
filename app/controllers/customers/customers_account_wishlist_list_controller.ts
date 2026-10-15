import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CustomerService from '#services/customer_service'
import StorefrontMarketService from '#services/storefront_market_service'
import WishlistService from '#services/wishlist_service'
import StorefrontProductCardTransformer from '#transformers/storefront_product_card_transformer'
import { customersAccountWishlistListQueryValidator } from '#validators/customers_account_wishlist_list_query_validator'

@inject()
export default class CustomersAccountWishlistListController {
  constructor(
    protected customerService: CustomerService,
    protected wishlistService: WishlistService,
    protected storefrontMarketService: StorefrontMarketService
  ) {}

  async handle(ctx: HttpContext) {
    const { page } = await ctx.request.validateUsing(customersAccountWishlistListQueryValidator, {
      data: ctx.request.qs(),
    })
    const customer = await this.customerService.profileFor(ctx.auth.use('customer').getUserOrFail())
    const market = await this.storefrontMarketService.current(ctx)
    const { products, meta } = await this.wishlistService.paginateFor(
      customer.id,
      page ?? 1,
      market
    )
    return ctx.serialize(StorefrontProductCardTransformer.paginate(products, meta))
  }
}

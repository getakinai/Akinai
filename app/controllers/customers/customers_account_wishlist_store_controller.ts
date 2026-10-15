import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CustomerService from '#services/customer_service'
import WishlistService from '#services/wishlist_service'
import { customersAccountWishlistStoreValidator } from '#validators/customers_account_wishlist_store_validator'

@inject()
export default class CustomersAccountWishlistStoreController {
  constructor(
    protected customerService: CustomerService,
    protected wishlistService: WishlistService
  ) {}

  async handle(ctx: HttpContext) {
    const { productId } = await ctx.request.validateUsing(customersAccountWishlistStoreValidator)
    const customer = await this.customerService.profileFor(ctx.auth.use('customer').getUserOrFail())

    await this.wishlistService.add(customer.id, productId)

    ctx.response.status(201)
    return { data: { productId } }
  }
}

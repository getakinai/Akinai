import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CustomerService from '#services/customer_service'
import WishlistService from '#services/wishlist_service'

/**
 * `:id` is the saved product's id. The lookup is scoped by the session
 * customer, so another customer's wishlist can't be touched.
 */
@inject()
export default class CustomersAccountWishlistDeleteController {
  constructor(
    protected customerService: CustomerService,
    protected wishlistService: WishlistService
  ) {}

  async handle(ctx: HttpContext) {
    const customer = await this.customerService.profileFor(ctx.auth.use('customer').getUserOrFail())

    await this.wishlistService.remove(customer.id, ctx.params.id)

    return ctx.response.noContent()
  }
}

import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CustomerService from '#services/customer_service'
import WishlistService from '#services/wishlist_service'

@inject()
export default class CustomersAccountWishlistIdsViewController {
  constructor(
    protected customerService: CustomerService,
    protected wishlistService: WishlistService
  ) {}

  async handle(ctx: HttpContext) {
    const customer = await this.customerService.profileFor(ctx.auth.use('customer').getUserOrFail())
    const productIds = await this.wishlistService.productIdsFor(customer.id)
    return { data: { productIds } }
  }
}

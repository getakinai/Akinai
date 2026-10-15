import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CheckoutService from '#services/checkout_service'
import CustomerAddressTransformer from '#transformers/customer_address_transformer'

/**
 * Saved addresses the signed-in customer can pick at checkout.
 */
@inject()
export default class StorefrontCheckoutAddressesListController {
  constructor(protected checkoutService: CheckoutService) {}

  async handle(ctx: HttpContext) {
    const customer = await this.checkoutService.customerFor(
      ctx.auth.use('customer').getUserOrFail()
    )
    const addresses = customer ? await this.checkoutService.savedAddresses(customer) : []
    return ctx.serialize(CustomerAddressTransformer.transform(addresses))
  }
}

import type { HttpContext } from '@adonisjs/core/http'
import { customersAccountHomeQueryValidator } from '#validators/customers_account_home_query_validator'

/**
 * `?placed=<orderId>` is set after checkout so the dashboard can confirm
 * the order. A malformed value is ignored rather than bouncing the page.
 */
export default class CustomersAccountHomeController {
  async handle({ inertia, request }: HttpContext) {
    const [, query] = await customersAccountHomeQueryValidator.tryValidate(request.qs())
    return inertia.render('customers/account/home', { placedOrderId: query?.placed ?? null })
  }
}

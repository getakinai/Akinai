import type { HttpContext } from '@adonisjs/core/http'
import { customersAccountWelcomeQueryValidator } from '#validators/customers_account_welcome_query_validator'

/**
 * "Complete your profile" step shown after sign-in until the customer has
 * picked their country. `?return_to=checkout` sends them back to checkout
 * afterwards; a malformed value is ignored.
 */
export default class CustomersAccountWelcomeCreateController {
  async handle({ inertia, request }: HttpContext) {
    const [, query] = await customersAccountWelcomeQueryValidator.tryValidate(request.qs())
    return inertia.render('customers/account/welcome', { returnTo: query?.return_to ?? 'account' })
  }
}

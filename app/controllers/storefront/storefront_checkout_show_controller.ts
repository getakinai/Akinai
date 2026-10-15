import type { HttpContext } from '@adonisjs/core/http'
import { checkoutShowQueryValidator } from '#validators/checkout_show_query_validator'

export default class StorefrontCheckoutShowController {
  async handle({ inertia, params, request }: HttpContext) {
    const query = await checkoutShowQueryValidator.validate(request.qs())
    return inertia.render('checkout/show', {
      id: params.id,
      paymentFailed: query.payment === 'failed',
    })
  }
}

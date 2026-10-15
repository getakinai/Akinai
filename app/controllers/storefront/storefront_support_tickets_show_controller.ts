import type { HttpContext } from '@adonisjs/core/http'
import { errors as lucidErrors } from '@adonisjs/lucid'
import { storefrontSupportTicketTokenValidator } from '#validators/storefront_support_ticket_token_validator'

export default class StorefrontSupportTicketsShowController {
  async handle({ inertia, params, response }: HttpContext) {
    const [error, payload] = await storefrontSupportTicketTokenValidator.tryValidate({
      token: params.token,
    })
    if (error) throw new lucidErrors.E_ROW_NOT_FOUND()

    response.header('Referrer-Policy', 'no-referrer')
    response.header('Cache-Control', 'no-store')
    return inertia.render('support/tickets/show', { token: payload.token })
  }
}

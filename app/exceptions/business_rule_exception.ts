import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * A request that is valid but not allowed in the record's current state
 * (e.g. refunding more than was paid). Rendered as `422 { errors: [{ message }] }`.
 */
export default class BusinessRuleException extends Exception {
  constructor(message: string, status = 422) {
    super(message, { status, code: 'E_BUSINESS_RULE' })
  }

  async handle(error: this, ctx: HttpContext) {
    return ctx.response.status(error.status).send({ errors: [{ message: error.message }] })
  }
}

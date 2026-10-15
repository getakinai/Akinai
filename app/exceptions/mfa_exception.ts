import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * A staff MFA step that can't go ahead. Code problems are reported on the
 * `code` field (or `password`) so the form shows them under the input.
 */
export default class MfaException extends Exception {
  constructor(
    message: string,
    status: number,
    private readonly field: string | null = 'code'
  ) {
    super(message, { status, code: 'E_MFA' })
  }

  static invalidCode() {
    return new MfaException('That code is incorrect', 422)
  }

  static invalidPassword() {
    return new MfaException('Your password is incorrect', 422, 'password')
  }

  static loginExpired() {
    return new MfaException('Your sign-in has expired. Enter your password again.', 410, null)
  }

  static setupExpired() {
    return new MfaException('Setup has expired. Start again.', 410, null)
  }

  static alreadyEnabled() {
    return new MfaException('2FA is already on', 409, null)
  }

  static notEnabled() {
    return new MfaException('2FA is not on', 409, null)
  }

  static blocked(message: string) {
    return new MfaException(message, 429, null)
  }

  async handle(error: this, ctx: HttpContext) {
    const body = error.field
      ? { errors: [{ field: error.field, message: error.message, rule: 'mfa' }] }
      : { error: error.message }
    return ctx.response.status(error.status).send(body)
  }
}

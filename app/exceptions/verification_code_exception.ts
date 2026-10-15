import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * A one-time code that can't be used (wrong, expired, locked, or a resend
 * asked for too soon). Code problems are reported on the `code` field so
 * the form shows them under the input.
 */
export default class VerificationCodeException extends Exception {
  constructor(
    message: string,
    status: number,
    private readonly field: string | null = 'code'
  ) {
    super(message, { status, code: 'E_VERIFICATION_CODE' })
  }

  static invalid() {
    return new VerificationCodeException('That code is incorrect', 422)
  }

  static expired() {
    return new VerificationCodeException('This code has expired. Request a new one.', 422)
  }

  static locked() {
    return new VerificationCodeException('Too many wrong attempts. Request a new code.', 422)
  }

  static missing() {
    return new VerificationCodeException(
      'Your verification session has ended. Please start again.',
      410,
      null
    )
  }

  static tooSoon(seconds: number) {
    return new VerificationCodeException(
      `Please wait ${seconds} seconds before requesting a new code.`,
      429,
      null
    )
  }

  async handle(error: this, ctx: HttpContext) {
    const body = error.field
      ? { errors: [{ field: error.field, message: error.message, rule: 'verification_code' }] }
      : { error: error.message }
    return ctx.response.status(error.status).send(body)
  }
}

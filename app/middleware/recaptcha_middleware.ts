import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import RecaptchaService from '#services/recaptcha_service'
import type { RecaptchaAction } from '#utils/verify_recaptcha'
import { recaptchaTokenValidator } from '#validators/recaptcha_token_validator'

export const RECAPTCHA_TOKEN_HEADER = 'x-recaptcha-token'

const FAILED_MESSAGE = 'We could not verify you are human. Please try again.'

/**
 * Verifies the reCAPTCHA v3 token sent in the `X-Recaptcha-Token` header
 * before the route runs: `.use(middleware.recaptcha({ action: 'checkout' }))`.
 * Does nothing while `RECAPTCHA_ENABLED` is off.
 */
@inject()
export default class RecaptchaMiddleware {
  constructor(protected recaptchaService: RecaptchaService) {}

  async handle(ctx: HttpContext, next: NextFn, options: { action: RecaptchaAction }) {
    if (!this.recaptchaService.isEnabled()) return next()

    const [error, payload] = await recaptchaTokenValidator.tryValidate({
      token: ctx.request.header(RECAPTCHA_TOKEN_HEADER),
    })
    if (error) return ctx.response.badRequest({ error: FAILED_MESSAGE })

    const passed = await this.recaptchaService.verify(
      payload.token,
      options.action,
      ctx.request.ip()
    )
    if (!passed) return ctx.response.badRequest({ error: FAILED_MESSAGE })

    return next()
  }
}

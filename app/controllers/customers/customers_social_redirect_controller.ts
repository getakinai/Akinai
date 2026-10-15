import type { HttpContext } from '@adonisjs/core/http'
import { SOCIAL_INTENT_SESSION_KEY } from '#constants/social_providers'
import { customerSocialRedirectValidator } from '#validators/customer_social_redirect_validator'

export default class CustomersSocialRedirectController {
  /**
   * Sends the browser to Google/Microsoft. This is a full-page redirect,
   * not JSON, because OAuth needs a top-level navigation. The intent
   * (sign in or create account) waits in the session for the callback.
   *
   * The intent is a path segment, not a query string: redirects forward
   * the request query (`forwardQueryString`), which would be appended to
   * the provider URL and corrupt the OAuth `state`.
   */
  async handle({ request, ally, session }: HttpContext) {
    const { params } = await request.validateUsing(customerSocialRedirectValidator)
    session.put(SOCIAL_INTENT_SESSION_KEY, params.intent)
    return ally.use(params.provider).redirect()
  }
}

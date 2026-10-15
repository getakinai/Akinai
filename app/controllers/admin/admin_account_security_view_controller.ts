import type { HttpContext } from '@adonisjs/core/http'
import UserMfaTransformer from '#transformers/user_mfa_transformer'

export default class AdminAccountSecurityViewController {
  async handle(ctx: HttpContext) {
    const user = ctx.auth.use('web').getUserOrFail()
    return ctx.serialize(UserMfaTransformer.transform(user))
  }
}

import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import UserMfaService from '#services/user_mfa_service'
import UserMfaTransformer from '#transformers/user_mfa_transformer'
import { adminAccountMfaDeleteValidator } from '#validators/admin_account_mfa_delete_validator'
import { USER_SESSION_VERSION_KEY } from '#constants/user_mfa'

/**
 * Turns MFA off. Other sessions are signed out; this one is kept by
 * storing the new `sessionVersion`.
 */
@inject()
export default class AdminAccountMfaDeleteController {
  constructor(protected userMfaService: UserMfaService) {}

  async handle(ctx: HttpContext) {
    const { auth, request, session } = ctx
    const { password, code } = await request.validateUsing(adminAccountMfaDeleteValidator)
    const user = auth.use('web').getUserOrFail()

    const updated = await this.userMfaService.disable(user, password, code, request.ip())
    session.put(USER_SESSION_VERSION_KEY, updated.sessionVersion)
    return ctx.serialize(UserMfaTransformer.transform(updated))
  }
}

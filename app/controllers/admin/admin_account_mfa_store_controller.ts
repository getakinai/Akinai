import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import UserMfaService from '#services/user_mfa_service'
import { adminAccountMfaStoreValidator } from '#validators/admin_account_mfa_store_validator'
import { MFA_PENDING_SETUP_SESSION_KEY } from '#constants/user_mfa'

/**
 * Confirms MFA setup with a code from the app and returns the recovery
 * codes, which are shown once.
 */
@inject()
export default class AdminAccountMfaStoreController {
  constructor(protected userMfaService: UserMfaService) {}

  async handle({ auth, request, session, response }: HttpContext) {
    const { code } = await request.validateUsing(adminAccountMfaStoreValidator)
    const user = auth.use('web').getUserOrFail()

    const recoveryCodes = await this.userMfaService.confirmSetup(
      user,
      session.get(MFA_PENDING_SETUP_SESSION_KEY),
      code,
      request.ip()
    )
    session.forget(MFA_PENDING_SETUP_SESSION_KEY)
    return response.ok({ data: { recoveryCodes } })
  }
}

import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import UserMfaService from '#services/user_mfa_service'
import { MFA_PENDING_SETUP_SESSION_KEY } from '#constants/user_mfa'

/**
 * Starts MFA setup: a new secret is kept (encrypted) in the session until
 * the User confirms a code from their app. Nothing is saved yet.
 */
@inject()
export default class AdminAccountMfaSetupStoreController {
  constructor(protected userMfaService: UserMfaService) {}

  async handle({ auth, session, response }: HttpContext) {
    const user = auth.use('web').getUserOrFail()
    const setup = await this.userMfaService.beginSetup(user)
    session.put(MFA_PENDING_SETUP_SESSION_KEY, setup.encryptedSecret)
    return response.ok({
      data: {
        secret: setup.secret,
        otpauthUri: setup.otpauthUri,
        qrCodeDataUrl: setup.qrCodeDataUrl,
      },
    })
  }
}

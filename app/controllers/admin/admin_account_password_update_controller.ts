import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import UserService from '#services/user_service'
import { adminAccountPasswordUpdateValidator } from '#validators/admin_account_password_update_validator'
import { USER_SESSION_VERSION_KEY } from '#constants/user_mfa'

/**
 * Changes the signed-in User's own password. Other sessions are signed
 * out; this one is kept by storing the new `sessionVersion`.
 */
@inject()
export default class AdminAccountPasswordUpdateController {
  constructor(protected userService: UserService) {}

  async handle({ auth, request, session, response }: HttpContext) {
    const { currentPassword, password } = await request.validateUsing(
      adminAccountPasswordUpdateValidator
    )
    const user = auth.use('web').getUserOrFail()

    const updated = await this.userService.changePassword(
      user,
      currentPassword,
      password,
      request.ip()
    )
    session.regenerate()
    session.put(USER_SESSION_VERSION_KEY, updated.sessionVersion)
    return response.ok({ data: { message: 'Your password has been changed' } })
  }
}

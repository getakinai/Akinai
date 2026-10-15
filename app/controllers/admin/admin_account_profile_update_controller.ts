import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import UserService from '#services/user_service'
import UserTransformer from '#transformers/user_transformer'
import { adminAccountProfileUpdateValidator } from '#validators/admin_account_profile_update_validator'

/**
 * Updates the signed-in User's own name and email.
 */
@inject()
export default class AdminAccountProfileUpdateController {
  constructor(protected userService: UserService) {}

  async handle(ctx: HttpContext) {
    const user = ctx.auth.use('web').getUserOrFail()
    const payload = await ctx.request.validateUsing(adminAccountProfileUpdateValidator, {
      meta: { userId: user.id },
    })
    const updated = await this.userService.updateOwnProfile(user, payload)
    return ctx.serialize(UserTransformer.transform(updated).useVariant('toMe'))
  }
}

import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import UserService from '#services/user_service'
import UserTransformer from '#transformers/user_transformer'
import { adminUserStoreValidator } from '#validators/admin_user_store_validator'

@inject()
export default class AdminUsersStoreController {
  constructor(protected userService: UserService) {}

  async handle(ctx: HttpContext) {
    const { fullName, email, password } = await ctx.request.validateUsing(adminUserStoreValidator)
    const user = await this.userService.create({ fullName, email, password })

    ctx.response.status(201)
    return ctx.serialize(UserTransformer.transform(user))
  }
}

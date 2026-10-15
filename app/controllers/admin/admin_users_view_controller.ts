import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import UserService from '#services/user_service'
import UserTransformer from '#transformers/user_transformer'

@inject()
export default class AdminUsersViewController {
  constructor(protected userService: UserService) {}

  async handle(ctx: HttpContext) {
    const user = await this.userService.findDetail(ctx.params.id)
    return ctx.serialize(UserTransformer.transform(user))
  }
}

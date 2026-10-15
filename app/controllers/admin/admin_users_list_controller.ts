import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import UserService from '#services/user_service'
import UserTransformer from '#transformers/user_transformer'
import { adminUsersListQueryValidator } from '#validators/admin_users_list_query_validator'

@inject()
export default class AdminUsersListController {
  constructor(protected userService: UserService) {}

  async handle(ctx: HttpContext) {
    const { q, status, roleId, sort, direction, page, perPage } = await ctx.request.validateUsing(
      adminUsersListQueryValidator,
      { data: ctx.request.qs() }
    )
    const users = await this.userService.paginate({
      q,
      status,
      roleId,
      sort,
      direction,
      page,
      perPage,
    })

    return ctx.serialize(UserTransformer.paginate(users.all(), users.getMeta()))
  }
}

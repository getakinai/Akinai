import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import UserPolicy from '#policies/user_policy'
import RoleService from '#services/role_service'
import UserService from '#services/user_service'
import UserTransformer from '#transformers/user_transformer'
import { adminUserUpdateValidator } from '#validators/admin_user_update_validator'

@inject()
export default class AdminUsersUpdateController {
  constructor(
    protected userService: UserService,
    protected roleService: RoleService
  ) {}

  async handle(ctx: HttpContext) {
    const user = await this.userService.findDetail(ctx.params.id)
    const { fullName, email, status, roleId } = await ctx.request.validateUsing(
      adminUserUpdateValidator,
      { meta: { userId: user.id } }
    )
    const role = await this.roleService.findOrFail(roleId)
    await ctx.bouncer.with(UserPolicy).authorize('update', user, { role, status })

    const updated = await this.userService.update(user, { fullName, email, status, roleId })

    return ctx.serialize(UserTransformer.transform(updated))
  }
}

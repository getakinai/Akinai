import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import RolePolicy from '#policies/role_policy'
import RoleService from '#services/role_service'
import RoleTransformer from '#transformers/role_transformer'
import { adminRoleUpdateValidator } from '#validators/admin_role_update_validator'

@inject()
export default class AdminRolesUpdateController {
  constructor(protected roleService: RoleService) {}

  async handle(ctx: HttpContext) {
    const role = await this.roleService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(RolePolicy).authorize('update', role)

    const { name, description } = await ctx.request.validateUsing(adminRoleUpdateValidator, {
      meta: { roleId: role.id },
    })
    const updated = await this.roleService.update(role, { name, description })

    return ctx.serialize(RoleTransformer.transform(updated))
  }
}

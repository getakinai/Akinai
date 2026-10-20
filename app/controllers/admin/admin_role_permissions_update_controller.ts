import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import RolePolicy from '#policies/role_policy'
import RoleService from '#services/role_service'
import RoleTransformer from '#transformers/role_transformer'
import { adminRolePermissionUpdateValidator } from '#validators/admin_role_permission_update_validator'

@inject()
export default class AdminRolePermissionsUpdateController {
  constructor(protected roleService: RoleService) {}

  async handle(ctx: HttpContext) {
    const role = await this.roleService.findOrFail(ctx.params.id)
    const { permission, granted } = await ctx.request.validateUsing(
      adminRolePermissionUpdateValidator
    )
    await ctx.bouncer.with(RolePolicy).authorize('editPermissions', role, { permission, granted })

    const updated = await this.roleService.setPermission(role, permission, granted)

    return ctx.serialize(RoleTransformer.transform(updated))
  }
}

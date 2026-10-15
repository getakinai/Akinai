import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import RolePolicy from '#policies/role_policy'
import RoleService from '#services/role_service'

@inject()
export default class AdminRolesDeleteController {
  constructor(protected roleService: RoleService) {}

  async handle(ctx: HttpContext) {
    const role = await this.roleService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(RolePolicy).authorize('delete', role)

    await this.roleService.delete(role)

    return ctx.response.noContent()
  }
}

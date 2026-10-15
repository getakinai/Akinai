import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import RoleService from '#services/role_service'
import RoleTransformer from '#transformers/role_transformer'

@inject()
export default class AdminUsersRolesController {
  constructor(protected roleService: RoleService) {}

  async handle(ctx: HttpContext) {
    const roles = await this.roleService.options()
    return ctx.serialize(RoleTransformer.transform(roles).useVariant('toOption'))
  }
}

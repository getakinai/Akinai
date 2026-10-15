import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import RolePolicy from '#policies/role_policy'
import RoleService from '#services/role_service'
import RoleTransformer from '#transformers/role_transformer'
import { adminRoleStoreValidator } from '#validators/admin_role_store_validator'

@inject()
export default class AdminRolesStoreController {
  constructor(protected roleService: RoleService) {}

  async handle(ctx: HttpContext) {
    await ctx.bouncer.with(RolePolicy).authorize('create')

    const { name, description } = await ctx.request.validateUsing(adminRoleStoreValidator)
    const role = await this.roleService.create({ name, description })

    ctx.response.status(201)
    return ctx.serialize(RoleTransformer.transform(role))
  }
}

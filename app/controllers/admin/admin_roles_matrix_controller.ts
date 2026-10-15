import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { PERMISSION_ACTIONS, PERMISSION_SECTIONS } from '#abilities/permissions'
import RoleService from '#services/role_service'
import RoleTransformer from '#transformers/role_transformer'

@inject()
export default class AdminRolesMatrixController {
  constructor(protected roleService: RoleService) {}

  async handle(ctx: HttpContext) {
    const roles = await this.roleService.all()

    return ctx.serialize({
      actions: [...PERMISSION_ACTIONS],
      sections: PERMISSION_SECTIONS.map((section) => ({
        key: section.key,
        label: section.label,
        resources: section.resources.map((resource) => ({
          key: resource.key,
          label: resource.label,
          description: resource.description,
          actions: [...resource.actions] as string[],
        })),
      })),
      roles: RoleTransformer.transform(roles),
    })
  }
}

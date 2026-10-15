import { inject } from '@adonisjs/core'
import { AuthorizationResponse, BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'
import type Role from '#models/role'
import type User from '#models/user'
import RoleService from '#services/role_service'

@inject()
export default class RolePolicy extends BasePolicy {
  constructor(protected roleService: RoleService) {
    super()
  }

  view(user: User): AuthorizerResponse {
    return user.hasPermission('roles.view')
  }

  create(user: User): AuthorizerResponse {
    return user.hasPermission('roles.create')
  }

  update(user: User, role: Role): AuthorizerResponse {
    if (!user.hasPermission('roles.edit')) {
      return false
    }
    if (role.isLocked) {
      return AuthorizationResponse.deny('The admin role cannot be changed', 422)
    }
    return true
  }

  editPermissions(user: User, role: Role): AuthorizerResponse {
    if (!user.hasPermission('roles.edit')) {
      return false
    }
    if (role.isLocked) {
      return AuthorizationResponse.deny('The admin role always has every permission', 422)
    }
    return true
  }

  async delete(user: User, role: Role): Promise<AuthorizerResponse> {
    if (!user.hasPermission('roles.archive')) {
      return false
    }
    if (role.isLocked) {
      return AuthorizationResponse.deny('The admin role cannot be deleted', 422)
    }
    if (role.isDefault) {
      return AuthorizationResponse.deny('The default role cannot be deleted', 422)
    }
    if ((await this.roleService.countUsers(role)) > 0) {
      return AuthorizationResponse.deny(
        'Move the users assigned to this role before deleting it',
        422
      )
    }
    return true
  }
}

import { AuthorizationResponse, BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'
import type Role from '#models/role'
import type User from '#models/user'
import type { UserStatus } from '#models/user'

/**
 * Expects `role` to be preloaded on both the signed-in User and the target.
 * Only admins (locked role) can edit admins or hand out the admin role, and
 * nobody can change their own role or status.
 */
export default class UserPolicy extends BasePolicy {
  update(
    user: User,
    target: User,
    changes: { role: Role; status: UserStatus }
  ): AuthorizerResponse {
    if (!user.hasPermission('users.edit')) {
      return false
    }

    const isAdmin = user.role?.isLocked ?? false
    if (target.role?.isLocked && !isAdmin) {
      return AuthorizationResponse.deny('Only admins can edit an admin account', 422)
    }
    if (changes.role.isLocked && !isAdmin) {
      return AuthorizationResponse.deny('Only admins can assign the admin role', 422)
    }
    if (target.id === user.id && changes.role.id !== target.roleId) {
      return AuthorizationResponse.deny("You can't change your own role", 422)
    }
    if (target.id === user.id && changes.status !== target.status) {
      return AuthorizationResponse.deny("You can't change your own status", 422)
    }
    return true
  }
}

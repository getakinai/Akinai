import { AuthorizationResponse, BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'
import { isAdminOnlyPermission } from '#abilities/permissions'
import type Role from '#models/role'
import type User from '#models/user'
import type { UserStatus } from '#models/user'

/**
 * Expects `role` to be preloaded on both the signed-in User and the target,
 * and `permissions` preloaded on `changes.role` (unlocked `permissionKeys`
 * is empty otherwise). Only admins (locked role) can edit admins, hand out
 * the admin role, or assign a role carrying `users.*`, `roles.*` or
 * `themes.*`. Nobody can change their own role or status, and a non-admin
 * cannot assign a role that holds a permission they lack.
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
    if (changes.role.id !== target.roleId && !isAdmin) {
      const permissions = changes.role.permissionKeys
      if (permissions.some((permission) => isAdminOnlyPermission(permission))) {
        return AuthorizationResponse.deny(
          'Only admins can assign a role with user, role, or theme permissions',
          422
        )
      }
      if (permissions.some((permission) => !user.hasPermission(permission))) {
        return AuthorizationResponse.deny(
          "You can't assign a role with permissions you don't have",
          422
        )
      }
    }
    return true
  }
}

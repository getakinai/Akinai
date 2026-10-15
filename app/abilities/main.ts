/*
|--------------------------------------------------------------------------
| Bouncer abilities
|--------------------------------------------------------------------------
|
| Pre-registered abilities can be referenced as a string by their name.
|
*/

import type User from '#models/user'
import { Bouncer } from '@adonisjs/bouncer'
import type { Permission } from '#abilities/permissions'

/**
 * Checks a catalog permission against the User's role. The role and its
 * permissions are preloaded by InitializeBouncerMiddleware.
 */
export const hasPermission = Bouncer.ability((user: User, permission: Permission) => {
  return user.hasPermission(permission)
})

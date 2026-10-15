import app from '@adonisjs/core/services/app'
import type { Permission } from '#abilities/permissions'
import type User from '#models/user'
import RoleService from '#services/role_service'
import UserService from '#services/user_service'

let sequence = 0

/**
 * Creates a staff User. Pass `'admin'` for the locked role that holds every
 * permission, or a list of permissions for a custom role.
 */
export async function createAdminUser(permissions: Permission[] | 'admin'): Promise<User> {
  const roleService = await app.container.make(RoleService)
  const userService = await app.container.make(UserService)
  sequence++

  const role =
    permissions === 'admin'
      ? await roleService.ensure(
          {
            slug: 'admin',
            name: 'Admin',
            description: 'Full access',
            isLocked: true,
            sortOrder: 0,
          },
          []
        )
      : await roleService.create({ name: `Test role ${sequence}`, description: null })

  if (permissions !== 'admin') {
    await roleService.syncPermissions(role, permissions)
  }

  return userService.create({
    fullName: `Admin ${sequence}`,
    email: `admin-${sequence}-${Date.now()}@example.com`,
    password: 'password123',
    roleId: role.id,
  })
}

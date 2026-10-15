import { column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import BaseAppModel from '#models/base/base_app_model'
import RolePermission from '#models/role_permission'
import User from '#models/user'
import { PERMISSIONS, type Permission } from '#abilities/permissions'

/**
 * Back-office role. A locked role (admin) implicitly holds every permission
 * and the default role is assigned to new Users.
 */
export default class Role extends BaseAppModel {
  @column()
  declare name: string

  @column()
  declare slug: string

  @column()
  declare description: string | null

  @column()
  declare isLocked: boolean

  @column()
  declare isDefault: boolean

  @column()
  declare sortOrder: number

  @hasMany(() => RolePermission)
  declare permissions: HasMany<typeof RolePermission>

  @hasMany(() => User)
  declare users: HasMany<typeof User>

  /**
   * Requires the `permissions` relation to be preloaded for unlocked roles.
   */
  get permissionKeys(): Permission[] {
    if (this.isLocked) {
      return [...PERMISSIONS]
    }
    const granted = new Set((this.permissions ?? []).map(({ permission }) => permission))
    return PERMISSIONS.filter((permission) => granted.has(permission))
  }
}

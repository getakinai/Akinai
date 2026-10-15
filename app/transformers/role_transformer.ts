import type Role from '#models/role'
import { BaseTransformer } from '@adonisjs/core/transformers'

/**
 * Expects `permissions` to be preloaded. `userCount` reads the `users_count`
 * extra from `withCount('users')` and falls back to null when absent.
 */
export default class RoleTransformer extends BaseTransformer<Role> {
  toObject() {
    const usersCount = this.resource.$extras.users_count

    return {
      ...this.pick(this.resource, [
        'id',
        'name',
        'slug',
        'description',
        'isLocked',
        'isDefault',
        'sortOrder',
        'createdAt',
        'updatedAt',
      ]),
      permissions: this.resource.permissionKeys as string[],
      userCount: usersCount === undefined ? null : Number(usersCount),
    }
  }

  /**
   * Picker shape; does not need `permissions` preloaded.
   */
  toOption() {
    return this.pick(this.resource, ['id', 'name', 'slug', 'isLocked', 'isDefault'])
  }
}
